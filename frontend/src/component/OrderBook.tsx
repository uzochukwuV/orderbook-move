import React from 'react';
import { X, Clock, User } from 'lucide-react';


const OrderBook = ({ buyOrders, sellOrders, onCancelOrder, loading, account }) => {
  console.log(buyOrders)
  const formatPrice = (price) => {
    return (parseFloat(price)).toFixed(6);
  };

  const formatEth = (price) => {
    return (parseFloat(price)/ 10**18);
  };

   

  const isMyOrder = (orderTrader) => {
    if (!account) return false;
    const shortAccount = `${account.slice(0, 8)}...${account.slice(-8)}`;
    return orderTrader === shortAccount;
  };

  const OrderRow = ({ order, type, onCancel }) => (
    <tr className={`hover:bg-card/50 transition-colors ${type === 'buy' ? 'buy-order' : 'sell-order'}`}>
      <td className="px-3 py-2 text-sm">
        <span className={`font-mono ${type === 'buy' ? 'text-primary' : 'text-destructive'}`}>
          {formatPrice(order.price)}
        </span>
      </td>
      <td className="px-3 py-2 text-sm font-mono text-foreground">
        {formatEth(order.remainingAmount)}
      </td>
      <td className="px-3 py-2 text-sm font-mono text-muted-foreground">
        {formatEth(order.amount)}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <User className="w-3 h-3" />
          <span className={isMyOrder(order.trader) ? 'text-primary font-medium' : ''}>
            {order.trader}
          </span>
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{order.createdAt} block</span>
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            order.isActive ? 'status-active' : 'status-inactive'
          }`}>
            {order.isActive ? 'Active' : 'Inactive'}
          </span>
          {isMyOrder(order.trader) && order.isActive && (
            <button
              onClick={() => onCancel(order.id)}
              disabled={loading}
              className="btn-cancel p-1 rounded hover:bg-destructive/20 transition-colors disabled:opacity-50"
              title="Cancel Order"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  const LoadingRow = () => (
    <tr>
      <td colSpan="6" className="px-3 py-8">
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Loading orders...</span>
        </div>
      </td>
    </tr>
  );

  const EmptyRow = ({ message }) => (
    <tr>
      <td colSpan="6" className="px-3 py-8 text-center text-muted-foreground">
        {message}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Buy Orders */}
      <div className="order-table rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-primary/10 border-b border-primary/20">
          <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Buy Orders ({buyOrders.length})</span>
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left">Price</th>
                <th className="px-3 py-3 text-left">Remaining</th>
                <th className="px-3 py-3 text-left">Total</th>
                <th className="px-3 py-3 text-left">Trader</th>
                <th className="px-3 py-3 text-left">Created</th>
                <th className="px-3 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="scrollbar-thin max-h-64 overflow-y-auto">
              {loading ? (
                <LoadingRow />
              ) : buyOrders.length === 0 ? (
                <EmptyRow message="No buy orders available" />
              ) : (
                buyOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    type="buy"
                    onCancel={onCancelOrder}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sell Orders */}
      <div className="order-table rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20">
          <h3 className="text-lg font-semibold text-destructive flex items-center space-x-2">
            <div className="w-3 h-3 bg-destructive rounded-full"></div>
            <span>Sell Orders ({sellOrders.length})</span>
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left">Price</th>
                <th className="px-3 py-3 text-left">Remaining</th>
                <th className="px-3 py-3 text-left">Total</th>
                <th className="px-3 py-3 text-left">Trader</th>
                <th className="px-3 py-3 text-left">Created</th>
                <th className="px-3 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="scrollbar-thin max-h-64 overflow-y-auto">
              {loading ? (
                <LoadingRow />
              ) : sellOrders.length === 0 ? (
                <EmptyRow message="No sell orders available" />
              ) : (
                sellOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    type="sell"
                    onCancel={onCancelOrder}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;

