import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Violations from './pages/Violations'
import Live from './pages/Live'

export default function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', minWidth: 0 }}>
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/upload"     element={<Upload />} />
            <Route path="/violations" element={<Violations />} />
            <Route path="/live"       element={<Live />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
