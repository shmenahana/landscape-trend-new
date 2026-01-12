"""
Real trading strategies with actual buy/sell logic.
Each strategy analyzes real market data and returns concrete trading decisions.
"""
from typing import Dict, Optional, List
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class Signal(Enum):
    """Trading signals."""
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


class TradingStrategy:
    """Base class for trading strategies."""

    def __init__(self, config: Dict):
        self.config = config
        self.name = self.__class__.__name__

    def analyze(self, indicators: Dict, position: Optional[Dict] = None) -> Signal:
        """
        Analyze indicators and return trading signal.

        Args:
            indicators: Dict of calculated indicators
            position: Current position if any

        Returns:
            Signal (BUY, SELL, or HOLD)
        """
        raise NotImplementedError


class MeanReversionStrategy(TradingStrategy):
    """
    Real mean reversion strategy.
    Buys when oversold, sells when overbought.
    """

    def analyze(self, indicators: Dict, position: Optional[Dict] = None) -> Signal:
        """
        Buy when RSI < 30 and price below MA20.
        Sell when RSI > 70 or profit target reached.
        """
        rsi = indicators.get('rsi', 50)
        price = indicators.get('price', 0)
        ma20 = indicators['moving_averages'].get('sma_20')

        # If we have a position, check exit conditions
        if position:
            entry_price = position['entry_price']
            pnl_percent = ((price - entry_price) / entry_price) * 100

            # Take profit at 3%
            if pnl_percent >= 3.0:
                logger.info(f"Mean reversion: SELL signal (take profit: {pnl_percent:.2f}%)")
                return Signal.SELL

            # Exit if overbought
            if rsi > 70:
                logger.info(f"Mean reversion: SELL signal (overbought RSI: {rsi:.1f})")
                return Signal.SELL

            # Stop loss at -2%
            if pnl_percent <= -2.0:
                logger.info(f"Mean reversion: SELL signal (stop loss: {pnl_percent:.2f}%)")
                return Signal.SELL

            return Signal.HOLD

        # Entry conditions: oversold and below MA
        if rsi < 30:
            if ma20 and price < ma20:
                logger.info(f"Mean reversion: BUY signal (RSI: {rsi:.1f}, Price below MA20)")
                return Signal.BUY

        return Signal.HOLD


class MomentumStrategy(TradingStrategy):
    """
    Real momentum strategy.
    Follows strong trends using MACD and moving averages.
    """

    def analyze(self, indicators: Dict, position: Optional[Dict] = None) -> Signal:
        """
        Buy on MACD bullish crossover with trend confirmation.
        Sell on MACD bearish crossover or stop loss.
        """
        macd = indicators['macd']
        macd_line = macd['line']
        signal_line = macd['signal']
        macd_hist = macd['histogram']

        price = indicators['price']
        trend = indicators.get('trend', 'neutral')

        # If we have a position, check exit conditions
        if position:
            entry_price = position['entry_price']
            pnl_percent = ((price - entry_price) / entry_price) * 100

            # Take profit at 4%
            if pnl_percent >= 4.0:
                logger.info(f"Momentum: SELL signal (take profit: {pnl_percent:.2f}%)")
                return Signal.SELL

            # MACD bearish crossover
            if macd_line < signal_line and macd_hist < 0:
                logger.info(f"Momentum: SELL signal (MACD bearish crossover)")
                return Signal.SELL

            # Stop loss at -2%
            if pnl_percent <= -2.0:
                logger.info(f"Momentum: SELL signal (stop loss: {pnl_percent:.2f}%)")
                return Signal.SELL

            return Signal.HOLD

        # Entry: MACD bullish crossover with uptrend
        if macd_line > signal_line and macd_hist > 0:
            if trend in ['strong_up', 'weak_up']:
                logger.info(f"Momentum: BUY signal (MACD bullish, trend: {trend})")
                return Signal.BUY

        return Signal.HOLD


class BreakoutStrategy(TradingStrategy):
    """
    Real breakout strategy.
    Trades breakouts from Bollinger Bands with volume confirmation.
    """

    def analyze(self, indicators: Dict, position: Optional[Dict] = None) -> Signal:
        """
        Buy when price breaks above upper Bollinger Band with volume.
        Sell when price returns to middle band or stop loss.
        """
        price = indicators['price']
        bb = indicators['bollinger_bands']
        bb_upper = bb['upper']
        bb_middle = bb['middle']
        bb_lower = bb['lower']

        volume_ratio = indicators.get('volume_ratio', 1.0)

        # If we have a position
        if position:
            entry_price = position['entry_price']
            pnl_percent = ((price - entry_price) / entry_price) * 100

            # Take profit at 2.5%
            if pnl_percent >= 2.5:
                logger.info(f"Breakout: SELL signal (take profit: {pnl_percent:.2f}%)")
                return Signal.SELL

            # Price returned to middle band
            if price <= bb_middle:
                logger.info(f"Breakout: SELL signal (price returned to middle band)")
                return Signal.SELL

            # Stop loss at -1.5%
            if pnl_percent <= -1.5:
                logger.info(f"Breakout: SELL signal (stop loss: {pnl_percent:.2f}%)")
                return Signal.SELL

            return Signal.HOLD

        # Entry: breakout above upper band with volume
        if price > bb_upper and volume_ratio > 1.5:
            logger.info(f"Breakout: BUY signal (price above BB upper, volume: {volume_ratio:.2f}x)")
            return Signal.BUY

        # Alternative: bounce from lower band
        if price < bb_lower and volume_ratio > 1.3:
            logger.info(f"Breakout: BUY signal (bounce from BB lower, volume: {volume_ratio:.2f}x)")
            return Signal.BUY

        return Signal.HOLD


class ScalpingStrategy(TradingStrategy):
    """
    Real scalping strategy for quick profits.
    Multiple small trades with tight stop losses.
    """

    def analyze(self, indicators: Dict, position: Optional[Dict] = None) -> Signal:
        """
        Quick entries on RSI extremes with fast exits.
        """
        rsi = indicators['rsi']
        price = indicators['price']
        stoch = indicators['stochastic']
        stoch_k = stoch['k']

        # If we have a position, exit quickly
        if position:
            entry_price = position['entry_price']
            pnl_percent = ((price - entry_price) / entry_price) * 100

            # Quick take profit at 0.8%
            if pnl_percent >= 0.8:
                logger.info(f"Scalping: SELL signal (quick profit: {pnl_percent:.2f}%)")
                return Signal.SELL

            # Tight stop loss at -0.5%
            if pnl_percent <= -0.5:
                logger.info(f"Scalping: SELL signal (stop loss: {pnl_percent:.2f}%)")
                return Signal.SELL

            # Exit if momentum reverses
            if rsi > 60 or stoch_k > 70:
                logger.info(f"Scalping: SELL signal (momentum reversal)")
                return Signal.SELL

            return Signal.HOLD

        # Entry: extreme oversold
        if rsi < 25 and stoch_k < 20:
            logger.info(f"Scalping: BUY signal (extreme oversold: RSI {rsi:.1f}, Stoch {stoch_k:.1f})")
            return Signal.BUY

        return Signal.HOLD


class ComboStrategy(TradingStrategy):
    """
    Real combination strategy using multiple confirmations.
    Most conservative, highest probability trades.
    """

    def analyze(self, indicators: Dict, position: Optional[Dict] = None) -> Signal:
        """
        Requires multiple indicator confirmations for entries.
        """
        rsi = indicators['rsi']
        price = indicators['price']
        macd = indicators['macd']
        mas = indicators['moving_averages']
        trend = indicators['trend']
        volume_ratio = indicators.get('volume_ratio', 1.0)

        # If we have a position
        if position:
            entry_price = position['entry_price']
            pnl_percent = ((price - entry_price) / entry_price) * 100

            # Take profit at 3.5%
            if pnl_percent >= 3.5:
                logger.info(f"Combo: SELL signal (take profit: {pnl_percent:.2f}%)")
                return Signal.SELL

            # Exit if trend weakens
            if trend in ['weak_down', 'strong_down']:
                logger.info(f"Combo: SELL signal (trend turned {trend})")
                return Signal.SELL

            # MACD bearish
            if macd['line'] < macd['signal']:
                logger.info(f"Combo: SELL signal (MACD bearish)")
                return Signal.SELL

            # Stop loss at -2%
            if pnl_percent <= -2.0:
                logger.info(f"Combo: SELL signal (stop loss: {pnl_percent:.2f}%)")
                return Signal.SELL

            return Signal.HOLD

        # Entry: Multiple confirmations required
        confirmations = 0
        reasons = []

        # Check RSI
        if 30 < rsi < 45:
            confirmations += 1
            reasons.append(f"RSI={rsi:.1f}")

        # Check MACD
        if macd['line'] > macd['signal'] and macd['histogram'] > 0:
            confirmations += 1
            reasons.append("MACD bullish")

        # Check trend
        if trend in ['strong_up', 'weak_up']:
            confirmations += 1
            reasons.append(f"trend={trend}")

        # Check volume
        if volume_ratio > 1.2:
            confirmations += 1
            reasons.append(f"volume={volume_ratio:.2f}x")

        # Check price vs MA20
        ma20 = mas.get('sma_20')
        if ma20 and price > ma20:
            confirmations += 1
            reasons.append("price>MA20")

        # Need at least 3 confirmations
        if confirmations >= 3:
            logger.info(f"Combo: BUY signal ({confirmations} confirmations: {', '.join(reasons)})")
            return Signal.BUY

        return Signal.HOLD


# Strategy factory
STRATEGIES = {
    'mean_reversion': MeanReversionStrategy,
    'momentum': MomentumStrategy,
    'breakout': BreakoutStrategy,
    'scalping': ScalpingStrategy,
    'combo': ComboStrategy
}


def get_strategy(strategy_name: str, config: Dict) -> TradingStrategy:
    """Get strategy instance by name."""
    strategy_class = STRATEGIES.get(strategy_name.lower())
    if not strategy_class:
        raise ValueError(f"Unknown strategy: {strategy_name}. Available: {list(STRATEGIES.keys())}")

    return strategy_class(config)
