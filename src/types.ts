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

export type CreateClientInput = {
  email: string
  password: string
  fullName: string
  company: string
  role: string
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
