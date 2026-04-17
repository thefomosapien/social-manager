export type Platform = 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'facebook'
export type PostStatus = 'draft' | 'approved' | 'published' | 'skipped'
export type PostSource = 'routine' | 'debate' | 'manual'

export interface Brand {
  id: string
  name: string
  slug: string
  color_primary: string | null
  voice_prompt: string | null
  created_at: string
}

export interface Account {
  id: string
  brand_id: string
  platform: Platform
  handle: string | null
  access_token: string | null
  token_secret: string | null
  created_at: string
}

export interface Post {
  id: string
  brand_id: string
  account_id: string | null
  platform: Platform
  copy: string
  status: PostStatus
  source: PostSource
  debate_ref: string | null
  image_url: string | null
  scheduled_at: string | null
  published_at: string | null
  created_at: string
}

export interface RoutineRun {
  id: string
  brand_id: string
  triggered_at: string
  posts_generated: number | null
  status: string | null
}

export interface BrandStats {
  queue: number
  approved: number
  published: number
}
