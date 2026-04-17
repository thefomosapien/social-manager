'use client'

import { BrandStats } from '@/types'
import { Clock, CheckCircle, Send } from 'lucide-react'

interface StatsRowProps {
  stats: BrandStats
  brandColor: string
}

export default function StatsRow({ stats, brandColor }: StatsRowProps) {
  const items = [
    { label: 'In Queue', value: stats.queue, icon: <Clock className="w-4 h-4" />, desc: 'Drafts awaiting review' },
    { label: 'Approved', value: stats.approved, icon: <CheckCircle className="w-4 h-4" />, desc: 'Ready to publish' },
    { label: 'Published', value: stats.published, icon: <Send className="w-4 h-4" />, desc: 'Live posts' },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 shadow-sm"
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: brandColor + '18', color: brandColor }}
          >
            {item.icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none mb-0.5">{item.value}</p>
            <p className="text-xs text-gray-500 font-medium">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
