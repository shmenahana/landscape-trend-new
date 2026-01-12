"""
Real technical indicator calculations.
All functions perform actual mathematical calculations on real price data.
"""
import pandas as pd
import numpy as np
from typing import List, Tuple
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.trend import MACD, EMAIndicator, SMAIndicator
from ta.volatility import BollingerBands


def calculate_rsi(prices: List[float], period: int = 14) -> float:
    """
    Calculate real RSI (Relative Strength Index).

    Args:
        prices: List of closing prices
        period: RSI period (default 14)

    Returns:
        Current RSI value (0-100)
    """
    if len(prices) < period + 1:
        return 50.0  # Neutral if not enough data

    df = pd.DataFrame({'close': prices})
    rsi = RSIIndicator(close=df['close'], window=period)
    return float(rsi.rsi().iloc[-1])


def calculate_macd(prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[float, float, float]:
    """
    Calculate real MACD indicator.

    Returns:
        (macd_line, signal_line, histogram)
    """
    if len(prices) < slow + signal:
        return 0.0, 0.0, 0.0

    df = pd.DataFrame({'close': prices})
    macd = MACD(close=df['close'], window_slow=slow, window_fast=fast, window_sign=signal)

    macd_line = float(macd.macd().iloc[-1])
    signal_line = float(macd.macd_signal().iloc[-1])
    histogram = float(macd.macd_diff().iloc[-1])

    return macd_line, signal_line, histogram


def calculate_moving_averages(prices: List[float], periods: List[int] = [20, 50, 200]) -> dict:
    """
    Calculate real Simple Moving Averages.

    Returns:
        Dict with MA values for each period
    """
    result = {}
    df = pd.DataFrame({'close': prices})

    for period in periods:
        if len(prices) >= period:
            sma = SMAIndicator(close=df['close'], window=period)
            result[f'sma_{period}'] = float(sma.sma_indicator().iloc[-1])
        else:
            result[f'sma_{period}'] = None

    return result


def calculate_ema(prices: List[float], period: int = 20) -> float:
    """Calculate real Exponential Moving Average."""
    if len(prices) < period:
        return prices[-1] if prices else 0.0

    df = pd.DataFrame({'close': prices})
    ema = EMAIndicator(close=df['close'], window=period)
    return float(ema.ema_indicator().iloc[-1])


def calculate_bollinger_bands(prices: List[float], period: int = 20, std_dev: int = 2) -> Tuple[float, float, float]:
    """
    Calculate real Bollinger Bands.

    Returns:
        (upper_band, middle_band, lower_band)
    """
    if len(prices) < period:
        return 0.0, 0.0, 0.0

    df = pd.DataFrame({'close': prices})
    bb = BollingerBands(close=df['close'], window=period, window_dev=std_dev)

    upper = float(bb.bollinger_hband().iloc[-1])
    middle = float(bb.bollinger_mavg().iloc[-1])
    lower = float(bb.bollinger_lband().iloc[-1])

    return upper, middle, lower


def calculate_stochastic(highs: List[float], lows: List[float], closes: List[float], period: int = 14) -> Tuple[float, float]:
    """
    Calculate real Stochastic Oscillator.

    Returns:
        (k_line, d_line)
    """
    if len(closes) < period:
        return 50.0, 50.0

    df = pd.DataFrame({
        'high': highs,
        'low': lows,
        'close': closes
    })

    stoch = StochasticOscillator(
        high=df['high'],
        low=df['low'],
        close=df['close'],
        window=period,
        smooth_window=3
    )

    k = float(stoch.stoch().iloc[-1])
    d = float(stoch.stoch_signal().iloc[-1])

    return k, d


def calculate_volume_sma(volumes: List[float], period: int = 20) -> float:
    """Calculate volume moving average."""
    if len(volumes) < period:
        return np.mean(volumes) if volumes else 0.0

    return float(np.mean(volumes[-period:]))


def is_golden_cross(prices: List[float], short_period: int = 50, long_period: int = 200) -> bool:
    """
    Detect Golden Cross (bullish signal).
    Short MA crosses above Long MA.
    """
    if len(prices) < long_period + 2:
        return False

    df = pd.DataFrame({'close': prices})

    short_ma = SMAIndicator(close=df['close'], window=short_period).sma_indicator()
    long_ma = SMAIndicator(close=df['close'], window=long_period).sma_indicator()

    # Check if short MA crossed above long MA in last 2 periods
    prev_short = float(short_ma.iloc[-2])
    prev_long = float(long_ma.iloc[-2])
    curr_short = float(short_ma.iloc[-1])
    curr_long = float(long_ma.iloc[-1])

    return prev_short <= prev_long and curr_short > curr_long


def is_death_cross(prices: List[float], short_period: int = 50, long_period: int = 200) -> bool:
    """
    Detect Death Cross (bearish signal).
    Short MA crosses below Long MA.
    """
    if len(prices) < long_period + 2:
        return False

    df = pd.DataFrame({'close': prices})

    short_ma = SMAIndicator(close=df['close'], window=short_period).sma_indicator()
    long_ma = SMAIndicator(close=df['close'], window=long_period).sma_indicator()

    prev_short = float(short_ma.iloc[-2])
    prev_long = float(long_ma.iloc[-2])
    curr_short = float(short_ma.iloc[-1])
    curr_long = float(long_ma.iloc[-1])

    return prev_short >= prev_long and curr_short < curr_long


def calculate_atr(highs: List[float], lows: List[float], closes: List[float], period: int = 14) -> float:
    """
    Calculate Average True Range (for stop-loss sizing).
    """
    if len(closes) < period + 1:
        return 0.0

    true_ranges = []
    for i in range(1, len(closes)):
        high_low = highs[i] - lows[i]
        high_close = abs(highs[i] - closes[i - 1])
        low_close = abs(lows[i] - closes[i - 1])
        true_ranges.append(max(high_low, high_close, low_close))

    return float(np.mean(true_ranges[-period:]))


def get_trend_strength(prices: List[float]) -> str:
    """
    Determine trend strength: strong_up, weak_up, neutral, weak_down, strong_down.
    """
    if len(prices) < 50:
        return 'neutral'

    mas = calculate_moving_averages(prices, [20, 50])
    current_price = prices[-1]

    ma20 = mas['sma_20']
    ma50 = mas['sma_50']

    if ma20 is None or ma50 is None:
        return 'neutral'

    # Strong uptrend: price > MA20 > MA50, and spreading
    if current_price > ma20 > ma50:
        spread = (ma20 - ma50) / ma50 * 100
        return 'strong_up' if spread > 2 else 'weak_up'

    # Strong downtrend: price < MA20 < MA50
    if current_price < ma20 < ma50:
        spread = (ma50 - ma20) / ma50 * 100
        return 'strong_down' if spread > 2 else 'weak_down'

    return 'neutral'


def calculate_all_indicators(ohlcv_data: List[List]) -> dict:
    """
    Calculate all indicators from OHLCV data.

    Args:
        ohlcv_data: List of [timestamp, open, high, low, close, volume]

    Returns:
        Dict with all calculated indicators
    """
    if not ohlcv_data or len(ohlcv_data) < 2:
        return {}

    # Extract data
    timestamps = [x[0] for x in ohlcv_data]
    opens = [x[1] for x in ohlcv_data]
    highs = [x[2] for x in ohlcv_data]
    lows = [x[3] for x in ohlcv_data]
    closes = [x[4] for x in ohlcv_data]
    volumes = [x[5] for x in ohlcv_data]

    current_price = closes[-1]

    # Calculate all indicators
    rsi = calculate_rsi(closes)
    macd_line, signal_line, macd_hist = calculate_macd(closes)
    mas = calculate_moving_averages(closes, [20, 50, 200])
    bb_upper, bb_middle, bb_lower = calculate_bollinger_bands(closes)
    stoch_k, stoch_d = calculate_stochastic(highs, lows, closes)
    atr = calculate_atr(highs, lows, closes)
    trend = get_trend_strength(closes)
    vol_avg = calculate_volume_sma(volumes)

    return {
        'price': current_price,
        'rsi': rsi,
        'macd': {
            'line': macd_line,
            'signal': signal_line,
            'histogram': macd_hist
        },
        'moving_averages': mas,
        'bollinger_bands': {
            'upper': bb_upper,
            'middle': bb_middle,
            'lower': bb_lower
        },
        'stochastic': {
            'k': stoch_k,
            'd': stoch_d
        },
        'atr': atr,
        'trend': trend,
        'volume': volumes[-1],
        'volume_avg': vol_avg,
        'volume_ratio': volumes[-1] / vol_avg if vol_avg > 0 else 1.0
    }
