"""
Main entry point for the trading bot.
This actually starts and runs the bot with real configuration.
"""
import asyncio
import os
from dotenv import load_dotenv
from bot import TradingBot

# Load environment variables
load_dotenv()


def get_config() -> dict:
    """Load real configuration from environment variables."""
    return {
        # Exchange configuration
        'exchange': os.getenv('EXCHANGE', 'binance'),
        'api_key': os.getenv('API_KEY', ''),
        'api_secret': os.getenv('API_SECRET', ''),
        'use_testnet': os.getenv('USE_TESTNET', 'true').lower() == 'true',

        # Trading pairs
        'trading_pairs': os.getenv('TRADING_PAIRS', 'BTC/USDT,ETH/USDT').split(','),

        # Capital and risk management
        'initial_capital': float(os.getenv('INITIAL_CAPITAL', '10000')),
        'max_position_size': float(os.getenv('MAX_POSITION_SIZE', '1000')),
        'max_daily_loss': float(os.getenv('MAX_DAILY_LOSS', '100')),
        'max_open_positions': int(os.getenv('MAX_OPEN_POSITIONS', '3')),
        'risk_per_trade_percent': float(os.getenv('RISK_PER_TRADE_PERCENT', '2')),
        'stop_loss_percent': float(os.getenv('STOP_LOSS_PERCENT', '2')),
        'take_profit_percent': float(os.getenv('TAKE_PROFIT_PERCENT', '3')),

        # Strategy
        'strategy': os.getenv('STRATEGY', 'mean_reversion'),
        'check_interval_seconds': int(os.getenv('CHECK_INTERVAL_SECONDS', '60')),

        # Strategy-specific parameters
        'rsi_oversold': int(os.getenv('RSI_OVERSOLD', '30')),
        'rsi_overbought': int(os.getenv('RSI_OVERBOUGHT', '70')),

        # Database
        'db_path': os.getenv('DB_PATH', 'trading_bot.db')
    }


async def main():
    """Main function to run the trading bot."""
    print("=" * 60)
    print("CRYPTOCURRENCY TRADING BOT")
    print("=" * 60)

    # Load configuration
    config = get_config()

    # Validate configuration
    if not config['api_key'] or not config['api_secret']:
        print("\n⚠️  WARNING: No API credentials found!")
        print("Please set API_KEY and API_SECRET in .env file")
        print("\nFor testnet keys, visit: https://testnet.binance.vision/")
        print("\nCreate a .env file based on .env.example")
        return

    # Display configuration
    print(f"\nConfiguration:")
    print(f"  Exchange: {config['exchange']} ({'TESTNET' if config['use_testnet'] else 'LIVE'})")
    print(f"  Strategy: {config['strategy']}")
    print(f"  Trading Pairs: {', '.join(config['trading_pairs'])}")
    print(f"  Initial Capital: ${config['initial_capital']:,.2f}")
    print(f"  Max Position Size: ${config['max_position_size']:,.2f}")
    print(f"  Max Daily Loss: ${config['max_daily_loss']:,.2f}")
    print(f"  Check Interval: {config['check_interval_seconds']}s")
    print(f"  Risk per Trade: {config['risk_per_trade_percent']}%")
    print(f"  Stop Loss: {config['stop_loss_percent']}%")
    print(f"  Take Profit: {config['take_profit_percent']}%")
    print()

    # Create and initialize bot
    print("Initializing bot...")
    bot = TradingBot(config)

    try:
        await bot.initialize()
        print("✓ Bot initialized successfully")
        print("\nStarting trading bot...")
        print("Press Ctrl+C to stop\n")
        print("=" * 60)

        # Run the bot
        await bot.run()

    except KeyboardInterrupt:
        print("\n\nShutdown requested by user...")
        await bot.stop()

    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        await bot.stop()


if __name__ == "__main__":
    asyncio.run(main())
