#!/bin/bash

# 🌐 One-Click Vercel Deploy Script
# Run: chmod +x deploy-vercel.sh && ./deploy-vercel.sh

set -e

echo "🌐 FOSSR VERCEL DEPLOYMENT SCRIPT"
echo "=================================="
echo ""

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Vercel CLI found: $(vercel --version)"
echo ""

# Check if logged in
echo "🔐 Checking Vercel login..."
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
fi
echo ""

# Deploy preview first
echo "🚀 Deploying preview..."
vercel
echo ""

# Ask if ready for production
read -p "Deploy to production now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to production..."
    vercel --prod
    echo ""
    echo "✅ PRODUCTION DEPLOYMENT COMPLETE!"
else
    echo "Preview deployed. Run 'vercel --prod' when ready."
fi

echo ""
echo "📝 IMPORTANT: Set environment variables in Vercel dashboard:"
echo "   https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
echo ""
echo "Add these variables:"
echo "   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com"
echo "   NEXT_PUBLIC_SOLANA_NETWORK=devnet"
echo "   NEXT_PUBLIC_FOSSR_PROGRAM_ID=<your_program_id>"
echo "   NEXT_PUBLIC_FOSSR_TOKEN_MINT=<your_token_mint>"
echo "   NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED=J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"
echo ""
echo "After adding env vars, redeploy: vercel --prod"
echo ""
echo "🎉 Your site is live!"
