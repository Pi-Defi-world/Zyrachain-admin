import { useCallback, useEffect, useState } from 'react'
import { getModerationQueue, moderatePost } from '../lib/api'
import type { ModerationRow } from '../lib/api'
import { PageHeader, Spinner, ErrorBanner } from '../components/Layout'

export default function ModerationPage() {
  const [rows, setRows] = useState<ModerationRow[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError('')
    try {
      const data = await getModerationQueue({ page: p, limit: 20 })
      setRows(data.data)
      setTotal(data.pagination.total)
      setPages(data.pagination.pages)
      setPage(p)
    } catch (err: any) {
      setError(err.message || 'Failed to load moderation queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(1)
  }, [load])

  const act = async (id: string, action: 'approve' | 'remove') => {
    setBusyId(id)
    setError('')
    try {
      await moderatePost(id, action)
      await load(page)
    } catch (err: any) {
      setError(err.message || `Failed to ${action} post`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader title="Moderation" subtitle={`${total.toLocaleString()} flagged posts awaiting review`} />

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <p className="muted">No flagged posts</p>
      ) : (
        <div className="card-stack">
          {rows.map((r) => (
            <div key={r._id} className="card">
              <div className="toolbar">
                <span className="role-badge">@{r.author?.piUsername || r.author_uid?.slice(0, 12) || 'unknown'}</span>
                <span className="status-badge status-pending">flagged</span>
                <span className="muted">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</span>
              </div>
              <p>{r.content}</p>
              <div className="toolbar">
                <span className="muted">❤️ {r.like_count || 0}</span>
                <span className="muted">💬 {r.comment_count || 0}</span>
                <span className="muted">👁 {r.impression_count || 0}</span>
              </div>
              <div className="actions-cell">
                <button className="btn-approve" disabled={busyId === r._id} onClick={() => act(r._id, 'approve')}>
                  Approve
                </button>
                <button className="btn-reject" disabled={busyId === r._id} onClick={() => act(r._id, 'remove')}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pagination">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</button>
        <span>Page {page} of {pages || 1}</span>
        <button className="btn-secondary" disabled={page >= pages} onClick={() => load(page + 1)}>Next</button>
      </div>
    </>
  )
}