import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import { MakeOffer } from './components/MakeOffer';
import { ViewOffers } from './components/ViewOffers';
import { TransactionHistory } from './components/TransactionHistory';
import { config } from './config';

function App() {
  // Connect to configured network
  const endpoint = useMemo(() => clusterApiUrl(config.network), []);
  
  // Setup wallet adapters
  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div style={{ 
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
          }}>
            <div style={{ 
              maxWidth: '1400px', 
              margin: '0 auto',
              padding: '40px 20px',
            }}>
              <header style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '60px',
                padding: '20px 0',
              }}>
                <div>
                  <h1 style={{ 
                    fontSize: '32px', 
                    fontWeight: '700',
                    background: 'linear-gradient(90deg, #14F195 0%, #9945FF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '8px',
                  }}>
                    Token Swap
                  </h1>
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                    Decentralized escrow on Solana
                  </p>
                </div>
                <WalletMultiButton />
              </header>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '24px',
              }}>
                <MakeOffer />
                <ViewOffers />
              </div>
              
              <div style={{ marginTop: '24px' }}>
                <TransactionHistory />
              </div>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;

