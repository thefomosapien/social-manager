import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Hot take: needing to "sleep on" every decision isn\'t thoughtful — it\'s just being scared to be wrong fast. Agree or fight back. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: calling someone "confident" is just a polite way of saying they\'re too loud to argue with.\n\n67% voted yes. Turns out we\'ve all been nodding along to the wrong people.\n\nWhich overrated quality are you debating next? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Three phases. Two sides. One winner. Drop your take → face the counter → let the crowd vote. The crowd doesn\'t grade on a curve. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Nobody actually changes their mind in an argument. They just find better reasons to believe what they already believed.\n\nSo what\'s the point?\n\nMaybe it\'s not about changing minds. Maybe it\'s about finding out if your take can survive contact with reality. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Your opinion lives rent-free in your head. Time to evict it to a debate floor. Make your case. Face the crowd. Win or learn. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Scrolling past a post you disagree with instead of engaging is the most common form of intellectual cowardice.\n\nWe call it "not feeding the trolls." Sometimes we\'re just protecting a take we can\'t actually defend.\n\nWhat did you scroll past today? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: honesty is overrated. 71% said they\'d rather hear a comforting lie than a brutal truth. Real talk. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Three phases. Two sides. One winner.\n\nYou drop your take. The crowd counters it. Everyone votes — and the crowd doesn\'t lie.\n\nNo moderation. No safe landings. Just you, your argument, and the truth. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The loudest person in the room rarely has the strongest argument. They just have the least to lose from being wrong. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'There\'s a debate you\'ve been winning in your own head for years.\n\nThe problem? Nobody\'s ever pushed back hard enough to test it.\n\nThat ends now. Make your case. Face the crowd. Find out if you\'re actually right. duhbate.app',
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
