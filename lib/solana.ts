import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token'
import { PurchaseOrder, UserBalance, TokenomicsData, RaffleInfo, LOCK_TIERS, TOKEN_CONFIG, AIRDROP_INTERVALS } from '@/types'

export class FossrService {
  private connection: Connection
  private programId: PublicKey
  private tokenMint: PublicKey
  private readonly defaultProgramId = '11111111111111111111111111111111'
  // In-memory caches (client-only) to prevent UI flicker on intermittent RPC failures.
  private readonly purchaseOrdersCache = new Map<string, PurchaseOrder[]>()
  private readonly userBalanceCache = new Map<string, UserBalance>()

  constructor() {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    this.connection = new Connection(rpcUrl, 'confirmed')
    
    // Default to System Program (11111111111111111111111111111111) - a valid Solana address
    // Replace with your actual deployed program IDs in production
    this.programId = new PublicKey(process.env.NEXT_PUBLIC_FOSSR_PROGRAM_ID || '11111111111111111111111111111111')
    this.tokenMint = new PublicKey(process.env.NEXT_PUBLIC_FOSSR_TOKEN_MINT || '11111111111111111111111111111111')
  }

  private isOnChainConfigured(): boolean {
    return this.programId.toString() !== this.defaultProgramId
  }

  private readU64LE(buffer: Uint8Array, offset: number): bigint {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    return view.getBigUint64(offset, true)
  }

  private readI64LE(buffer: Uint8Array, offset: number): bigint {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    return view.getBigInt64(offset, true)
  }

  private readU32LE(buffer: Uint8Array, offset: number): number {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    return view.getUint32(offset, true)
  }

  private readonly PURCHASE_ORDER_DISCRIMINATOR = new Uint8Array([54, 162, 145, 43, 249, 114, 171, 23])
  private lastAirdropCache: { winner: string; amountTokens: number; timestampMs: number } | null = null
  private lastAirdropCacheAtMs = 0

  private u64ToBufferLE(value: bigint): Buffer {
    const b = Buffer.alloc(8)
    let v = value
    for (let i = 0; i < 8; i++) {
      b[i] = Number(v & 0xffn)
      v >>= 8n
    }
    return b
  }

  private i64ToBufferLE(value: bigint): Buffer {
    // two's complement for negative numbers (we only use positive timestamps here)
    return this.u64ToBufferLE(value & 0xffff_ffff_ffff_ffffn)
  }

  private parsePurchaseOrderAccount(accountPubkey: PublicKey, data: Uint8Array): PurchaseOrder | null {
    // Anchor discriminator (8) + PurchaseOrder:
    // buyer (32) + sol_amount (u64) + token_amount (u64) + timestamp (i64) + unlock_time (i64) + bump (u8)
    // Total: 8 + 32 + 8 + 8 + 8 + 8 + 1 = 73 bytes
    if (data.length !== 73) return null
    for (let i = 0; i < 8; i++) {
      if (data[i] !== this.PURCHASE_ORDER_DISCRIMINATOR[i]) return null
    }

    let offset = 8
    const buyer = new PublicKey(data.slice(offset, offset + 32)); offset += 32
    const solLamports = this.readU64LE(data, offset); offset += 8
    const tokenAmountBase = this.readU64LE(data, offset); offset += 8
    const timestampSec = this.readI64LE(data, offset); offset += 8
    const unlockTimeSec = this.readI64LE(data, offset); offset += 8

    const timestampMs = Number(timestampSec) * 1000
    const unlockTimeMs = Number(unlockTimeSec) * 1000
    const now = Date.now()

    return {
      id: accountPubkey.toString(),
      walletAddress: buyer.toString(),
      solAmount: Number(solLamports) / LAMPORTS_PER_SOL,
      tokenAmount: Number(tokenAmountBase) / 1_000_000_000, // 9 decimals
      timestamp: timestampMs,
      lockDuration: Math.max(0, unlockTimeMs - timestampMs),
      unlockTime: unlockTimeMs,
      isUnlocked: now >= unlockTimeMs,
      transactionSignature: '',
      isAirdropWin: false,
    }
  }

  private async getOnChainLastAirdrop(): Promise<{ winner: string; amountTokens: number; timestampMs: number } | null> {
    if (!this.isOnChainConfigured()) return null
    if (typeof window === 'undefined') return null

    // Cache for a few seconds to avoid hammering RPC
    const now = Date.now()
    if (this.lastAirdropCache && now - this.lastAirdropCacheAtMs < 10_000) {
      return this.lastAirdropCache
    }

    const [lastAirdropPda] = PublicKey.findProgramAddressSync([Buffer.from('last-airdrop')], this.programId)
    const info = await this.connection.getAccountInfo(lastAirdropPda, 'confirmed')
    if (!info?.data) return null

    const data = info.data
    // Expected: 8 discriminator + winner(32) + winner_token_account(32) + amount(u64) + timestamp(i64) + bump(u8)
    if (data.length < 89) return null

    // Discriminator check is optional; if it's wrong, parsing can produce garbage.
    // We keep it lenient in devnet to avoid breaking UI if the account isn't created yet.
    // If you want strict checking, compute/update LAST_AIRDROP_DISCRIMINATOR and validate here.
    const winner = new PublicKey(data.slice(8, 40)).toString()
    const amountBase = this.readU64LE(data, 72)
    const tsSec = this.readI64LE(data, 80)

    const parsed = {
      winner,
      amountTokens: Number(amountBase) / 1_000_000_000,
      timestampMs: Number(tsSec) * 1000,
    }

    this.lastAirdropCache = parsed
    this.lastAirdropCacheAtMs = now
    return parsed
  }

  private async getOnChainRaffleState(): Promise<{
    periodStartMs: number
    periodEndMs: number
    totalTickets: number
    totalPot: number
  } | null> {
    try {
      if (!this.isOnChainConfigured()) return null

      const [programStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('program-state')],
        this.programId
      )

      const accountInfo = await this.connection.getAccountInfo(programStatePda)
      if (!accountInfo?.data) return null

      const data = accountInfo.data
      let offset = 8 // Anchor discriminator

      // authority (32), token_mint (32)
      offset += 32
      offset += 32

      // current_price (8), total_burned (8), total_buys (8)
      offset += 8
      offset += 8
      const totalBuys = this.readU64LE(data, offset); offset += 8

      // next_airdrop_time (i64) - scheduled period end (seconds)
      let nextAirdropTime = this.readI64LE(data, offset); offset += 8

      // airdrop_amount (u64) - this is our pot amount
      const airdropAmount = this.readU64LE(data, offset); offset += 8

      // last_airdrop_cycle (i64), airdrop_executed (bool), bump (u8)
      // We don't need these for the raffle display

      // If the on-chain next_airdrop_time is already in the past (authority hasn't reset),
      // keep the UI countdown moving by aligning to the next interval client-side.
      const intervalSec = Math.max(1, Math.floor(AIRDROP_INTERVALS.bonding / 1000)) // 5 minutes
      const nowSec = Math.floor(Date.now() / 1000)
      const nextSecOnChain = Number(nextAirdropTime)
      const alignedNextSec =
        nextSecOnChain > nowSec
          ? nextSecOnChain
          : nowSec + (intervalSec - (nowSec % intervalSec || intervalSec))

      // Calculate period start (interval before end, aligned)
      const periodStartMs = (alignedNextSec - intervalSec) * 1000
      const periodEndMs = alignedNextSec * 1000

      // Airdrop pot is stored in base units (9 decimals)
      const totalPot = Number(airdropAmount) / 1_000_000_000

      // Use total buys as a simple proxy for total tickets (global activity)
      const totalTickets = Number(totalBuys)

      return {
        periodStartMs,
        periodEndMs,
        totalTickets,
        totalPot,
      }
    } catch (error) {
      console.error('Error fetching on-chain raffle state:', error)
      return null
    }
  }

  /**
   * Get SOL/USD price from Pyth Oracle or fallback
   */
  async getSolUsdPrice(): Promise<number> {
    try {
      // In production, integrate with Pyth Oracle
      // For now, return a mock price
      // const pythPriceFeed = new PublicKey(process.env.NEXT_PUBLIC_PYTH_SOL_USD_PRICE_FEED!)
      // Implement Pyth price fetching here
      return 100 // Mock price: $100 per SOL
    } catch (error) {
      console.error('Error fetching SOL/USD price:', error)
      return 100 // Fallback
    }
  }

  /**
   * Get current $FOSSR price from bonding curve or DEX
   */
  async getFossrPrice(): Promise<number> {
    try {
      // In production, fetch from Pump.fun bonding curve or Jupiter aggregator
      // For now, return mock price
      return 0.00001 // Mock: 0.00001 SOL per $FOSSR token
    } catch (error) {
      console.error('Error fetching FOSSR price:', error)
      return 0.00001
    }
  }

  /**
   * Calculate lock duration based on purchase amount
   */
  calculateLockDuration(solAmount: number): number {
    const tier = LOCK_TIERS.find(t => solAmount < t.maxSolAmount) || LOCK_TIERS[LOCK_TIERS.length - 1]
    
    // Random duration within tier range
    const minMs = tier.minLockMinutes * 60 * 1000
    const maxMs = tier.maxLockHours * 60 * 60 * 1000
    const randomDuration = minMs + Math.random() * (maxMs - minMs)
    
    return Math.floor(randomDuration)
  }

  /**
   * Fetch user's token balance (locked and unlocked)
   */
  async getUserBalance(walletAddress: PublicKey): Promise<UserBalance> {
    try {
      // On-chain mode: read SPL token balance directly, then derive locked/unlocked from orders if present.
      if (this.isOnChainConfigured()) {
        const ata = await getAssociatedTokenAddress(
          this.tokenMint,
          walletAddress,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )

        let totalTokens = 0
        try {
          const bal = await this.connection.getTokenAccountBalance(ata, 'confirmed')
          totalTokens = bal?.value?.uiAmount ?? 0
        } catch {
          // ATA might not exist yet
          totalTokens = 0
        }

        const orders = await this.getUserPurchaseOrders(walletAddress.toString())
        const unlockedFromOrders = orders.filter(o => o.isUnlocked).reduce((sum, o) => sum + o.tokenAmount, 0)
        const lockedFromOrders = orders.filter(o => !o.isUnlocked).reduce((sum, o) => sum + o.tokenAmount, 0)

        // If we couldn't fetch orders yet, treat all as unlocked for display
        const unlockedTokens = orders.length ? unlockedFromOrders : totalTokens
        const lockedTokens = orders.length ? lockedFromOrders : 0

        const price = await this.getFossrPrice()
        const solValue = totalTokens * price
        const solUsdPrice = await this.getSolUsdPrice()
        const usdValue = solValue * solUsdPrice

        const result = { totalTokens, unlockedTokens, lockedTokens, solValue, usdValue }
        this.userBalanceCache.set(walletAddress.toString(), result)
        return result
      }

      const orders = await this.getUserPurchaseOrders(walletAddress.toString())
      const unlockedTokens = orders
        .filter(o => o.isUnlocked)
        .reduce((sum, o) => sum + o.tokenAmount, 0)
      
      const lockedTokens = orders
        .filter(o => !o.isUnlocked)
        .reduce((sum, o) => sum + o.tokenAmount, 0)
      
      const totalTokens = unlockedTokens + lockedTokens
      const price = await this.getFossrPrice()
      const solValue = totalTokens * price
      const solUsdPrice = await this.getSolUsdPrice()
      const usdValue = solValue * solUsdPrice

      return {
        totalTokens,
        unlockedTokens,
        lockedTokens,
        solValue,
        usdValue,
      }
    } catch (error) {
      console.error('Error fetching user balance:', error)
      const cached = this.userBalanceCache.get(walletAddress.toString())
      if (cached) return cached
      return { totalTokens: 0, unlockedTokens: 0, lockedTokens: 0, solValue: 0, usdValue: 0 }
    }
  }

  /**
   * Fetch user's purchase orders from program
   */
  async getUserPurchaseOrders(walletAddress: string): Promise<PurchaseOrder[]> {
    try {
      if (typeof window === 'undefined') return []

      // On-chain mode: fetch PurchaseOrder accounts for this buyer.
      if (this.isOnChainConfigured()) {
        // Filter server-side:
        // - dataSize 73: PurchaseOrder accounts only
        // - memcmp at offset 8: buyer Pubkey (after discriminator)
        const programAccounts = await this.connection.getProgramAccounts(this.programId, {
          commitment: 'confirmed',
          filters: [
            { dataSize: 73 },
            { memcmp: { offset: 8, bytes: walletAddress } },
          ],
        })

        const orders = programAccounts
          .map(({ pubkey, account }) => this.parsePurchaseOrderAccount(pubkey, account.data))
          .filter((o): o is PurchaseOrder => Boolean(o))

        // If this wallet is the most recent airdrop winner, append a synthetic "Airdrop Win" row.
        // (The airdrop mints directly to the ATA; it doesn't create a PurchaseOrder account.)
        try {
          const last = await this.getOnChainLastAirdrop()
          if (last?.winner === walletAddress) {
            const already = orders.some(o => o.isAirdropWin && Math.abs(o.timestamp - last.timestampMs) < 5_000)
            if (!already) {
              orders.push({
                id: `airdrop_${last.timestampMs}`,
                walletAddress,
                solAmount: 0,
                tokenAmount: last.amountTokens,
                timestamp: last.timestampMs,
                lockDuration: 0,
                unlockTime: last.timestampMs,
                isUnlocked: true,
                transactionSignature: '',
                isAirdropWin: true,
              })
            }
          }
        } catch {
          // ignore airdrop parsing errors; orders still work
        }

        this.purchaseOrdersCache.set(walletAddress, orders)
        return orders
      }

      // Demo/local mode: localStorage
      const stored = localStorage.getItem(`fossr_orders_${walletAddress}`)
      if (!stored) return []

      const orders: PurchaseOrder[] = JSON.parse(stored)
      const now = Date.now()

      return orders.map(order => ({
        ...order,
        isUnlocked: now >= order.unlockTime,
      }))
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
      const cached = this.purchaseOrdersCache.get(walletAddress)
      if (cached) return cached
      // In on-chain mode, throw so callers can choose to keep existing UI state.
      if (this.isOnChainConfigured()) throw error
      return []
    }
  }

  /**
   * Get or initialize global raffle state
   */
  private getGlobalRaffleState(): { periodEnd: number; periodStart: number; totalTickets: number; totalPot: number } {
    if (typeof window === 'undefined') {
      return { periodEnd: Date.now() + AIRDROP_INTERVALS.bonding, periodStart: Date.now(), totalTickets: 0, totalPot: 0 }
    }
    
    const stored = localStorage.getItem('fossr_global_raffle')
    if (!stored) {
      // Initialize first period
      const now = Date.now()
      const state = {
        periodEnd: now + AIRDROP_INTERVALS.bonding,
        periodStart: now,
        totalTickets: 0,
        totalPot: 0,
      }
      localStorage.setItem('fossr_global_raffle', JSON.stringify(state))
      return state
    }
    
    const state = JSON.parse(stored)
    const now = Date.now()
    
    // Check if period has ended
    if (now >= state.periodEnd) {
      // Run raffle and start new period
      this.executeRaffle(state.periodStart, state.periodEnd, state.totalPot || 0)
      
      const newState = {
        periodEnd: now + AIRDROP_INTERVALS.bonding,
        periodStart: now,
        totalTickets: 0,
        totalPot: 0,
      }
      localStorage.setItem('fossr_global_raffle', JSON.stringify(newState))
      return newState
    }
    
    return state
  }
  
  /**
   * Execute raffle and award winner
   */
  private executeRaffle(periodStart: number, periodEnd: number, potAmount: number): void {
    if (typeof window === 'undefined') return
    
    // Get all purchase orders in this period from all users
    const allOrders: PurchaseOrder[] = []
    
    // In demo, we only have current user's orders
    // In production, this would query all orders from the blockchain
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('fossr_orders_')) {
        const orders = JSON.parse(localStorage.getItem(key) || '[]')
        allOrders.push(...orders.filter((o: PurchaseOrder) => 
          o.timestamp >= periodStart && o.timestamp < periodEnd && !o.isAirdropWin
        ))
      }
    }
    
    if (allOrders.length === 0 || potAmount === 0) return
    
    // Pick random winner
    const winnerIndex = Math.floor(Math.random() * allOrders.length)
    const winnerOrder = allOrders[winnerIndex]
    
    // Create airdrop win order
    const airdropOrder: PurchaseOrder = {
      id: `airdrop_${Date.now()}_${Math.random()}`,
      walletAddress: winnerOrder.walletAddress,
      solAmount: 0,
      tokenAmount: potAmount,
      timestamp: Date.now(),
      lockDuration: 0,
      unlockTime: Date.now(),
      isUnlocked: true,
      transactionSignature: 'airdrop_win_' + Date.now(),
      isAirdropWin: true,
    }
    
    // Add to winner's orders
    const winnerKey = `fossr_orders_${winnerOrder.walletAddress}`
    const winnerOrders = JSON.parse(localStorage.getItem(winnerKey) || '[]')
    winnerOrders.push(airdropOrder)
    localStorage.setItem(winnerKey, JSON.stringify(winnerOrders))
  }

  /**
   * Get raffle information for current period
   */
  async getRaffleInfo(walletAddress?: PublicKey): Promise<RaffleInfo> {
    try {
      // Prefer on-chain raffle state if configured
      const onChainState = await this.getOnChainRaffleState()
      const globalState = onChainState
        ? {
            periodStart: onChainState.periodStartMs,
            periodEnd: onChainState.periodEndMs,
            totalTickets: onChainState.totalTickets,
            totalPot: onChainState.totalPot,
          }
        : this.getGlobalRaffleState()
      
      const phaseType: RaffleInfo['phaseType'] = 'bonding' // Mock
      const nextAirdropInterval = AIRDROP_INTERVALS[phaseType]
      
      // Calculate user tickets (number of purchases in current period)
      let userTickets = 0
      if (walletAddress) {
        const orders = await this.getUserPurchaseOrders(walletAddress.toString())
        // Filter by current raffle period
        const currentPeriodOrders = orders.filter(o => 
          o.timestamp >= globalState.periodStart && o.timestamp < globalState.periodEnd && !o.isAirdropWin
        )
        userTickets = currentPeriodOrders.length
        
        // Check for share bonus (stored in localStorage for demo)
        const shareBonus = localStorage.getItem(`fossr_share_${walletAddress.toString()}`)
        const shareBonusTime = shareBonus ? parseInt(shareBonus) : 0
        // Only apply bonus if share was in current period
        if (shareBonusTime >= globalState.periodStart && shareBonusTime < globalState.periodEnd) {
          userTickets *= TOKEN_CONFIG.shareBonus
        }
      }
      
      // Calculate total tickets in current period
      let totalTickets = 0
      if (onChainState) {
        totalTickets = onChainState.totalTickets
      } else if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith('fossr_orders_')) {
            const orders = JSON.parse(localStorage.getItem(key) || '[]')
            totalTickets += orders.filter((o: PurchaseOrder) => 
              o.timestamp >= globalState.periodStart && o.timestamp < globalState.periodEnd && !o.isAirdropWin
            ).length
          }
        }
      }
      
      // Get pot from global state
      const totalPot = globalState.totalPot || 0
      
      return {
        currentPeriodEnd: globalState.periodEnd,
        userTickets,
        totalTickets,
        totalPot,
        phaseType,
        nextAirdropInterval,
      }
    } catch (error) {
      console.error('Error fetching raffle info:', error)
      return {
        currentPeriodEnd: Date.now() + AIRDROP_INTERVALS.bonding,
        userTickets: 0,
        totalTickets: 0,
        totalPot: 0,
        phaseType: 'bonding',
        nextAirdropInterval: AIRDROP_INTERVALS.bonding,
      }
    }
  }

  /**
   * Get tokenomics data
   */
  async getTokenomics(): Promise<TokenomicsData> {
    try {
      const price = await this.getFossrPrice()
      const solUsdPrice = await this.getSolUsdPrice()
      
      // In production, fetch burned tokens from program
      const burnedTokens = 0 // Mock
      const circulatingSupply = TOKEN_CONFIG.totalSupply - burnedTokens
      const marketCap = circulatingSupply * price * solUsdPrice
      
      return {
        totalSupply: TOKEN_CONFIG.totalSupply,
        circulatingSupply,
        burnedTokens,
        marketCap,
        currentPrice: price,
        solUsdPrice,
      }
    } catch (error) {
      console.error('Error fetching tokenomics:', error)
      return {
        totalSupply: TOKEN_CONFIG.totalSupply,
        circulatingSupply: TOKEN_CONFIG.totalSupply,
        burnedTokens: 0,
        marketCap: 0,
        currentPrice: 0,
        solUsdPrice: 0,
      }
    }
  }

  /**
   * Calculate how many tokens user will receive for a SOL amount
   */
  async calculateTokensForSol(solAmount: number): Promise<number> {
    const price = await this.getFossrPrice()
    const tokensBeforeFees = solAmount / price
    
    // Apply fees (0.69% total)
    const tokensAfterFees = tokensBeforeFees * (1 - TOKEN_CONFIG.totalFeePercent / 100)
    
    return Math.floor(tokensAfterFees)
  }

  /**
   * Buy tokens with SOL
   */
  async buyTokens(
    walletAddress: PublicKey,
    solAmount: number,
    sendTransaction: (tx: Transaction, connection: Connection, options?: any) => Promise<string>
  ): Promise<string> {
    try {
      // If on-chain is configured, execute real program instruction so all testers see synced state.
      if (this.isOnChainConfigured()) {
        const lamports = BigInt(Math.round(solAmount * LAMPORTS_PER_SOL))
        const timestamp = BigInt(Date.now()) // used for PDA seed only

        const [programStatePda] = PublicKey.findProgramAddressSync(
          [Buffer.from('program-state')],
          this.programId
        )
        const [programVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('vault')],
          this.programId
        )

        const buyerTokenAccount = await getAssociatedTokenAddress(
          this.tokenMint,
          walletAddress,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )

        const timestampLe = this.i64ToBufferLE(timestamp)
        const [purchaseOrderPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('order'), walletAddress.toBuffer(), timestampLe],
          this.programId
        )

        // Anchor discriminator for "global:buy_tokens"
        const BUY_TOKENS_DISCRIMINATOR = Buffer.from([189, 21, 230, 133, 247, 2, 110, 42])

        const data = Buffer.concat([
          BUY_TOKENS_DISCRIMINATOR,
          this.u64ToBufferLE(lamports),
          this.i64ToBufferLE(timestamp),
        ])

        const slotHashesSysvar = new PublicKey('SysvarS1otHashes111111111111111111111111111')

        const ix = new TransactionInstruction({
          programId: this.programId,
          keys: [
            { pubkey: programStatePda, isSigner: false, isWritable: true },
            { pubkey: this.tokenMint, isSigner: false, isWritable: true },
            { pubkey: walletAddress, isSigner: true, isWritable: true },
            { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
            { pubkey: purchaseOrderPda, isSigner: false, isWritable: true },
            { pubkey: programVaultPda, isSigner: false, isWritable: true },
            { pubkey: slotHashesSysvar, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          data,
        })

        const tx = new Transaction().add(ix)
        // Let wallet-adapter handle blockhash/fee payer & send (prevents "blockhash invalid" issues)
        console.log('[FOSSR] Sending buy transaction...')
        const sig = await sendTransaction(tx, this.connection, { preflightCommitment: 'confirmed' })
        console.log('[FOSSR] Transaction sent:', sig)
        
        // Wait for confirmation with a reasonable timeout
        // If it times out, the tx might still succeed - don't block the UI forever
        try {
          const confirmPromise = this.connection.confirmTransaction(sig, 'confirmed')
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Confirmation timeout')), 45000)
          )
          await Promise.race([confirmPromise, timeoutPromise])
          console.log('[FOSSR] Transaction confirmed!')
        } catch (confirmError: any) {
          // Log but don't throw - the tx might have succeeded even if confirmation timed out
          console.warn('[FOSSR] Confirmation issue:', confirmError.message)
          // Check if tx actually succeeded by looking at signature status
          const status = await this.connection.getSignatureStatus(sig)
          if (status?.value?.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
          }
          // If no error, treat as potentially successful
          console.log('[FOSSR] Transaction status:', status?.value?.confirmationStatus || 'unknown')
        }
        
        return sig
      }

      // Fallback demo-mode (local only)
      const tokenAmount = await this.calculateTokensForSol(solAmount)
      const lockDuration = this.calculateLockDuration(solAmount)
      const now = Date.now()

      const order: PurchaseOrder = {
        id: `order_${now}_${Math.random()}`,
        walletAddress: walletAddress.toString(),
        solAmount,
        tokenAmount,
        timestamp: now,
        lockDuration,
        unlockTime: now + lockDuration,
        isUnlocked: false,
        transactionSignature: 'mock_signature_' + now,
        isAirdropWin: false,
      }

      const existing = await this.getUserPurchaseOrders(walletAddress.toString())
      existing.push(order)
      localStorage.setItem(`fossr_orders_${walletAddress.toString()}`, JSON.stringify(existing))

      const raffleFeeTokens = Math.floor(tokenAmount * (TOKEN_CONFIG.raffleFeePercent / 100))
      const globalState = this.getGlobalRaffleState()
      globalState.totalTickets += 1
      globalState.totalPot = (globalState.totalPot || 0) + raffleFeeTokens
      localStorage.setItem('fossr_global_raffle', JSON.stringify(globalState))

      return order.transactionSignature
    } catch (error) {
      console.error('Error buying tokens:', error)
      throw error
    }
  }

  /**
   * Sell unlocked tokens
   */
  async sellTokens(
    walletAddress: PublicKey,
    percentage: number,
    signTransaction: (tx: Transaction) => Promise<Transaction>
  ): Promise<string> {
    try {
      const balance = await this.getUserBalance(walletAddress)
      
      if (balance.unlockedTokens === 0) {
        throw new Error('No unlocked tokens to sell')
      }
      
      const tokensToSell = Math.floor(balance.unlockedTokens * (percentage / 100))
      
      // In production, create transaction to swap tokens for SOL via bonding curve
      const transaction = new Transaction()
      // transaction.add(programInstruction)
      
      // For demo, remove from localStorage
      const orders = await this.getUserPurchaseOrders(walletAddress.toString())
      let remaining = tokensToSell
      
      const updatedOrders = orders.filter(order => {
        if (remaining > 0 && order.isUnlocked) {
          if (order.tokenAmount <= remaining) {
            remaining -= order.tokenAmount
            return false // Remove this order
          } else {
            order.tokenAmount -= remaining
            remaining = 0
          }
        }
        return true
      })
      
      localStorage.setItem(`fossr_orders_${walletAddress.toString()}`, JSON.stringify(updatedOrders))
      
      return 'mock_sell_signature_' + Date.now()
    } catch (error) {
      console.error('Error selling tokens:', error)
      throw error
    }
  }

  /**
   * Share tokens with another wallet (grants 2x raffle tickets)
   */
  async shareTokens(
    walletAddress: PublicKey,
    recipientAddress: string,
    signTransaction: (tx: Transaction) => Promise<Transaction>
  ): Promise<string> {
    try {
      const shareValueSol = TOKEN_CONFIG.shareAmount
      const balance = await this.getUserBalance(walletAddress)
      const price = await this.getFossrPrice()
      const shareValueTokens = shareValueSol / price
      
      if (balance.unlockedTokens < shareValueTokens) {
        throw new Error('Insufficient unlocked tokens to share')
      }
      
      // In production, create transaction to transfer tokens
      const transaction = new Transaction()
      // transaction.add(transferInstruction)
      
      // Grant 2x raffle tickets to sender
      localStorage.setItem(`fossr_share_${walletAddress.toString()}`, Date.now().toString())
      
      return 'mock_share_signature_' + Date.now()
    } catch (error) {
      console.error('Error sharing tokens:', error)
      throw error
    }
  }
}

// Singleton instance
export const fossrService = new FossrService()
