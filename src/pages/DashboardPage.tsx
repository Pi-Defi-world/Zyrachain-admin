import { useEffect, useState } from 'react'
import { getAnalytics, getUsers, getListings, health } from '../lib/api'
import type { AnalyticsResponse } from '../lib/api'
import { PageHeader, Spinner, ErrorBanner, StatCard } from '../components/Layout'

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse['analytics'] | null>(null)
  const [userTotal, setUserTotal] = useState<number | null>(null)
  const [listingCount, setListingCount] = useState<number | null>(null)
  const [server, setServer] = useState<{ status?: string; uptime?: number } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const [a, u, l, h] = await Promise.all([
          getAnalytics('7d'),
          getUsers({ page: 1, limit: 1 }),
          getListings(),
          health().catch(() => null),
        ])
        setAnalytics(a.analytics)
        setUserTotal(u.pagination.total)
        setListingCount(l.listings.length)
        setServer(h)
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard')
      }
    })()
  }, [])

  if (error) return <ErrorBanner message={error} />

  const total = analytics?.users?.total?.[0]?.count ?? 0
  const recent = analytics?.users?.recent?.[0]?.count ?? 0
  const byStatus = analytics?.users?.byStatus ?? []
  const activity = analytics?.activity ?? []

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of the Zyrachain platform" />

      {!analytics ? (
        <Spinner />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Total users" value={total.toLocaleString()} />
            <StatCard label="New users (7d)" value={recent.toLocaleString()} />
            <StatCard label="All users (list)" value={(userTotal ?? 0).toLocaleString()} />
            <StatCard label="Listings" value={(listingCount ?? 0).toLocaleString()} />
            <StatCard
              label="Server"
              value={
                server?.status === 'OK' ? (
                  'Online'
                ) : (
                  <span className="muted">Unreachable</span>
                )
              }
            />
            {server?.uptime ? (
              <StatCard label="Server uptime" value={`${Math.round(server.uptime / 3600)}h`} />
            ) : (
              <StatCard label="Server uptime" value="—" />
            )}
          </div>

          <div className="two-col">
            <div className="card">
              <h2>Users by status</h2>
              {byStatus.length === 0 ? (
                <p className="muted">No data</p>
              ) : (
                <table className="table">
                  <tbody>
                    {byStatus.map((row) => (
                      <tr key={row._id}>
                        <td>{row._id}</td>
                        <td className="num">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <h2>Admin activity (7d)</h2>
              {activity.length === 0 ? (
                <p className="muted">No activity recorded</p>
              ) : (
                <table className="table">
                  <tbody>
                    {activity.slice(0, 15).map((row) => (
                      <tr key={row._id}>
                        <td>{row._id}</td>
                        <td className="num">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}