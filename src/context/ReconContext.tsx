import React, { createContext, useContext, useState, useCallback } from "react"
import type { ReconciliationRule, ReconSet } from "@/types/data"
import { MOCK_RULES } from "@/data/mockRules"
import { MOCK_SETS } from "@/data/mockRules"

interface ReconState {
  rules: ReconciliationRule[]
  sets: ReconSet[]
}

interface ReconContextValue extends ReconState {
  addRule: (rule: Omit<ReconciliationRule, "id">) => void
  updateSetDocuments: (setId: string, groupId: string, documentIds: string[]) => void
  setSetStatus: (setId: string, status: ReconSet["status"]) => void
  getSetsForRule: (ruleId: string) => ReconSet[]
}

const ReconContext = createContext<ReconContextValue | null>(null)

export function ReconProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<ReconciliationRule[]>(MOCK_RULES)
  const [sets, setSets] = useState<ReconSet[]>(MOCK_SETS)

  const addRule = useCallback((rule: Omit<ReconciliationRule, "id">) => {
    const id = `rule-${Date.now()}`
    setRules((prev) => [...prev, { ...rule, id }])
    // Mock: no new sets generated for new rule in this demo
  }, [])

  const updateSetDocuments = useCallback(
    (setId: string, groupId: string, documentIds: string[]) => {
      setSets((prev) =>
        prev.map((s) =>
          s.id === setId
            ? { ...s, documentIdsByGroup: { ...s.documentIdsByGroup, [groupId]: documentIds } }
            : s
        )
      )
    },
    []
  )

  const setSetStatus = useCallback((setId: string, status: ReconSet["status"]) => {
    setSets((prev) =>
      prev.map((s) => (s.id === setId ? { ...s, status } : s))
    )
  }, [])

  const getSetsForRule = useCallback(
    (ruleId: string) => sets.filter((s) => s.ruleId === ruleId),
    [sets]
  )

  const value: ReconContextValue = {
    rules,
    sets,
    addRule,
    updateSetDocuments,
    setSetStatus,
    getSetsForRule,
  }

  return (
    <ReconContext.Provider value={value}>{children}</ReconContext.Provider>
  )
}

export function useRecon() {
  const ctx = useContext(ReconContext)
  if (!ctx) throw new Error("useRecon must be used within ReconProvider")
  return ctx
}
