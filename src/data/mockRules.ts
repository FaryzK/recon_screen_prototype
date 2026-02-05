import type { ReconciliationRule, ReconSet } from "@/types/data"
import { linkKey } from "@/types/data"

/** Mock: for a given set and link variation selections, doc ids for the "to" group of each link. Used to show different match counts when switching variation. */
export const MOCK_LINK_VARIATION_TO_DOCS: Record<
  string,
  Record<string, Record<number, string[]>>
> = {
  "set-1": {
    [linkKey("g-po", "g-inv")]: {
      0: ["inv-1", "inv-3"],
      1: ["inv-1"],
    },
    [linkKey("g-po", "g-grn")]: { 0: ["grn-1", "grn-3"] },
    [linkKey("g-po", "g-do")]: { 0: ["do-1"] },
    [linkKey("g-inv", "g-grn")]: { 0: ["grn-1", "grn-3"] },
    [linkKey("g-inv", "g-cn")]: { 0: ["cn-1", "cn-2"] },
    [linkKey("g-po", "g-bom")]: { 0: ["bom-1", "bom-2"] },
  },
  "set-2": {
    [linkKey("g-po", "g-inv")]: { 0: ["inv-2"] },
    [linkKey("g-po", "g-grn")]: { 0: ["grn-2"] },
    [linkKey("g-po", "g-do")]: { 0: ["do-2"] },
    [linkKey("g-inv", "g-grn")]: { 0: ["grn-2"] },
    [linkKey("g-inv", "g-cn")]: { 0: [] },
    [linkKey("g-po", "g-bom")]: { 0: [] },
  },
}

/** Recompute documentIdsByGroup for a set from base docs + link variation overrides. */
export function getDocumentIdsByGroupForVariations(
  set: ReconSet,
  rule: ReconciliationRule,
  linkVariationSelections: Record<string, number>
): Record<string, string[]> {
  const base = { ...set.documentIdsByGroup }
  const mockBySet = MOCK_LINK_VARIATION_TO_DOCS[set.id]
  if (!mockBySet) return base
  const matchingLogic = rule.matchingLogics?.find((m) => m.id === set.matchingLogicId)
  if (!matchingLogic) return base
  const result = { ...base }
  for (const link of matchingLogic.links) {
    const key = linkKey(link.fromGroupId, link.toGroupId)
    const byVariation = mockBySet[key]
    if (!byVariation) continue
    const varIdx = linkVariationSelections[key] ?? 0
    const docIds = byVariation[varIdx]
    if (docIds !== undefined) result[link.toGroupId] = docIds
  }
  return result
}

export const MOCK_RULES: ReconciliationRule[] = [
  {
    id: "rule-1",
    name: "PO-based reconciliation",
    groups: [
      { id: "g-po", name: "PO", queueIds: ["q-po-1"] },
      { id: "g-inv", name: "Invoice", queueIds: ["q-inv-1", "q-inv-2"] },
      { id: "g-grn", name: "GRN", queueIds: ["q-grn-1"] },
      { id: "g-do", name: "DO", queueIds: ["q-do-1"] },
      { id: "g-cn", name: "Credit Note", queueIds: ["q-cn-1"] },
      { id: "g-bom", name: "BOM", queueIds: ["q-bom-1"] },
    ],
    anchorGroupId: "g-po",
    matchingLogics: [
      {
        id: "match-1",
        name: "By PO number",
        anchorGroupId: "g-po",
        links: [
          {
            fromGroupId: "g-po",
            toGroupId: "g-inv",
            criteriaVariations: [
              { identifierFields: [{ fromField: "poNumber", toField: "poNumber" }] },
              { identifierFields: [{ fromField: "poNumber", toField: "poNumber" }, { fromField: "vendor", toField: "companyName" }] },
            ],
          },
          {
            fromGroupId: "g-po",
            toGroupId: "g-grn",
            criteriaVariations: [
              { identifierFields: [{ fromField: "poNumber", toField: "poNumber" }] },
            ],
          },
          {
            fromGroupId: "g-po",
            toGroupId: "g-do",
            criteriaVariations: [
              { identifierFields: [{ fromField: "poNumber", toField: "poNumber" }] },
            ],
          },
          {
            fromGroupId: "g-inv",
            toGroupId: "g-grn",
            criteriaVariations: [
              { identifierFields: [{ fromField: "invoiceNumber", toField: "invoiceNumber" }] },
            ],
          },
          {
            fromGroupId: "g-inv",
            toGroupId: "g-cn",
            criteriaVariations: [
              { identifierFields: [{ fromField: "invoiceNumber", toField: "invoiceNumber" }] },
            ],
          },
          {
            fromGroupId: "g-po",
            toGroupId: "g-bom",
            criteriaVariations: [
              { identifierFields: [{ fromField: "poNumber", toField: "poNumber" }] },
            ],
          },
        ],
      },
    ],
    comparisonLogics: [
      {
        id: "comp-1",
        name: "GRN vs PO quantities",
        groupIds: ["g-grn", "g-po"],
        compareFields: [
          { groupId: "g-grn", fieldPath: "lineItems[].description", label: "GRN Desc" },
          { groupId: "g-grn", fieldPath: "lineItems[].qty", label: "GRN Qty" },
          { groupId: "g-po", fieldPath: "lineItems[].description", label: "PO Item" },
          { groupId: "g-po", fieldPath: "lineItems[].qty", label: "PO Qty" },
        ],
      },
      {
        id: "comp-2",
        name: "PO vs Invoice vs Credit Note amounts",
        groupIds: ["g-po", "g-inv", "g-cn"],
        compareFields: [
          { groupId: "g-po", fieldPath: "totalAmount", label: "PO Total" },
          { groupId: "g-inv", fieldPath: "totalAmount", label: "Invoice Total" },
          { groupId: "g-cn", fieldPath: "totalAmount", label: "CN Total" },
        ],
      },
    ],
  },
  {
    id: "rule-2",
    name: "Invoice anchor (alternative)",
    groups: [
      { id: "g-inv-2", name: "Invoice", queueIds: ["q-inv-1", "q-inv-2"] },
      { id: "g-po-2", name: "PO", queueIds: ["q-po-1"] },
    ],
    anchorGroupId: "g-inv-2",
    matchingLogics: [
      {
        id: "match-2",
        name: "Invoice to PO",
        anchorGroupId: "g-inv-2",
        links: [
          {
            fromGroupId: "g-inv-2",
            toGroupId: "g-po-2",
            criteriaVariations: [
              { identifierFields: [{ fromField: "poNumber", toField: "poNumber" }] },
            ],
          },
        ],
      },
    ],
    comparisonLogics: [],
  },
]

export const MOCK_SETS: ReconSet[] = [
  {
    id: "set-1",
    ruleId: "rule-1",
    matchingLogicId: "match-1",
    anchorDocId: "po-1",
    anchorDocType: "PO",
    documentIdsByGroup: {
      "g-po": ["po-1"],
      "g-inv": ["inv-1", "inv-3"],
      "g-grn": ["grn-1", "grn-3"],
      "g-do": ["do-1"],
      "g-cn": ["cn-1", "cn-2"],
      "g-bom": ["bom-1", "bom-2"],
    },
    linkVariationSelections: {
      [linkKey("g-po", "g-inv")]: 0,
      [linkKey("g-po", "g-grn")]: 0,
      [linkKey("g-po", "g-do")]: 0,
      [linkKey("g-inv", "g-grn")]: 0,
      [linkKey("g-inv", "g-cn")]: 0,
      [linkKey("g-po", "g-bom")]: 0,
    },
    status: "pending",
    comparisonResults: [
      {
        comparisonLogicId: "comp-1",
        rows: [
          { key: "Apple", values: { "g-grn": "Fuji Red", "GRN Qty": 14, "g-po": "Apple", "PO Qty": 14 }, isConsistent: true },
          { key: "Banana", values: { "g-grn": "Banana", "GRN Qty": 5, "g-po": "Banana", "PO Qty": 6 }, isConsistent: false },
        ],
      },
      {
        comparisonLogicId: "comp-2",
        rows: [
          { key: "Amounts", values: { "g-po": 1234, "g-inv": 1234, "g-cn": 50 }, isConsistent: true },
        ],
      },
    ],
  },
  {
    id: "set-2",
    ruleId: "rule-1",
    matchingLogicId: "match-1",
    anchorDocId: "po-2",
    anchorDocType: "PO",
    documentIdsByGroup: {
      "g-po": ["po-2"],
      "g-inv": ["inv-2"],
      "g-grn": ["grn-2"],
      "g-do": ["do-2"],
      "g-cn": [],
      "g-bom": [],
    },
    linkVariationSelections: {},
    status: "pending",
    comparisonResults: [],
  },
]

export function getRuleById(id: string) {
  return MOCK_RULES.find((r) => r.id === id)
}

export function getSetsByRuleId(ruleId: string): ReconSet[] {
  return MOCK_SETS.filter((s) => s.ruleId === ruleId)
}

export function getSetById(id: string) {
  return MOCK_SETS.find((s) => s.id === id)
}
