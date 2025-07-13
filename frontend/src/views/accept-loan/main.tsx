import { useEffect, useState } from "react";
import { tokens } from "../../utils/constants";
import TokenDropdown from "../../components/TokenDropdown";
import TextInput from "../../components/TextInput";
import NumberInput from "../../components/NumberInput";
import SubmitButton from "../../components/SubmitButton";
import {
  acceptLoan,
  getCollaterial,
  getLiquidity,
} from "../../services/blockchain1.services";
import { toast } from "react-toastify";
import { getAccount } from "../../utils/config";

interface Token {
  name: string;
  address: string;
  image: string;
}

export default function AcceptLoanForm() {
  const [amount, setAmount] = useState("");
  const [selectedLoanToken, setSelectedLoanToken] = useState<Token>(tokens[0]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("");
  const [collateral, setCollaterial] = useState("");
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [lender, setLender] = useState<string>("");

  useEffect(() => {
    const fetchAccount = async () => {
      const account = await getAccount();
      if (!account) return;
      setAccount(account as `0x${string}`);
    };
    fetchAccount();
  }, []);

  useEffect(() => {
    const fetchCollaterial = async () => {
      const collaterial = await getCollaterial({
        borrower: account as `0x${string}`,
        token: selectedLoanToken.address as `0x${string}`,
      });
      if (typeof collaterial === "undefined") {
        console.log("collateral is undefined");
        return;
      }
      setCollaterial(collaterial.toString());
    };
    fetchCollaterial();
  }, [account]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!account) return;
      setLender(account as `0x${string}`);
      const balance = await getLiquidity({
        lender: account as `0x${string}`,
        token: selectedLoanToken.address as `0x${string}`,
      });

      if (typeof balance === "undefined") {
        console.log("balance is undefined");
        return;
      }
      setBalance(balance.toString());
    };
    fetchDetails();
  }, [account, selectedLoanToken, lender, loading]);

  const handleAcceptLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!account) {
        toast.error("Please connect your wallet");
        return;
      }
      await acceptLoan({
        lender: lender as `0x${string}`,
        token: selectedLoanToken.address as `0x${string}`,
        amount: +amount,
      });
      toast.success("Loan accepted successfully!");
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Accept Loan</h2>
        <form onSubmit={handleAcceptLoan} className="space-y-4">
          <TextInput
            defaultValue={lender}
            onChange={() => {}}
            placeholder="0xLender..."
            label="Lender Address"
            disabled={true}
          />
          <TokenDropdown
            label="Loan Token"
            tokens={tokens}
            selectedToken={selectedLoanToken}
            setSelectedToken={setSelectedLoanToken}
            balance={balance}
          />
          <NumberInput
            label="Loan Amount"
            placeholder="1000"
            defaultValue={amount}
            onChange={(value) => setAmount(value)}
          />
          <TextInput
            label="Collaterial"
            placeholder="1000"
            defaultValue={`${collateral} ${selectedLoanToken.name}`}
            disabled
            onChange={(_) => {}}
          />
          <SubmitButton isSubmitting={loading} />
        </form>
      </div>
    </>
  );
}
