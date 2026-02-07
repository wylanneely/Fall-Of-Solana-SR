# ⚡ QUICK DEPLOY COMMANDS - Copy & Paste

## 🚀 Deploy Anchor to Devnet (15 mins)

```bash
# Set devnet
solana config set --url https://api.devnet.solana.com

# Get devnet SOL
solana airdrop 2
solana airdrop 2

# Build & deploy
cd anchor-program
anchor build
anchor deploy --provider.cluster devnet

# ✅ SAVE YOUR PROGRAM ID!
```

---

## 🎨 Initialize Program (5 mins)

```bash
# Install deps (if needed)
yarn install

# Run init script
ts-node scripts/initialize.ts

# ✅ SAVE TOKEN MINT & PROGRAM ID!
# Copy the output to your .env.local
```

---

## 🌐 Deploy to Vercel (15 mins)

```bash
# Back to root
cd ..

# Install Vercel CLI (if needed)
npm install -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod
```

**Then add env vars in Vercel Dashboard:**
- Settings → Environment Variables
- Add all 5 variables (see DEPLOY_CHECKLIST_30MIN.md)
- Redeploy: `vercel --prod`

---

## ✅ Test (5 mins)

1. Visit your Vercel URL
2. Connect Phantom (set to DEVNET!)
3. Try buying 0.01 SOL worth
4. Check purchase appears in table

---

## 🐛 Quick Fixes

**Insufficient funds:**
```bash
solana airdrop 2
```

**Program ID mismatch:**
Update `declare_id!()` in lib.rs, then:
```bash
anchor build
anchor deploy --provider.cluster devnet
```

**Wallet won't connect:**
- Set Phantom to Devnet
- Check Vercel env vars
- Redeploy: `vercel --prod`

---

## 📋 Full Guides

- **30-min checklist**: `DEPLOY_CHECKLIST_30MIN.md` ⭐
- **Master guide**: `README_DEPLOY.md`
- **Detailed Anchor**: `DEPLOY_TO_DEVNET.md`
- **Detailed Vercel**: `DEPLOY_TO_VERCEL_QUICK.md`

---

**You got this! 🚀 Start with the first command block above!**
