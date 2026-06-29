import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: "Hot take: anyone who says 'it's complicated' just doesn't want to defend their position. Simplicity is a skill. Complexity is a shield. duhbate.app",
  },
  {
    platform: 'threads',
    copy: "The community decided: ghosting is only acceptable when the other person absolutely knew what they did.\n\n71% voted yes. The accountability era has arrived — but only when it applies to them.\n\nWhat's your verdict? duhbate.app",
  },
  {
    platform: 'x',
    copy: 'Drop your take. Face the counter. Let the crowd decide. That\'s Duhbate — no safe room, no moderator, just arguments and votes. duhbate.app',
  },
  {
    platform: 'threads',
    copy: "Nobody actually changes their mind from a debate. They just find better words for what they already believed.\n\nOr do they? Prove me wrong — that's what the crowd is for.\n\nWhat's the last take you genuinely abandoned? duhbate.app",
  },
  {
    platform: 'x',
    copy: "Your opinion lives rent-free in your head until someone challenges it. Start a debate. See if it survives. duhbate.app",
  },
  {
    platform: 'threads',
    copy: "Hot take: the smartest people in every room are the ones who say the least.\n\nOr they're just quiet. There's a real difference and most people can't tell.\n\nWhich one are you, actually? duhbate.app",
  },
  {
    platform: 'x',
    copy: 'The community decided: confidence without credentials is just noise. 69% agreed. The room has spoken — quietly and correctly. duhbate.app',
  },
  {
    platform: 'threads',
    copy: "Here's how it works:\n\nYou make the case. Someone counters it. The crowd votes.\n\nNo echo chambers. No moderators. No mercy. Just the best argument wins — and you'll know exactly why you lost.\n\nduhbate.app",
  },
  {
    platform: 'x',
    copy: "Everyone has a take they're afraid to say out loud. That's the one worth debating. duhbate.app",
  },
  {
    platform: 'threads',
    copy: "Most arguments end in a draw because nobody's keeping score.\n\nDuhbate keeps score. Make your case, face the counter, and let the crowd hand down a verdict.\n\nYour next debate is waiting. duhbate.app",
  },
]

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const brand_id = params.get('brand_id')
  const key = params.get('key')
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : key

  if (!brand_id) {
    return Response.json({ error: 'brand_id is required' }, { status: 422 })
  }
  if (token !== process.env.ROUTINE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: existing, error: fetchError } = await supabase
    .from('posts')
    .select('id')
    .eq('brand_id', brand_id)
    .eq('status', 'draft')

  if (fetchError) {
    return Response.json({ error: fetchError.message }, { status: 500 })
  }

  const currentCount = existing?.length ?? 0

  if (currentCount >= TARGET_DRAFTS) {
    return Response.json({ message: 'Queue is full', drafts: currentCount, inserted: 0 })
  }

  const needed = TARGET_DRAFTS - currentCount
  const toInsert = POSTS.slice(0, needed)
  const inserted = []

  for (const post of toInsert) {
    const { data, error } = await supabase
      .from('posts')
      .insert({ brand_id, platform: post.platform, copy: post.copy, status: 'draft', source: 'routine' })
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message, inserted }, { status: 500 })
    }
    inserted.push(data)
  }

  return Response.json({
    message: `Inserted ${inserted.length} post${inserted.length === 1 ? '' : 's'}`,
    drafts_before: currentCount,
    drafts_after: currentCount + inserted.length,
    posts: inserted,
  })
}
