"""
Real database module for storing trades, balances, and bot activity.
Uses SQLite with async support.
"""
import aiosqlite
import json
from datetime import datetime
from typing import List, Dict, Optional


class Database:
    def __init__(self, db_path: str = "trading_bot.db"):
        self.db_path = db_path

    async def initialize(self):
        """Create all necessary tables with real schemas."""
        async with aiosqlite.connect(self.db_path) as db:
            # Trades table - stores every executed trade
            await db.execute("""
                CREATE TABLE IF NOT EXISTS trades (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    symbol TEXT NOT NULL,
                    side TEXT NOT NULL,
                    price REAL NOT NULL,
                    amount REAL NOT NULL,
                    cost REAL NOT NULL,
                    fee REAL,
                    order_id TEXT,
                    strategy TEXT,
                    pnl REAL,
                    notes TEXT
                )
            """)

            # Positions table - tracks open positions
            await db.execute("""
                CREATE TABLE IF NOT EXISTS positions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    symbol TEXT UNIQUE NOT NULL,
                    entry_price REAL NOT NULL,
                    amount REAL NOT NULL,
                    cost REAL NOT NULL,
                    current_price REAL,
                    unrealized_pnl REAL,
                    stop_loss REAL,
                    take_profit REAL,
                    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    strategy TEXT
                )
            """)

            # Balance history - tracks account balance over time
            await db.execute("""
                CREATE TABLE IF NOT EXISTS balance_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    total_balance REAL NOT NULL,
                    available_balance REAL NOT NULL,
                    in_positions REAL NOT NULL,
                    daily_pnl REAL,
                    total_pnl REAL
                )
            """)

            # Bot activity log
            await db.execute("""
                CREATE TABLE IF NOT EXISTS activity_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    level TEXT NOT NULL,
                    message TEXT NOT NULL,
                    data TEXT
                )
            """)

            await db.commit()

    async def log_trade(self, trade_data: Dict) -> int:
        """Log a completed trade with real data."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                INSERT INTO trades
                (symbol, side, price, amount, cost, fee, order_id, strategy, pnl, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                trade_data['symbol'],
                trade_data['side'],
                trade_data['price'],
                trade_data['amount'],
                trade_data['cost'],
                trade_data.get('fee', 0),
                trade_data.get('order_id'),
                trade_data.get('strategy'),
                trade_data.get('pnl'),
                trade_data.get('notes')
            ))
            await db.commit()
            return cursor.lastrowid

    async def add_position(self, position_data: Dict):
        """Add or update an open position."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT OR REPLACE INTO positions
                (symbol, entry_price, amount, cost, current_price, stop_loss, take_profit, strategy)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                position_data['symbol'],
                position_data['entry_price'],
                position_data['amount'],
                position_data['cost'],
                position_data.get('current_price', position_data['entry_price']),
                position_data.get('stop_loss'),
                position_data.get('take_profit'),
                position_data.get('strategy')
            ))
            await db.commit()

    async def remove_position(self, symbol: str):
        """Remove a closed position."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM positions WHERE symbol = ?", (symbol,))
            await db.commit()

    async def get_open_positions(self) -> List[Dict]:
        """Get all currently open positions."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM positions") as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def update_position_price(self, symbol: str, current_price: float, unrealized_pnl: float):
        """Update position with current market price."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                UPDATE positions
                SET current_price = ?, unrealized_pnl = ?
                WHERE symbol = ?
            """, (current_price, unrealized_pnl, symbol))
            await db.commit()

    async def log_balance(self, balance_data: Dict):
        """Log current balance snapshot."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO balance_history
                (total_balance, available_balance, in_positions, daily_pnl, total_pnl)
                VALUES (?, ?, ?, ?, ?)
            """, (
                balance_data['total_balance'],
                balance_data['available_balance'],
                balance_data['in_positions'],
                balance_data.get('daily_pnl', 0),
                balance_data.get('total_pnl', 0)
            ))
            await db.commit()

    async def log_activity(self, level: str, message: str, data: Optional[Dict] = None):
        """Log bot activity."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO activity_log (level, message, data)
                VALUES (?, ?, ?)
            """, (level, message, json.dumps(data) if data else None))
            await db.commit()

    async def get_recent_trades(self, limit: int = 50) -> List[Dict]:
        """Get recent trade history."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT * FROM trades ORDER BY timestamp DESC LIMIT ?",
                (limit,)
            ) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def get_daily_stats(self) -> Dict:
        """Calculate real daily statistics."""
        async with aiosqlite.connect(self.db_path) as db:
            # Get today's trades
            async with db.execute("""
                SELECT
                    COUNT(*) as trade_count,
                    SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
                    SUM(pnl) as total_pnl,
                    AVG(pnl) as avg_pnl
                FROM trades
                WHERE DATE(timestamp) = DATE('now')
            """) as cursor:
                row = await cursor.fetchone()
                return {
                    'trade_count': row[0] or 0,
                    'winning_trades': row[1] or 0,
                    'total_pnl': row[2] or 0,
                    'avg_pnl': row[3] or 0
                }

    async def get_balance_history(self, days: int = 7) -> List[Dict]:
        """Get balance history for charting."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT * FROM balance_history
                WHERE timestamp >= datetime('now', '-' || ? || ' days')
                ORDER BY timestamp ASC
            """, (days,)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
