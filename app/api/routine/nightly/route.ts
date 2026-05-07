import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const BRAND_ID = 'c2af994a-16b7-41f6-8f66-6a37f1d098df'

const POSTS = [
  {
    platform: 'x',
    copy: "Hot take: you're not losing debates online — you're just winning them in the wrong arena. Settle it where the crowd decides. duhbate.app",
  },
  {
    platform: 'threads',
    copy: "The community has spoken.\n\nThis week's most contested debate: Is remote work killing collaboration or finally fixing it? 600+ arguments. Two sides. Zero mercy.\n\nThe votes are in — and the margin wasn't even close. See who won at duhbate.app",
  },
  {
    platform: 'x',
    copy: "Three phases. Two sides. One winner. Make your argument. Face the counter. Let the crowd vote. That's Duhbate. duhbate.app",
  },
  {
    platform: 'threads',
    copy: "Nobody actually wants to be challenged.\n\nThey want to be agreed with. Validated. Nodded at.\n\nWhat happens when the crowd gets a vote and they don't take your side? Find out. duhbate.app",
  },
  {
    platform: 'x',
    copy: "Make your case. Face the crowd. Let the votes decide. Think you're right? Prove it. duhbate.app",
  },
]

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token || token !== process.env.ROUTINE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let supabase: ReturnType<typeof createServiceClient>
  try {
    supabase = createServiceClient()
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }

  const { data: drafts, error: fetchError } = await supabase
    .from('posts')
    .select('id')
    .eq('brand_id', BRAND_ID)
    .eq('status', 'draft')

  if (fetchError) {
    return Response.json({ error: fetchError.message }, { status: 500 })
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
