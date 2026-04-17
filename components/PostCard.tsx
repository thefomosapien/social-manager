'use client'

import { useState } from 'react'
import { Post, Platform, PostStatus } from '@/types'
import PlatformBadge from './PlatformBadge'
import { Check, X, Pencil, Loader2, Clock, Send } from 'lucide-react'

const STATUS_CONFIG: Record<PostStatus, { label: string; dot: string }> = {
  draft: { label: 'Draft', dot: '#F97316' },
  approved: { label: 'Approved', dot: '#22c55e' },
  published: { label: 'Published', dot: '#6B46C1' },
  skipped: { label: 'Skipped', dot: '#9ca3af' },
}

interface PostCardProps {
  post: Post
  brandColor: string
  onStatusChange: (postId: string, status: PostStatus) => Promise<void>
  onEditSave: (postId: string, copy: string) => Promise<void>
}

export default function PostCard({ post, brandColor, onStatusChange, onEditSave }: PostCardProps) {
  const [editing, setEditing] = useState(false)
  const [copy, setCopy] = useState(post.copy)
  const [loading, setLoading] = useState<PostStatus | 'save' | null>(null)

  async function handleStatus(status: PostStatus) {
    setLoading(status)
    await onStatusChange(post.id, status)
    setLoading(null)
  }

  async function handleSave() {
    setLoading('save')
    await onEditSave(post.id, copy)
    setLoading(null)
    setEditing(false)
  }

  const statusCfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={post.platform as Platform} />
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: statusCfg.dot }}
            />
            {statusCfg.label}
          </span>
        </div>
        <span className="text-xs text-gray-300">
          {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Copy */}
      <div className="px-4 py-3">
        {editing ? (
          <textarea
            className="w-full text-sm text-gray-800 leading-relaxed resize-none border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
            rows={4}
            value={copy}
            onChange={(e) => setCopy(e.target.value)}
          />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{post.copy}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-50 bg-gray-50/50">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={loading === 'save'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: brandColor }}
            >
              {loading === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setCopy(post.copy) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {post.status === 'draft' && (
              <button
                onClick={() => handleStatus('approved')}
                disabled={!!loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: brandColor }}
              >
                {loading === 'approved' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Approve
              </button>
            )}
            {post.status === 'approved' && (
              <button
                onClick={() => handleStatus('published')}
                disabled={!!loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: brandColor }}
              >
                {loading === 'published' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Publish
              </button>
            )}
            {(post.status === 'draft' || post.status === 'approved') && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleStatus('skipped')}
                  disabled={!!loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-60"
                >
                  {loading === 'skipped' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Skip
                </button>
              </>
            )}
            {post.status === 'published' && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                {post.published_at
                  ? `Published ${new Date(post.published_at).toLocaleDateString()}`
                  : 'Published'}
              </span>
            )}
            {post.status === 'skipped' && (
              <button
                onClick={() => handleStatus('draft')}
                disabled={!!loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Restore to Draft
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
