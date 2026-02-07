/**
 * Automated Airdrop Runner
 * 
 * Runs continuously, executing the airdrop every 5 minutes:
 * 1. Fetches all eligible token holders (10,000+ tokens)
 * 2. Randomly selects ONE winner
 * 3. Calls the airdrop instruction
 * 4. Resets the cycle for the next period
 * 
 * Usage:
 *   export ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
 *   export ANCHOR_WALLET="/Users/wylanneely/.config/solana/id.json"
 *   ./node_modules/.bin/ts-node scripts/airdrop-runner.ts
 * 
 * To run in background:
 *   nohup ./node_modules/.bin/ts-node scripts/airdrop-runner.ts > airdrop.log 2>&1 &
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, Connection, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

const AIRDROP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MIN_ELIGIBLE_TOKENS = 10_000_000_000_000n; // 10,000 tokens (9 decimals)

interface EligibleHolder {
  wallet: PublicKey;
  tokenAccount: PublicKey;
  balance: bigint;
}

function readU64LE(buffer: Buffer | Uint8Array, offset: number): bigint {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return view.getBigUint64(offset, true);
}

function readI64LE(buffer: Buffer | Uint8Array, offset: number): bigint {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return view.getBigInt64(offset, true);
}

interface ProgramStateData {
  authority: PublicKey;
  tokenMint: PublicKey;
  currentPrice: bigint;
  totalBurned: bigint;
  totalBuys: bigint;
  nextAirdropTime: bigint;
  airdropAmount: bigint;
  lastAirdropCycle: bigint;
  airdropExecuted: boolean;
  bump: number;
}

function parseProgramState(data: Buffer): ProgramStateData {
  let offset = 8; // Skip Anchor discriminator
  const authority = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
  const tokenMint = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
  const currentPrice = readU64LE(data, offset); offset += 8;
  const totalBurned = readU64LE(data, offset); offset += 8;
  const totalBuys = readU64LE(data, offset); offset += 8;
  const nextAirdropTime = readI64LE(data, offset); offset += 8;
  const airdropAmount = readU64LE(data, offset); offset += 8;
  const lastAirdropCycle = readI64LE(data, offset); offset += 8;
  const airdropExecuted = data[offset] !== 0; offset += 1;
  const bump = data[offset];
  
  return {
    authority,
    tokenMint,
    currentPrice,
    totalBurned,
    totalBuys,
    nextAirdropTime,
    airdropAmount,
    lastAirdropCycle,
    airdropExecuted,
    bump,
  };
}

async function main() {
  console.log("🚀 FOSSR Airdrop Runner starting...");
  console.log(`⏱️  Airdrop interval: ${AIRDROP_INTERVAL_MS / 1000 / 60} minutes`);
  console.log(`🎯 Minimum eligible balance: ${Number(MIN_ELIGIBLE_TOKENS) / 1_000_000_000} tokens\n`);

  // Setup provider
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  const programId = new PublicKey("93KPeH4wk9VQGrcAhabXn4EcnaGbTo5JxkwMB2We8Meo");
  
  // Load IDL
  const idlPath = path.join(__dirname, "..", "target", "idl", "fossr.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  idl.address = programId.toString();
  
  const program = new Program(idl, provider);

  // Get PDAs
  const [programStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program-state")],
    programId
  );

  // Fetch token mint from program state
  const stateAccountInfo = await provider.connection.getAccountInfo(programStatePda);
  if (!stateAccountInfo) {
    throw new Error("Program state not initialized");
  }
  const stateAccount = parseProgramState(stateAccountInfo.data as Buffer);
  
  // OVERRIDE: Use the correct token mint (program state has old one due to migration)
  // The program state PDA IS the mint authority for this mint
  const tokenMint = new PublicKey("JCmJCCCegW6QSX6kUVzkjuiCmtRQEf8Vo2Xm8j24jpoP");

  console.log(`📍 Program ID: ${programId.toString()}`);
  console.log(`📍 Program State: ${programStatePda.toString()}`);
  console.log(`🪙 Token Mint: ${tokenMint.toString()}`);
  console.log(`👛 Authority: ${provider.wallet.publicKey.toString()}\n`);

  // Main loop
  while (true) {
    try {
      await runAirdropCycle(program, provider, programStatePda, tokenMint);
    } catch (error) {
      console.error("❌ Error in airdrop cycle:", error);
    }

    // Wait for next cycle
    console.log(`\n⏳ Waiting ${AIRDROP_INTERVAL_MS / 1000} seconds until next cycle...\n`);
    await sleep(AIRDROP_INTERVAL_MS);
  }
}

async function runAirdropCycle(
  program: Program,
  provider: AnchorProvider,
  programStatePda: PublicKey,
  tokenMint: PublicKey
) {
  const now = new Date();
  console.log(`\n========================================`);
  console.log(`🎲 Airdrop Cycle: ${now.toISOString()}`);
  console.log(`========================================`);

  // Fetch current state
  const stateAccountInfo = await provider.connection.getAccountInfo(programStatePda);
  if (!stateAccountInfo) {
    console.log("❌ Program state not found");
    return;
  }
  const state = parseProgramState(stateAccountInfo.data as Buffer);
  
  const currentTime = Math.floor(Date.now() / 1000);
  const nextAirdropTime = Number(state.nextAirdropTime);
  const airdropAmount = Number(state.airdropAmount) / 1_000_000_000;
  const airdropExecuted = state.airdropExecuted;

  console.log(`📊 Current pot: ${airdropAmount.toLocaleString()} tokens`);
  console.log(`⏰ Next airdrop time: ${new Date(nextAirdropTime * 1000).toISOString()}`);
  console.log(`✅ Airdrop executed this cycle: ${airdropExecuted}`);

  // Check if it's time for airdrop
  if (currentTime < nextAirdropTime) {
    const waitSeconds = nextAirdropTime - currentTime;
    console.log(`⏳ Not time yet. ${waitSeconds}s until next airdrop window.`);
    return;
  }

  // If airdrop was already executed this cycle, just reset
  if (airdropExecuted) {
    console.log("🔄 Airdrop already executed. Resetting cycle...");
    await resetCycle(program, programStatePda, provider);
    return;
  }

  // Find eligible holders
  console.log("\n🔍 Searching for eligible token holders...");
  const eligibleHolders = await findEligibleHolders(provider.connection, tokenMint);

  if (eligibleHolders.length === 0) {
    console.log("❌ No eligible holders found (need 10,000+ tokens)");
    console.log("🔄 Resetting cycle without airdrop...");
    await resetCycle(program, programStatePda, provider);
    return;
  }

  console.log(`✅ Found ${eligibleHolders.length} eligible holder(s):`);
  eligibleHolders.forEach((h, i) => {
    console.log(`   ${i + 1}. ${h.wallet.toString().slice(0, 8)}... - ${Number(h.balance) / 1_000_000_000} tokens`);
  });

  // Randomly select winner
  const winnerIndex = Math.floor(Math.random() * eligibleHolders.length);
  const winner = eligibleHolders[winnerIndex];

  console.log(`\n🎉 WINNER SELECTED: ${winner.wallet.toString()}`);
  console.log(`   Token Account: ${winner.tokenAccount.toString()}`);
  console.log(`   Balance: ${Number(winner.balance) / 1_000_000_000} tokens`);
  console.log(`   Prize: ${airdropAmount.toLocaleString()} tokens`);

  // Execute airdrop
  try {
    console.log("\n📤 Executing airdrop transaction...");
    const [lastAirdropPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("last-airdrop")],
      program.programId
    );
    const tx = await program.methods
      .airdrop()
      .accounts({
        programState: programStatePda,
        tokenMint: tokenMint,
        authority: provider.wallet.publicKey,
        recipientTokenAccount: winner.tokenAccount,
        lastAirdrop: lastAirdropPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`✅ Airdrop successful! Tx: ${tx}`);
  } catch (error: any) {
    if (error.message?.includes("AirdropAlreadyExecuted")) {
      console.log("⚠️ Airdrop already executed this cycle (race condition)");
    } else {
      console.error("❌ Airdrop failed:", error.message || error);
    }
  }

  // Reset for next cycle
  console.log("\n🔄 Resetting airdrop cycle...");
  await resetCycle(program, programStatePda, provider);
}

async function resetCycle(
  program: Program,
  programStatePda: PublicKey,
  provider: AnchorProvider
) {
  try {
    const tx = await program.methods
      .resetAirdropCycle()
      .accounts({
        programState: programStatePda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    console.log(`✅ Cycle reset! Tx: ${tx}`);
  } catch (error: any) {
    if (error.message?.includes("AirdropNotReady")) {
      console.log("⏳ Cycle not ready to reset yet");
    } else {
      console.error("❌ Reset failed:", error.message || error);
    }
  }
}

async function findEligibleHolders(
  connection: Connection,
  tokenMint: PublicKey
): Promise<EligibleHolder[]> {
  const eligible: EligibleHolder[] = [];

  try {
    // Get all token accounts for this mint (use finalized commitment)
    const tokenAccounts = await connection.getTokenLargestAccounts(tokenMint, "finalized");

    for (const account of tokenAccounts.value) {
      const balance = BigInt(account.amount);
      
      if (balance >= MIN_ELIGIBLE_TOKENS) {
        // Get the owner of this token account
        const accountInfo = await connection.getParsedAccountInfo(account.address);
        
        if (accountInfo.value?.data && "parsed" in accountInfo.value.data) {
          const owner = new PublicKey(accountInfo.value.data.parsed.info.owner);
          
          eligible.push({
            wallet: owner,
            tokenAccount: account.address,
            balance,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error fetching token accounts:", error);
  }

  return eligible;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
