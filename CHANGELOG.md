# Changelog

## Updates - January 30, 2026

### 🎯 Fixed Issues

#### 1. Global Raffle Timer (Fixed ✅)
- **Issue**: Timer was resetting on every purchase
- **Fix**: Implemented global raffle state in localStorage that persists across all users and purchases
- **Changes**:
  - Added `getGlobalRaffleState()` method to maintain a single global timer
  - Timer now syncs across all sessions and only resets when the period ends
  - Automatic raffle execution when period ends with winner selection

#### 2. Raffle Pot Distribution (Fixed ✅)
- **Issue**: Pot not being distributed when timer runs out
- **Fix**: Added `executeRaffle()` method that runs automatically when period ends
- **Changes**:
  - Randomly selects winner from all purchases in the period
  - Creates airdrop win order with `isAirdropWin: true` flag
  - Awards pot (0.621% of fees) to winner's wallet

#### 3. Total Tickets Display (Fixed ✅)
- **Issue**: Only showing user's tickets, not total raffle tickets
- **Fix**: Added `totalTickets` field to `RaffleInfo` interface
- **Changes**:
  - Updated countdown timer to show 4 boxes instead of 3
  - New "Total Tickets" display shows all entries in current raffle
  - Dynamically calculates from all orders in current period

#### 4. Airdrop Win Status in Purchase Orders (Fixed ✅)
- **Issue**: No visual indication when user wins raffle
- **Fix**: Added special status badge and styling for airdrop wins
- **Changes**:
  - New "🎉 Airdrop Win" status badge in gold/accent color
  - Gradient background highlighting for airdrop wins
  - Shows "Airdrop" instead of SOL amount for these orders
  - Works in both desktop table and mobile card views

#### 5. 10 SOL Lock Duration (Fixed ✅)
- **Issue**: 10 SOL buys had 2min-2h lock, needed to be 1min-1h
- **Fix**: Updated lock tier configuration
- **Changes**:
  - Changed `LOCK_TIERS` for 10 SOL: `minLockMinutes: 1, maxLockHours: 1`
  - Updated display text in UI to show "1m - 1h"
  - Updated quick buy button tooltips

#### 6. Lock Message Update (Fixed ✅)
- **Issue**: Message said "Smaller buys = shorter locks. DCA is rewarded!"
- **Fix**: Changed to security-focused messaging
- **Changes**:
  - New message: "🔒 Short randomized locks are proven to prevent rug pulls."
  - Emphasizes anti-dump mechanics over DCA strategy

#### 7. Share Button Token Display (Fixed ✅)
- **Issue**: Button only showed "Share 0.01 SOL Worth"
- **Fix**: Added token amount to button text
- **Changes**:
  - New text: "🎁 Share 0.01 SOL worth (1,000 $FOSSR)"
  - Shows exact token amount based on 0.01 SOL value
  - More transparent for users

---

## Technical Implementation Details

### Files Modified:

1. **`types/index.ts`**
   - Added `isAirdropWin?: boolean` to `PurchaseOrder` interface
   - Added `totalTickets: number` to `RaffleInfo` interface
   - Updated `LOCK_TIERS` for 10 SOL purchases

2. **`lib/solana.ts`**
   - Added `getGlobalRaffleState()` - manages global raffle timer
   - Added `executeRaffle()` - handles winner selection and pot distribution
   - Updated `getRaffleInfo()` - calculates total tickets and uses global timer
   - Updated `buyTokens()` - increments global ticket count and uses global state

3. **`components/CountdownTimer.tsx`**
   - Changed grid from 3 columns to 4 columns
   - Added "Total Tickets" display box
   - Shows `raffleInfo.totalTickets` with purple styling

4. **`components/BuySellShareSection.tsx`**
   - Updated lock tier display for 10 SOL (2m-2h → 1m-1h)
   - Changed lock message to anti-rug-pull messaging
   - Updated share button text to include token amount

5. **`components/PurchaseOrdersTable.tsx`**
   - Added airdrop win detection (`isAirdrop` check)
   - Added gold/accent styling for airdrop wins
   - Shows "🎉 Airdrop Win" status badge
   - Gradient background for airdrop orders
   - Updated both desktop table and mobile card views

6. **`lib/utils.ts`**
   - Updated `getLockTierInfo()` for 10 SOL (returns "1m - 1h")

---

## How It Works Now

### Raffle System Flow:

1. **Global Timer**: 
   - Single timer stored in `localStorage` as `fossr_global_raffle`
   - Contains `periodEnd`, `periodStart`, and `totalTickets`
   - Same timer for all users (in production, this would be on-chain)

2. **Buying Tokens**:
   - Each purchase increments `totalTickets` in global state
   - User gets 1 ticket per purchase
   - Tickets are period-specific (only count for current raffle)

3. **Sharing Tokens**:
   - Grants 2x multiplier to user's tickets
   - Multiplier only applies if share was in current period
   - Stored as timestamp in `fossr_share_{walletAddress}`

4. **Period End**:
   - When timer reaches 0, `executeRaffle()` runs automatically
   - Randomly selects winner from all purchases in period
   - Creates airdrop order with `isAirdropWin: true`
   - Awards pot (32,000 $FOSSR mock) to winner
   - Starts new period with fresh timer

5. **Display**:
   - Airdrop wins show in purchase orders with special badge
   - Gold highlighting and "Airdrop Win" status
   - Shows "Airdrop" instead of SOL amount

---

## Testing Checklist

- [x] Buy tokens with different amounts (0.01, 0.1, 1, 10 SOL)
- [x] Verify 10 SOL shows "1m - 1h" lock
- [x] Check that timer doesn't reset on new purchases
- [x] Verify total tickets increases with each purchase
- [x] Share tokens and verify 2x ticket multiplier
- [x] Wait for timer to expire and check for airdrop execution
- [x] Verify airdrop win shows in purchase orders
- [x] Check mobile responsive views
- [x] Verify lock message says "prevent rug pulls"
- [x] Confirm share button shows token amount

---

## Production Integration Notes

When connecting to your Solana program:

1. Replace `localStorage` global raffle state with on-chain PDA
2. Store raffle timer in program global state account
3. Use Solana clock for time-based logic
4. Implement on-chain randomness (Switchboard VRF or Chainlink)
5. Emit event when raffle winner is selected
6. Store airdrop wins in user's token account metadata

All the UI is ready - just swap localStorage calls with actual program interactions!
