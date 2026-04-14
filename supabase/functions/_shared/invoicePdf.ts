import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'npm:pdf-lib@1.17.1'

export type InvoicePdfLineItem = {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export type InvoicePdfInput = {
  invoiceNumber: string
  clientName: string
  clientCompany: string
  billingEmail: string | null
  clientEmail: string
  issueDate: string
  dueDate: string
  lineItems: InvoicePdfLineItem[]
  subtotal: number
  totalAmount: number
  currency: string
  notes: string
  terms: string
}

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

const PAGE_WIDTH = 595.28 // A4 in points (72dpi)
const PAGE_HEIGHT = 841.89
const MARGIN_X = 56
const MARGIN_TOP = 72
const MARGIN_BOTTOM = 72

const COLOUR_BLACK = rgb(0.04, 0.04, 0.06)
const COLOUR_MUTED = rgb(0.45, 0.45, 0.5)
const COLOUR_RULE = rgb(0.82, 0.82, 0.85)
const COLOUR_ACCENT = rgb(0.12, 0.12, 0.18)

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return date
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (!text) {
    return [''] as string[]
  }
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word
    const width = font.widthOfTextAtSize(attempt, size)
    if (width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = attempt
    }
  }
  if (current) {
    lines.push(current)
  }
  return lines
}

function drawText(
  page: PDFPage,
  text: string,
  options: {
    x: number
    y: number
    size: number
    font: PDFFont
    color?: ReturnType<typeof rgb>
  },
) {
  page.drawText(text, {
    x: options.x,
    y: options.y,
    size: options.size,
    font: options.font,
    color: options.color ?? COLOUR_BLACK,
  })
}

function drawRule(page: PDFPage, x: number, y: number, width: number) {
  page.drawLine({
    start: { x, y },
    end: { x: x + width, y },
    thickness: 0.75,
    color: COLOUR_RULE,
  })
}

export async function buildInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const serif = await doc.embedFont(StandardFonts.TimesRomanBold)

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const contentWidth = PAGE_WIDTH - MARGIN_X * 2
  let cursorY = PAGE_HEIGHT - MARGIN_TOP

  // Brand wordmark
  drawText(page, 'NOVENTIS', {
    x: MARGIN_X,
    y: cursorY,
    size: 20,
    font: serif,
    color: COLOUR_ACCENT,
  })
  drawText(page, 'DIGITAL', {
    x: MARGIN_X,
    y: cursorY - 14,
    size: 8,
    font: regular,
    color: COLOUR_MUTED,
  })

  // Invoice number block (right aligned)
  drawText(page, 'INVOICE', {
    x: PAGE_WIDTH - MARGIN_X - regular.widthOfTextAtSize('INVOICE', 9),
    y: cursorY,
    size: 9,
    font: regular,
    color: COLOUR_MUTED,
  })
  const numberWidth = bold.widthOfTextAtSize(input.invoiceNumber, 18)
  drawText(page, input.invoiceNumber, {
    x: PAGE_WIDTH - MARGIN_X - numberWidth,
    y: cursorY - 20,
    size: 18,
    font: bold,
    color: COLOUR_ACCENT,
  })

  cursorY -= 58
  drawRule(page, MARGIN_X, cursorY, contentWidth)
  cursorY -= 22

  // Parties block (three columns)
  const columnWidth = (contentWidth - 32) / 3
  const partyStartY = cursorY

  const drawLabel = (label: string, x: number, y: number) => {
    drawText(page, label.toUpperCase(), {
      x,
      y,
      size: 7.5,
      font: bold,
      color: COLOUR_MUTED,
    })
  }

  const drawPartyLines = (lines: string[], x: number, startY: number) => {
    lines.forEach((line, index) => {
      drawText(page, line, {
        x,
        y: startY - 12 - index * 11,
        size: 9,
        font: index === 0 ? bold : regular,
      })
    })
  }

  // From
  drawLabel('From', MARGIN_X, partyStartY)
  drawPartyLines(
    [
      SENDER.name,
      SENDER.company,
      ...SENDER.addressLines,
      SENDER.email,
    ],
    MARGIN_X,
    partyStartY,
  )

  // Bill to
  const billX = MARGIN_X + columnWidth + 16
  drawLabel('Bill to', billX, partyStartY)
  const billToEmail = input.billingEmail || input.clientEmail
  drawPartyLines(
    [input.clientName, input.clientCompany, billToEmail],
    billX,
    partyStartY,
  )

  // Dates
  const dateX = MARGIN_X + (columnWidth + 16) * 2
  drawLabel('Dates', dateX, partyStartY)
  drawText(page, 'Issued', {
    x: dateX,
    y: partyStartY - 12,
    size: 8.5,
    font: regular,
    color: COLOUR_MUTED,
  })
  drawText(page, formatDate(input.issueDate), {
    x: dateX,
    y: partyStartY - 23,
    size: 9.5,
    font: bold,
  })
  drawText(page, 'Due', {
    x: dateX,
    y: partyStartY - 40,
    size: 8.5,
    font: regular,
    color: COLOUR_MUTED,
  })
  drawText(page, formatDate(input.dueDate), {
    x: dateX,
    y: partyStartY - 51,
    size: 9.5,
    font: bold,
  })

  cursorY = partyStartY - 88
  drawRule(page, MARGIN_X, cursorY, contentWidth)
  cursorY -= 18

  // Line items table
  const colDescription = MARGIN_X
  const colQty = MARGIN_X + contentWidth * 0.6
  const colUnit = MARGIN_X + contentWidth * 0.72
  const colAmount = MARGIN_X + contentWidth
  const descWidth = contentWidth * 0.58

  drawText(page, 'DESCRIPTION', {
    x: colDescription,
    y: cursorY,
    size: 7.5,
    font: bold,
    color: COLOUR_MUTED,
  })
  const drawRightAligned = (
    text: string,
    rightX: number,
    y: number,
    size: number,
    font: PDFFont,
    color?: ReturnType<typeof rgb>,
  ) => {
    const w = font.widthOfTextAtSize(text, size)
    drawText(page, text, { x: rightX - w, y, size, font, color })
  }

  drawRightAligned('QTY', colUnit - 12, cursorY, 7.5, bold, COLOUR_MUTED)
  drawRightAligned('UNIT PRICE', colAmount - 80, cursorY, 7.5, bold, COLOUR_MUTED)
  drawRightAligned('AMOUNT', colAmount, cursorY, 7.5, bold, COLOUR_MUTED)

  cursorY -= 10
  drawRule(page, MARGIN_X, cursorY, contentWidth)
  cursorY -= 14

  for (const line of input.lineItems) {
    const descLines = wrapText(line.description, regular, 10, descWidth)
    const rowHeight = Math.max(descLines.length * 12, 14)

    descLines.forEach((descLine, index) => {
      drawText(page, descLine, {
        x: colDescription,
        y: cursorY - index * 12,
        size: 10,
        font: regular,
      })
    })
    drawRightAligned(
      String(line.quantity),
      colUnit - 12,
      cursorY,
      10,
      regular,
    )
    drawRightAligned(
      formatCurrency(line.unitPrice, input.currency),
      colAmount - 80,
      cursorY,
      10,
      regular,
    )
    drawRightAligned(
      formatCurrency(line.amount, input.currency),
      colAmount,
      cursorY,
      10,
      regular,
    )
    cursorY -= rowHeight + 6
  }

  cursorY -= 6
  drawRule(page, MARGIN_X, cursorY, contentWidth)
  cursorY -= 18

  drawRightAligned('TOTAL', colAmount - 120, cursorY, 9, bold, COLOUR_MUTED)
  drawRightAligned(
    formatCurrency(input.totalAmount, input.currency),
    colAmount,
    cursorY,
    13,
    bold,
    COLOUR_ACCENT,
  )

  cursorY -= 40

  if (input.notes) {
    drawText(page, 'NOTES', {
      x: MARGIN_X,
      y: cursorY,
      size: 7.5,
      font: bold,
      color: COLOUR_MUTED,
    })
    cursorY -= 12
    const noteLines = wrapText(input.notes, regular, 10, contentWidth)
    for (const noteLine of noteLines) {
      drawText(page, noteLine, {
        x: MARGIN_X,
        y: cursorY,
        size: 10,
        font: regular,
      })
      cursorY -= 13
    }
    cursorY -= 8
  }

  drawText(page, 'TERMS', {
    x: MARGIN_X,
    y: cursorY,
    size: 7.5,
    font: bold,
    color: COLOUR_MUTED,
  })
  cursorY -= 12
  const termLines = wrapText(input.terms, regular, 10, contentWidth)
  for (const termLine of termLines) {
    drawText(page, termLine, {
      x: MARGIN_X,
      y: cursorY,
      size: 10,
      font: regular,
    })
    cursorY -= 13
  }

  cursorY -= 10
  drawRule(page, MARGIN_X, cursorY, contentWidth)
  cursorY -= 18

  drawText(page, 'PAYMENT DETAILS', {
    x: MARGIN_X,
    y: cursorY,
    size: 7.5,
    font: bold,
    color: COLOUR_MUTED,
  })
  cursorY -= 14

  const labelColWidth = 90
  const drawPaymentRow = (label: string, value: string) => {
    drawText(page, label, {
      x: MARGIN_X,
      y: cursorY,
      size: 10,
      font: regular,
      color: COLOUR_MUTED,
    })
    drawText(page, value, {
      x: MARGIN_X + labelColWidth,
      y: cursorY,
      size: 10,
      font: bold,
    })
    cursorY -= 13
  }

  drawPaymentRow('Account name', PAYMENT.accountName)
  drawPaymentRow('Bank', PAYMENT.bank)
  drawPaymentRow('Sort code', PAYMENT.sortCode)
  drawPaymentRow('Account number', PAYMENT.accountNumber)
  drawPaymentRow('Reference', input.invoiceNumber)

  // Footer
  const footerY = MARGIN_BOTTOM
  drawRule(page, MARGIN_X, footerY + 14, contentWidth)
  drawText(
    page,
    `Not VAT registered. Amounts shown in ${input.currency}. Thank you.`,
    {
      x: MARGIN_X,
      y: footerY,
      size: 8,
      font: regular,
      color: COLOUR_MUTED,
    },
  )

  return await doc.save()
}
