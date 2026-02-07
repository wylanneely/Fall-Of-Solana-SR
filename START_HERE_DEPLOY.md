# 🚀 MASTER DEPLOYMENT GUIDE

## Quick Start: Deploy Everything in 30 Minutes

### **Option 1: Automated Scripts** ⚡

```bash
# 1. Deploy Anchor to Devnet
./deploy-devnet.sh

# 2. Deploy Frontend to Vercel
./deploy-vercel.sh
```

### **Option 2: Manual Step-by-Step** 📋

See detailed guides:
- **Anchor/Devnet**: `DEPLOY_TO_DEVNET.md`
- **Vercel**: `DEPLOY_TO_VERCEL_QUICK.md`

---

## 🎯 **RECOMMENDED: Do This Right Now**

### **Phase 1: Anchor to Devnet (15 mins)**

```bash
# Navigate to anchor program
cd anchor-program

# Install dependencies
yarn install

# Build
anchor build

# Check your wallet has devnet SOL
solana config set --url https://api.devnet.solana.com
solana balance
# If < 2 SOL: solana airdrop 2

# Deploy
anchor deploy --provider.cluster devnet
```

**You'll get a Program ID** - save it! 📝

---

### **Phase 2: Create Token & Initialize (10 mins)**

```bash
# Create SPL token
spl-token create-token --decimals 9
# Save the Token Mint address! 📝

# Run initialize script (after updating it with your IDs)
ts-node scripts/initialize.ts
```

---

### **Phase 3: Vercel Deploy (5 mins)**

```bash
# Back to root
cd ..

# Deploy to Vercel
vercel

# Follow prompts, then deploy to production
vercel --prod
```

**In Vercel Dashboard**, add env vars:
- `NEXT_PUBLIC_SOLANA_RPC_URL` = `https://api.devnet.solana.com`
- `NEXT_PUBLIC_SOLANA_NETWORK` = `devnet`
- `NEXT_PUBLIC_FOSSR_PROGRAM_ID` = `<your_program_id>`
- `NEXT_PUBLIC_FOSSR_TOKEN_MINT` = `<your_token_mint>`
- `NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED` = `J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix`

Then redeploy: `vercel --prod`

---

## ✅ **Success Checklist**

- [ ] Anchor program built (`anchor build`)
- [ ] Program deployed to devnet (got Program ID)
- [ ] Token mint created (got Token Mint address)
- [ ] Program initialized (ran initialize script)
- [ ] Frontend deployed to Vercel (got URL)
- [ ] Env vars set in Vercel
- [ ] Production redeployed with env vars
- [ ] Tested: wallet connects on devnet
- [ ] Tested: can buy tokens

---

## 🐛 **Common Issues**

### "Insufficient funds"
```bash
solana airdrop 2
# Wait 30 seconds, try again
```

### "Program ID mismatch"
Update `declare_id!()` in `lib.rs` to match your keypair, then `anchor build` again.

### "Vercel build fails"
Test locally first:
```bash
npm run build
npm run dev
```

### "Wallet won't connect"
- Set Phantom to **Devnet** (Settings → Network → Devnet)
- Add a banner warning users about testnet

---

## 🎉 **You're Live When:**

1. ✅ Can visit your Vercel URL
2. ✅ Wallet connects (on devnet)
3. ✅ Can buy tokens (using devnet SOL)
4. ✅ Tokens show in purchase orders
5. ✅ Can unlock after timer expires

**Share your Vercel URL with friends for beta testing! 🚀**

---

## 📚 **Detailed Guides**

- **Devnet Deploy**: `DEPLOY_TO_DEVNET.md` (full walkthrough)
- **Vercel Deploy**: `DEPLOY_TO_VERCEL_QUICK.md` (full walkthrough)
- **Testing Guide**: `BETA_TESTING_GUIDE.md` (for testers)

---

## 🔥 **Pro Tip: Test First, Then Mainnet**

1. Deploy to devnet ← **You are here**
2. Test for 24-48 hours
3. Fix any bugs
4. Get final lawyer approval
5. Deploy to mainnet (same steps, change `--provider.cluster mainnet`)
6. Update Vercel env vars to mainnet
7. **LAUNCH! 🚀**

---

**Ready? Let's deploy! 🎯**

Choose your path:
- Fast: `./deploy-devnet.sh && ./deploy-vercel.sh`
- Detailed: Follow `DEPLOY_TO_DEVNET.md` + `DEPLOY_TO_VERCEL_QUICK.md`
