import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Hot take: saying "I don\'t like conflict" is just a polite way of saying you\'d rather be wrong in peace. Is conflict avoidance actually a character flaw? duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: being the smartest person in the room isn\'t a flex — it\'s a sign you\'re in the wrong room.\n\n73% of Duhbate voters agreed. Find harder rooms.\n\nWhat debate have you been ducking because you might lose? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'An argument. A counter. A crowd vote. That\'s all it takes to settle anything. Welcome to Duhbate — where your hot take meets its match. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Everyone has a take they\'re too afraid to say out loud.\n\nNot because it\'s wrong. Because they don\'t want to defend it.\n\nWhat\'s the opinion you\'d argue in private but never post publicly? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Your take isn\'t just an opinion. It\'s a challenge waiting to happen. Step into the arena and let the crowd decide. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Hot take: most "life advice" is just the advice-giver\'s unresolved issues wearing a wisdom costume.\n\nWho\'s actually qualified to tell you how to live?\n\nThe community wants to weigh in. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: working hard and being busy are not the same thing. 81% voted yes. The performative grinders lost. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Three phases. Two sides. One winner.\n\nMake your case. Face the counter. Let the crowd vote — no appeals, no moderators.\n\nThis is how opinions get stress-tested. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Uncomfortable truth: most people don\'t want to be right. They want to feel right. There\'s a difference. Debate it. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'You\'ve been thinking it for months. Maybe years.\n\nSomeone out there has the counter. The crowd has the verdict.\n\nDrop your take. Defend it. Let Duhbate settle it. duhbate.app',
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
