import { Outlet, NavLink } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"
import { useRecon } from "@/context/ReconContext"
import { CreateRuleDialog } from "@/components/CreateRuleDialog"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function Layout() {
  const { rules } = useRecon()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-foreground">Reconciliation Rules</h2>
          <Button
            className="w-full mt-3"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create rule
          </Button>
        </div>
        <nav className="flex-1 overflow-auto p-2">
          {rules.map((rule) => (
            <NavLink
              key={rule.id}
              to={`/rule/${rule.id}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{rule.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <CreateRuleDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
