import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestOtp, verifyOtp, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth-context'

const appTitle = import.meta.env.VITE_APP_TITLE || 'Zyrachain Admin'
const defaultEmail = import.meta.env.VITE_ADMIN_EMAIL || 'zyrachains@gmail.com'
const defaultRole = import.meta.env.VITE_ADMIN_ROLE || 'super_admin'
const otpHint = import.meta.env.VITE_OTP_RETRY_HINT || 60

const ROLES = ['super_admin', 'admin', 'moderator']

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const [email, setEmail] = useState(defaultEmail)
  const [role, setRole] = useState(defaultRole)
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await requestOtp({ email, role })
      if (res.requiresOTP) setStep(2)
      else setError(res.message || 'No response from server')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to request OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await verifyOtp({ email, role, otp: otp.trim() })
      if (res.success && res.token && res.user) {
        setUser(res.user)
        navigate('/', { replace: true })
      } else {
        setError(res.message || 'Verification failed')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={step === 1 ? handleRequestOtp : handleVerify}>
        <div className="login-logo">{appTitle}</div>

        <label>
          Admin email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={step === 2}
            placeholder="admin@example.com"
          />
        </label>

        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)} disabled={step === 2}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        {step === 2 && (
          <label>
            OTP code (6 digits)
            <input
              type="text"
              required
              maxLength={6}
              inputMode="numeric"
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
            />
          </label>
        )}

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading
            ? 'Please wait…'
            : step === 1
              ? 'Request OTP'
              : 'Verify & Sign in'}
        </button>

        {step === 1 && (
          <p className="login-hint">
            A 6-digit code is emailed to the address above and expires in 10 minutes.
            You may retry after ~{String(otpHint)}s.
          </p>
        )}

        {step === 2 && (
          <button type="button" className="link-button" onClick={() => setStep(1)}>
            ← Back to email
          </button>
        )}
      </form>
    </div>
  )
}