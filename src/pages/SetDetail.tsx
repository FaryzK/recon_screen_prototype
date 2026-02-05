import { useParams, useNavigate } from "react-router-dom"
import { useRecon } from "@/context/ReconContext"
import { getRuleById, getSetById } from "@/data/mockRules"
import { getDocumentById, getDocumentDisplayLabel } from "@/data/mockDocuments"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Check, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import type { ReconciliationRule, ReconSet } from "@/types/data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Node graph: matching links (dashed) + optional comparison edges (dotted, different color)
function NodeGraph({
  rule,
  set,
  onSelectGroup,
  selectedGroupId,
  selectedComparisonLogicId,
}: {
  rule: ReconciliationRule
  set: ReconSet
  onSelectGroup: (id: string | null) => void
  selectedGroupId: string | null
  selectedComparisonLogicId: string | null
}) {
  const groups = rule.groups
  const matchingLogic = rule.matchingLogics.find((m) => m.id === set.matchingLogicId)
  const links = matchingLogic?.links ?? []
  const comparisonLogic = selectedComparisonLogicId
    ? rule.comparisonLogics.find((c) => c.id === selectedComparisonLogicId)
    : null
  const positions: Record<string, { x: number; y: number }> = {}
  const radius = 160
  const centerX = 240
  const centerY = 200
  groups.forEach((g, i) => {
    const angle = (i / groups.length) * 2 * Math.PI - Math.PI / 2
    positions[g.id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  })

  const w = 480
  const h = 420

  return (
    <div className="relative w-full rounded-lg border bg-muted/20 overflow-visible">
      <p className="text-sm text-muted-foreground p-3 pb-0 break-words">
        Nodes are document groups; dashed edges show matching links.
        {selectedComparisonLogicId && comparisonLogic && (
          <span className="block mt-1 text-destructive font-medium">
            Red dotted lines show comparison: {comparisonLogic.name}
          </span>
        )}
        {" "}Click a node to view or edit documents in that group.
      </p>
      <svg
        width="100%"
        height="380"
        viewBox={`0 0 ${w} ${h}`}
        className="overflow-visible"
        style={{ minHeight: "380px" }}
      >
        {/* Comparison edges (dotted, red) */}
        {comparisonLogic && comparisonLogic.groupIds.length >= 2 && (
          <>
            {comparisonLogic.groupIds.slice(0, -1).map((_, i) => {
              const fromId = comparisonLogic.groupIds[i]
              const toId = comparisonLogic.groupIds[i + 1]
              const from = positions[fromId]
              const to = positions[toId]
              if (!from || !to) return null
              return (
                <line
                  key={`comp-${fromId}-${toId}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="hsl(var(--destructive))"
                  strokeWidth="2"
                  strokeDasharray="2 4"
                  opacity={0.9}
                  strokeLinecap="round"
                />
              )
            })}
            {comparisonLogic.groupIds.length > 2 && (() => {
              const first = positions[comparisonLogic.groupIds[0]]
              const last = positions[comparisonLogic.groupIds[comparisonLogic.groupIds.length - 1]]
              if (!first || !last) return null
              return (
                <line
                  x1={first.x}
                  y1={first.y}
                  x2={last.x}
                  y2={last.y}
                  stroke="hsl(var(--destructive))"
                  strokeWidth="2"
                  strokeDasharray="2 4"
                  opacity={0.9}
                  strokeLinecap="round"
                />
              )
            })()}
          </>
        )}
        {/* Matching links */}
        {links.map((link) => {
          const from = positions[link.fromGroupId]
          const to = positions[link.toGroupId]
          if (!from || !to) return null
          return (
            <line
              key={`${link.fromGroupId}-${link.toGroupId}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeDasharray="6 3"
              opacity={0.6}
            />
          )
        })}
        {groups.map((g) => {
          const pos = positions[g.id]
          if (!pos) return null
          const count = set.documentIdsByGroup[g.id]?.length ?? 0
          const isSelected = selectedGroupId === g.id
          return (
            <g
              key={g.id}
              onClick={() => onSelectGroup(isSelected ? null : g.id)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r="34"
                fill="hsl(var(--card))"
                stroke={isSelected ? "hsl(var(--ring))" : "hsl(var(--primary))"}
                strokeWidth={isSelected ? 4 : 2}
              />
              <text
                x={pos.x}
                y={pos.y - 5}
                textAnchor="middle"
                className="text-sm font-medium fill-foreground"
              >
                {g.name}
              </text>
              <text
                x={pos.x}
                y={pos.y + 12}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {count} doc(s)
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function SetDetail() {
  const { ruleId, setId } = useParams<{ ruleId: string; setId: string }>()
  const navigate = useNavigate()
  const { rules, getSetsForRule, updateSetDocuments, setSetStatus } = useRecon()
  const rule = ruleId ? rules.find((r) => r.id === ruleId) ?? getRuleById(ruleId!) : null
  const sets = ruleId ? getSetsForRule(ruleId) : []
  const set = setId ? sets.find((s) => s.id === setId) ?? getSetById(setId) : null
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedComparisonLogicId, setSelectedComparisonLogicId] = useState<string | null>(null)

  if (!rule || !set) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Set not found.</p>
        <Button variant="link" className="mt-2" onClick={() => navigate(`/rule/${ruleId}`)}>
          Back to rule
        </Button>
      </div>
    )
  }

  const selectedGroup = selectedGroupId ? rule.groups.find((g) => g.id === selectedGroupId) : null
  const docIdsInGroup = selectedGroupId ? set.documentIdsByGroup[selectedGroupId] ?? [] : []
  const selectedComparison = selectedComparisonLogicId
    ? rule.comparisonLogics.find((c) => c.id === selectedComparisonLogicId)
    : null
  const comparisonResult = set.comparisonResults?.find(
    (cr) => cr.comparisonLogicId === selectedComparisonLogicId
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/rule/${ruleId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              Set: {getDocumentDisplayLabel(getDocumentById(set.anchorDocId))}
            </h1>
            <p className="text-sm text-muted-foreground">Rule: {rule.name}</p>
          </div>
          <Badge variant={set.status === "pending" ? "secondary" : set.status === "reconciled" || set.status === "force_reconciled" ? "success" : "destructive"}>
            {set.status}
          </Badge>
        </div>
        <Button variant="outline" onClick={() => alert("Export would download this set's data.")}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Link graph</CardTitle>
            </CardHeader>
            <CardContent>
              <NodeGraph
                rule={rule}
                set={set}
                onSelectGroup={setSelectedGroupId}
                selectedGroupId={selectedGroupId}
                selectedComparisonLogicId={selectedComparisonLogicId}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Comparison logic</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Select a comparison to see its vertices on the graph and the comparison table below.
              </p>
              <div className="mt-3">
                <Select
                  value={selectedComparisonLogicId ?? ""}
                  onValueChange={(v) => setSelectedComparisonLogicId(v || null)}
                >
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Select comparison logic..." />
                  </SelectTrigger>
                  <SelectContent>
                    {rule.comparisonLogics.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({rule.groups.filter((g) => c.groupIds.includes(g.id)).map((g) => g.name).join(", ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedComparisonLogicId && selectedComparison && (
                <div className="rounded-lg border bg-muted/10 p-4 space-y-2">
                  <h4 className="text-sm font-semibold">Source documents (data derived from)</h4>
                  <p className="text-xs text-muted-foreground">
                    These are the documents in this set that contribute to the comparison below.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {selectedComparison.groupIds.map((gid) => {
                      const g = rule.groups.find((gr) => gr.id === gid)
                      const docIds = set.documentIdsByGroup[gid] ?? []
                      const labels = docIds.map((id) => getDocumentDisplayLabel(getDocumentById(id)))
                      return (
                        <div key={gid} className="flex items-baseline gap-2">
                          <span className="text-sm font-medium shrink-0">{g?.name ?? gid}:</span>
                          <span className="text-sm font-mono text-muted-foreground">
                            {labels.length > 0 ? labels.join(", ") : "—"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {selectedComparisonLogicId && (
                comparisonResult && comparisonResult.rows.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-medium w-32">Row key</th>
                          {selectedComparison?.compareFields.map((f) => {
                            const groupName = rule.groups.find((g) => g.id === f.groupId)?.name ?? f.groupId
                            const fieldLabel = f.label ?? f.fieldPath
                            return (
                              <th key={f.groupId + f.fieldPath} className="text-left p-3 font-medium">
                                <span className="text-muted-foreground font-normal">{groupName}</span>
                                <br />
                                <span className="font-medium">{fieldLabel}</span>
                              </th>
                            )
                          })}
                          <th className="text-left p-3 font-medium w-24">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonResult.rows.map((row, i) => (
                          <tr
                            key={i}
                            className={cn(
                              "border-b last:border-0",
                              !row.isConsistent && "bg-destructive/10"
                            )}
                          >
                            <td className="p-3 font-medium">{row.key}</td>
                            {selectedComparison?.compareFields.map((f) => (
                              <td key={f.groupId + f.fieldPath} className="p-3">
                                {String(row.values[f.label ?? f.fieldPath] ?? row.values[f.groupId] ?? "-")}
                              </td>
                            ))}
                            <td className="p-3">
                              {row.isConsistent ? (
                                <Badge variant="success">OK</Badge>
                              ) : (
                                <Badge variant="destructive">Inconsistent</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No comparison results for this logic.</p>
                )
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents in node</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedGroupId ? `Group: ${selectedGroup?.name}. Add or remove documents.` : "Click a node in the graph to see documents."}
              </p>
            </CardHeader>
            <CardContent>
              {!selectedGroupId ? (
                <p className="text-muted-foreground text-sm">Select a group from the graph.</p>
              ) : (
                <div className="space-y-2">
                  {docIdsInGroup.map((id) => {
                    const doc = getDocumentById(id)
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                      >
                        <span className="font-mono">{getDocumentDisplayLabel(doc)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-8"
                          onClick={() => {
                            const next = docIdsInGroup.filter((x) => x !== id)
                            updateSetDocuments(set.id, selectedGroupId!, next)
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )
                  })}
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => {}} title="Add document (picker not implemented)">
                    <Plus className="h-4 w-4 mr-2" />
                    Add document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <p className="text-sm text-muted-foreground">Force reconcile or reject this set.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="default"
            onClick={() => setSetStatus(set.id, "force_reconciled")}
            disabled={set.status !== "pending"}
          >
            <Check className="h-4 w-4 mr-2" />
            Force reconcile
          </Button>
          <Button
            variant="destructive"
            onClick={() => setSetStatus(set.id, "rejected")}
            disabled={set.status !== "pending"}
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          </CardContent>
      </Card>
    </div>
  )
}
