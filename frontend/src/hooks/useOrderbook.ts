import { useCallback, useEffect, useState } from "react";
import {
  getAccount,
  getFunction,
  publicClient,
  walletClient,
} from "../utils/config";
import {
  placeBuyOrder as placeBuyTx,
  placeSellOrder as placeSellTx,
  cancelOrder as cancelOrderTx,
  getActiveBuyOrders,
  getActiveSellOrders,
  getRecentTrades,
  getStatistics,
} from "../services/blockchain.services"; // Import your functions here
import { MOCK_USDC, MOCK_USDT } from "../utils/constants";

export const useOrderBook = () => {
  const [buyOrders, setBuyOrders] = useState<any[]>([]);
  const [sellOrders, setSellOrders] = useState<any[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      const acc = await getAccount();
      setAccount(acc);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

     

      const activeBuys = await getActiveBuyOrders()
      const activeSells = await getActiveSellOrders()
      const trades = await getRecentTrades(BigInt(10));
      const stats = await getStatistics()

      console.log(activeBuys, activeSells, trades, stats)
      setBuyOrders(activeBuys || []);
      setSellOrders(activeSells || []);
      setRecentTrades(trades || []);
      setStatistics(stats || null);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const placeBuyOrder = useCallback(
    async ({ price, amount }: { price: number; amount: number }) => {
      setLoading(true);
      setError(null);
      console.log("in function", price, amount)
      try {
        await placeBuyTx({ price, amount });
        await loadData();
      } catch (err: any) {
        setError(err.message || "Failed to place buy order");
      } finally {
        setLoading(false);
      }
    },
    [loadData]
  );

  const placeSellOrder = useCallback(
    async ({ price, amount }: { price: number; amount: number }) => {
      setLoading(true);
      setError(null);
      try {
        await placeSellTx({ price, amount });
        await loadData();
      } catch (err: any) {
        setError(err.message || "Failed to place sell order");
      } finally {
        setLoading(false);
      }
    },
    [loadData]
  );

  const cancelOrder = useCallback(
    async (orderId: number) => {
      setLoading(true);
      setError(null);
      try {
        await cancelOrderTx(orderId);
        await loadData();
      } catch (err: any) {
        setError(err.message || "Failed to cancel order");
      } finally {
        setLoading(false);
      }
    },
    [loadData]
  );

  const initializeOrderBook = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log(MOCK_USDC, MOCK_USDT);
    try {
      const { to, data } = await getFunction("initialiseOrderbook", MOCK_USDC, MOCK_USDT);
      const hash = await walletClient().sendTransaction({
        account: await getAccount(),
        to,
        data,
      });
      await publicClient().waitForTransactionReceipt({ hash });
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to initialize order book");
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  useEffect(() => {
    if (account) {
      loadData();
    }
  }, [account, loadData]);

  return {
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
    refreshData: loadData,
  };
};
