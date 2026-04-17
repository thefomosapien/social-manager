import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const ALLOWED_PLATFORMS = ['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'x', 'threads'] as const
const ALLOWED_STATUSES = ['draft', 'approved', 'published', 'skipped'] as const
const ALLOWED_SOURCES = ['routine', 'debate', 'manual'] as const

function authenticate(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  return token === process.env.ROUTINE_SECRET
}

export async function POST(request: NextRequest) {
  if (!authenticate(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { brand_id, platform, copy, status, source } = body as Record<string, unknown>

  if (!brand_id || typeof brand_id !== 'string') {
    return Response.json({ error: 'brand_id is required' }, { status: 422 })
  }
  if (!platform || !ALLOWED_PLATFORMS.includes(platform as typeof ALLOWED_PLATFORMS[number])) {
    return Response.json(
      { error: `platform must be one of: ${ALLOWED_PLATFORMS.join(', ')}` },
      { status: 422 }
    )
  }
  if (!copy || typeof copy !== 'string' || copy.trim() === '') {
    return Response.json({ error: 'copy is required' }, { status: 422 })
  }
  if (status !== undefined && !ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number])) {
    return Response.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 422 }
    )
  }
  if (source !== undefined && !ALLOWED_SOURCES.includes(source as typeof ALLOWED_SOURCES[number])) {
    return Response.json(
      { error: `source must be one of: ${ALLOWED_SOURCES.join(', ')}` },
      { status: 422 }
    )
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('posts')
    .insert({
      brand_id,
      platform,
      copy: copy.trim(),
      ...(status !== undefined && { status }),
      ...(source !== undefined && { source }),
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ post: data }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const brand_id = params.get('brand_id')
  const status = params.get('status')

  if (status && !ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number])) {
    return Response.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 422 }
    )
  }

  const supabase = createServiceClient()
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (brand_id) query = query.eq('brand_id', brand_id)
  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ posts: data })
}
