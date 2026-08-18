import { useCallback, useEffect, useState } from 'react'
import { getUsers, updateUser } from '../lib/api'
import type { AdminUserRow } from '../lib/api'
import { PageHeader, Spinner, ErrorBanner } from '../components/Layout'

const ROLES = ['reader', 'author', 'editor', 'admin']

export default function UsersPage() {
  const [rows, setRows] = useState<AdminUserRow[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const load = useCallback(async (p = 1, q = search, r = role) => {
    setLoading(true)
    setError('')
    try {
      const data = await getUsers({ page: p, limit: 20, search: q || undefined, role: r || undefined })
      setRows(data.users)
      setTotal(data.pagination.total)
      setPages(data.pagination.pages)
      setPage(p)
      const next: Record<string, string> = {}
      for (const u of data.users) next[u._id] = u.role || 'reader'
      setDrafts(next)
    } catch (err: any) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [search, role])

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveRole = async (u: AdminUserRow) => {
    const role = drafts[u._id]
    if (!role || role === (u.role || 'reader')) return
    setBusyId(u._id)
    setError('')
    try {
      await updateUser(u._id, { role })
      await load(page)
    } catch (err: any) {
      setError(err.message || 'Failed to update role')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader title="Users" subtitle={`${total.toLocaleString()} total`} />

      <div className="toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1)}
          placeholder="Search piUsername, UID, addresses…"
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            load(1, search, e.target.value)
          }}
          className="role-filter"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u._id}>
                <td>{u.piUsername || '—'}</td>
                <td className="mono">{u.user_uid?.slice(0, 18)}…</td>
                <td className="mono">{u.from_address?.slice(0, 12) || '—'}</td>
                <td>
                  <select
                    value={drafts[u._id] ?? u.role ?? 'reader'}
                    onChange={(e) => setDrafts((d) => ({ ...d, [u._id]: e.target.value }))}
                    disabled={busyId === u._id}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                <td className="actions-cell">
                  <button
                    className="btn-approve"
                    disabled={busyId === u._id || (drafts[u._id] ?? u.role ?? 'reader') === (u.role || 'reader')}
                    onClick={() => saveRole(u)}
                  >
                    {busyId === u._id ? '…' : 'Save'}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
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