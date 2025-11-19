use anchor_lang::prelude::*;

// Stores details of an offer to swap token A for token B
// Think of it like an interface in Typescript - it defines the shape of the data, but not the implementation
// InitSpace allows us to calculate the space needed for this data
#[account] // This is a Solana account - it's a data structure that is stored on the blockchain
#[derive(InitSpace)]
pub struct Offer {
    // Identifier of the offer
    pub id: u64,
    // Who made the offer
    pub maker: Pubkey,
    // The token mint of the token being offered
    pub token_mint_a: Pubkey,
    // The token mint of the token wanted
    pub token_mint_b: Pubkey,
    // the amount of token b wanted
    pub token_b_wanted_amount: u64,
    // Used to calculate the address for this account,
    // we save it as a performance optimization
    pub bump: u8,
}
