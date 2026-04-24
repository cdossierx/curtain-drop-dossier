import logincident from '.pages/logincident'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Timeline from './pages/Timeline'
import Intake from './pages/Intake'
import Persons from './pages/Persons'
import Evidence from './pages/Evidence'
import TagsPage from './pages/Tags'
import Platforms from './pages/Platforms'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import NotFound from "./pages/NotFound"

export default function App() {
  console.log("App rendered!");
  
  return (
    <BrowserRouter>
    <div style={{ padding: "20px", fontSize: "24px" }}>

      <div>Curtain Drop Dossier is LIVE</div>
      <Routes>
      <Route path="/" element={<div>HELLO TEST</div>}/>
      <Route path="/timeline" element={<Timeline />} />
      <Route path="/intake" element={<Intake />} />
      <Route path="/persons" element={<Persons />} />
      <Route path="/aliases" element={<Aliases />} />
      <Route path="/evidence" element={<Evidence />} />
      <Route path="/tags" element={<TagsPage />} />
      <Route path="/platforms" element={<Platforms />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </div>
    </BrowserRouter>
  )
}
