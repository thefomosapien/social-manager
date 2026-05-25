import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Hot take: confidence without evidence is just arrogance with better posture. Is your strongest opinion actually backed by anything? duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Hot take: the people most certain they\'re right are usually the ones who\'ve thought about it the least.\n\nCertainty without curiosity isn\'t strength. It\'s a shortcut.\n\nWhat\'s the take you hold hardest — and have you actually stress-tested it? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: talent matters less than consistency. 67% voted hard work over natural ability. The grinders win again. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: working from home makes you more productive.\n\n71% of Duhbate voters said yes. The office is losing the argument.\n\nThe debate\'s still open if you want to take the other side. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Three phases. Two sides. One winner. Drop your take. Meet the counter. Let the crowd vote. No judges, no mercy — just the argument. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Three phases. Two sides. One winner.\n\nYou make your argument. Someone counters it. Then the crowd votes — no algorithms, no moderators, just people deciding who actually made the better case.\n\nThat\'s Duhbate. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The thing you\'d never say out loud is probably your most honest opinion. This is the place to say it. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Everyone has the take they keep to themselves. Too risky. Too unpopular. Too honest for the group chat.\n\nThat\'s exactly the take we want.\n\nDrop it. Defend it. See if it survives. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Make your case. Face the crowd. Your take survives the counter or it doesn\'t. There\'s only one way to find out. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'An opinion that\'s never been challenged isn\'t really an opinion. It\'s just something you\'ve never had to defend.\n\nDuhbate puts every take in the arena. Make your argument. Face the counter. Let the crowd decide.\n\nStart a debate. duhbate.app',
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
