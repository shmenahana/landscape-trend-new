# Crypto Trading Bot

A **fully functional** automated cryptocurrency trading bot with real-time analysis, multiple strategies, risk management, and a live dashboard.

## Features

✅ **Real Exchange Integration** - Connects to Binance (testnet & live) via CCXT
✅ **Multiple Trading Strategies** - Mean reversion, momentum, breakout, scalping, combo
✅ **Technical Analysis** - RSI, MACD, Moving Averages, Bollinger Bands, Stochastic
✅ **Risk Management** - Position sizing, stop-loss, take-profit, daily loss limits
✅ **Real-time Dashboard** - Monitor trades, positions, and performance
✅ **Complete Logging** - SQLite database tracks all trades and activity
✅ **Paper Trading** - Test with Binance testnet before risking real money

## Quick Start

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies for dashboard
npm install
```

### 2. Get API Keys

**For Safe Testing (Recommended):**
1. Visit https://testnet.binance.vision/
2. Create an account (no real money needed)
3. Generate API Key and Secret

**For Live Trading:**
1. Visit https://www.binance.com
2. Enable API in your account settings
3. Generate API Key with trading permissions

### 3. Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env with your API keys
nano .env
```

Required settings:
```env
API_KEY=your_binance_testnet_api_key
API_SECRET=your_binance_testnet_secret
USE_TESTNET=true

INITIAL_CAPITAL=10000
TRADING_PAIRS=BTC/USDT,ETH/USDT
STRATEGY=mean_reversion
```

### 4. Run the Bot

**Terminal 1 - Start the trading bot:**
```bash
python main.py
```

**Terminal 2 - Start the API server:**
```bash
python api_server.py
```

**Terminal 3 - Start the dashboard:**
```bash
npm run dev
```

**Open Dashboard:**
Visit http://localhost:3000

## Trading Strategies

### Mean Reversion
- **Entry:** RSI < 30, price below MA20
- **Exit:** RSI > 70 or +3% profit or -2% stop loss
- **Best for:** Ranging markets

### Momentum
- **Entry:** MACD bullish crossover + uptrend
- **Exit:** MACD bearish crossover or +4% profit or -2% stop loss
- **Best for:** Trending markets

### Breakout
- **Entry:** Price breaks Bollinger Bands with volume
- **Exit:** Price returns to middle band or +2.5% profit
- **Best for:** Volatile markets

### Scalping
- **Entry:** Extreme RSI/Stochastic levels
- **Exit:** Quick +0.8% profit or -0.5% stop loss
- **Best for:** High-frequency trading

### Combo (Recommended)
- **Entry:** Requires 3+ confirmations (RSI, MACD, trend, volume, MA)
- **Exit:** Trend reversal or +3.5% profit or -2% stop loss
- **Best for:** Conservative, high-probability trades

## Risk Management

The bot enforces multiple safety mechanisms:

- **Position Sizing:** Max $1000 per trade (configurable)
- **Daily Loss Limit:** Stops trading after -$100 loss per day
- **Stop Loss:** Automatic -2% stop loss on every trade
- **Take Profit:** Automatic profit targets
- **Max Positions:** Limits concurrent open positions to 3
- **Volatility Adjustment:** Reduces position size in high volatility

## Configuration Options

Edit `.env` to customize:

```env
# Trading pairs (comma-separated)
TRADING_PAIRS=BTC/USDT,ETH/USDT,SOL/USDT

# Capital management
INITIAL_CAPITAL=10000
MAX_POSITION_SIZE=1000
MAX_DAILY_LOSS=100
MAX_OPEN_POSITIONS=3

# Risk parameters
RISK_PER_TRADE_PERCENT=2
STOP_LOSS_PERCENT=2
TAKE_PROFIT_PERCENT=3

# Strategy selection
STRATEGY=combo  # mean_reversion, momentum, breakout, scalping, combo

# Trading frequency
CHECK_INTERVAL_SECONDS=60  # Check market every 60 seconds

# Technical indicator thresholds
RSI_OVERSOLD=30
RSI_OVERBOUGHT=70
```

## Dashboard Features

- **Real-time Balance:** Total balance, daily P&L, total P&L
- **Open Positions:** Live tracking with unrealized P&L
- **Trade History:** Complete log of all executed trades
- **Performance Metrics:** Win rate, trade count, profit statistics
- **Auto-refresh:** Updates every 10 seconds

## Safety Recommendations

1. **Start with Testnet:** Always test with paper trading first
2. **Small Capital:** Start with small amounts when going live
3. **Monitor Daily:** Check the dashboard regularly
4. **Set Conservative Limits:** Use tight stop-losses initially
5. **One Strategy:** Master one strategy before trying others
6. **Market Conditions:** Different strategies work in different market conditions

## How It Works

1. **Data Collection:** Fetches real-time OHLCV data from exchange every 60s
2. **Technical Analysis:** Calculates RSI, MACD, moving averages, etc.
3. **Signal Generation:** Strategy analyzes indicators and generates BUY/SELL/HOLD
4. **Risk Check:** Validates against position limits and daily loss
5. **Order Execution:** Places real market orders on exchange
6. **Position Monitoring:** Tracks stop-loss and take-profit levels
7. **Database Logging:** Records all activity for analysis

## File Structure

```
.
├── bot/
│   ├── __init__.py           # Package initialization
│   ├── trading_bot.py        # Main bot engine
│   ├── exchange.py           # Exchange API connector
│   ├── database.py           # SQLite database
│   ├── indicators.py         # Technical indicators
│   ├── strategies.py         # Trading strategies
│   └── risk_manager.py       # Risk management
├── pages/
│   └── index.js              # Dashboard UI
├── main.py                   # Bot entry point
├── api_server.py             # FastAPI backend
├── requirements.txt          # Python dependencies
├── package.json              # Node.js dependencies
└── .env                      # Configuration (create from .env.example)
```

## Troubleshooting

**Bot won't connect:**
- Check API keys in `.env`
- Verify testnet is enabled: `USE_TESTNET=true`
- Ensure Binance testnet is accessible

**No trades executing:**
- Check if market conditions meet strategy criteria
- Verify sufficient balance in testnet account
- Review bot logs in `trading_bot.log`

**Dashboard not loading:**
- Ensure API server is running on port 8000
- Check browser console for errors
- Verify Next.js dev server is running

## Real Capital Requirements

For $50/day profit target:
- **$5,000:** Requires 1% daily return (very aggressive, high risk)
- **$10,000:** Requires 0.5% daily return (aggressive)
- **$25,000:** Requires 0.2% daily return (more realistic)

## Legal Disclaimer

This bot is for educational purposes. Cryptocurrency trading carries significant risk. You can lose money. Past performance does not guarantee future results. Only trade with money you can afford to lose. This is not financial advice.

## Support

For issues or questions:
1. Check `trading_bot.log` for errors
2. Review the code - all functions are documented
3. Start with testnet to understand how it works
4. Test strategies with small amounts first

## Future Enhancements

- Backtesting framework
- More strategies (grid trading, arbitrage)
- Machine learning signal integration
- Multi-exchange support
- Telegram notifications
- Advanced charting

---

**Remember:** Start with testnet, test thoroughly, start small when going live, and never risk more than you can afford to lose.
