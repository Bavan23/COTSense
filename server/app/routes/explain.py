"""
AI explanation API endpoints using Google Gemini.
Handles generating AI explanations for component recommendations.
"""

import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import google.generativeai as genai
import structlog

from ..db import get_db, Component
from ..db.schemas import ExplainRequest, ExplainResponse
from ..config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api", tags=["explanations"])

# Configure Gemini API
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel('gemini-pro')
else:
    model = None
    logger.warning("Gemini API key not configured. AI explanations will not work.")


@router.post("/explain", response_model=ExplainResponse)
async def explain_recommendation(
    request: ExplainRequest,
    db: Session = Depends(get_db)
) -> ExplainResponse:
    """
    Generate AI explanation for a component recommendation.
    
    This endpoint uses Google Gemini to generate detailed explanations
    about why a specific component was recommended for a given query.
    
    Args:
        request: Explanation request with component_id and query
        db: Database session
        
    Returns:
        ExplainResponse with AI-generated explanation
        
    Raises:
        HTTPException: If Gemini API is not configured or component not found
    """
    start_time = time.time()
    
    try:
        # Check if Gemini API is configured
        if not model or not settings.gemini_api_key:
            raise HTTPException(
                status_code=503,
                detail="AI explanation service is not configured. Please set GEMINI_API_KEY."
            )
        
        # Get component from database
        component = db.query(Component).filter(
            Component.id == request.component_id
        ).first()
        
        if not component:
            raise HTTPException(
                status_code=404,
                detail=f"Component with ID {request.component_id} not found"
            )
        
        logger.info("Generating AI explanation",
                   component_id=request.component_id,
                   part_number=component.part_number,
                   query=request.query)
        
        # Generate explanation using Gemini
        explanation = await generate_explanation(
            component=component,
            query=request.query
        )
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000
        
        logger.info("AI explanation generated successfully",
                   component_id=request.component_id,
                   processing_time_ms=round(processing_time, 2))
        
        return ExplainResponse(
            explanation=explanation,
            component_id=request.component_id,
            processing_time_ms=round(processing_time, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to generate AI explanation",
                    component_id=request.component_id,
                    query=request.query,
                    error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate explanation: {str(e)}"
        )


async def generate_explanation(component: Component, query: str) -> str:
    """
    Generate AI explanation using Google Gemini.
    
    Args:
        component: Component database object
        query: Original search query
        
    Returns:
        AI-generated explanation string
        
    Raises:
        Exception: If Gemini API call fails
    """
    try:
        # Prepare component information
        component_info = {
            "part_number": component.part_number,
            "manufacturer": component.manufacturer,
            "category": component.category,
            "description": component.description or "No description available",
            "specifications": component.specifications or "No specifications available",
            "price": f"${component.price:.2f}" if component.price else "Price not available",
            "stock": component.stock or "Stock status unknown",
            "spec_match": f"{component.spec_match:.1f}%" if component.spec_match else "N/A",
            "total_score": f"{component.total_score:.1f}%" if component.total_score else "N/A"
        }
        
        # Create prompt for Gemini
        prompt = f"""
You are an expert electronics engineer helping users understand component recommendations.

User Query: "{query}"

Recommended Component:
- Part Number: {component_info['part_number']}
- Manufacturer: {component_info['manufacturer']}
- Category: {component_info['category']}
- Description: {component_info['description']}
- Specifications: {component_info['specifications']}
- Price: {component_info['price']}
- Stock Status: {component_info['stock']}
- Specification Match: {component_info['spec_match']}
- Total Score: {component_info['total_score']}

Please provide a clear, concise explanation (2-3 paragraphs) of why this component is recommended for the user's query. Focus on:

1. How the component matches the user's requirements
2. Key technical specifications that make it suitable
3. Any advantages or considerations (price, availability, performance)
4. Practical application context

Keep the explanation technical but accessible, and avoid repeating information already provided above.
"""
        
        # Generate explanation using Gemini
        response = model.generate_content(prompt)
        
        if not response.text:
            raise Exception("Gemini API returned empty response")
        
        return response.text.strip()
        
    except Exception as e:
        logger.error("Gemini API call failed", error=str(e))
        # Fallback explanation if Gemini fails
        return generate_fallback_explanation(component, query)


def generate_fallback_explanation(component: Component, query: str) -> str:
    """
    Generate a fallback explanation when Gemini API is unavailable.
    
    Args:
        component: Component database object
        query: Original search query
        
    Returns:
        Fallback explanation string
    """
    explanation_parts = []
    
    # Basic match explanation
    explanation_parts.append(
        f"The {component.part_number} from {component.manufacturer} "
        f"is recommended as a {component.category.lower()} component that matches your query '{query}'."
    )
    
    # Specification match
    if component.spec_match and component.spec_match > 80:
        explanation_parts.append(
            f"With a {component.spec_match:.1f}% specification match, "
            f"this component closely aligns with your requirements."
        )
    elif component.spec_match and component.spec_match > 60:
        explanation_parts.append(
            f"This component provides a {component.spec_match:.1f}% specification match, "
            f"making it a suitable option for your application."
        )
    
    # Price and availability
    if component.price and component.stock:
        stock_status = component.stock.lower()
        if "in stock" in stock_status:
            explanation_parts.append(
                f"At ${component.price:.2f}, this component is competitively priced and currently in stock."
            )
        elif "low stock" in stock_status:
            explanation_parts.append(
                f"Priced at ${component.price:.2f}, this component is available but with limited stock."
            )
    
    # Description context
    if component.description and len(component.description) > 20:
        explanation_parts.append(
            f"This component is designed for {component.description.lower()[:100]}..."
        )
    
    return " ".join(explanation_parts)


@router.get("/explain/health")
async def explain_health():
    """
    Health check endpoint for explanation service.
    
    Returns:
        Service health status and API configuration
    """
    try:
        api_configured = bool(settings.gemini_api_key and model)
        
        # Test API connection if configured
        api_working = False
        if api_configured:
            try:
                # Simple test query
                test_response = model.generate_content("Test")
                api_working = bool(test_response.text)
            except Exception as e:
                logger.warning("Gemini API test failed", error=str(e))
        
        return {
            "status": "healthy" if api_configured and api_working else "unhealthy",
            "service": "explanation",
            "gemini_api_configured": api_configured,
            "gemini_api_working": api_working,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "service": "explanation",
            "error": str(e),
            "timestamp": time.time()
        }