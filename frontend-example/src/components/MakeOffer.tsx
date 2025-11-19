import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { 
  address as createAddress,
  getAddressEncoder,
  getAddressDecoder,
} from '@solana/kit';
import * as programClient from '../../../dist/js-client';
import { saveTransaction } from './TransactionHistory';
import { styles } from '../styles';
import { config } from '../config';

// Token program IDs
const TOKEN_2022_PROGRAM_ADDRESS = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb' as const;
const TOKEN_PROGRAM_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as const;

export function MakeOffer() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [tokenMintA, setTokenMintA] = useState(() => 
    localStorage.getItem('tokenMintA') || ''
  );
  const [tokenMintB, setTokenMintB] = useState(() => 
    localStorage.getItem('tokenMintB') || ''
  );
  const [amountA, setAmountA] = useState(() => 
    localStorage.getItem('amountA') || ''
  );
  const [amountB, setAmountB] = useState(() => 
    localStorage.getItem('amountB') || ''
  );
  const [status, setStatus] = useState('');
  
  // Load test tokens from config
  const testTokens = config.testTokens;

  // Save to localStorage when values change
  useEffect(() => {
    localStorage.setItem('tokenMintA', tokenMintA);
  }, [tokenMintA]);

  useEffect(() => {
    localStorage.setItem('tokenMintB', tokenMintB);
  }, [tokenMintB]);

  useEffect(() => {
    localStorage.setItem('amountA', amountA);
  }, [amountA]);

  useEffect(() => {
    localStorage.setItem('amountB', amountB);
  }, [amountB]);

  const handleMakeOffer = async () => {
    if (!publicKey) {
      setStatus('Connect wallet first');
      return;
    }

    try {
      setStatus('Creating offer...');

      // Convert wallet publicKey (v1) to Address (v2)
      const makerAddress = createAddress(publicKey.toBase58());
      const tokenMintAAddress = createAddress(tokenMintA);
      const tokenMintBAddress = createAddress(tokenMintB);

      const offerId = BigInt(Date.now());
      const tokenAAmount = BigInt(Number(amountA) * 1_000_000_000);
      const tokenBAmount = BigInt(Number(amountB) * 1_000_000_000);

      // Detect which token program the mint uses
      const mintAccount = await connection.getAccountInfo(new PublicKey(tokenMintA));
      const isToken2022 = mintAccount?.owner.toString() === TOKEN_2022_PROGRAM_ADDRESS;
      const tokenProgramToUse = isToken2022 ? TOKEN_2022_PROGRAM_ADDRESS : TOKEN_PROGRAM_ADDRESS;

      console.log('Token program detected:', tokenProgramToUse);

      // Use the generated client's async instruction builder
      const instruction = await programClient.getMakeOfferInstructionAsync({
        maker: { address: makerAddress },
        tokenMintA: tokenMintAAddress,
        tokenMintB: tokenMintBAddress,
        tokenProgram: tokenProgramToUse,
        id: offerId,
        tokenAOfferedAmount: tokenAAmount,
        tokenBWantedAmount: tokenBAmount,
      });

      // Convert v2 instruction to v1 format for wallet adapters
      const v1Instruction = new TransactionInstruction({
        keys: instruction.accounts.map(acc => ({
          pubkey: new PublicKey(acc.address),
          isSigner: acc.role === 2 || acc.role === 3, // TransactionSigner roles
          isWritable: acc.role === 1 || acc.role === 3, // Writable roles
        })),
        programId: new PublicKey(instruction.programAddress),
        data: Buffer.from(instruction.data),
      });

      const transaction = new Transaction().add(v1Instruction);
      const signature = await sendTransaction(transaction, connection);
      
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Save to history
      saveTransaction(
        signature,
        'make_offer',
        `Offered ${amountA} Token A for ${amountB} Token B`
      );
      
      setStatus(`Offer created! Signature: ${signature}`);
    } catch (error: any) {
      console.error('Full error:', error);
      console.error('Error logs:', error?.logs);
      console.error('Error message:', error?.message);
      
      // Extract program error if available
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      const logs = error?.logs ? '\n\nLogs:\n' + error.logs.join('\n') : '';
      
      setStatus(`Error: ${errorMsg}${logs}`);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Create Offer</h2>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        <div>
          <label style={styles.label}>Token to Offer</label>
          <select
            style={styles.input}
            value={tokenMintA}
            onChange={(e) => setTokenMintA(e.target.value)}
          >
            <option value="">Select token...</option>
            <option value={testTokens.tokenA.address}>
              {testTokens.tokenA.name}
            </option>
            <option value={testTokens.tokenB.address}>
              {testTokens.tokenB.name}
            </option>
          </select>
        </div>
        
        <div>
          <label style={styles.label}>Amount to Offer</label>
          <input
            style={styles.input}
            placeholder="0.0"
            type="number"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
          />
        </div>
        
        <div style={{ 
          height: '1px', 
          background: 'rgba(255, 255, 255, 0.1)', 
          margin: '8px 0' 
        }} />
        
        <div>
          <label style={styles.label}>Token Wanted</label>
          <select
            style={styles.input}
            value={tokenMintB}
            onChange={(e) => setTokenMintB(e.target.value)}
          >
            <option value="">Select token...</option>
            <option value={testTokens.tokenA.address}>
              {testTokens.tokenA.name}
            </option>
            <option value={testTokens.tokenB.address}>
              {testTokens.tokenB.name}
            </option>
          </select>
        </div>
        
        <div>
          <label style={styles.label}>Amount Wanted</label>
          <input
            style={styles.input}
            placeholder="0.0"
            type="number"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
          />
        </div>
        
        <button 
          onClick={handleMakeOffer}
          style={styles.button}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(153, 69, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Create Offer
        </button>
        
        {status && (
          <div style={{ 
            padding: '12px',
            background: status.includes('Error') 
              ? 'rgba(239, 68, 68, 0.1)' 
              : 'rgba(20, 241, 149, 0.1)',
            border: `1px solid ${status.includes('Error') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(20, 241, 149, 0.3)'}`,
            borderRadius: '8px',
            fontSize: '14px',
            color: status.includes('Error') ? '#fca5a5' : '#14F195',
            wordBreak: 'break-all',
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

