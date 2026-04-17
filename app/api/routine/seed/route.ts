import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const DUHBATE_BRAND_ID = 'c2af994a-16b7-41f6-8f66-6a37f1d098df'

const POSTS = [
  {
    platform: 'x',
    copy: 'The community has spoken. 71% say you CAN be friends with your ex. The 29% who disagree? They\'re still reading the old texts. Case closed. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Three phases. Two sides. One winner.\n\nYou make the argument. The community counters it. Votes decide who\'s right.\n\nNo hot take survives unchallenged. Bring yours. duhbate.app',
  },
]

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.ROUTINE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const brand_id = request.nextUrl.searchParams.get('brand_id') ?? DUHBATE_BRAND_ID

  const supabase = createServiceClient()
  const results = []

  for (const post of POSTS) {
    const { data, error } = await supabase
      .from('posts')
      .insert({ brand_id, platform: post.platform, copy: post.copy, status: 'draft', source: 'routine' })
      .select()
      .single()
    results.push(error ? { error: error.message } : { post: data })
  }

  return Response.json({ results })
}
