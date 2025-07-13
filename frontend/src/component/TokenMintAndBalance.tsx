import  { useEffect, useState } from 'react';
import { Coins, RefreshCcw, ArrowUpRight } from 'lucide-react';

import { getUserBalance, mintERC20 } from '../services/blockchain.services';
import { MOCK_USDC, MOCK_USDT } from '../utils/constants';



const TokenMintAndBalance = ({account}:{account:string}) => {
  const [balance, setBalance] = useState('0');
  const [amountToMint, setAmountToMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [userAddress, setUserAddress] = useState<any>(account)
  const [tokenAddress, settokenAddress] = useState<any>(MOCK_USDC)

   const formatEth = (price:any) => {
    return (parseFloat(price)/ 10**18).toString();
  };

  const fetchBalance = async () => {
    if (!userAddress) return;
    try {
      console.log(account)
      const bal = await getUserBalance(userAddress, tokenAddress)
      setBalance(formatEth(bal));
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const handleMint = async () => {
    if (!amountToMint) return;
    setLoading(true);
    try {
      
      await mintERC20({erc20: tokenAddress,user: userAddress,amount: Number(amountToMint) * 1**18})
      setAmountToMint('');
    } catch (err) {
      console.error('Minting error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [userAddress]);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full max-w-lg mx-auto">
      <div className="px-4 py-3 bg-muted border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Coins className="w-5 h-5 text-primary" />
          <span>Token Faucet</span>
        </h3>
        <button
          className="text-sm flex items-center space-x-1 text-primary hover:underline"
          onClick={fetchBalance}
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            Your Balance:
          </label>
          <div className="text-lg font-mono text-foreground">{balance}</div>
        </div>

        <select defaultValue={MOCK_USDC} name='tokenAddress' onChange={(e)=> settokenAddress(e.target.value)}>
            <option value={MOCK_USDC} className=' bg-black'>USDC base coin</option>
            <option value={MOCK_USDT} className=' bg-black'>USDT quote coin</option>
        </select>

         <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            Amount to Mint:
          </label>
          <input
            type="text"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            placeholder="0x00"
            className="w-full p-2 border rounded-md bg-background text-foreground"
          />
        </div>

       
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            Amount to Mint:
          </label>
          <input
            type="number"
            value={amountToMint}
            onChange={(e) => setAmountToMint(e.target.value)}
            placeholder="e.g. 1000"
            className="w-full p-2 border rounded-md bg-background text-foreground"
          />
        </div>

        <button
          onClick={handleMint}
          disabled={loading}
          className="w-full px-4 py-2 bg-primary text-white rounded-md flex items-center justify-center space-x-2 hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <ArrowUpRight className="w-4 h-4" />
          )}
          <span>Mint Tokens</span>
        </button>
      </div>
    </div>
  );
};

export default TokenMintAndBalance;
