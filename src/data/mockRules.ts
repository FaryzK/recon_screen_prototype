import type { ReconciliationRule, ReconSet } from "@/types/data"

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
    matchingLogics: [
      {
        id: "match-1",
        name: "By PO number",
        anchorGroupId: "g-po",
        links: [
          { fromGroupId: "g-po", toGroupId: "g-inv", identifierFields: [{ fromField: "poNumber", toField: "poNumber" }] },
          { fromGroupId: "g-po", toGroupId: "g-grn", identifierFields: [{ fromField: "poNumber", toField: "poNumber" }] },
          { fromGroupId: "g-po", toGroupId: "g-do", identifierFields: [{ fromField: "poNumber", toField: "poNumber" }] },
          { fromGroupId: "g-inv", toGroupId: "g-grn", identifierFields: [{ fromField: "invoiceNumber", toField: "invoiceNumber" }] },
          { fromGroupId: "g-inv", toGroupId: "g-cn", identifierFields: [{ fromField: "invoiceNumber", toField: "invoiceNumber" }] },
          { fromGroupId: "g-po", toGroupId: "g-bom", identifierFields: [{ fromField: "poNumber", toField: "poNumber" }] },
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
    matchingLogics: [
      {
        id: "match-2",
        name: "Invoice to PO",
        anchorGroupId: "g-inv-2",
        links: [
          { fromGroupId: "g-inv-2", toGroupId: "g-po-2", identifierFields: [{ fromField: "poNumber", toField: "poNumber" }] },
        ],
      },
    ],
    comparisonLogics: [],
  },
]

// Derived sets for rule-1, match-1 (mock: we compute which docs belong together)
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
