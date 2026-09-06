import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database.database import init_db
from api.routes import router as api_router
from websocket.routes import router as ws_router
from websocket.workspace_routes import router as ws_workspace_router
from terminal.router import router as terminal_router
from config.settings import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(api_router, prefix="/api")
app.include_router(ws_router, prefix="/ws")
app.include_router(ws_workspace_router, prefix="/ws")
app.include_router(terminal_router, prefix="/ws")

# Keep a root fallback
@app.get("/")
async def root():
    return {"status": "online", "service": "NovaDesk Cloud Web IDE Backend"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
