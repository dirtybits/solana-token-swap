import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { styles } from '../styles';

interface Transaction {
  signature: string;
  type: 'make_offer' | 'take_offer' | 'refund_offer';
  timestamp: number;
  details?: string;
}

export function TransactionHistory() {
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadTransactions();
  }, [publicKey]);

  const loadTransactions = () => {
    const stored = localStorage.getItem('transaction_history');
    if (stored) {
      const txs = JSON.parse(stored);
      setTransactions(txs.reverse()); // Most recent first
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('transaction_history');
    setTransactions([]);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'make_offer': return '📝 Created Offer';
      case 'take_offer': return '✅ Took Offer';
      case 'refund_offer': return '↩️ Refunded Offer';
      default: return type;
    }
  };

  const getExplorerUrl = (signature: string) => {
    return `https://solana.fm/tx/${signature}?cluster=testnet-solana`;
  };

  if (transactions.length === 0) {
    return null; // Hide when empty for cleaner UI
  }

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={styles.title}>Transaction History</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={loadTransactions} 
            style={{ 
              ...styles.buttonSecondary,
              width: 'auto',
              fontSize: '13px',
              padding: '8px 16px',
            }}
          >
            Refresh
          </button>
          <button 
            onClick={clearHistory} 
            style={{ 
              ...styles.buttonSecondary,
              width: 'auto',
              fontSize: '13px',
              padding: '8px 16px',
            }}
          >
            Clear
          </button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gap: '12px' }}>
        {transactions.map((tx, index) => (
          <div
            key={index}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                {getTypeLabel(tx.type)}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {formatDate(tx.timestamp)}
              </span>
            </div>
            
            {tx.details && (
              <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '10px' }}>
                {tx.details}
              </div>
            )}
            
            <a
              href={getExplorerUrl(tx.signature)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                fontSize: '12px', 
                fontFamily: 'monospace',
                color: '#14F195',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
              <span style={{ fontSize: '10px' }}>↗</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to save transactions (export for use in other components)
export function saveTransaction(
  signature: string,
  type: 'make_offer' | 'take_offer' | 'refund_offer',
  details?: string
) {
  const stored = localStorage.getItem('transaction_history');
  const transactions = stored ? JSON.parse(stored) : [];
  
  transactions.push({
    signature,
    type,
    timestamp: Date.now(),
    details,
  });
  
  // Keep only last 50 transactions
  if (transactions.length > 50) {
    transactions.shift();
  }
  
  localStorage.setItem('transaction_history', JSON.stringify(transactions));
}

