'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey } from '@solana/web3.js'
import toast from 'react-hot-toast'

import { fossrService } from '@/lib/solana'
import { UserBalance, TokenomicsData, RaffleInfo, PurchaseOrder } from '@/types'
import { formatNumber, formatTokenAmount, formatSol, formatUsd, formatCountdown, formatTimeRemaining } from '@/lib/utils'
import { useUserLevel } from '@/hooks/useUserLevel'

import StatsCard from '@/components/StatsCard'
import CountdownTimer from '@/components/CountdownTimer'
import BuySellShareSection from '@/components/BuySellShareSection'
import PurchaseOrdersTable from '@/components/PurchaseOrdersTable'
import LoadingSpinner from '@/components/LoadingSpinner'
import LevelBadge from '@/components/LevelBadge'
import AirdropWinModal from '@/components/AirdropWinModal'

export default function DashboardPage() {
  // SSR protection - only render wallet-dependent content on client
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading during SSR
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[80vh]">
            <LoadingSpinner />
          </div>
        </div>
      </main>
    )
  }

  return <DashboardContent />
}

function DashboardContent() {
  const { publicKey, sendTransaction, connected } = useWallet()
  
  // State
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null)
  const [tokenomics, setTokenomics] = useState<TokenomicsData | null>(null)
  const [raffleInfo, setRaffleInfo] = useState<RaffleInfo | null>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Level system
  const { userLevel, loading: levelLoading, refetch: refetchLevel } = useUserLevel()

  // Fetch data when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchAllData()
    } else {
      resetData()
    }
  }, [connected, publicKey, refreshTrigger])

  // No auto-refresh - data updates only when:
  // 1. Wallet connects/changes
  // 2. User completes a transaction
  // 3. User manually clicks refresh
  // This dramatically reduces RPC calls and prevents rate limiting

  const fetchAllData = async (silent: boolean = false) => {
    if (!publicKey) return
    
    if (!silent) setLoading(true)
    
    try {
      const results = await Promise.allSettled([
        fossrService.getUserBalance(publicKey),
        fossrService.getTokenomics(),
        fossrService.getRaffleInfo(publicKey),
        fossrService.getUserPurchaseOrders(publicKey.toString()),
      ])

      const [balanceRes, tokenomicsRes, raffleRes, ordersRes] = results

      if (balanceRes.status === 'fulfilled') setUserBalance(balanceRes.value)
      if (tokenomicsRes.status === 'fulfilled') setTokenomics(tokenomicsRes.value)
      if (raffleRes.status === 'fulfilled') setRaffleInfo(raffleRes.value)
      if (ordersRes.status === 'fulfilled') setPurchaseOrders(ordersRes.value)
    } catch (error) {
      console.error('Error fetching data:', error)
      // Don't clear existing data on error - keep showing what we had
      if (!silent) {
        toast.error('Failed to fetch data. Please try again.')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const resetData = () => {
    setUserBalance(null)
    setTokenomics(null)
    setRaffleInfo(null)
    setPurchaseOrders([])
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
    refetchLevel() // Also refresh level
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-fossr-purple to-fossr-blue bg-clip-text text-transparent">
            $FOSSR
          </h1>
          <p className="text-xl text-gray-300 mb-2">Fall of Solana Strategic Reserve</p>
          <p className="text-sm text-gray-400 mb-4">
            The gamified, rug-resistant token.
          </p>
          <p className="text-xs text-gray-500 mb-8">
            Suggestions? Contact <a href="https://x.com/ColdsideCrypto" target="_blank" rel="noopener noreferrer" className="text-fossr-purple hover:underline">@ColdsideCrypto</a> on X, <a href="https://instagram.com/DonWylan" target="_blank" rel="noopener noreferrer" className="text-fossr-purple hover:underline">@DonWylan</a> on Instagram, or join our <a href="https://t.me/fossr" target="_blank" rel="noopener noreferrer" className="text-fossr-purple hover:underline">Telegram</a>
          </p>
          
          {/* Video Preview */}
          <div className="mb-6 rounded-xl overflow-hidden border border-gray-700">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full max-w-sm mx-auto"
            >
              <source src="/fossr-video.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="bg-fossr-dark-secondary rounded-xl p-6 mb-8 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Key Features</h2>
            <ul className="text-left space-y-2 text-sm text-gray-300">
              <li>✓ 100% fair launch, 0% team tokens</li>
              <li>✓ Protective tiered locks to prevent rug pulls</li>
              <li>✓ 0.069% burn on every transaction</li>
              <li>✓ Airdrops every 5 minutes during bonding stage</li>
            </ul>
          </div>
          
          <WalletMultiButton className="!bg-fossr-purple hover:!bg-purple-700 transition-all" />
        </div>
      </div>
    )
  }

  if (loading && !userBalance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <img 
            src="/fossr-logo.png" 
            alt="FOSSR Logo" 
            className="w-16 h-16 rounded-full object-cover ring-2 ring-fossr-purple/50"
          />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-fossr-purple to-fossr-blue bg-clip-text text-transparent">
              $FOSSR Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">Fall of Solana Strategic Reserve</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-fossr-dark-secondary hover:bg-gray-700 rounded-lg transition-all border border-gray-600"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <WalletMultiButton className="!bg-fossr-purple hover:!bg-purple-700" />
        </div>
      </header>

      {/* Network Warning Banner */}
      {process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' && (
        <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4 mb-6">
          <p className="text-orange-200 text-sm font-semibold">
            🧪 <strong>DEVNET MODE</strong>: You are on Solana Devnet.
            Set your wallet network to <strong>Devnet</strong> to use the app. No real funds are at risk.
          </p>
          <p className="text-orange-200/80 text-xs mt-2 font-mono break-all">
            Program: {process.env.NEXT_PUBLIC_FOSSR_PROGRAM_ID} • Mint: {process.env.NEXT_PUBLIC_FOSSR_TOKEN_MINT}
          </p>
        </div>
      )}



      {/* Level Badge Section - First on mobile */}
      <div className="mb-8 order-first lg:order-none">
        <LevelBadge userLevel={userLevel} loading={levelLoading} />
      </div>

      {/* Top Stats Grid - 3 cards only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="Unlocked $FOSSR"
          value={formatTokenAmount(userBalance?.unlockedTokens || 0)}
          subtitle={`${formatSol(userBalance?.solValue || 0)} SOL • ${formatUsd(userBalance?.usdValue || 0)}`}
          icon="💰"
          tooltip="Tokens available for selling or sharing"
        />
        
        <StatsCard
          title="Total Balance"
          value={formatTokenAmount(userBalance?.totalTokens || 0)}
          subtitle={`${formatTokenAmount(userBalance?.lockedTokens || 0)} locked`}
          icon="🏦"
          tooltip="Total tokens (locked + unlocked)"
        />
        
        <StatsCard
          title="Market Cap"
          value={formatUsd(tokenomics?.marketCap || 0)}
          subtitle={`Price: ${formatSol(tokenomics?.currentPrice || 0)} SOL`}
          icon="📊"
          tooltip="Current market capitalization"
        />
      </div>

      {/* Countdown Timer Section */}
      <div className="mb-8">
        <CountdownTimer
          raffleInfo={raffleInfo}
          eligibleForAirdrop={Boolean(
            (userBalance?.totalTokens || 0) >= 10_000 // 10,000 tokens minimum for airdrop eligibility
          )}
        />
      </div>

      {/* Buy/Sell/Share Section */}
      <div className="mb-8">
        <BuySellShareSection
          publicKey={publicKey}
          sendTransaction={sendTransaction}
          userBalance={userBalance}
          tokenomics={tokenomics}
          userLevel={userLevel}
          onTransactionComplete={handleRefresh}
        />
      </div>

      {/* Purchase Orders Table */}
      <div>
        <PurchaseOrdersTable orders={purchaseOrders} />
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-400">
        <p className="mb-2">
          Tokenomics: {formatTokenAmount(tokenomics?.totalSupply || 0)} total supply • 
          {formatTokenAmount(tokenomics?.burnedTokens || 0)} burned • 
          0.69% total tax (0.069% burn + 0.621% raffle)
        </p>
        <p>
          Built on Solana • Fair Launch on Pump.fun • 0% Team Tokens
        </p>
      </div>
    </div>
  )
}
