"""
Real exchange connector using CCXT library.
Handles actual API connections, order placement, and data fetching.
"""
import ccxt
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ExchangeConnector:
    def __init__(self, exchange_id: str, api_key: str, api_secret: str, testnet: bool = True):
        """
        Initialize real exchange connection.

        Args:
            exchange_id: Exchange name (e.g., 'binance')
            api_key: Real API key
            api_secret: Real API secret
            testnet: Use testnet if True (recommended for testing)
        """
        self.exchange_id = exchange_id
        self.testnet = testnet

        # Create real exchange instance
        exchange_class = getattr(ccxt, exchange_id)

        config = {
            'apiKey': api_key,
            'secret': api_secret,
            'enableRateLimit': True,
            'options': {
                'defaultType': 'spot',
            }
        }

        # Use testnet URLs if enabled
        if testnet and exchange_id == 'binance':
            config['urls'] = {
                'api': {
                    'public': 'https://testnet.binance.vision/api',
                    'private': 'https://testnet.binance.vision/api',
                }
            }

        self.exchange = exchange_class(config)
        self.exchange.set_sandbox_mode(testnet)

        logger.info(f"Initialized {exchange_id} connector (testnet={testnet})")

    async def get_balance(self) -> Dict:
        """Fetch real account balance."""
        try:
            balance = await asyncio.to_thread(self.exchange.fetch_balance)
            return {
                'total': balance['total'],
                'free': balance['free'],
                'used': balance['used'],
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error fetching balance: {e}")
            raise

    async def get_ticker(self, symbol: str) -> Dict:
        """Fetch real-time ticker data for a symbol."""
        try:
            ticker = await asyncio.to_thread(self.exchange.fetch_ticker, symbol)
            return {
                'symbol': symbol,
                'bid': ticker['bid'],
                'ask': ticker['ask'],
                'last': ticker['last'],
                'volume': ticker['baseVolume'],
                'timestamp': ticker['timestamp']
            }
        except Exception as e:
            logger.error(f"Error fetching ticker for {symbol}: {e}")
            raise

    async def get_ohlcv(self, symbol: str, timeframe: str = '1h', limit: int = 100) -> List:
        """
        Fetch real OHLCV (candlestick) data.

        Args:
            symbol: Trading pair (e.g., 'BTC/USDT')
            timeframe: Candle timeframe ('1m', '5m', '1h', '1d')
            limit: Number of candles

        Returns:
            List of [timestamp, open, high, low, close, volume]
        """
        try:
            ohlcv = await asyncio.to_thread(
                self.exchange.fetch_ohlcv,
                symbol,
                timeframe,
                limit=limit
            )
            return ohlcv
        except Exception as e:
            logger.error(f"Error fetching OHLCV for {symbol}: {e}")
            raise

    async def create_market_order(self, symbol: str, side: str, amount: float) -> Dict:
        """
        Place a real market order.

        Args:
            symbol: Trading pair (e.g., 'BTC/USDT')
            side: 'buy' or 'sell'
            amount: Amount in base currency

        Returns:
            Order details
        """
        try:
            logger.info(f"Placing {side} market order: {amount} {symbol}")
            order = await asyncio.to_thread(
                self.exchange.create_market_order,
                symbol,
                side,
                amount
            )

            logger.info(f"Order executed: {order['id']}")
            return {
                'id': order['id'],
                'symbol': order['symbol'],
                'side': order['side'],
                'type': order['type'],
                'price': order.get('average') or order.get('price'),
                'amount': order['amount'],
                'cost': order['cost'],
                'fee': order.get('fee', {}).get('cost', 0),
                'status': order['status'],
                'timestamp': order['timestamp']
            }
        except Exception as e:
            logger.error(f"Error placing order: {e}")
            raise

    async def create_limit_order(self, symbol: str, side: str, amount: float, price: float) -> Dict:
        """Place a real limit order."""
        try:
            logger.info(f"Placing {side} limit order: {amount} {symbol} @ {price}")
            order = await asyncio.to_thread(
                self.exchange.create_limit_order,
                symbol,
                side,
                amount,
                price
            )

            return {
                'id': order['id'],
                'symbol': order['symbol'],
                'side': order['side'],
                'type': order['type'],
                'price': order['price'],
                'amount': order['amount'],
                'status': order['status'],
                'timestamp': order['timestamp']
            }
        except Exception as e:
            logger.error(f"Error placing limit order: {e}")
            raise

    async def cancel_order(self, order_id: str, symbol: str) -> bool:
        """Cancel an open order."""
        try:
            await asyncio.to_thread(self.exchange.cancel_order, order_id, symbol)
            logger.info(f"Cancelled order {order_id}")
            return True
        except Exception as e:
            logger.error(f"Error cancelling order: {e}")
            return False

    async def get_open_orders(self, symbol: Optional[str] = None) -> List[Dict]:
        """Get all open orders."""
        try:
            orders = await asyncio.to_thread(self.exchange.fetch_open_orders, symbol)
            return [{
                'id': order['id'],
                'symbol': order['symbol'],
                'side': order['side'],
                'type': order['type'],
                'price': order['price'],
                'amount': order['amount'],
                'status': order['status']
            } for order in orders]
        except Exception as e:
            logger.error(f"Error fetching open orders: {e}")
            return []

    async def get_order_book(self, symbol: str, limit: int = 20) -> Dict:
        """Fetch real order book data."""
        try:
            order_book = await asyncio.to_thread(
                self.exchange.fetch_order_book,
                symbol,
                limit
            )
            return {
                'symbol': symbol,
                'bids': order_book['bids'][:limit],  # [price, amount]
                'asks': order_book['asks'][:limit],
                'timestamp': order_book['timestamp']
            }
        except Exception as e:
            logger.error(f"Error fetching order book: {e}")
            raise

    async def test_connection(self) -> bool:
        """Test if exchange connection works."""
        try:
            await asyncio.to_thread(self.exchange.fetch_status)
            markets = await asyncio.to_thread(self.exchange.load_markets)
            logger.info(f"Connection successful! {len(markets)} markets available")
            return True
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False

    def get_min_order_amount(self, symbol: str) -> float:
        """Get minimum order amount for a symbol."""
        try:
            market = self.exchange.market(symbol)
            return market['limits']['amount']['min']
        except:
            return 0.001  # Default fallback

    def get_price_precision(self, symbol: str) -> int:
        """Get price precision for a symbol."""
        try:
            market = self.exchange.market(symbol)
            return market['precision']['price']
        except:
            return 2  # Default fallback
