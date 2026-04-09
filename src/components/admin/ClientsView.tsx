import type { FormEvent } from 'react'
import { formatDateTime } from '../../lib/formatting.ts'
import type { AdminClientRecord, AuditLogRecord, CreateClientInput } from '../../types.ts'
import type { AdminView } from './types.ts'
import { getAuditScopeLabel, getClientLastSignInLabel, prettifyEventType } from './types.ts'

type ClientsViewProps = {
  selectedClient: AdminClientRecord | null
  loadingData: boolean
  createPending: boolean
  updatePending: boolean
  resetPending: boolean
  deletePending: boolean
  createForm: CreateClientInput
  editEmail: string
  editName: string
  editCompany: string
  editRole: string
  resetPasswordValue: string
  selectedClientActivity: AuditLogRecord[]
  onCreateFormChange: (updater: (current: CreateClientInput) => CreateClientInput) => void
  onEditEmailChange: (value: string) => void
  onEditNameChange: (value: string) => void
  onEditCompanyChange: (value: string) => void
  onEditRoleChange: (value: string) => void
  onResetPasswordChange: (value: string) => void
  onCreateClient: (event: FormEvent<HTMLFormElement>) => void
  onUpdateClient: (event: FormEvent<HTMLFormElement>) => void
  onResetPassword: (event: FormEvent<HTMLFormElement>) => void
  onDeleteClient: () => void
  onRefresh: () => void
  onSelectView: (view: AdminView) => void
}

export function ClientsView({
  selectedClient,
  loadingData,
  createPending,
  updatePending,
  resetPending,
  deletePending,
  createForm,
  editEmail,
  editName,
  editCompany,
  editRole,
  resetPasswordValue,
  selectedClientActivity,
  onCreateFormChange,
  onEditEmailChange,
  onEditNameChange,
  onEditCompanyChange,
  onEditRoleChange,
  onResetPasswordChange,
  onCreateClient,
  onUpdateClient,
  onResetPassword,
  onDeleteClient,
  onRefresh,
  onSelectView,
}: ClientsViewProps) {
  return (
    <div className="admin-view">
      <div className="admin-stage-header">
        <div className="admin-stage-copy">
          <p className="eyebrow">Clients</p>
          <h1>Client directory</h1>
          <p className="admin-stage-note">
            Create accounts, keep profile details accurate, and control access without
            dropping down into the database.
          </p>
        </div>

        <div className="admin-stage-actions">
          {selectedClient ? (
            <button
              className="ghost-button"
              onClick={() => onSelectView('documents')}
              type="button"
            >
              Manage packs
            </button>
          ) : null}
          <button
            className="ghost-button"
            disabled={loadingData}
            onClick={onRefresh}
            type="button"
          >
            {loadingData ? 'Refreshing...' : 'Refresh data'}
          </button>
        </div>
      </div>

      <div className="admin-stage-grid admin-stage-grid--clients">
        <form className="detail-card admin-create-card" onSubmit={onCreateClient}>
          <div className="section-card-heading">
            <div>
              <p className="eyebrow">New client</p>
              <h3>Create login</h3>
            </div>
          </div>

          <div className="admin-form-grid">
            <label className="input-group">
              <span>Full name</span>
              <input
                className="text-input"
                onChange={(event) =>
                  onCreateFormChange((current) => ({
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
                  onCreateFormChange((current) => ({
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
                  onCreateFormChange((current) => ({
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
                  onCreateFormChange((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                type="text"
                value={createForm.password}
              />
            </label>

            <label className="input-group admin-span-2">
              <span>Role</span>
              <input
                className="text-input"
                onChange={(event) =>
                  onCreateFormChange((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
                type="text"
                value={createForm.role}
              />
            </label>
          </div>

          <button className="primary-button" disabled={createPending} type="submit">
            {createPending ? 'Creating...' : 'Create client'}
          </button>
        </form>

        {selectedClient ? (
          <div className="admin-column-stack">
            <article className="detail-card admin-client-spotlight">
              <div className="section-card-heading">
                <div>
                  <p className="eyebrow">Selected client</p>
                  <h3>{selectedClient.company}</h3>
                </div>

                <div className="admin-stage-actions">
                  <button
                    className="ghost-button"
                    onClick={() => onSelectView('audit')}
                    type="button"
                  >
                    View audit
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => onSelectView('documents')}
                    type="button"
                  >
                    Open documents
                  </button>
                </div>
              </div>

              <div className="quote-meta-grid">
                <div className="meta-tile">
                  <span>Name</span>
                  <strong>{selectedClient.name}</strong>
                </div>
                <div className="meta-tile">
                  <span>Last sign in</span>
                  <strong>{getClientLastSignInLabel(selectedClient)}</strong>
                </div>
                <div className="meta-tile">
                  <span>Pack count</span>
                  <strong>{selectedClient.quoteCount}</strong>
                </div>
              </div>

              {selectedClientActivity.length ? (
                <div className="admin-feed-list">
                  {selectedClientActivity.slice(0, 3).map((log) => (
                    <article className="admin-feed-item" key={log.id}>
                      <div className="admin-feed-meta">
                        <span className="document-badge">
                          {getAuditScopeLabel(log.scope)}
                        </span>
                        <strong>{prettifyEventType(log.eventType)}</strong>
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="admin-stage-note">
                  No recorded activity for this client yet.
                </p>
              )}
            </article>

            <form className="detail-card admin-form-card" onSubmit={onUpdateClient}>
              <div className="section-card-heading">
                <h3>Edit client details</h3>
              </div>

              <div className="admin-form-grid">
                <label className="input-group">
                  <span>Full name</span>
                  <input
                    className="text-input"
                    onChange={(event) => onEditNameChange(event.target.value)}
                    type="text"
                    value={editName}
                  />
                </label>

                <label className="input-group">
                  <span>Company</span>
                  <input
                    className="text-input"
                    onChange={(event) => onEditCompanyChange(event.target.value)}
                    type="text"
                    value={editCompany}
                  />
                </label>

                <label className="input-group">
                  <span>Email</span>
                  <input
                    className="text-input"
                    onChange={(event) => onEditEmailChange(event.target.value)}
                    type="email"
                    value={editEmail}
                  />
                </label>

                <label className="input-group">
                  <span>Role</span>
                  <input
                    className="text-input"
                    onChange={(event) => onEditRoleChange(event.target.value)}
                    type="text"
                    value={editRole}
                  />
                </label>
              </div>

              <button className="primary-button" disabled={updatePending} type="submit">
                {updatePending ? 'Saving...' : 'Save details'}
              </button>
            </form>

            <div className="admin-secondary-grid">
              <form className="detail-card admin-form-card" onSubmit={onResetPassword}>
                <div className="section-card-heading">
                  <h3>Reset password</h3>
                </div>

                <div className="admin-inline-form">
                  <label className="input-group admin-inline-field">
                    <span>New password</span>
                    <input
                      className="text-input"
                      onChange={(event) => onResetPasswordChange(event.target.value)}
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

              <article className="detail-card admin-danger-card">
                <div className="section-card-heading">
                  <h3>Delete client</h3>
                </div>
                <p className="admin-stage-note">
                  This removes the login, associated quote rows, and stored files for the
                  selected client.
                </p>
                <button
                  className="ghost-button admin-danger-button"
                  disabled={deletePending}
                  onClick={onDeleteClient}
                  type="button"
                >
                  {deletePending ? 'Deleting...' : 'Delete user'}
                </button>
              </article>
            </div>
          </div>
        ) : (
          <div className="empty-state large">
            Select a client from the left-hand directory to edit their details.
          </div>
        )}
      </div>
    </div>
  )
}
