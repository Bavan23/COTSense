"""
Database import script for COTSense.
Imports component data from parquet file to PostgreSQL database.
"""

import sys
import os
from pathlib import Path
import time
from typing import Dict, Any, List

import pandas as pd
import pyarrow.parquet as pq
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import structlog

# Add server directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent / "server"))

from app.config import settings
from app.db.models import Base, Component
from app.db.session import engine
from app.utils.helpers import validate_component_data

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


def clean_component_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and normalize component data from parquet file.
    
    Args:
        df: Raw component DataFrame
        
    Returns:
        Cleaned DataFrame
    """
    logger.info("Cleaning component data", original_count=len(df))
    
    # Create a copy to avoid modifying original
    cleaned_df = df.copy()
    
    # Standardize column names (handle different naming conventions)
    column_mapping = {
        'Part Number': 'part_number',
        'part_number': 'part_number',
        'PartNumber': 'part_number',
        'Manufacturer': 'manufacturer',
        'manufacturer': 'manufacturer',
        'Category': 'category',
        'category': 'category',
        'Description': 'description',
        'description': 'description',
        'Specifications': 'specifications',
        'specifications': 'specifications',
        'Price': 'price',
        'price': 'price',
        'Stock': 'stock',
        'stock': 'stock'
    }
    
    # Rename columns
    for old_name, new_name in column_mapping.items():
        if old_name in cleaned_df.columns:
            cleaned_df = cleaned_df.rename(columns={old_name: new_name})
    
    # Ensure required columns exist
    required_columns = ['part_number', 'manufacturer', 'category']
    for col in required_columns:
        if col not in cleaned_df.columns:
            logger.error(f"Required column '{col}' not found in data")
            raise ValueError(f"Required column '{col}' not found")
    
    # Clean text fields
    text_columns = ['part_number', 'manufacturer', 'category', 'description', 'specifications', 'stock']
    for col in text_columns:
        if col in cleaned_df.columns:
            # Convert to string and strip whitespace
            cleaned_df[col] = cleaned_df[col].astype(str).str.strip()
            # Replace 'nan' strings with None
            cleaned_df[col] = cleaned_df[col].replace(['nan', 'NaN', 'None', ''], None)
    
    # Clean price column
    if 'price' in cleaned_df.columns:
        # Convert to numeric, handling various formats
        cleaned_df['price'] = pd.to_numeric(cleaned_df['price'], errors='coerce')
        # Remove negative prices
        cleaned_df.loc[cleaned_df['price'] < 0, 'price'] = None
    
    # Remove rows with missing required fields
    initial_count = len(cleaned_df)
    for col in required_columns:
        cleaned_df = cleaned_df.dropna(subset=[col])
    
    # Remove duplicates based on part_number and manufacturer
    cleaned_df = cleaned_df.drop_duplicates(subset=['part_number', 'manufacturer'])
    
    final_count = len(cleaned_df)
    logger.info("Data cleaning completed",
               original_count=initial_count,
               final_count=final_count,
               removed_count=initial_count - final_count)
    
    return cleaned_df


def batch_insert_components(df: pd.DataFrame, batch_size: int = 1000) -> int:
    """
    Insert components into database in batches.
    
    Args:
        df: Cleaned component DataFrame
        batch_size: Number of records to insert per batch
        
    Returns:
        Number of successfully inserted components
    """
    logger.info("Starting batch insert", total_components=len(df), batch_size=batch_size)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    
    inserted_count = 0
    failed_count = 0
    
    try:
        # Process in batches
        for i in range(0, len(df), batch_size):
            batch_df = df.iloc[i:i + batch_size]
            batch_components = []
            
            logger.info(f"Processing batch {i//batch_size + 1}", 
                       start_idx=i, 
                       end_idx=min(i + batch_size, len(df)))
            
            # Convert batch to Component objects
            for idx, row in batch_df.iterrows():
                try:
                    # Validate component data
                    component_data = row.to_dict()
                    validation_issues = validate_component_data(component_data)
                    
                    if validation_issues:
                        logger.warning("Component validation failed",
                                     part_number=row.get('part_number'),
                                     issues=validation_issues)
                        failed_count += 1
                        continue
                    
                    # Create Component object
                    component = Component(
                        part_number=row['part_number'],
                        manufacturer=row['manufacturer'],
                        category=row['category'],
                        description=row.get('description'),
                        specifications=row.get('specifications'),
                        price=row.get('price'),
                        stock=row.get('stock', 'Unknown')
                    )
                    
                    batch_components.append(component)
                    
                except Exception as e:
                    logger.warning("Failed to create component",
                                 part_number=row.get('part_number'),
                                 error=str(e))
                    failed_count += 1
                    continue
            
            # Insert batch
            if batch_components:
                try:
                    session.add_all(batch_components)
                    session.commit()
                    inserted_count += len(batch_components)
                    logger.info(f"Batch inserted successfully", count=len(batch_components))
                    
                except Exception as e:
                    logger.error("Batch insert failed", error=str(e))
                    session.rollback()
                    failed_count += len(batch_components)
    
    finally:
        session.close()
    
    logger.info("Batch insert completed",
               inserted_count=inserted_count,
               failed_count=failed_count,
               total_processed=inserted_count + failed_count)
    
    return inserted_count


def create_indexes():
    """Create additional database indexes for performance."""
    logger.info("Creating additional database indexes")
    
    try:
        with engine.connect() as conn:
            # Create full-text search indexes if using PostgreSQL
            if 'postgresql' in settings.database_url:
                indexes = [
                    "CREATE INDEX IF NOT EXISTS idx_component_description_fts ON components USING gin(to_tsvector('english', description))",
                    "CREATE INDEX IF NOT EXISTS idx_component_specifications_fts ON components USING gin(to_tsvector('english', specifications))",
                    "CREATE INDEX IF NOT EXISTS idx_component_price ON components (price) WHERE price IS NOT NULL",
                    "CREATE INDEX IF NOT EXISTS idx_component_stock ON components (stock) WHERE stock IS NOT NULL"
                ]
                
                for index_sql in indexes:
                    try:
                        conn.execute(text(index_sql))
                        logger.info("Index created successfully", sql=index_sql[:50] + "...")
                    except Exception as e:
                        logger.warning("Failed to create index", sql=index_sql[:50] + "...", error=str(e))
            
            conn.commit()
            
    except Exception as e:
        logger.error("Failed to create indexes", error=str(e))


def main():
    """Main import function."""
    start_time = time.time()
    
    logger.info("Starting COTSense database import")
    
    try:
        # Check if parquet file exists
        if not settings.components_data_path.exists():
            logger.error("Component data file not found", path=str(settings.components_data_path))
            return False
        
        # Create database tables
        logger.info("Creating database tables")
        Base.metadata.create_all(bind=engine)
        
        # Check if components already exist before starting import
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM components"))
            existing_count = result.scalar()
            
            if existing_count > 0:
                logger.warning("Components already exist in database", existing_count=existing_count)
                response = input(f"Database contains {existing_count} components. Continue? (y/N): ")
                if response.lower() != 'y':
                    logger.info("Import cancelled by user")
                    return False
        
        # Process component data in chunks to avoid memory issues
        logger.info("Processing component data in chunks", path=str(settings.components_data_path))
        
        # Use pyarrow to read in batches
        parquet_file = pq.ParquetFile(settings.components_data_path)
        total_rows = parquet_file.metadata.num_rows
        logger.info("Parquet file info", total_rows=total_rows)
        
        # Process in chunks of 5,000 rows to be more conservative with memory
        chunk_size = 5000
        total_inserted = 0
        
        # Read the parquet file in batches
        for batch in parquet_file.iter_batches(batch_size=chunk_size):
            logger.info("Processing batch", batch_rows=len(batch))
            
            # Convert batch to pandas DataFrame
            df_chunk = batch.to_pandas()
            
            if len(df_chunk) == 0:
                continue
                
            # Clean chunk data
            cleaned_chunk = clean_component_data(df_chunk)
            
            if len(cleaned_chunk) > 0:
                # Insert chunk
                chunk_inserted = batch_insert_components(cleaned_chunk)
                total_inserted += chunk_inserted
                logger.info("Batch processed", chunk_inserted=chunk_inserted, total_inserted=total_inserted)
            
            # Clear memory
            del df_chunk, cleaned_chunk, batch
        
        if total_inserted == 0:
            logger.error("No valid components found after processing all batches")
            return False
        
        # Create additional indexes
        create_indexes()
        
        # Final statistics
        total_time = time.time() - start_time
        logger.info("Import completed successfully",
                   inserted_components=total_inserted,
                   total_time_seconds=round(total_time, 2),
                   components_per_second=round(total_inserted / total_time, 2))
        
        return True
        
    except Exception as e:
        logger.error("Import failed", error=str(e), exc_info=True)
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)