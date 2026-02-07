'use client'

import { UserLevel } from '@/lib/levels'
import { formatPoints } from '@/lib/levels'

interface LevelBadgeProps {
  userLevel: UserLevel | null
  loading?: boolean
}

export default function LevelBadge({ userLevel, loading }: LevelBadgeProps) {
  if (loading) {
    return (
      <div className="bg-fossr-dark-secondary rounded-xl p-6 border border-gray-700 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-32"></div>
      </div>
    )
  }

  if (!userLevel) {
    return (
      <div className="bg-fossr-dark-secondary rounded-xl p-6 border border-gray-700 text-center">
        <p className="text-gray-400">Connect wallet to see your level</p>
      </div>
    )
  }

  const { currentLevel, nextLevel, points, progress } = userLevel

  return (
    <div className="bg-gradient-to-br from-fossr-purple/20 to-fossr-blue/20 rounded-xl p-6 border border-fossr-purple/50 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-fossr-purple/10 to-fossr-blue/10 animate-pulse-slow"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{currentLevel.emoji}</span>
            <div>
              <h3 className="text-2xl font-bold text-white">
                Level {currentLevel.id}: {currentLevel.name}
              </h3>
              <p className="text-sm text-gray-300">
                {formatPoints(points)} points
              </p>
            </div>
          </div>
        </div>

        {nextLevel ? (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-300">
                Progress to <strong className="text-fossr-accent">{nextLevel.name}</strong>
              </p>
              <p className="text-sm text-fossr-accent font-semibold">
                {formatPoints(points)} / {formatPoints(nextLevel.pointsRequired)}
              </p>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-fossr-dark rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-fossr-purple to-fossr-blue h-full transition-all duration-500 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 mt-2">
              {formatPoints(nextLevel.pointsRequired - points)} more points needed
            </p>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <p className="text-fossr-accent font-bold text-lg">
              🏆 MAX LEVEL ACHIEVED 🏆
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-600">
          <p className="text-xs text-gray-400">
            💡 <strong>Tip:</strong> Points are based off your currently unlocked $FOSSR.
          </p>
        </div>
      </div>
    </div>
  )
}
