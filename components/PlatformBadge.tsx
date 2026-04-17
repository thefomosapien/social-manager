import { Platform } from '@/types'

const PLATFORM_CONFIG: Record<Platform, { label: string; bg: string; text: string }> = {
  twitter: { label: 'X / Twitter', bg: '#e7f0fd', text: '#1d4ed8' },
  instagram: { label: 'Instagram', bg: '#fce7f3', text: '#9d174d' },
  linkedin: { label: 'LinkedIn', bg: '#e0f2fe', text: '#0369a1' },
  tiktok: { label: 'TikTok', bg: '#f0fdf4', text: '#15803d' },
  facebook: { label: 'Facebook', bg: '#eff6ff', text: '#1d4ed8' },
}

export default function PlatformBadge({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform] ?? { label: platform, bg: '#f3f4f6', text: '#374151' }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  )
}
