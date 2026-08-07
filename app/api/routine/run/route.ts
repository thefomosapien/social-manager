import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Hot take: loyalty to a bad opinion is just ego wearing a mask. When did you last actually change your mind? Make the argument. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: crying at movies doesn\'t make you soft — it makes you human.\n\n68% voted yes. The stoics lost this one.\n\nWhat\'s the debate you keep dodging? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Three phases. Two sides. One winner. Drop your take, face the counter, let the crowd vote. No judges. No panels. Just debate. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Nobody actually wants to be told they\'re wrong. They want to be understood while being wrong — which is why most arguments go nowhere.\n\nWhat\'s the take you hold that you\'re not ready to defend?\n\nduhbate.app',
  },
  {
    platform: 'x',
    copy: 'Your opinion isn\'t a fact until it survives a challenge. Make your case. Face the crowd. Win the debate. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Everyone says they want honest feedback. Almost nobody means it.\n\nThe gap between what people say they want and what they\'ll tolerate is where every real argument lives.\n\nWhat\'s the hardest truth you weren\'t ready to hear? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: apologizing first doesn\'t mean you lost. 73% of Duhbate voters agreed. Pride costs more than peace. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Most debates die before they start — because people only talk to people who already agree.\n\nDuhbate is different. Make your argument. Face someone who thinks you\'re wrong. Let the crowd decide.\n\nThree phases. Two sides. One truth. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Confidence without evidence is noise. But waiting for perfect evidence before speaking is just fear. Where\'s the line? duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Your take has never been tested.\n\nDuhbate gives it a real arena — make your argument, face the counter, let the crowd decide who\'s actually right.\n\nStop defending yourself in the mirror. Make your case. duhbate.app',
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
