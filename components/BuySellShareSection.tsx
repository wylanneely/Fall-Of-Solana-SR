'use client'

import { useState } from 'react'
import { PublicKey, Transaction, Connection } from '@solana/web3.js'
import toast from 'react-hot-toast'
import { UserBalance, TokenomicsData } from '@/types'
import { UserLevel } from '@/lib/levels'
import { fossrService } from '@/lib/solana'
import { formatTokenAmount, formatSol, isValidSolanaAddress, getLockTierInfo } from '@/lib/utils'
import LoadingSpinner from './LoadingSpinner'
import LevelBenefitsPreview from './LevelBenefitsPreview'

interface BuySellShareSectionProps {
  publicKey: PublicKey | null
  sendTransaction: ((transaction: Transaction, connection: Connection, options?: any) => Promise<string>) | undefined
  userBalance: UserBalance | null
  tokenomics: TokenomicsData | null
  userLevel: UserLevel | null
  onTransactionComplete: () => void
}

export default function BuySellShareSection({
  publicKey,
  sendTransaction,
  userBalance,
  tokenomics,
  userLevel,
  onTransactionComplete,
}: BuySellShareSectionProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'share'>('buy')
  const [customAmount, setCustomAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewTokens, setPreviewTokens] = useState(0)

  const quickBuyAmounts = [0.01, 0.1, 1, 10]
  const sellPercentages = [25, 50, 100]
  
  // Calculate share amount in tokens dynamically
  const shareAmountSol = 0.01 // TOKEN_CONFIG.shareAmount
  const shareAmountTokens = tokenomics?.currentPrice 
    ? Math.floor(shareAmountSol / tokenomics.currentPrice)
    : 1000 // fallback to 1000 if price not loaded yet

  const handleBuy = async (solAmount: number) => {
    if (!publicKey || !sendTransaction) {
      toast.error('Please connect your wallet')
      return
    }

    setLoading(true)
    toast.dismiss()
    const loadingToast = toast.loading(`Buying ${solAmount} SOL worth of $FOSSR...`, { id: 'tx-toast' })

    try {
      const signature = await fossrService.buyTokens(publicKey, solAmount, sendTransaction)
      
      toast.success(
        `Successfully purchased! Tokens are locked based on buy size. Tx: ${signature.slice(0, 8)}...`,
        { id: loadingToast, duration: 3000 }
      )
      
      setCustomAmount('')
      onTransactionComplete()
    } catch (error: any) {
      toast.error(error.message || 'Purchase failed', { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  const handleSell = async (percentage: number) => {
    if (!publicKey || !sendTransaction) {
      toast.error('Please connect your wallet')
      return
    }

    if (!userBalance || userBalance.unlockedTokens === 0) {
      toast.error('No unlocked tokens available to sell')
      return
    }

    setLoading(true)
    toast.dismiss()
    const loadingToast = toast.loading(`Selling ${percentage}% of unlocked tokens...`, { id: 'tx-toast' })

    try {
      const signature = await fossrService.sellTokens(publicKey, percentage, sendTransaction as any)
      
      toast.success(
        `Successfully sold ${percentage}% of unlocked tokens! Tx: ${signature.slice(0, 8)}...`,
        { id: loadingToast, duration: 3000 }
      )
      
      onTransactionComplete()
    } catch (error: any) {
      toast.error(error.message || 'Sale failed', { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!publicKey || !sendTransaction) {
      toast.error('Please connect your wallet')
      return
    }

    if (!recipientAddress || !isValidSolanaAddress(recipientAddress)) {
      toast.error('Please enter a valid recipient address')
      return
    }

    setLoading(true)
    toast.dismiss()
    const loadingToast = toast.loading('Sharing 0.01 SOL worth of $FOSSR...', { id: 'tx-toast' })

    try {
      const signature = await fossrService.shareTokens(publicKey, recipientAddress, sendTransaction as any)
      
      toast.success(
        `Shared successfully! You now have 2x raffle tickets! Tx: ${signature.slice(0, 8)}...`,
        { id: loadingToast, duration: 3000 }
      )
      
      setRecipientAddress('')
      onTransactionComplete()
    } catch (error: any) {
      toast.error(error.message || 'Share failed', { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  const updatePreview = async (amount: string) => {
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) {
      setPreviewTokens(0)
      return
    }
    
    const tokens = await fossrService.calculateTokensForSol(num)
    setPreviewTokens(tokens)
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    if (activeTab === 'buy') {
      updatePreview(value)
    }
  }

  return (
    <div className="bg-fossr-dark-secondary rounded-xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-6">Buy, Sell & Share</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {(['buy', 'sell', 'share'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'text-fossr-purple border-b-2 border-fossr-purple'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Buy Tab */}
      {activeTab === 'buy' && (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Quick Buy</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full overflow-x-auto pb-2">
              {quickBuyAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleBuy(amount)}
                  disabled={loading}
                  className="bg-fossr-purple hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold transition-all hover:scale-105 active:scale-95"
                >
                  {amount} SOL
                  <div className="text-xs text-gray-200 mt-1">Lock: {getLockTierInfo(amount)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Custom Amount (SOL)</label>
            <div className="flex gap-3">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Enter SOL amount"
                min="0"
                step="0.01"
                disabled={loading}
                className="flex-1 bg-fossr-dark border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-fossr-purple focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => handleBuy(parseFloat(customAmount))}
                disabled={loading || !customAmount || parseFloat(customAmount) <= 0}
                className="bg-fossr-blue hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-bold transition-all"
              >
                {loading ? <LoadingSpinner size="small" /> : 'Buy'}
              </button>
            </div>
          </div>

          {previewTokens > 0 && (
            <div className="bg-fossr-dark rounded-lg p-4 border border-fossr-purple/50">
              <p className="text-sm text-gray-400 mb-1">You'll receive (after 0.69% fees):</p>
              <p className="text-2xl font-bold text-fossr-accent">
                {formatTokenAmount(previewTokens)} $FOSSR
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Price: {formatSol(tokenomics?.currentPrice || 0)} SOL per token
              </p>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-400 bg-fossr-dark/50 rounded-lg p-4">
            <p className="font-semibold mb-2">⏱️ Lock Tiers:</p>
            <ul className="space-y-1 text-xs">
              <li>• &lt; 0.1 SOL: 5 minutes to 5 hours</li>
              <li>• &lt; 0.5 SOL: 4 minutes to 4 hours</li>
              <li>• &lt; 1.0 SOL: 3 minutes to 3 hours</li>
              <li>• ≤ 10.0 SOL: 1 minute to 1 hour</li>
            </ul>
            <p className="mt-2 text-xs">🔒 Short randomized locks are proven to prevent rug pulls.</p>
          </div>

          {/* Level Benefits Preview */}
          <LevelBenefitsPreview userLevel={userLevel} />
        </div>
      )}

      {/* Sell Tab */}
      {activeTab === 'sell' && (
        <div>
          <div className="mb-6 bg-fossr-dark rounded-lg p-4 border border-gray-600">
            <p className="text-sm text-gray-400 mb-1">Unlocked tokens available:</p>
            <p className="text-3xl font-bold text-white">
              {formatTokenAmount(userBalance?.unlockedTokens || 0)} $FOSSR
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ≈ {formatSol(userBalance?.solValue || 0)} SOL
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-3">Sell Percentage</label>
            <div className="grid grid-cols-3 gap-3">
              {sellPercentages.map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handleSell(percentage)}
                  disabled={loading || !userBalance || userBalance.unlockedTokens === 0}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold transition-all hover:scale-105 active:scale-95"
                >
                  {percentage}%
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-400 bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
            <p className="font-semibold mb-1">⚠️ Important:</p>
            <p className="text-xs">You can only sell unlocked tokens. Locked tokens must wait for their lock period to expire.</p>
          </div>
        </div>
      )}

      {/* Share Tab */}
      {activeTab === 'share' && (
        <div>
          <div className="mb-6 bg-gradient-to-r from-fossr-purple/20 to-fossr-blue/20 rounded-lg p-6 border border-fossr-purple/50">
            <p className="text-2xl font-bold mb-2">Share $FOSSR 🎁</p>
            <p className="text-gray-300 text-sm">
              Send tokens to a friend and help grow the community!
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recipient Wallet Address
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Enter Solana wallet address..."
              disabled={loading}
              className="w-full bg-fossr-dark border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-fossr-purple focus:outline-none disabled:opacity-50 font-mono text-sm"
            />
          </div>

          <button
            onClick={handleShare}
            disabled={loading || !recipientAddress || !isValidSolanaAddress(recipientAddress)}
            className="w-full bg-gradient-to-r from-fossr-purple to-fossr-blue hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95"
          >
            {loading ? <LoadingSpinner size="small" /> : `🎁 Share ${formatSol(shareAmountSol)} SOL worth (${formatTokenAmount(shareAmountTokens)} $FOSSR)`}
          </button>

          <div className="mt-4 text-sm text-gray-400 bg-fossr-dark/50 rounded-lg p-4">
            <p className="text-xs text-center">
              Sharing helps grow the $FOSSR community. The recipient will receive tokens directly to their wallet.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
