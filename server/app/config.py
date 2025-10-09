"""
Configuration management for COTSense FastAPI backend.
Handles environment variables, database settings, and ML model paths.
"""

import os
from pathlib import Path
from typing import List, Optional

from pydantic import Field, field_validator, ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database Configuration
    database_url: str = Field(
        default="postgresql://neondb_owner:npg_w3ADXPomsr8Y@ep-steep-cloud-adu920vl-pooler.c-2.us-east-1.aws.neon.tech:5432/neondb?sslmode=require&channel_binding=require",
        description="PostgreSQL database connection URL"
    )
    
    # Google Gemini API Configuration
    gemini_api_key: str = Field(
        default="",
        description="Google Gemini API key for AI explanations"
    )
    
    # FastAPI Configuration
    fastapi_host: str = Field(default="0.0.0.0", description="FastAPI host")
    fastapi_port: int = Field(default=8000, description="FastAPI port")
    fastapi_debug: bool = Field(default=False, description="Debug mode")
    
    # ML Model Configuration
    def _get_project_root(self) -> Path:
        """Get the project root directory."""
        config_dir = Path(__file__).parent  # server/app/
        server_dir = config_dir.parent      # server/
        project_dir = server_dir.parent     # COTSense/
        return project_dir
    
    @property
    def ml_data_path(self) -> Path:
        """Get the absolute path to the ML data directory."""
        return self._get_project_root() / "data"
    
    @property
    def faiss_index_path(self) -> Path:
        """Path to FAISS index file."""
        return self.ml_data_path / "faiss_index_offline.bin"
    
    @property
    def embeddings_path(self) -> Path:
        """Path to component embeddings numpy file."""
        return self.ml_data_path / "component_embeddings_offline.npy"
    
    @property
    def components_data_path(self) -> Path:
        """Path to processed components parquet file."""
        return self.ml_data_path / "processed_components_with_offline_embeddings.parquet"
    
    @property
    def model_config_path(self) -> Path:
        """Path to model configuration JSON file."""
        return self.ml_data_path / "model_config_offline.json"
    
    # Search Configuration
    default_top_k: int = Field(default=10, description="Default number of recommendations")
    max_top_k: int = Field(default=100, description="Maximum number of recommendations")
    embedding_dimension: int = Field(default=768, description="Embedding vector dimension")
    
    # CORS Configuration
    allowed_origins: List[str] = Field(
        default=[
            "http://localhost:5173",
            "http://localhost:3000", 
            "http://localhost:5000"
        ],
        description="Allowed CORS origins"
    )
    
    @field_validator('allowed_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse comma-separated CORS origins from environment variable."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v
    
    # Logging Configuration
    log_level: str = Field(default="INFO", description="Logging level")
    
    model_config = ConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        protected_namespaces=('settings_',),
        extra='ignore'  # Ignore extra fields from environment
    )
        
    def validate_paths(self) -> None:
        """Validate that required ML data files exist."""
        required_files = [
            self.faiss_index_path,
            self.embeddings_path,
            self.components_data_path
        ]
        
        missing_files = []
        for file_path in required_files:
            if not file_path.exists():
                missing_files.append(str(file_path))
        
        if missing_files:
            raise FileNotFoundError(
                f"Required ML data files not found: {', '.join(missing_files)}\n"
                f"Please ensure ML artifacts are placed in the correct directory."
            )
    
    @property
    def database_url_sync(self) -> str:
        """Get synchronous database URL for SQLAlchemy."""
        return self.database_url.replace("postgresql://", "postgresql+psycopg2://")
    
    @property
    def database_url_async(self) -> str:
        """Get asynchronous database URL for async SQLAlchemy."""
        return self.database_url.replace("postgresql://", "postgresql+asyncpg://")


# Global settings instance
settings = Settings()

# Validate ML data files exist on import
try:
    settings.validate_paths()
except FileNotFoundError as e:
    print(f"Warning: {e}")
    print("The application will start but ML features may not work correctly.")