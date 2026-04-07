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
