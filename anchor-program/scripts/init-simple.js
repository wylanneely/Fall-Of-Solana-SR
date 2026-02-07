const anchor = require("@coral-xyz/anchor");
const { PublicKey, Keypair, SystemProgram, Connection } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const fs = require("fs");
const path = require("path");

const PROGRAM_ID = "FDFDncX3cWET87Jz4AXUkkVekenchC4q5WoGrpCU7eSJ";
const TOKEN_MINT = "HGbsZ1ewZGUhT5CmxnzqcPyX7YbUNDwi9c43iHytrhdZ";
const RPC_URL = "https://api.devnet.solana.com";

async function main() {
  console.log("🚀 FOSSR Program Initialization");
  console.log("================================");
  
  // Load wallet
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const walletData = JSON.parse(fs.readFileSync(walletPath, "utf8"));
  const wallet = Keypair.fromSecretKey(Uint8Array.from(walletData));
  console.log("Wallet:", wallet.publicKey.toString());
  
  // Connect
  const connection = new Connection(RPC_URL, "confirmed");
  const balance = await connection.getBalance(wallet.publicKey);
  console.log("Balance:", balance / 1e9, "SOL");
  
  // Derive PDAs
  const programId = new PublicKey(PROGRAM_ID);
  const tokenMint = new PublicKey(TOKEN_MINT);
  
  const [programState, stateBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("program-state")],
    programId
  );
  console.log("Program State PDA:", programState.toString());
  
  const [programVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault")],
    programId
  );
  console.log("Program Vault PDA:", programVault.toString());
  
  const [raffleVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("raffle-vault"), tokenMint.toBuffer()],
    programId
  );
  console.log("Raffle Vault PDA:", raffleVault.toString());
  
  const [devVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("dev-vault"), tokenMint.toBuffer()],
    programId
  );
  console.log("Dev Vault PDA:", devVault.toString());
  
  // Check if already initialized
  const stateAccount = await connection.getAccountInfo(programState);
  if (stateAccount) {
    console.log("\n✅ Program already initialized!");
    console.log("State account exists with", stateAccount.data.length, "bytes");
    return;
  }
  
  console.log("\n⚠️  Program not initialized yet.");
  console.log("The program needs to be initialized via a transaction.");
  console.log("\nTo initialize manually, you'll need to call the 'initialize' instruction");
  console.log("with the following accounts:");
  console.log("  - programState:", programState.toString());
  console.log("  - tokenMint:", tokenMint.toString());
  console.log("  - authority:", wallet.publicKey.toString());
  console.log("  - raffleVault:", raffleVault.toString());
  console.log("  - devVault:", devVault.toString());
  console.log("  - programVault:", programVault.toString());
  
  console.log("\n📋 Summary for .env.local:");
  console.log("NEXT_PUBLIC_FOSSR_PROGRAM_ID=" + PROGRAM_ID);
  console.log("NEXT_PUBLIC_FOSSR_TOKEN_MINT=" + TOKEN_MINT);
}

main().catch(console.error);
