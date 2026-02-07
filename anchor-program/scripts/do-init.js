const { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction
} = require("@solana/web3.js");
const fs = require("fs");
const BN = require("bn.js");

const PROGRAM_ID = new PublicKey("FDFDncX3cWET87Jz4AXUkkVekenchC4q5WoGrpCU7eSJ");
const TOKEN_MINT = new PublicKey("HGbsZ1ewZGUhT5CmxnzqcPyX7YbUNDwi9c43iHytrhdZ");
const RPC_URL = "https://api.devnet.solana.com";

async function main() {
  console.log("🚀 Initializing FOSSR Program (Simplified)...\n");
  
  // Load wallet
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const walletData = JSON.parse(fs.readFileSync(walletPath, "utf8"));
  const wallet = Keypair.fromSecretKey(Uint8Array.from(walletData));
  console.log("Wallet:", wallet.publicKey.toString());
  
  const connection = new Connection(RPC_URL, "confirmed");
  
  // Derive PDAs
  const [programState] = PublicKey.findProgramAddressSync(
    [Buffer.from("program-state")],
    PROGRAM_ID
  );
  console.log("Program State PDA:", programState.toString());
  
  // Check if already initialized
  const stateAccount = await connection.getAccountInfo(programState);
  if (stateAccount) {
    console.log("\n✅ Program already initialized!");
    console.log("State account size:", stateAccount.data.length, "bytes");
    return;
  }
  
  // Build initialize instruction
  // Discriminator for "initialize" = first 8 bytes of sha256("global:initialize")
  const discriminator = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
  
  // Args: initial_price: u64, airdrop_amount: u64
  const initialPrice = new BN(10000); // 0.00001 SOL per token
  const airdropAmount = new BN(1000000000000); // 1000 tokens per airdrop
  const priceBuffer = initialPrice.toArrayLike(Buffer, "le", 8);
  const airdropBuffer = airdropAmount.toArrayLike(Buffer, "le", 8);
  
  const data = Buffer.concat([discriminator, priceBuffer, airdropBuffer]);
  
  // Accounts for simplified Initialize (must match order in lib.rs)
  const keys = [
    { pubkey: programState, isSigner: false, isWritable: true },
    { pubkey: TOKEN_MINT, isSigner: false, isWritable: false },
    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];
  
  const instruction = new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
  
  console.log("\n📤 Sending initialize transaction...");
  
  try {
    const tx = new Transaction().add(instruction);
    const sig = await sendAndConfirmTransaction(connection, tx, [wallet], {
      commitment: "confirmed",
    });
    console.log("✅ Transaction confirmed:", sig);
    console.log("\n🎉 FOSSR Program initialized successfully!");
    console.log("\n📋 Your .env.local values:");
    console.log("NEXT_PUBLIC_FOSSR_PROGRAM_ID=" + PROGRAM_ID.toString());
    console.log("NEXT_PUBLIC_FOSSR_TOKEN_MINT=" + TOKEN_MINT.toString());
  } catch (err) {
    console.error("❌ Error:", err.message);
    if (err.logs) {
      console.log("\nProgram logs:");
      err.logs.forEach(log => console.log("  ", log));
    }
    throw err;
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
