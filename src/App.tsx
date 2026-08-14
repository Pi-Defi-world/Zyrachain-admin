import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './lib/auth-context'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import ListingsPage from './pages/ListingsPage'
import CombinedListPage from './pages/CombinedListPage'
import AddressesPage from './pages/AddressesPage'
import SettingsPage from './pages/SettingsPage'

function Protected({ children }: { children: ReactNode }) {
  const { isAuthenticated, checking } = useAuth()
  if (checking) return <div className="boot-screen">Checking session…</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated, checking } = useAuth()
  const [initial, setInitial] = useState(false)
  useEffect(() => setInitial(true), [])

  if (checking || !initial) return <div className="boot-screen">Loading…</div>

  return (
    <BrowserRouter basename={(import.meta.env.VITE_BASE_PATH || '/').replace(/\/$/, '')}>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="listings" element={<ListingsPage />} />
          <Route
            path="communities"
            element={<CombinedListPage title="Communities" kind="communities" />}
          />
          <Route
            path="influencers"
            element={<CombinedListPage title="Influencers" kind="influencers" />}
          />
          <Route path="addresses" element={<AddressesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}