import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const BRAND_ID = 'c2af994a-16b7-41f6-8f66-6a37f1d098df'

const POSTS = [
  {
    platform: 'x',
    copy: "Is your opinion actually good — or just unopposed? There's only one way to find out. duhbate.app",
  },
  {
    platform: 'threads',
    copy: "The community has spoken.\n\nThis week's most-debated question: Should cities ban cars from downtown permanently? 900+ arguments. Two sides. One verdict.\n\nThe margin? Brutal. See who won at duhbate.app",
  },
  {
    platform: 'x',
    copy: "Three phases. Two sides. One winner. Argue it. Counter it. Let the crowd decide. That's Duhbate. duhbate.app",
  },
  {
    platform: 'threads',
    copy: "Some takes are just waiting to be destroyed.\n\nNot in a comment section. Not in a group chat. In an actual debate — with rules, a real counter-argument, and a crowd that votes.\n\nWhat's your unpopular opinion? duhbate.app",
  },
  {
    platform: 'x',
    copy: "Stop arguing in comment sections. Make your case. Face the counter. Let votes decide. duhbate.app",
  },
]

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token || token !== process.env.ROUTINE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !hasKey) {
    return Response.json(
      { error: 'Missing Supabase env vars', hasUrl: !!supabaseUrl, hasKey },
      { status: 500 }
    )
  }

  const supabase = createServiceClient()

  const { data: drafts, error: fetchError } = await supabase
    .from('posts')
    .select('id')
    .eq('brand_id', BRAND_ID)
    .eq('status', 'draft')

  if (fetchError) {
    return Response.json(
      { error: fetchError.message, detail: fetchError.details, supabaseUrlHost: new URL(supabaseUrl).hostname },
      { status: 500 }
    )
  }

  const currentCount = drafts?.length ?? 0

  if (currentCount >= 5) {
    return Response.json({ message: 'Queue is full', draftCount: currentCount })
  }

  const needed = 5 - currentCount
  const toInsert = POSTS.slice(0, needed)

  const inserted: { id: string; platform: string }[] = []
  const errors: { platform: string; error: string }[] = []

  for (const post of toInsert) {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        brand_id: BRAND_ID,
        platform: post.platform,
        copy: post.copy,
        status: 'draft',
        source: 'routine',
      })
      .select('id, platform')
      .single()

    if (error) {
      errors.push({ platform: post.platform, error: error.message })
    } else {
      inserted.push({ id: data.id, platform: data.platform })
    }
  }

  return Response.json({
    draftsBefore: currentCount,
    needed,
    inserted: inserted.length,
    posts: inserted,
    errors,
  })
}
