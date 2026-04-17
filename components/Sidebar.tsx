'use client'

import { Brand } from '@/types'
import { Zap, BookOpen, FlaskConical, LayoutDashboard } from 'lucide-react'

const BRAND_ICONS: Record<string, React.ReactNode> = {
  duhbate: <Zap className="w-4 h-4" />,
  historia: <BookOpen className="w-4 h-4" />,
  'peptides-101': <FlaskConical className="w-4 h-4" />,
}

interface SidebarProps {
  brands: Brand[]
  activeBrandId: string | null
  onSelectBrand: (id: string | null) => void
}

export default function Sidebar({ brands, activeBrandId, onSelectBrand }: SidebarProps) {
  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ background: '#1A0A2E' }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#6B46C1' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Duhbate</p>
            <p className="text-white/40 text-xs leading-tight">Social</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        {/* All Brands */}
        <button
          onClick={() => onSelectBrand(null)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all ${
            activeBrandId === null
              ? 'bg-white/10 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          All Brands
        </button>

        <div className="mt-4 mb-2 px-3">
          <p className="text-white/30 text-xs uppercase tracking-wider font-semibold">Brands</p>
        </div>

        {brands.map((brand) => {
          const isActive = activeBrandId === brand.id
          const color = brand.color_primary || '#6B46C1'
          return (
            <button
              key={brand.id}
              onClick={() => onSelectBrand(brand.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: isActive ? color : color + '40' }}
              >
                <span style={{ color: isActive ? 'white' : color }}>
                  {BRAND_ICONS[brand.slug] ?? <Zap className="w-4 h-4" />}
                </span>
              </div>
              <span className="truncate">{brand.name}</span>
              {isActive && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-white/20 text-xs">Duhbate Social v1.0</p>
      </div>
    </aside>
  )
}
