"""
Component recommendation API endpoints.
Handles ML-based component search and recommendation requests.
"""

import time
from typing import List

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
import structlog

from ..db import get_db, Search
from ..db.schemas import RecommendRequest, RecommendResponse, SearchCreate
from ..services.ml_model import ml_service
from ..utils.helpers import convert_df_to_components, clean_text_for_search
from ..config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api", tags=["recommendations"])


@router.post("/recommend", response_model=RecommendResponse)
async def recommend_components(
    request: RecommendRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> RecommendResponse:
    """
    Get component recommendations based on text query.
    
    This endpoint uses ML-based similarity search to find the most relevant
    components matching the user's query.
    
    Args:
        request: Recommendation request with query and optional top_k
        background_tasks: FastAPI background tasks for logging
        db: Database session
        
    Returns:
        RecommendResponse with recommended components
        
    Raises:
        HTTPException: If ML models are not loaded or search fails
    """
    start_time = time.time()
    
    try:
        # Validate ML models are loaded
        if not ml_service.is_loaded:
            logger.error("ML models not loaded")
            raise HTTPException(
                status_code=503,
                detail="ML models are not loaded. Please try again later."
            )
        
        # Clean and validate query
        query = clean_text_for_search(request.query)
        if not query:
            raise HTTPException(
                status_code=400,
                detail="Query cannot be empty"
            )
        
        # Validate top_k parameter
        top_k = request.top_k or settings.default_top_k
        if top_k > settings.max_top_k:
            top_k = settings.max_top_k
            logger.warning("top_k capped at maximum", 
                          requested=request.top_k, 
                          capped_at=settings.max_top_k)
        
        logger.info("Processing recommendation request", 
                   query=query, 
                   top_k=top_k)
        
        # Get recommendations from ML service
        components_df, similarities, ml_processing_time = await ml_service.recommend_components(
            query=query,
            top_k=top_k
        )
        
        # Convert DataFrame to response objects
        components = convert_df_to_components(components_df, similarities)
        
        # Calculate total processing time
        total_processing_time = (time.time() - start_time) * 1000
        
        # Log search in background (skip if database unavailable)
        try:
            background_tasks.add_task(
                log_search,
                db=db,
                query=query,
                results_count=len(components)
            )
        except Exception as e:
            logger.warning("Failed to schedule search logging", error=str(e))
        
        logger.info("Recommendation request completed",
                   query=query,
                   results_count=len(components),
                   processing_time_ms=round(total_processing_time, 2))
        
        return RecommendResponse(
            components=components,
            query=query,
            total=len(components),
            processing_time_ms=round(total_processing_time, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to process recommendation request",
                    query=request.query,
                    error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/recommend/health")
async def recommend_health():
    """
    Health check endpoint for recommendation service.
    
    Returns:
        Service health status and ML model information
    """
    try:
        model_info = ml_service.get_model_info()
        
        return {
            "status": "healthy" if ml_service.is_loaded else "unhealthy",
            "service": "recommendation",
            "ml_models": model_info,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "service": "recommendation",
            "error": str(e),
            "timestamp": time.time()
        }


def log_search(db: Session, query: str, results_count: int) -> None:
    """
    Log search query to database for analytics.
    
    Args:
        db: Database session
        query: Search query
        results_count: Number of results returned
    """
    try:
        search_record = Search(
            query=query,
            results_count=results_count
        )
        db.add(search_record)
        db.commit()
        
        logger.debug("Search logged to database", 
                    query=query, 
                    results_count=results_count)
        
    except Exception as e:
        logger.warning("Failed to log search to database", 
                      query=query, 
                      error=str(e))
        db.rollback()


@router.get("/recommend/stats")
async def get_recommendation_stats(db: Session = Depends(get_db)):
    """
    Get recommendation service statistics.
    
    Args:
        db: Database session
        
    Returns:
        Statistics about searches and recommendations
    """
    try:
        # Get search statistics
        total_searches = db.query(Search).count()
        
        # Get recent searches (last 24 hours)
        from datetime import datetime, timedelta
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_searches = db.query(Search).filter(
            Search.timestamp >= yesterday
        ).count()
        
        # Get model information
        model_info = ml_service.get_model_info()
        
        return {
            "total_searches": total_searches,
            "recent_searches_24h": recent_searches,
            "ml_models": model_info,
            "service_status": "healthy" if ml_service.is_loaded else "unhealthy"
        }
        
    except Exception as e:
        logger.error("Failed to get recommendation stats", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get statistics: {str(e)}"
        )