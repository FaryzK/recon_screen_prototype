import type { Document, Queue } from "@/types/data"

export const MOCK_DOCUMENTS: Document[] = [
  // POs
  {
    id: "po-1",
    type: "PO",
    poNumber: "PO123",
    vendor: "Vendor A",
    description: "Office supplies",
    totalAmount: 1234,
    currency: "USD",
    date: "2025-01-10",
    lineItems: [
      { sku: "SKU-APPLE", description: "Apple", qty: 14, unitPrice: 1.2 },
      { sku: "SKU-BANANA", description: "Banana", qty: 6, unitPrice: 0.8 },
    ],
  },
  {
    id: "po-2",
    type: "PO",
    poNumber: "PO456",
    vendor: "Vendor B",
    totalAmount: 500,
    currency: "USD",
    date: "2025-01-12",
  },
  {
    id: "po-3",
    type: "PO",
    poNumber: "PO789",
    vendor: "Vendor A",
    totalAmount: 800,
    date: "2025-01-15",
  },
  // Invoices
  {
    id: "inv-1",
    type: "INV",
    invoiceNumber: "INV-001",
    poNumber: "PO123",
    vendor: "Vendor A",
    companyName: "Vendor A Inc.",
    totalAmount: 1234,
    currency: "USD",
    date: "2025-01-14",
    lineItems: [
      { sku: "SKU-APPLE", description: "Apple Fuji Red", qty: 14, unitPrice: 1.2 },
      { sku: "SKU-BANANA", description: "Banana", qty: 5, unitPrice: 0.8 },
    ],
  },
  {
    id: "inv-2",
    type: "INV",
    invoiceNumber: "INV-002",
    poNumber: "PO456",
    vendor: "Vendor B",
    companyName: "Vendor B Ltd.",
    totalAmount: 500,
    date: "2025-01-16",
  },
  {
    id: "inv-3",
    type: "INV",
    invoiceNumber: "INV-003",
    poNumber: "PO123",
    vendor: "Vendor A",
    companyName: "Vendor A Inc.",
    totalAmount: 1200,
    date: "2025-01-18",
  },
  // GRNs
  {
    id: "grn-1",
    type: "GRN",
    grnNumber: "GRN-001",
    poNumber: "PO123",
    invoiceNumber: "INV-001",
    description: "Goods received",
    date: "2025-01-13",
    lineItems: [
      { sku: "SKU-APPLE", description: "Fuji Red", qty: 14 },
      { sku: "SKU-BANANA", description: "Banana", qty: 5 },
    ],
  },
  {
    id: "grn-2",
    type: "GRN",
    grnNumber: "GRN-002",
    poNumber: "PO456",
    invoiceNumber: "INV-002",
    date: "2025-01-17",
  },
  {
    id: "grn-3",
    type: "GRN",
    grnNumber: "GRN-003",
    poNumber: "PO123",
    date: "2025-01-19",
  },
  // DOs
  {
    id: "do-1",
    type: "DO",
    doNumber: "DO-001",
    poNumber: "PO123",
    invoiceNumber: "INV-001",
    date: "2025-01-14",
    lineItems: [{ sku: "SKU-APPLE", qty: 14 }, { sku: "SKU-BANANA", qty: 5 }],
  },
  {
    id: "do-2",
    type: "DO",
    doNumber: "DO-002",
    poNumber: "PO456",
    date: "2025-01-17",
  },
  // Credit Notes
  {
    id: "cn-1",
    type: "CN",
    creditNoteNumber: "CN-001",
    invoiceNumber: "INV-001",
    poNumber: "PO123",
    totalAmount: 50,
    reason: "Price adjustment",
    date: "2025-01-20",
  },
  {
    id: "cn-2",
    type: "CN",
    creditNoteNumber: "CN-002",
    invoiceNumber: "INV-003",
    poNumber: "PO123",
    totalAmount: 34,
    date: "2025-01-22",
  },
  // BOMs
  {
    id: "bom-1",
    type: "BOM",
    bomNumber: "BOM-001",
    poNumber: "PO123",
    sku: "SKU-APPLE",
    description: "Apple kit",
    components: [{ sku: "SKU-APPLE", qty: 1 }],
  },
  {
    id: "bom-2",
    type: "BOM",
    bomNumber: "BOM-002",
    poNumber: "PO123",
    sku: "SKU-BANANA",
    description: "Banana kit",
  },
]

export const MOCK_QUEUES: Queue[] = [
  { id: "q-po-1", name: "PO Queue 1", docType: "PO", documentIds: ["po-1", "po-2", "po-3"] },
  { id: "q-inv-1", name: "Invoice Queue 1", docType: "INV", documentIds: ["inv-1", "inv-2"] },
  { id: "q-inv-2", name: "Invoice Queue 2", docType: "INV", documentIds: ["inv-3"] },
  { id: "q-grn-1", name: "GRN Queue 1", docType: "GRN", documentIds: ["grn-1", "grn-2", "grn-3"] },
  { id: "q-do-1", name: "DO Queue 1", docType: "DO", documentIds: ["do-1", "do-2"] },
  { id: "q-cn-1", name: "Credit Note Queue 1", docType: "CN", documentIds: ["cn-1", "cn-2"] },
  { id: "q-bom-1", name: "BOM Queue 1", docType: "BOM", documentIds: ["bom-1", "bom-2"] },
]

export function getDocumentById(id: string): Document | undefined {
  return MOCK_DOCUMENTS.find((d) => d.id === id)
}

/** Display label for a document in lists (e.g. PO123, INV-001, GRN-001) */
export function getDocumentDisplayLabel(doc: Document | undefined): string {
  if (!doc) return "—"
  switch (doc.type) {
    case "PO":
      return doc.poNumber
    case "INV":
      return doc.invoiceNumber
    case "GRN":
      return doc.grnNumber
    case "DO":
      return doc.doNumber
    case "CN":
      return doc.creditNoteNumber
    case "BOM":
      return doc.bomNumber
    default:
      return (doc as Document).id
  }
}

export function getDocumentsByIds(ids: string[]): Document[] {
  return ids.map((id) => getDocumentById(id)).filter(Boolean) as Document[]
}
