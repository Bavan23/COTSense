"""
Embedding service for text processing and similarity calculations.
Provides utilities for working with embeddings and similarity metrics.
"""

import time
from typing import List, Dict, Any, Optional, Tuple

import numpy as np
from sentence_transformers import SentenceTransformer
import structlog

from ..config import settings

logger = structlog.get_logger(__name__)


class EmbeddingService:
    """
    Service for handling text embeddings and similarity calculations.
    
    This service provides utilities for:
    - Batch encoding of text queries
    - Similarity calculations between embeddings
    - Embedding preprocessing and normalization
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model: Optional[SentenceTransformer] = None
        self.is_loaded = False
    
    async def load_model(self) -> None:
        """Load the sentence transformer model."""
        try:
            logger.info("Loading embedding model", model_name=self.model_name)
            start_time = time.time()
            
            self.model = SentenceTransformer(self.model_name)
            self.is_loaded = True
            
            load_time = time.time() - start_time
            logger.info("Embedding model loaded successfully", 
                       model_name=self.model_name,
                       load_time_seconds=round(load_time, 2))
            
        except Exception as e:
            logger.error("Failed to load embedding model", 
                        model_name=self.model_name, 
                        error=str(e))
            self.is_loaded = False
            raise
    
    async def encode_texts(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """
        Encode a list of texts into embeddings.
        
        Args:
            texts: List of text strings to encode
            batch_size: Batch size for processing
            
        Returns:
            Array of embeddings with shape (len(texts), embedding_dim)
            
        Raises:
            ValueError: If model is not loaded
        """
        if not self.is_loaded or self.model is None:
            raise ValueError("Embedding model not loaded. Call load_model() first.")
        
        if not texts:
            return np.array([])
        
        try:
            logger.info("Encoding texts", count=len(texts), batch_size=batch_size)
            start_time = time.time()
            
            # Encode texts in batches
            embeddings = self.model.encode(
                texts,
                batch_size=batch_size,
                show_progress_bar=len(texts) > 100,
                convert_to_numpy=True
            )
            
            processing_time = time.time() - start_time
            logger.info("Text encoding completed",
                       texts_count=len(texts),
                       embedding_shape=embeddings.shape,
                       processing_time_seconds=round(processing_time, 2))
            
            return embeddings.astype(np.float32)
            
        except Exception as e:
            logger.error("Failed to encode texts", error=str(e))
            raise
    
    async def encode_single_text(self, text: str) -> np.ndarray:
        """
        Encode a single text into an embedding.
        
        Args:
            text: Text string to encode
            
        Returns:
            Embedding vector as numpy array
        """
        embeddings = await self.encode_texts([text])
        return embeddings[0] if len(embeddings) > 0 else np.array([])
    
    @staticmethod
    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """
        Calculate cosine similarity between two vectors.
        
        Args:
            a: First vector
            b: Second vector
            
        Returns:
            Cosine similarity score between -1 and 1
        """
        # Normalize vectors
        a_norm = a / (np.linalg.norm(a) + 1e-8)
        b_norm = b / (np.linalg.norm(b) + 1e-8)
        
        # Calculate cosine similarity
        return float(np.dot(a_norm, b_norm))
    
    @staticmethod
    def euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
        """
        Calculate Euclidean distance between two vectors.
        
        Args:
            a: First vector
            b: Second vector
            
        Returns:
            Euclidean distance
        """
        return float(np.linalg.norm(a - b))
    
    @staticmethod
    def normalize_embeddings(embeddings: np.ndarray) -> np.ndarray:
        """
        Normalize embeddings to unit length.
        
        Args:
            embeddings: Array of embeddings with shape (n, dim)
            
        Returns:
            Normalized embeddings
        """
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms = np.maximum(norms, 1e-8)  # Avoid division by zero
        return embeddings / norms
    
    async def calculate_similarity_matrix(
        self, 
        embeddings_a: np.ndarray, 
        embeddings_b: np.ndarray
    ) -> np.ndarray:
        """
        Calculate similarity matrix between two sets of embeddings.
        
        Args:
            embeddings_a: First set of embeddings (n, dim)
            embeddings_b: Second set of embeddings (m, dim)
            
        Returns:
            Similarity matrix with shape (n, m)
        """
        try:
            # Normalize embeddings
            embeddings_a_norm = self.normalize_embeddings(embeddings_a)
            embeddings_b_norm = self.normalize_embeddings(embeddings_b)
            
            # Calculate cosine similarity matrix
            similarity_matrix = np.dot(embeddings_a_norm, embeddings_b_norm.T)
            
            return similarity_matrix
            
        except Exception as e:
            logger.error("Failed to calculate similarity matrix", error=str(e))
            raise
    
    async def find_most_similar(
        self, 
        query_embedding: np.ndarray, 
        candidate_embeddings: np.ndarray, 
        top_k: int = 10
    ) -> Tuple[List[int], List[float]]:
        """
        Find most similar embeddings to a query embedding.
        
        Args:
            query_embedding: Query embedding vector
            candidate_embeddings: Candidate embeddings matrix (n, dim)
            top_k: Number of most similar embeddings to return
            
        Returns:
            Tuple of (indices, similarity_scores)
        """
        try:
            # Calculate similarities
            query_norm = self.normalize_embeddings(query_embedding.reshape(1, -1))
            candidates_norm = self.normalize_embeddings(candidate_embeddings)
            
            similarities = np.dot(query_norm, candidates_norm.T)[0]
            
            # Get top-k most similar
            top_indices = np.argsort(similarities)[::-1][:top_k]
            top_similarities = similarities[top_indices]
            
            return top_indices.tolist(), top_similarities.tolist()
            
        except Exception as e:
            logger.error("Failed to find most similar embeddings", error=str(e))
            raise
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the loaded model.
        
        Returns:
            Dictionary with model information
        """
        return {
            "loaded": self.is_loaded,
            "model_name": self.model_name,
            "max_seq_length": getattr(self.model, "max_seq_length", None) if self.model else None,
            "embedding_dimension": getattr(self.model, "get_sentence_embedding_dimension", lambda: None)() if self.model else None,
        }


# Global embedding service instance
embedding_service = EmbeddingService()