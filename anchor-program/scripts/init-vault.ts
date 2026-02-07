import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet & { payer: Keypair };

  const idlPath = path.resolve(__dirname, "..", "target", "idl", "fossr.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

  const programKeypairPath = path.resolve(__dirname, "..", "target", "deploy", "fossr-keypair.json");
  const keypairData = JSON.parse(fs.readFileSync(programKeypairPath, "utf8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  const programId = keypair.publicKey;

  idl.address = programId.toString();
  const program = new Program(idl, provider);

  const [programState] = PublicKey.findProgramAddressSync([Buffer.from("program-state")], program.programId);
  const [programVault] = PublicKey.findProgramAddressSync([Buffer.from("vault")], program.programId);

  console.log("Program:", program.programId.toString());
  console.log("Wallet:", wallet.publicKey.toString());
  console.log("Program State:", programState.toString());
  console.log("Program Vault:", programVault.toString());

  const tx = await program.methods
    .initializeVault()
    .accounts({
      programState,
      authority: wallet.publicKey,
      programVault,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Vault initialized. Tx:", tx);
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});

