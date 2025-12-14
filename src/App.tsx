import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navigation from './components/Navigation'
import Home from './components/Home'
import Team from './components/Team'
import Training from './components/Training'
import TrainingLog from './components/TrainingLog'
import Drills from './components/Drills'
import Incidents from './components/Incidents'
import Login from './components/Login'
import SchoolInfo from './components/SchoolInfo'

function AppContent() {
  const { user } = useAuth()
  const [navOpen, setNavOpen] = useState(false)

  if (!user) {
    return <Login />
  }

  return (
    <div className="app-layout">
      <div className={`nav-overlay ${navOpen ? 'open' : ''}`} onClick={() => setNavOpen(false)} />
      <Navigation isOpen={navOpen} onClose={() => setNavOpen(false)} />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<Team />} />
          <Route path="/training" element={<Training />} />
          <Route path="/training-log" element={<TrainingLog />} />
          <Route path="/drills" element={<Drills />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/schoolinfo" element={<SchoolInfo />} />
          <Route path="*" element={<div style={{ padding: 20 }}>الصفحة غير موجودة</div>} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

