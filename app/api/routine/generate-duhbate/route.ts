import { type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const SB_URL = 'https://tijhwlnxdfcmtdkhtupk.supabase.co'
const SB_KEY = 'sb_publishable_XjfUM_F9nVtUwu2RAxLW0w_-TLjXaDo'
const BRAND_ID = 'c2af994a-16b7-41f6-8f66-6a37f1d098df'

const POOL: Array<{ platform: string; copy: string }> = [
  {
    platform: 'x',
    copy: `Is hustle culture the biggest scam of our generation, or are you just looking for permission to quit? The community is debating. We need your vote. duhbate.app`,
  },
  {
    platform: 'threads',
    copy: `The community voted.\n\nSkipping breakfast isn't lazy — it's a flex. "Most important meal of the day" was a cereal company's ad campaign from 1917.\n\nDebate closed. Your morning is yours. duhbate.app`,
  },
  {
    platform: 'x',
    copy: `Three phases. Two sides. One winner. You argue. The crowd counters. Votes decide. No moderators. No mercy. Just the best argument standing. duhbate.app`,
  },
  {
    platform: 'threads',
    copy: `Here's one nobody wants to answer:\n\nIs being right more important to you than being understood? Most people say they want truth. Most people actually want validation.\n\nWhat were you actually fighting for in your last argument? duhbate.app`,
  },
  {
    platform: 'x',
    copy: `Make your case. Face the crowd. Walk away the winner — or find out exactly why you're wrong. Either way, you're sharper for it. duhbate.app`,
  },
]

export async function GET(request: NextRequest) {
  const sb = createClient(SB_URL, SB_KEY)

  const { count, error: countErr } = await sb
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', BRAND_ID)
    .eq('status', 'draft')

  if (countErr) {
    return Response.json({ error: countErr.message }, { status: 500 })
  }

  const existing = count ?? 0
  if (existing >= 5) {
    return Response.json({ message: 'Queue is full', existing, inserted: 0 })
  }

  const needed = 5 - existing
  const toInsert = POOL.slice(0, needed).map((p) => ({
    brand_id: BRAND_ID,
    platform: p.platform,
    copy: p.copy,
    status: 'draft',
    source: 'routine',
  }))

  const { data, error: insertErr } = await sb.from('posts').insert(toInsert).select()

  if (insertErr) {
    return Response.json({ error: insertErr.message }, { status: 500 })
  }

  return Response.json({ existing, inserted: data?.length ?? 0, posts: data })
}
