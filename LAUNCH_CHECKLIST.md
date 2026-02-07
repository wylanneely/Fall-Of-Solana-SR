# ✅ PRE-LAUNCH CHECKLIST

## Before You Deploy (10 min)

- [ ] **Installed Rust, Solana CLI, Anchor** (check: `anchor --version`)
- [ ] **Have wallet with 5-10 SOL** (for mainnet deployment fees)
- [ ] **Decided: Devnet or Mainnet?**
  - Devnet = Free testing, no risk
  - Mainnet = Real money, costs ~5 SOL to deploy

---

## Deploy Smart Contract (30 min)

- [ ] `cd anchor-program`
- [ ] `anchor build` (compiles program)
- [ ] Copy program ID from terminal
- [ ] Update `lib.rs` line 4 with program ID
- [ ] `anchor build` again
- [ ] `solana config set --url <devnet OR mainnet>`
- [ ] `solana airdrop 2` (devnet only)
- [ ] `anchor deploy`
- [ ] `anchor run initialize` (creates token & initializes)
- [ ] Save program ID and token mint

---

## Update Frontend (5 min)

- [ ] Edit `.env.local`:
  ```
  NEXT_PUBLIC_FOSSR_PROGRAM_ID=<your_program_id>
  NEXT_PUBLIC_FOSSR_TOKEN_MINT=<your_token_mint>
  NEXT_PUBLIC_SOLANA_NETWORK=devnet OR mainnet
  NEXT_PUBLIC_SOLANA_RPC_URL=<devnet OR mainnet url>
  ```
- [ ] Test locally: `npm run dev`
- [ ] Warning banner is visible
- [ ] Logo displays correctly

---

## Deploy Frontend (5 min)

- [ ] `npm install -g vercel`
- [ ] `vercel login`
- [ ] `vercel --prod`
- [ ] Set environment variables in Vercel dashboard
- [ ] Test live URL

---

## Post-Launch (First Hour)

- [ ] Test buy with 0.1 SOL
- [ ] Verify lock timer shows
- [ ] Check transaction on Solscan
- [ ] Test with 2nd wallet
- [ ] Monitor for errors
- [ ] Stay online for 1 hour minimum

---

## Optional: Make It Better

- [ ] Push code to GitHub
- [ ] Set up custom domain
- [ ] Add analytics (Plausible, Google Analytics)
- [ ] Create Twitter account
- [ ] Write launch tweet

---

## Emergency: If Something Breaks

**Program won't deploy:**
```bash
# Check balance
solana balance

# Verify network
solana config get

# Check program size (must be <200kb)
ls -lh target/deploy/fossr.so
```

**Frontend can't connect:**
- Check browser console for errors
- Verify wallet is on correct network
- Confirm .env.local values are correct

**Transaction fails:**
- Check you're not exceeding 2 SOL limit
- Verify program isn't at 100 SOL cap
- Look at transaction error on Solscan

---

## 🎯 You're Ready When:

✅ Safety caps added (2 SOL, 100 SOL)  
✅ Warning banner visible  
✅ Program deployed to devnet/mainnet  
✅ Frontend deployed to Vercel  
✅ Tested 1+ transactions successfully  
✅ Monitoring for issues  

---

**Time estimate: 1-2 hours total**

Go launch! 🚀
