import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Is confidence just arrogance that turned out to be correct? The line is razor-thin and the crowd doesn\'t care which side you\'re on until after the vote. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community voted: silence during conflict isn\'t maturity — it\'s passive aggression with better PR.\n\n67% of Duhbate voters agreed. The case for speaking up won, barely, in one of our closest debates ever.\n\nWhat\'s the argument you\'ve been avoiding? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Three phases. Two sides. One winner. Make your case → get countered → the crowd decides. No moderator. No mercy. Just the strongest argument standing. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'There are takes you\'re afraid to say out loud because you know they won\'t survive a challenge.\n\nThat\'s not wisdom. That\'s cowardice with better lighting.\n\nThe arena is open. What do you actually believe? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Make your case. Face the crowd. Your opinion isn\'t worth much until it\'s been challenged. Start a debate. Find out where you actually stand. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Hot take: being agreeable is just a polished way of having no backbone.\n\nKeeping the peace feels noble — until you realize you\'ve been on the losing side of every argument by default.\n\nCast your vote. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: canceling plans is only acceptable if you were dreading them the whole time. 78% voted yes. The introverts won again. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Most opinions die in group chats — never tested, never challenged.\n\nDuhbate gives your take a real arena: drop it, defend it, let the crowd decide if you\'re actually right.\n\nMake your case. Face the crowd. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Unpopular truth: most "free thinkers" just traded one herd for a smaller, cooler one. There\'s no escaping the influence. Fight me. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'There\'s a version of every argument where you\'re completely wrong. You just haven\'t heard it yet.\n\nThat\'s not a threat. That\'s an invitation.\n\nWhat\'s the take you\'re most afraid to defend? duhbate.app',
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
