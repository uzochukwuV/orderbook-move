import { useEffect } from 'react';
import { useOrderBook } from './hooks/useOrderbook';
import Header from './component/Header';
import TradingForm from './component/TradingForm';
import OrderBook from './component/OrderBook';
import TradeHistory from './component/TradeHistory';

import ErrorMessage from './component/ErrorMessage';
import { RefreshCw, Settings, HelpCircle } from 'lucide-react';
import './App.css';
import { CONTRACT_ADDRESS } from './utils/constants';
import { getOwn } from './services/blockchain.services';
import TokenMintAndBalance from './component/TokenMintAndBalance';

function App() {
  const {
    buyOrders,
    sellOrders,
    recentTrades,
    statistics,
    loading,
    error,
    account,
    connectWallet,
    initializeOrderBook,
    placeBuyOrder,
    placeSellOrder,
    cancelOrder,
    refreshData
  } = useOrderBook();

  // Auto-connect wallet on page load
  useEffect(() => {
    if (window.ethereum) {
      console.log(CONTRACT_ADDRESS)

     
      connectWallet();

    }
  }, [connectWallet]);

  const handleInitializeOrderBook = async () => {
    try {
      const owner = await getOwn();
      const init = await initializeOrderBook()
      console.log(owner,init, "this is the owner")
      alert('Order book initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize order book:', error);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
            <Settings className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Umi OrderBook</h1>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to start trading on the decentralized order book
            </p>
          </div>
          <button
            onClick={connectWallet}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:glow-green disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
          <div className="text-xs text-muted-foreground">
            Make sure you have MetaMask or a compatible wallet installed
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header 
        account={account} 
        onConnectWallet={connectWallet}
        statistics={statistics}
      />
      
      <main className="container mx-auto px-4 py-6">
        <ErrorMessage error={error} onDismiss={null} />
        
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center space-x-2 bg-card border border-border hover:bg-card/80 text-foreground px-4 py-2 rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={handleInitializeOrderBook}
              disabled={loading}
              className="flex items-center space-x-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-all disabled:opacity-50"
            >
              <Settings className="w-4 h-4" />
              <span>Initialize OrderBook</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <HelpCircle className="w-4 h-4" />
            <span>Auto-refresh every 30s</span>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="order-book-grid">
          {/* Trading Form */}
          <div className="space-y-6">
            <TradingForm
              onPlaceBuyOrder={placeBuyOrder}
              onPlaceSellOrder={placeSellOrder}
              loading={loading}
            />
          </div>

          {/* Order Book */}
          <div className="space-y-6">
            <OrderBook
              buyOrders={buyOrders}
              sellOrders={sellOrders}
              onCancelOrder={cancelOrder}
              loading={loading}
              account={account}
            />
            
          </div>

          {/* Trade History */}
          <div className="space-y-6">
            <TradeHistory
              recentTrades={recentTrades}
              loading={loading}
            />

            <div className="space-y-6">
            <TokenMintAndBalance
             account={account}
            />
          </div>
          </div>

          

        </div>

        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-border">
          <div className="text-center text-sm text-muted-foreground">
            <p>Umi OrderBook DApp - Decentralized Trading Platform</p>
            <p className="mt-1">Built with Move smart contracts and React</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;






// import "./App.css";
// import NavHeader from "./components/NavHeader";
// import Router from "./router";
// import { BrowserRouter } from "react-router-dom";
// import { ToastContainer } from "react-toastify";

// function App() {
//   return (
//     <>
//       <ToastContainer />
//       <BrowserRouter>
//         <NavHeader />
        
//       </BrowserRouter>
//     </>
//   );
// }

// export default App;
