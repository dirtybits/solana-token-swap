/**
 * Frontend configuration
 * Update these values with your deployed program and test tokens
 */

export const config = {
  // Network
  network: 'testnet' as 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet',
  
  // Test tokens (update after running create-named-token.ts)
  // Replace these with your actual token addresses
  testTokens: {
    tokenA: {
      name: 'Token A',
      address: 'YOUR_TOKEN_A_MINT_ADDRESS', // Replace with your token
    },
    tokenB: {
      name: 'Token B',
      address: 'YOUR_TOKEN_B_MINT_ADDRESS', // Replace with your token
    },
  },
};

