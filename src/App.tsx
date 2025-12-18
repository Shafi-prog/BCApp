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
import AdminPanel from './components/AdminPanel'
import BCPlan from './components/BCPlan'
import ConnectionTest from './components/ConnectionTest'

function AppContent() {
  const { user } = useAuth()

  if (!user) {
    return <Login />
  }

  return (
    <div className="app-layout">
      <Navigation isOpen={true} onClose={() => {}} />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bcplan" element={<BCPlan />} />
          <Route path="/team" element={<Team />} />
          <Route path="/training" element={<Training />} />
          <Route path="/training-log" element={<TrainingLog />} />
          <Route path="/drills" element={<Drills />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/schoolinfo" element={<SchoolInfo />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/test-connection" element={<ConnectionTest />} />
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

