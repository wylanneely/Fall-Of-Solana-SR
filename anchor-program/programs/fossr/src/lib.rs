use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

// Must match the deployed program id (Anchor enforces this at runtime)
declare_id!("5WCXWwsaw8WRxMzxqBiAQ5ByHWY9ruV9egijtgC493SP");

/// Fee constants (simplified - no raffle)
pub const BURN_FEE_BPS: u16 = 69;             // 0.069% burn on buys
pub const DEV_FEE_BPS: u16 = 31;              // 0.031% dev fee
pub const RAFFLE_FEE_BPS: u16 = 621;          // 0.621% added to airdrop pot on buys
pub const SELL_BURN_FEE_BPS: u16 = 10;        // 0.1% burn on sells
pub const BASIS_POINTS: u32 = 100_000;        // 100% = 100,000 bps

/// Bonding curve constants
pub const PRICE_INCREMENT: u64 = 1;
pub const PRICE_DECREMENT: u64 = 1;
pub const MIN_PRICE: u64 = 100;               // Minimum price floor

/// Lock tier durations (in seconds)
pub const TIER1_MIN: i64 = 5 * 60;            // 5 minutes
pub const TIER1_MAX: i64 = 5 * 60 * 60;       // 5 hours
pub const TIER2_MIN: i64 = 4 * 60;            // 4 minutes  
pub const TIER2_MAX: i64 = 4 * 60 * 60;       // 4 hours
pub const TIER3_MIN: i64 = 3 * 60;            // 3 minutes
pub const TIER3_MAX: i64 = 3 * 60 * 60;       // 3 hours
pub const TIER4_MIN: i64 = 1 * 60;            // 1 minute
pub const TIER4_MAX: i64 = 1 * 60 * 60;       // 1 hour

/// SOL amount thresholds (in lamports)
pub const TIER1_THRESHOLD: u64 = 100_000_000;       // 0.1 SOL
pub const TIER2_THRESHOLD: u64 = 500_000_000;       // 0.5 SOL
pub const TIER3_THRESHOLD: u64 = 1_000_000_000;     // 1.0 SOL

/// Min/max buy amounts
pub const MIN_BUY_AMOUNT: u64 = 10_000_000;         // 0.01 SOL
pub const MAX_BUY_AMOUNT: u64 = 100_000_000_000;    // 100 SOL
pub const MIN_SELL_AMOUNT: u64 = 1_000_000_000;     // 1 token

#[program]
pub mod fossr {
    use super::*;

    /// Initialize the FOSSR program state (simplified)
    pub fn initialize(ctx: Context<Initialize>, initial_price: u64, airdrop_amount: u64) -> Result<()> {
        let clock = Clock::get()?;
        let state = &mut ctx.accounts.program_state;
        state.authority = ctx.accounts.authority.key();
        state.token_mint = ctx.accounts.token_mint.key();
        state.current_price = initial_price;
        state.total_burned = 0;
        state.total_buys = 0;
        state.next_airdrop_time = calculate_next_airdrop_time(clock.unix_timestamp);
        state.airdrop_amount = airdrop_amount;
        state.last_airdrop_cycle = clock.unix_timestamp;
        state.airdrop_executed = false;
        state.bump = ctx.bumps.program_state;

        // Ensure the SOL vault PDA exists so buys can transfer SOL into it.
        // If it doesn't exist yet, create it as a 0-byte account owned by this program.
        if ctx.accounts.program_vault.lamports() == 0 {
            let rent = Rent::get()?;
            let lamports = rent.minimum_balance(0);
            let vault_bump = ctx.bumps.program_vault;
            let seeds: &[&[u8]] = &[b"vault", &[vault_bump]];
            let signer = &[seeds];

            anchor_lang::system_program::create_account(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    anchor_lang::system_program::CreateAccount {
                        from: ctx.accounts.authority.to_account_info(),
                        to: ctx.accounts.program_vault.to_account_info(),
                    },
                    signer,
                ),
                lamports,
                0,
                ctx.program_id,
            )?;
        }

        msg!("FOSSR initialized | Price: {} | Airdrop every 5 minutes", initial_price);
        Ok(())
    }

    /// One-time helper: create the SOL vault PDA if it doesn't exist yet.
    /// This fixes "Attempt to debit an account but found no record of a prior credit" on buys.
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        require_keys_eq!(ctx.accounts.authority.key(), ctx.accounts.program_state.authority, ErrorCode::Unauthorized);

        if ctx.accounts.program_vault.lamports() > 0 {
            msg!("Vault already initialized");
            return Ok(());
        }

        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(0);
        let vault_bump = ctx.bumps.program_vault;
        let seeds: &[&[u8]] = &[b"vault", &[vault_bump]];
        let signer = &[seeds];

        anchor_lang::system_program::create_account(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::CreateAccount {
                    from: ctx.accounts.authority.to_account_info(),
                    to: ctx.accounts.program_vault.to_account_info(),
                },
                signer,
            ),
            lamports,
            0,
            ctx.program_id,
        )?;

        msg!("Vault initialized");
        Ok(())
    }

    /// Buy tokens with tiered protective locks
    pub fn buy_tokens(ctx: Context<BuyTokens>, sol_amount: u64, _timestamp: i64) -> Result<()> {
        let clock = Clock::get()?;
        
        // Get account info before mutable borrow
        let program_state_info = ctx.accounts.program_state.to_account_info();
        let state_bump = ctx.accounts.program_state.bump;
        
        let state = &mut ctx.accounts.program_state;
        
        require!(sol_amount >= MIN_BUY_AMOUNT, ErrorCode::BuyAmountTooSmall);
        require!(sol_amount <= MAX_BUY_AMOUNT, ErrorCode::BuyAmountTooLarge);
        require!(state.current_price > 0, ErrorCode::InvalidPrice);
        
        // Calculate tokens based on bonding curve price
        let tokens_before_fees = sol_amount
            .checked_mul(1_000_000_000)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .checked_div(state.current_price)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        
        // Calculate burn fee (0.069%)
        let burn_amount = tokens_before_fees
            .checked_mul(BURN_FEE_BPS as u64)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .checked_div(BASIS_POINTS as u64)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        // Calculate raffle fee (0.621%) which accumulates into the global airdrop pot
        let raffle_fee_amount = tokens_before_fees
            .checked_mul(RAFFLE_FEE_BPS as u64)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .checked_div(BASIS_POINTS as u64)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        
        let tokens_to_buyer = tokens_before_fees
            .checked_sub(burn_amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .checked_sub(raffle_fee_amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        
        // Calculate lock duration
        let slot_hashes_data = ctx.accounts.slot_hashes.data.borrow();
        let lock_duration = calculate_lock_duration(sol_amount, clock.unix_timestamp, clock.slot, &slot_hashes_data)?;
        let unlock_time = clock.unix_timestamp + lock_duration;
        
        // Transfer SOL to program vault
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.program_vault.to_account_info(),
                },
            ),
            sol_amount,
        )?;
        
        // Mint tokens to buyer's ATA (not locked for MVP simplicity)
        let bump = &[state_bump];
        let seeds: &[&[u8]] = &[b"program-state", bump];
        let signer = &[seeds];
        
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.token_mint.to_account_info(),
                    to: ctx.accounts.buyer_token_account.to_account_info(),
                    authority: program_state_info.clone(),
                },
                signer,
            ),
            tokens_to_buyer,
        )?;
        
        // Update state (burn is implicit - we don't mint burn_amount)
        state.total_burned = state.total_burned.checked_add(burn_amount).ok_or(ErrorCode::ArithmeticOverflow)?;
        state.total_buys = state.total_buys.checked_add(1).ok_or(ErrorCode::ArithmeticOverflow)?;
        // Global airdrop pot increases with each buy
        state.airdrop_amount = state.airdrop_amount
            .checked_add(raffle_fee_amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        
        // Update bonding curve price
        let price_increase = sol_amount
            .checked_div(1_000_000_000)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .max(1);
        state.current_price = state.current_price.checked_add(price_increase).ok_or(ErrorCode::ArithmeticOverflow)?;
        
        // Create purchase order for tracking
        let order = &mut ctx.accounts.purchase_order;
        order.buyer = ctx.accounts.buyer.key();
        order.sol_amount = sol_amount;
        order.token_amount = tokens_to_buyer;
        order.timestamp = clock.unix_timestamp;
        order.unlock_time = unlock_time;
        order.bump = ctx.bumps.purchase_order;
        
        msg!(
            "Buy: {} tokens for {} lamports | Raffle pot +{} | Lock until: {}",
            tokens_to_buyer,
            sol_amount,
            raffle_fee_amount,
            unlock_time
        );
        Ok(())
    }

    /// Sell tokens back to bonding curve
    pub fn sell_tokens(ctx: Context<SellTokens>, token_amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        
        require!(token_amount >= MIN_SELL_AMOUNT, ErrorCode::SellAmountTooSmall);
        require!(ctx.accounts.seller_token_account.amount >= token_amount, ErrorCode::InsufficientBalance);
        require!(state.current_price > 0, ErrorCode::InvalidPrice);
        
        // Calculate burn fee
        let sell_burn = token_amount
            .checked_mul(SELL_BURN_FEE_BPS as u64)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .checked_div(BASIS_POINTS as u64)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        
        let tokens_to_convert = token_amount.checked_sub(sell_burn).ok_or(ErrorCode::ArithmeticOverflow)?;
        
        // Calculate SOL to return
        let sol_amount = tokens_to_convert
            .checked_mul(state.current_price)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .checked_div(1_000_000_000)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        
        require!(ctx.accounts.program_vault.lamports() >= sol_amount, ErrorCode::InsufficientVaultBalance);
        
        // Burn tokens
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.token_mint.to_account_info(),
                    from: ctx.accounts.seller_token_account.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            token_amount,
        )?;
        
        // Transfer SOL back
        let vault_bump = &[ctx.bumps.program_vault];
        let vault_seeds: &[&[u8]] = &[b"vault", vault_bump];
        let vault_signer = &[vault_seeds];
        
        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.program_vault.to_account_info(),
                    to: ctx.accounts.seller.to_account_info(),
                },
                vault_signer,
            ),
            sol_amount,
        )?;
        
        // Update state
        state.total_burned = state.total_burned.checked_add(sell_burn).ok_or(ErrorCode::ArithmeticOverflow)?;
        let price_decrease = sol_amount.checked_div(1_000_000_000).ok_or(ErrorCode::ArithmeticOverflow)?.max(1);
        state.current_price = state.current_price.saturating_sub(price_decrease).max(MIN_PRICE);
        
        msg!("Sell: {} tokens for {} lamports", token_amount, sol_amount);
        Ok(())
    }

    /// Airdrop tokens to ONE eligible user per cycle (level 2+ = holding MIN_AIRDROP_ELIGIBLE tokens)
    /// Authority calls this once per cycle to award a single winner
    pub fn airdrop(ctx: Context<Airdrop>) -> Result<()> {
        let clock = Clock::get()?;

        // Get account info before mutable borrow
        let program_state_info = ctx.accounts.program_state.to_account_info();

        let state = &mut ctx.accounts.program_state;

        // Only authority can execute
        require_keys_eq!(ctx.accounts.authority.key(), state.authority, ErrorCode::Unauthorized);

        // Check if airdrop already executed this cycle
        require!(!state.airdrop_executed, ErrorCode::AirdropAlreadyExecuted);

        // Check recipient is eligible (holds enough tokens = level 2+)
        require!(
            ctx.accounts.recipient_token_account.amount >= MIN_AIRDROP_ELIGIBLE,
            ErrorCode::NotEligibleForAirdrop
        );

        let amount = state.airdrop_amount;
        let bump = &[state.bump];
        let seeds: &[&[u8]] = &[b"program-state", bump];
        let signer = &[seeds];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.token_mint.to_account_info(),
                    to: ctx.accounts.recipient_token_account.to_account_info(),
                    authority: program_state_info,
                },
                signer,
            ),
            amount,
        )?;

        // Record the winner on-chain so UIs can display "who won".
        // This is a singleton PDA that gets overwritten each airdrop.
        let last = &mut ctx.accounts.last_airdrop;
        last.winner = ctx.accounts.recipient_token_account.owner;
        last.winner_token_account = ctx.accounts.recipient_token_account.key();
        last.amount = amount;
        last.timestamp = clock.unix_timestamp;
        last.bump = ctx.bumps.last_airdrop;

        // Mark airdrop as executed for this cycle and RESET the pot to 0
        state.airdrop_executed = true;
        state.last_airdrop_cycle = clock.unix_timestamp;
        state.airdrop_amount = 0; // Reset pot after awarding

        msg!("Airdrop: {} tokens awarded to single winner | Pot reset to 0", amount);
        Ok(())
    }
    
    /// Reset airdrop timer and prepare for next cycle (authority calls after awarding winner)
    pub fn reset_airdrop_cycle(ctx: Context<ResetAirdrop>) -> Result<()> {
        let clock = Clock::get()?;
        let state = &mut ctx.accounts.program_state;

        require_keys_eq!(ctx.accounts.authority.key(), state.authority, ErrorCode::Unauthorized);

        // Check that current cycle has ended
        require!(
            clock.unix_timestamp >= state.next_airdrop_time,
            ErrorCode::AirdropNotReady
        );

        // Set next airdrop time aligned to 5-minute intervals and reset execution flag
        state.next_airdrop_time = calculate_next_airdrop_time(clock.unix_timestamp);
        state.airdrop_executed = false;

        msg!("Airdrop cycle reset | Next airdrop at: {} | Ready for new winner", state.next_airdrop_time);
        Ok(())
    }
    
    /// Update airdrop settings (authority only)
    pub fn update_airdrop_settings(ctx: Context<UpdateSettings>, new_amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        
        require_keys_eq!(ctx.accounts.authority.key(), state.authority, ErrorCode::Unauthorized);
        
        state.airdrop_amount = new_amount;
        
        msg!("Airdrop amount updated to: {}", new_amount);
        Ok(())
    }
    
    /// Update token mint (authority only) - for migrations
    pub fn update_token_mint(ctx: Context<UpdateTokenMint>) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        
        require_keys_eq!(ctx.accounts.authority.key(), state.authority, ErrorCode::Unauthorized);
        
        state.token_mint = ctx.accounts.new_token_mint.key();
        
        msg!("Token mint updated to: {}", ctx.accounts.new_token_mint.key());
        Ok(())
    }
}

/// Calculate next airdrop time aligned to 5-minute intervals
fn calculate_next_airdrop_time(current_time: i64) -> i64 {
    // Align to 5-minute (300 second) intervals
    let remainder = current_time % AIRDROP_INTERVAL;
    if remainder == 0 {
        current_time + AIRDROP_INTERVAL
    } else {
        current_time + (AIRDROP_INTERVAL - remainder)
    }
}

fn calculate_lock_duration(sol_amount: u64, timestamp: i64, slot: u64, slot_hashes_data: &[u8]) -> Result<i64> {
    let (min, max) = if sol_amount < TIER1_THRESHOLD {
        (TIER1_MIN, TIER1_MAX)
    } else if sol_amount < TIER2_THRESHOLD {
        (TIER2_MIN, TIER2_MAX)
    } else if sol_amount < TIER3_THRESHOLD {
        (TIER3_MIN, TIER3_MAX)
    } else {
        (TIER4_MIN, TIER4_MAX)
    };
    
    let range = max - min;
    let hash_seed = if slot_hashes_data.len() >= 8 {
        u64::from_le_bytes(slot_hashes_data[0..8].try_into().unwrap())
    } else {
        timestamp as u64
    };
    
    let combined = hash_seed.wrapping_add(timestamp as u64).wrapping_add(slot);
    let offset = (combined % (range as u64)) as i64;
    
    Ok(min + offset)
}

// ============= ACCOUNTS =============

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProgramState::INIT_SPACE,
        seeds = [b"program-state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// CHECK: Token mint pubkey
    pub token_mint: AccountInfo<'info>,
    
    /// CHECK: Program vault PDA that holds SOL
    #[account(mut, seeds = [b"vault"], bump)]
    pub program_vault: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Program vault PDA that holds SOL
    #[account(mut, seeds = [b"vault"], bump)]
    pub program_vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(sol_amount: u64, timestamp: i64)]
pub struct BuyTokens<'info> {
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = token_mint,
        associated_token::authority = buyer
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = buyer,
        space = 8 + PurchaseOrder::INIT_SPACE,
        seeds = [b"order", buyer.key().as_ref(), &timestamp.to_le_bytes()],
        bump
    )]
    pub purchase_order: Account<'info, PurchaseOrder>,
    
    /// CHECK: Program vault for SOL
    #[account(mut, seeds = [b"vault"], bump)]
    pub program_vault: AccountInfo<'info>,
    
    /// CHECK: Slot hashes for randomness
    #[account(address = anchor_lang::solana_program::sysvar::slot_hashes::ID)]
    pub slot_hashes: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SellTokens<'info> {
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Program vault
    #[account(mut, seeds = [b"vault"], bump)]
    pub program_vault: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Airdrop<'info> {
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + LastAirdrop::INIT_SPACE,
        seeds = [b"last-airdrop"],
        bump
    )]
    pub last_airdrop: Account<'info, LastAirdrop>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResetAirdrop<'info> {
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateSettings<'info> {
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateTokenMint<'info> {
    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,
    
    pub authority: Signer<'info>,
    
    pub new_token_mint: Account<'info, Mint>,
}

// ============= STATE =============

/// Airdrop every 5 minutes = 300 seconds (simplified from 4:20)
pub const AIRDROP_INTERVAL: i64 = 300;
/// Minimum tokens to be eligible for airdrop (level 2+ roughly)
pub const MIN_AIRDROP_ELIGIBLE: u64 = 10_000_000_000_000; // 10,000 tokens

#[account]
#[derive(InitSpace)]
pub struct ProgramState {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub current_price: u64,
    pub total_burned: u64,
    pub total_buys: u64,
    pub next_airdrop_time: i64,    // When next airdrop can happen
    pub airdrop_amount: u64,       // Amount per eligible user
    pub last_airdrop_cycle: i64,   // Timestamp of last airdrop cycle
    pub airdrop_executed: bool,    // Whether airdrop was executed this cycle
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PurchaseOrder {
    pub buyer: Pubkey,
    pub sol_amount: u64,
    pub token_amount: u64,
    pub timestamp: i64,
    pub unlock_time: i64,
    pub bump: u8,
}

/// Stores the most recent airdrop winner (singleton PDA).
/// This lets clients show "who won" without scanning transaction logs.
#[account]
#[derive(InitSpace)]
pub struct LastAirdrop {
    pub winner: Pubkey,
    pub winner_token_account: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub bump: u8,
}

// ============= ERRORS =============

#[error_code]
pub enum ErrorCode {
    #[msg("Tokens are still locked")]
    TokensStillLocked,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Insufficient vault balance")]
    InsufficientVaultBalance,
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Buy amount too small")]
    BuyAmountTooSmall,
    #[msg("Buy amount too large")]
    BuyAmountTooLarge,
    #[msg("Sell amount too small")]
    SellAmountTooSmall,
    #[msg("Not eligible for airdrop - need 10,000+ tokens")]
    NotEligibleForAirdrop,
    #[msg("Airdrop not ready yet - wait for next cycle")]
    AirdropNotReady,
    #[msg("Airdrop already executed this cycle - only one winner per cycle")]
    AirdropAlreadyExecuted,
}
