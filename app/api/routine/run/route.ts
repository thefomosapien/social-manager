import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: "Is having a 'calm personality' just code for 'too scared to commit to an opinion'? The crowd has thoughts. duhbate.app",
  },
  {
    platform: 'threads',
    copy: "The community voted: 73% said if you can't explain why you believe something, you don't actually believe it — you inherited it.\n\nOuch.\n\nGot a take worth defending? duhbate.app",
  },
  {
    platform: 'x',
    copy: 'Drop your argument. Get countered. Let the crowd decide who actually had the better case. Simple. Brutal. Fair. duhbate.app',
  },
  {
    platform: 'threads',
    copy: "Nobody's changed their mind in an argument they didn't feel safe to lose.\n\nThat's why most debates go nowhere — everyone's optimizing for not being wrong instead of trying to be right.\n\nWhat would you actually defend if losing was okay? duhbate.app",
  },
  {
    platform: 'x',
    copy: "Stop testing your takes in echo chambers. Bring them somewhere they can actually be challenged. Make your case. duhbate.app",
  },
  {
    platform: 'x',
    copy: "Confidence without counter-argument isn't conviction. It's comfort. Fight me. duhbate.app",
  },
  {
    platform: 'threads',
    copy: "The worst takes survive because nobody challenged them in the right room.\n\nNot because they were right. Because they were never really tested.\n\nDuhbate fixes that. duhbate.app",
  },
  {
    platform: 'x',
    copy: "Unpopular: the people most certain they're right are usually the people who argue the least. duhbate.app",
  },
  {
    platform: 'threads',
    copy: "Three phases. Two sides. One winner.\n\nYou make the argument. They counter it. The crowd votes on who actually made sense.\n\nNo judges. No moderators. Just the crowd doing what crowds do — deciding. duhbate.app",
  },
  {
    platform: 'x',
    copy: "You've been waiting for permission to say what you actually think. Duhbate's the permission. duhbate.app",
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
