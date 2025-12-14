import React from 'react'
import { Nav, INavStyles, DefaultButton, Text, Icon } from '@fluentui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navStyles: Partial<INavStyles> = {
  root: {
    width: '100%',
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  link: {
    textAlign: 'right',
  },
  linkText: {
    marginRight: 8,
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
        color: '#fff'
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
          background: '#f3f2f1'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon 
              iconName={user.type === 'admin' ? 'Admin' : 'Org'} 
              style={{ fontSize: '20px', color: '#008752' }} 
            />
            <div>
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
                { name: 'فريق الأمن والسلامة', url: '#/team', key: '/team', icon: 'Group' },
                { name: 'بوابة التدريب', url: '#/training', key: '/training', icon: 'ReadingMode' },
                { name: 'سجل التدريبات', url: '#/training-log', key: '/training-log', icon: 'ClipboardList' },
                { name: 'سجل التمارين الفرضية', url: '#/drills', key: '/drills', icon: 'TaskList' },
                { name: 'غرفة العمليات (الحوادث)', url: '#/incidents', key: '/incidents', icon: 'ShieldAlert' }
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
