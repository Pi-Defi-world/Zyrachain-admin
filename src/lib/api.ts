// Zyrachain admin API client.
// Talks to the Zyrachain-server admin routes (see ADMIN_API_GUIDE.md).
// IMPORTANT: do NOT set a custom `X-Client` header — it is not in the
// server's CORS allowedHeaders and would be rejected by the preflight.

export interface AdminUser {
  id: string
  username?: string
  name?: string
  email: string
  role: string
  permissions?: string[]
}

const baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '')
const timeoutMs = Number(import.meta.env.VITE_API_TIMEOUT || 30000)

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('zadmin_token')
}

export function setToken(token: string | null): void {
  if (!token) window.localStorage.removeItem('zadmin_token')
  else window.localStorage.setItem('zadmin_token', token)
}

export function getStoredUser(): AdminUser | null {
  try {
    const raw = window.localStorage.getItem('zadmin_user')
    return raw ? (JSON.parse(raw) as AdminUser) : null
  } catch {
    return null
  }
}

export function setStoredUser(user: AdminUser | null): void {
  if (!user) window.localStorage.removeItem('zadmin_user')
  else window.localStorage.setItem('zadmin_user', JSON.stringify(user))
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const token = getToken()
    const res = await fetch(`${baseURL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })

    // On 401, the token is stale — clear it (the interceptor equivalent of
    // the server admin-api-client behaviour).
    if (res.status === 401) setToken(null)

    let data: any = null
    try {
      data = await res.json()
    } catch {
      /* non-JSON body */
    }

    if (!res.ok) {
      const msg =
        data?.message ||
        data?.error ||
        data?.detail ||
        (typeof data === 'string' ? data : `HTTP ${res.status}`)
      throw new ApiError(res.status, msg)
    }
    return data as T
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthOtpRequest {
  email: string
  role: string
}

export interface AuthOtpResponse {
  success: boolean
  message?: string
  requiresOTP?: boolean
}

export interface AuthVerifyResponse {
  success: boolean
  token?: string
  user?: AdminUser
  message?: string
}

/** Step 1 — request a 6-digit OTP for a whitelisted admin email. */
export async function requestOtp(payload: AuthOtpRequest): Promise<AuthOtpResponse> {
  return request<AuthOtpResponse>('/api/admin/auth', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Step 2 — verify the OTP and receive a 24h JWT. */
export async function verifyOtp(payload: AuthOtpRequest & { otp: string }): Promise<AuthVerifyResponse> {
  const data = await request<AuthVerifyResponse>('/api/admin/auth', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (data.token) {
    setToken(data.token)
    if (data.user) setStoredUser(data.user)
  }
  return data
}

/** Validate the stored JWT with the server. */
export async function checkAuth(): Promise<{ success: boolean; user?: AdminUser }> {
  const token = getToken()
  if (!token) return { success: false }
  try {
    const data = await request<{ success: boolean; user: AdminUser }>('/api/admin/auth/check')
    setStoredUser(data.user)
    return { success: true, user: data.user }
  } catch {
    return { success: false }
  }
}

export function logout(): void {
  setToken(null)
  setStoredUser(null)
}

// ---------------------------------------------------------------------------
// Dashboard / analytics
// ---------------------------------------------------------------------------

export interface AnalyticsResponse {
  success: boolean
  analytics: {
    users: {
      total: { count: number }[]
      recent: { count: number }[]
      byStatus: { _id: string; count: number }[]
    }
    activity: { _id: string; count: number }[]
    period: string
  }
}

export async function getAnalytics(period = '7d'): Promise<AnalyticsResponse> {
  return request<AnalyticsResponse>(`/api/admin/analytics?period=${encodeURIComponent(period)}`)
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface AdminUserRow {
  _id: string
  user_uid: string
  piUsername: string
  from_address?: string
  to_address?: string
  role?: string
  avatar?: string
  bio?: string
  piAuthenticatedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface UsersResponse {
  success: boolean
  users: AdminUserRow[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export async function getUsers(params: {
  page?: number
  limit?: number
  search?: string
  status?: string
} = {}): Promise<UsersResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  if (params.search) q.set('search', params.search)
  if (params.status) q.set('status', params.status)
  const qs = q.toString()
  return request<UsersResponse>(`/api/admin/users${qs ? `?${qs}` : ''}`)
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export interface ListingRow {
  _id: string
  listingType: 'startup' | 'business' | 'community' | 'influencer'
  name?: string
  category?: string
  description?: string
  status?: string
  submittedAt?: string
  reviewedAt?: string
  reviewNotes?: string
  contactEmail?: string
  email?: string
  website?: string
  [key: string]: unknown
}

export interface ListingsResponse {
  success: boolean
  listings: ListingRow[]
}

export async function getListings(): Promise<ListingsResponse> {
  return request<ListingsResponse>('/api/admin/listings')
}

export async function updateListingStatus(
  id: string,
  action: 'approve' | 'reject',
  reviewNotes?: string
): Promise<{ success: boolean; message?: string }> {
  return request(`/api/admin/listings/${id}`, {
    method: 'POST',
    body: JSON.stringify({ action, reviewNotes }),
  })
}

// ---------------------------------------------------------------------------
// Communities & influencers (combined)
// ---------------------------------------------------------------------------

export interface CombinedResponse {
  success: boolean
  [key: string]: unknown
  stats?: { total: number; main: number; listings: number; approved: number; pending: number; rejected: number }
}

export async function getCommunities(status?: string, limit = 100): Promise<CombinedResponse> {
  const q = new URLSearchParams({ limit: String(limit) })
  if (status) q.set('status', status)
  return request(`/api/admin/communities/combined?${q.toString()}`)
}

export async function getInfluencers(status?: string, limit = 100): Promise<CombinedResponse> {
  const q = new URLSearchParams({ limit: String(limit) })
  if (status) q.set('status', status)
  return request(`/api/admin/influencers/combined?${q.toString()}`)
}

export interface AddressDoc {
  _id?: string
  identifier?: string
  [key: string]: unknown
}

export type AddressKind = 'generated' | 'cex' | 'core-team'

export async function getAddresses(kind: AddressKind): Promise<{ success: boolean; addresses: AddressDoc[] }> {
  return request(`/api/admin/addresses/${kind}`)
}

export async function createAddress(kind: AddressKind, payload: Record<string, unknown>): Promise<{ success: boolean; message?: string; address?: AddressDoc }> {
  return request(`/api/admin/addresses/${kind}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateAddress(kind: AddressKind, id: string, payload: Record<string, unknown>): Promise<{ success: boolean; message?: string; address?: AddressDoc }> {
  return request(`/api/admin/addresses/${kind}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteAddress(kind: AddressKind, id: string): Promise<{ success: boolean; message?: string }> {
  return request(`/api/admin/addresses/${kind}/${id}`, { method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// Server liveness (no auth) + pct monitor
// ---------------------------------------------------------------------------

export async function health(): Promise<{ status?: string; uptime?: number; environment?: string }> {
  return request('/health')
}

export async function runPctScan(): Promise<{
  success?: boolean
  okay?: boolean
  skipped?: boolean
  walletsProcessed?: number
  walletsFailed?: number
  eventsCreated?: number
  movementsCreated?: number
  durationMs?: number
  error?: string
}> {
  return request(`/api/admin/pct-monitor/run-scan`, { method: 'POST' })
}

export { baseURL }