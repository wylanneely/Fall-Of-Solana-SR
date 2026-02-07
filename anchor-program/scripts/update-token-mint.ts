/**
 * Update Token Mint in Program State
 * 
 * Updates the program state to use the new token mint
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = "93KPeH4wk9VQGrcAhabXn4EcnaGbTo5JxkwMB2We8Meo";
const NEW_TOKEN_MINT = "JCmJCCCegW6QSX6kUVzkjuiCmtRQEf8Vo2Xm8j24jpoP";

async function main() {
  console.log("🔄 Updating Token Mint in Program State...\n");

  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  const programId = new PublicKey(PROGRAM_ID);
  const newTokenMint = new PublicKey(NEW_TOKEN_MINT);

  // Load IDL
  const idlPath = path.join(__dirname, "..", "target", "idl", "fossr.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  idl.address = programId.toString();
  
  const program = new Program(idl, provider);

  // Derive PDAs
  const [programStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program-state")],
    programId
  );

  console.log("📍 Program ID:", programId.toString());
  console.log("📍 Program State PDA:", programStatePda.toString());
  console.log("📍 New Token Mint:", newTokenMint.toString());
  console.log("📍 Authority:", provider.wallet.publicKey.toString());

  try {
    const tx = await program.methods
      .updateTokenMint()
      .accounts({
        programState: programStatePda,
        authority: provider.wallet.publicKey,
        newTokenMint: newTokenMint,
      })
      .rpc();

    console.log("\n✅ Token mint updated successfully!");
    console.log("Transaction:", tx);
  } catch (error) {
    console.error("\n❌ Failed to update token mint:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
