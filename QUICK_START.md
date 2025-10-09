# COTSense Quick Start Guide

🚀 **Get COTSense running in 5 minutes!**

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 13+
- Your ML data files from Colab

## Step 1: Environment Setup

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your settings
DATABASE_URL=postgresql://cotsense_user:cotsense_password@localhost:5432/cotsense_db
GEMINI_API_KEY=your_gemini_api_key_here
```

## Step 2: Place ML Data Files

Copy your Colab ML artifacts to the `data/` directory:

```
data/
├── component_embeddings_offline.npy
├── processed_components_with_offline_embeddings.parquet
├── faiss_index_offline.bin
└── model_config_offline.json (optional)
```

## Step 3: Start Database

```bash
# Using Docker (recommended)
docker run --name cotsense-postgres \
  -e POSTGRES_DB=cotsense_db \
  -e POSTGRES_USER=cotsense_user \
  -e POSTGRES_PASSWORD=cotsense_password \
  -p 5432:5432 -d postgres:15-alpine
```

## Step 4: Setup Backend

```bash
# Install Python dependencies
cd server
pip install -r requirements.txt

# Import component data
python ../scripts/import_to_db.py

# Start FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Step 5: Start Frontend

```bash
# In a new terminal
cd client
npm install
npm run dev
```

## Step 6: Test the Application

1. **Frontend**: http://localhost:5173
2. **API Docs**: http://localhost:8000/docs
3. **Health Check**: http://localhost:8000/health

## Quick Test

Search for "5V voltage regulator" in the frontend to test the full pipeline!

## Using Docker (Alternative)

```bash
# Start everything with Docker Compose
docker-compose -f docker/docker-compose.yml up --build
```

## Troubleshooting

- **ML models not loading**: Check if data files exist in `data/` directory
- **Database connection failed**: Verify PostgreSQL is running and credentials are correct
- **Frontend can't connect**: Ensure FastAPI is running on port 8000
- **Search returns no results**: Check if component data was imported successfully

## Next Steps

- Configure Gemini API key for AI explanations
- Customize component scoring in `server/app/utils/helpers.py`
- Add more component categories
- Scale with Docker Compose for production

---

**Need help?** Check `README_BACKEND.md` for detailed documentation.
