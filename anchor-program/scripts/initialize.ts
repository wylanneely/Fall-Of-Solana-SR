import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Connection, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

// EXISTING TOKEN MINT - already created
const EXISTING_TOKEN_MINT = "5F5yX96VoaGmqmZvrA5FqgsyraZGchMSfni1ddCcJaR3";

async function main() {
  // Configure the client
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const walletPath = process.env.ANCHOR_WALLET || '~/.config/solana/id.json';
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(walletPath.replace('~', process.env.HOME), 'utf8')));
const keypair = Keypair.fromSecretKey(secretKey);
const walletKeypair = new anchor.Wallet(keypair);
const provider = new anchor.AnchorProvider(connection, walletKeypair);
  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet;

  // Load IDL from target (requires `anchor build` to have run)
  const idlPath = path.resolve(__dirname, "..", "target", "idl", "fossr.json");
  if (!fs.existsSync(idlPath)) {
    console.error("❌ Missing IDL at:", idlPath);
    console.error("Run: anchor build  (inside /anchor-program) and try again.");
    process.exit(1);
  }

  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

  // Derive program ID from the compiled keypair if present
  const programKeypairPath = path.resolve(__dirname, "..", "target", "deploy", "fossr-keypair.json");
  let programId: PublicKey;
  if (fs.existsSync(programKeypairPath)) {
    const keypairData = JSON.parse(fs.readFileSync(programKeypairPath, "utf8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
    programId = keypair.publicKey;
  } else {
    // Fallback to Anchor workspace program ID if keypair not found
    programId = new PublicKey((anchor.workspace as any)?.Fossr?.programId?.toString() || "");
  }

  // Anchor 0.32+ Program constructor no longer takes programId; it uses idl.address.
  // Ensure the IDL address matches the deployed program id.
  // Note: For Anchor 0.30+, IDL has 'address' field
if (idl.address) {
  idl.address = programId.toString();
}
  const program = new Program(idl, provider);

  console.log("🚀 Starting FOSSR initialization...");
  console.log("Program ID:", program.programId.toString());
  console.log("Wallet:", wallet.publicKey.toString());

  // Use existing token mint
  const tokenMint = new PublicKey(EXISTING_TOKEN_MINT);
  console.log("\n📝 Using existing token mint:", tokenMint.toString());

  // 2. Find program PDAs
  const [programState] = PublicKey.findProgramAddressSync(
    [Buffer.from("program-state")],
    program.programId
  );
  console.log("📍 Program state PDA:", programState.toString());

  const [programVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault")],
    program.programId
  );
  console.log("📍 Program vault PDA:", programVault.toString());

  const [raffleVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("raffle-vault"), tokenMint.toBuffer()],
    program.programId
  );
  console.log("📍 Raffle vault PDA:", raffleVault.toString());

  const [devVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("dev-vault"), tokenMint.toBuffer()],
    program.programId
  );
  console.log("📍 Dev vault PDA:", devVault.toString());

  // 3. Initialize program
  console.log("\n⚙️  Initializing program...");
  const bondingCurvePrice = new anchor.BN(10000); // 0.00001 SOL per token (in lamports)

  try {
    // airdrop_amount is stored in base units (9 decimals)
    const airdropAmount = new anchor.BN(100_000_000_000); // 100 tokens per airdrop winner
    const tx = await program.methods
      .initialize(bondingCurvePrice, airdropAmount)
      .accounts({
        programState: programState,
        tokenMint: tokenMint,
        programVault: programVault,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Program initialized!");
    console.log("Transaction:", tx);
  } catch (err) {
    console.error("❌ Error initializing:", err);
    throw err;
  }

  // 4. Transfer mint authority to program
  console.log("\n🔐 Transferring mint authority to program PDA...");
  // This would require calling setAuthority from SPL token
  console.log("⚠️  Manual step: Run this command:");
  console.log(`spl-token authorize ${tokenMint.toString()} mint ${programState.toString()}`);

  // 5. Display summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ FOSSR INITIALIZATION COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Save these values in your .env.local:\n");
  console.log(`NEXT_PUBLIC_FOSSR_PROGRAM_ID=${program.programId.toString()}`);
  console.log(`NEXT_PUBLIC_FOSSR_TOKEN_MINT=${tokenMint.toString()}`);
  console.log(`NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com`);
  console.log(`NEXT_PUBLIC_SOLANA_NETWORK=devnet`);
  console.log(`NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED=J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix`);
  console.log("\n📍 Program State PDA:", programState.toString());
  console.log("📍 Program Vault PDA:", programVault.toString());
  console.log("📍 Raffle Vault PDA:", raffleVault.toString());
  console.log("📍 Dev Vault PDA:", devVault.toString());
  console.log("\n⚠️  Don't forget to run the spl-token authorize command above!");
  console.log("=".repeat(60));
}

main()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Script failed:", err);
    process.exit(1);
  });
