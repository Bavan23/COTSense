# COTSense Full-Stack Setup Guide

## 🏗️ Architecture Overview

- **Frontend**: React + TypeScript + Tailwind CSS + Vite (Port 5173)
- **Backend**: FastAPI + Python (Port 8000)
- **Database**: PostgreSQL (Neon Cloud)
- **ML**: FAISS + Sentence Transformers

## 🚀 Quick Start

### 1. Start Backend Only
```bash
cd server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend Only
```bash
npm run dev
```

### 3. Start Both (Recommended)
```bash
npm run dev:full
```

## 📁 Project Structure

```
COTSense/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # React Components
│   │   ├── lib/           # API & Utils
│   │   └── pages/         # Route Components
│   └── .env               # Frontend Environment
├── server/                # FastAPI Backend
│   ├── app/
│   │   ├── routes/        # API Endpoints
│   │   ├── services/      # ML & Business Logic
│   │   └── db/           # Database Models
│   └── requirements.txt   # Python Dependencies
├── data/                  # ML Data Files
└── .env                   # Backend Environment
```

## 🔧 Configuration

### Frontend Configuration (client/.env)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=COTSense
VITE_DEV_MODE=true
```

### Backend Configuration (.env)
```env
DATABASE_URL=postgresql://your_neon_connection_string
GEMINI_API_KEY=your_gemini_api_key
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
```

## 🌐 API Integration

### Vite Proxy Setup
The frontend uses Vite proxy to forward `/api/*` requests to the backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
}
```

### API Service Layer
```typescript
// client/src/lib/api.ts
const api = {
  async recommend(request) {
    return fetch('/api/recommend', { ... });
  },
  async health() {
    return fetch('/health');
  }
};
```

## 🧪 Testing the Integration

1. **Start both services**:
   ```bash
   npm run dev:full
   ```

2. **Visit test page**: http://localhost:5173/api-test

3. **Test endpoints**:
   - Health check: `GET /health`
   - Recommendations: `POST /api/recommend`
   - Status: `GET /api/status`

## 📊 Available Endpoints

### Backend API Endpoints
- `GET /health` - Health check
- `GET /api/status` - Detailed status
- `POST /api/recommend` - Get component recommendations
- `POST /api/explain` - Get AI explanations
- `GET /api/recommend/health` - ML service health

### Frontend Routes
- `/` - Home page
- `/search` - Search results
- `/component/:id` - Component details
- `/api-test` - API integration test
- `/admin` - Admin panel

## 🔄 Data Flow Example

1. **User submits search** in React frontend
2. **Frontend calls** `/api/recommend` via proxy
3. **Vite proxy forwards** to `http://localhost:8000/api/recommend`
4. **FastAPI processes** request using ML models
5. **Database query** (if needed) via SQLAlchemy
6. **Response returned** through proxy to frontend
7. **React updates** UI with results

## 🛠️ Development Commands

```bash
# Install dependencies
npm install
pip install -r server/requirements.txt

# Development (both services)
npm run dev:full

# Development (separate terminals)
npm run dev          # Frontend only
npm run dev:backend  # Backend only

# Build for production
npm run build

# Type checking
npm run check
```

## 🐳 Production Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Render/Railway)
```bash
cd server
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Environment Variables for Production
- Frontend: `VITE_API_BASE_URL=https://your-backend-url.com`
- Backend: Set all environment variables in your hosting platform

## 🔍 Troubleshooting

### CORS Issues
- Ensure `http://localhost:5173` is in `allowed_origins` in backend config
- Check that CORS middleware is properly configured

### Proxy Issues
- Verify Vite proxy configuration in `vite.config.ts`
- Ensure backend is running on port 8000

### Database Connection
- Check Neon connection string in `.env`
- Verify network connectivity to database

### ML Models
- Ensure all data files exist in `data/` directory
- Check memory usage for large datasets

## ✅ Success Indicators

When everything is working correctly, you should see:

1. **Frontend**: Loads at http://localhost:5173
2. **Backend**: API docs at http://localhost:8000/docs
3. **Health Check**: Green status at `/api-test`
4. **Recommendations**: Working search functionality
5. **No CORS errors** in browser console
6. **Database connection** (if configured)
7. **ML models loaded** successfully

## 🎯 Next Steps

1. **Add authentication** (JWT tokens)
2. **Implement caching** (Redis)
3. **Add monitoring** (logging, metrics)
4. **Set up CI/CD** pipeline
5. **Add tests** (Jest, Pytest)
6. **Optimize performance** (lazy loading, pagination)

---

**🎉 Your full-stack COTSense application is now ready for development!**
