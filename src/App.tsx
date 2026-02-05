import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ReconProvider } from "@/context/ReconContext"
import { Layout } from "@/components/Layout"
import { RuleDetail } from "@/pages/RuleDetail"
import { SetDetail } from "@/pages/SetDetail"

function App() {
  return (
    <BrowserRouter>
      <ReconProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/rule/rule-1" replace />} />
            <Route path="rule/:ruleId" element={<RuleDetail />} />
            <Route path="rule/:ruleId/set/:setId" element={<SetDetail />} />
          </Route>
        </Routes>
      </ReconProvider>
    </BrowserRouter>
  )
}

export default App
