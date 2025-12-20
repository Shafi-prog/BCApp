import React, { useState, useEffect } from 'react'
import { Stack, Icon, MessageBar, MessageBarType, Pivot, PivotItem, Spinner, Text, DefaultButton } from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { SharePointService, Drill } from '../services/sharepointService'
import { AdminDataService, AdminContact, BCPlanDocument } from '../services/adminDataService'
import { definitions } from '../data/bcPlanParameters'

interface SharedBCPlan {
  title: string
  description: string
  lastUpdated: string
  scenarios: { id: number; title: string; description: string; actions: string[] }[]
  contacts: { name: string; role: string; phone: string }[]
  alternativeSchools: { schoolName: string; alternativeSchool: string }[]
  drillPlan: { quarter: number; drillType: string; targetDate: string; startDate?: string; endDate?: string; hypothesis?: string; specificEvent?: string; targetGroup?: string }[]
  isPublished: boolean
}

interface YearlyDrillPlan {
  id: number
  title: string
  hypothesis: string
  specificEvent: string
  targetGroup: string
  startDate: string
  endDate: string
  status: string
}

const BCPlan: React.FC = () => {
  const { user } = useAuth()
  const [sharedBCPlan, setSharedBCPlan] = useState<SharedBCPlan | null>(null)
  const [yearlyPlan, setYearlyPlan] = useState<YearlyDrillPlan[]>([])
  const [executedDrills, setExecutedDrills] = useState<Drill[]>([])
  const [loading, setLoading] = useState(false)
  
  // Quick Reference Data
  const [quickRefContacts, setQuickRefContacts] = useState<AdminContact[]>([])
  const [quickRefScenarios, setQuickRefScenarios] = useState<any[]>([])
  const [loadingQuickRef, setLoadingQuickRef] = useState(false)
  const [supportingDocs, setSupportingDocs] = useState<BCPlanDocument[]>([])

  useEffect(() => {
    loadData()
    loadQuickReferenceData()
  }, [user])

  const loadQuickReferenceData = async () => {
    try {
      setLoadingQuickRef(true)
      // Load contacts - only show visible ones for schools
      const contacts = await AdminDataService.getAdminContacts()
      const visibleContacts = contacts.filter(c => c.isVisibleToSchools)
      setQuickRefContacts(visibleContacts)
      
      // Load scenarios
      const scenarios = await AdminDataService.getPlanScenarios()
      setQuickRefScenarios(scenarios || [])
    } catch (e) {
      console.error('Error loading quick reference data:', e)
    } finally {
      setLoadingQuickRef(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // First try to load shared BC Plan from SharePoint
      let plan: SharedBCPlan | null = null
      try {
        const spPlan = await AdminDataService.getSharedBCPlan()
        if (spPlan && spPlan.title) {
          console.log('[BCPlan] Loaded plan from SharePoint:', spPlan.isPublished ? 'Published' : 'Not published')
          // Load scenarios separately from SharePoint
          const scenarios = await AdminDataService.getPlanScenarios()
          const contacts = await AdminDataService.getAdminContacts()
          const visibleContacts = contacts.filter(c => c.isVisibleToSchools)
          
          plan = {
            title: spPlan.title,
            description: spPlan.description || '',
            lastUpdated: spPlan.lastUpdated || '',
            isPublished: spPlan.isPublished || false,
            scenarios: (scenarios || []).map((s: any) => ({
              id: s.id || 0,
              title: s.title || s.scenarioName || '',
              description: s.description || '',
              actions: Array.isArray(s.actions) ? s.actions : (s.actions ? String(s.actions).split('\n').filter((a: string) => a.trim()) : [])
            })),
            contacts: visibleContacts.map(c => ({
              name: c.name || '',
              role: c.role || '',
              phone: c.phone || ''
            })),
            alternativeSchools: [],
            drillPlan: []
          }
        }
      } catch (spError) {
        console.error('[BCPlan] Error loading BC Plan from SharePoint:', spError)
      }

      // No localStorage fallback for security compliance
      // SharePoint is the only data source

      if (plan) {
        setSharedBCPlan(plan)
      }

      // Load yearly drill plans from BC_Test_Plans via AdminDataService
      const plans = await AdminDataService.getTestPlans()
      setYearlyPlan(plans.map(p => ({
        id: p.id,
        title: p.title,
        hypothesis: p.hypothesis,
        specificEvent: p.specificEvent,
        targetGroup: p.targetGroup,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status || 'مخطط',
      })))

      // Load executed drills for this school
      const schoolName = user?.schoolName
      if (schoolName) {
        const drills = await SharePointService.getDrills(schoolName)
        setExecutedDrills(drills.filter(d => !d.IsAdminPlan))
      }

      // Load supporting BC documents shared by admin
      const docs = await AdminDataService.getBCPlanDocuments()
      const sharedDocs = docs.filter(d => d.isShared && d.fileName && d.fileName.trim() !== '')
      setSupportingDocs(sharedDocs)
    } catch (e) {
      console.error('Error loading data:', e)
    } finally {
      setLoading(false)
    }
  }

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

  // If plan is not published, show placeholder for schools
  if (!sharedBCPlan.isPublished) {
    return (
      <div style={{ padding: 24 }}>
        {user?.schoolName && (
          <div style={{ backgroundColor: '#008752', borderRadius: '8px', padding: '16px 24px', color: '#fff', marginBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
              أهلاً - {user.schoolName}
            </span>
          </div>
        )}

        <h1 className="page-title" style={{ color: '#008752' }}>خطة استمرارية العملية التعليمية</h1>
        
        <div className="card" style={{ 
          padding: 40, 
          textAlign: 'center', 
          backgroundColor: '#fff8e1',
          border: '2px dashed #ffc107'
        }}>
          <Icon iconName="Clock" style={{ fontSize: 64, color: '#ffc107', marginBottom: 16 }} />
          <h2 style={{ color: '#f57c00', marginBottom: 12 }}>الخطة قيد الإعداد</h2>
          <p style={{ color: '#666', fontSize: '1rem', marginBottom: 20 }}>
            لم يتم نشر خطة استمرارية الأعمال بعد. المسؤول يعمل على إعداد الخطة وستكون متاحة قريباً.
          </p>
          <div style={{ 
            backgroundColor: '#fff3e0', 
            padding: 16, 
            borderRadius: 8, 
            display: 'inline-block',
            textAlign: 'right'
          }}>
            <p style={{ margin: 0, color: '#e65100', fontSize: '0.9rem' }}>
              <Icon iconName="Info" style={{ marginLeft: 8 }} />
              للاستفسارات، يرجى التواصل مع وحدة استمرارية العملية التعليمية في إدارة التعليم
            </p>
          </div>
        </div>
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
      </div>

      {/* Tabbed Content */}
      <Pivot styles={{ root: { marginBottom: 24 } }}>
        {/* Tab 1: BC Plan Overview */}
        <PivotItem headerText="نظرة عامة على الخطة" itemIcon="DocumentSet">
          <div style={{ paddingTop: 20 }}>
            {renderBCPlanContent()}
          </div>
        </PivotItem>

        {/* Tab 2: Quick Reference - Contacts */}
        <PivotItem headerText="جهات الاتصال" itemIcon="ContactList">
          <div style={{ paddingTop: 20 }}>
            {renderQuickRefContacts()}
          </div>
        </PivotItem>

        {/* Tab 3: RTO Objectives */}
        <PivotItem headerText="أهداف وقت التعافي" itemIcon="TimelineProgress">
          <div style={{ paddingTop: 20 }}>
            {renderRTOSection()}
          </div>
        </PivotItem>
      </Pivot>
    </div>
  )

  // Render BC Plan main content (Scenarios, Drill Plan, Alternative Schools)
  function renderBCPlanContent() {
    // Convert key BC definitions object into an array for display
    const keyDefinitions = Object.entries(definitions || {})
      .slice(0, 4)
      .map(([key, value]) => ({
        key,
        termAr: (value as any).ar,
        definitionAr: (value as any).description,
      }))

    return (
      <>
      {/* Key BC Concepts for schools */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ 
          color: '#008752', 
          marginBottom: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          borderBottom: '3px solid #008752',
          paddingBottom: 8
        }}>
          <Icon iconName="BookAnswers" style={{ fontSize: 24 }} />
          المفاهيم الأساسية لخطة استمرارية التعليم
        </h2>
        <Text variant="medium" block style={{ color: '#555', marginBottom: 12 }}>
          هذه النقاط تلخص أهم ما يجب على المدرسة معرفته من وثيقة خطة استمرارية العملية التعليمية.
        </Text>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
          gap: 12 
        }}>
          {keyDefinitions.map((item, idx: number) => (
            <div key={idx} style={{ 
              backgroundColor: '#f5f9f6', 
              borderRadius: 10, 
              padding: 14,
              border: '1px solid #c8e6c9'
            }}>
              <div style={{ fontWeight: 600, color: '#008752', marginBottom: 6 }}>
                {item.termAr}
              </div>
              <Text variant="small" block style={{ color: '#555' }}>
                {item.definitionAr}
              </Text>
            </div>
          ))}
        </div>
      </div>

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
                  {(scenario.actions || []).map((action, actionIdx) => (
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

      {/* Drill Plan Section - Redirect to Drills page */}
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

        {/* Progress Summary */}
        <div style={{ 
          backgroundColor: '#f0f9ff', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <span style={{ fontSize: '1.8rem', fontWeight: 700, color: executedDrills.length >= 4 ? '#107c10' : '#0078d4' }}>
              {executedDrills.length} / {yearlyPlan.length || 4}
            </span>
            <span style={{ marginRight: 8, color: '#666' }}>تمارين منفذة</span>
          </div>
          {executedDrills.length >= 4 && (
            <span style={{ backgroundColor: '#107c10', color: '#fff', padding: '8px 16px', borderRadius: 20, fontWeight: 600 }}>
              ✅ أكملت المدرسة الخطة السنوية
            </span>
          )}
        </div>

        {/* Display Yearly Plan Details */}
        {yearlyPlan.length > 0 ? (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              {yearlyPlan.map((plan, idx) => {
                const executed = executedDrills.find(d => 
                  d.Title === plan.title || 
                  d.DrillHypothesis === plan.hypothesis
                )
                
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const startDate = plan.startDate ? new Date(plan.startDate) : null
                const endDate = plan.endDate ? new Date(plan.endDate) : null
                
                let availabilityStatus: 'not-started' | 'available' | 'expired' = 'available'
                if (startDate && today < startDate) {
                  availabilityStatus = 'not-started'
                } else if (endDate && today > endDate) {
                  availabilityStatus = 'expired'
                }
                
                return (
                  <div key={idx} style={{ 
                    padding: '16px', 
                    backgroundColor: executed ? '#e8f5e9' : availabilityStatus === 'available' ? '#fff' : '#f5f5f5', 
                    borderRadius: 8, 
                    border: executed ? '2px solid #4caf50' : availabilityStatus === 'available' ? '1px solid #0078d4' : '1px solid #e1dfdd',
                    opacity: availabilityStatus === 'expired' && !executed ? 0.7 : 1
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4, color: '#333' }}>
                          {executed ? '✅' : availabilityStatus === 'not-started' ? '🕐' : availabilityStatus === 'expired' ? '⏰' : '📋'} {plan.title}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 4 }}>
                          <strong>الفرضية:</strong> {plan.hypothesis}
                        </div>
                        {plan.specificEvent && (
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 4 }}>
                            <strong>الحدث المحدد:</strong> {plan.specificEvent}
                          </div>
                        )}
                        {plan.targetGroup && (
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 4 }}>
                            <strong>الفئة المستهدفة:</strong> {plan.targetGroup}
                          </div>
                        )}
                        {(plan.startDate || plan.endDate) && (
                          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 8 }}>
                            <strong>فترة التنفيذ:</strong> {plan.startDate ? new Date(plan.startDate).toLocaleDateString('ar-SA') : '-'} إلى {plan.endDate ? new Date(plan.endDate).toLocaleDateString('ar-SA') : '-'}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                        {executed ? (
                          <span style={{ backgroundColor: '#4caf50', color: '#fff', padding: '4px 12px', borderRadius: 12, whiteSpace: 'nowrap' }}>
                            تم التنفيذ
                          </span>
                        ) : availabilityStatus === 'not-started' ? (
                          <span style={{ backgroundColor: '#ffb900', color: '#fff', padding: '4px 12px', borderRadius: 12, whiteSpace: 'nowrap' }}>
                            لم يبدأ بعد
                          </span>
                        ) : availabilityStatus === 'expired' ? (
                          <span style={{ backgroundColor: '#d83b01', color: '#fff', padding: '4px 12px', borderRadius: 12, whiteSpace: 'nowrap' }}>
                            انتهى الموعد
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#0078d4', color: '#fff', padding: '4px 12px', borderRadius: 12, whiteSpace: 'nowrap' }}>
                            متاح للتنفيذ
                          </span>
                        )}
                      </div>
                    </div>
                    {executed && executed.ExecutionDate && (
                      <div style={{ fontSize: '0.8rem', color: '#4caf50', marginTop: 8, paddingTop: 8, borderTop: '1px solid #e1dfdd' }}>
                        <strong>تاريخ التنفيذ:</strong> {new Date(executed.ExecutionDate).toLocaleDateString('ar-SA')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div style={{ marginTop: 16 }}>
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
                  fontSize: '1rem',
                }}
              >
                <Icon iconName="CheckList" />
                الذهاب لسجل التمارين الفرضية
              </a>
            </div>
          </div>
        ) : (
          <MessageBar messageBarType={MessageBarType.info} styles={{ root: { marginBottom: 16 } }}>
            يمكنك الاطلاع على خطة التمارين السنوية وتنفيذها من صفحة سجل التمارين الفرضية
          </MessageBar>
        )}
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

      {/* Supporting Documents Section (shared by admin BC management) */}
      {supportingDocs.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h2 style={{ 
            color: '#5c2d91', 
            marginBottom: 20, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10,
            borderBottom: '3px solid #5c2d91',
            paddingBottom: 12
          }}>
            <Icon iconName="DocumentSet" style={{ fontSize: 24 }} />
            المستندات المساندة لاستمرارية الأعمال
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {supportingDocs.map(doc => (
              <div
                key={doc.id}
                style={{
                  padding: 16,
                  border: '1px solid #edebe9',
                  borderRadius: 8,
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <Icon iconName="DocumentPDF" style={{ fontSize: 24, color: '#5c2d91' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#323130' }}>{doc.title}</div>
                    {doc.documentType && (
                      <div style={{ fontSize: '0.75rem', color: '#605e5c', marginTop: 4 }}>
                        النوع: {doc.documentType}
                      </div>
                    )}
                  </div>
                </div>
                {doc.description && (
                  <Text variant="small" block style={{ color: '#605e5c', marginBottom: 8 }}>
                    {doc.description}
                  </Text>
                )}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.75rem', color: '#8a8886' }}>
                  {doc.version && <span>الإصدار: {doc.version}</span>}
                  {doc.shareDate && (
                    <span>تاريخ النشر: {new Date(doc.shareDate).toLocaleDateString('ar-SA')}</span>
                  )}
                </div>
                {doc.fileName && (
                  <div style={{ marginTop: 8 }}>
                    {doc.fileName.startsWith('http') ? (
                      <DefaultButton
                        text="فتح المستند"
                        iconProps={{ iconName: 'NavigateExternalInline' }}
                        onClick={() => window.open(doc.fileName, '_blank')}
                      />
                    ) : (
                      <Text variant="tiny" style={{ color: '#605e5c' }}>
                        اسم الملف: {doc.fileName}
                      </Text>
                    )}
                  </div>
                )}
                {doc.notes && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 8,
                      backgroundColor: '#fff4ce',
                      borderRadius: 4,
                      borderRight: '3px solid #ffb900',
                    }}
                  >
                    <Text variant="tiny" style={{ color: '#605e5c' }}>
                      <strong>ملاحظة:</strong> {doc.notes}
                    </Text>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      </>
    )
  }

  // Render Quick Reference Contacts
  function renderQuickRefContacts() {
    if (loadingQuickRef) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Spinner label="جاري تحميل جهات الاتصال..." />
        </div>
      )
    }

    const internalContacts = quickRefContacts.filter(c => c.category === 'internal')
    const externalContacts = quickRefContacts.filter(c => c.category === 'external')

    return (
      <Stack tokens={{ childrenGap: 24 }}>
        {/* Internal Contacts */}
        {internalContacts.length > 0 && (
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ color: '#0078d4', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon iconName="Contact" />
              جهات الاتصال الداخلية
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {internalContacts.map(contact => (
                <div key={contact.id} style={{ padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8, border: '1px solid #e1dfdd' }}>
                  <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>{contact.Title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#0078d4', marginBottom: 8 }}>{contact.role}</div>
                  {contact.phone && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <Icon iconName="Phone" style={{ fontSize: 14, color: '#107c10' }} />
                      <a href={`tel:${contact.phone}`} style={{ color: '#107c10', textDecoration: 'none' }}>{contact.phone}</a>
                    </div>
                  )}
                  {contact.email && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Icon iconName="Mail" style={{ fontSize: 14, color: '#0078d4' }} />
                      <a href={`mailto:${contact.email}`} style={{ color: '#0078d4', textDecoration: 'none', fontSize: '0.85rem' }}>{contact.email}</a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* External Contacts */}
        {externalContacts.length > 0 && (
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ color: '#d83b01', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon iconName="CityNext" />
              جهات الاتصال الخارجية
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {externalContacts.map(contact => (
                <div key={contact.id} style={{ padding: 16, backgroundColor: '#fff5f0', borderRadius: 8, border: '1px solid #fed7c3' }}>
                  <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>{contact.Title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#d83b01', marginBottom: 8 }}>{contact.role}</div>
                  {contact.organization && (
                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8 }}>{contact.organization}</div>
                  )}
                  {contact.phone && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Icon iconName="Phone" style={{ fontSize: 14, color: '#d83b01' }} />
                      <a href={`tel:${contact.phone}`} style={{ color: '#d83b01', textDecoration: 'none', fontWeight: 600 }}>{contact.phone}</a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {quickRefContacts.length === 0 && (
          <MessageBar messageBarType={MessageBarType.info}>
            لا توجد جهات اتصال متاحة حالياً
          </MessageBar>
        )}
      </Stack>
    )
  }

  // Render RTO Section
  function renderRTOSection() {
    return (
      <div className="card" style={{ padding: 24, backgroundColor: '#f0f8ff', border: '2px solid #0078d4' }}>
        <h3 style={{ color: '#0078d4', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon iconName="TimelineProgress" />
          أهداف وقت التعافي (RTO)
        </h3>
        <Text variant="large" block style={{ marginBottom: 12 }}>
          <strong>الهدف:</strong> استئناف العملية التعليمية خلال <span style={{ color: '#d83b01', fontWeight: 700 }}>24 ساعة</span> من أي انقطاع
        </Text>
        <Text variant="medium" block style={{ color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
          في حال حدوث أي انقطاع في العملية التعليمية (كوارث طبيعية، أعطال فنية، جوائح، إلخ)، يجب تفعيل البدائل المتاحة لضمان استمرارية التعليم للطلاب خلال المدة المحددة.
        </Text>
        
        <div style={{ backgroundColor: '#fff', padding: 16, borderRadius: 8, marginTop: 16 }}>
          <h4 style={{ color: '#333', marginBottom: 12 }}>البدائل المتاحة:</h4>
          <ul style={{ margin: 0, paddingRight: 24, color: '#444' }}>
            <li style={{ marginBottom: 8 }}>التحول للتعليم عن بعد عبر منصات التعليم الإلكتروني</li>
            <li style={{ marginBottom: 8 }}>الانتقال إلى المدرسة البديلة المحددة</li>
            <li style={{ marginBottom: 8 }}>تفعيل خطة الطوارئ وإخلاء المبنى عند الحاجة</li>
            <li>التواصل مع فريق إدارة الأزمات في الإدارة التعليمية</li>
          </ul>
        </div>
      </div>
    )
  }

}

export default BCPlan
