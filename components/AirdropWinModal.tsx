'use client'

import { useState, useEffect } from 'react'
import Confetti from 'react-confetti'
import { PurchaseOrder } from '@/types'
import { formatTokenAmount } from '@/lib/utils'

interface AirdropWinModalProps {
  orders: PurchaseOrder[]
  onClose: () => void
}

export default function AirdropWinModal({ orders, onClose }: AirdropWinModalProps) {
  const [showConfetti, setShowConfetti] = useState(true)
  const [hasSeen, setHasSeen] = useState(false)

  useEffect(() => {
    // Check if user has already seen this win (session-based)
    const seenWins = sessionStorage.getItem('fossr-airdrop-seen')
    if (seenWins) {
      const seen = JSON.parse(seenWins)
      const recentWin = orders.find(o => o.isAirdropWin && Date.now() - o.timestamp < 24 * 60 * 60 * 1000) // 24h
      if (recentWin && seen.includes(recentWin.timestamp)) {
        setHasSeen(true)
        return
      }
    }

    // Show modal if recent airdrop win
    const recentWin = orders.find(o => o.isAirdropWin && Date.now() - o.timestamp < 24 * 60 * 60 * 1000)
    if (recentWin) {
      // Mark as seen
      const seen = seenWins ? JSON.parse(seenWins) : []
      seen.push(recentWin.timestamp)
      sessionStorage.setItem('fossr-airdrop-seen', JSON.stringify(seen))
    } else {
      setHasSeen(true)
    }
  }, [orders])

  if (hasSeen) return null

  const recentWin = orders.find(o => o.isAirdropWin)

  if (!recentWin) return null

  const handleClose = () => {
    setShowConfetti(false)
    setTimeout(onClose, 500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {showConfetti && <Confetti />}
      
      <div className="bg-gradient-to-br from-fossr-purple to-fossr-blue rounded-2xl p-8 max-w-md w-full mx-4 text-center border-4 border-white/20 shadow-2xl animate-bounce">
        <div className="mb-6">
          <div className="text-8xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-white mb-2">YOU WON THE AIRDROP!</h2>
          <p className="text-xl text-fossr-accent mb-4">
            {formatTokenAmount(recentWin.tokenAmount)} $FOSSR
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-lg text-white">Your tokens are unlocked and ready!</p>
          <p className="text-sm text-gray-300">Timestamp: {new Date(recentWin.timestamp).toLocaleString()}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-white font-bold transition-all"
          >
            Close
          </button>
          <button
            onClick={() => {
              navigator.share({
                title: 'I won $FOSSR airdrop!',
                text: `Just won ${formatTokenAmount(recentWin.tokenAmount)} $FOSSR in the raffle! Join the action:`,
                url: window.location.origin,
              })
              handleClose()
            }}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 rounded-lg text-black font-bold transition-all"
          >
            Share Win
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Powered by the $FOSSR raffle system
        </p>
      </div>
    </div>
  )
}
