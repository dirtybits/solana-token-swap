# Using This as a Scaffold

This project provides a complete Solana dapp foundation.

## What's Included

- ✅ Anchor program with best practices
- ✅ Codama-generated TypeScript client (Kit v2)
- ✅ React frontend with wallet integration
- ✅ Modern UI (dark theme, glassmorphism)
- ✅ Transaction history
- ✅ Token creation scripts
- ✅ Testing infrastructure

## Starting a New Project

### 1. Clone and Reset

```bash
# Copy this directory
cp -r swap-program my-new-project
cd my-new-project

# Remove existing program
rm -rf programs/escrow
mkdir -p programs/my-program

# Clear test tokens
rm -f test-tokens.json legacy-tokens.json
```

### 2. Create Your Program

```bash
# Initialize new program
cd programs/my-program
cargo init --lib

# Update Cargo.toml with Anchor dependencies
# Copy structure from escrow example
```

### 3. Update Configuration

**Anchor.toml:**
```toml
[programs.localnet]
my_program = "11111111111111111111111111111111"

[programs.testnet]
my_program = "11111111111111111111111111111111"
```

**programs/my-program/src/lib.rs:**
```rust
declare_id!("11111111111111111111111111111111");
```

### 4. Build and Generate Client

```bash
anchor build
npm run regenerate-client
```

### 5. Update Frontend

**Update imports in components:**
```typescript
import * as programClient from '../../../dist/js-client';
// Use: programClient.MY_PROGRAM_PROGRAM_ADDRESS
```

### 6. Deploy

```bash
# Testnet
solana config set --url testnet
anchor deploy

# Update program ID in lib.rs and Anchor.toml
anchor build
npm run regenerate-client
anchor upgrade target/deploy/my_program.so --program-id <NEW_ID>
```

## What to Keep

**Always useful:**
- Frontend structure (App.tsx, wallet integration)
- Styling system (styles.ts, index.css)
- Transaction history component
- Token creation scripts
- Test setup with solana-kite

**What to modify:**
- Program logic (handlers, state, instructions)
- Frontend components (adapt to your program's instructions)
- Token types (if not using SPL tokens)

## Customization Checklist

- [ ] Change program name in all files
- [ ] Update declare_id!() after first deploy
- [ ] Modify program instructions for your use case
- [ ] Update frontend components to match your instructions
- [ ] Customize UI colors/branding
- [ ] Add your token metadata
- [ ] Update README with your project details

## Best Practices Included

1. **Proper Anchor structure** - handlers, state, errors separated
2. **Type safety** - TypeScript throughout
3. **Modern UI** - Clean, professional design
4. **Error handling** - Comprehensive error messages
5. **Testing** - Both Rust and TypeScript tests
6. **Documentation** - Comments and guides

## For Different Project Types

**NFT Project:**
- Replace token logic with NFT minting
- Add Metaplex dependencies
- Update frontend for NFT display

**DeFi Protocol:**
- Keep token infrastructure
- Add oracle integration if needed
- Expand state management

**Marketplace:**
- Keep escrow concepts
- Add listing/bidding logic
- Expand frontend with search/filters

## Resources

- [Anchor Docs](https://www.anchor-lang.com/docs)
- [Codama Docs](https://github.com/codama-idl/codama)
- [Kit v2 Docs](https://github.com/anza-xyz/kit)
- [Solana Cookbook](https://solanacookbook.com/)

