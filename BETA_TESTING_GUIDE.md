# 🧪 FOSSR Beta Testing Guide

## What We're Testing
This is the **UI DEMO** - smart contract not deployed yet. You're testing for:
- Visual bugs
- Broken buttons/links
- Mobile responsiveness
- Wallet connection
- UX issues

**All transactions are FAKE** (no real SOL spent).

---

## Setup (2 min)

1. Install Phantom wallet: https://phantom.app
2. Switch to **Devnet** in wallet settings
3. Get free devnet SOL: https://faucet.solana.com
4. Visit: [YOUR_VERCEL_URL_HERE]

---

## Test Scenarios

### 1. First Impression (1 min)
- [ ] Page loads quickly
- [ ] Logo displays correctly
- [ ] Colors/design look good
- [ ] Warning banner is visible
- [ ] Text is readable (no typos?)

### 2. Wallet Connection (2 min)
- [ ] Click "Select Wallet"
- [ ] Connect Phantom
- [ ] Wallet address shows in top-right
- [ ] Dashboard loads data
- [ ] Disconnect works

### 3. Navigation & Layout (3 min)
**Desktop:**
- [ ] All sections visible
- [ ] Stats cards aligned properly
- [ ] Tables readable
- [ ] Countdown timer works

**Mobile:**
- [ ] Open on phone
- [ ] Logo + title fit on screen
- [ ] Level badge at top
- [ ] Stats cards stack nicely
- [ ] Buttons not cut off
- [ ] Can scroll smoothly

### 4. Level System (2 min)
- [ ] Level badge displays
- [ ] Progress bar shows
- [ ] Tooltips work (hover over ℹ️)
- [ ] Points calculation makes sense

### 5. Buy/Sell Section (3 min)
- [ ] Quick buy buttons (0.1, 0.5, 1 SOL) work
- [ ] Custom amount input works
- [ ] Lock tier preview shows
- [ ] "Preview" shows correct amounts
- [ ] "Buy" button clickable
- [ ] Share button displays correct amount

### 6. Countdown Timer (2 min)
- [ ] Timer counts down
- [ ] Shows hours:min:sec
- [ ] "Next Airdrop Amount" displays
- [ ] "Your Tickets" shows
- [ ] "Total Tickets" shows

### 7. Purchase Orders Table (3 min)
- [ ] Shows recent orders
- [ ] Status badges show (Locked/Unlocked)
- [ ] Time remaining counts down
- [ ] Transaction links work
- [ ] Mobile: Cards stack properly

### 8. Edge Cases (5 min)
- [ ] Disconnect wallet → data clears
- [ ] Reconnect → data reappears
- [ ] Refresh page → doesn't break
- [ ] Click refresh button → updates
- [ ] Try tiny screen (320px width)
- [ ] Try huge screen (4K)

---

## 🐛 Report Bugs Like This:

**Format:**
```
Device: [iPhone 13 / MacBook Pro / Windows PC]
Browser: [Chrome / Safari / Firefox]
Screen: [Desktop / Mobile / Tablet]

What happened:
[Describe the bug]

What you expected:
[What should have happened]

Steps to reproduce:
1. Click X
2. Type Y
3. See error Z

Screenshot: [attach if possible]
```

**Example:**
```
Device: iPhone 13
Browser: Safari
Screen: Mobile

What happened:
"Buy" button is cut off on the right side

What you expected:
Full button visible

Steps to reproduce:
1. Open site on iPhone
2. Scroll to Buy section
3. Button partially off-screen

Screenshot: [attach]
```

---

## 📝 What to Focus On

### **High Priority:**
- Broken layouts (things overlapping/cut off)
- Buttons that don't work
- Wallet connection issues
- Mobile display problems
- Typos in main text

### **Low Priority:**
- Minor color tweaks
- Small alignment issues
- Animation preferences
- "Nice to have" features

---

## ⏱️ Time Needed
- Quick test: 10 minutes
- Thorough test: 20-30 minutes

---

## 💬 Where to Report

Send bugs to:
- [Your Discord/Telegram/Email]
- Or use this form: [Google Form if you made one]

---

## 🎁 Incentive (Optional)

Top 3 bug finders get:
- Free $FOSSR tokens at launch
- Whitelist for future drops
- Eternal glory

---

## ⚠️ Remember

- **NO REAL MONEY** - all transactions are fake
- You're testing **UI only**, not smart contract
- Smart contract will be deployed later
- This helps make launch smooth!

Thanks for testing! 🚀
```

Send this to your testers: [VERCEL_URL]/testing-guide
```
