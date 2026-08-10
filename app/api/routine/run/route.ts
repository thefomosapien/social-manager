import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Hot take: everyone who says "do your own research" just means "agree with me." Is intellectual independence real or a convenient myth? duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided.\n\nWe asked: Is therapy just paying someone to validate you? 59% said yes — and held the line when challenged.\n\nCome argue. Come lose. Or maybe come win. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Three phases. Two sides. One winner. Drop your take → the other side counters → votes decide the truth. No algorithm picking favorites. Just debate. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Nobody is as open-minded as they think they are.\n\nWe say we want to hear different perspectives. What we actually want is for different perspectives to agree with us.\n\nWhat\'s the opinion you\'d never change no matter who countered it? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Your take sounds right until it meets a real counter. Make your case. Face the crowd. Find out. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Three phases. Two sides. One winner.\n\nMake your argument. Face the counter. Let the crowd vote — and the crowd doesn\'t lie.\n\nNo safe spaces. Just debate. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Unpopular opinion: confidence isn\'t a personality trait — it\'s just the willingness to be publicly wrong. Are the boldest people just the least self-aware? duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'There\'s a version of every argument where you\'re completely wrong. You just haven\'t heard it yet.\n\nThat\'s not a threat. That\'s an invitation.\n\nWhat\'s the take you\'re most afraid to defend? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Make your case. Face the crowd. Win the debate. Your take isn\'t worth much until it survives a real challenge. Start one now. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Most opinions die in group chats — never tested, never challenged.\n\nDuhbate gives your take a real arena: drop it, defend it, let the crowd decide if you\'re actually right.\n\nMake your case. Face the crowd. duhbate.app',
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
