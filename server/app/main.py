"""
COTSense FastAPI Application
Main entry point for the FastAPI backend server.
"""

import asyncio
import time
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog

from .config import settings
from .db.session import create_tables, engine
from .db.schemas import HealthResponse
from .routes import recommend_router, explain_router
from .services.ml_model import ml_service

# Configure structured logging
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
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting COTSense FastAPI application")
    
    try:
        # Try to create database tables
        logger.info("Creating database tables")
        try:
            create_tables()
            logger.info("Database tables created successfully")
        except Exception as db_error:
            logger.warning("Database connection failed, continuing without database", error=str(db_error))
        
        # Load ML models
        logger.info("Loading ML models")
        await ml_service.load_models()
        logger.info("ML models loaded successfully")
        
        logger.info("Application startup completed")
        
    except Exception as e:
        logger.error("Failed to start application", error=str(e))
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down COTSense FastAPI application")


# Create FastAPI application
app = FastAPI(
    title="COTSense API",
    description="GenAI-powered tool for automating COTS parts selection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    """Log HTTP requests and responses."""
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Log request
    logger.info(
        "HTTP request processed",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
        process_time=round(process_time * 1000, 2)  # Convert to milliseconds
    )
    
    return response

# Include routers
app.include_router(recommend_router)
app.include_router(explain_router)


@app.get("/", response_model=dict)
async def root():
    """Root endpoint with basic API information."""
    return {
        "name": "COTSense API",
        "version": "1.0.0",
        "description": "GenAI-powered tool for automating COTS parts selection",
        "docs_url": "/docs",
        "health_url": "/health",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check endpoint.
    
    Returns:
        HealthResponse with service status and component health
    """
    try:
        # Check database connection
        database_connected = False
        try:
            # Simple database query to test connection
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            database_connected = True
        except Exception as e:
            logger.warning("Database health check failed", error=str(e))
            database_connected = False
        
        # Check ML models
        ml_models_loaded = ml_service.is_loaded
        
        # Determine overall status (ML models are more critical than database for core functionality)
        status = "healthy" if ml_models_loaded else "degraded" if database_connected else "unhealthy"
        
        return HealthResponse(
            status=status,
            timestamp=datetime.utcnow(),
            version="1.0.0",
            ml_models_loaded=ml_models_loaded,
            database_connected=database_connected
        )
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.utcnow(),
            version="1.0.0",
            ml_models_loaded=False,
            database_connected=False
        )


@app.get("/api/status")
async def api_status():
    """
    Detailed API status endpoint with service information.
    
    Returns:
        Detailed status information for all services
    """
    try:
        # Get ML service info
        ml_info = ml_service.get_model_info()
        
        # Database status
        db_status = "connected"
        try:
            with engine.connect() as conn:
                conn.execute("SELECT 1")
        except Exception:
            db_status = "disconnected"
        
        # Gemini API status
        gemini_status = "configured" if settings.gemini_api_key else "not_configured"
        
        return {
            "api": {
                "status": "running",
                "version": "1.0.0",
                "timestamp": datetime.utcnow().isoformat()
            },
            "database": {
                "status": db_status,
                "url": settings.database_url.split("@")[-1] if "@" in settings.database_url else "hidden"
            },
            "ml_service": {
                "status": "loaded" if ml_info["loaded"] else "not_loaded",
                **ml_info
            },
            "gemini_api": {
                "status": gemini_status
            },
            "configuration": {
                "default_top_k": settings.default_top_k,
                "max_top_k": settings.max_top_k,
                "embedding_dimension": settings.embedding_dimension,
                "debug_mode": settings.fastapi_debug
            }
        }
        
    except Exception as e:
        logger.error("Status check failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get API status: {str(e)}"
        )


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    logger.error(
        "Unhandled exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        exc_info=True
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# Custom 404 handler
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler."""
    return JSONResponse(
        status_code=404,
        content={
            "detail": f"Endpoint {request.url.path} not found",
            "available_endpoints": [
                "/",
                "/health",
                "/api/status",
                "/api/recommend",
                "/api/explain",
                "/docs",
                "/redoc"
            ],
            "timestamp": datetime.utcnow().isoformat()
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting COTSense FastAPI server",
               host=settings.fastapi_host,
               port=settings.fastapi_port,
               debug=settings.fastapi_debug)
    
    uvicorn.run(
        "app.main:app",
        host=settings.fastapi_host,
        port=settings.fastapi_port,
        reload=settings.fastapi_debug,
        log_level=settings.log_level.lower()
    )