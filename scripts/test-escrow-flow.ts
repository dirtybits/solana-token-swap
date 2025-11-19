/**
 * Complete end-to-end test of the escrow program
 */
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import type { Escrow } from '../target/types/escrow';
import idl from '../target/idl/escrow.json';
import * as fs from 'fs';
import BN from 'bn.js';

const PROGRAM_ID = new PublicKey('GrHFY4E7GFtzcTfHcoFV7V1MumQdenQqDYbMC6W3ysG2');

async function main() {
  // Load config
  if (!fs.existsSync('test-tokens.json')) {
    console.log('❌ Run setup-test-tokens.ts first to create tokens');
    return;
  }

  const config = JSON.parse(fs.readFileSync('test-tokens.json', 'utf-8'));
  console.log('Using tokens from test-tokens.json\n');

  // Setup
  const connection = new Connection('https://api.testnet.solana.com', 'confirmed');
  const walletPath = process.env.HOME + '/.config/solana/id.json';
  const wallet = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: 'confirmed' }
  );
  const program = new Program<Escrow>(idl as Escrow, provider);

  console.log('Wallet:', wallet.publicKey.toString());
  console.log('Program:', PROGRAM_ID.toString());

  const tokenMintA = new PublicKey(config.tokenMintA);
  const tokenMintB = new PublicKey(config.tokenMintB);

  // Test 1: Make an offer
  console.log('\n--- TEST 1: Make Offer ---');
  const offerId = new BN(Date.now());
  const tokenAAmount = new BN(5 * 1e9); // Offer 5 Token A
  const tokenBAmount = new BN(3 * 1e9); // Want 3 Token B

  const [offer] = PublicKey.findProgramAddressSync(
    [Buffer.from('offer'), offerId.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );

  const makerTokenAccountA = await getAssociatedTokenAddress(
    tokenMintA,
    wallet.publicKey
  );

  const vault = await getAssociatedTokenAddress(
    tokenMintA,
    offer,
    true
  );

  console.log('Creating offer...');
  console.log('- Offering: 5 Token A');
  console.log('- Wanting: 3 Token B');

  try {
    const signature = await program.methods
      .makeOffer(offerId, tokenAAmount, tokenBAmount)
      .accounts({
        maker: wallet.publicKey,
        tokenMintA,
        tokenMintB,
        makerTokenAccountA,
        offer,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log('✓ Offer created!');
    console.log('  Signature:', signature);
    console.log('  Offer address:', offer.toString());

    // Fetch offer data
    const offerData = await program.account.offer.fetch(offer);
    console.log('\nOffer details:');
    console.log('  ID:', offerData.id.toString());
    console.log('  Maker:', offerData.maker.toString());
    console.log('  Token A:', offerData.tokenMintA.toString());
    console.log('  Token B:', offerData.tokenMintB.toString());
    console.log('  Amount wanted:', offerData.tokenBWantedAmount.toString());
  } catch (error) {
    console.error('❌ Error making offer:', error);
    return;
  }

  // Test 2: View all offers
  console.log('\n--- TEST 2: View All Offers ---');
  const offers = await program.account.offer.all();
  console.log(`Found ${offers.length} total offer(s) on testnet`);
  
  offers.forEach((o, i) => {
    console.log(`\nOffer #${i + 1}:`);
    console.log('  Address:', o.publicKey.toString());
    console.log('  Maker:', o.account.maker.toString());
    console.log('  Wants:', o.account.tokenBWantedAmount.toString(), 'tokens');
  });

  // Test 3: Refund offer
  console.log('\n--- TEST 3: Refund Offer ---');
  console.log('Refunding the offer...');

  try {
    const refundSignature = await program.methods
      .refundOffer()
      .accounts({
        maker: wallet.publicKey,
        tokenMintA,
        makerTokenAccountA,
        offer,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log('✓ Offer refunded!');
    console.log('  Signature:', refundSignature);
    console.log('  Your tokens have been returned');
  } catch (error) {
    console.error('❌ Error refunding offer:', error);
  }

  console.log('\n✅ Test complete!');
  console.log('\nNext steps:');
  console.log('1. Use the frontend at http://localhost:5173');
  console.log('2. Enter these token addresses:');
  console.log('   Token A:', tokenMintA.toString());
  console.log('   Token B:', tokenMintB.toString());
  console.log('3. Create and take offers!');
}

main().catch(console.error);

