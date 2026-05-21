import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  // Hot-take questions
  {
    platform: 'x',
    copy: 'Hot take: loyalty to a friend who\'s wrong is just enabling with a nicer name. Do you defend them or tell the truth? The community needs to know. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Hot take: apology culture has made us worse at accountability, not better.\n\nSaying sorry got cheap. Changing behavior got rare.\n\nDo public apologies actually mean anything anymore? Cast your vote. duhbate.app',
  },
  // "The community decided..." results posts
  {
    platform: 'x',
    copy: 'The community decided: replying "k" to a long heartfelt text is a power move, not rudeness. 61% voted yes. The minimalists are running this app. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: splitting the bill on a first date is a green flag, not a red one.\n\n72% of Duhbate voters agreed. Romance is alive — it just has Venmo.\n\nWas the crowd right? duhbate.app',
  },
  // Platform explainers
  {
    platform: 'x',
    copy: 'Three phases. Two sides. One winner. Make your argument → face the counter → let the crowd decide. No moderators. No mercy. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Here\'s how Duhbate works: you drop a take, someone counters it, and the crowd votes who actually won.\n\nNo algorithm. No followers. Just the strength of your argument.\n\nThink you can hold your ground? duhbate.app',
  },
  // Open provocations
  {
    platform: 'x',
    copy: 'Somewhere right now someone is absolutely wrong about something they\'re completely confident in. Maybe it\'s you. Only one way to find out. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The opinion you\'re most sure about is probably the one you\'ve tested the least.\n\nComfort zones don\'t debate back. Real people do.\n\nWhat\'s the take you\'ve never had to actually defend? duhbate.app',
  },
  // CTA posts
  {
    platform: 'x',
    copy: 'Make your case. Face the crowd. If your argument holds up, the votes will prove it. If it doesn\'t — now you know. Start now. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'You\'ve had this take for years. You\'ve never had to defend it.\n\nDuhbate is where takes either survive or fall apart — in public, in real time, decided by real votes.\n\nReady? Make your case. duhbate.app',
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
