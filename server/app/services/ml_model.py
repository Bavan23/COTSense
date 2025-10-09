"""
ML Model Service for FAISS-based component recommendations.
Handles loading and querying of pre-trained embeddings and FAISS index.
"""

import json
import time
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
import pyarrow.parquet as pq
import structlog

from ..config import settings

logger = structlog.get_logger(__name__)


class MLModelService:
    """
    Service for ML-based component recommendations using FAISS similarity search.
    
    This service loads pre-trained embeddings, FAISS index, and component metadata
    to provide fast similarity-based component recommendations.
    """
    
    def __init__(self):
        self.faiss_index: Optional[faiss.Index] = None
        self.embeddings: Optional[np.ndarray] = None
        self.components_df: Optional[pd.DataFrame] = None
        self.parquet_file: Optional[pq.ParquetFile] = None
        self.row_group_offsets: Optional[List[int]] = None
        self.available_columns: Optional[List[str]] = None
        self.metadata_columns: Optional[List[str]] = None
        self.model_config: Optional[Dict[str, Any]] = None
        self.sentence_transformer: Optional[SentenceTransformer] = None
        self.is_loaded = False
        
    async def load_models(self) -> None:
        """
        Load all ML artifacts: FAISS index, embeddings, component data, and transformer model.
        
        Raises:
            FileNotFoundError: If required files are missing
            Exception: If model loading fails
        """
        try:
            start_time = time.time()
            logger.info("Loading ML models and data...")
            
            # Check if all required files exist first
            required_files = [
                settings.faiss_index_path,
                settings.embeddings_path,
                settings.components_data_path
            ]
            
            missing_files = []
            for file_path in required_files:
                if not file_path.exists():
                    missing_files.append(str(file_path))
            
            if missing_files:
                error_msg = f"Required ML files not found: {', '.join(missing_files)}"
                logger.error("ML files missing", missing_files=missing_files)
                raise FileNotFoundError(error_msg)
            
            # Load FAISS index
            logger.info("Loading FAISS index", path=str(settings.faiss_index_path))
            self.faiss_index = faiss.read_index(str(settings.faiss_index_path))
            logger.info("FAISS index loaded", 
                       total_vectors=self.faiss_index.ntotal,
                       dimension=self.faiss_index.d)
            
            # Load embeddings (memory map to reduce RAM usage)
            logger.info("Loading component embeddings", path=str(settings.embeddings_path))
            self.embeddings = np.load(str(settings.embeddings_path), mmap_mode='r')
            logger.info("Embeddings loaded", 
                       shape=self.embeddings.shape,
                       dtype=self.embeddings.dtype)
            
            # Lazily open component metadata parquet (do not load entire file into memory)
            logger.info("Opening component metadata (lazy)", path=str(settings.components_data_path))
            self.parquet_file = pq.ParquetFile(str(settings.components_data_path))
            # Precompute row group start offsets for index lookup
            offsets: List[int] = []
            cum = 0
            for i in range(self.parquet_file.num_row_groups):
                offsets.append(cum)
                rg_rows = self.parquet_file.metadata.row_group(i).num_rows
                cum += rg_rows
            self.row_group_offsets = offsets
            # Determine available columns and pick a lean subset for responses
            self.available_columns = list(self.parquet_file.schema.names)
            default_cols = [
                "part_number",
                "manufacturer",
                "category",
                "description",
                "price",
                "stock",
                "spec_match",
                "total_score",
            ]
            self.metadata_columns = [c for c in default_cols if c in self.available_columns]
            total_components = self.parquet_file.metadata.num_rows
            logger.info(
                "Component metadata parquet opened",
                total_components=total_components,
                selected_columns=self.metadata_columns,
            )
            
            # Load model configuration if available
            if settings.model_config_path.exists():
                logger.info("Loading model configuration", path=str(settings.model_config_path))
                with open(settings.model_config_path, 'r') as f:
                    self.model_config = json.load(f)
                logger.info("Model configuration loaded", config=self.model_config)
            
            # Load sentence transformer for query encoding
            model_name = self.model_config.get('model_name', 'all-MiniLM-L6-v2') if self.model_config else 'all-MiniLM-L6-v2'
            logger.info("Loading sentence transformer", model_name=model_name)
            self.sentence_transformer = SentenceTransformer(model_name)
            
            # Validate data consistency
            self._validate_data_consistency()
            
            self.is_loaded = True
            load_time = time.time() - start_time
            logger.info("ML models loaded successfully", load_time_seconds=round(load_time, 2))
            
        except Exception as e:
            logger.error("Failed to load ML models", error=str(e))
            self.is_loaded = False
            raise
    
    def _validate_data_consistency(self) -> None:
        """Validate that all loaded data is consistent."""
        if self.faiss_index is None or self.embeddings is None or (
            self.components_df is None and self.parquet_file is None
        ):
            raise ValueError("Not all required data is loaded")
        
        # Check dimensions match
        if self.faiss_index.d != self.embeddings.shape[1]:
            raise ValueError(
                f"FAISS index dimension ({self.faiss_index.d}) != embeddings dimension ({self.embeddings.shape[1]})"
            )
        
        # Check number of vectors match
        if self.faiss_index.ntotal != self.embeddings.shape[0]:
            raise ValueError(
                f"FAISS index vectors ({self.faiss_index.ntotal}) != embeddings count ({self.embeddings.shape[0]})"
            )
        
        parquet_rows = (
            len(self.components_df)
            if self.components_df is not None
            else (self.parquet_file.metadata.num_rows if self.parquet_file is not None else 0)
        )
        if parquet_rows != self.embeddings.shape[0]:
            raise ValueError(
                f"Component count ({parquet_rows}) != embeddings count ({self.embeddings.shape[0]})"
            )
        
        logger.info("Data consistency validation passed")

    def _row_group_for_index(self, row_index: int) -> int:
        """Return row group index for a global row index using precomputed offsets."""
        assert self.row_group_offsets is not None
        # Linear scan is fine for small number of groups; can optimize with bisect if needed
        for i, start in enumerate(self.row_group_offsets):
            next_start = (
                self.row_group_offsets[i + 1] if i + 1 < len(self.row_group_offsets) else 10**18
            )
            if start <= row_index < next_start:
                return i
        raise IndexError(f"Row index {row_index} out of bounds")
    
    async def encode_query(self, query: str) -> np.ndarray:
        """
        Encode a text query into an embedding vector.
        
        Args:
            query: Text query to encode
            
        Returns:
            Embedding vector as numpy array
            
        Raises:
            ValueError: If models are not loaded
        """
        if not self.is_loaded or self.sentence_transformer is None:
            raise ValueError("ML models not loaded. Call load_models() first.")
        
        try:
            # Encode query to embedding
            embedding = self.sentence_transformer.encode([query])
            return embedding[0].astype(np.float32)
            
        except Exception as e:
            logger.error("Failed to encode query", query=query, error=str(e))
            raise
    
    async def search_similar_components(
        self, 
        query_embedding: np.ndarray, 
        top_k: int = 10
    ) -> Tuple[List[int], List[float]]:
        """
        Search for similar components using FAISS index.
        
        Args:
            query_embedding: Query embedding vector
            top_k: Number of similar components to return
            
        Returns:
            Tuple of (component_indices, similarity_scores)
            
        Raises:
            ValueError: If models are not loaded
        """
        if not self.is_loaded or self.faiss_index is None:
            raise ValueError("ML models not loaded. Call load_models() first.")
        
        try:
            # Ensure query embedding is the right shape and type
            query_embedding = query_embedding.reshape(1, -1).astype(np.float32)
            
            # Search FAISS index
            similarities, indices = self.faiss_index.search(query_embedding, top_k)
            
            # Convert to lists and handle any invalid indices
            indices_list = indices[0].tolist()
            similarities_list = similarities[0].tolist()
            
            # Filter out any invalid indices (-1 indicates no match found)
            valid_results = [(idx, sim) for idx, sim in zip(indices_list, similarities_list) if idx >= 0]
            
            if valid_results:
                indices_list, similarities_list = zip(*valid_results)
                return list(indices_list), list(similarities_list)
            else:
                return [], []
                
        except Exception as e:
            logger.error("Failed to search similar components", error=str(e))
            raise
    
    async def get_component_metadata(self, indices: List[int]) -> pd.DataFrame:
        """
        Get component metadata for given indices.
        
        Args:
            indices: List of component indices
            
        Returns:
            DataFrame with the requested rows, ordered to match the input indices.
        """
        if not self.is_loaded:
            raise ValueError("ML models not loaded. Call load_models() first.")
        try:
            # If full DataFrame is available (e.g., smaller dataset), use it
            if self.components_df is not None:
                return self.components_df.iloc[indices].copy()
            
            # Lazy load only required rows from Parquet by row-group
            assert self.parquet_file is not None
            cols = self.metadata_columns or list(self.parquet_file.schema.names)
            # Group indices by row group
            grouped: Dict[int, List[int]] = {}
            for idx in indices:
                rg = self._row_group_for_index(idx)
                grouped.setdefault(rg, []).append(idx)
            
            parts: List[pd.DataFrame] = []
            for rg, idxs in grouped.items():
                start = self.row_group_offsets[rg] if self.row_group_offsets else 0
                local_rows = [i - start for i in idxs]
                table = self.parquet_file.read_row_group(rg, columns=cols)
                df_rg = table.to_pandas()
                # Select only needed rows from this row-group
                df_sel = df_rg.iloc[local_rows]
                # Assign original global indices to preserve order later
                df_sel.index = idxs
                parts.append(df_sel)
            
            if not parts:
                return pd.DataFrame(columns=cols)
            out_df = pd.concat(parts).loc[indices]
            return out_df
        except Exception as e:
            logger.error("Failed to get component metadata", indices=indices, error=str(e))
            raise
    
    async def recommend_components(
        self,
        query: str, 
        top_k: int = 10
    ) -> Tuple[pd.DataFrame, List[float], float]:
        """
        End-to-end component recommendation pipeline.
        
        Args:
            query: Text query for component search
            top_k: Number of recommendations to return
            
        Returns:
            Tuple of (components_df, similarity_scores, processing_time_ms)
            
        Raises:
            ValueError: If models are not loaded or invalid parameters
        """
        if not self.is_loaded:
            raise ValueError("ML models not loaded. Call load_models() first.")
        
        if top_k <= 0 or top_k > settings.max_top_k:
            raise ValueError(f"top_k must be between 1 and {settings.max_top_k}")
        
        start_time = time.time()
        
        try:
            # Step 1: Encode query
            query_embedding = await self.encode_query(query)
            
            # Step 2: Search similar components
            indices, similarities = await self.search_similar_components(query_embedding, top_k)
            
            if not indices:
                # Return empty results
                empty_df = pd.DataFrame()
                return empty_df, [], 0.0
            
            # Step 3: Get component metadata
            components_df = await self.get_component_metadata(indices)
            
            # Step 4: Add similarity scores to dataframe
            components_df = components_df.copy()
            components_df['similarity_score'] = similarities
            
            # Step 5: Calculate processing time
            processing_time_ms = (time.time() - start_time) * 1000
            
            logger.info("Component recommendation completed",
                       query=query,
                       results_count=len(components_df),
                       processing_time_ms=round(processing_time_ms, 2))
            
            return components_df, similarities, processing_time_ms
            
        except Exception as e:
            logger.error("Failed to recommend components", query=query, error=str(e))
            raise
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about loaded models.
        
        Returns:
            Dictionary with model information
        """
        if not self.is_loaded:
            return {"loaded": False}
        
        return {
            "loaded": True,
            "faiss_index": {
                "total_vectors": self.faiss_index.ntotal if self.faiss_index else 0,
                "dimension": self.faiss_index.d if self.faiss_index else 0,
            },
            "embeddings_shape": self.embeddings.shape if self.embeddings is not None else None,
            "components_count": (
                len(self.components_df)
                if self.components_df is not None
                else (self.parquet_file.metadata.num_rows if self.parquet_file is not None else 0)
            ),
            "model_config": self.model_config,
        }


# Global ML service instance
ml_service = MLModelService()