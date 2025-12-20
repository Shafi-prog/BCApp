import React, { useState, useEffect } from 'react'
import { Nav, INavStyles, DefaultButton, Text, Icon, IconButton } from '@fluentui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BCInfoSidebar from './BCInfoSidebar'
import NotificationBell from './NotificationBell'
import { SharePointService } from '../services/sharepointService'

interface LeaderboardEntry {
  rank: number
  schoolName: string
  readinessPercent: number
}

const navStyles: Partial<INavStyles> = {
  root: {
    width: '100%',
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  link: {
    textAlign: 'center',
    justifyContent: 'center',
  },
  linkText: {
    marginRight: 8,
  },
  navItem: {
    textAlign: 'center',
  },
  compositeLink: {
    textAlign: 'center',
  }
}

interface NavigationProps {
  isOpen?: boolean
  onClose?: () => void
}

const Navigation: React.FC<NavigationProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showBCInfo, setShowBCInfo] = useState(false)

  // Load leaderboard from SharePoint (no localStorage for security compliance)
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        // Load data from SharePoint and calculate leaderboard
        const [allSchools, allTeamMembers, allDrills, allTrainingLog] = await Promise.all([
          SharePointService.getSchoolInfo(),
          SharePointService.getTeamMembers(),
          SharePointService.getDrills(),
          SharePointService.getTrainingLog(),
        ])
        
        const TARGET_TEAM = 6, TARGET_DRILLS = 4, TARGET_TRAIN = 2
        const progressMap = new Map<string, number>()
        
        allSchools.forEach(s => progressMap.set(s.SchoolName, 0))
        
        const teamCount = new Map<string, number>()
        const drillCount = new Map<string, number>()
        const trainCount = new Map<string, number>()
        
        allTeamMembers.forEach((m: any) => {
          const s = m.SchoolName_Ref
          if (s) teamCount.set(s, (teamCount.get(s) || 0) + 1)
        })
        allDrills.forEach((d: any) => {
          const s = d.SchoolName_Ref
          if (s) drillCount.set(s, (drillCount.get(s) || 0) + 1)
        })
        allTrainingLog.forEach((t: any) => {
          const s = t.SchoolName_Ref
          if (s) trainCount.set(s, (trainCount.get(s) || 0) + 1)
        })
        
        allSchools.forEach(school => {
          const t = Math.min((teamCount.get(school.SchoolName) || 0) / TARGET_TEAM, 1)
          const d = Math.min((drillCount.get(school.SchoolName) || 0) / TARGET_DRILLS, 1)
          const tr = Math.min((trainCount.get(school.SchoolName) || 0) / TARGET_TRAIN, 1)
          progressMap.set(school.SchoolName, Math.round((t + d + tr) / 3 * 100))
        })
        
        const sorted = Array.from(progressMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 200)
          .map((entry, idx) => ({
            rank: idx + 1,
            schoolName: entry[0],
            readinessPercent: entry[1],
          }))
        
        setLeaderboard(sorted)
      } catch (e) {
        console.error('[Navigation] Error loading leaderboard from SharePoint:', e)
      }
    }
    
    loadLeaderboard()
    // Refresh every 30 seconds
    const interval = setInterval(loadLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [])

  // Listen for navigation events from stats cards in AdminPanel
  useEffect(() => {
    const handleNavigateEvent = (e: CustomEvent) => {
      const target = e.detail
      const routeMap: Record<string, string> = {
        'home': '/',
        'team': '/team',
        'drills': '/drills',
        'training': '/training-log',
        'incidents': '/incidents',
      }
      if (routeMap[target]) {
        navigate(routeMap[target])
      }
    }
    
    window.addEventListener('navigate', handleNavigateEvent as EventListener)
    return () => window.removeEventListener('navigate', handleNavigateEvent as EventListener)
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div 
      className={`nav-panel ${isOpen ? 'open' : ''}`}
      style={{ 
        width: 260, 
        borderLeft: '1px solid #e1dfdd',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 6px rgba(0,0,0,0.03)',
        height: '100vh',
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 1000,
      }}
    >
      <div style={{ 
        padding: '20px 16px', 
        borderBottom: '1px solid #e1dfdd',
        background: 'linear-gradient(135deg, #008752, #006644)',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 }}>
              نظام متابعة استمرارية العملية التعليمية
            </h2>
          </div>
          <NotificationBell />
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9, textAlign: 'center' }}>
          الإدارة العامة للتعليم بمنطقة المدينة المنورة
        </p>
      </div>

      {/* User Info */}
      {user && (
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid #e1dfdd',
          background: '#f3f2f1',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Icon 
              iconName={user.type === 'admin' ? 'Admin' : 'Org'} 
              style={{ fontSize: '20px', color: '#008752' }} 
            />
            <div style={{ textAlign: 'center' }}>
              <Text variant="smallPlus" style={{ fontWeight: 600, display: 'block' }}>
                {user.type === 'admin' ? 'المسؤول' : user.schoolName}
              </Text>
              <Text variant="tiny" style={{ color: '#666' }}>
                {user.type === 'admin' ? 'صلاحيات كاملة' : 'حساب مدرسة'}
              </Text>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Nav
          selectedKey={location.pathname}
          styles={navStyles}
          groups={[
            {
              links: [
                { name: 'الرئيسية ومعلومات المدرسة', url: '#/', key: '/', icon: 'Home' },
                // BC Plan (Quick Reference is embedded inside for schools)
                ...(user?.type !== 'admin' ? [{
                  name: 'خطة استمرارية التعليم',
                  url: '#/bcplan',
                  key: '/bcplan',
                  icon: 'Shield'
                }] : [
                  // Admin sees Quick Reference as standalone editable page
                  { name: 'المرجع السريع (إدارة)', url: '#/bc-quick-reference', key: '/bc-quick-reference', icon: 'BookAnswers' }
                ]),
                { name: 'فريق الأمن والسلامة', url: '#/team', key: '/team', icon: 'Group' },
                { name: 'بوابة التدريب', url: '#/training', key: '/training', icon: 'ReadingMode' },
                { name: 'سجل التدريبات', url: '#/training-log', key: '/training-log', icon: 'ClipboardList' },
                { name: 'سجل التمارين الفرضية', url: '#/drills', key: '/drills', icon: 'CheckList' },
                { name: 'انقطاع في العملية التعليمية', url: '#/incidents', key: '/incidents', icon: 'ShieldAlert' },
                ...(user?.type === 'admin' ? [
                  { name: 'لوحة إدارة BC', url: '#/admin', key: '/admin', icon: 'Settings' }
                ] : [])
              ]
            }
          ]}
          onLinkClick={(ev, item) => {
            ev?.preventDefault()
            if (item?.key) {
              navigate(item.key)
              onClose?.()
            }
          }}
        />
      </div>

      {/* Top 200 Schools Leaderboard */}
      {leaderboard.length > 0 && (
        <div style={{ borderTop: '1px solid #e1dfdd' }}>
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: showLeaderboard ? '#e6f2e6' : '#f9f9f9',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#008752',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              🏆 أفضل 200 مدرسة جاهزية
            </span>
            <Icon iconName={showLeaderboard ? 'ChevronUp' : 'ChevronDown'} />
          </button>
          
          {showLeaderboard && (
            <div style={{ 
              maxHeight: 300, 
              overflowY: 'auto',
              backgroundColor: '#fafafa',
            }}>
              {leaderboard.map((entry, idx) => {
                const isCurrentSchool = user?.schoolName === entry.schoolName
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: isCurrentSchool ? '#e6f7e6' : 'transparent',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: entry.rank <= 3 ? '#FFD700' : entry.rank <= 10 ? '#C0C0C0' : entry.rank <= 50 ? '#CD7F32' : '#008752',
                      color: entry.rank <= 50 ? '#000' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      flexShrink: 0,
                    }}>
                      {entry.rank}
                    </span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ 
                        fontWeight: isCurrentSchool ? 700 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: isCurrentSchool ? '#008752' : '#333',
                      }}>
                        {isCurrentSchool && '⭐ '}{entry.schoolName}
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      backgroundColor: entry.readinessPercent >= 75 ? '#e6f7e6' : entry.readinessPercent >= 50 ? '#fff8e1' : '#ffebee',
                      color: entry.readinessPercent >= 75 ? '#107c10' : entry.readinessPercent >= 50 ? '#ff8f00' : '#d83b01',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {entry.readinessPercent}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Logout Button */}
      <div style={{ padding: '16px', borderTop: '1px solid #e1dfdd' }}>
        <DefaultButton
          text="تسجيل الخروج"
          iconProps={{ iconName: 'SignOut' }}
          onClick={handleLogout}
          styles={{
            root: { width: '100%' },
            icon: { color: '#d83b01' },
          }}
        />
      </div>

      {/* BC Info Sidebar */}
      <BCInfoSidebar isOpen={showBCInfo} onClose={() => setShowBCInfo(false)} />
    </div>
  )
}

export default Navigation
