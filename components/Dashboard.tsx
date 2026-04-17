'use client'

import { useState } from 'react'
import { Brand } from '@/types'
import Sidebar from './Sidebar'
import PostQueue from './PostQueue'

interface DashboardProps {
  brands: Brand[]
}

export default function Dashboard({ brands }: DashboardProps) {
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null)
  const activeBrand = brands.find((b) => b.id === activeBrandId) ?? null

  return (
    <div className="flex min-h-screen">
      <Sidebar
        brands={brands}
        activeBrandId={activeBrandId}
        onSelectBrand={setActiveBrandId}
      />
      <PostQueue brand={activeBrand} allBrands={brands} />
    </div>
  )
}
