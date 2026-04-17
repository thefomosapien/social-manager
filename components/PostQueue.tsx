'use client'

import { useState, useEffect, useCallback } from 'react'
import { Post, PostStatus, Brand, BrandStats } from '@/types'
import PostCard from './PostCard'
import StatsRow from './StatsRow'
import { Inbox, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const FILTER_OPTIONS: { value: PostStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'skipped', label: 'Skipped' },
]

interface PostQueueProps {
  brand: Brand | null
  allBrands: Brand[]
}

export default function PostQueue({ brand, allBrands }: PostQueueProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<BrandStats>({ queue: 0, approved: 0, published: 0 })
  const [filter, setFilter] = useState<PostStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (brand) {
      query = query.eq('brand_id', brand.id)
    }

    const { data } = await query
    const allPosts = (data as Post[]) ?? []
    setPosts(allPosts)
    setStats({
      queue: allPosts.filter((p) => p.status === 'draft').length,
      approved: allPosts.filter((p) => p.status === 'approved').length,
      published: allPosts.filter((p) => p.status === 'published').length,
    })
    setLoading(false)
  }, [brand?.id])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  async function handleStatusChange(postId: string, status: PostStatus) {
    const update: Partial<Post> = { status }
    if (status === 'published') update.published_at = new Date().toISOString()

    await supabase.from('posts').update(update).eq('id', postId)
    await fetchPosts()
  }

  async function handleEditSave(postId: string, copy: string) {
    await supabase.from('posts').update({ copy }).eq('id', postId)
    await fetchPosts()
  }

  const brandColor = brand?.color_primary ?? '#6B46C1'

  const filteredPosts =
    filter === 'all' ? posts : posts.filter((p) => p.status === filter)

  const getBrandColor = (brandId: string) => {
    const b = allBrands.find((br) => br.id === brandId)
    return b?.color_primary ?? '#6B46C1'
  }

  const getBrandName = (brandId: string) => {
    const b = allBrands.find((br) => br.id === brandId)
    return b?.name ?? ''
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50/60">
      {/* Header */}
      <div className="px-8 pt-8 pb-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {brand ? brand.name : 'All Brands'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {brand ? brand.voice_prompt ?? 'Post approval queue' : 'Manage posts across all brands'}
          </p>
        </div>

        <StatsRow
          stats={stats}
          brandColor={brandColor}
        />

        {/* Filter tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 -mb-px">
          {FILTER_OPTIONS.map((opt) => {
            const count =
              opt.value === 'all'
                ? posts.length
                : posts.filter((p) => p.status === opt.value).length
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  filter === opt.value
                    ? 'border-current text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                style={filter === opt.value ? { borderColor: brandColor, color: brandColor } : {}}
              >
                {opt.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    filter === opt.value ? 'text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                  style={filter === opt.value ? { background: brandColor } : {}}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Post grid */}
      <div className="flex-1 px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: brandColor }} />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Inbox className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-sm font-medium">No posts in this view</p>
            <p className="text-xs mt-1">Posts will appear here once generated</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post) => (
              <div key={post.id}>
                {!brand && (
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: getBrandColor(post.brand_id) }}
                    />
                    <span className="text-xs font-semibold text-gray-500">
                      {getBrandName(post.brand_id)}
                    </span>
                  </div>
                )}
                <PostCard
                  post={post}
                  brandColor={brand ? brandColor : getBrandColor(post.brand_id)}
                  onStatusChange={handleStatusChange}
                  onEditSave={handleEditSave}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
