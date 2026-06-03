import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

// Content pool refreshed 2026-06-03. First 5 cover all required types (alternating x/threads).
const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Is being chronically online making us worse at real arguments, or just faster at bad ones? Pick a lane. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: being perpetually early is a flex, not a courtesy.\n\n71% voted yes. The chronically-on-time crowd just won the moral high ground — again.\n\nThink they\'re wrong? Make your case. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'You drop the argument. The other side fires back. The crowd votes. Three phases, no moderator, no mercy — just the receipts. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Nobody actually wants their opinion changed. They want their take confirmed by someone credible enough to make it feel like growth.\n\nIf that lands uncomfortably, good.\n\nCome argue about it. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Your take has been sitting in your head with no challenger. Time to stress-test it. Make your case. Face the crowd. duhbate.app',
  },
  {
    platform: 'threads',
    copy: '"I don\'t watch the news" isn\'t a peace practice. It\'s just uninformed with less guilt.\n\nUnpopular? Maybe. Wrong? Come fight about it.\n\nduhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: work-life balance is your problem, not your company\'s. 66% agreed. Your employer isn\'t your therapist. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Duhbate is simple: drop a take, face the counter, let the community vote — no ties, no "agree to disagree."\n\nEvery debate has a winner. Every argument gets tested.\n\nStart one. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Most people calling themselves "open-minded" have already decided and are waiting for you to agree. Debate that. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'You\'ve been watching internet debates go sideways for years. You\'ve had better takes. You still do.\n\nDuhbate gives your argument a real arena — defend it under fire, let votes settle it.\n\nMake your case. duhbate.app',
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
