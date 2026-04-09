import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  createClient,
  deleteClient,
  getAuthErrorMessage,
  listAdminClients,
  listAuditLogs,
  resetClientPassword,
  updateClient,
  uploadClientPack,
} from '../lib/adminService.ts'
import type { AdminClientRecord, AuditLogRecord, CreateClientInput } from '../types.ts'
import type { AdminView } from '../components/admin/types.ts'
import { defaultCreateForm } from '../components/admin/types.ts'

export type UseAdminDataCallbacks = {
  onError: (message: string) => void
  onStatus: (message: string) => void
  clearError: () => void
  clearMessages: () => void
  setActiveView: (view: AdminView) => void
}

export function useAdminData(callbacks: UseAdminDataCallbacks) {
  const [clients, setClients] = useState<AdminClientRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(false)

  const [createPending, setCreatePending] = useState(false)
  const [updatePending, setUpdatePending] = useState(false)
  const [resetPending, setResetPending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [uploadPending, setUploadPending] = useState(false)

  const [createForm, setCreateForm] = useState<CreateClientInput>({
    ...defaultCreateForm,
  })
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
      callbacks.clearError()
    } catch (error) {
      callbacks.onError(getAuthErrorMessage(error))
    } finally {
      setLoadingData(false)
    }
  }

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

  const handleCreateClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    callbacks.clearMessages()
    setCreatePending(true)

    try {
      const nextClient = await createClient(createForm)
      await refreshDashboardData()
      if (nextClient?.id) {
        setSelectedClientId(nextClient.id)
      }
      setCreateForm({ ...defaultCreateForm })
      callbacks.setActiveView('clients')
      callbacks.onStatus(`Created ${nextClient?.email ?? 'client account'}.`)
    } catch (error) {
      callbacks.onError(getAuthErrorMessage(error))
    } finally {
      setCreatePending(false)
    }
  }

  const handleUpdateClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedClient) {
      return
    }

    callbacks.clearMessages()
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
      callbacks.onStatus(`Updated ${editEmail}.`)
    } catch (error) {
      callbacks.onError(getAuthErrorMessage(error))
    } finally {
      setUpdatePending(false)
    }
  }

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedClient) {
      return
    }

    callbacks.clearMessages()
    setResetPending(true)

    try {
      await resetClientPassword({
        userId: selectedClient.id,
        password: resetPasswordValue,
      })
      await refreshDashboardData()
      setResetPasswordValue('')
      callbacks.onStatus(`Password reset for ${selectedClient.email}.`)
    } catch (error) {
      callbacks.onError(getAuthErrorMessage(error))
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

    callbacks.clearMessages()
    setDeletePending(true)

    try {
      await deleteClient(selectedClient.id)
      await refreshDashboardData()
      setSelectedClientId(null)
      callbacks.setActiveView('clients')
      callbacks.onStatus(`Deleted ${selectedClient.email}.`)
    } catch (error) {
      callbacks.onError(getAuthErrorMessage(error))
    } finally {
      setDeletePending(false)
    }
  }

  const handleUploadPack = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedClient || !packFile) {
      callbacks.onError('Select a client and choose a PDF file first.')
      return
    }

    callbacks.clearMessages()
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
      callbacks.onStatus(`Uploaded a new pack for ${selectedClient.email}.`)
    } catch (error) {
      callbacks.onError(getAuthErrorMessage(error))
    } finally {
      setUploadPending(false)
    }
  }

  function resetAllData() {
    setClients([])
    setAuditLogs([])
    setSelectedClientId(null)
  }

  return {
    clients,
    auditLogs,
    selectedClientId,
    selectedClient,
    loadingData,
    createPending,
    updatePending,
    resetPending,
    deletePending,
    uploadPending,
    createForm,
    editEmail,
    editName,
    editCompany,
    editRole,
    resetPasswordValue,
    packTitle,
    packSummary,
    packStatus,
    packValidUntil,
    packTimeline,
    packNotes,
    packAmount,
    packScope,
    packLabel,
    packDescription,
    packFile,
    setSelectedClientId,
    setCreateForm,
    setEditEmail,
    setEditName,
    setEditCompany,
    setEditRole,
    setResetPasswordValue,
    setPackTitle,
    setPackSummary,
    setPackStatus,
    setPackValidUntil,
    setPackTimeline,
    setPackNotes,
    setPackAmount,
    setPackScope,
    setPackLabel,
    setPackDescription,
    setPackFile,
    refreshDashboardData,
    handleCreateClient,
    handleUpdateClient,
    handleResetPassword,
    handleDeleteClient,
    handleUploadPack,
    resetAllData,
  }
}
