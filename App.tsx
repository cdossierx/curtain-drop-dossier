import LogIncident from './LogIncident'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './Dashboard'
import Timeline from './Timeline'
import Intake from './Intake'
import Persons from './Persons'
import Evidence from './Evidence'
import TagsPage from './Tags'
import Platforms from './Platforms'
import Analytics from './Analytics'
import Settings from './Settings'
import NotFound from "./NotFound"

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
