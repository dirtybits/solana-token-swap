import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import bs58 from 'bs58';
import { address as createAddress } from '@solana/kit';
import * as programClient from '../../../dist/js-client';
import { styles } from '../styles';
import { saveTransaction } from './TransactionHistory';

const TOKEN_2022_PROGRAM_ADDRESS = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb' as const;
const TOKEN_PROGRAM_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as const;

interface Offer {
  address: string;
  id: string;
  maker: string;
  tokenMintA: string;
  tokenMintB: string;
  tokenBWantedAmount: string;
}

export function ViewOffers() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [takingOffer, setTakingOffer] = useState<string | null>(null);
  const [refundingOffer, setRefundingOffer] = useState<string | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      // Convert v2 address to v1 PublicKey
      const programId = new PublicKey(programClient.ESCROW_PROGRAM_ADDRESS);
      
      // Get all program accounts with Offer discriminator
      const accounts = await connection.getProgramAccounts(programId, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: bs58.encode(Buffer.from(programClient.OFFER_DISCRIMINATOR)),
            },
          },
        ],
      });
      
      console.log(`Found ${accounts.length} offer(s)`);
      
      const fetchedOffers = accounts.map(acc => {
        // Decode the account data using the generated decoder
        const decoder = programClient.getOfferDecoder();
        const decoded = decoder.decode(new Uint8Array(acc.account.data));
        
        return {
          address: acc.pubkey.toString(),
          id: decoded.id.toString(),
          maker: decoded.maker,
          tokenMintA: decoded.tokenMintA,
          tokenMintB: decoded.tokenMintB,
          tokenBWantedAmount: decoded.tokenBWantedAmount.toString(),
        };
      });

      setOffers(fetchedOffers);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleTakeOffer = async (offer: Offer) => {
    if (!publicKey) {
      alert('Connect wallet first');
      return;
    }

    setTakingOffer(offer.address);
    
    try {
      const takerAddress = createAddress(publicKey.toBase58());
      const makerAddress = createAddress(offer.maker);
      const offerAddress = createAddress(offer.address);
      const tokenMintAAddress = createAddress(offer.tokenMintA);
      const tokenMintBAddress = createAddress(offer.tokenMintB);

      // Detect which token program the mint uses
      const mintAccount = await connection.getAccountInfo(new PublicKey(offer.tokenMintA));
      const isToken2022 = mintAccount?.owner.toString() === TOKEN_2022_PROGRAM_ADDRESS;
      const tokenProgramToUse = isToken2022 ? TOKEN_2022_PROGRAM_ADDRESS : TOKEN_PROGRAM_ADDRESS;

      console.log('Token program detected:', tokenProgramToUse);

      const instruction = await programClient.getTakeOfferInstructionAsync({
        taker: { address: takerAddress },
        maker: makerAddress,
        offer: offerAddress,
        tokenMintA: tokenMintAAddress,
        tokenMintB: tokenMintBAddress,
        tokenProgram: tokenProgramToUse,
      });

      const v1Instruction = new TransactionInstruction({
        keys: instruction.accounts.map(acc => ({
          pubkey: new PublicKey(acc.address),
          isSigner: acc.role === 2 || acc.role === 3,
          isWritable: acc.role === 1 || acc.role === 3,
        })),
        programId: new PublicKey(instruction.programAddress),
        data: Buffer.from(instruction.data),
      });

      const transaction = new Transaction().add(v1Instruction);
      const signature = await sendTransaction(transaction, connection);
      
      await connection.confirmTransaction(signature, 'confirmed');
      
      saveTransaction(
        signature,
        'take_offer',
        `Took offer #${offer.id}`
      );
      
      alert(`Offer taken! Signature: ${signature}`);
      
      // Refresh offers list
      await fetchOffers();
    } catch (error: any) {
      console.error('Error taking offer:', error);
      console.error('Error logs:', error?.logs);
      alert(`Error: ${error?.message || error}`);
    } finally {
      setTakingOffer(null);
    }
  };

  const handleRefundOffer = async (offer: Offer) => {
    if (!publicKey) {
      alert('Connect wallet first');
      return;
    }

    setRefundingOffer(offer.address);
    
    try {
      const makerAddress = createAddress(publicKey.toBase58());
      const offerAddress = createAddress(offer.address);
      const tokenMintAAddress = createAddress(offer.tokenMintA);

      // Detect which token program the mint uses
      const mintAccount = await connection.getAccountInfo(new PublicKey(offer.tokenMintA));
      const isToken2022 = mintAccount?.owner.toString() === TOKEN_2022_PROGRAM_ADDRESS;
      const tokenProgramToUse = isToken2022 ? TOKEN_2022_PROGRAM_ADDRESS : TOKEN_PROGRAM_ADDRESS;

      console.log('Token program detected:', tokenProgramToUse);

      const instruction = await programClient.getRefundOfferInstructionAsync({
        maker: { address: makerAddress },
        offer: offerAddress,
        tokenMintA: tokenMintAAddress,
        tokenProgram: tokenProgramToUse,
      });

      const v1Instruction = new TransactionInstruction({
        keys: instruction.accounts.map(acc => ({
          pubkey: new PublicKey(acc.address),
          isSigner: acc.role === 2 || acc.role === 3,
          isWritable: acc.role === 1 || acc.role === 3,
        })),
        programId: new PublicKey(instruction.programAddress),
        data: Buffer.from(instruction.data),
      });

      const transaction = new Transaction().add(v1Instruction);
      const signature = await sendTransaction(transaction, connection);
      
      await connection.confirmTransaction(signature, 'confirmed');
      
      saveTransaction(
        signature,
        'refund_offer',
        `Refunded offer #${offer.id}`
      );
      
      alert(`Offer refunded! Signature: ${signature}`);
      
      // Refresh offers list
      await fetchOffers();
    } catch (error: any) {
      console.error('Error refunding offer:', error);
      console.error('Error logs:', error?.logs);
      alert(`Error: ${error?.message || error}`);
    } finally {
      setRefundingOffer(null);
    }
  };

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={styles.title}>Active Offers</h2>
        <button 
          onClick={fetchOffers} 
          disabled={loading}
          style={{
            ...styles.buttonSecondary,
            width: 'auto',
            opacity: loading ? 0.5 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '16px' }}>
        {offers.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: '#6b7280',
            fontSize: '14px',
          }}>
            No active offers. Create one to get started!
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.address}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '20px',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(153, 69, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                Offer #{offer.id}
              </div>
              
              <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af', fontSize: '13px' }}>Offering</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#14F195' }}>
                    {offer.tokenMintA.slice(0, 4)}...{offer.tokenMintA.slice(-4)}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af', fontSize: '13px' }}>Wants</span>
                  <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>
                    {(Number(offer.tokenBWantedAmount) / 1e9).toFixed(2)} tokens
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af', fontSize: '13px' }}>For</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#9945FF' }}>
                    {offer.tokenMintB.slice(0, 4)}...{offer.tokenMintB.slice(-4)}
                  </span>
                </div>
              </div>
              
              {publicKey && offer.maker === publicKey.toBase58() ? (
                // Show Refund button for your own offers
                <button
                  onClick={() => handleRefundOffer(offer)}
                  disabled={refundingOffer === offer.address}
                  style={{
                    ...styles.button,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    opacity: refundingOffer === offer.address ? 0.5 : 1,
                    cursor: refundingOffer === offer.address ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (refundingOffer !== offer.address) {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                >
                  {refundingOffer === offer.address ? 'Refunding...' : 'Refund Offer'}
                </button>
              ) : (
                // Show Take button for others' offers
                <button
                  onClick={() => handleTakeOffer(offer)}
                  disabled={takingOffer === offer.address}
                  style={{
                    ...styles.button,
                    background: 'rgba(20, 241, 149, 0.1)',
                    border: '1px solid rgba(20, 241, 149, 0.3)',
                    color: '#14F195',
                    opacity: takingOffer === offer.address ? 0.5 : 1,
                    cursor: takingOffer === offer.address ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (takingOffer !== offer.address) {
                      e.currentTarget.style.background = 'rgba(20, 241, 149, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(20, 241, 149, 0.1)';
                  }}
                >
                  {takingOffer === offer.address ? 'Taking...' : 'Take Offer'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

