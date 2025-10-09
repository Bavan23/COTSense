"""
FAISS index rebuild script for COTSense.
Rebuilds the FAISS similarity search index from component embeddings.
"""

import sys
import os
from pathlib import Path
import time
import json
from typing import Dict, Any, Optional

import numpy as np
import pandas as pd
import faiss
from sentence_transformers import SentenceTransformer
import structlog

# Add server directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent / "server"))

from app.config import settings

# Configure logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.CallsiteParameterAdder(),
        structlog.dev.ConsoleRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


def load_existing_embeddings() -> Optional[np.ndarray]:
    """
    Load existing component embeddings.
    
    Returns:
        Embeddings array or None if not found
    """
    try:
        if settings.embeddings_path.exists():
            logger.info("Loading existing embeddings", path=str(settings.embeddings_path))
            embeddings = np.load(str(settings.embeddings_path))
            logger.info("Embeddings loaded successfully", shape=embeddings.shape, dtype=embeddings.dtype)
            return embeddings
        else:
            logger.warning("Embeddings file not found", path=str(settings.embeddings_path))
            return None
    except Exception as e:
        logger.error("Failed to load embeddings", error=str(e))
        return None


def generate_embeddings_from_components(
    components_df: pd.DataFrame, 
    model_name: str = "all-MiniLM-L6-v2",
    batch_size: int = 32
) -> np.ndarray:
    """
    Generate embeddings from component data.
    
    Args:
        components_df: DataFrame with component data
        model_name: Sentence transformer model name
        batch_size: Batch size for encoding
        
    Returns:
        Generated embeddings array
    """
    logger.info("Generating embeddings from component data", 
               components_count=len(components_df),
               model_name=model_name)
    
    # Load sentence transformer model
    model = SentenceTransformer(model_name)
    
    # Prepare text data for embedding
    texts = []
    for _, row in components_df.iterrows():
        # Combine relevant text fields
        text_parts = []
        
        # Add part number and manufacturer
        text_parts.append(f"Part: {row.get('part_number', '')}")
        text_parts.append(f"Manufacturer: {row.get('manufacturer', '')}")
        text_parts.append(f"Category: {row.get('category', '')}")
        
        # Add description if available
        if pd.notna(row.get('description')) and row.get('description'):
            text_parts.append(f"Description: {row['description']}")
        
        # Add specifications if available
        if pd.notna(row.get('specifications')) and row.get('specifications'):
            text_parts.append(f"Specifications: {row['specifications']}")
        
        # Combine all parts
        combined_text = " | ".join(text_parts)
        texts.append(combined_text)
    
    # Generate embeddings
    logger.info("Encoding texts to embeddings", batch_size=batch_size)
    start_time = time.time()
    
    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        convert_to_numpy=True
    )
    
    encoding_time = time.time() - start_time
    logger.info("Embeddings generated successfully",
               embeddings_shape=embeddings.shape,
               encoding_time_seconds=round(encoding_time, 2))
    
    return embeddings.astype(np.float32)


def build_faiss_index(embeddings: np.ndarray, index_type: str = "IVF") -> faiss.Index:
    """
    Build FAISS index from embeddings.
    
    Args:
        embeddings: Embeddings array
        index_type: Type of FAISS index to build
        
    Returns:
        Built FAISS index
    """
    logger.info("Building FAISS index", 
               embeddings_shape=embeddings.shape,
               index_type=index_type)
    
    dimension = embeddings.shape[1]
    n_vectors = embeddings.shape[0]
    
    if index_type == "IVF" and n_vectors > 1000:
        # Use IVF (Inverted File) index for large datasets
        n_clusters = min(int(np.sqrt(n_vectors)), 1000)
        quantizer = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        index = faiss.IndexIVFFlat(quantizer, dimension, n_clusters)
        
        logger.info("Training IVF index", n_clusters=n_clusters)
        index.train(embeddings)
        
    elif index_type == "HNSW" and n_vectors > 10000:
        # Use HNSW (Hierarchical Navigable Small World) for very large datasets
        index = faiss.IndexHNSWFlat(dimension, 32)
        index.hnsw.efConstruction = 200
        
    else:
        # Use flat index for smaller datasets or fallback
        index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        logger.info("Using flat index")
    
    # Normalize embeddings for cosine similarity
    logger.info("Normalizing embeddings for cosine similarity")
    faiss.normalize_L2(embeddings)
    
    # Add vectors to index
    logger.info("Adding vectors to index")
    start_time = time.time()
    index.add(embeddings)
    add_time = time.time() - start_time
    
    logger.info("FAISS index built successfully",
               total_vectors=index.ntotal,
               index_type=type(index).__name__,
               add_time_seconds=round(add_time, 2))
    
    return index


def save_index_and_config(
    index: faiss.Index, 
    embeddings: np.ndarray,
    model_name: str,
    components_df: pd.DataFrame
) -> None:
    """
    Save FAISS index and configuration files.
    
    Args:
        index: Built FAISS index
        embeddings: Embeddings array
        model_name: Model name used for embeddings
        components_df: Component DataFrame
    """
    logger.info("Saving FAISS index and configuration")
    
    # Save FAISS index
    logger.info("Saving FAISS index", path=str(settings.faiss_index_path))
    faiss.write_index(index, str(settings.faiss_index_path))
    
    # Save embeddings
    logger.info("Saving embeddings", path=str(settings.embeddings_path))
    np.save(str(settings.embeddings_path), embeddings)
    
    # Save model configuration
    config = {
        "model_name": model_name,
        "embedding_dimension": embeddings.shape[1],
        "total_components": len(components_df),
        "index_type": type(index).__name__,
        "created_at": time.time(),
        "faiss_version": faiss.__version__,
        "index_stats": {
            "ntotal": index.ntotal,
            "d": index.d,
            "is_trained": index.is_trained
        }
    }
    
    logger.info("Saving model configuration", path=str(settings.model_config_path))
    with open(settings.model_config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    logger.info("All files saved successfully")


def verify_index(index: faiss.Index, embeddings: np.ndarray) -> bool:
    """
    Verify the built index works correctly.
    
    Args:
        index: FAISS index to verify
        embeddings: Original embeddings
        
    Returns:
        True if verification passes
    """
    logger.info("Verifying FAISS index")
    
    try:
        # Test search with first embedding
        test_embedding = embeddings[0:1]
        similarities, indices = index.search(test_embedding, 5)
        
        # Check that we get results
        if len(indices[0]) == 0:
            logger.error("Index search returned no results")
            return False
        
        # Check that first result is the query itself (should be most similar)
        if indices[0][0] != 0:
            logger.warning("First search result is not the query itself", 
                          expected=0, 
                          actual=indices[0][0])
        
        # Check similarity scores are reasonable
        if similarities[0][0] < 0.9:  # Should be very high for self-similarity
            logger.warning("Self-similarity score is unexpectedly low", 
                          score=similarities[0][0])
        
        logger.info("Index verification passed",
                   test_similarities=similarities[0].tolist(),
                   test_indices=indices[0].tolist())
        
        return True
        
    except Exception as e:
        logger.error("Index verification failed", error=str(e))
        return False


def main():
    """Main rebuild function."""
    start_time = time.time()
    
    logger.info("Starting FAISS index rebuild")
    
    try:
        # Load component data
        if not settings.components_data_path.exists():
            logger.error("Component data file not found", path=str(settings.components_data_path))
            return False
        
        logger.info("Loading component data", path=str(settings.components_data_path))
        components_df = pd.read_parquet(settings.components_data_path)
        logger.info("Component data loaded", total_components=len(components_df))
        
        if len(components_df) == 0:
            logger.error("No components found in data file")
            return False
        
        # Try to load existing embeddings first
        embeddings = load_existing_embeddings()
        
        if embeddings is None or len(embeddings) != len(components_df):
            logger.info("Generating new embeddings")
            model_name = "all-MiniLM-L6-v2"
            
            # Load model config if available to get model name
            if settings.model_config_path.exists():
                try:
                    with open(settings.model_config_path, 'r') as f:
                        config = json.load(f)
                        model_name = config.get('model_name', model_name)
                        logger.info("Using model from config", model_name=model_name)
                except Exception as e:
                    logger.warning("Failed to load model config", error=str(e))
            
            embeddings = generate_embeddings_from_components(
                components_df, 
                model_name=model_name
            )
        else:
            logger.info("Using existing embeddings")
            model_name = "all-MiniLM-L6-v2"  # Default, will be updated from config if available
        
        # Determine index type based on dataset size
        n_components = len(components_df)
        if n_components > 50000:
            index_type = "HNSW"
        elif n_components > 5000:
            index_type = "IVF"
        else:
            index_type = "Flat"
        
        logger.info("Selected index type", 
                   index_type=index_type, 
                   component_count=n_components)
        
        # Build FAISS index
        index = build_faiss_index(embeddings, index_type)
        
        # Verify index
        if not verify_index(index, embeddings):
            logger.error("Index verification failed")
            return False
        
        # Save everything
        save_index_and_config(index, embeddings, model_name, components_df)
        
        # Final statistics
        total_time = time.time() - start_time
        logger.info("FAISS index rebuild completed successfully",
                   total_components=len(components_df),
                   index_type=type(index).__name__,
                   total_time_seconds=round(total_time, 2))
        
        return True
        
    except Exception as e:
        logger.error("FAISS index rebuild failed", error=str(e), exc_info=True)
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)