export type PortalMode = 'demo' | 'live'

export type QuoteStatus =
  | 'Draft'
  | 'Awaiting approval'
  | 'Approved'
  | 'In delivery'

export type MilestoneState = 'done' | 'current' | 'next'
export type QuoteAttachmentKind = 'pdf' | 'doc' | 'link'

export type PortalClient = {
  id: string
  name: string
  company: string
  email: string
  role: string
  password?: string
}

export type QuoteItem = {
  name: string
  description: string
  amount: number
}

export type Milestone = {
  label: string
  due: string
  status: MilestoneState
}

export type QuoteAttachment = {
  label: string
  // `url` can be a normal URL or a private storage reference like
  // `storage://client-documents/<auth-user-id>/file.pdf`
  url: string
  kind: QuoteAttachmentKind
  description?: string
}

export type QuoteDocument = {
  id: string
  clientId: string
  title: string
  company: string
  summary: string
  status: QuoteStatus | string
  amount: number
  validUntil: string
  timeline: string
  notes: string
  contactEmail: string
  scope: string[]
  items: QuoteItem[]
  milestones: Milestone[]
  documents: QuoteAttachment[]
}

export type AdminUser = {
  id: string
  email: string
  name: string
}

export type ClientPackSummary = {
  id: string
  title: string
  status: string
  updatedAt: string
  documentCount: number
}

export type AdminPackRecord = {
  id: string
  title: string
  summary: string
  status: string
  updatedAt: string
  validUntil: string
  timeline: string
  notes: string
  amount: number
  documents: QuoteAttachment[]
}

export type AdminClientRecord = {
  id: string
  email: string
  name: string
  company: string
  role: string
  createdAt: string
  updatedAt: string
  lastSignInAt: string | null
  quoteCount: number
  latestQuoteTitle: string | null
  packs: ClientPackSummary[]
}

export type AuditLogRecord = {
  id: string
  scope: 'client_portal' | 'admin_console'
  eventType: string
  route: string | null
  createdAt: string
  actorUserId: string | null
  actorEmail: string | null
  actorName: string | null
  subjectUserId: string | null
  subjectEmail: string | null
  subjectName: string | null
  quoteId: string | null
  documentPath: string | null
  metadata: Record<string, unknown>
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'

export type InvoiceLineItem = {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export type Invoice = {
  id: string
  invoiceNumber: string
  invoiceSequence: number
  authUserId: string | null
  clientName: string
  clientCompany: string
  clientEmail: string
  billingEmail: string | null
  issueDate: string
  dueDate: string
  lineItems: InvoiceLineItem[]
  notes: string
  terms: string
  subtotal: number
  totalAmount: number
  currency: string
  status: InvoiceStatus
  visibleToClient: boolean
  pdfPath: string | null
  sentAt: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreateInvoiceInput = {
  authUserId: string
  billingEmail?: string
  issueDate: string
  dueDate: string
  lineItems: InvoiceLineItem[]
  notes?: string
  terms?: string
}

export type UpdateInvoiceStatusInput = {
  invoiceId: string
  status: InvoiceStatus
}

export type ToggleInvoiceVisibilityInput = {
  invoiceId: string
  visible: boolean
}

export type CreateClientInput = {
  email: string
  password: string
  fullName: string
  company: string
  role: string
  sendWelcomeEmail: boolean
}

export type UpdateClientInput = {
  userId: string
  email: string
  fullName: string
  company: string
  role: string
}

export type ResetClientPasswordInput = {
  userId: string
  password: string
}

export type ClientUpload = {
  id: string
  authUserId: string
  quoteId: string | null
  filePath: string
  fileName: string
  fileSize: number | null
  contentType: string | null
  notes: string
  createdAt: string
}

export type UploadClientPackInput = {
  userId: string
  title: string
  summary: string
  status: string
  validUntil: string
  timeline: string
  notes: string
  totalAmount: number
  scope: string[]
  documentLabel: string
  documentDescription: string
  file: File
}
