import React, { useState, useEffect } from 'react'
import { Nav, INavStyles, DefaultButton, Text, Icon } from '@fluentui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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

  // Load leaderboard from localStorage
  useEffect(() => {
    const loadLeaderboard = () => {
      const data = localStorage.getItem('bc_top200_leaderboard')
      if (data) {
        setLeaderboard(JSON.parse(data))
      }
    }
    loadLeaderboard()
    // Listen for storage changes
    window.addEventListener('storage', loadLeaderboard)
    return () => window.removeEventListener('storage', loadLeaderboard)
  }, [])

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
        textAlign: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 }}>
          نظام متابعة استمرارية العملية التعليمية
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
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
                // BC Plan only visible to schools, admin accesses through Admin Panel
                ...(user?.type !== 'admin' ? [{ name: 'خطة استمرارية التعليم', url: '#/bcplan', key: '/bcplan', icon: 'Shield' }] : []),
                { name: 'فريق الأمن والسلامة', url: '#/team', key: '/team', icon: 'Group' },
                { name: 'بوابة التدريب', url: '#/training', key: '/training', icon: 'ReadingMode' },
                { name: 'سجل التدريبات', url: '#/training-log', key: '/training-log', icon: 'ClipboardList' },
                { name: 'سجل التمارين الفرضية', url: '#/drills', key: '/drills', icon: 'TaskList' },
                { name: 'انقطاع في العملية التعليمية', url: '#/incidents', key: '/incidents', icon: 'ShieldAlert' },
                ...(user?.type === 'admin' ? [{ name: 'لوحة إدارة BC', url: '#/admin', key: '/admin', icon: 'Settings' }] : [])
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
    </div>
  )
}

export default Navigation
