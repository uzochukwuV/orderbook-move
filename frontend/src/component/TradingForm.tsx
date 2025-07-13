import  { useState } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

const TradingForm = ({ onPlaceBuyOrder, onPlaceSellOrder, loading }:any) => {
  const [buyPrice, setBuyPrice] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellAmount, setSellAmount] = useState('');

  const handleBuyOrder = async (e:any) => {
    e.preventDefault();
    if (!buyPrice || !buyAmount) return;
    console.log(parseFloat(buyPrice), parseInt(buyAmount))
    try {
      await onPlaceBuyOrder({price:parseFloat(buyPrice),amount: parseInt(buyAmount)});
      setBuyPrice('');
      setBuyAmount('');
    } catch (error) {
      console.error('Failed to place buy order:', error);
    }
  };

  const handleSellOrder = async (e:any) => {
    e.preventDefault();
    if (!sellPrice || !sellAmount) return;
    
    try {
      await onPlaceSellOrder({ price: parseFloat(sellPrice), amount: parseInt(sellAmount)});
      setSellPrice('');
      setSellAmount('');
    } catch (error) {
      console.error('Failed to place sell order:', error);
    }
  };

  return (
    <div className="space-y-6 min-w-[400px]">
      {/* Buy Order Form */}
      <div className="trading-form">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Place Buy Order</h3>
        </div>
        
        <form onSubmit={handleBuyOrder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Price (per unit)
            </label>
            <input
              type="number"
              step="0.000001"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="0.000000"
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Amount
            </label>
            <input
              type="number"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !buyPrice || !buyAmount}
            className="w-full btn-buy py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            <span>Place Buy Order</span>
          </button>
        </form>
      </div>

      {/* Sell Order Form */}
      <div className="trading-form">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingDown className="w-5 h-5 text-destructive" />
          <h3 className="text-lg font-semibold text-foreground">Place Sell Order</h3>
        </div>
        
        <form onSubmit={handleSellOrder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Price (per unit)
            </label>
            <input
              type="number"
              step="0.000001"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="0.000000"
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Amount
            </label>
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !sellPrice || !sellAmount}
            className="w-full btn-sell py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>Place Sell Order</span>
          </button>
        </form>
      </div>

      {/* Quick Actions */}
      <div className="trading-form">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setBuyPrice('1.000000');
              setBuyAmount('100');
            }}
            className="px-3 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all text-sm"
          >
            Buy 100 @ 1.0
          </button>
          <button
            onClick={() => {
              setSellPrice('1.000000');
              setSellAmount('100');
            }}
            className="px-3 py-2 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg hover:bg-destructive/20 transition-all text-sm"
          >
            Sell 100 @ 1.0
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradingForm;

