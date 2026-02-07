# 🚀 DEPLOY TO VERCEL - Quick Guide

## ⚡ **Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

---

## ⚡ **Step 2: Login to Vercel**

```bash
vercel login
```

Follow the browser login flow.

---

## ⚡ **Step 3: Deploy from Root Directory**

```bash
# From /Users/wylanneely/Desktop/FOSSR
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name: fossr-dashboard (or your choice)
# - Directory: ./ (root)
# - Override settings? No
```

**First deploy = preview URL** (e.g., `fossr-dashboard-abc123.vercel.app`)

---

## ⚡ **Step 4: Set Environment Variables**

### **Option A: Via CLI**

```bash
# Add env vars for production
vercel env add NEXT_PUBLIC_SOLANA_RPC_URL production
# Paste: https://api.devnet.solana.com

vercel env add NEXT_PUBLIC_SOLANA_NETWORK production
# Paste: devnet

vercel env add NEXT_PUBLIC_FOSSR_PROGRAM_ID production
# Paste: <your_program_id_from_devnet_deploy>

vercel env add NEXT_PUBLIC_FOSSR_TOKEN_MINT production
# Paste: <your_token_mint_from_devnet_deploy>

vercel env add NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED production
# Paste: J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix
```

### **Option B: Via Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Click your project (`fossr-dashboard`)
3. Settings → Environment Variables
4. Add each variable:
   - `NEXT_PUBLIC_SOLANA_RPC_URL` = `https://api.devnet.solana.com`
   - `NEXT_PUBLIC_SOLANA_NETWORK` = `devnet`
   - `NEXT_PUBLIC_FOSSR_PROGRAM_ID` = `<your_program_id>`
   - `NEXT_PUBLIC_FOSSR_TOKEN_MINT` = `<your_token_mint>`
   - `NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED` = `J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix`

---

## ⚡ **Step 5: Deploy to Production**

```bash
vercel --prod
```

Your site is now live at: `https://fossr-dashboard.vercel.app` 🎉

---

## ⚡ **Step 6: Custom Domain (Optional)**

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain (e.g., `fossr.app`)
3. Update DNS records as instructed
4. SSL auto-configured ✅

---

## 🔄 **Future Updates**

Every time you push to GitHub (if connected) or run `vercel --prod`, your site auto-deploys!

**Or manually:**
```bash
# Make code changes
# Then:
vercel --prod
```

---

## 📊 **Verify Deployment**

1. Visit your Vercel URL
2. Open DevTools → Console
3. Check for errors
4. Connect Phantom wallet (set to **Devnet**)
5. Test buy/sell/share functions

---

## ⚠️ **IMPORTANT: Devnet vs Mainnet**

Your current deployment uses **DEVNET**:
- ✅ Safe for testing
- ✅ Free devnet SOL
- ✅ No real money

**Before mainnet launch:**
1. Deploy Anchor program to mainnet
2. Update Vercel env vars:
   - `NEXT_PUBLIC_SOLANA_RPC_URL` → `https://api.mainnet-beta.solana.com`
   - `NEXT_PUBLIC_SOLANA_NETWORK` → `mainnet-beta`
   - `NEXT_PUBLIC_FOSSR_PROGRAM_ID` → `<mainnet_program_id>`
   - `NEXT_PUBLIC_FOSSR_TOKEN_MINT` → `<mainnet_token_mint>`
   - `NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED` → `H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG`
3. Redeploy: `vercel --prod`

---

## 🐛 **Troubleshooting**

### Build fails on Vercel
Check build logs. Common issues:
- Missing deps: `npm install` locally first
- TypeScript errors: `npm run build` to test locally

### Wallet not connecting
- Users must set Phantom to **Devnet** (Settings → Network → Devnet)
- Add a banner on your site: "⚠️ TESTNET: Set wallet to Devnet"

### Env vars not working
- Did you add them in Vercel dashboard?
- Did you redeploy after adding? (`vercel --prod`)
- Check: Settings → Environment Variables → Production

---

## ✅ **Deployment Checklist**

- [ ] Vercel CLI installed
- [ ] Logged in to Vercel
- [ ] Project deployed (`vercel`)
- [ ] Env vars added (all 5)
- [ ] Production deployed (`vercel --prod`)
- [ ] Site tested (wallet connects, UI loads)
- [ ] Warning banner added (Devnet testnet)

---

## 🎉 **You're Live!**

Share your Vercel URL with friends for testing:
```
https://your-project.vercel.app/dashboard
```

**Remember:** Tell testers to:
1. Install Phantom wallet
2. Switch to **Devnet**
3. Get devnet SOL (Phantom has built-in airdrop)
4. Test away! 🚀

---

**Next:** After testing, deploy to mainnet and switch env vars to mainnet! 🌙
