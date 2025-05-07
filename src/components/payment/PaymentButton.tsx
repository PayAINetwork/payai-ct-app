import { Button } from '@/components/ui/button';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect, useCallback } from 'react';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction, getMint } from '@solana/spl-token';

interface PaymentButtonProps {
  amount: number;
  currency: 'SOL' | 'PAYAI';
  escrowAddress: string;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
}

const PAYAI_MINT_ADDRESS = 'E7NgL19JbN8BhUDgWjkH8MtnbhJoaGaWJqosxZZepump';

export function PaymentButton({ 
  amount, 
  currency, 
  escrowAddress,
  onSuccess,
  onError 
}: PaymentButtonProps) {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(false);

  const handlePayment = useCallback(async () => {
    if (!connected || !publicKey) return;
    
    setIsSubmitting(true);
    try {
      let tx;
      if (currency === 'PAYAI') {
        const payaiMint = new PublicKey(PAYAI_MINT_ADDRESS);
        const mintInfo = await getMint(connection, payaiMint);
        const decimals = mintInfo.decimals;
        const userTokenAccount = await getAssociatedTokenAddress(payaiMint, publicKey);
        const escrowPubkey = new PublicKey(escrowAddress);
        const escrowTokenAccount = await getAssociatedTokenAddress(payaiMint, escrowPubkey);

        const instructions = [];
        const escrowAccountInfo = await connection.getAccountInfo(escrowTokenAccount);
        
        if (!escrowAccountInfo) {
          const createATAIx = createAssociatedTokenAccountInstruction(
            publicKey,
            escrowTokenAccount,
            escrowPubkey,
            payaiMint
          );
          instructions.push(createATAIx);
        }

        const rawAmount = Math.round(amount * Math.pow(10, decimals));
        const transferIx = createTransferCheckedInstruction(
          userTokenAccount,
          payaiMint,
          escrowTokenAccount,
          publicKey,
          rawAmount,
          decimals
        );
        instructions.push(transferIx);
        tx = new Transaction().add(...instructions);
      } else {
        tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(escrowAddress),
            lamports: amount * LAMPORTS_PER_SOL,
          })
        );
      }

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'processed');
      onSuccess?.(signature);
    } catch (err) {
      console.error('Transaction failed', err);
      onError?.(err as Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [connected, publicKey, currency, connection, escrowAddress, amount, sendTransaction, onSuccess, onError]);

  // Auto-trigger payment once wallet connected after initial click
  useEffect(() => {
    const processPayment = async () => {
      if (connected && pendingPayment) {
        setVisible(false);
        await handlePayment();
        setPendingPayment(false);
      }
    };
    
    processPayment();
  }, [connected, pendingPayment, setVisible, handlePayment]);

  const handleClick = () => {
    if (!connected) {
      setPendingPayment(true);
      setVisible(true);
    } else {
      handlePayment();
    }
  };

  return (
    <Button 
      size="lg" 
      onClick={handleClick} 
      disabled={isSubmitting}
      className="w-full"
    >
      {isSubmitting ? 'Processing...' : 'Pay With Wallet'}
    </Button>
  );
} 