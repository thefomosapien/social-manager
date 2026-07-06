import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Hot take: the people most obsessed with "authenticity" are the least authentic people in the room. Performative honesty is still a performance. Agree or fight back. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: telling someone "you look tired" is a passive-aggressive power move. 73% voted yes.\n\nWe\'ve all done it. Most of us knew exactly what we were doing.\n\nWhich backhanded compliment are you ready to defend? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Drop your take. Watch it get countered. Let the crowd vote. No influencer immunity. No echo chamber. Just your argument vs. everyone else\'s. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Nobody actually changes their mind in an argument. They just decide whether to admit it out loud.\n\nThe debate doesn\'t end when someone wins — it ends when someone gets tired of being right.\n\nWhat\'s the opinion you\'ve quietly updated but never said? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Your hottest take has never been tested. Find out if you\'re actually right or just unchallenged. Post it. Defend it. Let the crowd decide. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Hot take: confidence isn\'t a personality trait — it\'s just what certainty looks like before it gets tested.\n\nThe most confident person in the room is either the most prepared or the most delusional. There\'s no third option.\n\nCast your vote. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: apologizing when you\'re not wrong is a social skill, not a sign of weakness. 61% voted yes. The pragmatists took the W. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Three phases. Two sides. One winner.\n\nMake your argument. Face the counter. Let the crowd vote — and the crowd doesn\'t care about your feelings.\n\nThe arena\'s open. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Unpopular truth: most group decisions are just whoever spoke first with the most confidence. The best idea rarely wins. The loudest one does. Change my mind. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Most opinions die in group chats — untested, unchallenged, and quietly deleted when the vibe shifts.\n\nDuhbate is the arena where your take either survives contact or doesn\'t.\n\nMake your case. Face the crowd. duhbate.app',
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
