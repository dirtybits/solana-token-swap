import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import * as programClient from '../../../dist/js-client';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export function MakeOffer() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [tokenMintA, setTokenMintA] = useState('');
  const [tokenMintB, setTokenMintB] = useState('');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [status, setStatus] = useState('');

  const handleMakeOffer = async () => {
    if (!publicKey) {
      setStatus('Connect wallet first');
      return;
    }

    try {
      setStatus('Creating offer...');

      const offerId = BigInt(Date.now());
      const tokenAAmount = BigInt(Number(amountA) * 1_000_000_000); // 9 decimals
      const tokenBAmount = BigInt(Number(amountB) * 1_000_000_000);

      const mintA = new PublicKey(tokenMintA);
      const mintB = new PublicKey(tokenMintB);

      // Derive PDAs
      const [offer] = PublicKey.findProgramAddressSync(
        [Buffer.from('offer'), Buffer.from(offerId.toString(16).padStart(16, '0'), 'hex')],
        programClient.ESCROW_PROGRAM_ADDRESS
      );

      // Get token accounts (you'll need to derive these properly)
      // This is simplified - you'd need proper ATA derivation
      const makerTokenAccountA = new PublicKey('YOUR_TOKEN_ACCOUNT');
      const vault = new PublicKey('VAULT_ADDRESS');

      const instruction = await programClient.getMakeOfferInstructionAsync({
        maker: publicKey,
        tokenMintA: mintA,
        tokenMintB: mintB,
        makerTokenAccountA,
        offer,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        id: offerId,
        tokenAOfferedAmount: tokenAAmount,
        tokenBWantedAmount: tokenBAmount,
      });

      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection);
      
      await connection.confirmTransaction(signature, 'confirmed');
      setStatus(`Offer created! Signature: ${signature}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
      <h2>Make an Offer</h2>
      
      <div style={{ display: 'grid', gap: '10px' }}>
        <input
          placeholder="Token Mint A"
          value={tokenMintA}
          onChange={(e) => setTokenMintA(e.target.value)}
        />
        <input
          placeholder="Amount to offer"
          type="number"
          value={amountA}
          onChange={(e) => setAmountA(e.target.value)}
        />
        
        <input
          placeholder="Token Mint B"
          value={tokenMintB}
          onChange={(e) => setTokenMintB(e.target.value)}
        />
        <input
          placeholder="Amount wanted"
          type="number"
          value={amountB}
          onChange={(e) => setAmountB(e.target.value)}
        />
        
        <button onClick={handleMakeOffer}>
          Create Offer
        </button>
        
        {status && <p>{status}</p>}
      </div>
    </div>
  );
}

