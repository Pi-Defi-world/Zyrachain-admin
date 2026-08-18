import { useCallback, useEffect, useState } from 'react'
import { getAdminActivity } from '../lib/api'
import type { ActivityRow } from '../lib/api'
import { PageHeader, Spinner, ErrorBanner } from '../components/Layout'

const ACTION_TYPES = ['login', 'logout', 'create', 'update', 'delete', 'view', 'config']

export default function ActivityPage() {
  const [rows, setRows] = useState<ActivityRow[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionType, setActionType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminActivity({ page: p, limit: 30, actionType: actionType || undefined })
      setRows(data.data)
      setTotal(data.pagination.total)
      setPages(data.pagination.pages)
      setPage(p)
    } catch (err: any) {
      setError(err.message || 'Failed to load activity log')
    } finally {
      setLoading(false)
    }
  }, [actionType])

  useEffect(() => {
    load(1)
  }, [load])

  return (
    <>
      <PageHeader title="Activity Log" subtitle={`${total.toLocaleString()} admin actions recorded`} />

      <div className="toolbar">
        <select value={actionType} onChange={(e) => setActionType(e.target.value)}>
          <option value="">All action types</option>
          {ACTION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <p className="muted">No activity</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Action</th>
              <th>Type</th>
              <th>Target</th>
              <th>IP</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td>{r.adminUser?.email || r.adminUser?.username || '—'}</td>
                <td>{r.action || '—'}</td>
                <td>
                  <span className={`status-badge ${r.success === false ? 'status-rejected' : 'status-normal'}`}>
                    {r.actionType || '—'}
                  </span>
                </td>
                <td>{r.targetName || r.targetId || r.targetType || '—'}</td>
                <td className="mono">{r.ipAddress || '—'}</td>
                <td>{r.timestamp ? new Date(r.timestamp).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</button>
        <span>Page {page} of {pages || 1}</span>
        <button className="btn-secondary" disabled={page >= pages} onClick={() => load(page + 1)}>Next</button>
      </div>
    </>
  )
}