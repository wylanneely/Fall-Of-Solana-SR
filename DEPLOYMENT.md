# 🚀 Frontend Deployment Guide

## Deploy to Vercel (Recommended)

### Quick Deploy

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd /Users/wylanneely/Desktop/FOSSR
   vercel
   ```

4. **Production Deploy**
   ```bash
   vercel --prod
   ```

### Set Environment Variables

In Vercel dashboard (or CLI):

```bash
# Devnet (for testing)
vercel env add NEXT_PUBLIC_SOLANA_RPC_URL
# Value: https://api.devnet.solana.com

vercel env add NEXT_PUBLIC_SOLANA_NETWORK  
# Value: devnet

vercel env add NEXT_PUBLIC_FOSSR_PROGRAM_ID
# Value: <your_deployed_program_id>

vercel env add NEXT_PUBLIC_FOSSR_TOKEN_MINT
# Value: <your_token_mint_address>

vercel env add NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED
# Value: H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG

# Mainnet (production)
# Update URLs to mainnet-beta and use mainnet program IDs
```

### Automatic Deployments

Connect your GitHub repo to Vercel:
1. Push code to GitHub
2. Import project in Vercel
3. Set env variables
4. Every push to `main` auto-deploys

---

## Alternative: Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## Alternative: Self-Hosted VPS

```bash
# Build production
npm run build

# Start server (port 3000)
npm run start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "fossr" -- start
pm2 save
```

---

## 🔗 Custom Domain

In Vercel:
1. Settings → Domains
2. Add your domain
3. Update DNS records (Vercel provides instructions)

---

## ⚠️ Before Going Live

- [ ] Deploy Anchor program to mainnet
- [ ] Create $FOSSR token mint
- [ ] Initialize program state
- [ ] Update all env variables to mainnet
- [ ] Test buy/sell/raffle flows
- [ ] Security audit smart contract
- [ ] Set up monitoring/alerts
- [ ] Add error tracking (Sentry)

**Your app is ready to launch! 🎉**
