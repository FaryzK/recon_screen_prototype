// Document type identifiers
export type DocType = "PO" | "INV" | "GRN" | "DO" | "CN" | "BOM"

// Base document with common fields
export interface BaseDoc {
  id: string
  type: DocType
}

export interface PODoc extends BaseDoc {
  type: "PO"
  poNumber: string
  vendor: string
  description?: string
  totalAmount?: number
  currency?: string
  date?: string
  lineItems?: { sku: string; description: string; qty: number; unitPrice: number }[]
}

export interface InvDoc extends BaseDoc {
  type: "INV"
  invoiceNumber: string
  poNumber: string
  vendor: string
  companyName?: string
  totalAmount?: number
  currency?: string
  date?: string
  lineItems?: { sku: string; description: string; qty: number; unitPrice: number }[]
}

export interface GRNDoc extends BaseDoc {
  type: "GRN"
  grnNumber: string
  poNumber: string
  invoiceNumber?: string
  description?: string
  date?: string
  lineItems?: { sku: string; description: string; qty: number }[]
}

export interface DODoc extends BaseDoc {
  type: "DO"
  doNumber: string
  poNumber?: string
  invoiceNumber?: string
  date?: string
  lineItems?: { sku: string; qty: number }[]
}

export interface CNDoc extends BaseDoc {
  type: "CN"
  creditNoteNumber: string
  invoiceNumber?: string
  poNumber?: string
  totalAmount?: number
  reason?: string
  date?: string
}

export interface BOMDoc extends BaseDoc {
  type: "BOM"
  bomNumber: string
  poNumber?: string
  sku: string
  description?: string
  components?: { sku: string; qty: number }[]
}

export type Document = PODoc | InvDoc | GRNDoc | DODoc | CNDoc | BOMDoc

// Queues (sources) - each queue holds documents of a given type
export interface Queue {
  id: string
  name: string
  docType: DocType
  documentIds: string[]
}

// Group: named collection of queues (e.g. "Invoice" = invoice queue 1 + invoice queue 2)
export interface ReconGroup {
  id: string
  name: string
  queueIds: string[]
}

// One criteria variation for a link (a set of identifier field pairs)
export interface CriteriaVariation {
  identifierFields: { fromField: string; toField: string }[]
}

// Link: how two groups are matched; can have multiple criteria variations
export interface MatchLink {
  fromGroupId: string
  toGroupId: string
  criteriaVariations: CriteriaVariation[]
}

// Matching logic: a set of links that define how documents form a set (anchor comes from rule)
export interface MatchingLogic {
  id: string
  name: string
  anchorGroupId: string
  links: MatchLink[]
}

// Comparison: which groups to compare and on which fields (not necessarily linked)
export interface ComparisonLogic {
  id: string
  name: string
  groupIds: string[]
  compareFields: { groupId: string; fieldPath: string; label?: string }[]
}

// Reconciliation rule
export interface ReconciliationRule {
  id: string
  name: string
  groups: ReconGroup[]
  anchorGroupId: string
  matchingLogics: MatchingLogic[]
  comparisonLogics: ComparisonLogic[]
}

/** Key for a link (fromGroupId-toGroupId) for use in linkVariationSelections */
export function linkKey(fromGroupId: string, toGroupId: string): string {
  return `${fromGroupId}-${toGroupId}`
}

// A "set" = one anchor document + all documents linked under a matching logic
export interface ReconSet {
  id: string
  ruleId: string
  matchingLogicId: string
  anchorDocId: string
  anchorDocType: DocType
  documentIdsByGroup: Record<string, string[]>
  status: "pending" | "reconciled" | "rejected" | "force_reconciled"
  /** Which criteria variation is selected per link; key = linkKey(from, to), value = variation index */
  linkVariationSelections?: Record<string, number>
  comparisonResults?: ComparisonResult[]
}

export interface ComparisonResult {
  comparisonLogicId: string
  rows: {
    key: string
    values: Record<string, string | number | undefined>
    isConsistent: boolean
  }[]
}

// For UI: available field paths per doc type (for building match/compare config)
export const DOC_TYPE_FIELDS: Record<DocType, { path: string; label: string }[]> = {
  PO: [
    { path: "poNumber", label: "PO Number" },
    { path: "vendor", label: "Vendor" },
    { path: "description", label: "Description" },
    { path: "totalAmount", label: "Total Amount" },
    { path: "date", label: "Date" },
  ],
  INV: [
    { path: "invoiceNumber", label: "Invoice Number" },
    { path: "poNumber", label: "PO Number" },
    { path: "vendor", label: "Vendor" },
    { path: "companyName", label: "Company Name" },
    { path: "totalAmount", label: "Total Amount" },
    { path: "date", label: "Date" },
  ],
  GRN: [
    { path: "grnNumber", label: "GRN Number" },
    { path: "poNumber", label: "PO Number" },
    { path: "invoiceNumber", label: "Invoice Number" },
    { path: "description", label: "Description" },
    { path: "date", label: "Date" },
  ],
  DO: [
    { path: "doNumber", label: "DO Number" },
    { path: "poNumber", label: "PO Number" },
    { path: "invoiceNumber", label: "Invoice Number" },
    { path: "date", label: "Date" },
  ],
  CN: [
    { path: "creditNoteNumber", label: "Credit Note Number" },
    { path: "invoiceNumber", label: "Invoice Number" },
    { path: "poNumber", label: "PO Number" },
    { path: "totalAmount", label: "Total Amount" },
    { path: "date", label: "Date" },
  ],
  BOM: [
    { path: "bomNumber", label: "BOM Number" },
    { path: "poNumber", label: "PO Number" },
    { path: "sku", label: "SKU" },
    { path: "description", label: "Description" },
  ],
}
