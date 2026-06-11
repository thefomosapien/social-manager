import { type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { readFallback, insertFallback } from '@/lib/posts-fallback'

export const dynamic = 'force-dynamic'

const TARGET_DRAFTS = 5

type Post = { platform: 'x' | 'threads'; copy: string }

const POSTS: Post[] = [
  {
    platform: 'x',
    copy: 'Hot take: being "agreeable" is just a polished way of having no backbone. Is keeping the peace actually cowardice in disguise? Cast your vote. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Cold take disguised as a hot take: "I see both sides" is just intellectual cowardice with better PR.\n\nChoosing a side makes you vulnerable. That\'s the whole point.\n\nWhich debate are you ducking right now? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'The community decided: canceling plans is only acceptable if you were dreading them the whole time. 78% voted yes. The introverts won again. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'The community decided: mornings are overrated, and anyone calling themselves a "morning person" is just overcompensating.\n\n64% of Duhbate voters agreed. The night owls have spoken.\n\nAre you next? duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Three phases. Two sides. One winner. Make your argument → face the counter → let the crowd decide. No moderators. No mercy. duhbate.app',
  },
  {
    platform: 'threads',
    copy: 'Three phases. Two sides. One winner.\n\nMake your argument. Face the counter. Let the crowd vote — and the crowd doesn\'t lie.\n\nNo safe spaces. Just debate. duhbate.app',
  },
  {
    platform: 'x',
    copy: 'Unpopular truth: most "free thinkers" just traded one herd for a smaller, cooler one. There\'s no escaping the influence. Fight me. duhbate.app',
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

  // Check existing draft count, falling back to /tmp store if Supabase is unavailable
  let currentCount = 0
  let usingFallback = false

  try {
    const supabase = createServiceClient()
    const { data: existing, error: fetchError } = await supabase
      .from('posts')
      .select('id')
      .eq('brand_id', brand_id)
      .eq('status', 'draft')
    if (fetchError) throw fetchError
    currentCount = existing?.length ?? 0
  } catch {
    usingFallback = true
    currentCount = readFallback(brand_id, 'draft').length
  }

  if (currentCount >= TARGET_DRAFTS) {
    return Response.json({
      message: 'Queue is full',
      drafts: currentCount,
      inserted: 0,
      storage: usingFallback ? 'fallback' : 'supabase',
    })
  }

  const needed = TARGET_DRAFTS - currentCount
  const toInsert = POSTS.slice(0, needed)
  const inserted = []

  for (const post of toInsert) {
    if (!usingFallback) {
      try {
        const supabase = createServiceClient()
        const { data, error } = await supabase
          .from('posts')
          .insert({ brand_id, platform: post.platform, copy: post.copy, status: 'draft', source: 'routine' })
          .select()
          .single()
        if (error) throw error
        inserted.push({ ...data, _storage: 'supabase' })
        continue
      } catch {
        usingFallback = true
      }
    }

    const record = insertFallback({
      brand_id,
      platform: post.platform,
      copy: post.copy,
      status: 'draft',
      source: 'routine',
    })
    inserted.push({ ...record, _storage: 'fallback' })
  }

  return Response.json({
    message: `Inserted ${inserted.length} post${inserted.length === 1 ? '' : 's'}`,
    drafts_before: currentCount,
    drafts_after: currentCount + inserted.length,
    storage: usingFallback ? 'fallback (/tmp)' : 'supabase',
    posts: inserted,
  })
}
