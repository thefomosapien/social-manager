import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: "Hot take: you can tell more about someone from what they won't debate than what they will. Scared to be wrong? That's the real L. What's the take you keep dodging? duhbate.app",
  },
  {
    platform: 'threads',
    copy: "The community decided: confidence without receipts is just arrogance with better marketing.\n\n73% voted yes. Bold claims need proof — the crowd doesn't care how certain you sound.\n\nDrop your spiciest take and back it up. duhbate.app",
  },
  {
    platform: 'x',
    copy: 'Drop a take. Get countered. Let the crowd vote. Three steps between you and finding out if you\'re actually right. duhbate.app',
  },
  {
    platform: 'threads',
    copy: "Nobody actually wants to be challenged. They want to be agreed with, loudly.\n\nThe second someone pushes back, the debate was suddenly 'pointless' or 'not worth my time.'\n\nWhat do you actually believe — or are you just performing opinions? duhbate.app",
  },
  {
    platform: 'x',
    copy: "Your take sounds great in your head. It always does. But has it survived a real counter? One argument. One crowd. Find out now. duhbate.app",
  },
  {
    platform: 'threads',
    copy: "Hot take: \"I don't care what people think\" is the most popular opinion on the internet.\n\nEveryone's performing indifference. Nobody's actually unbothered.\n\nWhat's the take you secretly want validated? Cast it on Duhbate. duhbate.app",
  },
  {
    platform: 'x',
    copy: "The community decided: apologizing first doesn't make you weak — it makes you strategic. 69% agreed. Turns out the crowd respects the move. duhbate.app",
  },
  {
    platform: 'threads',
    copy: "Argument. Counter. Vote. That's the whole game.\n\nNo moderators. No algorithm deciding whose side is right. Just the crowd — unfiltered and unimpressed.\n\nMake your case at duhbate.app",
  },
  {
    platform: 'x',
    copy: "There are takes that need to be said and people too scared to say them. This is the platform where they get a fair fight. Say it. duhbate.app",
  },
  {
    platform: 'threads',
    copy: "Some debates never get settled because nobody's willing to commit to a side.\n\nDuhbate fixes that. One position. One counter. The crowd decides who's actually right — no waffling allowed.\n\nPick a side. Defend it. duhbate.app",
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
