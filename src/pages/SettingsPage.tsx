import { useState } from 'react'
import { baseURL, runPctScan } from '../lib/api'
import { PageHeader, ErrorBanner } from '../components/Layout'
import { useAuth } from '../lib/auth-context'

export default function SettingsPage() {
  const { user } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState('')

  const runScan = async () => {
    setScanning(true)
    setError('')
    setResult('')
    try {
      const res = await runPctScan()
      if (res.success || res.okay) {
        setResult(
          `Scan complete — ${res.walletsProcessed ?? 0} wallets processed, ` +
            `${res.movementsCreated ?? 0} movements created in ${res.durationMs ?? 0}ms`
        )
      } else if (res.skipped) {
        setResult('Scan skipped (already running).')
      } else {
        setResult(`Scan reported failure: ${res.error || 'unknown'}`)
      }
    } catch (err: any) {
      setError(err.message || 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Server configuration and operations" />

      <div className="card">
        <h2>Signed in as</h2>
        <p>
          {user?.email} — <span className="role-badge">{user?.role}</span>
        </p>
        <p className="muted">
          Permissions: {(user?.permissions?.length ? user.permissions.join(', ') : 'none') as string}
        </p>
      </div>

      <div className="card">
        <h2>API server</h2>
        <p className="mono">{baseURL}</p>
        <p className="muted">
          The admin app connects to the Zyrachain-server. Ensure the server's CORS
          allow-list includes this app's origin and that your JWT secret matches.
        </p>
      </div>

      <div className="card">
        <h2>PCT wallet scan</h2>
        {error && <ErrorBanner message={error} />}
        {result && <p>{result}</p>}
        <button className="btn-primary" disabled={scanning} onClick={runScan}>
          {scanning ? 'Scanning…' : 'Run balance scan now'}
        </button>
      </div>
    </>
  )
}