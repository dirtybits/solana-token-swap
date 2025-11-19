/**
 * Create test tokens on testnet for escrow testing
 */
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  getMintLen,
  ExtensionType,
  LENGTH_SIZE,
  TYPE_SIZE,
} from '@solana/spl-token';
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import * as fs from 'fs';

async function main() {
  // Connect to testnet
  const connection = new Connection('https://api.testnet.solana.com', 'confirmed');
  
  // Load your wallet
  const walletPath = process.env.HOME + '/.config/solana/id.json';
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );

  console.log('Wallet:', walletKeypair.publicKey.toString());
  console.log('Getting balance...');
  
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`Balance: ${balance / 1e9} SOL\n`);

  if (balance < 0.5e9) {
    console.log('⚠️  Low balance. Get more SOL from https://faucet.solana.com/');
    return;
  }

  console.log('Creating Token A...');
  const tokenMintA = await createMint(
    connection,
    walletKeypair,
    walletKeypair.publicKey, // mint authority
    null, // freeze authority
    9 // decimals
  );
  console.log('✓ Token A created:', tokenMintA.toString());

  console.log('\nCreating Token B...');
  const tokenMintB = await createMint(
    connection,
    walletKeypair,
    walletKeypair.publicKey,
    null,
    9
  );
  console.log('✓ Token B created:', tokenMintB.toString());

  // Create token accounts for your wallet
  console.log('\nCreating token accounts...');
  const tokenAccountA = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    tokenMintA,
    walletKeypair.publicKey
  );
  console.log('✓ Token Account A:', tokenAccountA.address.toString());

  const tokenAccountB = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    tokenMintB,
    walletKeypair.publicKey
  );
  console.log('✓ Token Account B:', tokenAccountB.address.toString());

  // Mint tokens to your wallet
  console.log('\nMinting tokens...');
  const amountToMint = 100 * 1e9; // 100 tokens

  await mintTo(
    connection,
    walletKeypair,
    tokenMintA,
    tokenAccountA.address,
    walletKeypair.publicKey,
    amountToMint
  );
  console.log('✓ Minted 100 Token A');

  await mintTo(
    connection,
    walletKeypair,
    tokenMintB,
    tokenAccountB.address,
    walletKeypair.publicKey,
    amountToMint
  );
  console.log('✓ Minted 100 Token B');

  // Save the addresses to a file
  const config = {
    wallet: walletKeypair.publicKey.toString(),
    tokenMintA: tokenMintA.toString(),
    tokenMintB: tokenMintB.toString(),
    tokenAccountA: tokenAccountA.address.toString(),
    tokenAccountB: tokenAccountB.address.toString(),
  };

  fs.writeFileSync(
    'test-tokens.json',
    JSON.stringify(config, null, 2)
  );
  console.log('\n✓ Configuration saved to test-tokens.json');

  console.log('\n📋 Use these addresses in your frontend:');
  console.log('Token Mint A:', tokenMintA.toString());
  console.log('Token Mint B:', tokenMintB.toString());
  console.log('\nYou now have 100 of each token in your wallet!');
}

main().catch(console.error);

