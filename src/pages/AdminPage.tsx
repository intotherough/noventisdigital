import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminLoginScreen } from '../components/admin/AdminLoginScreen.tsx'
import { AdminSidebar } from '../components/admin/AdminSidebar.tsx'
import { AuditView } from '../components/admin/AuditView.tsx'
import { ClientsView } from '../components/admin/ClientsView.tsx'
import { DocumentsView } from '../components/admin/DocumentsView.tsx'
import { OverviewView } from '../components/admin/OverviewView.tsx'
import type { AdminView } from '../components/admin/types.ts'
import { useAdminAuth } from '../hooks/useAdminAuth.ts'
import { useAdminData } from '../hooks/useAdminData.ts'
import { useAdminDerivedData } from '../hooks/useAdminDerivedData.ts'

export function AdminPage() {
  const [activeView, setActiveView] = useState<AdminView>('overview')
  const [localError, setLocalError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const clearMessages = useCallback(() => {
    setLocalError(null)
    setStatusMessage(null)
  }, [])

  const data = useAdminData({
    onError: setLocalError,
    onStatus: setStatusMessage,
    clearError: useCallback(() => setLocalError(null), []),
    clearMessages,
    setActiveView,
  })

  const auth = useAdminAuth({
    onLoginSuccess: data.refreshDashboardData,
    onSignOut: () => {
      setStatusMessage(null)
      data.resetAllData()
      setActiveView('overview')
    },
    onError: setLocalError,
    clearMessages,
  })

  const derived = useAdminDerivedData(data.clients, data.auditLogs, data.selectedClient)

  if (auth.booting) {
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
          {auth.admin ? (
            <button
              className="ghost-button"
              disabled={auth.signOutPending}
              onClick={auth.handleSignOut}
              type="button"
            >
              {auth.signOutPending ? 'Signing out...' : 'Sign out'}
            </button>
          ) : null}
        </div>
      </header>

      <main className="container admin-main-shell">
        {!auth.admin ? (
          <AdminLoginScreen
            email={auth.email}
            password={auth.password}
            loginPending={auth.loginPending}
            localError={localError}
            onEmailChange={auth.setEmail}
            onPasswordChange={auth.setPassword}
            onSubmit={auth.handleLogin}
          />
        ) : (
          <section className="admin-console">
            <AdminSidebar
              admin={auth.admin}
              clients={data.clients}
              selectedClient={data.selectedClient}
              activeView={activeView}
              loadingData={data.loadingData}
              onSelectView={setActiveView}
              onSelectClient={data.setSelectedClientId}
            />

            <div className="admin-stage">
              {localError ? <div className="error-banner">{localError}</div> : null}
              {statusMessage ? <div className="notice-banner">{statusMessage}</div> : null}

              {activeView === 'overview' ? (
                <OverviewView
                  clientCount={data.clients.length}
                  totalPacks={derived.totalPacks}
                  firstLoginPendingCount={derived.firstLoginPendingCount}
                  recentEventCount={derived.recentEventCount}
                  selectedClient={data.selectedClient}
                  recentAuditPreview={derived.recentAuditPreview}
                  clientsAwaitingFirstLogin={derived.clientsAwaitingFirstLogin}
                  recentlyUpdatedClients={derived.recentlyUpdatedClients}
                  loadingData={data.loadingData}
                  onRefresh={() => void data.refreshDashboardData()}
                  onSelectView={setActiveView}
                  onSelectClient={(id, navigateTo) => {
                    data.setSelectedClientId(id)
                    if (navigateTo) {
                      setActiveView(navigateTo)
                    }
                  }}
                />
              ) : null}

              {activeView === 'clients' ? (
                <ClientsView
                  selectedClient={data.selectedClient}
                  loadingData={data.loadingData}
                  createPending={data.createPending}
                  updatePending={data.updatePending}
                  resetPending={data.resetPending}
                  deletePending={data.deletePending}
                  createForm={data.createForm}
                  editEmail={data.editEmail}
                  editName={data.editName}
                  editCompany={data.editCompany}
                  editRole={data.editRole}
                  resetPasswordValue={data.resetPasswordValue}
                  selectedClientActivity={derived.selectedClientActivity}
                  onCreateFormChange={data.setCreateForm}
                  onEditEmailChange={data.setEditEmail}
                  onEditNameChange={data.setEditName}
                  onEditCompanyChange={data.setEditCompany}
                  onEditRoleChange={data.setEditRole}
                  onResetPasswordChange={data.setResetPasswordValue}
                  onCreateClient={data.handleCreateClient}
                  onUpdateClient={data.handleUpdateClient}
                  onResetPassword={data.handleResetPassword}
                  onDeleteClient={data.handleDeleteClient}
                  onRefresh={() => void data.refreshDashboardData()}
                  onSelectView={setActiveView}
                />
              ) : null}

              {activeView === 'documents' ? (
                <DocumentsView
                  selectedClient={data.selectedClient}
                  uploadPending={data.uploadPending}
                  packTitle={data.packTitle}
                  packSummary={data.packSummary}
                  packStatus={data.packStatus}
                  packValidUntil={data.packValidUntil}
                  packTimeline={data.packTimeline}
                  packNotes={data.packNotes}
                  packAmount={data.packAmount}
                  packScope={data.packScope}
                  packLabel={data.packLabel}
                  packDescription={data.packDescription}
                  packFile={data.packFile}
                  onPackTitleChange={data.setPackTitle}
                  onPackSummaryChange={data.setPackSummary}
                  onPackStatusChange={data.setPackStatus}
                  onPackValidUntilChange={data.setPackValidUntil}
                  onPackTimelineChange={data.setPackTimeline}
                  onPackNotesChange={data.setPackNotes}
                  onPackAmountChange={data.setPackAmount}
                  onPackScopeChange={data.setPackScope}
                  onPackLabelChange={data.setPackLabel}
                  onPackDescriptionChange={data.setPackDescription}
                  onPackFileChange={data.setPackFile}
                  onUploadPack={data.handleUploadPack}
                  onSelectView={setActiveView}
                />
              ) : null}

              {activeView === 'audit' ? (
                <AuditView
                  auditLogs={data.auditLogs}
                  selectedClient={data.selectedClient}
                  loadingData={data.loadingData}
                  portalEventCount={derived.portalEventCount}
                  adminEventCount={derived.adminEventCount}
                  onRefresh={() => void data.refreshDashboardData()}
                />
              ) : null}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
