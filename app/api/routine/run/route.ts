import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Hot take: you don\'t actually believe your opinions — you believe what the algorithm decided for you this week. Prove otherwise. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: texting someone "k" is passive-aggressive and everyone knows it.\n\n74% of Duhbate voters agreed. The over-thinkers swept the vote.\n\nWhat\'s the one-word reply that sets you off? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Three phases. Two sides. One winner. Make your argument → face the counter → let the crowd vote. No moderators. No mercy. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'There\'s an opinion you\'ve had for years that you\'ve never said out loud.\n\nNot because it\'s wrong. Because you\'re not sure you can defend it.\n\nThat\'s exactly what Duhbate is for. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Make your case. Face the crowd. Win the debate. Your take doesn\'t count until it\'s been challenged by strangers. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Hot take: "I just want everyone to get along" is the most conflict-avoidant thing you can say — which is itself a form of conflict.\n\nYou\'re not neutral. You\'re just scared of losing.\n\nWhich side are you actually on? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: replying "lol" to end a conversation is emotional warfare disguised as casualness. 82% voted yes. You know what you did. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Three phases. Two sides. One winner.\n\nDrop your take. Survive the counter. Let strangers vote on who actually made sense.\n\nNo panel. No algorithm. Just the crowd. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The opinion you\'d refuse to defend in public is probably the most interesting one you have. Say it. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Every hot take you\'ve ever sat on deserves a real arena — not a group chat that agrees with you by default.\n\nDrop it on Duhbate. Make your case. Let the crowd decide.\n\nYour opinion isn\'t real until strangers vote on it. duhbate.app',
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
