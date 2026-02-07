'use client'

import { UserLevel } from '@/lib/levels'
import { getLockTierForAmount } from '@/lib/levels'

interface LevelBenefitsPreviewProps {
  userLevel: UserLevel | null
  solAmount?: number
}

export default function LevelBenefitsPreview({ userLevel, solAmount = 0.1 }: LevelBenefitsPreviewProps) {
  if (!userLevel) return null

  const { currentLevel, nextLevel } = userLevel
  const currentTierLock = getLockTierForAmount(currentLevel, solAmount)
  const nextTierLock = nextLevel ? getLockTierForAmount(nextLevel, solAmount) : null

  return (
    <div className="bg-gradient-to-r from-fossr-purple/10 to-fossr-blue/10 rounded-lg p-4 border border-fossr-purple/30 mt-4">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{currentLevel.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white mb-1">
            Your Level Benefits ({currentLevel.name})
          </p>
          
          <div className="text-xs text-gray-300 mb-2">
            <p className="mb-1">
              <strong>Current Lock Times Preview:</strong>
            </p>
            <ul className="space-y-1 ml-4">
              <li>• &lt; 0.1 SOL: <span className="text-fossr-accent">{currentLevel.lockTiers.tier1}</span></li>
              <li>• &lt; 0.5 SOL: <span className="text-fossr-accent">{currentLevel.lockTiers.tier2}</span></li>
              <li>• &lt; 1.0 SOL: <span className="text-fossr-accent">{currentLevel.lockTiers.tier3}</span></li>
              <li>• ≤ 10.0 SOL: <span className="text-fossr-accent">{currentLevel.lockTiers.tier4}</span></li>
            </ul>
          </div>

          {nextLevel && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <p className="text-xs text-fossr-blue font-semibold mb-1">
                🚀 Next Level ({nextLevel.name}):
              </p>
              <p className="text-xs text-gray-400">
                Unlock even faster! Max lock times will be reduced. Keep holding to level up!
              </p>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-600">
            <p className="text-xs text-gray-500 italic">
              ⚠️ V1 Preview Only: Actual on-chain locks remain as base tiers for security. Level-based reductions coming in V2!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
