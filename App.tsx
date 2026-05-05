import { Routes, Route } from 'react-router'
import Dashboard from './Dashboard'
import LogIncident from './LogIncident'
import Timeline from './Timeline'
import Intake from './Intake'
import Persons from './Persons'
import Aliases from './Aliases'
import Evidence from './Evidence'
import TagsPage from './Tags'
import Platforms from './Platforms'
import Analytics from './Analytics'
import Settings from './Settings'
import NotFound from "./NotFound"

export default function App() {
  return (
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
