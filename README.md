# $FOSSR - Fall of Solana Strategic Reserve

The gamified, rug-resistant Solana token with **5-Tier Randomized Lock System** that rewards long-term holders.

## 🎯 Core Features

### **5-Tier Randomized Lock System** (Your Signature Mechanic)
- **Level 1** (0 tokens): 10m-100m locks for 0.01 SOL purchases (longest locks)
- **Level 5** (10M+ tokens): **Instant unlocks** for all purchases
- **Randomization**: Lock duration randomized within tier ranges for unpredictability
- **SOL Tiers**: 0.01, 0.1, 1, 10 SOL purchases get different lock ranges per level

**Why it works**: Encourages DCA buying, rewards long-term holding, prevents rug pulls.

### **Deflationary Tokenomics**
- **0.069% burn** on every buy transaction
- **0.621% raffle fee** accumulates into airdrop pot
- **Total 0.69% tax** - fair and transparent

### **Timed Airdrop Raffles**
- **Every 5 minutes** during bonding phase
- **One winner per cycle** gets the accumulated pot
- **Level 2+ holders eligible** (10K+ tokens)
- **Share-to-earn**: 2x raffle tickets for sharing

### **100% Fair Launch**
- **0% team allocation**
- **No presale**
- **Full transparency** - all code open source

## 🛡️ Anti-Rug Mechanics
- **Tiered locks** prevent large dump opportunities
- **Randomized durations** make timing attacks impossible
- **Burn on every transaction** reduces supply over time
- **On-chain verifiable** - everything transparent

## 🚀 Tech Stack
- **Next.js 14** with App Router
- **Solana Web3.js** & SPL Token
- **Wallet Adapter** (Phantom, Solflare, etc.)
- **Tailwind CSS** for responsive design
- **TypeScript** for type safety
- **Anchor Framework** for smart contracts

## 📊 Tokenomics
- **Total Supply**: 1,000,000,000 $FOSSR
- **Buy Tax**: 0.69% (0.069% burn + 0.621% raffle)
- **Sell Tax**: 0.1% burn
- **Airdrop Pot**: Accumulates from raffle fees

## 🎮 User Experience
- **Dashboard**: Real-time balance, level progress, raffle countdown
- **Level Badges**: Visual progression with unlock benefits
- **Purchase Orders**: Track all buys with lock timers
- **Responsive**: Works on mobile and desktop

## 🔧 Development
- **Smart Contracts**: Anchor Rust program with bonding curve
- **Frontend**: React/Next.js with Solana wallet integration
- **Testing**: Devnet deployed, ready for community testing

## 🌐 Live Demo
[Preview with 5-Tier Locks](https://fossr-dashboard-git-staging-5tier-locks-wylans-projects-6335ab2e.vercel.app)

## 📝 Getting Started
1. Clone repo: `git clone https://github.com/wylanneely/Fall-Of-Solana-SR.git`
2. Install: `npm install`
3. Devnet: `npm run dev`
4. Build: `npm run build`

## 🚀 Deployment
- **Vercel**: Auto-deploys on git push
- **Mainnet**: Ready for production launch
- **Devnet**: Testing environment live

## 🤝 Community
- **Telegram**: t.me/fossr
- **X/Twitter**: @ColdsideCrypto
- **Instagram**: @DonWylan

## 📄 License
MIT License - Open source and community-driven.

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Solana wallet (Phantom recommended)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd FOSSR
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Configure environment variables:

Edit `.env.local` with your actual values:
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_FOSSR_PROGRAM_ID=YourActualProgramID
NEXT_PUBLIC_FOSSR_TOKEN_MINT=YourActualTokenMint
NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED=H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
FOSSR/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Main dashboard page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout with providers
│   └── page.tsx              # Home page (redirects to dashboard)
├── components/
│   ├── BuySellShareSection.tsx
│   ├── CountdownTimer.tsx
│   ├── LoadingSpinner.tsx
│   ├── PurchaseOrdersTable.tsx
│   ├── StatsCard.tsx
│   └── WalletProvider.tsx
├── lib/
│   ├── solana.ts             # Solana service & API calls
│   └── utils.ts              # Utility functions
├── types/
│   └── index.ts              # TypeScript type definitions
├── .env.local                # Environment variables
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Usage

### Connecting Wallet

Click "Select Wallet" in the top right to connect your Solana wallet (Phantom, Solflare, etc.).

### Buying Tokens

1. Navigate to the "Buy" tab
2. Choose a quick buy amount (0.01, 0.1, 1, or 10 SOL) or enter a custom amount
3. Tokens will be locked based on purchase size:
   - < 0.1 SOL: 5 minutes to 5 hours
   - < 0.5 SOL: 4 minutes to 4 hours
   - < 1.0 SOL: 3 minutes to 3 hours
   - ≤ 10.0 SOL: 2 minutes to 2 hours

### Selling Tokens

1. Navigate to the "Sell" tab
2. Select percentage (25%, 50%, or 100%) of unlocked tokens
3. Only unlocked tokens can be sold

### Sharing Tokens

1. Navigate to the "Share" tab
2. Enter recipient's Solana wallet address
3. Share 0.01 SOL worth of $FOSSR
4. Receive 2x raffle tickets for the current airdrop period!

### Raffle System

- Airdrops occur every 4 minutes 20 seconds during bonding phase
- Each purchase = 1 raffle ticket
- Sharing tokens = 2x tickets for current period
- Random winner receives the pot (0.621% of all transaction fees)

## Integration with Your Solana Program

To connect this frontend with your actual Solana program:

1. **Update Environment Variables**: Add your deployed program ID and token mint address to `.env.local`

2. **Implement Program Instructions**: In `lib/solana.ts`, replace mock transactions with actual program calls:
   - `buyTokens()`: Call your program's purchase instruction
   - `sellTokens()`: Call your program's sell instruction
   - `shareTokens()`: Call your program's transfer instruction

3. **Fetch On-Chain Data**: Update data fetching methods to query your program's accounts:
   - `getUserBalance()`: Read from user's token account
   - `getUserPurchaseOrders()`: Query program PDAs (Program Derived Addresses)
   - `getRaffleInfo()`: Read from global state account
   - `getTokenomics()`: Fetch from token supply and bonding curve

4. **Add Pyth Oracle Integration** (optional): For real-time SOL/USD pricing:
```typescript
import { PythHttpClient, getPythProgramKeyForCluster } from '@pythnetwork/client'
// Implement in getSolUsdPrice()
```

## Customization

### Styling

Edit `tailwind.config.ts` to customize colors and theme:
```typescript
colors: {
  'fossr-purple': '#9333ea',  // Primary purple
  'fossr-blue': '#3b82f6',    // Secondary blue
  'fossr-accent': '#f59e0b',  // Accent color
  // Add your custom colors
}
```

### Tokenomics

Adjust constants in `types/index.ts`:
```typescript
export const TOKEN_CONFIG = {
  ticker: '$FOSSR',
  totalSupply: 1_000_000_000,
  burnFeePercent: 0.069,
  raffleFeePercent: 0.621,
  // Modify as needed
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

Build the production bundle:
```bash
npm run build
npm run start
```

## Security Considerations

- Always validate user input (wallet addresses, amounts)
- Never store private keys or sensitive data
- Use secure RPC endpoints (consider paid providers like Helius, QuickNode)
- Implement rate limiting for API calls
- Add CAPTCHA for transaction-heavy operations
- Audit your Solana program before mainnet deployment

## Roadmap

- [ ] Integrate with actual Solana program
- [ ] Add price charts (Recharts/TradingView)
- [ ] Implement referral system
- [ ] Add governance features
- [ ] Mobile app (React Native)
- [ ] Multi-language support

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see LICENSE file for details

## Support

For questions or support:
- Twitter: [@fossr_token](https://twitter.com/fossr_token)
- Discord: [Join our server](https://discord.gg/fossr)
- Email: support@fossr.io

## Disclaimer

This is experimental software. Use at your own risk. Always do your own research before investing in cryptocurrency.

---

Built with ❤️ for the Solana community
# 5-tier locks deployed
