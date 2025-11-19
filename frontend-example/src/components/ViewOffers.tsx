import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import * as programClient from '../../../dist/js-client';

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
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      // Use the generated client to fetch all offer accounts
      const getOffers = async () => {
        const accounts = await connection.getProgramAccounts(
          programClient.ESCROW_PROGRAM_ADDRESS,
          {
            filters: [
              {
                memcmp: {
                  offset: 0,
                  bytes: Buffer.from(programClient.OFFER_DISCRIMINATOR).toString('base64'),
                },
              },
            ],
          }
        );
        
        return accounts.map(acc => {
          // Decode the account data using the generated decoder
          const decoder = programClient.getOfferDecoder();
          const decoded = decoder.decode(acc.account.data);
          
          return {
            address: acc.pubkey.toString(),
            id: decoded.id.toString(),
            maker: decoded.maker.toString(),
            tokenMintA: decoded.tokenMintA.toString(),
            tokenMintB: decoded.tokenMintB.toString(),
            tokenBWantedAmount: decoded.tokenBWantedAmount.toString(),
          };
        });
      };

      const fetchedOffers = await getOffers();
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

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
      <h2>Active Offers</h2>
      <button onClick={fetchOffers} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>
      
      <div style={{ marginTop: '20px' }}>
        {offers.length === 0 ? (
          <p>No offers found</p>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.address}
              style={{
                border: '1px solid #eee',
                padding: '15px',
                marginBottom: '10px',
                borderRadius: '4px',
              }}
            >
              <p><strong>Offer ID:</strong> {offer.id}</p>
              <p><strong>Maker:</strong> {offer.maker}</p>
              <p><strong>Offering:</strong> {offer.tokenMintA}</p>
              <p><strong>Wants:</strong> {offer.tokenBWantedAmount} of {offer.tokenMintB}</p>
              <button>Take Offer</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

