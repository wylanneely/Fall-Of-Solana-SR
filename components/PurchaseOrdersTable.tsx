'use client'

import { useState, useEffect } from 'react'
import { PurchaseOrder } from '@/types'
import { formatSol, formatTokenAmount, formatTimeRemaining, shortenAddress } from '@/lib/utils'

interface PurchaseOrdersTableProps {
  orders: PurchaseOrder[]
}

export default function PurchaseOrdersTable({ orders }: PurchaseOrdersTableProps) {
  const [timeNow, setTimeNow] = useState(Date.now())

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeNow(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (orders.length === 0) {
    return (
      <div className="bg-fossr-dark-secondary rounded-xl p-8 border border-gray-700 text-center">
        <p className="text-gray-400 mb-2">No purchase orders yet</p>
        <p className="text-sm text-gray-500">Buy some $FOSSR to get started!</p>
      </div>
    )
  }

  // Sort by most recent first
  const sortedOrders = [...orders].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="bg-fossr-dark-secondary rounded-xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-6">Your Purchase Orders</h2>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Time Until Unlock</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">SOL Amount</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">$FOSSR Received</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Transaction</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Date</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.map((order) => {
              const timeRemaining = order.unlockTime - timeNow
              const isUnlocked = timeRemaining <= 0
              const isAirdrop = order.isAirdropWin === true

              return (
                <tr 
                  key={order.id} 
                  className={`border-b border-gray-800 hover:bg-fossr-dark/50 transition-colors ${
                    isAirdrop ? 'bg-gradient-to-r from-fossr-accent/10 to-transparent' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        isAirdrop
                          ? 'bg-fossr-accent/30 text-fossr-accent border border-fossr-accent'
                          : isUnlocked
                          ? 'bg-green-900/30 text-green-400 border border-green-700'
                          : 'bg-orange-900/30 text-orange-400 border border-orange-700'
                      }`}
                    >
                      {isAirdrop ? '🎉 Airdrop Win' : isUnlocked ? '✓ Unlocked' : '🔒 Locked'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {isAirdrop ? (
                      <span className="text-fossr-accent font-semibold">Won Raffle!</span>
                    ) : isUnlocked ? (
                      <span className="text-green-400 font-semibold">Ready!</span>
                    ) : (
                      <span className="text-orange-400 font-mono">
                        {formatTimeRemaining(timeRemaining)}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold">
                    {isAirdrop ? (
                      <span className="text-fossr-accent">Airdrop</span>
                    ) : (
                      `${formatSol(order.solAmount)} SOL`
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-fossr-accent">
                    {formatTokenAmount(order.tokenAmount)}
                  </td>
                  <td className="py-4 px-4">
                    {order.transactionSignature ? (
                      <a
                        href={`https://solscan.io/tx/${order.transactionSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-fossr-blue hover:text-blue-400 font-mono text-sm hover:underline"
                      >
                        {shortenAddress(order.transactionSignature, 6)}
                      </a>
                    ) : (
                      <a
                        href={`https://solscan.io/account/${order.id}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-fossr-blue hover:text-blue-400 font-mono text-sm hover:underline"
                      >
                        {shortenAddress(order.id, 6)}
                      </a>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-400">
                    {new Date(order.timestamp).toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedOrders.map((order) => {
          const timeRemaining = order.unlockTime - timeNow
          const isUnlocked = timeRemaining <= 0
          const isAirdrop = order.isAirdropWin === true

          return (
            <div
              key={order.id}
              className={`bg-fossr-dark rounded-lg p-4 border ${
                isAirdrop ? 'border-fossr-accent bg-gradient-to-br from-fossr-accent/10 to-transparent' : 'border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    isAirdrop
                      ? 'bg-fossr-accent/30 text-fossr-accent border border-fossr-accent'
                      : isUnlocked
                      ? 'bg-green-900/30 text-green-400 border border-green-700'
                      : 'bg-orange-900/30 text-orange-400 border border-orange-700'
                  }`}
                >
                  {isAirdrop ? '🎉 Airdrop Win' : isUnlocked ? '✓ Unlocked' : '🔒 Locked'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(order.timestamp).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">SOL Amount</p>
                  <p className="font-semibold">
                    {isAirdrop ? (
                      <span className="text-fossr-accent">Airdrop</span>
                    ) : (
                      `${formatSol(order.solAmount)} SOL`
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">$FOSSR Received</p>
                  <p className="font-bold text-fossr-accent">{formatTokenAmount(order.tokenAmount)}</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1">Time Until Unlock</p>
                {isAirdrop ? (
                  <p className="text-fossr-accent font-semibold">Won Raffle!</p>
                ) : isUnlocked ? (
                  <p className="text-green-400 font-semibold">Ready!</p>
                ) : (
                  <p className="text-orange-400 font-mono">{formatTimeRemaining(timeRemaining)}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Transaction</p>
                <a
                  href={`https://solscan.io/tx/${order.transactionSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fossr-blue hover:text-blue-400 font-mono text-xs hover:underline break-all"
                >
                  {order.transactionSignature}
                </a>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 text-center text-sm text-gray-400">
        <p>Total Orders: {orders.length} • Unlocked: {orders.filter(o => o.isUnlocked).length} • Locked: {orders.filter(o => !o.isUnlocked).length}</p>
      </div>
    </div>
  )
}
