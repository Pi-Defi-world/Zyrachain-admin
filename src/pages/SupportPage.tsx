import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  getContactInquiries,
  getScamReports,
  updateContactInquiry,
  updateScamReport,
} from '../lib/api'
import type { ContactInquiryRow, ScamReportRow } from '../lib/api'
import { PageHeader, Spinner, ErrorBanner } from '../components/Layout'

type Tab = 'contact' | 'scam'

const CONTACT_STATUSES = ['new', 'in_progress', 'resolved', 'closed']
const REPORT_STATUSES = ['new', 'under_review', 'resolved', 'dismissed']
const PRIORITIES = ['low', 'normal', 'high', 'urgent']

export default function SupportPage() {
  const [tab, setTab] = useState<Tab>('contact')

  return (
    <>
      <PageHeader title="Support" subtitle="Contact inquiries and scam reports from the frontend" />

      <div className="toolbar">
        {(['contact', 'scam'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`btn-filter ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'contact' ? 'Contact Inquiries' : 'Scam Reports'}
          </button>
        ))}
      </div>

      {tab === 'contact' ? <ContactTab /> : <ScamTab />}
    </>
  )
}

function ContactTab() {
  const [rows, setRows] = useState<ContactInquiryRow[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<ContactInquiryRow | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError('')
    try {
      const data = await getContactInquiries({
        page: p,
        limit: 20,
        status: status || undefined,
        priority: priority || undefined,
      })
      setRows(data.data.inquiries)
      setTotal(data.data.pagination.total)
      setPages(data.data.pagination.pages)
      setPage(p)
    } catch (err: any) {
      setError(err.message || 'Failed to load inquiries')
    } finally {
      setLoading(false)
    }
  }, [status, priority])

  useEffect(() => {
    load(1)
  }, [load])

  return (
    <>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {CONTACT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <p className="muted">No inquiries</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>From</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Received</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td>{r.name ? `${r.name} <${r.email}>` : r.email || '—'}</td>
                <td>{r.subject || '—'}</td>
                <td>
                  <span className={`status-badge status-${r.status || 'new'}`}>{r.status || 'new'}</span>
                </td>
                <td>
                  <span className={`status-badge status-${r.priority || 'normal'}`}>{r.priority || 'normal'}</span>
                </td>
                <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
                <td className="actions-cell">
                  <button className="btn-secondary" onClick={() => setEditing(r)}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</button>
        <span>Page {page} of {pages || 1} · {total} total</span>
        <button className="btn-secondary" disabled={page >= pages} onClick={() => load(page + 1)}>Next</button>
      </div>

      {editing && (
        <DetailModal
          title={`Inquiry from ${editing.name || editing.email || 'unknown'}`}
          body={editing.message || ''}
          status={editing.status || 'new'}
          priority={editing.priority || 'normal'}
          notes={editing.adminNotes || ''}
          statuses={CONTACT_STATUSES}
          priorities={PRIORITIES}
          meta={
            <>
              <p className="muted">Email: {editing.email || '—'}</p>
              <p className="muted">IP: {editing.ipAddress || '—'}</p>
              <p className="muted">UA: {editing.userAgent || '—'}</p>
            </>
          }
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            await updateContactInquiry(editing._id, patch)
            setEditing(null)
            await load(page)
          }}
        />
      )}
    </>
  )
}

function ScamTab() {
  const [rows, setRows] = useState<ScamReportRow[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<ScamReportRow | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError('')
    try {
      const data = await getScamReports({ page: p, limit: 20, status: status || undefined })
      setRows(data.data.reports)
      setTotal(data.data.pagination.total)
      setPages(data.data.pagination.pages)
      setPage(p)
    } catch (err: any) {
      setError(err.message || 'Failed to load scam reports')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load(1)
  }, [load])

  return (
    <>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {REPORT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <p className="muted">No scam reports</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Wallet</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Received</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td>
                  <span className="type-badge type-business">{r.scamType || '—'}</span>
                </td>
                <td className="mono">{r.walletAddress?.slice(0, 16) || '—'}</td>
                <td>
                  <span className={`status-badge status-${r.status || 'new'}`}>{r.status || 'new'}</span>
                </td>
                <td>
                  <span className={`status-badge status-${r.priority || 'normal'}`}>{r.priority || 'normal'}</span>
                </td>
                <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
                <td className="actions-cell">
                  <button className="btn-secondary" onClick={() => setEditing(r)}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</button>
        <span>Page {page} of {pages || 1} · {total} total</span>
        <button className="btn-secondary" disabled={page >= pages} onClick={() => load(page + 1)}>Next</button>
      </div>

      {editing && (
        <DetailModal
          title={`Scam report: ${editing.scamType || 'unknown'}`}
          body={editing.description || ''}
          status={editing.status || 'new'}
          priority={editing.priority || 'normal'}
          notes={editing.adminNotes || ''}
          statuses={REPORT_STATUSES}
          priorities={PRIORITIES}
          meta={
            <>
              <p className="muted">Wallet: {editing.walletAddress || '—'}</p>
              <p className="muted">Evidence: {editing.evidence || '—'}</p>
              <p className="muted">Contact: {editing.reporterContact || '—'}</p>
              <p className="muted">IP: {editing.ipAddress || '—'}</p>
            </>
          }
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            await updateScamReport(editing._id, patch)
            setEditing(null)
            await load(page)
          }}
        />
      )}
    </>
  )
}

interface DetailModalProps {
  title: string
  body: string
  status: string
  priority: string
  notes: string
  statuses: string[]
  priorities: string[]
  meta: ReactNode
  onClose: () => void
  onSave: (patch: { status: string; priority: string; notes: string }) => Promise<void>
}

function DetailModal({ title, body, status, priority, notes, statuses, priorities, meta, onClose, onSave }: DetailModalProps) {
  const [s, setS] = useState(status)
  const [p, setP] = useState(priority)
  const [n, setN] = useState(notes)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await onSave({ status: s, priority: p, notes: n })
    } catch (err: any) {
      setError(err.message || 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p className="muted">{body}</p>
        {meta}
        <div className="form-grid">
          <label>
            Status
            <select value={s} onChange={(e) => setS(e.target.value)}>
              {statuses.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select value={p} onChange={(e) => setP(e.target.value)}>
              {priorities.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Admin notes
          <textarea value={n} onChange={(e) => setN(e.target.value)} rows={3} />
        </label>
        {error && <ErrorBanner message={error} />}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}