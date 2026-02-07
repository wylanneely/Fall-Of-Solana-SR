#!/bin/bash

# 🚀 One-Click Devnet Deploy Script
# Run: chmod +x deploy-devnet.sh && ./deploy-devnet.sh

set -e

echo "🚀 FOSSR DEVNET DEPLOYMENT SCRIPT"
echo "=================================="
echo ""

# Check Solana CLI
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Install it first:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Check Anchor CLI
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Install it first:"
    echo "   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    echo "   avm install latest && avm use latest"
    exit 1
fi

echo "✅ Solana CLI found: $(solana --version)"
echo "✅ Anchor CLI found: $(anchor --version)"
echo ""

# Set to devnet
echo "🔧 Configuring Solana CLI for devnet..."
solana config set --url https://api.devnet.solana.com
echo ""

# Check balance
BALANCE=$(solana balance | grep -oE '[0-9]+\.[0-9]+' | head -1)
echo "💰 Current balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo "⚠️  Low balance. Requesting airdrop..."
    solana airdrop 2 || echo "Airdrop failed (rate limit?). Try manually: solana airdrop 2"
    sleep 2
fi
echo ""

# Build Anchor program
echo "🔨 Building Anchor program..."
cd anchor-program
anchor build
echo ""

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/fossr-keypair.json)
echo "📍 Program ID: $PROGRAM_ID"
echo ""

# Deploy
echo "🚀 Deploying to devnet..."
anchor deploy --provider.cluster devnet
echo ""

echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📝 Next steps:"
echo "1. Create token mint: spl-token create-token --decimals 9"
echo "2. Run initialize script: cd anchor-program && ts-node scripts/deploy-init.ts"
echo "3. Update .env.local with program ID and token mint"
echo "4. Deploy frontend: vercel --prod"
echo ""
echo "🎉 Your contract is live on devnet!"
