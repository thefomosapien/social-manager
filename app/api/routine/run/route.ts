import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Hot take: the smarter you are, the better you are at convincing yourself you\'re right. That\'s not wisdom — that\'s just a fancier echo chamber. Prove it wrong. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Hot take: being the bigger person is overrated.\n\nSometimes the other person needs to be told they\'re wrong — clearly and publicly. Growth doesn\'t always look like grace.\n\nIs "being the bigger person" wisdom or weakness? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: sleeping in on weekends doesn\'t make up for a bad sleep schedule. 73% voted yes. The overachievers showed up. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: reply-guys who correct strangers online are doing more harm than good.\n\n71% agreed. The internet\'s most annoying profession got voted down.\n\nStill convinced you\'re helping? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Three phases. Two sides. One winner. You argue. Someone counters. Voters decide who\'s actually right. No refs. No mercy. Just the crowd. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Three phases. Two sides. One winner.\n\nDrop your argument. A challenger fires back. Then the crowd — real people, not an algorithm — votes on who actually won.\n\nYour conviction versus everyone else\'s. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Most people have never defended their strongest opinion against someone who actually disagrees. They\'re just performing confidence. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'There\'s an opinion you\'ll die on in private but go quiet about in public.\n\nThat\'s not tact. That\'s untested conviction.\n\nWhat\'s the take you keep to yourself — and why haven\'t you defended it yet? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Your take is either bulletproof or it isn\'t. There\'s only one way to find out. Make your case. Face the crowd. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Most opinions never survive a real challenge. They just get repeated until they feel true.\n\nDuhbate is where you find out if yours holds up — argue it, defend it, let the crowd decide.\n\nMake your case. Face the crowd. duhbate.app',
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
