import { useCallback, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AdminLoginScreen } from '../components/admin/AdminLoginScreen.tsx'
import { AdminSidebar } from '../components/admin/AdminSidebar.tsx'
import { AuditView } from '../components/admin/AuditView.tsx'
import { ClientsView } from '../components/admin/ClientsView.tsx'
import { DocumentsView } from '../components/admin/DocumentsView.tsx'
import { EmailPreviewView } from '../components/admin/EmailPreviewView.tsx'
import { InvoicesView } from '../components/admin/InvoicesView.tsx'
import { OverviewView } from '../components/admin/OverviewView.tsx'
import type { AdminView } from '../components/admin/types.ts'
import { adminViews } from '../components/admin/types.ts'
import { useAdminAuth } from '../hooks/useAdminAuth.ts'
import { useAdminData } from '../hooks/useAdminData.ts'
import { useAdminDerivedData } from '../hooks/useAdminDerivedData.ts'

const ADMIN_VIEW_IDS = new Set<AdminView>(adminViews.map((view) => view.id))

function parseAdminLocation(pathname: string): {
  activeView: AdminView
  clientIdFromUrl: string | null
  invoiceIdFromUrl: string | null
} {
  const trimmed = pathname.replace(/^\/admin\/?/, '').replace(/\/$/, '')
  if (!trimmed) {
    return { activeView: 'overview', clientIdFromUrl: null, invoiceIdFromUrl: null }
  }

  const [viewSegment, contextSegment] = trimmed.split('/')
  const candidate = viewSegment as AdminView

  if (ADMIN_VIEW_IDS.has(candidate)) {
    if (candidate === 'invoices') {
      return {
        activeView: candidate,
        clientIdFromUrl: null,
        invoiceIdFromUrl: contextSegment ?? null,
      }
    }
    return {
      activeView: candidate,
      clientIdFromUrl: contextSegment ?? null,
      invoiceIdFromUrl: null,
    }
  }

  return { activeView: 'overview', clientIdFromUrl: null, invoiceIdFromUrl: null }
}

export function AdminPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const { activeView, clientIdFromUrl, invoiceIdFromUrl } = useMemo(
    () => parseAdminLocation(location.pathname),
    [location.pathname],
  )

  const [localError, setLocalError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const clearMessages = useCallback(() => {
    setLocalError(null)
    setStatusMessage(null)
  }, [])

  const navigateToView = useCallback(
    (view: AdminView, clientId?: string | null) => {
      const targetClientId =
        clientId === undefined ? clientIdFromUrl : clientId
      if (view === 'overview') {
        navigate('/admin')
        return
      }
      const target = targetClientId
        ? `/admin/${view}/${targetClientId}`
        : `/admin/${view}`
      navigate(target)
    },
    [navigate, clientIdFromUrl],
  )

  const data = useAdminData(
    {
      onError: setLocalError,
      onStatus: setStatusMessage,
      clearError: useCallback(() => setLocalError(null), []),
      clearMessages,
      navigateToView,
    },
    { selectedClientIdFromUrl: clientIdFromUrl },
  )

  const auth = useAdminAuth({
    onLoginSuccess: data.refreshDashboardData,
    onSignOut: () => {
      setStatusMessage(null)
      data.resetAllData()
      navigate('/admin')
    },
    onError: setLocalError,
    clearMessages,
  })

  const derived = useAdminDerivedData(data.clients, data.auditLogs, data.selectedClient)

  const handleSelectClient = useCallback(
    (id: string) => {
      const clientScopedViews = new Set(['clients', 'documents', 'audit'])
      const view = clientScopedViews.has(activeView) ? activeView : 'clients'
      navigateToView(view as AdminView, id)
    },
    [navigateToView, activeView],
  )

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
              quickUploadPending={data.quickUploadPending}
              onSelectView={(view) => navigateToView(view)}
              onSelectClient={handleSelectClient}
              onDropFile={(clientId, file) => {
                void data.handleQuickUploadPack(clientId, file)
              }}
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
                  onSelectView={(view) => navigateToView(view)}
                  onSelectClient={(id, navigateTo) => {
                    navigateToView(navigateTo ?? 'clients', id)
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
                  onSelectView={(view) => navigateToView(view)}
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
                  onPackLabelAutoFill={data.setPackLabel}
                  onUploadPack={data.handleUploadPack}
                  onSelectView={(view) => navigateToView(view)}
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

              {activeView === 'invoices' ? (
                <InvoicesView
                  clients={data.clients}
                  invoiceIdFromUrl={invoiceIdFromUrl}
                  onNavigateToList={() => navigate('/admin/invoices')}
                  onNavigateToCreate={() => navigate('/admin/invoices/new')}
                  onNavigateToInvoice={(id) => navigate(`/admin/invoices/${id}`)}
                />
              ) : null}

              {activeView === 'email-preview' ? <EmailPreviewView /> : null}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
