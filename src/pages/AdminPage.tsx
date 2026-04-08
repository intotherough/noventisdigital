import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createClient,
  deleteClient,
  getAuthErrorMessage,
  getCurrentAdmin,
  listAdminClients,
  listAuditLogs,
  resetClientPassword,
  signInAdmin,
  signOutAdmin,
  updateClient,
  uploadClientPack,
} from '../lib/adminService'
import { formatDateTime } from '../lib/formatting'
import type {
  AdminClientRecord,
  AdminUser,
  AuditLogRecord,
  CreateClientInput,
} from '../types'

const defaultCreateForm: CreateClientInput = {
  email: '',
  password: '',
  fullName: '',
  company: '',
  role: 'Client',
}

function prettifyEventType(value: string) {
  return value.replace(/_/g, ' ')
}

export function AdminPage() {
  const [booting, setBooting] = useState(true)
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [clients, setClients] = useState<AdminClientRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginPending, setLoginPending] = useState(false)
  const [signOutPending, setSignOutPending] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [createPending, setCreatePending] = useState(false)
  const [updatePending, setUpdatePending] = useState(false)
  const [resetPending, setResetPending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [uploadPending, setUploadPending] = useState(false)
  const [createForm, setCreateForm] = useState<CreateClientInput>(defaultCreateForm)
  const [editEmail, setEditEmail] = useState('')
  const [editName, setEditName] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editRole, setEditRole] = useState('')
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [packTitle, setPackTitle] = useState('')
  const [packSummary, setPackSummary] = useState('')
  const [packStatus, setPackStatus] = useState('Awaiting approval')
  const [packValidUntil, setPackValidUntil] = useState('')
  const [packTimeline, setPackTimeline] = useState('TBC')
  const [packNotes, setPackNotes] = useState('')
  const [packAmount, setPackAmount] = useState('0')
  const [packScope, setPackScope] = useState('')
  const [packLabel, setPackLabel] = useState('')
  const [packDescription, setPackDescription] = useState('')
  const [packFile, setPackFile] = useState<File | null>(null)

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? clients[0] ?? null,
    [clients, selectedClientId],
  )

  async function refreshDashboardData() {
    setLoadingData(true)

    try {
      const [nextClients, nextAuditLogs] = await Promise.all([
        listAdminClients(),
        listAuditLogs(100),
      ])

      setClients(nextClients)
      setAuditLogs(nextAuditLogs)
      setLocalError(null)
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    let isActive = true

    void (async () => {
      try {
        const nextAdmin = await getCurrentAdmin()

        if (!isActive) {
          return
        }

        setAdmin(nextAdmin)

        if (nextAdmin) {
          await refreshDashboardData()
        }
      } catch (error) {
        if (isActive) {
          setLocalError(getAuthErrorMessage(error))
        }
      } finally {
        if (isActive) {
          setBooting(false)
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!selectedClient) {
      setSelectedClientId(null)
      return
    }

    setSelectedClientId((current) =>
      current && clients.some((client) => client.id === current)
        ? current
        : selectedClient.id,
    )
  }, [clients, selectedClient])

  useEffect(() => {
    if (!selectedClient) {
      setEditEmail('')
      setEditName('')
      setEditCompany('')
      setEditRole('')
      setResetPasswordValue('')
      setPackTitle('')
      setPackSummary('')
      setPackStatus('Awaiting approval')
      setPackValidUntil('')
      setPackTimeline('TBC')
      setPackNotes('')
      setPackAmount('0')
      setPackScope('')
      setPackLabel('')
      setPackDescription('')
      setPackFile(null)
      return
    }

    setEditEmail(selectedClient.email)
    setEditName(selectedClient.name)
    setEditCompany(selectedClient.company)
    setEditRole(selectedClient.role)
    setResetPasswordValue('')
    setPackTitle(`${selectedClient.company} proposal pack`)
    setPackSummary(`PDF collateral and project material for ${selectedClient.company}.`)
    setPackStatus('Awaiting approval')
    setPackValidUntil('')
    setPackTimeline('TBC')
    setPackNotes('')
    setPackAmount('0')
    setPackScope('')
    setPackLabel(`${selectedClient.company} proposal pack`)
    setPackDescription(`Private client pack for ${selectedClient.company}.`)
    setPackFile(null)
  }, [selectedClient])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)
    setStatusMessage(null)
    setLoginPending(true)

    try {
      const nextAdmin = await signInAdmin(email, password)
      setAdmin(nextAdmin)
      await refreshDashboardData()
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setLoginPending(false)
    }
  }

  const handleSignOut = async () => {
    setSignOutPending(true)
    setStatusMessage(null)

    try {
      await signOutAdmin()
      setAdmin(null)
      setClients([])
      setAuditLogs([])
      setSelectedClientId(null)
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setSignOutPending(false)
    }
  }

  const handleCreateClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)
    setStatusMessage(null)
    setCreatePending(true)

    try {
      const nextClient = await createClient(createForm)
      await refreshDashboardData()
      if (nextClient?.id) {
        setSelectedClientId(nextClient.id)
      }
      setCreateForm(defaultCreateForm)
      setStatusMessage(`Created ${nextClient?.email ?? 'client account'}.`)
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setCreatePending(false)
    }
  }

  const handleUpdateClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedClient) {
      return
    }

    setLocalError(null)
    setStatusMessage(null)
    setUpdatePending(true)

    try {
      await updateClient({
        userId: selectedClient.id,
        email: editEmail,
        fullName: editName,
        company: editCompany,
        role: editRole,
      })
      await refreshDashboardData()
      setStatusMessage(`Updated ${editEmail}.`)
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setUpdatePending(false)
    }
  }

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedClient) {
      return
    }

    setLocalError(null)
    setStatusMessage(null)
    setResetPending(true)

    try {
      await resetClientPassword({
        userId: selectedClient.id,
        password: resetPasswordValue,
      })
      await refreshDashboardData()
      setResetPasswordValue('')
      setStatusMessage(`Password reset for ${selectedClient.email}.`)
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setResetPending(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!selectedClient) {
      return
    }

    const confirmed = window.confirm(
      `Delete ${selectedClient.email}? This removes their login, quotes and stored files.`,
    )

    if (!confirmed) {
      return
    }

    setLocalError(null)
    setStatusMessage(null)
    setDeletePending(true)

    try {
      await deleteClient(selectedClient.id)
      await refreshDashboardData()
      setSelectedClientId(null)
      setStatusMessage(`Deleted ${selectedClient.email}.`)
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setDeletePending(false)
    }
  }

  const handleUploadPack = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedClient || !packFile) {
      setLocalError('Select a client and choose a PDF file first.')
      return
    }

    setLocalError(null)
    setStatusMessage(null)
    setUploadPending(true)

    try {
      await uploadClientPack({
        userId: selectedClient.id,
        title: packTitle,
        summary: packSummary,
        status: packStatus,
        validUntil: packValidUntil,
        timeline: packTimeline,
        notes: packNotes,
        totalAmount: Number(packAmount) || 0,
        scope: packScope
          .split(/[\n,]/g)
          .map((entry) => entry.trim())
          .filter(Boolean),
        documentLabel: packLabel,
        documentDescription: packDescription,
        file: packFile,
      })
      await refreshDashboardData()
      setPackFile(null)
      setStatusMessage(`Uploaded a new pack for ${selectedClient.email}.`)
    } catch (error) {
      setLocalError(getAuthErrorMessage(error))
    } finally {
      setUploadPending(false)
    }
  }

  if (booting) {
    return (
      <div className="portal-shell">
        <main className="container admin-main-shell">
          <div className="loading-panel">Checking admin session...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="portal-shell">
      <header className="portal-header container">
        <Link className="brand-lockup" to="/">
          <span aria-hidden="true" className="brand-mark" />
          <span className="brand-copy">
            <strong>NOVENTIS</strong>
            <span>Admin console</span>
          </span>
        </Link>

        <div className="portal-header-actions">
          <span className="mode-badge">Admin console</span>
          <Link className="ghost-button" to="/">
            Back to site
          </Link>
          {admin ? (
            <button
              className="ghost-button"
              disabled={signOutPending}
              onClick={handleSignOut}
              type="button"
            >
              {signOutPending ? 'Signing out...' : 'Sign out'}
            </button>
          ) : null}
        </div>
      </header>

      <main className="container admin-main-shell">
        {!admin ? (
          <section className="portal-login-grid portal-login-grid--kinetic">
            <div className="portal-login-copy">
              <p className="eyebrow">Private admin access</p>
              <h1>Client accounts, private packs, audit visibility.</h1>
              <p>
                The admin console controls portal users, passwords, document uploads,
                and the live audit trail behind the client area.
              </p>
            </div>

            <div className="portal-login-card portal-login-card--kinetic">
              <div className="login-card-heading">
                <p className="eyebrow">Admin sign in</p>
                <h2>Open the console</h2>
              </div>

              {localError ? <div className="error-banner">{localError}</div> : null}

              <form className="login-form" onSubmit={handleLogin}>
                <label className="input-group">
                  <span>Email address</span>
                  <input
                    autoComplete="email"
                    className="text-input"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@noventisdigital.co.uk"
                    type="email"
                    value={email}
                  />
                </label>

                <label className="input-group">
                  <span>Password</span>
                  <input
                    autoComplete="current-password"
                    className="text-input"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    type="password"
                    value={password}
                  />
                </label>

                <button
                  className="primary-button full-width-button"
                  disabled={loginPending}
                  type="submit"
                >
                  {loginPending ? 'Signing in...' : 'Sign in to admin'}
                </button>
              </form>
            </div>

            <div className="portal-value-list">
              <article className="benefit-card benefit-card--kinetic">
                <h3>Client account management</h3>
                <p>Create, edit, reset and remove portal users without manual SQL work.</p>
              </article>
              <article className="benefit-card benefit-card--kinetic">
                <h3>Private pack uploads</h3>
                <p>PDF collateral is stored in the private bucket instead of the public site.</p>
              </article>
              <article className="benefit-card benefit-card--kinetic">
                <h3>Audit visibility</h3>
                <p>Recent portal sign-ins, quote views, document opens and admin changes.</p>
              </article>
            </div>
          </section>
        ) : (
          <section className="admin-shell">
            <div className="admin-overview-grid">
              <article className="detail-card admin-hero-card">
                <p className="eyebrow">Admin session</p>
                <h1>{admin.name}</h1>
                <p>{admin.email}</p>
              </article>
              <article className="detail-card admin-stat-card">
                <span>Client accounts</span>
                <strong>{clients.length}</strong>
              </article>
              <article className="detail-card admin-stat-card">
                <span>Recent audit events</span>
                <strong>{auditLogs.length}</strong>
              </article>
            </div>

            {localError ? <div className="error-banner">{localError}</div> : null}
            {statusMessage ? <div className="notice-banner">{statusMessage}</div> : null}

            <div className="admin-grid">
              <aside className="admin-sidebar">
                <div className="list-card">
                  <div className="list-card-heading">
                    <h3>Clients</h3>
                    <span>{loadingData ? '...' : clients.length}</span>
                  </div>
                  {loadingData ? (
                    <div className="loading-panel">Refreshing admin data...</div>
                  ) : clients.length ? (
                    <div className="quote-list">
                      {clients.map((client) => (
                        <button
                          className={`quote-list-item ${
                            client.id === selectedClient?.id ? 'is-active' : ''
                          }`}
                          key={client.id}
                          onClick={() => setSelectedClientId(client.id)}
                          type="button"
                        >
                          <span className="quote-list-topline">
                            <span className="quote-list-title">{client.company}</span>
                            <span className="status-pill is-amber">{client.quoteCount} pack(s)</span>
                          </span>
                          <span className="quote-list-meta">
                            <strong>{client.name}</strong>
                            <span>{client.email}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">No client accounts exist yet.</div>
                  )}
                </div>

                <form className="detail-card admin-create-card" onSubmit={handleCreateClient}>
                  <div className="section-card-heading">
                    <h3>Create client login</h3>
                  </div>

                  <label className="input-group">
                    <span>Full name</span>
                    <input
                      className="text-input"
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          fullName: event.target.value,
                        }))
                      }
                      type="text"
                      value={createForm.fullName}
                    />
                  </label>

                  <label className="input-group">
                    <span>Company</span>
                    <input
                      className="text-input"
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          company: event.target.value,
                        }))
                      }
                      type="text"
                      value={createForm.company}
                    />
                  </label>

                  <label className="input-group">
                    <span>Email</span>
                    <input
                      className="text-input"
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      type="email"
                      value={createForm.email}
                    />
                  </label>

                  <label className="input-group">
                    <span>Password</span>
                    <input
                      className="text-input"
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      type="text"
                      value={createForm.password}
                    />
                  </label>

                  <label className="input-group">
                    <span>Role</span>
                    <input
                      className="text-input"
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          role: event.target.value,
                        }))
                      }
                      type="text"
                      value={createForm.role}
                    />
                  </label>

                  <button className="primary-button" disabled={createPending} type="submit">
                    {createPending ? 'Creating...' : 'Create client'}
                  </button>
                </form>
              </aside>

              <div className="admin-stack">
                {selectedClient ? (
                  <>
                    <article className="detail-card">
                      <div className="section-card-heading">
                        <div>
                          <p className="eyebrow">Selected client</p>
                          <h3>{selectedClient.company}</h3>
                        </div>
                        <button
                          className="ghost-button admin-danger-button"
                          disabled={deletePending}
                          onClick={handleDeleteClient}
                          type="button"
                        >
                          {deletePending ? 'Deleting...' : 'Delete user'}
                        </button>
                      </div>

                      <div className="quote-meta-grid">
                        <div className="meta-tile">
                          <span>Name</span>
                          <strong>{selectedClient.name}</strong>
                        </div>
                        <div className="meta-tile">
                          <span>Last sign in</span>
                          <strong>
                            {selectedClient.lastSignInAt
                              ? formatDateTime(selectedClient.lastSignInAt)
                              : 'No sign-in yet'}
                          </strong>
                        </div>
                        <div className="meta-tile">
                          <span>Latest pack</span>
                          <strong>{selectedClient.latestQuoteTitle ?? 'No packs yet'}</strong>
                        </div>
                      </div>
                    </article>

                    <form className="detail-card admin-form-card" onSubmit={handleUpdateClient}>
                      <div className="section-card-heading">
                        <h3>Edit client details</h3>
                      </div>

                      <div className="admin-form-grid">
                        <label className="input-group">
                          <span>Full name</span>
                          <input
                            className="text-input"
                            onChange={(event) => setEditName(event.target.value)}
                            type="text"
                            value={editName}
                          />
                        </label>

                        <label className="input-group">
                          <span>Company</span>
                          <input
                            className="text-input"
                            onChange={(event) => setEditCompany(event.target.value)}
                            type="text"
                            value={editCompany}
                          />
                        </label>

                        <label className="input-group">
                          <span>Email</span>
                          <input
                            className="text-input"
                            onChange={(event) => setEditEmail(event.target.value)}
                            type="email"
                            value={editEmail}
                          />
                        </label>

                        <label className="input-group">
                          <span>Role</span>
                          <input
                            className="text-input"
                            onChange={(event) => setEditRole(event.target.value)}
                            type="text"
                            value={editRole}
                          />
                        </label>
                      </div>

                      <button className="primary-button" disabled={updatePending} type="submit">
                        {updatePending ? 'Saving...' : 'Save details'}
                      </button>
                    </form>

                    <form className="detail-card admin-form-card" onSubmit={handleResetPassword}>
                      <div className="section-card-heading">
                        <h3>Reset password</h3>
                      </div>

                      <div className="admin-inline-form">
                        <label className="input-group admin-inline-field">
                          <span>New password</span>
                          <input
                            className="text-input"
                            onChange={(event) => setResetPasswordValue(event.target.value)}
                            type="text"
                            value={resetPasswordValue}
                          />
                        </label>

                        <button
                          className="ghost-button"
                          disabled={resetPending || !resetPasswordValue}
                          type="submit"
                        >
                          {resetPending ? 'Resetting...' : 'Reset password'}
                        </button>
                      </div>
                    </form>

                    <article className="detail-card">
                      <div className="section-card-heading">
                        <h3>Current client packs</h3>
                        <span>{selectedClient.packs.length}</span>
                      </div>
                      {selectedClient.packs.length ? (
                        <div className="line-item-grid">
                          {selectedClient.packs.map((pack) => (
                            <div className="line-item-card" key={pack.id}>
                              <div>
                                <h4>{pack.title}</h4>
                                <p>{formatDateTime(pack.updatedAt)}</p>
                              </div>
                              <strong>
                                {pack.status} / {pack.documentCount} file(s)
                              </strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state">No packs have been uploaded yet.</div>
                      )}
                    </article>

                    <form className="detail-card admin-form-card" onSubmit={handleUploadPack}>
                      <div className="section-card-heading">
                        <h3>Upload client pack</h3>
                      </div>

                      <div className="admin-form-grid">
                        <label className="input-group">
                          <span>Pack title</span>
                          <input
                            className="text-input"
                            onChange={(event) => setPackTitle(event.target.value)}
                            type="text"
                            value={packTitle}
                          />
                        </label>

                        <label className="input-group">
                          <span>Status</span>
                          <select
                            className="text-input"
                            onChange={(event) => setPackStatus(event.target.value)}
                            value={packStatus}
                          >
                            <option>Awaiting approval</option>
                            <option>Draft</option>
                            <option>Approved</option>
                            <option>In delivery</option>
                          </select>
                        </label>

                        <label className="input-group">
                          <span>Valid until</span>
                          <input
                            className="text-input"
                            onChange={(event) => setPackValidUntil(event.target.value)}
                            type="date"
                            value={packValidUntil}
                          />
                        </label>

                        <label className="input-group">
                          <span>Timeline</span>
                          <input
                            className="text-input"
                            onChange={(event) => setPackTimeline(event.target.value)}
                            type="text"
                            value={packTimeline}
                          />
                        </label>

                        <label className="input-group">
                          <span>Amount</span>
                          <input
                            className="text-input"
                            min="0"
                            onChange={(event) => setPackAmount(event.target.value)}
                            step="1"
                            type="number"
                            value={packAmount}
                          />
                        </label>

                        <label className="input-group">
                          <span>PDF file</span>
                          <input
                            className="text-input"
                            onChange={(event) =>
                              setPackFile(event.target.files?.[0] ?? null)
                            }
                            type="file"
                          />
                        </label>

                        <label className="input-group admin-span-2">
                          <span>Summary</span>
                          <textarea
                            className="text-input text-area-input"
                            onChange={(event) => setPackSummary(event.target.value)}
                            rows={4}
                            value={packSummary}
                          />
                        </label>

                        <label className="input-group admin-span-2">
                          <span>Notes</span>
                          <textarea
                            className="text-input text-area-input"
                            onChange={(event) => setPackNotes(event.target.value)}
                            rows={3}
                            value={packNotes}
                          />
                        </label>

                        <label className="input-group admin-span-2">
                          <span>Scope items</span>
                          <textarea
                            className="text-input text-area-input"
                            onChange={(event) => setPackScope(event.target.value)}
                            placeholder="One per line or comma separated"
                            rows={3}
                            value={packScope}
                          />
                        </label>

                        <label className="input-group">
                          <span>Document label</span>
                          <input
                            className="text-input"
                            onChange={(event) => setPackLabel(event.target.value)}
                            type="text"
                            value={packLabel}
                          />
                        </label>

                        <label className="input-group">
                          <span>Document description</span>
                          <input
                            className="text-input"
                            onChange={(event) => setPackDescription(event.target.value)}
                            type="text"
                            value={packDescription}
                          />
                        </label>
                      </div>

                      <button
                        className="primary-button"
                        disabled={uploadPending || !packFile}
                        type="submit"
                      >
                        {uploadPending ? 'Uploading...' : 'Upload pack'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="empty-state large">
                    Create or select a client to manage their account and files.
                  </div>
                )}

                <article className="detail-card">
                  <div className="section-card-heading">
                    <h3>Recent audit logs</h3>
                    <span>{auditLogs.length}</span>
                  </div>

                  {auditLogs.length ? (
                    <div className="admin-audit-list">
                      {auditLogs.map((log) => (
                        <div className="admin-audit-item" key={log.id}>
                          <div className="admin-audit-meta">
                            <span className="document-badge">{log.scope}</span>
                            <strong>{prettifyEventType(log.eventType)}</strong>
                            <span>{formatDateTime(log.createdAt)}</span>
                          </div>
                          <p>
                            Actor: {log.actorEmail ?? log.actorName ?? 'Unknown'}{' '}
                            {log.subjectEmail ? `-> ${log.subjectEmail}` : ''}
                          </p>
                          {log.documentPath ? <p>Document: {log.documentPath}</p> : null}
                          {log.quoteId ? <p>Quote: {log.quoteId}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">Audit events will appear here.</div>
                  )}
                </article>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
