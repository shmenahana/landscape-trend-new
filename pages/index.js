import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Dashboard() {
  const [status, setStatus] = useState(null);
  const [balance, setBalance] = useState(null);
  const [trades, setTrades] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from API
  const fetchData = async () => {
    try {
      const [statusRes, balanceRes, tradesRes, positionsRes] = await Promise.all([
        fetch('http://localhost:8000/api/status'),
        fetch('http://localhost:8000/api/balance'),
        fetch('http://localhost:8000/api/trades?limit=10'),
        fetch('http://localhost:8000/api/positions')
      ]);

      const statusData = await statusRes.json();
      const balanceData = await balanceRes.json();
      const tradesData = await tradesRes.json();
      const positionsData = await positionsRes.json();

      setStatus(statusData);
      setBalance(balanceData);
      setTrades(tradesData.trades || []);
      setPositions(positionsData.positions || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh data every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading trading bot dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Crypto Trading Bot Dashboard</title>
      </Head>

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Crypto Trading Bot</h1>
          <p className="text-gray-400 mt-1">Real-time automated trading dashboard</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Total Balance</div>
            <div className="text-3xl font-bold">
              ${balance?.total_balance?.toFixed(2) || '0.00'}
            </div>
            <div className={`text-sm mt-2 ${(balance?.total_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(balance?.total_pnl || 0) >= 0 ? '↑' : '↓'} ${Math.abs(balance?.total_pnl || 0).toFixed(2)} Total P&L
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Daily P&L</div>
            <div className={`text-3xl font-bold ${(balance?.daily_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${balance?.daily_pnl?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm mt-2 text-gray-400">
              {status?.daily_stats?.trade_count || 0} trades today
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Open Positions</div>
            <div className="text-3xl font-bold">{positions.length}</div>
            <div className="text-sm mt-2 text-gray-400">
              ${balance?.in_positions?.toFixed(2) || '0.00'} invested
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Win Rate</div>
            <div className="text-3xl font-bold">
              {status?.daily_stats?.trade_count > 0
                ? ((status.daily_stats.winning_trades / status.daily_stats.trade_count) * 100).toFixed(0)
                : 0}%
            </div>
            <div className="text-sm mt-2 text-gray-400">
              {status?.daily_stats?.winning_trades || 0}/{status?.daily_stats?.trade_count || 0} wins
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold mb-4">Open Positions</h2>
          {positions.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No open positions</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                    <th className="pb-3">Symbol</th>
                    <th className="pb-3">Entry Price</th>
                    <th className="pb-3">Current Price</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Unrealized P&L</th>
                    <th className="pb-3">Stop Loss</th>
                    <th className="pb-3">Take Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos, idx) => {
                    const pnlPercent = ((pos.current_price - pos.entry_price) / pos.entry_price * 100);
                    return (
                      <tr key={idx} className="border-b border-gray-700">
                        <td className="py-4 font-medium">{pos.symbol}</td>
                        <td className="py-4">${pos.entry_price?.toFixed(2)}</td>
                        <td className="py-4">${pos.current_price?.toFixed(2)}</td>
                        <td className="py-4">{pos.amount?.toFixed(6)}</td>
                        <td className={`py-4 font-medium ${pos.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${pos.unrealized_pnl?.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                        </td>
                        <td className="py-4 text-red-400">${pos.stop_loss?.toFixed(2)}</td>
                        <td className="py-4 text-green-400">${pos.take_profit?.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Trades */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Recent Trades</h2>
          {trades.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No trades yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Symbol</th>
                    <th className="pb-3">Side</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Cost</th>
                    <th className="pb-3">P&L</th>
                    <th className="pb-3">Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, idx) => (
                    <tr key={idx} className="border-b border-gray-700">
                      <td className="py-4 text-sm text-gray-400">
                        {new Date(trade.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 font-medium">{trade.symbol}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.side === 'buy' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                        }`}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4">${trade.price?.toFixed(2)}</td>
                      <td className="py-4">{trade.amount?.toFixed(6)}</td>
                      <td className="py-4">${trade.cost?.toFixed(2)}</td>
                      <td className={`py-4 font-medium ${
                        !trade.pnl ? 'text-gray-400' :
                        trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.pnl ? `$${trade.pnl.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-4 text-sm text-gray-400">{trade.strategy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Auto-refresh indicator */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          Auto-refreshing every 10 seconds • Last updated: {new Date().toLocaleTimeString()}
        </div>
      </main>
    </div>
  );
}
