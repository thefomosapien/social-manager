import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('key')
  if (token !== process.env.ROUTINE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const diag: Record<string, unknown> = {
    url_set: !!url,
    url_preview: url ? url.slice(0, 40) : null,
    anon_key_set: !!anonKey,
    anon_key_preview: anonKey ? anonKey.slice(0, 20) : null,
    service_key_set: !!serviceKey,
  }

  if (!url || !anonKey) {
    return Response.json({ ...diag, error: 'Missing env vars' })
  }

  try {
    const res = await fetch(`${url}/rest/v1/posts?select=id&limit=1`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      signal: AbortSignal.timeout(10000),
    })
    diag.http_status = res.status
    diag.ok = res.ok
    const body = await res.text()
    diag.body_preview = body.slice(0, 200)
  } catch (e: unknown) {
    const err = e as Error & { cause?: { code?: string; errno?: number; message?: string } }
    diag.fetch_error = err.message
    diag.fetch_cause_code = err.cause?.code
    diag.fetch_cause_errno = err.cause?.errno
    diag.fetch_cause_message = err.cause?.message
  }

  return Response.json(diag)
}
