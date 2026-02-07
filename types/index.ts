import { PublicKey } from '@solana/web3.js'

export interface PurchaseOrder {
  id: string
  walletAddress: string
  solAmount: number
  tokenAmount: number
  timestamp: number
  lockDuration: number // in milliseconds
  unlockTime: number // timestamp when tokens unlock
  isUnlocked: boolean
  transactionSignature: string
  isAirdropWin?: boolean // true if this order won an airdrop
}

export interface UserBalance {
  totalTokens: number
  unlockedTokens: number
  lockedTokens: number
  solValue: number
  usdValue: number
}

export interface RaffleInfo {
  currentPeriodEnd: number // timestamp
  userTickets: number
  totalTickets: number // total tickets in current raffle cycle
  totalPot: number // in tokens
  phaseType: 'bonding' | 'post-bonding-69h' | 'steady-state'
  nextAirdropInterval: number // in milliseconds
}

export interface TokenomicsData {
  totalSupply: number
  circulatingSupply: number
  burnedTokens: number
  marketCap: number
  currentPrice: number // in SOL
  solUsdPrice: number
}

export interface TransactionParams {
  type: 'buy' | 'sell' | 'share'
  amount: number
  recipient?: string
  percentage?: number
}

export interface LockTier {
  maxSolAmount: number
  minLockMinutes: number
  maxLockHours: number
}

export const LOCK_TIERS: LockTier[] = [
  { maxSolAmount: 0.01, minLockMinutes: 10, maxLockHours: 1.67 }, // 10min - 100min = 1.67 hours
  { maxSolAmount: 0.1, minLockMinutes: 9, maxLockHours: 1.5 },   // 9min - 90min = 1.5 hours
  { maxSolAmount: 1.0, minLockMinutes: 8, maxLockHours: 1.33 },  // 8min - 80min = 1.33 hours
  { maxSolAmount: 10.0, minLockMinutes: 7, maxLockHours: 1.17 }, // 7min - 70min = 1.17 hours
]

export const TOKEN_CONFIG = {
  ticker: '$FOSSR',
  totalSupply: 1_000_000_000,
  burnFeePercent: 0.069,
  raffleFeePercent: 0.621,
  totalFeePercent: 0.69,
  shareBonus: 2, // 2x raffle tickets
  shareAmount: 0.01, // SOL
} as const

export const AIRDROP_INTERVALS = {
  bonding: 300_000, // 5 minutes in milliseconds (simplified from 4:20)
  postBonding69h: 300_000, // 5 minutes for 69 hours
  steadyState: 15_600_000, // 4h20m in milliseconds
  postBondingDuration: 69 * 60 * 60 * 1000, // 69 hours in ms
} as const
