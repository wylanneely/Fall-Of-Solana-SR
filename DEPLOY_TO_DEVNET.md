# 🚀 DEPLOY TO DEVNET - Quick Guide

## ⚡ **Step 1: Setup Solana CLI (if not done)**

```bash
# Check if Solana CLI is installed
solana --version

# If not installed, install it:
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Set to devnet
solana config set --url https://api.devnet.solana.com

# Create/check your wallet
solana address

# Airdrop devnet SOL (you'll need ~5-10 SOL for deployment)
solana airdrop 2
solana airdrop 2
solana airdrop 2
```

---

## ⚡ **Step 2: Install Anchor CLI**

```bash
# Check if Anchor is installed
anchor --version

# If not installed (requires Rust):
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

---

## ⚡ **Step 3: Build & Deploy Anchor Program**

```bash
cd anchor-program

# Build the program
anchor build

# Get your program ID from the keypair
solana address -k target/deploy/fossr-keypair.json

# Update Anchor.toml and lib.rs with this program ID (if different)
# Then rebuild
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Your program is now live on devnet! 🎉
```

**Expected output:**
```
Program Id: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
Deploy success
```

---

## ⚡ **Step 4: Create Token Mint**

```bash
# Create a new SPL token mint for $FOSSR
spl-token create-token --decimals 9

# Save the token mint address (looks like: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU)
```

---

## ⚡ **Step 5: Initialize the Program**

Create `anchor-program/scripts/deploy-init.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

async function main() {
  // Set up devnet connection
  const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  // Load program
  const programId = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
  const idl = JSON.parse(require("fs").readFileSync("target/idl/fossr.json", "utf8"));
  const program = new Program(idl, programId, provider);

  console.log("🚀 Initializing FOSSR program on devnet...");
  console.log("Authority:", wallet.publicKey.toString());

  // Create token mint (replace with your actual mint if already created)
  console.log("Creating token mint...");
  const tokenMint = await createMint(
    connection,
    wallet.payer,
    wallet.publicKey, // mint authority = program state PDA (need to transfer after init)
    null,
    9 // decimals
  );
  console.log("Token Mint:", tokenMint.toString());

  // Find PDAs
  const [programState] = PublicKey.findProgramAddressSync(
    [Buffer.from("program-state")],
    programId
  );
  
  const [programVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("program-vault")],
    programId
  );
  
  const [raffleVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("raffle-vault"), tokenMint.toBuffer()],
    programId
  );
  
  const [devVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("dev-vault"), tokenMint.toBuffer()],
    programId
  );

  console.log("\n📍 PDAs:");
  console.log("Program State:", programState.toString());
  console.log("Program Vault:", programVault.toString());
  console.log("Raffle Vault:", raffleVault.toString());
  console.log("Dev Vault:", devVault.toString());

  // Initialize program
  console.log("\n🔧 Calling initialize...");
  const initialPrice = new anchor.BN(10_000); // 0.00001 SOL per token

  try {
    const tx = await program.methods
      .initialize(initialPrice)
      .accounts({
        programState,
        tokenMint,
        authority: wallet.publicKey,
        raffleVault,
        devVault,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("✅ Initialize transaction:", tx);
    console.log("✅ Program initialized successfully!");

    console.log("\n📝 SAVE THESE FOR .env.local:");
    console.log(`NEXT_PUBLIC_FOSSR_PROGRAM_ID=${programId.toString()}`);
    console.log(`NEXT_PUBLIC_FOSSR_TOKEN_MINT=${tokenMint.toString()}`);
    console.log(`NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com`);
    console.log(`NEXT_PUBLIC_SOLANA_NETWORK=devnet`);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

main();
```

Run it:
```bash
cd anchor-program
yarn install  # if not done
ts-node scripts/deploy-init.ts
```

---

## ⚡ **Step 6: Update Frontend .env.local**

Update your `.env.local` with the output from Step 5:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_FOSSR_PROGRAM_ID=<your_program_id>
NEXT_PUBLIC_FOSSR_TOKEN_MINT=<your_token_mint>
NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED=J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix
```

*(Devnet Pyth SOL/USD feed: J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix)*

---

## ⚡ **Step 7: Test Locally**

```bash
# Back to root
cd ..

# Install frontend deps (if not done)
npm install

# Run dev server
npm run dev
```

Visit `http://localhost:3000/dashboard` and connect with Phantom (set to Devnet)

---

## ✅ **Devnet Deployment Complete!**

Your smart contract is now live on Solana Devnet! 🎉

**Next:** Deploy frontend to Vercel (see DEPLOY_TO_VERCEL.md)

---

## 🐛 **Troubleshooting**

### "Insufficient funds"
```bash
solana airdrop 2
solana balance
```

### "Program already deployed"
```bash
# Upgrade instead
anchor upgrade target/deploy/fossr.so --program-id <your_program_id> --provider.cluster devnet
```

### "Mint authority error"
After initialization, you need to set the program state PDA as the mint authority:
```bash
spl-token authorize <TOKEN_MINT> mint <PROGRAM_STATE_PDA>
```

---

**Ready to test! 🚀**
