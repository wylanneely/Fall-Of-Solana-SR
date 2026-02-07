'use client'

import { useEffect, useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { UserLevel, getLevelFromPoints, getNextLevel, calculateProgress, LEVELS } from '@/lib/levels'
import { fossrService } from '@/lib/solana'

export function useUserLevel(tokenMintAddress?: string) {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserLevel = useCallback(async () => {
    if (!publicKey || !connection) return

    setLoading(true)
    setError(null)

    try {
      // Get unlocked token balance from on-chain SPL token account
      // This balance only includes tokens that have been unlocked (from purchases or airdrops)
      const userBalance = await fossrService.getUserBalance(publicKey)
      const balance = userBalance.totalTokens
      
      // Simple points calculation: Points = Unlocked Token Balance
      // No time-based multipliers - only updates when tokens are unlocked
      const points = Math.floor(balance)
      
      console.log('[FOSSR Level] Unlocked Balance:', balance, 'Points:', points)
      
      // Determine level
      const currentLevel = getLevelFromPoints(points)
      const nextLevel = getNextLevel(currentLevel)
      const progress = calculateProgress(points, currentLevel, nextLevel)
      
      setUserLevel({
        currentLevel,
        nextLevel,
        points,
        progress,
        daysHeld: 0, // No longer tracking time
        firstPurchaseTime: null, // No longer tracking time
      })
    } catch (err: any) {
      console.error('Error fetching user level:', err)
      setError(err.message || 'Failed to fetch level data')
      
      // On error, keep existing level data to prevent flickering
      // Only set fallback on first load if no data exists
      setUserLevel(prev => prev || {
        currentLevel: LEVELS[0],
        nextLevel: LEVELS[1],
        points: 0,
        progress: 0,
        daysHeld: 0,
        firstPurchaseTime: null,
      })
    } finally {
      setLoading(false)
    }
  }, [publicKey, connection])

  useEffect(() => {
    if (!connected || !publicKey) {
      setUserLevel(null)
      return
    }

    // Fetch once on mount/wallet change
    // Level only updates when unlocked tokens are added (purchase unlocks, airdrops)
    // Parent components trigger refetch via the returned refetch function
    fetchUserLevel()
  }, [connected, publicKey, fetchUserLevel])

  return { userLevel, loading, error, refetch: fetchUserLevel }
}
