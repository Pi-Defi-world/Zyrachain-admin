import { useCallback, useEffect, useState } from 'react'
import { getUsers } from '../lib/api'
import type { AdminUserRow } from '../lib/api'
import { PageHeader, Spinner, ErrorBanner } from '../components/Layout'

export default function UsersPage() {
  const [rows, setRows] = useState<AdminUserRow[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (p = 1, q = search) => {
    setLoading(true)
    setError('')
    try {
      const data = await getUsers({ page: p, limit: 20, search: q || undefined })
      setRows(data.users)
      setTotal(data.pagination.total)
      setPages(data.pagination.pages)
      setPage(p)
    } catch (err: any) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <PageHeader title="Users" subtitle={`${total.toLocaleString()} total`} />

      <div className="toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1)}
          placeholder="Search piUsername…"
        />
        <button className="btn-secondary" onClick={() => load(1)}>
          Search
        </button>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Pi username</th>
              <th>UID</th>
              <th>From address</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u._id}>
                <td>{u.piUsername || '—'}</td>
                <td className="mono">{u.user_uid?.slice(0, 18)}…</td>
                <td className="mono">{u.from_address?.slice(0, 12) || '—'}</td>
                <td>{u.role || 'user'}</td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => load(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {pages || 1}
        </span>
        <button className="btn-secondary" disabled={page >= pages} onClick={() => load(page + 1)}>
          Next
        </button>
      </div>
    </>
  )
}