# ⚡ DEPLOY NOW - 30 Minute Checklist

Copy/paste these commands in order. No thinking, just execute! 🚀

---

## ☑️ **Pre-flight Check (2 mins)**

```bash
# Check you have required tools
solana --version   # Need Solana CLI
anchor --version   # Need Anchor CLI
node --version     # Need Node.js
vercel --version   # Need Vercel CLI (or: npm install -g vercel)

# If any missing, see DEPLOY_TO_DEVNET.md for install instructions
```

---

## ☑️ **Step 1: Deploy Anchor Program (10 mins)**

```bash
# Set devnet
anchor clean

# Check balance (need ~2 SOL)
solana balance
# If low: solana airdrop 2

# Build & deploy
cd anchor-program
anchor build
anchor deploy --provider.cluster devnet

# ✅ SAVE THIS OUTPUT:
# Program Id: <YOUR_PROGRAM_ID>
```

**Write down your Program ID:** 4ZvTWVQvrSzqwxJmwi6kTvAxGwGCKJrN6UpL8892KHDe___________________________________

---

## ☑️ **Step 2: Create Token Mint (2 mins)**

```bash
# Create SPL token
spl-token create-token --decimals 9

# ✅ SAVE THIS OUTPUT:
# Creating token <YOUR_TOKEN_MINT>
```

**Write down your Token Mint:** 6FtEyYfBZ8wiVLSiDRwzZu17RFM3YU6Mep2Zd3etqqPn___________________________________

---

## ☑️ **Step 3: Initialize Program (5 mins)**

**First, edit `anchor-program/scripts/initialize.ts`:**

Find line ~23 and replace with your actual token mint from Step 2:
```typescript
const tokenMint = new PublicKey("YOUR_TOKEN_MINT_HERE");
```

**Then run:**
```bash
# Install deps (if not done)
yarn install

# Run initialize
ts-node scripts/initialize.ts

# ✅ Should output: "Program initialized successfully!"
```

---

## ☑️ **Step 4: Update Frontend Config (2 mins)**

**Edit `.env.local` in your project root:**

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_FOSSR_PROGRAM_ID=<YOUR_PROGRAM_ID_FROM_STEP_1>
NEXT_PUBLIC_FOSSR_TOKEN_MINT=<YOUR_TOKEN_MINT_FROM_STEP_2>
NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED=J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix
```

---

## ☑️ **Step 5: Test Locally (3 mins)**

```bash
# Back to root
cd ..

# Install deps (if not done)
npm install

# Build to check for errors
npm run build

# Run dev server
npm run dev

# ✅ Visit: http://localhost:3000/dashboard
# ✅ Connect Phantom (set to DEVNET!)
```

**Checklist:**
- [ ] Site loads
- [ ] Wallet connects
- [ ] No console errors
- [ ] Can see your balance

---

## ☑️ **Step 6: Deploy to Vercel (6 mins)**

```bash
# Login to Vercel (if not done)
vercel login

# Deploy preview
vercel

# Follow prompts:
# - Set up and deploy? YES
# - Link to existing project? NO
# - Project name: fossr-dashboard
# - Directory: ./
# - Override settings? NO

# ✅ SAVE THIS OUTPUT:
# Preview: https://fossr-dashboard-xyz.vercel.app
```

**Write down your Vercel URL:** ___________________________________

---

## ☑️ **Step 7: Add Env Vars to Vercel (3 mins)**

**Go to:** https://vercel.com/dashboard

1. Click your project (`fossr-dashboard`)
2. Settings → Environment Variables
3. Add these **5 variables** (for **Production**):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | `https://api.devnet.solana.com` |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` |
| `NEXT_PUBLIC_FOSSR_PROGRAM_ID` | `<YOUR_PROGRAM_ID>` |
| `NEXT_PUBLIC_FOSSR_TOKEN_MINT` | `<YOUR_TOKEN_MINT>` |
| `NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED` | `J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix` |

4. Click "Save"

---

## ☑️ **Step 8: Deploy to Production (2 mins)**

```bash
# Redeploy with env vars
vercel --prod

# ✅ Your site is now live!
# Production: https://fossr-dashboard.vercel.app
```

---

## ☑️ **Step 9: Test Live Site (5 mins)**

**Visit your production URL**

**Test checklist:**
- [ ] Site loads (no errors in console)
- [ ] See orange "TESTNET MODE" banner
- [ ] Connect Phantom wallet (set to **Devnet**)
- [ ] Wallet shows your devnet SOL balance
- [ ] Try buying 0.01 SOL worth of tokens
- [ ] Purchase shows in "Your Purchase Orders"
- [ ] Token appears with lock timer

---

## ✅ **SUCCESS!**

Your dApp is live on Devnet! 🎉

**Share with testers:**
```
🧪 FOSSR Testnet: https://your-url.vercel.app/dashboard

To test:
1. Install Phantom wallet
2. Switch to Devnet (Settings → Network → Devnet)
3. Get free SOL (Phantom has airdrop button)
4. Buy some $FOSSR!
```

---

## 🐛 **Troubleshooting**

### "Insufficient funds"
```bash
solana airdrop 2
# Wait 30s, try again
```

### "Program ID mismatch"
In `anchor-program/programs/fossr/src/lib.rs`, line 6:
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```
Then: `anchor build && anchor deploy --provider.cluster devnet`

### "Wallet won't connect on Vercel"
- Check Vercel env vars are saved
- Redeploy: `vercel --prod`
- Clear browser cache
- Set Phantom to Devnet

### "Transaction fails"
- Check program is initialized (run initialize script again)
- Check you have devnet SOL
- Check wallet is on Devnet network

---

## 📋 **Final Checklist**

- [ ] Anchor program deployed ✅
- [ ] Token mint created ✅
- [ ] Program initialized ✅
- [ ] Frontend deployed to Vercel ✅
- [ ] Env vars added ✅
- [ ] Production deployed ✅
- [ ] Tested: Can buy tokens ✅
- [ ] Shared with friends for testing ✅

---

## 🚀 **Next Steps**

1. **Test for 24-48 hours** (use BETA_TESTING_GUIDE.md)
2. **Fix any bugs**
3. **Get lawyer final approval**
4. **Deploy to mainnet** (same steps, change `devnet` → `mainnet`)
5. **LAUNCH! 🌙**

---

**Time to deploy! Copy/paste each command block and go! ⚡**
