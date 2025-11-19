/**
 * Create a token with metadata (name, symbol, etc.) using Token Extensions
 */
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  getMintLen,
  ExtensionType,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TYPE_SIZE,
  LENGTH_SIZE,
} from '@solana/spl-token';
import { createInitializeInstruction, pack, TokenMetadata } from '@solana/spl-token-metadata';
import * as fs from 'fs';

async function createTokenWithMetadata(
  connection: Connection,
  payer: Keypair,
  name: string,
  symbol: string,
  uri: string = '',
  decimals: number = 9
): Promise<{ mint: PublicKey; tokenAccount: PublicKey }> {
  
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  // Metadata to store in the mint
  const metadata: TokenMetadata = {
    updateAuthority: payer.publicKey,
    mint: mint,
    name,
    symbol,
    uri,
    additionalMetadata: [],
  };

  const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
  const metadataLen = pack(metadata).length;
  
  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const lamports = await connection.getMinimumBalanceForRentExemption(
    mintLen + metadataExtension + metadataLen
  );

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMetadataPointerInstruction(
      mint,
      payer.publicKey,
      mint,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint,
      decimals,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      mint,
      metadata: mint,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      mintAuthority: payer.publicKey,
      updateAuthority: payer.publicKey,
    })
  );

  await sendAndConfirmTransaction(connection, transaction, [payer, mintKeypair]);

  console.log(`✓ Created token: ${name} (${symbol})`);
  console.log(`  Mint: ${mint.toString()}`);

  // Create token account and mint some tokens
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  const amountToMint = 100 * 10 ** decimals;
  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer.publicKey,
    amountToMint,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  console.log(`  Minted: ${100} tokens to ${tokenAccount.address.toString()}`);

  return {
    mint,
    tokenAccount: tokenAccount.address,
  };
}

async function main() {
  const connection = new Connection('https://api.testnet.solana.com', 'confirmed');
  
  const walletPath = process.env.HOME + '/.config/solana/id.json';
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );

  console.log('Wallet:', walletKeypair.publicKey.toString());
  
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`Balance: ${balance / 1e9} SOL\n`);

  if (balance < 1e9) {
    console.log('⚠️  Low balance. Get more SOL from https://faucet.solana.com/');
    return;
  }

  console.log('Creating Token A with metadata...');
  const tokenA = await createTokenWithMetadata(
    connection,
    walletKeypair,
    'My Token A',
    'TKNA',
    'https://example.com/token-a.json'
  );

  console.log('\nCreating Token B with metadata...');
  const tokenB = await createTokenWithMetadata(
    connection,
    walletKeypair,
    'My Token B',
    'TKNB',
    'https://example.com/token-b.json'
  );

  const config = {
    wallet: walletKeypair.publicKey.toString(),
    tokenMintA: tokenA.mint.toString(),
    tokenMintB: tokenB.mint.toString(),
    tokenAccountA: tokenA.tokenAccount.toString(),
    tokenAccountB: tokenB.tokenAccount.toString(),
    tokens: {
      tokenA: { name: 'My Token A', symbol: 'TKNA' },
      tokenB: { name: 'My Token B', symbol: 'TKNB' },
    },
  };

  fs.writeFileSync('test-tokens.json', JSON.stringify(config, null, 2));
  console.log('\n✓ Configuration saved to test-tokens.json');
  
  console.log('\n📋 Your new tokens:');
  console.log('Token A (TKNA):', tokenA.mint.toString());
  console.log('Token B (TKNB):', tokenB.mint.toString());
}

main().catch(console.error);

