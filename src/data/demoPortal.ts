import type { PortalClient, QuoteDocument } from '../types'

export const demoClients: PortalClient[] = [
  {
    id: 'client-north-labs',
    name: 'Sarah Mitchell',
    company: 'North Labs',
    email: 'sarah@northlabs.co.uk',
    password: 'DemoQuote!24',
    role: 'Operations Director',
  },
  {
    id: 'client-meridian',
    name: 'Daniel Reed',
    company: 'Meridian Ventures',
    email: 'daniel@meridianvc.com',
    password: 'Pipeline!27',
    role: 'Managing Partner',
  },
]

export const demoCredentials = demoClients.map((client) => ({
  label: client.company,
  email: client.email,
  password: client.password ?? '',
}))

export const demoQuotes: QuoteDocument[] = [
  {
    id: 'quote-ai-audit',
    clientId: 'client-north-labs',
    title: 'AI workflow audit and delivery sprint',
    company: 'North Labs',
    summary:
      'A focused engagement to map the current delivery process, identify automatable steps and ship a usable first workflow inside your operating environment.',
    status: 'Awaiting approval',
    amount: 4800,
    validUntil: '2026-04-22',
    timeline: '3 weeks',
    notes:
      'This proposal assumes one stakeholder lead, one weekly review call and access to your existing tooling stack during the sprint.',
    contactEmail: 'hello@noventisdigital.co.uk',
    scope: [
      'Delivery process mapping and handoff analysis',
      'Priority automation shortlist with implementation recommendation',
      'One production-ready workflow or client-facing prototype',
      'Training handover and implementation notes',
    ],
    items: [
      {
        name: 'Discovery and systems mapping',
        description: 'Interviews, workflow review and leverage assessment.',
        amount: 1200,
      },
      {
        name: 'Prototype build',
        description: 'A working AI-assisted workflow connected to your current stack.',
        amount: 2100,
      },
      {
        name: 'Implementation support',
        description: 'Testing, iteration and team handover.',
        amount: 1500,
      },
    ],
    milestones: [
      {
        label: 'Current workflow review complete',
        due: '2026-04-11',
        status: 'done',
      },
      {
        label: 'Prototype approved',
        due: '2026-04-17',
        status: 'current',
      },
      {
        label: 'Delivery handover',
        due: '2026-04-25',
        status: 'next',
      },
    ],
    documents: [
      {
        label: 'Proposal pack PDF',
        url: '/documents/Watson-Proposal-SOW-2026-04-07.pdf',
        kind: 'pdf',
        description: 'Hosted PDF pack for reviewing the structure and presentation.',
      },
    ],
  },
  {
    id: 'quote-portal-build',
    clientId: 'client-north-labs',
    title: 'Client portal and quoting system build',
    company: 'North Labs',
    summary:
      'Design and build a branded client portal where buyers can review quotes, delivery stages and project updates without relying on PDFs or fragmented email threads.',
    status: 'Draft',
    amount: 7200,
    validUntil: '2026-04-30',
    timeline: '4 to 5 weeks',
    notes:
      'Includes responsive frontend, quote data model, authentication setup and handover documentation. Payment gateway or e-signature is out of scope for this phase.',
    contactEmail: 'hello@noventisdigital.co.uk',
    scope: [
      'Portal information architecture and UI design',
      'Secure client login flow',
      'Quote dashboard, detail view and approval actions',
      'Deployment to GitHub Pages with Supabase backend',
    ],
    items: [
      {
        name: 'Product design and information architecture',
        description: 'Portal structure, states and UX patterns.',
        amount: 1900,
      },
      {
        name: 'Frontend build',
        description: 'Responsive React application and branded UI.',
        amount: 3400,
      },
      {
        name: 'Auth and quote data wiring',
        description: 'Supabase setup, account model and deployment support.',
        amount: 1900,
      },
    ],
    milestones: [
      {
        label: 'Portal UX approved',
        due: '2026-04-19',
        status: 'current',
      },
      {
        label: 'Authenticated build ready',
        due: '2026-04-28',
        status: 'next',
      },
      {
        label: 'Launch handover',
        due: '2026-05-05',
        status: 'next',
      },
    ],
    documents: [
      {
        label: 'Client portal brief',
        url: '/documents/Watson-Proposal-SOW-2026-04-07.pdf',
        kind: 'pdf',
        description: 'Reference document covering scope, terms and project detail.',
      },
    ],
  },
  {
    id: 'quote-fund-ops',
    clientId: 'client-meridian',
    title: 'Investor operations automation sprint',
    company: 'Meridian Ventures',
    summary:
      'A practical sprint to reduce manual portfolio reporting work, structure incoming data and improve the partner-facing reporting layer with targeted automation.',
    status: 'Awaiting approval',
    amount: 6500,
    validUntil: '2026-04-25',
    timeline: '4 weeks',
    notes:
      'This proposal is aimed at internal operations efficiency and assumes API access or export access to your current reporting sources.',
    contactEmail: 'hello@noventisdigital.co.uk',
    scope: [
      'Current-state reporting workflow review',
      'Data ingestion and transformation plan',
      'Automated reporting prototype',
      'Internal documentation and rollout advice',
    ],
    items: [
      {
        name: 'Workflow review',
        description: 'Reporting map, pain points and handoff analysis.',
        amount: 1500,
      },
      {
        name: 'Automation prototype',
        description: 'Working reporting flow with reusable components.',
        amount: 3200,
      },
      {
        name: 'Rollout support',
        description: 'Iteration, feedback and operating notes.',
        amount: 1800,
      },
    ],
    milestones: [
      {
        label: 'Data source access confirmed',
        due: '2026-04-12',
        status: 'done',
      },
      {
        label: 'Automation prototype review',
        due: '2026-04-20',
        status: 'current',
      },
      {
        label: 'Partner reporting handover',
        due: '2026-04-30',
        status: 'next',
      },
    ],
    documents: [
      {
        label: 'Automation scope PDF',
        url: '/documents/Watson-Proposal-SOW-2026-04-07.pdf',
        kind: 'pdf',
        description: 'Supporting PDF added to demonstrate document access inside the portal.',
      },
    ],
  },
]
