import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Hot take: people who say "I don\'t care what others think" care the most. Are you brave enough to prove them wrong? duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: going to the gym at 5am is a personality trait, not a workout.\n\n73% voted yes. The sleep-deprived masses have spoken.\n\nWhat\'s your 5am hot take? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Make your argument. Face the counter. Let the crowd decide. Three phases. Two sides. One winner. That\'s it. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Nobody actually wants feedback. They want validation with a disclaimer.\n\nThe people who say "be brutally honest" are the first ones to get defensive.\n\nProve me wrong. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Your hottest take hasn\'t survived a real challenge yet. Enter the arena. Make your case. Face the crowd. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Hot take: the loudest person in the meeting is almost never the smartest person in the room.\n\nThey\'re just louder.\n\nIs confidence overrated? Or is it the whole game? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: ghosting is a valid response when you\'ve tried everything else. 61% voted yes. The closure-seekers lost. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Three phases. Two sides. One winner.\n\nYou drop your take. Someone counters it. The crowd votes — no judges, no moderators, just people deciding who\'s actually right.\n\nStep into the arena. duhbate.app',
  },
  {
    platform: 'x',
    copy: '"Everything happens for a reason" is the most comforting lie we tell each other. And nobody\'s challenging it. Yet. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Most opinions die untested — shared once in a group chat, agreed with by five friends, never challenged.\n\nDuhbate is the arena where your take faces real opposition.\n\nMake your case. Face the crowd. duhbate.app',
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
