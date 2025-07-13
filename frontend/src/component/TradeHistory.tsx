
import { Activity, Clock, TrendingUp, TrendingDown } from 'lucide-react';

const TradeHistory = ({ recentTrades, loading }:any) => {
  const formatPrice = (price:any) => {
    return parseFloat(price).toFixed(6);
  };

  const TradeRow = ({ trade }:any) => (
    <tr className="hover:bg-card/50 transition-colors">
      <td className="px-3 py-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-mono text-foreground">#{trade.id}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className="text-sm font-mono text-primary font-semibold">
          {formatPrice(trade.price)}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className="text-sm font-mono text-foreground">
          {trade.amount}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-xs">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">Buyer:</span>
            <span className="text-foreground font-mono">{trade.buyer}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <TrendingDown className="w-3 h-3 text-destructive" />
            <span className="text-muted-foreground">Seller:</span>
            <span className="text-foreground font-mono">{trade.seller}</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{trade.timestamp}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="space-y-1 text-xs">
          <div className="text-muted-foreground">
            Buy: <span className="text-foreground">#{trade.buy_order_id}</span>
          </div>
          <div className="text-muted-foreground">
            Sell: <span className="text-foreground">#{trade.sell_order_id}</span>
          </div>
        </div>
      </td>
    </tr>
  );

  const LoadingRow = () => (
    <tr>
      <td colSpan={6} className="px-3 py-8">
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Loading trades...</span>
        </div>
      </td>
    </tr>
  );

  const EmptyRow = () => (
    <tr>
      <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
        No trades executed yet
      </td>
    </tr>
  );

  return (
    <div className="order-table rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-card border-b border-border">
        <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <Activity className="w-5 h-5 text-primary" />
          <span>Recent Trades ({recentTrades.length})</span>
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-3 py-3 text-left">Trade ID</th>
              <th className="px-3 py-3 text-left">Price</th>
              <th className="px-3 py-3 text-left">Amount</th>
              <th className="px-3 py-3 text-left">Participants</th>
              <th className="px-3 py-3 text-left">Time</th>
              <th className="px-3 py-3 text-left">Orders</th>
            </tr>
          </thead>
          <tbody className="scrollbar-thin max-h-96 overflow-y-auto">
            {loading ? (
              <LoadingRow />
            ) : recentTrades.length === 0 ? (
              <EmptyRow />
            ) : (
              recentTrades.map((trade:any) => (
                <TradeRow key={trade.id} trade={trade} />
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {recentTrades.length > 0 && (
        <div className="px-4 py-3 bg-muted/50 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing last {recentTrades.length} trades</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Live Updates</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeHistory;

