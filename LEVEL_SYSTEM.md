# Level System Documentation

## Overview
The $FOSSR level system rewards long-term holders with progressively shorter lock times. This is a **V1 frontend-only implementation** for preview purposes. V2 will enforce level-based locks on-chain.

## Level Tiers

### Level 1: Invisible Guppy 🐟
- **Points Required:** 0+
- **Lock Tiers:**
  - < 0.1 SOL: 5 min – 5 hrs
  - < 0.5 SOL: 4 min – 4 hrs
  - < 1.0 SOL: 3 min – 3 hrs
  - ≤ 10.0 SOL: 1 min – 1 hr

### Level 2: Chained Shark 🦈
- **Points Required:** 50,000
- **Lock Tiers:** ~10% reduction in max times
  - < 0.1 SOL: 5 min – 4.5 hrs
  - < 0.5 SOL: 4 min – 3.6 hrs
  - < 1.0 SOL: 3 min – 2.7 hrs
  - ≤ 10.0 SOL: 1 min – 54 min

### Level 3: Ghost Whale 👻
- **Points Required:** 500,000
- **Lock Tiers:** Significant reduction
  - < 0.1 SOL: 50 sec – 50 min
  - < 0.5 SOL: 40 sec – 40 min
  - < 1.0 SOL: 30 sec – 30 min
  - ≤ 10.0 SOL: 10 sec – 10 min

### Level 4: Reserve Phantom 🔥
- **Points Required:** 2,500,000
- **Lock Tiers:** Maximum benefits
  - < 0.1 SOL: 50 sec – 5 min
  - < 0.5 SOL: 40 sec – 4 min
  - < 1.0 SOL: 30 sec – 3 min
  - ≤ 10.0 SOL: 10 sec – 1 min

## Points Calculation

```typescript
points = totalBalance × hoursHeld × 1.042
```

### Formula Breakdown:
- **totalBalance**: Sum of all $FOSSR tokens (locked + unlocked)
- **hoursHeld**: Hours since first purchase
- **Multiplier**: 1.042 (104.2% of hours value)
- Formula: `Math.floor(balance × hours × 1.042)`

### Example Calculations:

#### Scenario 1: Small Holder
```
Balance: 1,000 tokens
Time: 480 hours (20 days)
Points = 1,000 × 480 × 1.042 = 500,160 points
Level = Ghost Whale (Level 3) 👻
```

#### Scenario 2: Medium Holder
```
Balance: 10,000 tokens
Time: 240 hours (10 days)
Points = 10,000 × 240 × 1.042 = 2,500,800 points
Level = Reserve Phantom (Level 4) 🔥
```

#### Scenario 3: Large Holder
```
Balance: 100,000 tokens
Time: 25 hours
Points = 100,000 × 25 × 1.042 = 2,605,000 points
Level = Reserve Phantom (Level 4) 🔥
```

#### Scenario 4: Patient Holder
```
Balance: 500 tokens
Time: 960 hours (40 days)
Points = 500 × 960 × 1.042 = 500,160 points
Level = Ghost Whale (Level 3) 👻
```

### Quick Reference Table:

| Balance | Hours to Level 2 (50K) | Hours to Level 3 (500K) | Hours to Level 4 (2.5M) |
|---------|---------------------|----------------------|------------------------|
| 100 | 480 hrs (20 days) | 4,800 hrs (200 days) | 24,000 hrs (1000 days) |
| 1,000 | 48 hrs (2 days) | 480 hrs (20 days) | 2,400 hrs (100 days) |
| 10,000 | 4.8 hrs | 48 hrs (2 days) | 240 hrs (10 days) |
| 100,000 | 0.48 hrs (29 min) | 4.8 hrs | 24 hrs (1 day) |

### Growth Over Time:

```
1,000 tokens held:
- After 1 hour: 1,042 points
- After 48 hours: 50,016 points (Level 2)
- After 480 hours: 500,160 points (Level 3)
- After 2,400 hours: 2,500,800 points (Level 4)
```

## Implementation Details

### Files Created:

1. **`lib/levels.ts`**
   - Level definitions and utilities
   - Point calculation helpers
   - Lock tier lookups

2. **`hooks/useUserLevel.ts`**
   - Custom React hook for fetching user level
   - Calculates points from balance × hold time
   - Auto-refreshes every 30 seconds
   - Handles loading and error states

3. **`components/LevelBadge.tsx`**
   - Main level display component
   - Shows current level with emoji
   - Progress bar to next level
   - Points display with formatting

4. **`components/LevelBenefitsPreview.tsx`**
   - Shows lock tier benefits in Buy section
   - Compares current vs next level
   - V1 disclaimer (preview only)

### Data Sources:

#### Current (Demo/LocalStorage):
```typescript
// Balance from localStorage orders
const orders = localStorage.getItem(`fossr_orders_${wallet}`)
const totalBalance = orders.reduce((sum, order) => sum + order.tokenAmount, 0)

// First purchase time
const oldest = orders.filter(o => !o.isAirdropWin).sort()[0]
const firstTime = oldest.timestamp

// Hours held
const hoursHeld = (Date.now() - firstTime) / (1000 * 60 * 60)

// Points (1.042x multiplier)
const points = Math.floor(balance × hoursHeld × 1.042)
```

#### Production (On-Chain):
```typescript
// Balance from SPL token account
const tokenAccount = await getAssociatedTokenAddress(tokenMint, wallet)
const accountInfo = await getAccount(connection, tokenAccount)
const balance = accountInfo.amount

// First purchase from transaction history
const signatures = await connection.getSignaturesForAddress(wallet)
// Filter for $FOSSR mint transfers, find oldest
```

## UI Components

### Dashboard Integration:

1. **Level Badge** (between Countdown Timer and Buy section)
   - Shows current level prominently
   - Progress bar with percentage
   - Points breakdown
   - Tips for leveling up

2. **Level Benefits Preview** (inside Buy tab)
   - Current lock tier benefits
   - Next level preview
   - V1 disclaimer

3. **Stats Card** (optional enhancement)
   - Could add "Level" stat card in top grid
   - Quick reference for level number

### Mobile Responsive:
- All components use Tailwind responsive classes
- Stacks vertically on mobile
- Progress bars scale appropriately
- Touch-friendly targets

## Progress Tracking

### Calculation:
```typescript
progress = ((currentPoints - levelMin) / (nextLevelMin - levelMin)) × 100
```

### Example:
```
Current: 70,000 points (Level 3: Ghost Whale)
Level 3 min: 50,000
Level 4 min: 250,000
Progress = (70,000 - 50,000) / (250,000 - 50,000) × 100
        = 20,000 / 200,000 × 100
        = 10%
```

## V1 vs V2

### V1 (Current):
- ✅ Frontend-only calculation
- ✅ Visual preview of benefits
- ✅ Progress tracking
- ✅ Points display
- ❌ Actual locks still use base tiers
- ❌ No on-chain enforcement

### V2 (Future):
- ✅ On-chain level storage in program
- ✅ Actual lock reductions enforced
- ✅ NFT badges for levels (optional)
- ✅ Level-gated features
- ✅ Leaderboard

## Error Handling

### Scenarios Covered:
1. **Wallet not connected**: Shows "Connect wallet to see your level"
2. **Loading state**: Skeleton/shimmer animation
3. **Fetch error**: Fallbacks to Level 1 with 0 points
4. **No purchases**: Level 1, 0 days held
5. **Balance zero**: Level 1, but tracks hold time

### Console Logging:
```typescript
console.error('Error fetching user level:', error)
console.error('Error getting token balance:', error)
console.error('Error getting first purchase time:', error)
```

## Performance

### Optimization:
- Memoized calculations in hook
- 30-second refresh interval (not every render)
- Lightweight localStorage reads
- No heavy computations in render path

### Future Improvements:
- WebSocket subscriptions for real-time updates
- Caching with stale-while-revalidate
- Background sync with service workers

## Testing Checklist

- [ ] Wallet connection shows/hides level badge
- [ ] Points calculate correctly (balance × days)
- [ ] Progress bar updates as points increase
- [ ] Level transitions work (cross thresholds)
- [ ] Max level (Level 4) shows "MAX LEVEL ACHIEVED"
- [ ] Benefits preview shows correct lock tiers
- [ ] Mobile responsive on all screen sizes
- [ ] Loading states display properly
- [ ] Error states fallback gracefully
- [ ] Refresh button updates level data

## Future Enhancements

1. **Level Animations**
   - Confetti on level up
   - Smooth transitions
   - Sound effects (optional)

2. **Social Features**
   - Share level on Twitter
   - Leaderboard rankings
   - Level badges as NFTs

3. **Gamification**
   - Achievements system
   - Daily quests
   - Bonus point events

4. **Analytics**
   - Track level distribution
   - Average hold time by level
   - Progression patterns

---

**Note:** This is a V1 preview system. Actual lock reductions will be implemented on-chain in V2 with proper Anchor program updates for security and fairness.
