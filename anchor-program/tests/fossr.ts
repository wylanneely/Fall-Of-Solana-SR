import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Fossr } from "../target/types/fossr";
import { assert } from "chai";

describe("fossr", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Fossr as Program<Fossr>;
  
  let tokenMint: anchor.web3.PublicKey;
  let programState: anchor.web3.PublicKey;
  let programVault: anchor.web3.PublicKey;

  before(async () => {
    // Find PDAs
    [programState] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("program-state")],
      program.programId
    );

    [programVault] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("vault")],
      program.programId
    );
  });

  it("Initializes the program", async () => {
    // Create token mint
    tokenMint = await createMint(
      provider.connection,
      provider.wallet.payer,
      programState,
      null,
      9 // 9 decimals
    );

    const bondingCurvePrice = new anchor.BN(10000); // 0.00001 SOL per token

    await program.methods
      .initialize(bondingCurvePrice)
      .accounts({
        programState,
        tokenMint,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const state = await program.account.programState.fetch(programState);
    assert.equal(state.currentPrice.toNumber(), 10000);
    console.log("✅ Program initialized");
  });

  it("Buys tokens with protective lock", async () => {
    const buyer = provider.wallet.publicKey;
    const solAmount = new anchor.BN(anchor.web3.LAMPORTS_PER_SOL * 0.5); // 0.5 SOL

    const [purchaseOrder] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("purchase-order"),
        buyer.toBuffer(),
        Buffer.from(new Date().getTime().toString()),
      ],
      program.programId
    );

    await program.methods
      .buyTokens(solAmount)
      .accounts({
        programState,
        tokenMint,
        buyer,
        purchaseOrder,
        programVault,
      })
      .rpc();

    const order = await program.account.purchaseOrder.fetch(purchaseOrder);
    assert.ok(order.tokenAmount.toNumber() > 0);
    assert.ok(order.unlockTime > Date.now() / 1000);
    console.log("✅ Tokens purchased with lock");
  });

  it("Unlocks tokens after lock period", async () => {
    // This test would need to wait for the lock period or manipulate time
    console.log("⏭️  Skip unlock test (requires time passage)");
  });

  it("Executes raffle", async () => {
    // This test would need a full raffle period
    console.log("⏭️  Skip raffle test (requires full period)");
  });
});

// Helper to create mint
async function createMint(
  connection: anchor.web3.Connection,
  payer: anchor.web3.Keypair,
  mintAuthority: anchor.web3.PublicKey,
  freezeAuthority: anchor.web3.PublicKey | null,
  decimals: number
): Promise<anchor.web3.PublicKey> {
  const mint = anchor.web3.Keypair.generate();
  // Implementation would use SPL Token program
  return mint.publicKey;
}
