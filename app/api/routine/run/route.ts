import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Hot take: people who "just ask questions" already know their answer. The question is just a shield. Agree or defend yourself. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: working remotely makes you lazier — and 61% of Duhbate voters admitted it.\n\nNobody actually agreed on what counts as lazy. That\'s the real debate.\n\nCome settle it properly. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'On Duhbate: you make your case, someone counters it, the crowd picks a winner. No panel. No host. No spin. Just the argument and whether it survives contact. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The most dangerous opinion isn\'t the controversial one. It\'s the common one nobody bothers to examine.\n\nThose go unchallenged for years. Decades. Sometimes forever.\n\nWhat "obvious" belief are you actually not sure about? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'You\'ve never had to defend your take to someone who actually disagrees. That\'s not an insult — it\'s just the truth. Ready to change that? duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Hot take: the reason you can\'t explain your opinion clearly is that you don\'t actually hold it — you inherited it.\n\nMost beliefs don\'t survive the first real question. That\'s not a flaw. That\'s a test.\n\nWhat do you actually believe? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: apologizing first doesn\'t make you the bigger person — it makes you the one who lost. 67% voted yes. The stubborn are vindicated. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Duhbate is three rounds: make your argument, face the counter, let the crowd decide.\n\nNo algorithms picking winners. No likes protecting bad takes. Just the argument, tested in public.\n\nIf your take is right, it\'ll survive. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Genuine question: if you changed your mind on something important, would you say so publicly? Or just quietly update your behavior? There\'s a Duhbate for this. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Your take has been living rent-free in your head for years. Never challenged. Never put to a vote. Never had to survive someone who actually disagrees.\n\nThat\'s not confidence. That\'s avoidance.\n\nBring it to Duhbate. duhbate.app',
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
