"""
Real risk management system.
Enforces actual position sizing, stop losses, and portfolio limits.
"""
from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)


class RiskManager:
    """Real risk management with actual calculations and enforcement."""

    def __init__(self, config: Dict):
        """
        Initialize risk manager with real parameters.

        Args:
            config: {
                'initial_capital': Total starting capital
                'max_position_size': Max $ per position
                'max_daily_loss': Max $ loss per day
                'max_open_positions': Max concurrent positions
                'risk_per_trade_percent': % of capital to risk per trade
                'stop_loss_percent': % stop loss
                'take_profit_percent': % take profit
            }
        """
        self.initial_capital = config.get('initial_capital', 10000)
        self.max_position_size = config.get('max_position_size', 1000)
        self.max_daily_loss = config.get('max_daily_loss', 100)
        self.max_open_positions = config.get('max_open_positions', 3)
        self.risk_per_trade_percent = config.get('risk_per_trade_percent', 2)
        self.stop_loss_percent = config.get('stop_loss_percent', 2)
        self.take_profit_percent = config.get('take_profit_percent', 3)

        # Runtime state
        self.daily_pnl = 0.0
        self.current_positions_count = 0

        logger.info(f"Risk Manager initialized: max_positions={self.max_open_positions}, "
                   f"max_daily_loss=${self.max_daily_loss}, risk_per_trade={self.risk_per_trade_percent}%")

    def can_open_position(self, current_balance: float, open_positions: List[Dict]) -> tuple[bool, str]:
        """
        Check if we can open a new position based on real risk rules.

        Returns:
            (can_trade, reason)
        """
        # Check daily loss limit
        if self.daily_pnl <= -self.max_daily_loss:
            return False, f"Daily loss limit reached: ${self.daily_pnl:.2f}"

        # Check max open positions
        if len(open_positions) >= self.max_open_positions:
            return False, f"Max positions limit: {len(open_positions)}/{self.max_open_positions}"

        # Check if we have enough balance
        if current_balance < self.max_position_size * 0.1:
            return False, f"Insufficient balance: ${current_balance:.2f}"

        return True, "OK"

    def calculate_position_size(self, current_price: float, available_balance: float) -> float:
        """
        Calculate actual position size based on risk rules.

        Args:
            current_price: Current asset price
            available_balance: Available balance in quote currency (e.g., USDT)

        Returns:
            Amount to buy in base currency
        """
        # Use smaller of: max position size or percentage of available balance
        max_investment = min(
            self.max_position_size,
            available_balance * 0.3  # Never use more than 30% of available balance
        )

        # Calculate position size based on risk per trade
        risk_amount = available_balance * (self.risk_per_trade_percent / 100)
        stop_loss_distance = self.stop_loss_percent / 100

        # Position size = Risk Amount / Stop Loss Distance
        position_value = risk_amount / stop_loss_distance

        # Use the smaller of the two calculations
        final_position_value = min(position_value, max_investment)

        # Convert to base currency amount
        amount = final_position_value / current_price

        logger.info(f"Position size calculation: price=${current_price:.2f}, "
                   f"investment=${final_position_value:.2f}, amount={amount:.6f}")

        return amount

    def calculate_stop_loss(self, entry_price: float, side: str = 'buy') -> float:
        """
        Calculate real stop loss price.

        Args:
            entry_price: Entry price
            side: 'buy' or 'sell'

        Returns:
            Stop loss price
        """
        if side == 'buy':
            stop_loss = entry_price * (1 - self.stop_loss_percent / 100)
        else:
            stop_loss = entry_price * (1 + self.stop_loss_percent / 100)

        return round(stop_loss, 2)

    def calculate_take_profit(self, entry_price: float, side: str = 'buy') -> float:
        """
        Calculate real take profit price.

        Args:
            entry_price: Entry price
            side: 'buy' or 'sell'

        Returns:
            Take profit price
        """
        if side == 'buy':
            take_profit = entry_price * (1 + self.take_profit_percent / 100)
        else:
            take_profit = entry_price * (1 - self.take_profit_percent / 100)

        return round(take_profit, 2)

    def should_close_position(self, position: Dict, current_price: float) -> tuple[bool, str]:
        """
        Check if position should be closed based on real risk rules.

        Args:
            position: Position dict with entry_price, stop_loss, take_profit
            current_price: Current market price

        Returns:
            (should_close, reason)
        """
        entry_price = position['entry_price']
        stop_loss = position.get('stop_loss')
        take_profit = position.get('take_profit')

        pnl_percent = ((current_price - entry_price) / entry_price) * 100

        # Check stop loss
        if stop_loss and current_price <= stop_loss:
            return True, f"Stop loss hit: ${current_price:.2f} <= ${stop_loss:.2f} ({pnl_percent:.2f}%)"

        # Check take profit
        if take_profit and current_price >= take_profit:
            return True, f"Take profit hit: ${current_price:.2f} >= ${take_profit:.2f} ({pnl_percent:.2f}%)"

        # Emergency stop if loss is too large (should not happen if stop loss worked)
        if pnl_percent <= -(self.stop_loss_percent * 1.5):
            return True, f"Emergency stop: {pnl_percent:.2f}%"

        return False, "OK"

    def update_daily_pnl(self, trade_pnl: float):
        """Update daily P&L after a trade."""
        self.daily_pnl += trade_pnl
        logger.info(f"Daily P&L updated: ${self.daily_pnl:.2f} (trade: ${trade_pnl:.2f})")

    def reset_daily_stats(self):
        """Reset daily statistics (call at start of new day)."""
        logger.info(f"Resetting daily stats. Previous daily P&L: ${self.daily_pnl:.2f}")
        self.daily_pnl = 0.0

    def get_risk_metrics(self, current_balance: float, open_positions: List[Dict]) -> Dict:
        """
        Calculate real-time risk metrics.

        Returns:
            Dict with risk statistics
        """
        total_exposure = sum(pos['cost'] for pos in open_positions)
        exposure_percent = (total_exposure / current_balance * 100) if current_balance > 0 else 0

        total_unrealized_pnl = sum(pos.get('unrealized_pnl', 0) for pos in open_positions)

        return {
            'daily_pnl': self.daily_pnl,
            'daily_loss_remaining': self.max_daily_loss + self.daily_pnl,
            'open_positions': len(open_positions),
            'max_positions': self.max_open_positions,
            'positions_available': self.max_open_positions - len(open_positions),
            'total_exposure': total_exposure,
            'exposure_percent': exposure_percent,
            'available_balance': current_balance - total_exposure,
            'unrealized_pnl': total_unrealized_pnl,
            'can_trade': self.daily_pnl > -self.max_daily_loss and len(open_positions) < self.max_open_positions
        }

    def adjust_position_size_for_volatility(self, base_amount: float, atr: float, current_price: float) -> float:
        """
        Adjust position size based on market volatility (ATR).
        Higher volatility = smaller position.

        Args:
            base_amount: Calculated position size
            atr: Average True Range
            current_price: Current price

        Returns:
            Adjusted position size
        """
        if atr == 0 or current_price == 0:
            return base_amount

        # Calculate volatility as percentage
        volatility_percent = (atr / current_price) * 100

        # Reduce position size if volatility is high
        if volatility_percent > 5:
            adjustment = 0.7  # Reduce by 30%
        elif volatility_percent > 3:
            adjustment = 0.85  # Reduce by 15%
        else:
            adjustment = 1.0  # No adjustment

        adjusted_amount = base_amount * adjustment

        if adjustment < 1.0:
            logger.info(f"Position size adjusted for volatility: {volatility_percent:.2f}% "
                       f"-> {adjustment*100:.0f}% of base size")

        return adjusted_amount

    def validate_order(self, symbol: str, side: str, amount: float, price: float,
                      current_balance: float, min_order_amount: float) -> tuple[bool, str]:
        """
        Validate if an order meets all risk requirements.

        Returns:
            (is_valid, reason)
        """
        # Check minimum order amount
        if amount < min_order_amount:
            return False, f"Amount {amount:.6f} below minimum {min_order_amount:.6f}"

        # Check if we have enough balance
        order_cost = amount * price
        if order_cost > current_balance:
            return False, f"Insufficient balance: need ${order_cost:.2f}, have ${current_balance:.2f}"

        # Check max position size
        if order_cost > self.max_position_size:
            return False, f"Order size ${order_cost:.2f} exceeds max ${self.max_position_size:.2f}"

        return True, "OK"
