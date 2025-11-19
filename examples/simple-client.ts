/**
 * Simple TypeScript client example using Anchor
 */
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import type { Escrow } from "../target/types/escrow";
import idl from "../target/idl/escrow.json";

// Program ID from your deployment
const PROGRAM_ID = new PublicKey("GrHFY4E7GFtzcTfHcoFV7V1MumQdenQqDYbMC6W3ysG2");

async function main() {
  // Connect to testnet
  const connection = new anchor.web3.Connection("https://api.testnet.solana.com", "confirmed");
  
  // Load your wallet
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  
  // Create program instance
  const program = new Program<Escrow>(idl as Escrow, provider);

  console.log("Program ID:", program.programId.toString());
  console.log("Wallet:", wallet.publicKey.toString());

  // Example: Make an offer
  const offerId = new anchor.BN(Date.now()); // Unique offer ID
  const tokenAAmount = new anchor.BN(1_000_000_000); // 1 token (9 decimals)
  const tokenBAmount = new anchor.BN(1_000_000_000); // 1 token (9 decimals)

  // Replace these with your actual token mints
  const tokenMintA = new PublicKey("YOUR_TOKEN_MINT_A");
  const tokenMintB = new PublicKey("YOUR_TOKEN_MINT_B");

  // Derive PDAs
  const [offer] = PublicKey.findProgramAddressSync(
    [Buffer.from("offer"), offerId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const makerTokenAccountA = await getAssociatedTokenAddress(
    tokenMintA,
    wallet.publicKey
  );

  const vault = await getAssociatedTokenAddress(
    tokenMintA,
    offer,
    true // allowOwnerOffCurve
  );

  // Make offer transaction
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
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Offer created!");
    console.log("Signature:", signature);
    console.log("Offer account:", offer.toString());
    console.log("Vault:", vault.toString());
  } catch (error) {
    console.error("Error creating offer:", error);
  }

  // Example: Fetch offer data
  try {
    const offerData = await program.account.offer.fetch(offer);
    console.log("\nOffer data:");
    console.log("- ID:", offerData.id.toString());
    console.log("- Maker:", offerData.maker.toString());
    console.log("- Token A:", offerData.tokenMintA.toString());
    console.log("- Token B:", offerData.tokenMintB.toString());
    console.log("- Amount wanted:", offerData.tokenBWantedAmount.toString());
  } catch (error) {
    console.error("Offer not found or error fetching:", error);
  }

  // Example: Take offer
  async function takeOffer(offerAddress: PublicKey) {
    const offerData = await program.account.offer.fetch(offerAddress);
    
    const takerTokenAccountA = await getAssociatedTokenAddress(
      offerData.tokenMintA,
      wallet.publicKey
    );

    const takerTokenAccountB = await getAssociatedTokenAddress(
      offerData.tokenMintB,
      wallet.publicKey
    );

    const makerTokenAccountB = await getAssociatedTokenAddress(
      offerData.tokenMintB,
      offerData.maker
    );

    const vault = await getAssociatedTokenAddress(
      offerData.tokenMintA,
      offerAddress,
      true
    );

    const signature = await program.methods
      .takeOffer()
      .accounts({
        taker: wallet.publicKey,
        maker: offerData.maker,
        tokenMintA: offerData.tokenMintA,
        tokenMintB: offerData.tokenMintB,
        takerTokenAccountA,
        takerTokenAccountB,
        makerTokenAccountB,
        offer: offerAddress,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Offer taken! Signature:", signature);
  }

  // Example: Refund offer
  async function refundOffer(offerAddress: PublicKey) {
    const offerData = await program.account.offer.fetch(offerAddress);
    
    const makerTokenAccountA = await getAssociatedTokenAddress(
      offerData.tokenMintA,
      wallet.publicKey
    );

    const vault = await getAssociatedTokenAddress(
      offerData.tokenMintA,
      offerAddress,
      true
    );

    const signature = await program.methods
      .refundOffer()
      .accounts({
        maker: wallet.publicKey,
        tokenMintA: offerData.tokenMintA,
        makerTokenAccountA,
        offer: offerAddress,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Offer refunded! Signature:", signature);
  }
}

main().catch(console.error);

