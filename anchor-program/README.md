# 🔐 FOSSR Anchor Program

## Overview

This is the Solana smart contract for **$FOSSR** (Fall of Solana Strategic Reserve), implementing:

- ✅ Tiered protective locks (randomized 1m-5h based on buy size)
- ✅ Automatic token burns (0.069% per transaction)
- ✅ Raffle system with 24h cycles (0.621% to pot)
- ✅ Buy/sell via bonding curve
- ✅ Anti-rugpull mechanics

## 📋 Prerequisites

Install the following:

1. **Rust**: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. **Solana CLI**: `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`
3. **Anchor**: `cargo install --git https://github.com/coral-xyz/anchor avm --locked && avm install latest && avm use latest`

Verify installations:
```bash
rustc --version
solana --version
anchor --version
```

## 🚀 Build & Deploy

### Step 1: Build the Program

```bash
cd anchor-program
anchor build
```

This generates:
- Program binary: `target/deploy/fossr.so`
- IDL: `target/idl/fossr.json`

### Step 2: Get Program ID

```bash
solana address -k target/deploy/fossr-keypair.json
```

Copy the output and update:
- `Anchor.toml` (all clusters)
- `lib.rs` (line 5: `declare_id!("YOUR_PROGRAM_ID")`)

Rebuild after updating:
```bash
anchor build
```

### Step 3: Deploy to Devnet

```bash
# Set cluster to devnet
solana config set --url https://api.devnet.solana.com

# Create/check keypair (or use existing wallet)
solana-keygen new --outfile ~/.config/solana/id.json

# Get devnet SOL for gas
solana airdrop 2

# Deploy
anchor deploy
```

### Step 4: Initialize Program

After deploying, you need to initialize the program state:

```bash
# Run initialization (update this with actual script)
anchor run initialize
```

### Step 5: Deploy to Mainnet (Production)

⚠️ **CRITICAL**: Test thoroughly on devnet first!

```bash
# Switch to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Ensure you have enough SOL for deployment (~5-10 SOL)
solana balance

# Deploy
anchor deploy --provider.cluster mainnet
```

## 🧪 Testing

```bash
anchor test
```

## 🔗 Connect Frontend

After deployment:

1. Copy program ID from `target/deploy/fossr-keypair.json`
2. Update frontend `.env.local`:
   ```bash
   NEXT_PUBLIC_FOSSR_PROGRAM_ID=<your_program_id>
   NEXT_PUBLIC_FOSSR_TOKEN_MINT=<your_token_mint>
   ```

3. Update `lib/solana.ts` to use real program instructions instead of mocks

## 📊 Program Architecture

### Accounts

- **ProgramState**: Global state (price, burns, raffle info)
- **PurchaseOrder**: Individual buy orders with lock info
- **Token Mint**: SPL token for $FOSSR

### Instructions

1. `initialize`: Set up program (one-time)
2. `buy_tokens`: Purchase with protective lock
3. `unlock_tokens`: Release after lock expires
4. `execute_raffle`: Distribute raffle winnings
5. `sell_tokens`: Sell back to bonding curve

### Fee Structure

- **0.069%** → Burned (deflationary)
- **0.621%** → Raffle pot (airdrops)
- **99.31%** → User receives

### Lock Tiers

| SOL Amount | Lock Range |
|------------|------------|
| < 0.1 SOL  | 5m - 5h    |
| < 0.5 SOL  | 4m - 4h    |
| < 1.0 SOL  | 3m - 3h    |
| ≤ 10.0 SOL | 1m - 1h    |

## 🔐 Security Considerations

1. **Audit**: Get professional audit before mainnet
2. **Access Control**: Only program authority can execute raffles
3. **Lock Validation**: Users can't unlock before time expires
4. **Fee Calculations**: Protected against overflow
5. **PDA Seeds**: Secure account derivation

## 📝 Next Steps

1. ✅ Build program (`anchor build`)
2. ✅ Deploy to devnet
3. ✅ Test all instructions
4. ✅ Create token mint
5. ✅ Initialize program state
6. ✅ Update frontend to use real program
7. ✅ Test frontend integration
8. ✅ Security audit
9. ✅ Deploy to mainnet
10. ✅ Launch! 🚀

## 📞 Support

Need help? Check:
- [Anchor Docs](https://www.anchor-lang.com/)
- [Solana Docs](https://docs.solana.com/)
- [Anchor Discord](https://discord.gg/anchor)

---

**Built with Anchor 🏴‍☠️**
