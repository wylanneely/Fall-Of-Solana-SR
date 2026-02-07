const { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction
} = require("@solana/web3.js");
const { 
  TOKEN_PROGRAM_ID, 
  createInitializeAccountInstruction,
  getMinimumBalanceForRentExemptAccount,
  ACCOUNT_SIZE
} = require("@solana/spl-token");
const fs = require("fs");

const PROGRAM_ID = new PublicKey("FDFDncX3cWET87Jz4AXUkkVekenchC4q5WoGrpCU7eSJ");
const TOKEN_MINT = new PublicKey("HGbsZ1ewZGUhT5CmxnzqcPyX7YbUNDwi9c43iHytrhdZ");
const RPC_URL = "https://api.devnet.solana.com";

async function main() {
  console.log("🏦 Creating Dev Vault...\n");
  
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const walletData = JSON.parse(fs.readFileSync(walletPath, "utf8"));
  const wallet = Keypair.fromSecretKey(Uint8Array.from(walletData));
  
  const connection = new Connection(RPC_URL, "confirmed");
  
  // Dev vault PDA
  const [devVault, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("dev-vault"), TOKEN_MINT.toBuffer()],
    PROGRAM_ID
  );
  console.log("Dev Vault PDA:", devVault.toString());
  console.log("Bump:", bump);
  
  // Check if exists
  const existing = await connection.getAccountInfo(devVault);
  if (existing) {
    console.log("✅ Dev vault already exists!");
    return;
  }
  
  // Create token account at PDA address using CPI from program
  // For now, we'll need to do this via the program itself
  console.log("⚠️  Dev vault needs to be created by the program during first buy.");
  console.log("The buy_tokens instruction should use init_if_needed for dev_vault.");
  console.log("\nAlternatively, create it manually with spl-token:");
  console.log(`spl-token create-account ${TOKEN_MINT.toString()} --owner ${devVault.toString()}`);
}

main().catch(console.error);
