import React, { useState, useEffect } from 'react'
import {
  Spinner,
  MessageBar,
  MessageBarType,
  Stack,
  Icon,
  ProgressIndicator,
} from '@fluentui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SharePointService, SchoolInfo } from '../services/sharepointService'

interface DashboardStats {
  teamMembers: number
  trainingsCompleted: number
  drillsConducted: number
  activeIncidents: number
  totalSchools?: number
}

// Target values for 100% completion
const TARGET_TEAM_MEMBERS = 6
const TARGET_DRILLS = 4
const TARGET_TRAININGS = 4

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    teamMembers: 0,
    trainingsCompleted: 0,
    drillsConducted: 0,
    activeIncidents: 0,
    totalSchools: 0,
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const isAdmin = user?.type === 'admin'
        const schoolName = isAdmin ? undefined : user?.schoolName

        // Load school info (for school users) or all schools count (for admin)
        const schools = await SharePointService.getSchoolInfo(schoolName)
        if (isAdmin) {
          setStats(prev => ({ ...prev, totalSchools: schools.length }))
        } else if (schools.length > 0) {
          setSchoolInfo(schools[0])
        }

        // Load stats
        const [teamMembers, drills, incidents, trainingLog] = await Promise.all([
          SharePointService.getTeamMembers(schoolName),
          SharePointService.getDrills(schoolName),
          SharePointService.getIncidents(schoolName),
          SharePointService.getTrainingLog(schoolName),
        ])

        setStats(prev => ({
          ...prev,
          teamMembers: teamMembers.length,
          drillsConducted: drills.length,
          activeIncidents: incidents.filter(i => i.Status !== 'مغلق').length,
          trainingsCompleted: trainingLog.filter(t => t.Status === 'مكتمل').length,
        }))
      } catch (error) {
        setMessage('حدث خطأ أثناء تحميل البيانات')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spinner label="جاري تحميل البيانات..." />
      </div>
    )
  }

  const isAdmin = user?.type === 'admin'

  const dashboardCards = isAdmin ? [
    {
      title: 'إجمالي المدارس',
      value: stats.totalSchools || 0,
      icon: 'Org',
      color: '#008752',
      route: '/schoolinfo',
      description: 'المدارس المسجلة في النظام',
    },
    {
      title: 'أعضاء الفرق',
      value: stats.teamMembers,
      icon: 'Group',
      color: '#0078d4',
      route: '/team',
      description: 'إجمالي أعضاء فرق الأمن والسلامة',
    },
    {
      title: 'التمارين الفرضية',
      value: stats.drillsConducted,
      icon: 'TaskList',
      color: '#107c10',
      route: '/drills',
      description: 'إجمالي التمارين المنفذة',
    },
    {
      title: 'الحوادث النشطة',
      value: stats.activeIncidents,
      icon: 'ShieldAlert',
      color: stats.activeIncidents > 0 ? '#d83b01' : '#107c10',
      route: '/incidents',
      description: 'حوادث قيد المتابعة',
    },
  ] : [
    {
      title: 'فريق الأمن والسلامة',
      value: stats.teamMembers,
      icon: 'Group',
      color: '#008752',
      route: '/team',
      description: 'عدد أعضاء الفريق',
    },
    {
      title: 'التدريبات المكتملة',
      value: stats.trainingsCompleted,
      icon: 'ReadingMode',
      color: '#0078d4',
      route: '/training-log',
      description: 'تدريبات هذا العام',
    },
    {
      title: 'التمارين الفرضية',
      value: stats.drillsConducted,
      icon: 'TaskList',
      color: '#107c10',
      route: '/drills',
      description: 'تمارين منفذة',
    },
    {
      title: 'الحوادث النشطة',
      value: stats.activeIncidents,
      icon: 'ShieldAlert',
      color: stats.activeIncidents > 0 ? '#d83b01' : '#107c10',
      route: '/incidents',
      description: 'حوادث قيد المتابعة',
    },
  ]

  const quickActions = [
    {
      title: 'إضافة عضو فريق',
      icon: 'AddFriend',
      color: '#008752',
      route: '/team',
      description: 'إضافة عضو جديد لفريق الأمن والسلامة',
    },
    {
      title: 'تسجيل تدريب',
      icon: 'ReadingMode',
      color: '#0078d4',
      route: '/training-log',
      description: 'تسجيل حضور تدريب جديد',
    },
    {
      title: 'تسجيل تمرين فرضي',
      icon: 'TaskList',
      color: '#107c10',
      route: '/drills',
      description: 'تسجيل تمرين إخلاء أو طوارئ',
    },
    {
      title: 'الإبلاغ عن حادث',
      icon: 'ShieldAlert',
      color: '#d83b01',
      route: '/incidents',
      description: 'الإبلاغ عن حادث أو طارئ',
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title" style={{ color: '#008752', marginBottom: 8 }}>
          {isAdmin ? 'لوحة تحكم المشرف' : 'مرحباً بكم في نظام متابعة استمرارية العملية التعليمية'}
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          {isAdmin 
            ? 'الإدارة العامة للتعليم بمنطقة المدينة المنورة - نظرة شاملة على جميع المدارس'
            : 'الإدارة العامة للتعليم بمنطقة المدينة المنورة'}
        </p>
      </div>

      {message && (
        <MessageBar messageBarType={MessageBarType.warning} onDismiss={() => setMessage(null)} styles={{ root: { marginBottom: 16 } }}>
          {message}
        </MessageBar>
      )}

      {!isAdmin && schoolInfo && (
        <div className="card" style={{ marginBottom: 24, borderRight: '4px solid #008752' }}>
          <h2 style={{ color: '#008752', marginBottom: 16, fontSize: '1.1rem' }}>
            <Icon iconName="Education" style={{ marginLeft: 8 }} />
            معلومات المدرسة
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ backgroundColor: '#f9f9f9', padding: 12, borderRadius: 6 }}>
              <div style={{ marginBottom: 8 }}>
                <Icon iconName="School" style={{ marginLeft: 6, color: '#0078d4' }} />
                <strong>اسم المدرسة:</strong> {schoolInfo.SchoolName}
              </div>
              <div style={{ marginBottom: 8 }}>
                <Icon iconName="NumberSymbol" style={{ marginLeft: 6, color: '#8764b8' }} />
                <strong>الرقم الإحصائي:</strong> {schoolInfo.SchoolID || '-'}
              </div>
              <div style={{ marginBottom: 8 }}>
                <Icon iconName="Education" style={{ marginLeft: 6, color: '#00a36c' }} />
                <strong>المرحلة:</strong> {schoolInfo.Level}
              </div>
              <div>
                <Icon iconName="People" style={{ marginLeft: 6, color: '#d83b01' }} />
                <strong>النوع:</strong> {schoolInfo.SchoolGender}
              </div>
            </div>
            <div style={{ backgroundColor: '#f9f9f9', padding: 12, borderRadius: 6 }}>
              <div style={{ marginBottom: 8 }}>
                <Icon iconName="Contact" style={{ marginLeft: 6, color: '#008752' }} />
                <strong>مدير/ة المدرسة:</strong> {schoolInfo.PrincipalName}
              </div>
              <div style={{ marginBottom: 8 }}>
                <Icon iconName="Mail" style={{ marginLeft: 6, color: '#0078d4' }} />
                <strong>البريد:</strong> {schoolInfo.principalEmail || '-'}
              </div>
              <div style={{ marginBottom: 8 }}>
                <Icon iconName="Phone" style={{ marginLeft: 6, color: '#107c10' }} />
                <strong>الجوال:</strong> {schoolInfo.PrincipalPhone || '-'}
              </div>
              <div>
                <Icon iconName="MapPin" style={{ marginLeft: 6, color: '#004e8c' }} />
                <strong>القطاع:</strong> {schoolInfo.SectorDescription || '-'}
              </div>
            </div>
            <div style={{ backgroundColor: '#f9f9f9', padding: 12, borderRadius: 6 }}>
              <div style={{ marginBottom: 8 }}>
                <Icon iconName="BuildingMultiple" style={{ marginLeft: 6, color: '#107c10' }} />
                <strong>نمط المدرسة:</strong> {schoolInfo.SchoolType || '-'}
              </div>
              <div style={{ marginBottom: 8 }}>
                <Icon iconName="Library" style={{ marginLeft: 6, color: '#038387' }} />
                <strong>نوع التعليم:</strong> {schoolInfo.EducationType || '-'}
              </div>
              <div style={{ marginBottom: 8 }}>
                <Icon iconName="Clock" style={{ marginLeft: 6, color: '#ca5010' }} />
                <strong>وقت الدراسة:</strong> {schoolInfo.StudyTime || '-'}
              </div>
              <div>
                <Icon iconName="Home" style={{ marginLeft: 6, color: '#5c2d91' }} />
                <strong>ملكية المبنى:</strong> {schoolInfo.BuildingOwnership || '-'}
              </div>
            </div>
          </div>
          {schoolInfo.Latitude && schoolInfo.Longitude && (
            <div style={{ marginTop: 16 }}>
              <a
                href={`https://www.google.com/maps?q=${schoolInfo.Latitude},${schoolInfo.Longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#0078d4',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 4,
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
                <Icon iconName="MapPin" />
                عرض الموقع على الخريطة
              </a>
            </div>
          )}
        </div>
      )}

      <h2 style={{ color: '#333', marginBottom: 16, fontSize: '1.1rem' }}>
        <Icon iconName="ViewDashboard" style={{ marginLeft: 8 }} />
        لوحة المتابعة
      </h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            className="card action-card"
            onClick={() => navigate(card.route)}
            style={{ 
              cursor: 'pointer',
              borderTop: `4px solid ${card.color}`,
              textAlign: 'center',
              padding: 20,
            }}
          >
            <Icon 
              iconName={card.icon} 
              style={{ fontSize: 32, color: card.color, marginBottom: 8 }} 
            />
            <div style={{ fontSize: '2rem', fontWeight: 700, color: card.color }}>
              {card.value}
            </div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>{card.description}</div>
          </div>
        ))}
      </div>

      <h2 style={{ color: '#333', marginBottom: 16, fontSize: '1.1rem' }}>
        <Icon iconName="LightningBolt" style={{ marginLeft: 8 }} />
        الإجراءات السريعة
      </h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: 16 
      }}>
        {quickActions.map((action, index) => (
          <div
            key={index}
            className="card action-card"
            onClick={() => navigate(action.route)}
            style={{ 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
            }}
          >
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%', 
              background: `${action.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon iconName={action.icon} style={{ fontSize: 24, color: action.color }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{action.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>{action.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ color: '#008752', marginBottom: 16, fontSize: '1.1rem' }}>
          <Icon iconName="StatusCircleCheckmark" style={{ marginLeft: 8 }} />
          مستوى الجاهزية
        </h2>
        <Stack tokens={{ childrenGap: 16 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>فريق الأمن والسلامة ({stats.teamMembers} من {TARGET_TEAM_MEMBERS})</span>
              <span style={{ color: Math.min((stats.teamMembers / TARGET_TEAM_MEMBERS) * 100, 100) >= 100 ? '#107c10' : '#008752' }}>
                {Math.min(Math.round((stats.teamMembers / TARGET_TEAM_MEMBERS) * 100), 100)}%
              </span>
            </div>
            <ProgressIndicator 
              percentComplete={Math.min(stats.teamMembers / TARGET_TEAM_MEMBERS, 1)} 
              barHeight={6} 
              styles={{ progressBar: { backgroundColor: Math.min((stats.teamMembers / TARGET_TEAM_MEMBERS) * 100, 100) >= 100 ? '#107c10' : '#008752' } }} 
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>التدريبات المطلوبة ({stats.trainingsCompleted} من {TARGET_TRAININGS})</span>
              <span style={{ color: Math.min((stats.trainingsCompleted / TARGET_TRAININGS) * 100, 100) >= 100 ? '#107c10' : '#0078d4' }}>
                {Math.min(Math.round((stats.trainingsCompleted / TARGET_TRAININGS) * 100), 100)}%
              </span>
            </div>
            <ProgressIndicator 
              percentComplete={Math.min(stats.trainingsCompleted / TARGET_TRAININGS, 1)} 
              barHeight={6} 
              styles={{ progressBar: { backgroundColor: Math.min((stats.trainingsCompleted / TARGET_TRAININGS) * 100, 100) >= 100 ? '#107c10' : '#0078d4' } }} 
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>التمارين الفرضية ({stats.drillsConducted} من {TARGET_DRILLS})</span>
              <span style={{ color: Math.min((stats.drillsConducted / TARGET_DRILLS) * 100, 100) >= 100 ? '#107c10' : '#107c10' }}>
                {Math.min(Math.round((stats.drillsConducted / TARGET_DRILLS) * 100), 100)}%
              </span>
            </div>
            <ProgressIndicator 
              percentComplete={Math.min(stats.drillsConducted / TARGET_DRILLS, 1)} 
              barHeight={6} 
              styles={{ progressBar: { backgroundColor: Math.min((stats.drillsConducted / TARGET_DRILLS) * 100, 100) >= 100 ? '#107c10' : '#107c10' } }} 
            />
          </div>
          <div style={{ marginTop: 8, padding: 12, backgroundColor: '#f3f2f1', borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>نسبة الجاهزية الكلية</span>
              <span style={{ 
                fontWeight: 700, 
                fontSize: '1.2rem',
                color: (() => {
                  const total = (Math.min(stats.teamMembers / TARGET_TEAM_MEMBERS, 1) + Math.min(stats.trainingsCompleted / TARGET_TRAININGS, 1) + Math.min(stats.drillsConducted / TARGET_DRILLS, 1)) / 3 * 100
                  return total >= 100 ? '#107c10' : '#008752'
                })()
              }}>
                {Math.round((Math.min(stats.teamMembers / TARGET_TEAM_MEMBERS, 1) + Math.min(stats.trainingsCompleted / TARGET_TRAININGS, 1) + Math.min(stats.drillsConducted / TARGET_DRILLS, 1)) / 3 * 100)}%
              </span>
            </div>
          </div>
        </Stack>
      </div>
    </div>
  )
}

export default Home
