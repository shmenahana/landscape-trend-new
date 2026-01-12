"""
FastAPI backend that exposes real bot data to the dashboard.
Provides real-time access to trades, positions, and performance metrics.
"""
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from datetime import datetime
import aiosqlite
import logging

from bot.database import Database
from bot.exchange import ExchangeConnector
from bot.indicators import calculate_all_indicators
import os
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Crypto Trading Bot API")

# Allow CORS for frontend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global database instance
db = Database()


@app.on_event("startup")
async def startup():
    """Initialize database on startup."""
    await db.initialize()


# API Routes

@app.get("/api/status")
async def get_status():
    """Get bot status and overview."""
    try:
        daily_stats = await db.get_daily_stats()
        open_positions = await db.get_open_positions()

        return {
            'status': 'running',
            'timestamp': datetime.now().isoformat(),
            'daily_stats': daily_stats,
            'open_positions_count': len(open_positions)
        }
    except Exception as e:
        return {'error': str(e)}


@app.get("/api/balance")
async def get_balance():
    """Get current balance and portfolio value."""
    try:
        balance_history = await db.get_balance_history(days=1)
        if balance_history:
            latest = balance_history[-1]
            return {
                'total_balance': latest['total_balance'],
                'available_balance': latest['available_balance'],
                'in_positions': latest['in_positions'],
                'daily_pnl': latest['daily_pnl'],
                'total_pnl': latest['total_pnl']
            }
        return {}

    except Exception as e:
        logger.error(f"Error fetching dashboard data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/trades")
async def get_trades(limit: int = 50):
    """Get recent trade history."""
    db = Database()
    await db.initialize()
    trades = await db.get_recent_trades(limit)
    return {"trades": trades}


@app.get("/api/positions")
async def get_positions():
    """Get current open positions."""
    db = Database()
    positions = await db.get_open_positions()
    return {"positions": positions}


@app.get("/api/balance-history")
async def get_balance_history(days: int = 7):
    """Get balance history for charting."""
    db = Database()
    history = await db.get_balance_history(days)
    return {"history": history}


@app.get("/api/activity")
async def get_activity():
    """Get recent bot activity."""
    db = Database()
    async with aiosqlite.connect(db.db_path) as conn:
        conn.row_factory = aiosqlite.Row
        async with conn.execute(
            "SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 50"
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]


# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time updates."""
    await websocket.accept()
    try:
        while True:
            # Send real-time updates
            db = Database()
            positions = await db.get_open_positions()
            stats = await db.get_daily_stats()

            await websocket.send_json({
                'type': 'update',
                'positions': positions,
                'stats': stats
            })

            await asyncio.sleep(5)  # Update every 5 seconds

    except Exception as e:
        logger.error(f"WebSocket error: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
