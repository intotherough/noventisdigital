import type { ChangeEvent, FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createInvoice,
  downloadInvoicePdfBlob,
  listInvoices,
  regenerateInvoicePdf,
  sendInvoice,
  toggleInvoiceVisibility,
  updateInvoiceStatus,
} from '../../lib/adminService.ts'
import { formatCurrency, formatDate } from '../../lib/formatting.ts'
import type {
  AdminClientRecord,
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
} from '../../types.ts'

const SENDER = {
  name: 'John Byrne',
  company: 'Noventis Digital',
  addressLines: ['17 Riley Close', 'Market Harborough', 'LE16 9FF'],
  email: 'hello@noventisdigital.co.uk',
}

const PAYMENT = {
  accountName: 'JM BYRNE',
  bank: 'NatWest',
  sortCode: '54-21-50',
  accountNumber: '37479903',
}

const DEFAULT_TERMS = 'Payment due within 14 days of invoice date.'

type InvoicesViewProps = {
  clients: AdminClientRecord[]
  invoiceIdFromUrl: string | null
  onNavigateToList: () => void
  onNavigateToCreate: () => void
  onNavigateToInvoice: (invoiceId: string) => void
}

type DraftLineItem = {
  description: string
  quantity: string
  unitPrice: string
}

function emptyLineItem(): DraftLineItem {
  return { description: '', quantity: '1', unitPrice: '0' }
}

function computeLineItemAmount(line: DraftLineItem) {
  const quantity = Number(line.quantity) || 0
  const unitPrice = Number(line.unitPrice) || 0
  return Number((quantity * unitPrice).toFixed(2))
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function statusLabel(status: InvoiceStatus) {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'sent':
      return 'Sent'
    case 'paid':
      return 'Paid'
    case 'cancelled':
      return 'Cancelled'
  }
}

export function InvoicesView({
  clients,
  invoiceIdFromUrl,
  onNavigateToList,
  onNavigateToCreate,
  onNavigateToInvoice,
}: InvoicesViewProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const mode: 'list' | 'create' | 'detail' =
    invoiceIdFromUrl === null
      ? 'list'
      : invoiceIdFromUrl === 'new'
        ? 'create'
        : 'detail'

  const [formClientId, setFormClientId] = useState<string>('')
  const [formBillingEmail, setFormBillingEmail] = useState('')
  const [formIssueDate, setFormIssueDate] = useState<string>(toIsoDate(new Date()))
  const [formDueDate, setFormDueDate] = useState<string>(
    toIsoDate(addDays(new Date(), 14)),
  )
  const [formNotes, setFormNotes] = useState('')
  const [formTerms, setFormTerms] = useState(DEFAULT_TERMS)
  const [formLineItems, setFormLineItems] = useState<DraftLineItem[]>([
    emptyLineItem(),
  ])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await listInvoices()
      setInvoices(next)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load invoices.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (mode === 'create') {
      resetForm()
    }
    // Reset form only when entering create mode. Intentionally no other deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const selectedInvoice = useMemo(
    () =>
      invoiceIdFromUrl && invoiceIdFromUrl !== 'new'
        ? invoices.find((inv) => inv.id === invoiceIdFromUrl) ?? null
        : null,
    [invoiceIdFromUrl, invoices],
  )

  const formSubtotal = useMemo(
    () =>
      formLineItems.reduce(
        (total, line) => total + computeLineItemAmount(line),
        0,
      ),
    [formLineItems],
  )

  function resetForm() {
    setFormClientId('')
    setFormBillingEmail('')
    setFormIssueDate(toIsoDate(new Date()))
    setFormDueDate(toIsoDate(addDays(new Date(), 14)))
    setFormNotes('')
    setFormTerms(DEFAULT_TERMS)
    setFormLineItems([emptyLineItem()])
  }

  function updateLineItem(
    index: number,
    field: keyof DraftLineItem,
    value: string,
  ) {
    setFormLineItems((current) =>
      current.map((line, idx) =>
        idx === index ? { ...line, [field]: value } : line,
      ),
    )
  }

  function removeLineItem(index: number) {
    setFormLineItems((current) =>
      current.length === 1 ? current : current.filter((_, idx) => idx !== index),
    )
  }

  function addLineItem() {
    setFormLineItems((current) => [...current, emptyLineItem()])
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setStatusMessage(null)

    if (!formClientId) {
      setError('Pick a client for this invoice.')
      return
    }

    const lineItems: InvoiceLineItem[] = formLineItems
      .filter((line) => line.description.trim())
      .map((line) => {
        const quantity = Number(line.quantity) || 0
        const unitPrice = Number(line.unitPrice) || 0
        return {
          description: line.description.trim(),
          quantity,
          unitPrice,
          amount: Number((quantity * unitPrice).toFixed(2)),
        }
      })

    if (!lineItems.length) {
      setError('Add at least one line item with a description.')
      return
    }

    setBusy(true)
    try {
      const invoice = await createInvoice({
        authUserId: formClientId,
        billingEmail: formBillingEmail.trim() || undefined,
        issueDate: formIssueDate,
        dueDate: formDueDate,
        lineItems,
        notes: formNotes.trim(),
        terms: formTerms.trim() || DEFAULT_TERMS,
      })
      setStatusMessage(`Created ${invoice.invoiceNumber}.`)
      resetForm()
      await refresh()
      onNavigateToInvoice(invoice.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create invoice.')
    } finally {
      setBusy(false)
    }
  }

  async function handleStatusChange(
    invoice: Invoice,
    nextStatus: InvoiceStatus,
  ) {
    setBusy(true)
    setError(null)
    setStatusMessage(null)
    try {
      const updated = await updateInvoiceStatus({
        invoiceId: invoice.id,
        status: nextStatus,
      })
      setStatusMessage(`${updated.invoiceNumber} marked as ${statusLabel(nextStatus)}.`)
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update invoice.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDownloadPdf(invoice: Invoice) {
    if (!invoice.pdfPath) {
      setError('This invoice does not have a stored PDF yet. Regenerate it first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const blob = await downloadInvoicePdfBlob(invoice.pdfPath)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${invoice.invoiceNumber}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to download PDF.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSendInvoice(invoice: Invoice) {
    const recipient = invoice.billingEmail || invoice.clientEmail
    const hasBeenSent = Boolean(invoice.sentAt)
    const confirmMessage = hasBeenSent
      ? `Resend ${invoice.invoiceNumber} to ${recipient}? They have already received a copy.`
      : `Send ${invoice.invoiceNumber} to ${recipient}?`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setBusy(true)
    setError(null)
    setStatusMessage(null)
    try {
      const updated = await sendInvoice(invoice.id)
      setStatusMessage(
        `${updated.invoiceNumber} sent to ${recipient}. Status is now ${updated.status}.`,
      )
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to send invoice.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRegeneratePdf(invoice: Invoice) {
    setBusy(true)
    setError(null)
    setStatusMessage(null)
    try {
      const updated = await regenerateInvoicePdf(invoice.id)
      setStatusMessage(`Regenerated PDF for ${updated.invoiceNumber}.`)
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to regenerate PDF.')
    } finally {
      setBusy(false)
    }
  }

  async function handleVisibilityToggle(invoice: Invoice) {
    setBusy(true)
    setError(null)
    setStatusMessage(null)
    try {
      const updated = await toggleInvoiceVisibility({
        invoiceId: invoice.id,
        visible: !invoice.visibleToClient,
      })
      setStatusMessage(
        updated.visibleToClient
          ? `${updated.invoiceNumber} is now visible to the client.`
          : `${updated.invoiceNumber} is hidden from the client.`,
      )
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update invoice.')
    } finally {
      setBusy(false)
    }
  }

  const selectableClients = useMemo(
    () => [...clients].sort((a, b) => a.company.localeCompare(b.company)),
    [clients],
  )

  if (mode === 'detail' && selectedInvoice) {
    return (
      <InvoiceDetail
        invoice={selectedInvoice}
        busy={busy}
        error={error}
        statusMessage={statusMessage}
        onBack={onNavigateToList}
        onStatusChange={handleStatusChange}
        onVisibilityToggle={handleVisibilityToggle}
        onDownloadPdf={handleDownloadPdf}
        onRegeneratePdf={handleRegeneratePdf}
        onSendInvoice={handleSendInvoice}
      />
    )
  }

  if (mode === 'create') {
    return (
      <div className="admin-view">
        <div className="admin-stage-header">
          <div className="admin-stage-copy">
            <p className="eyebrow">Invoices</p>
            <h1>Create invoice</h1>
            <p className="admin-stage-note">
              Fill the details and we will allocate the next sequential invoice
              number on save. You are not VAT registered so no VAT fields.
            </p>
          </div>
          <div className="admin-stage-actions">
            <button
              className="ghost-button"
              onClick={onNavigateToList}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <form className="detail-card admin-form-card" onSubmit={handleCreate}>
          <div className="admin-form-grid">
            <label className="input-group admin-span-2">
              <span>Client</span>
              <select
                className="text-input"
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setFormClientId(event.target.value)
                }
                value={formClientId}
              >
                <option value="">Pick a client...</option>
                {selectableClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company} ({client.name})
                  </option>
                ))}
              </select>
            </label>

            <label className="input-group admin-span-2">
              <span>Billing email (optional)</span>
              <input
                className="text-input"
                onChange={(event) => setFormBillingEmail(event.target.value)}
                placeholder="Leave blank to use the client portal email"
                type="email"
                value={formBillingEmail}
              />
            </label>

            <label className="input-group">
              <span>Issue date</span>
              <input
                className="text-input"
                onChange={(event) => setFormIssueDate(event.target.value)}
                type="date"
                value={formIssueDate}
              />
            </label>

            <label className="input-group">
              <span>Due date</span>
              <input
                className="text-input"
                onChange={(event) => setFormDueDate(event.target.value)}
                type="date"
                value={formDueDate}
              />
            </label>

            <label className="input-group admin-span-2">
              <span>Terms</span>
              <input
                className="text-input"
                onChange={(event) => setFormTerms(event.target.value)}
                type="text"
                value={formTerms}
              />
            </label>

            <label className="input-group admin-span-2">
              <span>Notes</span>
              <textarea
                className="text-input text-area-input"
                onChange={(event) => setFormNotes(event.target.value)}
                placeholder="Optional. Shown on the invoice, e.g. project reference or thanks message."
                rows={3}
                value={formNotes}
              />
            </label>
          </div>

          <div className="invoice-line-items">
            <div className="section-card-heading">
              <h3>Line items</h3>
              <button
                className="ghost-button"
                onClick={addLineItem}
                type="button"
              >
                Add line
              </button>
            </div>

            <div className="invoice-line-grid">
              {formLineItems.map((line, index) => {
                const amount = computeLineItemAmount(line)
                return (
                  <div className="invoice-line-row" key={index}>
                    <label className="input-group invoice-line-description">
                      <span>Description</span>
                      <input
                        className="text-input"
                        onChange={(event) =>
                          updateLineItem(index, 'description', event.target.value)
                        }
                        type="text"
                        value={line.description}
                      />
                    </label>
                    <label className="input-group invoice-line-qty">
                      <span>Qty</span>
                      <input
                        className="text-input"
                        min="0"
                        onChange={(event) =>
                          updateLineItem(index, 'quantity', event.target.value)
                        }
                        step="1"
                        type="number"
                        value={line.quantity}
                      />
                    </label>
                    <label className="input-group invoice-line-unit">
                      <span>Unit price (GBP)</span>
                      <input
                        className="text-input"
                        min="0"
                        onChange={(event) =>
                          updateLineItem(index, 'unitPrice', event.target.value)
                        }
                        step="0.01"
                        type="number"
                        value={line.unitPrice}
                      />
                    </label>
                    <div className="invoice-line-total">
                      <span>Amount</span>
                      <strong>{formatCurrency(amount)}</strong>
                    </div>
                    <button
                      aria-label="Remove line"
                      className="ghost-button invoice-line-remove"
                      disabled={formLineItems.length === 1}
                      onClick={() => removeLineItem(index)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="invoice-subtotal">
              <span>Total</span>
              <strong>{formatCurrency(formSubtotal)}</strong>
            </div>
          </div>

          <button className="primary-button" disabled={busy} type="submit">
            {busy ? 'Creating...' : 'Create invoice'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="admin-view">
      <div className="admin-stage-header">
        <div className="admin-stage-copy">
          <p className="eyebrow">Invoices</p>
          <h1>Invoice ledger</h1>
          <p className="admin-stage-note">
            Sequential GBP invoices for Noventis Digital. Numbers are allocated
            on save and cannot be reused.
          </p>
        </div>
        <div className="admin-stage-actions">
          <button
            className="ghost-button"
            disabled={loading}
            onClick={() => void refresh()}
            type="button"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            className="primary-button"
            onClick={onNavigateToCreate}
            type="button"
          >
            New invoice
          </button>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {statusMessage ? <div className="notice-banner">{statusMessage}</div> : null}

      {loading ? (
        <div className="loading-panel">Loading invoices...</div>
      ) : invoices.length ? (
        <div className="invoice-list">
          {invoices.map((invoice) => (
            <button
              className="detail-card invoice-list-item"
              key={invoice.id}
              onClick={() => onNavigateToInvoice(invoice.id)}
              type="button"
            >
              <div className="invoice-list-head">
                <div>
                  <strong>{invoice.invoiceNumber}</strong>
                  <span>{invoice.clientCompany}</span>
                </div>
                <span className={`invoice-status is-${invoice.status}`}>
                  {statusLabel(invoice.status)}
                </span>
              </div>
              <div className="invoice-list-meta">
                <div>
                  <span>Issued</span>
                  <strong>{formatDate(invoice.issueDate)}</strong>
                </div>
                <div>
                  <span>Due</span>
                  <strong>{formatDate(invoice.dueDate)}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{formatCurrency(invoice.totalAmount)}</strong>
                </div>
                <div>
                  <span>Visible to client</span>
                  <strong>{invoice.visibleToClient ? 'Yes' : 'No'}</strong>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state large">
          No invoices yet. Click New invoice to create the first one.
        </div>
      )}
    </div>
  )
}

type InvoiceDetailProps = {
  invoice: Invoice
  busy: boolean
  error: string | null
  statusMessage: string | null
  onBack: () => void
  onStatusChange: (invoice: Invoice, status: InvoiceStatus) => void
  onVisibilityToggle: (invoice: Invoice) => void
  onDownloadPdf: (invoice: Invoice) => void
  onRegeneratePdf: (invoice: Invoice) => void
  onSendInvoice: (invoice: Invoice) => void
}

function InvoiceDetail({
  invoice,
  busy,
  error,
  statusMessage,
  onBack,
  onStatusChange,
  onVisibilityToggle,
  onDownloadPdf,
  onRegeneratePdf,
  onSendInvoice,
}: InvoiceDetailProps) {
  return (
    <div className="admin-view">
      <div className="admin-stage-header no-print">
        <div className="admin-stage-copy">
          <p className="eyebrow">Invoice {invoice.invoiceNumber}</p>
          <h1>{invoice.clientCompany}</h1>
          <p className="admin-stage-note">
            Send the invoice by email, download the PDF, or update the status
            below. Regenerate the PDF after editing draft line items.
          </p>
          {invoice.sentAt ? (
            <p className="admin-stage-note">
              Last sent {formatDate(invoice.sentAt)} to{' '}
              {invoice.billingEmail || invoice.clientEmail}.
            </p>
          ) : null}
        </div>
        <div className="admin-stage-actions">
          <button className="ghost-button" onClick={onBack} type="button">
            Back to list
          </button>
          <button
            className="primary-button"
            disabled={busy || invoice.status === 'cancelled'}
            onClick={() => onSendInvoice(invoice)}
            type="button"
          >
            {invoice.sentAt ? 'Resend invoice' : 'Send invoice'}
          </button>
          <button
            className="ghost-button"
            disabled={busy || !invoice.pdfPath}
            onClick={() => onDownloadPdf(invoice)}
            type="button"
          >
            Download PDF
          </button>
          <button
            className="ghost-button"
            disabled={busy}
            onClick={() => onRegeneratePdf(invoice)}
            type="button"
          >
            {invoice.pdfPath ? 'Regenerate PDF' : 'Generate PDF'}
          </button>
        </div>
      </div>

      {error ? <div className="error-banner no-print">{error}</div> : null}
      {statusMessage ? (
        <div className="notice-banner no-print">{statusMessage}</div>
      ) : null}

      <article className="invoice-sheet">
        <header className="invoice-sheet-header">
          <div className="invoice-brand">
            <strong>NOVENTIS</strong>
            <span>Digital</span>
          </div>
          <div className="invoice-number-block">
            <span>Invoice</span>
            <strong>{invoice.invoiceNumber}</strong>
          </div>
        </header>

        <section className="invoice-parties">
          <div>
            <p className="invoice-label">From</p>
            <p className="invoice-party">
              <strong>{SENDER.name}</strong>
              <br />
              {SENDER.company}
              <br />
              {SENDER.addressLines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
              {SENDER.email}
            </p>
          </div>
          <div>
            <p className="invoice-label">Bill to</p>
            <p className="invoice-party">
              <strong>{invoice.clientName}</strong>
              <br />
              {invoice.clientCompany}
              <br />
              {invoice.billingEmail || invoice.clientEmail}
            </p>
          </div>
          <div>
            <p className="invoice-label">Dates</p>
            <p className="invoice-party">
              Issued: <strong>{formatDate(invoice.issueDate)}</strong>
              <br />
              Due: <strong>{formatDate(invoice.dueDate)}</strong>
            </p>
          </div>
        </section>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th className="align-right">Qty</th>
              <th className="align-right">Unit price</th>
              <th className="align-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((line, index) => (
              <tr key={index}>
                <td>{line.description}</td>
                <td className="align-right">{line.quantity}</td>
                <td className="align-right">{formatCurrency(line.unitPrice)}</td>
                <td className="align-right">{formatCurrency(line.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="align-right">
                Total
              </td>
              <td className="align-right">
                <strong>{formatCurrency(invoice.totalAmount)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>

        {invoice.notes ? (
          <section className="invoice-notes">
            <p className="invoice-label">Notes</p>
            <p>{invoice.notes}</p>
          </section>
        ) : null}

        <section className="invoice-terms">
          <p className="invoice-label">Terms</p>
          <p>{invoice.terms}</p>
        </section>

        <section className="invoice-payment">
          <p className="invoice-label">Payment details</p>
          <div className="invoice-payment-grid">
            <div>
              <span>Account name</span>
              <strong>{PAYMENT.accountName}</strong>
            </div>
            <div>
              <span>Bank</span>
              <strong>{PAYMENT.bank}</strong>
            </div>
            <div>
              <span>Sort code</span>
              <strong>{PAYMENT.sortCode}</strong>
            </div>
            <div>
              <span>Account number</span>
              <strong>{PAYMENT.accountNumber}</strong>
            </div>
            <div>
              <span>Reference</span>
              <strong>{invoice.invoiceNumber}</strong>
            </div>
          </div>
        </section>

        <footer className="invoice-sheet-footer">
          <p>
            Not VAT registered. Amounts shown in {invoice.currency}. Thank you.
          </p>
        </footer>
      </article>

      <div className="invoice-controls no-print">
        <div className="detail-card">
          <div className="section-card-heading">
            <h3>Status</h3>
            <span className={`invoice-status is-${invoice.status}`}>
              {statusLabel(invoice.status)}
            </span>
          </div>
          <div className="admin-stage-actions">
            <button
              className="ghost-button"
              disabled={busy || invoice.status === 'draft'}
              onClick={() => onStatusChange(invoice, 'draft')}
              type="button"
            >
              Draft
            </button>
            <button
              className="ghost-button"
              disabled={busy || invoice.status === 'sent'}
              onClick={() => onStatusChange(invoice, 'sent')}
              type="button"
            >
              Mark sent
            </button>
            <button
              className="ghost-button"
              disabled={busy || invoice.status === 'paid'}
              onClick={() => onStatusChange(invoice, 'paid')}
              type="button"
            >
              Mark paid
            </button>
            <button
              className="ghost-button"
              disabled={busy || invoice.status === 'cancelled'}
              onClick={() => onStatusChange(invoice, 'cancelled')}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="detail-card">
          <div className="section-card-heading">
            <h3>Client portal visibility</h3>
            <span>{invoice.visibleToClient ? 'Visible' : 'Hidden'}</span>
          </div>
          <p className="admin-stage-note">
            Toggle whether this invoice appears in the client portal. Hidden by
            default until you are ready to share.
          </p>
          <button
            className="ghost-button"
            disabled={busy}
            onClick={() => onVisibilityToggle(invoice)}
            type="button"
          >
            {invoice.visibleToClient ? 'Hide from client' : 'Make visible to client'}
          </button>
        </div>
      </div>
    </div>
  )
}
