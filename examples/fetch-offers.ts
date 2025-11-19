/**
 * Fetch all offers from the program
 */
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { Escrow } from "../target/types/escrow";
import idl from "../target/idl/escrow.json";

const PROGRAM_ID = new PublicKey("GrHFY4E7GFtzcTfHcoFV7V1MumQdenQqDYbMC6W3ysG2");

async function main() {
  const connection = new anchor.web3.Connection("https://api.testnet.solana.com", "confirmed");
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new Program<Escrow>(idl as Escrow, provider);

  console.log("Fetching all offers...\n");

  // Fetch all offer accounts
  const offers = await program.account.offer.all();

  console.log(`Found ${offers.length} offers:\n`);

  offers.forEach((offer, index) => {
    console.log(`Offer #${index + 1}`);
    console.log(`  Address: ${offer.publicKey.toString()}`);
    console.log(`  ID: ${offer.account.id.toString()}`);
    console.log(`  Maker: ${offer.account.maker.toString()}`);
    console.log(`  Token A: ${offer.account.tokenMintA.toString()}`);
    console.log(`  Token B: ${offer.account.tokenMintB.toString()}`);
    console.log(`  Amount wanted: ${offer.account.tokenBWantedAmount.toString()}`);
    console.log(`  Bump: ${offer.account.bump}`);
    console.log("");
  });

  // Filter offers by maker
  const makerAddress = wallet.publicKey;
  const myOffers = offers.filter(o => o.account.maker.equals(makerAddress));
  console.log(`Your offers: ${myOffers.length}`);

  // Fetch specific offer
  if (offers.length > 0) {
    const firstOffer = offers[0];
    console.log("\nFetching specific offer:");
    const specificOffer = await program.account.offer.fetch(firstOffer.publicKey);
    console.log(specificOffer);
  }
}

main().catch(console.error);

