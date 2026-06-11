import { readFileSync, writeFileSync, existsSync } from 'fs'

const TMP_PATH = '/tmp/duhbate-posts.json'

interface Post {
  id: string
  brand_id: string
  platform: string
  copy: string
  status: string
  source: string
  created_at: string
}

function load(): Post[] {
  try {
    if (!existsSync(TMP_PATH)) return []
    return JSON.parse(readFileSync(TMP_PATH, 'utf-8')) as Post[]
  } catch {
    return []
  }
}

function save(posts: Post[]): void {
  writeFileSync(TMP_PATH, JSON.stringify(posts, null, 2))
}

export function readFallback(brand_id?: string | null, status?: string | null): Post[] {
  let posts = load()
  if (brand_id) posts = posts.filter(p => p.brand_id === brand_id)
  if (status) posts = posts.filter(p => p.status === status)
  return posts.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function insertFallback(post: Omit<Post, 'id' | 'created_at'>): Post {
  const posts = load()
  const record: Post = {
    ...post,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  posts.push(record)
  save(posts)
  return record
}
