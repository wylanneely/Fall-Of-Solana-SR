'use client'

interface StatsCardProps {
  title: string
  value: string
  subtitle: string
  icon: string
  tooltip?: string
}

export default function StatsCard({ title, value, subtitle, icon, tooltip }: StatsCardProps) {
  return (
    <div 
      className="bg-fossr-dark-secondary rounded-xl p-6 border border-gray-700 hover:border-fossr-purple transition-all duration-300 group"
      title={tooltip}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </span>
      </div>
      
      <div className="mb-2">
        <p className="text-3xl font-bold text-white group-hover:text-fossr-purple transition-colors">
          {value}
        </p>
      </div>
      
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  )
}
