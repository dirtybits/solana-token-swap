import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import { MakeOffer } from './components/MakeOffer';
import { ViewOffers } from './components/ViewOffers';

function App() {
  // Connect to testnet
  const endpoint = useMemo(() => clusterApiUrl('testnet'), []);
  
  // Setup wallet adapters
  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '40px' }}>
              <h1>Escrow Program</h1>
              <WalletMultiButton />
            </header>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <MakeOffer />
              <ViewOffers />
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;

