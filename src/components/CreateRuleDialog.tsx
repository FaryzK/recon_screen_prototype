import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRecon } from "@/context/ReconContext"
import { MOCK_QUEUES } from "@/data/mockDocuments"
import type { ReconGroup, MatchLink, ComparisonLogic } from "@/types/data"
import { DOC_TYPE_FIELDS } from "@/types/data"
import type { DocType } from "@/types/data"
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface CreateRuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getDocTypeForGroup(group: ReconGroup): DocType | undefined {
  const queue = group.queueIds.length > 0 ? MOCK_QUEUES.find((q) => q.id === group.queueIds[0]) : undefined
  return queue?.docType
}

export function CreateRuleDialog({ open, onOpenChange }: CreateRuleDialogProps) {
  const { addRule } = useRecon()
  const [step, setStep] = useState(1)
  const [ruleName, setRuleName] = useState("")
  const [groups, setGroups] = useState<ReconGroup[]>([])
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupQueueIds, setNewGroupQueueIds] = useState<string[]>([])
  const [anchorGroupId, setAnchorGroupId] = useState<string>("")
  const [matchingLogics, setMatchingLogics] = useState<
    { name: string; anchorGroupId: string; links: MatchLink[] }[]
  >([])
  const [comparisonLogics, setComparisonLogics] = useState<
    Omit<ComparisonLogic, "id">[]
  >([])

  const addGroup = () => {
    if (!newGroupName.trim() || newGroupQueueIds.length === 0) return
    setGroups((prev) => [
      ...prev,
      {
        id: `g-${Date.now()}`,
        name: newGroupName.trim(),
        queueIds: [...newGroupQueueIds],
      },
    ])
    setNewGroupName("")
    setNewGroupQueueIds([])
  }

  const removeGroup = (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id))
  }

  const toggleQueueForNewGroup = (queueId: string) => {
    setNewGroupQueueIds((prev) =>
      prev.includes(queueId) ? prev.filter((id) => id !== queueId) : [...prev, queueId]
    )
  }

  const addMatchingLogic = () => {
    if (groups.length < 2) return
    const anchor = (anchorGroupId || groups[0]?.id) ?? ""
    const fromId = groups[0].id
    const toId = groups.find((g) => g.id !== fromId)?.id ?? groups[1].id
    setMatchingLogics((prev) => [
      ...prev,
      {
        name: `Matching Link ${prev.length + 1}`,
        anchorGroupId: anchor,
        links: [
          {
            fromGroupId: fromId,
            toGroupId: toId,
            criteriaVariations: [{ identifierFields: [{ fromField: "poNumber", toField: "poNumber" }] }],
          },
        ],
      },
    ])
    if (!anchorGroupId) setAnchorGroupId(anchor)
  }

  const removeMatchingLogic = (logicIndex: number) => {
    setMatchingLogics((prev) => prev.filter((_, i) => i !== logicIndex))
  }

  const removeVariationFromLink = (logicIndex: number, linkIndex: number, variationIndex: number) => {
    const link = matchingLogics[logicIndex]?.links[linkIndex]
    if (!link || link.criteriaVariations.length <= 1) return
    setMatchingLogics((prev) => {
      const next = [...prev]
      const logics = [...next[logicIndex].links]
      const variations = logics[linkIndex].criteriaVariations.filter((_, i) => i !== variationIndex)
      logics[linkIndex] = { ...logics[linkIndex], criteriaVariations: variations }
      next[logicIndex] = { ...next[logicIndex], links: logics }
      return next
    })
  }

  const addVariationToLink = (logicIndex: number, linkIndex: number) => {
    const link = matchingLogics[logicIndex]?.links[linkIndex]
    if (!link) return
    const fromGroup = groups.find((g) => g.id === link.fromGroupId)
    const toGroup = groups.find((g) => g.id === link.toGroupId)
    const fromType = fromGroup ? getDocTypeForGroup(fromGroup) : "PO"
    const toType = toGroup ? getDocTypeForGroup(toGroup) : "INV"
    const fromFields = DOC_TYPE_FIELDS[fromType ?? "PO"] ?? []
    const toFields = DOC_TYPE_FIELDS[toType ?? "INV"] ?? []
    const fromField = fromFields[0]?.path ?? "poNumber"
    const toField = toFields[0]?.path ?? "poNumber"
    setMatchingLogics((prev) => {
      const next = [...prev]
      const logics = [...next[logicIndex].links]
      logics[linkIndex] = {
        ...logics[linkIndex],
        criteriaVariations: [
          ...logics[linkIndex].criteriaVariations,
          { identifierFields: [{ fromField, toField }] },
        ],
      }
      next[logicIndex] = { ...next[logicIndex], links: logics }
      return next
    })
  }

  const updateLinkGroups = (logicIndex: number, linkIndex: number, fromGroupId: string, toGroupId: string) => {
    setMatchingLogics((prev) => {
      const next = [...prev]
      const fromGroup = groups.find((g) => g.id === fromGroupId)
      const toGroup = groups.find((g) => g.id === toGroupId)
      const fromType = fromGroup ? getDocTypeForGroup(fromGroup) : "PO"
      const toType = toGroup ? getDocTypeForGroup(toGroup) : "INV"
      const fromFields = DOC_TYPE_FIELDS[fromType ?? "PO"] ?? []
      const toFields = DOC_TYPE_FIELDS[toType ?? "INV"] ?? []
      const fromField = fromFields[0]?.path ?? "poNumber"
      const toField = toFields[0]?.path ?? "poNumber"
      const logics = [...next[logicIndex].links]
      const existingVariations = logics[linkIndex].criteriaVariations
      logics[linkIndex] = {
        fromGroupId,
        toGroupId,
        criteriaVariations:
          existingVariations.length > 0
            ? existingVariations.map((v) => ({
                identifierFields:
                  v.identifierFields.length > 0
                    ? v.identifierFields
                    : [{ fromField, toField }],
              }))
            : [{ identifierFields: [{ fromField, toField }] }],
      }
      next[logicIndex] = { ...next[logicIndex], links: logics }
      return next
    })
  }

  const updateOneCriterion = (
    logicIndex: number,
    linkIndex: number,
    variationIndex: number,
    criterionIndex: number,
    fromField: string,
    toField: string
  ) => {
    setMatchingLogics((prev) => {
      const next = [...prev]
      const logics = [...next[logicIndex].links]
      const variations = [...logics[linkIndex].criteriaVariations]
      const fields = [...variations[variationIndex].identifierFields]
      fields[criterionIndex] = { fromField, toField }
      variations[variationIndex] = { identifierFields: fields }
      logics[linkIndex] = { ...logics[linkIndex], criteriaVariations: variations }
      next[logicIndex] = { ...next[logicIndex], links: logics }
      return next
    })
  }

  const addCriteriaToVariation = (logicIndex: number, linkIndex: number, variationIndex: number) => {
    const link = matchingLogics[logicIndex]?.links[linkIndex]
    const variation = link?.criteriaVariations[variationIndex]
    if (!link || !variation) return
    const fromGroup = groups.find((g) => g.id === link.fromGroupId)
    const toGroup = groups.find((g) => g.id === link.toGroupId)
    const fromType = fromGroup ? getDocTypeForGroup(fromGroup) : "PO"
    const toType = toGroup ? getDocTypeForGroup(toGroup) : "INV"
    const fromFields = DOC_TYPE_FIELDS[fromType ?? "PO"] ?? []
    const toFields = DOC_TYPE_FIELDS[toType ?? "INV"] ?? []
    const fromField = fromFields[0]?.path ?? "poNumber"
    const toField = toFields[0]?.path ?? "poNumber"
    setMatchingLogics((prev) => {
      const next = [...prev]
      const logics = [...next[logicIndex].links]
      const variations = [...logics[linkIndex].criteriaVariations]
      variations[variationIndex] = {
        identifierFields: [...variations[variationIndex].identifierFields, { fromField, toField }],
      }
      logics[linkIndex] = { ...logics[linkIndex], criteriaVariations: variations }
      next[logicIndex] = { ...next[logicIndex], links: logics }
      return next
    })
  }

  const removeCriteriaFromVariation = (
    logicIndex: number,
    linkIndex: number,
    variationIndex: number,
    criterionIndex: number
  ) => {
    setMatchingLogics((prev) => {
      const next = [...prev]
      const logics = [...next[logicIndex].links]
      const variations = [...logics[linkIndex].criteriaVariations]
      const fields = variations[variationIndex].identifierFields.filter((_, i) => i !== criterionIndex)
      variations[variationIndex] = {
        identifierFields: fields.length > 0 ? fields : [{ fromField: "poNumber", toField: "poNumber" }],
      }
      logics[linkIndex] = { ...logics[linkIndex], criteriaVariations: variations }
      next[logicIndex] = { ...next[logicIndex], links: logics }
      return next
    })
  }

  const addComparisonLogic = () => {
    if (groups.length < 2) return
    setComparisonLogics((prev) => [
      ...prev,
      {
        name: `Comparison ${prev.length + 1}`,
        groupIds: groups.slice(0, 2).map((g) => g.id),
        compareFields: [],
      },
    ])
  }

  const updateComparisonGroupIds = (compIndex: number, groupIds: string[]) => {
    setComparisonLogics((prev) => {
      const next = [...prev]
      const existing = next[compIndex].compareFields
      const kept = existing.filter((f) => groupIds.includes(f.groupId))
      next[compIndex] = { ...next[compIndex], groupIds, compareFields: kept }
      return next
    })
  }

  /** Set the single comparison field for a group (radio: one field per group). */
  const setComparisonFieldForGroup = (compIndex: number, groupId: string, fieldPath: string, label: string) => {
    setComparisonLogics((prev) => {
      const next = [...prev]
      const rest = next[compIndex].compareFields.filter((f) => f.groupId !== groupId)
      next[compIndex].compareFields = [...rest, { groupId, fieldPath, label }]
      return next
    })
  }

  const handleCreate = () => {
    if (!ruleName.trim() || groups.length === 0) return
    addRule({
      name: ruleName.trim(),
      groups,
      anchorGroupId: (anchorGroupId || groups[0]?.id) ?? "",
      matchingLogics: matchingLogics.map((m, i) => ({
        id: `match-${Date.now()}-${i}`,
        name: m.name,
        anchorGroupId: (anchorGroupId || m.anchorGroupId) ?? "",
        links: m.links,
      })),
      comparisonLogics: comparisonLogics.map((c, i) => ({
        ...c,
        id: `comp-${Date.now()}-${i}`,
      })),
    })
    onOpenChange(false)
    setStep(1)
    setRuleName("")
    setGroups([])
    setAnchorGroupId("")
    setMatchingLogics([])
    setComparisonLogics([])
  }

  const canNext = () => {
    if (step === 1) return ruleName.trim() !== "" && groups.length > 0
    if (step === 2) return true
    return true
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-card" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Create reconciliation rule</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? "Groups" : step === 2 ? "Matching logic" : "Comparison logic"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="flex-1 overflow-auto space-y-4">
            <div>
              <label className="text-sm font-medium">Rule name</label>
              <Input
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g. PO-based reconciliation"
                className="mt-1"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Document groups</p>
              <p className="text-sm text-muted-foreground mb-3">
                Give each group a name and select which queues belong to it (e.g. Invoice = Invoice Queue 1 + Invoice Queue 2).
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{g.name}</span>
                    <span className="text-muted-foreground">
                      ({g.queueIds.map((qid) => MOCK_QUEUES.find((q) => q.id === qid)?.name ?? qid).join(", ")})
                    </span>
                    <button
                      type="button"
                      onClick={() => removeGroup(g.id)}
                      className="text-destructive hover:bg-destructive/10 rounded p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border p-4 space-y-3">
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name (e.g. Invoice)"
                />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Select queues for this group</p>
                  <div className="flex flex-wrap gap-3">
                    {MOCK_QUEUES.map((q) => (
                      <label key={q.id} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox
                          checked={newGroupQueueIds.includes(q.id)}
                          onCheckedChange={() => toggleQueueForNewGroup(q.id)}
                        />
                        {q.name}
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="button" onClick={addGroup} disabled={!newGroupName.trim() || newGroupQueueIds.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add group
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 overflow-auto space-y-4">
            <div className="rounded-lg border p-4 bg-muted/20">
              <p className="text-sm font-medium mb-2">Anchor group</p>
              <p className="text-xs text-muted-foreground mb-2">Select which document group is the anchor (e.g. PO). All matching logics use this anchor.</p>
              <Select
                value={anchorGroupId || (groups[0]?.id ?? "")}
                onValueChange={(v) => {
                  setAnchorGroupId(v)
                  setMatchingLogics((prev) => prev.map((m) => ({ ...m, anchorGroupId: v })))
                }}
              >
                <SelectTrigger className="w-48 bg-card">
                  <SelectValue placeholder="Select anchor..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Add matching links. For each link pick from/to groups and define one or more criteria variations (each variation = set of field pairs to match on).
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => addMatchingLogic()} disabled={groups.length < 2}>
              <Plus className="h-4 w-4 mr-1" />
              Add Matching link
            </Button>
            {matchingLogics.map((logic, logicIdx) => {
              const link = logic.links[0]
              if (!link) return null
              const fromGroup = groups.find((g) => g.id === link.fromGroupId)
              const toGroup = groups.find((g) => g.id === link.toGroupId)
              const fromType = fromGroup ? getDocTypeForGroup(fromGroup) : "PO"
              const toType = toGroup ? getDocTypeForGroup(toGroup) : "INV"
              const linkIdx = 0
              return (
                <div key={logicIdx} className="rounded-lg border-2 border-primary/20 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">Matching Link {logicIdx + 1}</span>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeMatchingLogic(logicIdx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">From group → To group. Each link can have multiple criteria variations.</p>
                    <div className="rounded border bg-muted/30 p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">From group</p>
                          <Select
                            value={link.fromGroupId}
                            onValueChange={(v) => updateLinkGroups(logicIdx, linkIdx, v, link.toGroupId)}
                          >
                            <SelectTrigger className="w-full bg-card">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {groups.map((g) => (
                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">To group</p>
                          <Select
                            value={link.toGroupId}
                            onValueChange={(v) => updateLinkGroups(logicIdx, linkIdx, link.fromGroupId, v)}
                          >
                            <SelectTrigger className="w-full bg-card">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {groups.map((g) => (
                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {link.criteriaVariations.map((variation, varIdx) => (
                        <div key={varIdx} className="rounded bg-muted/20 p-2 space-y-2 ml-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Variation {varIdx + 1}</span>
                            {link.criteriaVariations.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" className="text-destructive h-7 text-xs" onClick={() => removeVariationFromLink(logicIdx, linkIdx, varIdx)}>
                                <Trash2 className="h-3 w-3 mr-1" /> Remove
                              </Button>
                            )}
                          </div>
                          {variation.identifierFields.map((pair, critIdx) => {
                            const fromFieldsCur = DOC_TYPE_FIELDS[fromType ?? "PO"] ?? []
                            const toFieldsCur = DOC_TYPE_FIELDS[toType ?? "INV"] ?? []
                            return (
                              <div key={critIdx} className="flex items-center gap-2 flex-wrap">
                                <Select
                                  value={pair.fromField}
                                  onValueChange={(fromField) => updateOneCriterion(logicIdx, linkIdx, varIdx, critIdx, fromField, pair.toField)}
                                >
                                  <SelectTrigger className="w-36 bg-card">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fromFieldsCur.map((f) => (
                                      <SelectItem key={f.path} value={f.path}>{f.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-muted-foreground text-sm">↔</span>
                                <Select
                                  value={pair.toField}
                                  onValueChange={(toField) => updateOneCriterion(logicIdx, linkIdx, varIdx, critIdx, pair.fromField, toField)}
                                >
                                  <SelectTrigger className="w-36 bg-card">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {toFieldsCur.map((f) => (
                                      <SelectItem key={f.path} value={f.path}>{f.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {variation.identifierFields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive h-8"
                                    onClick={() => removeCriteriaFromVariation(logicIdx, linkIdx, varIdx, critIdx)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )
                          })}
                          <Button type="button" variant="ghost" size="sm" onClick={() => addCriteriaToVariation(logicIdx, linkIdx, varIdx)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add criteria
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="ghost" size="sm" onClick={() => addVariationToLink(logicIdx, linkIdx)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add variation
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 overflow-auto space-y-4">
            <p className="text-sm text-muted-foreground">
              Define how groups in a set are compared (not necessarily linked). Select groups and one field per group to compare.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={addComparisonLogic} disabled={groups.length < 2}>
              <Plus className="h-4 w-4 mr-1" />
              Add comparison logic
            </Button>
            {comparisonLogics.map((comp, idx) => (
              <div key={idx} className="rounded-lg border p-4 space-y-3">
                <span className="font-medium block">Comparison {idx + 1}</span>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Groups to compare</p>
                  <div className="flex flex-wrap gap-3 mb-2">
                    {groups.map((g) => (
                      <label key={g.id} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox
                          checked={comp.groupIds.includes(g.id)}
                          onCheckedChange={(checked) => {
                            const nextIds = checked
                              ? [...comp.groupIds, g.id]
                              : comp.groupIds.filter((id) => id !== g.id)
                            updateComparisonGroupIds(idx, nextIds)
                          }}
                        />
                        {g.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Field to compare (per group) — pick one per group</p>
                  {comp.groupIds.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Select groups above first.</p>
                  ) : (
                    <div className="space-y-3">
                      {comp.groupIds.map((gid) => {
                        const g = groups.find((gr) => gr.id === gid)
                        const docType = g ? getDocTypeForGroup(g) : "PO"
                        const fields = DOC_TYPE_FIELDS[docType ?? "PO"] ?? []
                        const selectedField = comp.compareFields.find((cf) => cf.groupId === gid)?.fieldPath
                        return (
                          <div key={gid} className="rounded border bg-muted/20 p-2">
                            <p className="text-xs font-medium mb-2">{g?.name ?? gid}</p>
                            <div className="flex flex-col gap-1.5">
                              {fields.map((f) => (
                                <label key={f.path} className="flex items-center gap-2 cursor-pointer text-sm">
                                  <input
                                    type="radio"
                                    name={`comp-${idx}-group-${gid}`}
                                    checked={selectedField === f.path}
                                    onChange={() => setComparisonFieldForGroup(idx, gid, f.path, f.label)}
                                    className="h-4 w-4 border-input accent-primary"
                                  />
                                  {f.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 3 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={!ruleName.trim() || groups.length === 0}>
                Create
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
