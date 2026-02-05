import { useParams, useNavigate } from "react-router-dom"
import { useRecon } from "@/context/ReconContext"
import { getRuleById } from "@/data/mockRules"
import { getDocumentById } from "@/data/mockDocuments"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RuleDetail() {
  const { ruleId } = useParams<{ ruleId: string }>()
  const navigate = useNavigate()
  const { getSetsForRule, rules } = useRecon()
  const rule = ruleId ? getRuleById(ruleId) ?? rules.find((r) => r.id === ruleId) : null
  const sets = ruleId ? getSetsForRule(ruleId) : []

  if (!rule) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Select a rule from the sidebar or create one.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{rule.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Anchor documents and their collected sets. Click a set to view details and compare.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sets</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Anchor</th>
                    <th className="text-left p-3 font-medium">Matched documents</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sets.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">
                        No sets collected for this rule yet.
                      </td>
                    </tr>
                  ) : (
                    sets.map((s) => {
                      const anchorDoc = getDocumentById(s.anchorDocId)
                      const anchorLabel =
                        anchorDoc && "poNumber" in anchorDoc
                          ? (anchorDoc as { poNumber?: string }).poNumber
                          : anchorDoc && "invoiceNumber" in anchorDoc
                            ? (anchorDoc as { invoiceNumber?: string }).invoiceNumber
                            : s.anchorDocId
                      const totalDocs = Object.values(s.documentIdsByGroup).flat().length
                      return (
                        <tr
                          key={s.id}
                          className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                          onClick={() => navigate(`/rule/${ruleId}/set/${s.id}`)}
                        >
                          <td className="p-3 font-medium">{anchorLabel}</td>
                          <td className="p-3 text-muted-foreground">
                            {totalDocs} document(s) across {Object.keys(s.documentIdsByGroup).length} groups
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                s.status === "reconciled" || s.status === "force_reconciled"
                                  ? "success"
                                  : s.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {s.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              className="text-primary hover:underline text-sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/rule/${ruleId}/set/${s.id}`)
                              }}
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
      </Card>
    </div>
  )
}
