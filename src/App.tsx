import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ReconProvider } from "@/context/ReconContext"
import { Layout } from "@/components/Layout"
import { RuleDetail } from "@/pages/RuleDetail"
import { SetDetail } from "@/pages/SetDetail"

function Home() {
  return (
    <div className="p-8">
      <p className="text-muted-foreground">Select a rule from the sidebar or create one.</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ReconProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="rule/:ruleId" element={<RuleDetail />} />
            <Route path="rule/:ruleId/set/:setId" element={<SetDetail />} />
          </Route>
        </Routes>
      </ReconProvider>
    </BrowserRouter>
  )
}

export default App
