import { useCallback, useEffect, useState } from 'react'
import { getCommunities, getInfluencers } from '../lib/api'
import type { CombinedResponse } from '../lib/api'
import { PageHeader, Spinner, ErrorBanner } from '../components/Layout'

interface CombinedRow {
  _id?: string
  name?: string
  description?: string
  category?: string
  status?: string
  source?: string
  listingType?: string
  [key: string]: unknown
}

interface Props {
  title: string
  subtitle?: string
  kind: 'communities' | 'influencers'
}

export default function CombinedListPage({ title, subtitle, kind }: Props) {
  const [rows, setRows] = useState<CombinedRow[]>([])
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data: CombinedResponse =
        kind === 'communities' ? await getCommunities() : await getInfluencers()
      const listKey = kind === 'communities' ? 'communities' : 'influencers'
      setRows((data[listKey] as CombinedRow[]) || [])
      setStats(data.stats || null)
    } catch (err: any) {
      setError(err.message || `Failed to load ${kind}`)
    } finally {
      setLoading(false)
    }
  }, [kind])

  useEffect(() => {
    load()
  }, [load])

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />

      {stats && (
        <div className="stat-grid small">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="stat-card">
              <div className="stat-value">{String(v)}</div>
              <div className="stat-label">{k.replace(/_/g, ' ')}</div>
            </div>
          ))}
        </div>
      )}

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <p className="muted">No {kind} found</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r._id || r.name || i}>
                <td>{r.name || '—'}</td>
                <td>{r.category || '—'}</td>
                <td>
                  <span className={`status-badge status-${r.status || 'unknown'}`}>{r.status || '—'}</span>
                </td>
                <td>{(r.source || r.listingType || '—') as string}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}