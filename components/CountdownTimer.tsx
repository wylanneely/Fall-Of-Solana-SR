'use client'

import { useEffect, useState } from 'react'
import { RaffleInfo } from '@/types'
import { formatCountdown } from '@/lib/utils'

interface CountdownTimerProps {
  raffleInfo: RaffleInfo | null
  eligibleForAirdrop: boolean
}

export default function CountdownTimer({ raffleInfo, eligibleForAirdrop }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0)

  useEffect(() => {
    // Calculate time until next :00 or :05 minute (local time)
    const updateTimer = () => {
      const now = new Date()
      const currentMinutes = now.getMinutes()
      const currentSeconds = now.getSeconds()
      
      // Calculate which "bucket" we're in (0-4, 5-9, 10-14, etc)
      const currentBucket = Math.floor(currentMinutes / 5)
      // Next target is the start of the next bucket
      let targetMinute = (currentBucket + 1) * 5
      
      // Handle hour rollover
      if (targetMinute >= 60) {
        targetMinute = 0
      }
      
      // Calculate time difference
      let minutesUntilTarget = targetMinute - currentMinutes
      if (minutesUntilTarget < 0) {
        minutesUntilTarget += 60
      }
      
      // Total seconds until target (accounting for current seconds)
      const secondsUntilTarget = (minutesUntilTarget * 60) - currentSeconds
      setTimeRemaining(Math.max(0, secondsUntilTarget * 1000)) // Convert to ms, never negative
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [])

  const getPhaseDescription = () => {
    if (!raffleInfo) return 'Airdrops every 5 minutes (at :00 and :05)'
    
    switch (raffleInfo.phaseType) {
      case 'bonding':
        return 'Airdrops every 5 minutes (at :00 and :05) during bonding phase'
      case 'post-bonding-69h':
        return 'Airdrops every 5 minutes for 69 hours post-bonding'
      case 'steady-state':
        return 'Airdrops every 4 hours 20 minutes'
      default:
        return 'Airdrops every 5 minutes (at :00 and :05)'
    }
  }

  return (
    <div className="bg-gradient-to-br from-fossr-purple/20 to-fossr-blue/20 rounded-xl p-8 border border-fossr-purple/50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-fossr-purple/10 to-fossr-blue/10 animate-pulse-slow"></div>
      
      <div className="relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2 text-white">Next Airdrop Countdown</h2>
          <p className="text-gray-300 text-sm">{getPhaseDescription()}</p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-fossr-dark rounded-2xl px-12 py-8 border-2 border-fossr-purple shadow-lg shadow-fossr-purple/20">
            <div className="text-6xl font-mono font-bold bg-gradient-to-r from-fossr-purple to-fossr-blue bg-clip-text text-transparent">
              {formatCountdown(timeRemaining)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-fossr-dark/50 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-gray-400 text-sm mb-1">Next Airdrop Amount</p>
            <p className="text-2xl font-bold text-fossr-accent">
              {raffleInfo ? raffleInfo.totalPot.toLocaleString() : '---'} $FOSSR
            </p>
          </div>
          
          <div className="bg-fossr-dark/50 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-gray-400 text-sm mb-1">Eligible for Next Airdrop</p>
            <p className={`text-2xl font-bold ${eligibleForAirdrop ? 'text-green-400' : 'text-red-400'}`}>
              {eligibleForAirdrop ? 'Yes' : 'No'}
            </p>
          </div>
          
          <div className="bg-fossr-dark/50 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-gray-400 text-sm mb-1">Phase</p>
            <p className="text-2xl font-bold text-blue-400 capitalize">
              {raffleInfo ? raffleInfo.phaseType.replace('-', ' ') : 'Bonding'}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            💡 Users are eligible after holding 10,000+ $FOSSR tokens
          </p>
        </div>
      </div>
    </div>
  )
}
