import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Hot take: the loudest person in any argument is usually the least sure of themselves. Being certain is quiet. Change my mind. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: eating at your desk isn\'t productivity — it\'s a red flag. 72% of Duhbate voters agreed.\n\nIs your lunch break a vibe or a symptom? The crowd has spoken.\n\nMake your case next. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Three phases. Two sides. One winner. Drop your take. Get countered. Let the crowd decide who actually had a point. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Every opinion you\'ve never had to defend in public is just a vibe, not a position.\n\nYou haven\'t tested it. You don\'t know if it holds. You\'re just guessing you\'re right.\n\nThat\'s fine. Or is it? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Make your case. Face the crowd. If your argument can\'t survive five minutes of real pushback, it never belonged to you anyway. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'There\'s a version of you that goes full villain arc the moment someone slightly disagrees at dinner.\n\nThat version of you? It\'s the interesting one.\n\nWhat\'s the take you\'re most afraid to lose? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: "playing devil\'s advocate" is usually just something you actually believe but want plausible deniability for. 69% said yes. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'You make the argument. Someone counters it. The crowd votes.\n\nNo moderator. No algorithm. No one sliding into your DMs. Just the debate.\n\nThat\'s Duhbate. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Unpopular opinion: most "hot takes" are lukewarm reheats of something someone else said first. What\'s your original one? duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Your best argument has been sitting in your head for years — untested, unchallenged, comfortable.\n\nBring it to the arena. Drop it. Defend it. Let the crowd decide if you\'re as right as you think.\n\nMake your case. duhbate.app',
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
