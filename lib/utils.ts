/**
 * Format number with commas
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format token amount (handles large numbers)
 */
export function formatTokenAmount(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)}B`
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(2)}K`
  }
  return formatNumber(amount, 0)
}

/**
 * Format SOL amount
 */
export function formatSol(amount: number): string {
  if (amount < 0.001) {
    return amount.toFixed(6)
  }
  if (amount < 1) {
    return amount.toFixed(4)
  }
  return amount.toFixed(2)
}

/**
 * Format USD amount
 */
export function formatUsd(amount: number): string {
  return `$${formatNumber(amount, 2)}`
}

/**
 * Format time remaining (milliseconds to human-readable)
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '0s'
  
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

/**
 * Format countdown timer (HH:MM:SS or MM:SS)
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00'
  
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
  }
  
  return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}

/**
 * Shorten wallet address
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy:', error)
    return false
  }
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Basic validation: 32-44 characters, base58
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    return base58Regex.test(address)
  } catch {
    return false
  }
}

/**
 * Get lock tier info for display
 */
export function getLockTierInfo(solAmount: number): string {
  if (solAmount < 0.1) return '5m - 5h'
  if (solAmount < 0.5) return '4m - 4h'
  if (solAmount < 1.0) return '3m - 3h'
  if (solAmount <= 10.0) return '1m - 1h'
  return '1m - 1h'
}
