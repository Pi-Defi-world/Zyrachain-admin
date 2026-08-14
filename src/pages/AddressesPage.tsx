import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../lib/api'
import type { AddressDoc, AddressKind } from '../lib/api'
import { PageHeader, Spinner, ErrorBanner } from '../components/Layout'

const KINDS: AddressKind[] = ['generated', 'cex', 'core-team']

// Field schema per collection. `generated` uses capitalized field names on the
// server; `cex` and `core-team` use lowercase.
const FIELDS: Record<AddressKind, { name: string; label: string; required: boolean }[]> = {
  generated: [
    { name: 'identifier', label: 'Identifier', required: true },
    { name: 'Name', label: 'Name', required: true },
    { name: 'Category', label: 'Category', required: false },
    { name: 'Description', label: 'Description', required: false },
    { name: 'Logo', label: 'Logo', required: false },
    { name: 'Rank', label: 'Rank', required: false },
    { name: 'Website', label: 'Website', required: false },
  ],
  cex: [
    { name: 'identifier', label: 'Identifier', required: true },
    { name: 'name', label: 'Name', required: true },
    { name: 'category', label: 'Category', required: false },
    { name: 'description', label: 'Description', required: false },
    { name: 'logo', label: 'Logo', required: false },
    { name: 'buy', label: 'Buy', required: false },
    { name: 'website', label: 'Website', required: false },
  ],
  'core-team': [
    { name: 'identifier', label: 'Identifier', required: true },
    { name: 'name', label: 'Name', required: true },
    { name: 'description', label: 'Description', required: false },
    { name: 'role', label: 'Role', required: false },
  ],
}

export default function AddressesPage() {
  const [kind, setKind] = useState<AddressKind>('generated')
  const [rows, setRows] = useState<AddressDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<AddressDoc | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async (k: AddressKind) => {
    setLoading(true)
    setError('')
    try {
      const data = await getAddresses(k)
      setRows(data.addresses)
    } catch (err: any) {
      setError(err.message || 'Failed to load addresses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(kind)
  }, [kind, load])

  const switchKind = (k: AddressKind) => {
    setKind(k)
    setEditing(null)
    setShowForm(false)
    load(k)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this address?')) return
    setError('')
    try {
      await deleteAddress(kind, id)
      await load(kind)
    } catch (err: any) {
      setError(err.message || 'Failed to delete')
    }
  }

  return (
    <>
      <PageHeader
        title="Addresses"
        subtitle="Manage generated, CEX, and core-team address collections"
        actions={
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            Add address
          </button>
        }
      />

      <div className="toolbar">
        {KINDS.map((k) => (
          <button key={k} className={`btn-filter ${kind === k ? 'active' : ''}`} onClick={() => switchKind(k)}>
            {k === 'core-team' ? 'Core team' : k.charAt(0).toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : (
        <table className="table">
          <thead>
            <tr>
              {FIELDS[kind].map((f) => (
                <th key={f.name}>{f.label}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r._id)}>
                {FIELDS[kind].map((f) => (
                  <td key={f.name} className="mono">
                    {String(r[f.name] ?? '—')}
                  </td>
                ))}
                <td className="actions-cell">
                  <button
                    className="btn-secondary"
                    onClick={() => { setEditing(r); setShowForm(true) }}
                  >
                    Edit
                  </button>
                  <button className="btn-reject" onClick={() => r._id && handleDelete(String(r._id))}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={FIELDS[kind].length + 1} className="muted">
                  No addresses
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <AddressForm
          kind={kind}
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => { setShowForm(false); setEditing(null); load(kind) }}
        />
      )}
    </>
  )
}

function AddressForm({
  kind,
  editing,
  onClose,
  onSaved,
}: {
  kind: AddressKind
  editing: AddressDoc | null
  onClose: () => void
  onSaved: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const f of FIELDS[kind]) init[f.name] = editing ? String(editing[f.name] ?? '') : ''
    return init
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const required = FIELDS[kind].filter((f) => f.required)
    const missing = required.find((f) => !values[f.name]?.trim())
    if (missing) {
      setError(`${missing.label} is required`)
      setSaving(false)
      return
    }
    try {
      if (editing?._id) await updateAddress(kind, String(editing._id), values)
      else await createAddress(kind, values)
      onSaved()
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <h2>{editing ? 'Edit address' : 'Add address'}</h2>
        {FIELDS[kind].map((f) => (
          <label key={f.name}>
            {f.label} {f.required && <span className="required">*</span>}
            <input
              value={values[f.name] ?? ''}
              onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
            />
          </label>
        ))}
        {error && <ErrorBanner message={error} />}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}