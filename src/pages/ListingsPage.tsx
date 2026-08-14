import { useEffect, useState } from 'react'
import { getListings, updateListingStatus } from '../lib/api'
import type { ListingRow } from '../lib/api'
import { PageHeader, Spinner, ErrorBanner } from '../components/Layout'

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export default function ListingsPage() {
  const [rows, setRows] = useState<ListingRow[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getListings()
      setRows(data.listings)
    } catch (err: any) {
      setError(err.message || 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = rows.filter((r) => filter === 'all' || (r.status || 'pending') === filter)

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id)
    setError('')
    try {
      await updateListingStatus(id, action)
      await load()
    } catch (err: any) {
      setError(err.message || `Failed to ${action} listing`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader title="Listings" subtitle="Approve or reject submitted ecosystem listings" />

      <div className="toolbar">
        {(['all', 'pending', 'approved', 'rejected'] as Filter[]).map((f) => (
          <button
            key={f}
            className={`btn-filter ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <p className="muted">No listings</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r._id}>
                <td className="badge-cell">
                  <span className={`type-badge type-${r.listingType}`}>{r.listingType}</span>
                </td>
                <td>{r.name || r.contactEmail || '—'}</td>
                <td>{r.category || '—'}</td>
                <td>
                  <span className={`status-badge status-${r.status || 'pending'}`}>{r.status || 'pending'}</span>
                </td>
                <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
                <td className="actions-cell">
                  {r.status !== 'approved' && (
                    <button className="btn-approve" disabled={busyId === r._id} onClick={() => act(r._id, 'approve')}>
                      Approve
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button className="btn-reject" disabled={busyId === r._id} onClick={() => act(r._id, 'reject')}>
                      Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}