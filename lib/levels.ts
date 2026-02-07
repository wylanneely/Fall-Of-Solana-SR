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
      tier1: '10m - 100m',
      tier2: '9m - 90m',
      tier3: '8m - 80m',
      tier4: '7m - 70m',
    },
  },
  {
    id: 2,
    name: 'Chained Shark',
    emoji: '🦈',
    pointsRequired: 50_000,
    lockTiers: {
      tier1: '6m - 60m',
      tier2: '5m - 50m',
      tier3: '4m - 40m',
      tier4: '3m - 30m',
    },
  },
  {
    id: 3,
    name: 'Ghost Whale',
    emoji: '🐋',
    pointsRequired: 500_000,
    lockTiers: {
      tier1: '2m - 20m',
      tier2: '1m - 10m',
      tier3: '50s - 5m',
      tier4: '40s - 4m',
    },
  },
  {
    id: 4,
    name: 'Reserve Phantom',
    emoji: '🔥',
    pointsRequired: 2_500_000,
    lockTiers: {
      tier1: '30s - 3m',
      tier2: '20s - 2m',
      tier3: '10s - 1m',
      tier4: '5s - 30s',
    },
  },
  {
    id: 5,
    name: 'Unchained Titan',
    emoji: '⚡',
    pointsRequired: 10_000_000,
    lockTiers: {
      tier1: 'instant',
      tier2: 'instant',
      tier3: 'instant',
      tier4: 'instant',
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
  if (solAmount <= 0.01) return level.lockTiers.tier1
  if (solAmount <= 0.1) return level.lockTiers.tier2
  if (solAmount <= 1.0) return level.lockTiers.tier3
  return level.lockTiers.tier4
}
