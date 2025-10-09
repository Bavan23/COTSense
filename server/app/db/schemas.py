"""
Pydantic schemas for request/response validation.
Defines the API contract for components and searches.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ComponentBase(BaseModel):
    """Base component schema with common fields."""
    part_number: str = Field(..., description="Component part number")
    manufacturer: str = Field(..., description="Component manufacturer")
    category: str = Field(..., description="Component category")
    description: Optional[str] = Field(None, description="Component description")
    specifications: Optional[str] = Field(None, description="Technical specifications")
    price: Optional[float] = Field(None, ge=0, description="Component price in USD")
    stock: Optional[str] = Field(None, description="Stock availability status")


class ComponentCreate(ComponentBase):
    """Schema for creating a new component."""
    pass


class ComponentResponse(ComponentBase):
    """Schema for component API responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(..., description="Component database ID")
    spec_match: Optional[float] = Field(None, ge=0, le=100, description="Specification match score")
    total_score: Optional[float] = Field(None, ge=0, le=100, description="Total recommendation score")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")


class SearchBase(BaseModel):
    """Base search schema."""
    query: str = Field(..., min_length=1, description="Search query text")
    results_count: Optional[int] = Field(None, ge=0, description="Number of results returned")


class SearchCreate(SearchBase):
    """Schema for creating a search record."""
    session_id: Optional[str] = Field(None, description="User session identifier")


class SearchResponse(SearchBase):
    """Schema for search API responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(..., description="Search record ID")
    timestamp: datetime = Field(..., description="Search timestamp")
    session_id: Optional[str] = Field(None, description="User session identifier")


# API Request/Response Schemas

class RecommendRequest(BaseModel):
    """Request schema for component recommendations."""
    query: str = Field(..., min_length=1, max_length=1000, description="Search query")
    top_k: Optional[int] = Field(default=10, ge=1, le=100, description="Number of recommendations")


class RecommendResponse(BaseModel):
    """Response schema for component recommendations."""
    components: List[ComponentResponse] = Field(..., description="Recommended components")
    query: str = Field(..., description="Original search query")
    total: int = Field(..., ge=0, description="Total number of components found")
    processing_time_ms: Optional[float] = Field(None, description="Processing time in milliseconds")


class ExplainRequest(BaseModel):
    """Request schema for AI explanations."""
    component_id: int = Field(..., ge=1, description="Component database ID")
    query: str = Field(..., min_length=1, max_length=1000, description="Original search query")


class ExplainResponse(BaseModel):
    """Response schema for AI explanations."""
    explanation: str = Field(..., description="AI-generated explanation")
    component_id: int = Field(..., description="Component database ID")
    processing_time_ms: Optional[float] = Field(None, description="Processing time in milliseconds")


class HealthResponse(BaseModel):
    """Response schema for health check endpoint."""
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(..., description="Health check timestamp")
    version: str = Field(..., description="API version")
    ml_models_loaded: bool = Field(..., description="Whether ML models are loaded")
    database_connected: bool = Field(..., description="Whether database is connected")