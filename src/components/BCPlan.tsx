import React, { useState, useEffect } from 'react'
import { Stack, Icon, MessageBar, MessageBarType } from '@fluentui/react'
import { useAuth } from '../context/AuthContext'

interface SharedBCPlan {
  title: string
  description: string
  lastUpdated: string
  scenarios: { id: number; title: string; description: string; actions: string[] }[]
  contacts: { name: string; role: string; phone: string }[]
  alternativeSchools: { schoolName: string; alternativeSchool: string }[]
  drillPlan: { quarter: number; drillType: string; targetDate: string; startDate?: string; endDate?: string }[]
  isPublished: boolean
}

const BCPlan: React.FC = () => {
  const { user } = useAuth()
  const [sharedBCPlan, setSharedBCPlan] = useState<SharedBCPlan | null>(null)

  useEffect(() => {
    // Load shared BC Plan from localStorage
    const savedPlan = localStorage.getItem('bc_shared_plan')
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan) as SharedBCPlan
        setSharedBCPlan(plan)
      } catch (e) {
        console.error('Error loading BC Plan:', e)
      }
    }
  }, [])

  if (!sharedBCPlan) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="page-title" style={{ color: '#008752' }}>خطة استمرارية العملية التعليمية</h1>
        <MessageBar messageBarType={MessageBarType.info}>
          لم يتم نشر خطة استمرارية الأعمال بعد. يرجى التواصل مع المسؤول.
        </MessageBar>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      {user?.schoolName && (
        <div style={{ backgroundColor: '#008752', borderRadius: '8px', padding: '16px 24px', color: '#fff', marginBottom: 16 }}>
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
            أهلاً - {user.schoolName}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #0078d4, #106ebe)', 
        color: '#fff', 
        padding: 24, 
        borderRadius: 12,
        marginBottom: 24
      }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12, fontSize: '1.5rem' }}>
          <Icon iconName="Shield" style={{ fontSize: 32 }} />
          {sharedBCPlan.title}
        </h1>
        <p style={{ margin: '12px 0 0 0', opacity: 0.9, fontSize: '1rem' }}>
          {sharedBCPlan.description}
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>
          آخر تحديث: {new Date(sharedBCPlan.lastUpdated).toLocaleDateString('ar-SA')}
        </p>
        {!sharedBCPlan.isPublished && (
          <MessageBar messageBarType={MessageBarType.warning} styles={{ root: { marginTop: 12 } }}>
            هذه الخطة مسودة ولم يتم نشرها بعد
          </MessageBar>
        )}
      </div>

      {/* Scenarios Section */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ 
          color: '#0078d4', 
          marginBottom: 20, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          borderBottom: '3px solid #0078d4',
          paddingBottom: 12
        }}>
          <Icon iconName="Warning" style={{ fontSize: 24 }} />
          سيناريوهات الطوارئ وخطط الاستجابة
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sharedBCPlan.scenarios.map((scenario, idx) => (
            <div key={idx} style={{ 
              backgroundColor: '#f8f9fa', 
              borderRadius: 12, 
              padding: 20,
              borderRight: '5px solid #0078d4',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                marginBottom: 12
              }}>
                <span style={{ 
                  backgroundColor: '#0078d4', 
                  color: '#fff', 
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  {idx + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>{scenario.title}</h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '0.95rem' }}>{scenario.description}</p>
                </div>
              </div>
              
              <div style={{ marginRight: 52 }}>
                <h4 style={{ 
                  color: '#107c10', 
                  fontSize: '0.95rem', 
                  margin: '16px 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Icon iconName="CheckList" />
                  إجراءات الاستجابة:
                </h4>
                <ul style={{ 
                  margin: 0, 
                  paddingRight: 24,
                  listStyleType: 'none'
                }}>
                  {scenario.actions.map((action, actionIdx) => (
                    <li key={actionIdx} style={{ 
                      color: '#444', 
                      fontSize: '0.9rem',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <Icon iconName="CheckMark" style={{ color: '#107c10', fontSize: 14 }} />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drill Plan Section - Link to Drills page */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ 
          color: '#107c10', 
          marginBottom: 20, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          borderBottom: '3px solid #107c10',
          paddingBottom: 12
        }}>
          <Icon iconName="Calendar" style={{ fontSize: 24 }} />
          خطة التمارين السنوية
        </h2>
        
        <div style={{ 
          backgroundColor: '#e8f5e9', 
          borderRadius: 12, 
          padding: 24,
          textAlign: 'center',
          border: '2px solid #4caf50'
        }}>
          <Icon iconName="TaskList" style={{ fontSize: 48, color: '#107c10', marginBottom: 16 }} />
          <p style={{ fontSize: '1.1rem', color: '#333', marginBottom: 16 }}>
            تم نقل خطة التمارين السنوية إلى صفحة "سجل التمارين الفرضية"
          </p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: 20 }}>
            يمكنك من هناك عرض التمارين المتاحة وتنفيذها مباشرة
          </p>
          <a 
            href="#/drills" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#107c10',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem'
            }}
          >
            <Icon iconName="Play" />
            الذهاب لسجل التمارين الفرضية
          </a>
        </div>
      </div>

      {/* Emergency Contacts Section */}
      {sharedBCPlan.contacts && sharedBCPlan.contacts.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h2 style={{ 
            color: '#d32f2f', 
            marginBottom: 20, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10,
            borderBottom: '3px solid #d32f2f',
            paddingBottom: 12
          }}>
            <Icon iconName="Phone" style={{ fontSize: 24 }} />
            جهات الاتصال للطوارئ
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 16 
          }}>
            {sharedBCPlan.contacts.map((contact, idx) => (
              <div key={idx} style={{ 
                backgroundColor: '#ffebee', 
                borderRadius: 12, 
                padding: 16,
                border: '1px solid #ffcdd2'
              }}>
                <div style={{ fontWeight: 600, color: '#c62828', marginBottom: 4 }}>
                  {contact.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 8 }}>{contact.role}</div>
                <div style={{ 
                  fontSize: '1rem', 
                  color: '#d32f2f', 
                  direction: 'ltr', 
                  textAlign: 'right',
                  backgroundColor: '#fff',
                  padding: '8px 12px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 8
                }}>
                  <span>{contact.phone}</span>
                  📞
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Schools Section */}
      {sharedBCPlan.alternativeSchools && sharedBCPlan.alternativeSchools.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ 
            color: '#7b1fa2', 
            marginBottom: 20, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10,
            borderBottom: '3px solid #7b1fa2',
            paddingBottom: 12
          }}>
            <Icon iconName="Education" style={{ fontSize: 24 }} />
            المدارس البديلة
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 16 
          }}>
            {sharedBCPlan.alternativeSchools.map((alt, idx) => (
              <div key={idx} style={{ 
                backgroundColor: '#f3e5f5', 
                borderRadius: 12, 
                padding: 16,
                border: '1px solid #ce93d8'
              }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 4 }}>المدرسة الأصلية:</div>
                  <div style={{ fontWeight: 600, color: '#333' }}>{alt.schoolName}</div>
                </div>
                <div style={{ 
                  backgroundColor: '#fff',
                  padding: 12,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Icon iconName="Forward" style={{ color: '#7b1fa2' }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>البديل:</div>
                    <div style={{ fontWeight: 600, color: '#7b1fa2' }}>{alt.alternativeSchool}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BCPlan
