import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const ALLOWED_PLATFORMS = ['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'x', 'threads'] as const
const ALLOWED_STATUSES = ['draft', 'approved', 'published', 'skipped'] as const
const ALLOWED_SOURCES = ['routine', 'debate', 'manual'] as const

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const token = params.get('token')
  if (!token || token !== process.env.ROUTINE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const brand_id = params.get('brand_id')
  const platform = params.get('platform')
  const copy = params.get('copy')
  const status = params.get('status') ?? 'draft'
  const source = params.get('source') ?? 'routine'

  if (!brand_id) {
    return Response.json({ error: 'brand_id is required' }, { status: 422 })
  }
  if (!platform || !ALLOWED_PLATFORMS.includes(platform as typeof ALLOWED_PLATFORMS[number])) {
    return Response.json(
      { error: `platform must be one of: ${ALLOWED_PLATFORMS.join(', ')}` },
      { status: 422 }
    )
  }
  if (!copy || copy.trim() === '') {
    return Response.json({ error: 'copy is required' }, { status: 422 })
  }
  if (!ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number])) {
    return Response.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 422 }
    )
  }
  if (!ALLOWED_SOURCES.includes(source as typeof ALLOWED_SOURCES[number])) {
    return Response.json(
      { error: `source must be one of: ${ALLOWED_SOURCES.join(', ')}` },
      { status: 422 }
    )
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('posts')
    .insert({ brand_id, platform, copy: copy.trim(), status, source })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ post: data }, { status: 201 })
}
