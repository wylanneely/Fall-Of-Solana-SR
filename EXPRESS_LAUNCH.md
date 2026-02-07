# 🚀 EXPRESS LAUNCH GUIDE (48 Hours)

## ✅ Safety Caps Added
- Max buy: 2 SOL per transaction
- Max TVL: 100 SOL (~$10k)
- You can remove these later after audit

---

## 📅 HOUR-BY-HOUR PLAN

### **TODAY - Day 1: Smart Contract**

#### **Hours 1-2: Install Tools**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Solana
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest

# Verify
rustc --version
solana --version
anchor --version
```

#### **Hours 3-4: Build & Deploy to Devnet**
```bash
cd /Users/wylanneely/Desktop/FOSSR/anchor-program

# Build
anchor build

# Get your program ID
solana address -k target/deploy/fossr-keypair.json
# Copy this output!

# Update lib.rs line 4 with YOUR program ID:
# declare_id!("YOUR_PROGRAM_ID_HERE");

# Rebuild
anchor build

# Switch to devnet
solana config set --url https://api.devnet.solana.com

# Create wallet (or use existing)
solana-keygen new --outfile ~/.config/solana/id.json

# Get devnet SOL
solana airdrop 2

# Deploy!
anchor deploy
```

#### **Hours 5-6: Create Token & Initialize**
```bash
# Create SPL token
spl-token create-token --decimals 9
# Save this TOKEN_MINT address!

# Create token account for program
spl-token create-account <TOKEN_MINT>

# Initialize program (you'll need to write a quick script)
# Or use anchor test to call initialize
```

---

### **TONIGHT - Day 1 Evening: Update Frontend**

#### **Hour 7: Update .env.local**
```bash
cd /Users/wylanneely/Desktop/FOSSR

# Edit .env.local
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_FOSSR_PROGRAM_ID=<your_program_id_from_step_3>
NEXT_PUBLIC_FOSSR_TOKEN_MINT=<your_token_mint_from_step_5>
NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED=H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG
```

#### **Hour 8: Quick Test**
```bash
npm run dev
# Open http://localhost:3000
# Connect wallet
# Try to buy (it still uses mocks, but verifies UI works)
```

---

### **DAY 2: Connect Real Program & Launch**

#### **Hours 1-4: Update lib/solana.ts**

I'll create a quick integration file for you:

```typescript
// Replace localStorage mocks with actual Anchor calls
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Fossr } from '../anchor-program/target/types/fossr';
import idl from '../anchor-program/target/idl/fossr.json';

// Initialize Anchor program
const programId = new PublicKey(process.env.NEXT_PUBLIC_FOSSR_PROGRAM_ID!);
const program = new Program(idl as Fossr, programId, provider);

// Call buy_tokens instruction
await program.methods
  .buyTokens(new BN(solAmount))
  .accounts({ /* your accounts */ })
  .rpc();
```

#### **Hours 5-6: Test on Devnet**
- Buy with different amounts
- Wait for unlock
- Test unlock
- Verify raffle timer

#### **Hours 7-8: Deploy to Mainnet**
```bash
# Switch to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Ensure you have ~5 SOL for deployment
solana balance
# If not: buy SOL on exchange, send to your wallet

# Deploy
cd anchor-program
anchor deploy --provider.cluster mainnet

# Update .env.local with mainnet addresses
```

#### **Hour 9: Deploy Frontend**
```bash
cd /Users/wylanneely/Desktop/FOSSR

# Deploy to Vercel
npm i -g vercel
vercel login
vercel --prod

# Set env vars in Vercel dashboard
# (or use vercel env add commands)
```

#### **Hour 10: Launch! 🚀**
- Tweet launch
- Monitor for 24 hours
- Be ready to pause if issues

---

## 🎯 SIMPLIFIED: Just 3 Commands

If you want to go FAST (devnet only for testing):

```bash
# 1. Build & deploy program
cd anchor-program && anchor build && anchor deploy

# 2. Update .env.local with program ID

# 3. Deploy frontend
cd .. && vercel --prod
```

---

## ⚠️ IMPORTANT DISCLAIMERS

Add these to your UI:

```tsx
// In dashboard header
<div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 mb-4">
  ⚠️ EXPERIMENTAL: Max 2 SOL per buy, 100 SOL total. Use at your own risk.
</div>
```

Add to your website:
- "Not audited - use at your own risk"
- "Maximum $10k TVL"
- Link to source code (GitHub)

---

## 🐛 If Something Breaks

**Program won't deploy?**
- Check you have enough SOL
- Verify program ID matches in Anchor.toml and lib.rs

**Frontend can't connect?**
- Verify .env.local has correct program ID
- Check wallet is on correct network (devnet vs mainnet)
- Look for errors in browser console

**Need help?**
- Anchor Discord: https://discord.gg/anchor
- DM me the error

---

## 📊 Post-Launch Checklist

- [ ] Monitor transactions in first hour
- [ ] Test buy from 3 different wallets
- [ ] Verify lock timers work
- [ ] Check first raffle execution
- [ ] Be online for 24 hours to handle issues

---

**Ready? Let's go! Start with Hour 1 above. 🚀**

Reply "starting" when you begin and I'll guide you through any issues.
