import { Routes, Route } from 'react-router'
import Dashboard from './pages/Dashboard'
import LogIncident from './pages/LogIncident'
import Timeline from './pages/Timeline'
import Intake from './pages/Intake'
import Persons from './pages/Persons'
import Aliases from './pages/Aliases'
import Evidence from './pages/Evidence'
import TagsPage from './pages/Tags'
import Platforms from './pages/Platforms'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <div style={{ padding: "20px", fontSize: "24px" }}>

      <div>Curtain Drop Dossier is LIVE</div>
      <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/log" element={<LogIncident />} />
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
  )
}
