/**
 * Check FOSSR Program State
 * Diagnoses common issues with the deployment
 */

import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("HDgAGWgaB1dS8fUs9pjrCd78kLJyFuzPicJMUcrLEahu");
const TOKEN_MINT = new PublicKey("13kEaQqUm2PNHE6zzjEp2wNyi8RyKRVzVegh6XHoF2hi");

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  console.log("🔍 FOSSR Diagnostic Check\n");
  console.log("=".repeat(60));

  // Check Program State
  const [programStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program-state")],
    PROGRAM_ID
  );

  console.log(`\n📍 Program ID: ${PROGRAM_ID.toString()}`);
  console.log(`📍 Program State PDA: ${programStatePda.toString()}`);

  const stateAccount = await connection.getAccountInfo(programStatePda);
  if (!stateAccount) {
    console.log("❌ Program state NOT initialized!");
    return;
  }
  console.log(`✅ Program state exists (${stateAccount.data.length} bytes)`);
  console.log(`   Owner: ${stateAccount.owner.toString()}`);

  // Check Vault
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault")],
    PROGRAM_ID
  );
  console.log(`\n📍 Vault PDA: ${vaultPda.toString()}`);

  const vaultAccount = await connection.getAccountInfo(vaultPda);
  if (!vaultAccount) {
    console.log("❌ Vault NOT initialized! Run init-vault.ts");
    return;
  }
  console.log(`✅ Vault exists`);
  console.log(`   Balance: ${vaultAccount.lamports / 1e9} SOL`);
  console.log(`   Owner: ${vaultAccount.owner.toString()}`);

  // Check Token Mint
  console.log(`\n🪙 Token Mint: ${TOKEN_MINT.toString()}`);
  const mintInfo = await connection.getParsedAccountInfo(TOKEN_MINT);
  if (!mintInfo.value) {
    console.log("❌ Token mint NOT found!");
    return;
  }

  if (mintInfo.value.data && "parsed" in mintInfo.value.data) {
    const mintData = mintInfo.value.data.parsed.info;
    console.log(`✅ Token mint exists`);
    console.log(`   Decimals: ${mintData.decimals}`);
    console.log(`   Supply: ${mintData.supply}`);
    console.log(`   Mint Authority: ${mintData.mintAuthority || "NONE"}`);
    console.log(`   Freeze Authority: ${mintData.freezeAuthority || "NONE"}`);

    // Check if mint authority is the program state PDA
    if (mintData.mintAuthority === programStatePda.toString()) {
      console.log(`   ✅ Mint authority correctly set to Program State PDA`);
    } else {
      console.log(`   ⚠️  Mint authority is NOT the Program State PDA!`);
      console.log(`   Expected: ${programStatePda.toString()}`);
      console.log(`   Actual: ${mintData.mintAuthority}`);
      console.log(`\n   To fix, run:`);
      console.log(`   spl-token authorize ${TOKEN_MINT.toString()} mint ${programStatePda.toString()}`);
    }
  }

  // Parse and display program state data
  console.log("\n📊 Program State Data:");
  const data = stateAccount.data;
  let offset = 8; // Skip discriminator

  const authority = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
  const tokenMint = new PublicKey(data.slice(offset, offset + 32)); offset += 32;

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const currentPrice = view.getBigUint64(offset, true); offset += 8;
  const totalBurned = view.getBigUint64(offset, true); offset += 8;
  const totalBuys = view.getBigUint64(offset, true); offset += 8;
  const nextAirdropTime = view.getBigInt64(offset, true); offset += 8;
  const airdropAmount = view.getBigUint64(offset, true); offset += 8;
  const lastAirdropCycle = view.getBigInt64(offset, true); offset += 8;
  const airdropExecuted = data[offset] !== 0; offset += 1;
  const bump = data[offset];

  console.log(`   Authority: ${authority.toString()}`);
  console.log(`   Token Mint: ${tokenMint.toString()}`);
  console.log(`   Current Price: ${currentPrice.toString()} lamports`);
  console.log(`   Total Burned: ${Number(totalBurned) / 1e9} tokens`);
  console.log(`   Total Buys: ${totalBuys.toString()}`);
  console.log(`   Next Airdrop: ${new Date(Number(nextAirdropTime) * 1000).toISOString()}`);
  console.log(`   Airdrop Pot: ${Number(airdropAmount) / 1e9} tokens`);
  console.log(`   Airdrop Executed: ${airdropExecuted}`);

  // Check for any PurchaseOrder accounts
  console.log("\n📦 Purchase Orders:");
  const purchaseOrders = await connection.getProgramAccounts(PROGRAM_ID, {
    commitment: "confirmed",
  });

  // Filter for PurchaseOrder accounts (not ProgramState)
  const orders = purchaseOrders.filter(acc => acc.account.data.length > 8 && acc.account.data.length < 100);
  console.log(`   Found ${orders.length} order accounts`);

  orders.forEach((order, i) => {
    if (i < 5) { // Show first 5
      const data = order.account.data;
      if (data.length >= 73) {
        const buyer = new PublicKey(data.slice(8, 40));
        console.log(`   ${i + 1}. Buyer: ${buyer.toString().slice(0, 8)}... Account: ${order.pubkey.toString().slice(0, 8)}...`);
      }
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log("Diagnostic complete!");
}

main().catch(console.error);
