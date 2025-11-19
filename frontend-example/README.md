# Escrow Program Frontend

React frontend using the generated Codama client.

## Setup

```bash
cd frontend-example
npm install
```

## Run

```bash
npm run dev
```

Open http://localhost:5173

## Features

- Connect Phantom wallet
- Create offers (swap tokens)
- View all active offers
- Take offers
- Refund offers

## Using the Generated Client

The frontend imports from `../dist/js-client/`:

```typescript
import * as programClient from '../../../dist/js-client';

// Create instruction
const instruction = await programClient.getMakeOfferInstructionAsync({
  maker: publicKey,
  tokenMintA,
  tokenMintB,
  // ... accounts
});

// Get offer decoder
const decoder = programClient.getOfferDecoder();
const offer = decoder.decode(accountData);

// Program address
programClient.ESCROW_PROGRAM_ADDRESS
```

## Next Steps

1. Install Phantom wallet
2. Connect to testnet
3. Get testnet SOL and tokens
4. Create and take offers

