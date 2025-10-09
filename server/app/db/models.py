"""
SQLAlchemy database models for COTSense.
Defines the database schema for components and search history.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class Component(Base):
    """
    Component model representing COTS electronic components.
    
    This model stores component metadata that corresponds to the
    embeddings stored in the FAISS index.
    """
    __tablename__ = "components"
    
    # Primary key - matches the index in FAISS and embeddings array
    id = Column(Integer, primary_key=True, index=True)
    
    # Component identification
    part_number = Column(String(255), nullable=False, index=True)
    manufacturer = Column(String(255), nullable=False, index=True)
    category = Column(String(255), nullable=False, index=True)
    
    # Component details
    description = Column(Text, nullable=True)
    specifications = Column(Text, nullable=True)
    
    # Pricing and availability
    price = Column(Float, nullable=True)
    stock = Column(String(50), nullable=True)
    
    # ML-generated scores (populated during recommendation)
    spec_match = Column(Float, nullable=True)
    total_score = Column(Float, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_component_search', 'part_number', 'manufacturer', 'category'),
        Index('idx_component_category', 'category'),
        Index('idx_component_manufacturer', 'manufacturer'),
    )
    
    def __repr__(self) -> str:
        return f"<Component(id={self.id}, part_number='{self.part_number}', manufacturer='{self.manufacturer}')>"


class Search(Base):
    """
    Search history model to track user queries and results.
    Useful for analytics and improving recommendations.
    """
    __tablename__ = "searches"
    
    id = Column(Integer, primary_key=True, index=True)
    query = Column(Text, nullable=False)
    results_count = Column(Integer, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Optional: track user session or IP for analytics
    session_id = Column(String(255), nullable=True, index=True)
    
    def __repr__(self) -> str:
        return f"<Search(id={self.id}, query='{self.query[:50]}...', timestamp={self.timestamp})>"