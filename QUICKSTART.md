# 🎯 ULTRA-FAST LAUNCH (Single Command)

## Prerequisites
```bash
# Install ONLY if you don't have these:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest && avm use latest
```

---

## 🚀 ONE-LINE DEVNET DEPLOY

```bash
cd /Users/wylanneely/Desktop/FOSSR/anchor-program && anchor build && solana config set --url https://api.devnet.solana.com && solana airdrop 2 && anchor deploy && anchor run initialize
```

This will:
1. Build your program
2. Switch to devnet  
3. Get test SOL
4. Deploy program
5. Initialize it
6. Give you the program ID and token mint

---

## 🌐 UPDATE FRONTEND (2 minutes)

1. Copy the output values
2. Edit `/Users/wylanneely/Desktop/FOSSR/.env.local`:
   ```bash
   NEXT_PUBLIC_FOSSR_PROGRAM_ID=<paste_program_id>
   NEXT_PUBLIC_FOSSR_TOKEN_MINT=<paste_token_mint>
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   ```

---

## ☁️ DEPLOY FRONTEND (1 minute)

```bash
cd /Users/wylanneely/Desktop/FOSSR && vercel --prod
```

Done! Your app is live.

---

## 🎊 FOR MAINNET

Same command, just change `devnet` to `mainnet-beta`:

```bash
solana config set --url https://api.mainnet-beta.solana.com && anchor deploy --provider.cluster mainnet
```

(Costs ~3-5 SOL in deployment fees)

---

## ⚠️ ADD THIS WARNING TO YOUR UI

```tsx
// In app/dashboard/page.tsx, add after header:
<div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
  <p className="text-yellow-200 text-sm">
    ⚠️ <strong>EXPERIMENTAL</strong>: Not audited. Max 2 SOL/buy, 100 SOL total cap. Use at your own risk.
  </p>
</div>
```

---

**That's it! You can go from zero to live in under 1 hour.** 🚀

Reply when you're ready to start and I'll help troubleshoot any errors.
