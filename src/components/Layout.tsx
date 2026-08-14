import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'

const appTitle = import.meta.env.VITE_APP_TITLE || 'Zyrachain Admin'

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/users', label: 'Users' },
  { to: '/listings', label: 'Listings' },
  { to: '/communities', label: 'Communities' },
  { to: '/influencers', label: 'Influencers' },
  { to: '/addresses', label: 'Addresses' },
  { to: '/settings', label: 'Settings' },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-title">{appTitle}</div>
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-user">
            {user?.email || 'Admin'}
            <span className="role-badge">{user?.role || '—'}</span>
          </div>
          <button className="link-button" onClick={logout}>
            Sign out
          </button>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function Spinner() {
  return <div className="spinner" />
}

export function ErrorBanner({ message }: { message: string }) {
  return <div className="form-error">{message}</div>
}

export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}