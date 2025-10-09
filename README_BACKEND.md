# COTSense FastAPI Backend

Production-ready FastAPI backend for COTSense - GenAI-powered tool for automating COTS parts selection.

## 🚀 Features

- **ML-Powered Search**: FAISS-based vector similarity search for component recommendations
- **AI Explanations**: Google Gemini integration for intelligent component explanations
- **Production Ready**: Comprehensive logging, error handling, and monitoring
- **Scalable Architecture**: Async FastAPI with PostgreSQL and Docker support
- **Type Safety**: Full Pydantic validation and TypeScript-compatible schemas

## 📋 Prerequisites

- Python 3.11+
- PostgreSQL 13+
- ML Data Files (from Colab):
  - `component_embeddings_offline.npy`
  - `processed_components_with_offline_embeddings.parquet`
  - `faiss_index_offline.bin`
  - `model_config_offline.json` (optional)

## 🛠️ Installation

### 1. Environment Setup

```bash
# Clone repository
git clone <repository-url>
cd COTSense

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r server/requirements.txt
```

### 2. Environment Configuration

Create `.env` file in project root:

```bash
cp .env.example .env
```

Configure the following variables:

```env
# Database
DATABASE_URL=postgresql://cotsense_user:cotsense_password@localhost:5432/cotsense_db

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# FastAPI Configuration
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
FASTAPI_DEBUG=true

# ML Model Paths
ML_DATA_PATH=./data
FAISS_INDEX_PATH=./data/faiss_index_offline.bin
EMBEDDINGS_PATH=./data/component_embeddings_offline.npy
COMPONENTS_DATA_PATH=./data/processed_components_with_offline_embeddings.parquet
MODEL_CONFIG_PATH=./data/model_config_offline.json

# Search Configuration
DEFAULT_TOP_K=10
MAX_TOP_K=100
EMBEDDING_DIMENSION=768

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:5000

# Logging
LOG_LEVEL=INFO
```

### 3. Database Setup

```bash
# Start PostgreSQL (if using Docker)
docker run --name cotsense-postgres \
  -e POSTGRES_DB=cotsense_db \
  -e POSTGRES_USER=cotsense_user \
  -e POSTGRES_PASSWORD=cotsense_password \
  -p 5432:5432 \
  -d postgres:15-alpine

# Import component data to database
cd server
python ../scripts/import_to_db.py
```

### 4. ML Data Setup

Place your ML artifacts in the `data/` directory:

```
data/
├── component_embeddings_offline.npy      (768MB)
├── processed_components_with_offline_embeddings.parquet  (874MB)
├── faiss_index_offline.bin               (768MB)
└── model_config_offline.json             (optional)
```

## 🚀 Running the Application

### Development Mode

```bash
cd server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
cd server
python -m gunicorn app.main:app -w 4 -k uvicorn.workers.UnicornWorker --bind 0.0.0.0:8000
```

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose -f docker/docker-compose.yml up --build

# Or run individual services
docker-compose -f docker/docker-compose.yml up postgres  # Database only
docker-compose -f docker/docker-compose.yml up fastapi   # API only
```

## 📚 API Documentation

Once running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### Key Endpoints

#### Component Recommendations
```http
POST /api/recommend
Content-Type: application/json

{
  "query": "5V voltage regulator 1A",
  "top_k": 10
}
```

#### AI Explanations
```http
POST /api/explain
Content-Type: application/json

{
  "component_id": 123,
  "query": "5V voltage regulator 1A"
}
```

#### Health Check
```http
GET /health
```

#### Service Status
```http
GET /api/status
```

## 🔧 Scripts and Utilities

### Database Import
```bash
python scripts/import_to_db.py
```

### FAISS Index Rebuild
```bash
python scripts/rebuild_faiss_index.py
```

## 🏗️ Architecture

```
server/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── db/                  # Database models and schemas
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── session.py       # Database session management
│   ├── routes/              # API route handlers
│   │   ├── recommend.py     # Component recommendation endpoints
│   │   └── explain.py       # AI explanation endpoints
│   ├── services/            # Business logic services
│   │   ├── ml_model.py      # ML model and FAISS integration
│   │   └── embeddings.py    # Embedding utilities
│   └── utils/               # Helper utilities
│       └── helpers.py       # Data conversion and scoring
├── requirements.txt         # Python dependencies
└── Dockerfile              # Docker configuration
```

## 🔍 Monitoring and Logging

### Health Checks
- `/health` - Overall service health
- `/api/recommend/health` - ML service health
- `/api/explain/health` - AI service health

### Logging
Structured JSON logging with:
- Request/response logging
- Performance metrics
- Error tracking
- ML model status

### Metrics
- Processing times
- Search accuracy
- Component match scores
- API usage statistics

## 🚨 Troubleshooting

### Common Issues

#### ML Models Not Loading
```bash
# Check if data files exist
ls -la data/

# Verify file permissions
chmod 644 data/*.npy data/*.bin data/*.parquet

# Check logs
docker-compose logs fastapi
```

#### Database Connection Issues
```bash
# Test database connection
psql -h localhost -U cotsense_user -d cotsense_db

# Check database logs
docker-compose logs postgres
```

#### Gemini API Issues
```bash
# Verify API key
echo $GEMINI_API_KEY

# Test API endpoint
curl -X GET "http://localhost:8000/api/explain/health"
```

### Performance Optimization

#### FAISS Index Optimization
```bash
# Rebuild index with optimal settings
python scripts/rebuild_faiss_index.py
```

#### Database Optimization
```sql
-- Create additional indexes
CREATE INDEX CONCURRENTLY idx_components_category_price ON components(category, price);
CREATE INDEX CONCURRENTLY idx_components_manufacturer_category ON components(manufacturer, category);
```

## 🔒 Security

- Environment variable configuration
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy
- CORS configuration
- Non-root Docker user
- Health check endpoints

## 📈 Scaling

### Horizontal Scaling
- Multiple FastAPI instances behind load balancer
- Database connection pooling
- Redis caching layer
- CDN for static assets

### Vertical Scaling
- Increase memory for ML models
- SSD storage for FAISS index
- CPU optimization for embeddings

## 🤝 Contributing

1. Follow PEP 8 style guidelines
2. Add type hints for all functions
3. Include docstrings for public APIs
4. Write tests for new features
5. Update documentation

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check application logs
4. Create an issue with detailed information

---

**Built with ❤️ for the electronics engineering community**
