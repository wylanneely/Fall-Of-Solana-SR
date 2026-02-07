import { PublicKey } from '@solana/web3.js'

export interface Level {
  id: number
  name: string
  emoji: string
  pointsRequired: number
  lockTiers: {
    tier1: string // < 0.1 SOL
    tier2: string // < 0.5 SOL
    tier3: string // < 1.0 SOL
    tier4: string // ≤ 10.0 SOL
  }
}

export interface UserLevel {
  currentLevel: Level
  nextLevel: Level | null
  points: number
  progress: number // 0-100 percentage to next level
  daysHeld: number
  firstPurchaseTime: number | null
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Invisible Guppy',
    emoji: '🐟',
    pointsRequired: 0,
    lockTiers: {
      tier1: '5m - 5h',
      tier2: '4m - 4h',
      tier3: '3m - 3h',
      tier4: '1m - 1h',
    },
  },
  {
    id: 2,
    name: 'Chained Shark',
    emoji: '🦈',
    pointsRequired: 50_000,
    lockTiers: {
      tier1: '5m - 4.5h',
      tier2: '4m - 3.6h',
      tier3: '3m - 2.7h',
      tier4: '1m - 54m',
    },
  },
  {
    id: 3,
    name: 'Ghost Whale',
    emoji: '🐋',
    pointsRequired: 500_000,
    lockTiers: {
      tier1: '50s - 50m',
      tier2: '40s - 40m',
      tier3: '30s - 30m',
      tier4: '10s - 10m',
    },
  },
  {
    id: 4,
    name: 'Reserve Phantom',
    emoji: '🔥',
    pointsRequired: 2_500_000,
    lockTiers: {
      tier1: '50s - 5m',
      tier2: '40s - 4m',
      tier3: '30s - 3m',
      tier4: '10s - 1m',
    },
  },
]

export function getLevelFromPoints(points: number): Level {
  // Find the highest level the user qualifies for
  let currentLevel = LEVELS[0]
  
  for (const level of LEVELS) {
    if (points >= level.pointsRequired) {
      currentLevel = level
    } else {
      break
    }
  }
  
  return currentLevel
}

export function getNextLevel(currentLevel: Level): Level | null {
  const currentIndex = LEVELS.findIndex(l => l.id === currentLevel.id)
  if (currentIndex === -1 || currentIndex === LEVELS.length - 1) {
    return null // Already at max level
  }
  return LEVELS[currentIndex + 1]
}

export function calculateProgress(points: number, currentLevel: Level, nextLevel: Level | null): number {
  if (!nextLevel) return 100 // Max level
  
  const pointsIntoCurrentLevel = points - currentLevel.pointsRequired
  const pointsNeededForNext = nextLevel.pointsRequired - currentLevel.pointsRequired
  
  return Math.min(100, Math.floor((pointsIntoCurrentLevel / pointsNeededForNext) * 100))
}

export function formatPoints(points: number): string {
  if (points >= 1_000_000) {
    return `${(points / 1_000_000).toFixed(1)}M`
  }
  if (points >= 1_000) {
    return `${(points / 1_000).toFixed(1)}K`
  }
  return points.toFixed(0)
}

export function getLockTierForAmount(level: Level, solAmount: number): string {
  if (solAmount < 0.1) return level.lockTiers.tier1
  if (solAmount < 0.5) return level.lockTiers.tier2
  if (solAmount < 1.0) return level.lockTiers.tier3
  return level.lockTiers.tier4
}
