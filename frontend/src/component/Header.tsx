
import { Wallet, Activity, TrendingUp } from 'lucide-react';

const Header = ({ account, onConnectWallet, statistics }:any) => {
  console.log(statistics)
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Umi OrderBook</h1>
              <p className="text-xs text-muted-foreground">Decentralized Trading Platform</p>
            </div>
          </div>

          {/* Statistics */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">{statistics?.activeBuyOrders}</div>
              <div className="text-xs text-muted-foreground">Buy Orders</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">{statistics?.activeSellOrders}</div>
              <div className="text-xs text-muted-foreground">Sell Orders</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">{statistics?.totalTrades}</div>
              <div className="text-xs text-muted-foreground">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">{statistics?.volume}</div>
              <div className="text-xs text-muted-foreground">Volume</div>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-3">
            {account ? (
              <div className="flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-all duration-200 hover:glow-green"
              >
                <Wallet className="w-4 h-4" />
                <span className="font-medium">Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

