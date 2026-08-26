import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Hot take: the person who wins an argument is rarely the one who\'s right — it\'s the one who cares less about being wrong. Prove us wrong. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: you can be both confident and deeply wrong at the same time.\n\n72% voted yes. The self-aware won in a landslide.\n\nWhat\'s the take you\'re most sure about — but haven\'t actually tested? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Three phases. Two sides. One winner. Your argument survives the crowd — or it doesn\'t. That\'s Duhbate. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'There\'s a belief you hold that you\'ve never had to defend.\n\nYou know it\'s right. You\'ve just never been tested.\n\nWhat happens to a conviction that never gets challenged? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Make your case. Face the crowd. Win the debate. Your take isn\'t a fact until the crowd votes. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Hot take: most people who say "agree to disagree" are just too scared to finish the argument.\n\nConflict avoidance isn\'t peace. It\'s discomfort deferred.\n\nIs walking away ever actually winning? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: you should be embarrassed by your old opinions — it means you\'ve grown. 71% agreed. The evolvers won. Your turn. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Three phases. Two sides. One winner.\n\nYou make your argument. Someone else makes theirs. The crowd votes — no friends, no favorites, just logic and vibes.\n\nThat\'s Duhbate. Every debate ends with a verdict. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Is it possible to have a genuinely original opinion, or are you just recombining what you\'ve absorbed? duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Your opinion lives rent-free in your head. It\'s never been stress-tested.\n\nDuhbate gives your take a real arena — drop it, defend it against someone who disagrees, and let the crowd decide if you\'re actually right.\n\nMake your case. duhbate.app',
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
