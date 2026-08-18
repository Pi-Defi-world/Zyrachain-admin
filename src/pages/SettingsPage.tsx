import { useEffect, useState } from 'react'
import { baseURL, runPctScan, getPlatformSettings, updatePlatformSettings } from '../lib/api'
import type { PlatformSettings, StreakMilestone } from '../lib/api'
import { PageHeader, ErrorBanner, Spinner } from '../components/Layout'
import { useAuth } from '../lib/auth-context'

export default function SettingsPage() {
  const { user } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState('')

  const [settingsLoading, setSettingsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string[]>([])
  const [settings, setSettings] = useState<PlatformSettings | null>(null)

  useEffect(() => {
    getPlatformSettings()
      .then((res) => setSettings(res.settings))
      .catch((err: any) => setError(err.message || 'Failed to load settings'))
      .finally(() => setSettingsLoading(false))
  }, [])

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

  const setMilestone = (i: number, field: keyof StreakMilestone, value: number) => {
    if (!settings) return
    const next = [...settings.streak_milestones]
    next[i] = { ...next[i], [field]: value }
    setSettings({ ...settings, streak_milestones: next })
  }

  const addMilestone = () => {
    if (!settings) return
    const last = settings.streak_milestones[settings.streak_milestones.length - 1]
    setSettings({
      ...settings,
      streak_milestones: [...settings.streak_milestones, { days: (last?.days ?? 0) + 7, zp: 0 }],
    })
  }

  const removeMilestone = (i: number) => {
    if (!settings) return
    setSettings({
      ...settings,
      streak_milestones: settings.streak_milestones.filter((_, idx) => idx !== i),
    })
  }

  const save = async () => {
    if (!settings) return
    setSaving(true)
    setError('')
    setSaved([])
    try {
      const sorted = [...settings.streak_milestones].sort((a, b) => a.days - b.days)
      const res = await updatePlatformSettings({
        zp_per_pi: settings.zp_per_pi,
        platform_fee_rate: settings.platform_fee_rate,
        referral_reward_zp: settings.referral_reward_zp,
        streak_milestones: sorted,
      })
      setSettings(res.settings)
      setSaved(res.updated || [])
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
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
        <h2>Economy settings</h2>
        <p className="muted">
          These values drive tipping, boosts, referrals, streaks, and Pi→ZP purchases. Changes take
          effect immediately (server cache refreshes within 30s).
        </p>

        {error && <ErrorBanner message={error} />}
        {saved.length > 0 && (
          <p>Updated: {saved.join(', ')}</p>
        )}

        {settingsLoading ? (
          <Spinner />
        ) : settings ? (
          <>
            <div className="form-grid">
              <label>
                <span>ZP per Pi (conversion)</span>
                <input
                  type="number"
                  min="0.001"
                  max="100000"
                  step="any"
                  value={settings.zp_per_pi}
                  onChange={(e) => setSettings({ ...settings, zp_per_pi: Number(e.target.value) })}
                />
              </label>
              <label>
                <span>Platform fee rate (0–0.99)</span>
                <input
                  type="number"
                  min="0"
                  max="0.99"
                  step="any"
                  value={settings.platform_fee_rate}
                  onChange={(e) => setSettings({ ...settings, platform_fee_rate: Number(e.target.value) })}
                />
              </label>
              <label>
                <span>Referral reward (ZP)</span>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="any"
                  value={settings.referral_reward_zp}
                  onChange={(e) => setSettings({ ...settings, referral_reward_zp: Number(e.target.value) })}
                />
              </label>
            </div>

            <h3 className="form-subhead">Streak milestone rewards</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Days</th>
                  <th>ZP reward</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {settings.streak_milestones.map((m, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={m.days}
                        onChange={(e) => setMilestone(i, 'days', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={m.zp}
                        onChange={(e) => setMilestone(i, 'zp', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <button className="btn-danger" onClick={() => removeMilestone(i)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {settings.streak_milestones.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted">
                      No milestones — streaks will award no ZP.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <button className="btn-secondary" onClick={addMilestone}>
              + Add milestone
            </button>

            <div className="form-actions">
              <button className="btn-primary" disabled={saving} onClick={save}>
                {saving ? 'Saving…' : 'Save economy settings'}
              </button>
            </div>
          </>
        ) : null}
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