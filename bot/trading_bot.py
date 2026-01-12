"""
Main trading bot engine that orchestrates all components.
This is a fully functional bot that makes real trading decisions.
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import signal
import sys

from .exchange import ExchangeConnector
from .database import Database
from .indicators import calculate_all_indicators
from .strategies import get_strategy, Signal
from .risk_manager import RiskManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('trading_bot.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


class TradingBot:
    """
    Fully functional cryptocurrency trading bot.
    Makes real decisions and executes real trades.
    """

    def __init__(self, config: Dict):
        """
        Initialize trading bot with real configuration.

        Args:
            config: Bot configuration including exchange, strategy, risk parameters
        """
        self.config = config
        self.running = False

        # Initialize real components
        self.exchange = ExchangeConnector(
            exchange_id=config['exchange'],
            api_key=config['api_key'],
            api_secret=config['api_secret'],
            testnet=config.get('use_testnet', True)
        )

        self.database = Database(config.get('db_path', 'trading_bot.db'))

        self.strategy = get_strategy(
            config['strategy'],
            config
        )

        self.risk_manager = RiskManager({
            'initial_capital': config['initial_capital'],
            'max_position_size': config['max_position_size'],
            'max_daily_loss': config['max_daily_loss'],
            'max_open_positions': config['max_open_positions'],
            'risk_per_trade_percent': config.get('risk_per_trade_percent', 2),
            'stop_loss_percent': config['stop_loss_percent'],
            'take_profit_percent': config['take_profit_percent']
        })

        # Bot state
        self.trading_pairs = config['trading_pairs']
        self.check_interval = config.get('check_interval_seconds', 60)
        self.last_daily_reset = datetime.now().date()

        logger.info(f"Trading Bot initialized: strategy={config['strategy']}, "
                   f"pairs={self.trading_pairs}, interval={self.check_interval}s")

    async def initialize(self):
        """Initialize database and test exchange connection."""
        logger.info("Initializing bot...")

        # Initialize database
        await self.database.initialize()
        await self.database.log_activity('INFO', 'Bot starting up', {'config': self.config})

        # Test exchange connection
        connected = await self.exchange.test_connection()
        if not connected:
            raise Exception("Failed to connect to exchange")

        logger.info("Bot initialization complete")

    async def run(self):
        """Main bot loop - runs continuously and makes real trading decisions."""
        self.running = True
        logger.info("Bot started - entering main trading loop")

        # Set up graceful shutdown
        signal.signal(signal.SIGINT, self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)

        while self.running:
            try:
                # Check if we need to reset daily stats
                await self._check_daily_reset()

                # Main trading cycle for each pair
                for symbol in self.trading_pairs:
                    await self._process_symbol(symbol)

                # Update portfolio state
                await self._update_portfolio()

                # Wait before next cycle
                logger.info(f"Cycle complete. Waiting {self.check_interval}s...")
                await asyncio.sleep(self.check_interval)

            except Exception as e:
                logger.error(f"Error in main loop: {e}", exc_info=True)
                await self.database.log_activity('ERROR', f'Main loop error: {str(e)}')
                await asyncio.sleep(10)  # Wait before retrying

        logger.info("Bot stopped")

    async def _process_symbol(self, symbol: str):
        """
        Process a single trading pair - the core trading logic.

        This is where real analysis and trading happens.
        """
        logger.info(f"Processing {symbol}...")

        try:
            # 1. Fetch real market data
            ohlcv = await self.exchange.get_ohlcv(symbol, timeframe='1h', limit=200)
            ticker = await self.exchange.get_ticker(symbol)

            if not ohlcv:
                logger.warning(f"No data for {symbol}")
                return

            # 2. Calculate real technical indicators
            indicators = calculate_all_indicators(ohlcv)

            if not indicators:
                logger.warning(f"Could not calculate indicators for {symbol}")
                return

            logger.info(f"{symbol} - Price: ${indicators['price']:.2f}, "
                       f"RSI: {indicators['rsi']:.1f}, "
                       f"Trend: {indicators['trend']}, "
                       f"MACD: {indicators['macd']['histogram']:.4f}")

            # 3. Check if we have an open position
            open_positions = await self.database.get_open_positions()
            current_position = next((p for p in open_positions if p['symbol'] == symbol), None)

            # 4. Get trading signal from strategy
            signal = self.strategy.analyze(indicators, current_position)

            # 5. Execute trading decision
            if signal == Signal.BUY and not current_position:
                await self._execute_buy(symbol, indicators, open_positions)

            elif signal == Signal.SELL and current_position:
                await self._execute_sell(symbol, indicators, current_position)

            elif current_position:
                # Update position with current price
                await self._update_position(symbol, current_position, indicators['price'])

        except Exception as e:
            logger.error(f"Error processing {symbol}: {e}", exc_info=True)
            await self.database.log_activity('ERROR', f'Error processing {symbol}', {'error': str(e)})

    async def _execute_buy(self, symbol: str, indicators: Dict, open_positions: List[Dict]):
        """Execute a real buy order."""
        try:
            # Get current balance
            balance = await self.exchange.get_balance()
            quote_currency = symbol.split('/')[1]  # e.g., USDT from BTC/USDT
            available_balance = balance['free'].get(quote_currency, 0)

            logger.info(f"Buy signal for {symbol}. Available balance: {available_balance:.2f} {quote_currency}")

            # Check risk management
            can_trade, reason = self.risk_manager.can_open_position(available_balance, open_positions)
            if not can_trade:
                logger.warning(f"Cannot open position: {reason}")
                return

            # Calculate position size
            current_price = indicators['price']
            amount = self.risk_manager.calculate_position_size(current_price, available_balance)

            # Adjust for volatility
            atr = indicators.get('atr', 0)
            amount = self.risk_manager.adjust_position_size_for_volatility(amount, atr, current_price)

            # Get minimum order amount
            min_amount = self.exchange.get_min_order_amount(symbol)

            # Validate order
            is_valid, msg = self.risk_manager.validate_order(
                symbol, 'buy', amount, current_price, available_balance, min_amount
            )

            if not is_valid:
                logger.warning(f"Order validation failed: {msg}")
                return

            # Execute real market order
            logger.info(f"EXECUTING BUY: {amount:.6f} {symbol} @ ${current_price:.2f}")

            order = await self.exchange.create_market_order(symbol, 'buy', amount)

            # Calculate stop loss and take profit
            entry_price = order['price']
            stop_loss = self.risk_manager.calculate_stop_loss(entry_price)
            take_profit = self.risk_manager.calculate_take_profit(entry_price)

            # Log trade in database
            await self.database.log_trade({
                'symbol': symbol,
                'side': 'buy',
                'price': entry_price,
                'amount': order['amount'],
                'cost': order['cost'],
                'fee': order['fee'],
                'order_id': order['id'],
                'strategy': self.strategy.name,
                'pnl': 0,
                'notes': f"Entry - SL: ${stop_loss:.2f}, TP: ${take_profit:.2f}"
            })

            # Add position
            await self.database.add_position({
                'symbol': symbol,
                'entry_price': entry_price,
                'amount': order['amount'],
                'cost': order['cost'],
                'current_price': entry_price,
                'stop_loss': stop_loss,
                'take_profit': take_profit,
                'strategy': self.strategy.name
            })

            await self.database.log_activity(
                'INFO',
                f'Buy executed: {symbol}',
                {'order': order, 'stop_loss': stop_loss, 'take_profit': take_profit}
            )

            logger.info(f"✓ BUY ORDER FILLED: {order['amount']:.6f} {symbol} @ ${entry_price:.2f} "
                       f"(cost: ${order['cost']:.2f}, SL: ${stop_loss:.2f}, TP: ${take_profit:.2f})")

        except Exception as e:
            logger.error(f"Error executing buy: {e}", exc_info=True)
            await self.database.log_activity('ERROR', f'Buy execution failed for {symbol}', {'error': str(e)})

    async def _execute_sell(self, symbol: str, indicators: Dict, position: Dict):
        """Execute a real sell order."""
        try:
            current_price = indicators['price']
            amount = position['amount']
            entry_price = position['entry_price']

            logger.info(f"Sell signal for {symbol}. Closing position of {amount:.6f} @ ${current_price:.2f}")

            # Execute real market order
            logger.info(f"EXECUTING SELL: {amount:.6f} {symbol} @ ${current_price:.2f}")

            order = await self.exchange.create_market_order(symbol, 'sell', amount)

            # Calculate P&L
            sell_price = order['price']
            pnl = (sell_price - entry_price) * order['amount'] - order['fee']
            pnl_percent = ((sell_price - entry_price) / entry_price) * 100

            # Log trade
            await self.database.log_trade({
                'symbol': symbol,
                'side': 'sell',
                'price': sell_price,
                'amount': order['amount'],
                'cost': order['cost'],
                'fee': order['fee'],
                'order_id': order['id'],
                'strategy': self.strategy.name,
                'pnl': pnl,
                'notes': f"Exit - Entry: ${entry_price:.2f}, P&L: {pnl_percent:.2f}%"
            })

            # Remove position
            await self.database.remove_position(symbol)

            # Update risk manager
            self.risk_manager.update_daily_pnl(pnl)

            await self.database.log_activity(
                'INFO',
                f'Sell executed: {symbol}',
                {'order': order, 'pnl': pnl, 'pnl_percent': pnl_percent}
            )

            logger.info(f"✓ SELL ORDER FILLED: {order['amount']:.6f} {symbol} @ ${sell_price:.2f} "
                       f"(P&L: ${pnl:.2f} / {pnl_percent:.2f}%)")

        except Exception as e:
            logger.error(f"Error executing sell: {e}", exc_info=True)
            await self.database.log_activity('ERROR', f'Sell execution failed for {symbol}', {'error': str(e)})

    async def _update_position(self, symbol: str, position: Dict, current_price: float):
        """Update position with current price and check stop loss / take profit."""
        entry_price = position['entry_price']
        unrealized_pnl = (current_price - entry_price) * position['amount']
        pnl_percent = ((current_price - entry_price) / entry_price) * 100

        await self.database.update_position_price(symbol, current_price, unrealized_pnl)

        # Check if stop loss or take profit should trigger
        should_close, reason = self.risk_manager.should_close_position(position, current_price)

        if should_close:
            logger.info(f"Position trigger: {symbol} - {reason}")
            # This will be handled in next cycle by strategy returning SELL signal

        logger.debug(f"{symbol} position updated: ${current_price:.2f} "
                    f"(P&L: ${unrealized_pnl:.2f} / {pnl_percent:.2f}%)")

    async def _update_portfolio(self):
        """Update portfolio balance and statistics."""
        try:
            balance = await self.exchange.get_balance()
            open_positions = await self.database.get_open_positions()

            # Calculate total balance
            total_usdt = balance['total'].get('USDT', 0)

            # Add value of open positions
            for pos in open_positions:
                total_usdt += pos['cost'] + pos.get('unrealized_pnl', 0)

            available_usdt = balance['free'].get('USDT', 0)
            in_positions = total_usdt - available_usdt

            # Get daily stats
            daily_stats = await self.database.get_daily_stats()

            # Log balance
            await self.database.log_balance({
                'total_balance': total_usdt,
                'available_balance': available_usdt,
                'in_positions': in_positions,
                'daily_pnl': daily_stats['total_pnl'],
                'total_pnl': total_usdt - self.config['initial_capital']
            })

            risk_metrics = self.risk_manager.get_risk_metrics(available_usdt, open_positions)

            logger.info(f"Portfolio: ${total_usdt:.2f} total, ${available_usdt:.2f} available, "
                       f"{len(open_positions)} positions, Daily P&L: ${daily_stats['total_pnl']:.2f}")

        except Exception as e:
            logger.error(f"Error updating portfolio: {e}")

    async def _check_daily_reset(self):
        """Check if we need to reset daily statistics."""
        current_date = datetime.now().date()
        if current_date > self.last_daily_reset:
            logger.info(f"New day detected. Resetting daily statistics.")
            self.risk_manager.reset_daily_stats()
            self.last_daily_reset = current_date

    def _handle_shutdown(self, signum, frame):
        """Handle graceful shutdown."""
        logger.info("Shutdown signal received. Stopping bot...")
        self.running = False

    async def stop(self):
        """Stop the bot gracefully."""
        logger.info("Stopping bot...")
        self.running = False

        # Log shutdown
        await self.database.log_activity('INFO', 'Bot shutting down')

        # Get final portfolio state
        open_positions = await self.database.get_open_positions()
        if open_positions:
            logger.warning(f"Bot stopped with {len(open_positions)} open positions:")
            for pos in open_positions:
                logger.warning(f"  - {pos['symbol']}: {pos['amount']:.6f} @ ${pos['entry_price']:.2f}")

        logger.info("Bot stopped successfully")
