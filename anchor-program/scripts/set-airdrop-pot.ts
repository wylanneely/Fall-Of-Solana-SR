import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// Usage:
//   ./node_modules/.bin/ts-node scripts/set-airdrop-pot.ts 100
// Sets ProgramState.airdrop_amount to N tokens (converted to base units, 9 decimals).

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet & { payer: Keypair };

  const tokensArg = process.argv[2];
  if (!tokensArg) {
    throw new Error("Missing amount. Example: ts-node scripts/set-airdrop-pot.ts 100");
  }

  const tokens = Number(tokensArg);
  if (!Number.isFinite(tokens) || tokens <= 0) {
    throw new Error(`Invalid amount: ${tokensArg}`);
  }

  const baseUnits = BigInt(Math.round(tokens * 1_000_000_000)); // 9 decimals

  const idlPath = path.resolve(__dirname, "..", "target", "idl", "fossr.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

  const programKeypairPath = path.resolve(__dirname, "..", "target", "deploy", "fossr-keypair.json");
  const keypairData = JSON.parse(fs.readFileSync(programKeypairPath, "utf8"));
  const programKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  const programId = programKeypair.publicKey;

  idl.address = programId.toString();
  const program = new Program(idl, provider);

  const [programState] = PublicKey.findProgramAddressSync([Buffer.from("program-state")], program.programId);

  console.log("Program:", program.programId.toString());
  console.log("Authority:", wallet.publicKey.toString());
  console.log("Program State:", programState.toString());
  console.log("Setting airdrop pot to:", tokens, "tokens (base units:", baseUnits.toString(), ")");

  const tx = await program.methods
    .updateAirdropSettings(new anchor.BN(baseUnits.toString()))
    .accounts({
      programState,
      authority: wallet.publicKey,
    })
    .rpc();

  console.log("✅ Airdrop pot updated. Tx:", tx);
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});

