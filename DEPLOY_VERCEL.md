# 🚀 Quick Deploy to Vercel

## Step 1: Deploy (2 min)

```bash
cd /Users/wylanneely/Desktop/FOSSR
vercel --prod
```

**When prompted:**
- Link to existing project? **No**
- Project name? **fossr-beta** (or whatever you want)
- Deploy? **Yes**

You'll get a URL like: `https://fossr-beta.vercel.app`

---

## Step 2: Set Environment Variables in Vercel (2 min)

1. Go to https://vercel.com/dashboard
2. Click your project
3. Settings → Environment Variables
4. Add these:

```
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_FOSSR_PROGRAM_ID=11111111111111111111111111111111
NEXT_PUBLIC_FOSSR_TOKEN_MINT=11111111111111111111111111111111
NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED=H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG
```

*(Using dummy IDs since contract isn't deployed yet)*

5. Redeploy: `vercel --prod` again

---

## Step 3: Share with Friends

Send them:
1. **URL**: Your Vercel link
2. **Testing guide**: Share `BETA_TESTING_GUIDE.md`
3. **Bug report template** (in the guide)

---

## 📊 What Gets Tested

### ✅ **Frontend/UI** (What friends will find):
- Visual bugs
- Layout issues
- Mobile problems
- Button bugs
- Typos
- UX issues

### ❌ **Smart Contract** (What friends WON'T find):
- Lock mechanism
- Raffle logic
- Transaction errors
- Security issues

**For smart contract testing:** You need to deploy to devnet and test manually (the 6-10 hours)

---

## 📝 Collect Feedback

Create a simple Google Form:
- Name (optional)
- Device/Browser
- Bug description
- Screenshot (optional)

Or just have them DM you.

---

## 🎯 After Beta Testing

1. Fix UI bugs they find (1-2 hours)
2. Deploy fixes: `vercel --prod`
3. Deploy smart contract to devnet
4. Test smart contract yourself (6-10 hours)
5. Update frontend to use real contract
6. Deploy to mainnet
7. Launch! 🚀

---

**Deploy now, get feedback, iterate!** Good strategy. 👍
