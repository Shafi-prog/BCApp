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

      {/* Plan Objectives - Goals from the document */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ 
          color: '#d83b01', 
          marginBottom: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          borderBottom: '3px solid #d83b01',
          paddingBottom: 8
        }}>
          <Icon iconName="Target" style={{ fontSize: 24 }} />
          أهداف خطة استمرارية التعليم
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {[
            { icon: 'Heart', title: 'حماية الأرواح', desc: 'المحافظة على حياة منسوبي الوزارة والطلاب والمعلمين', color: '#d83b01' },
            { icon: 'Shield', title: 'حماية السمعة والأصول', desc: 'المحافظة على سمعة الوزارة وحماية ممتلكاتها وأجهزتها وأنظمتها وبياناتها', color: '#0078d4' },
            { icon: 'Education', title: 'استمرار التعليم', desc: 'الحفاظ على استمرار العملية التعليمية دون انقطاع', color: '#107c10' },
            { icon: 'Refresh', title: 'استعادة العمليات', desc: 'استعادة العملية التعليمية وفق آليات العمل المعتمدة', color: '#8764b8' },
            { icon: 'ClipboardList', title: 'حصر الأضرار', desc: 'حصر وتقييم الأضرار بعد حالات الاضطراب', color: '#ffb900' }
          ].map((goal, idx) => (
            <div key={idx} style={{ 
              backgroundColor: '#fff', 
              borderRadius: 10, 
              padding: 14,
              border: '1px solid #e1e1e1',
              borderRight: `4px solid ${goal.color}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12
            }}>
              <Icon iconName={goal.icon} style={{ fontSize: 24, color: goal.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>{goal.title}</div>
                <Text variant="small" block style={{ color: '#666' }}>{goal.desc}</Text>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Activation Phases */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ 
          color: '#107c10', 
          marginBottom: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          borderBottom: '3px solid #107c10',
          paddingBottom: 8
        }}>
          <Icon iconName="ProcessMetaTask" style={{ fontSize: 24 }} />
          مراحل تفعيل الخطة
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { 
              phase: 'قبل الاضطراب', 
              subtitle: 'مرحلة الاستعداد',
              icon: 'Clock', 
              color: '#0078d4',
              items: [
                'تطوير خطة استمرارية الأعمال وتوفير الإرشادات والتعليمات',
                'تحديد فريق الأمن والسلامة في المدرسة وفريق استمرارية الأعمال',
                'تحديد المسؤوليات لجميع الأطراف المساهمة في التنفيذ',
                'وضع واختبار الفرضيات للتأكد من الجاهزية'
              ]
            },
            { 
              phase: 'خلال الاضطراب', 
              subtitle: 'مرحلة الاستجابة',
              icon: 'Warning', 
              color: '#d83b01',
              items: [
                'اكتشاف الحالة الطارئة ورفع بلاغ عبر نظام البلاغات الموحد',
                'تقييم الحالة وتحديد ما إذا كانت داخلية أو خارجية',
                'تفعيل خطة الاستمرارية إذا تعذرت المعالجة ضمن أوقات الاسترداد',
                'التنسيق مع الأطراف المعنية وتنفيذ الإجراءات البديلة'
              ]
            },
            { 
              phase: 'بعد الاضطراب', 
              subtitle: 'مرحلة التعافي والعودة',
              icon: 'CheckMark', 
              color: '#107c10',
              items: [
                'التحقق من انتهاء الحاجة لتفعيل الخطة وإمكانية العودة للوضع الطبيعي',
                'تفعيل إجراءات التعافي والعودة إلى الوضع الطبيعي',
                'إعداد تقرير بالحالة وحصر الدروس المستفادة',
                'تحديث خطة الاستمرارية بناءً على الدروس المستفادة'
              ]
            }
          ].map((phase, idx) => (
            <div key={idx} style={{ 
              backgroundColor: '#f8f9fa', 
              borderRadius: 12, 
              padding: 16,
              borderRight: `5px solid ${phase.color}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ 
                  backgroundColor: phase.color, 
                  color: '#fff', 
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}>
                  {idx + 1}
                </span>
                <div>
                  <div style={{ fontWeight: 700, color: '#333', fontSize: '1.05rem' }}>{phase.phase}</div>
                  <div style={{ fontSize: '0.85rem', color: phase.color }}>{phase.subtitle}</div>
                </div>
              </div>
              <ul style={{ margin: 0, paddingRight: 50, listStyleType: 'none' }}>
                {phase.items.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ 
                    marginBottom: 6, 
                    fontSize: '0.9rem', 
                    color: '#555',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8
                  }}>
                    <Icon iconName="CircleFill" style={{ fontSize: 6, color: phase.color, marginTop: 6, flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Constraints */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ 
          color: '#8764b8', 
          marginBottom: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          borderBottom: '3px solid #8764b8',
          paddingBottom: 8
        }}>
          <Icon iconName="Settings" style={{ fontSize: 24 }} />
          محددات خطة الاستمرارية
        </h2>
        <Text variant="medium" block style={{ color: '#555', marginBottom: 16 }}>
          يستند تطوير الخطة على مجموعة من المحددات التي تُراجع سنوياً أو بعد حدوث اضطراب فعلي:
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
          {[
            { title: 'المفاجأة', desc: 'قد يحدث الاضطراب في أي وقت ودون سابق إنذار، مما يستوجب تحديث الخطة باستمرار', icon: 'LightningBolt' },
            { title: 'صعوبة التنبؤ', desc: 'لا يمكن التنبؤ بتتابع الأحداث، لذا يجب أن تكون الخطة مرنة للتعامل مع ظروف مختلفة', icon: 'Unknown' },
            { title: 'حساسية النشاط', desc: 'التركيز على الأنشطة الحرجة المعنية بتقديم الخدمات الأساسية للوزارة', icon: 'Important' },
            { title: 'الاعتمادية', desc: 'تعزيز صمود الأنشطة غير الحرجة في حال اعتمدت عليها أنشطة حرجة', icon: 'Link' },
            { title: 'التحوط', desc: 'توفير البدائل المتنوعة لتعزيز الصمود في مواجهة الاضطرابات', icon: 'Shield' },
            { title: 'تعدد خطوط الصمود', desc: 'طرح بدائل تعتمد على تقنيات وآليات غير متشابهة وغير متقاطعة', icon: 'BranchMerge' }
          ].map((constraint, idx) => (
            <div key={idx} style={{ 
              backgroundColor: '#f5f3f8', 
              borderRadius: 10, 
              padding: 14,
              border: '1px solid #d4c4e0',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12
            }}>
              <Icon iconName={constraint.icon} style={{ fontSize: 22, color: '#8764b8', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#5c4d6d', marginBottom: 4 }}>{constraint.title}</div>
                <Text variant="small" block style={{ color: '#666' }}>{constraint.desc}</Text>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Activities and Recovery Times */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ 
          color: '#d83b01', 
          marginBottom: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          borderBottom: '3px solid #d83b01',
          paddingBottom: 8
        }}>
          <Icon iconName="Timer" style={{ fontSize: 24 }} />
          الأنشطة الحساسة وأوقات الاسترداد
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#fff3e0' }}>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: '2px solid #d83b01', color: '#d83b01' }}>النشاط</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '2px solid #d83b01', color: '#d83b01' }}>التقييم</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '2px solid #d83b01', color: '#d83b01' }}>RTO</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '2px solid #d83b01', color: '#d83b01' }}>MAO</th>
              </tr>
            </thead>
            <tbody>
              {[
                { activity: 'تنفيذ العملية التعليمية في المبنى المدرسي', rating: 'مرتفع جداً', rto: '0-7 ساعات', mao: '48 ساعة' },
                { activity: 'خدمات التعليم عبر المنصات (مدرستي، روضتي)', rating: 'مرتفع جداً', rto: '0-7 ساعات', mao: '24 ساعة' },
                { activity: 'خدمة البث التعليمي عبر قنوات عين', rating: 'مرتفع جداً', rto: '0-7 ساعات', mao: '24 ساعة' }
              ].map((item, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: 12, borderBottom: '1px solid #e1e1e1' }}>{item.activity}</td>
                  <td style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #e1e1e1' }}>
                    <span style={{ backgroundColor: '#d83b01', color: '#fff', padding: '4px 10px', borderRadius: 4, fontSize: '0.8rem' }}>
                      {item.rating}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #e1e1e1', fontWeight: 600, color: '#0078d4' }}>{item.rto}</td>
                  <td style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #e1e1e1', fontWeight: 600, color: '#d83b01' }}>{item.mao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: '0.8rem', color: '#666', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <span><strong>RTO:</strong> زمن الاسترداد المستهدف</span>
          <span><strong>MAO:</strong> أعلى وقت مقبول للانقطاع</span>
        </div>
      </div>

      {/* Communication Guidelines */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ 
          color: '#0078d4', 
          marginBottom: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          borderBottom: '3px solid #0078d4',
          paddingBottom: 8
        }}>
          <Icon iconName="Communications" style={{ fontSize: 24 }} />
          إرشادات التواصل أثناء وبعد الاضطرابات
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <div style={{ backgroundColor: '#e3f2fd', padding: 16, borderRadius: 10, borderRight: '4px solid #0078d4' }}>
            <h4 style={{ color: '#0078d4', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon iconName="Warning" /> أثناء حالة الاضطراب
            </h4>
            <ul style={{ margin: 0, paddingRight: 20, fontSize: '0.85rem', color: '#444' }}>
              <li style={{ marginBottom: 6 }}>التأكد من سلامة جميع الطلاب والمعلمين</li>
              <li style={{ marginBottom: 6 }}>إبلاغ المعلمين والطلاب بالموقع البديل لاستكمال التعليم</li>
              <li style={{ marginBottom: 6 }}>تحديث تقارير الحالة بشكل دوري</li>
              <li style={{ marginBottom: 6 }}>توثيق الحالة والإجراءات المتخذة والنتائج</li>
            </ul>
          </div>
          <div style={{ backgroundColor: '#e8f5e9', padding: 16, borderRadius: 10, borderRight: '4px solid #107c10' }}>
            <h4 style={{ color: '#107c10', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon iconName="CheckMark" /> بعد حالة الاضطراب
            </h4>
            <ul style={{ margin: 0, paddingRight: 20, fontSize: '0.85rem', color: '#444' }}>
              <li style={{ marginBottom: 6 }}>التأكد من سلامة الجميع وعودتهم للعمل بأمان</li>
              <li style={{ marginBottom: 6 }}>إعداد قائمة بالأطراف التي تم التواصل معها</li>
              <li style={{ marginBottom: 6 }}>بيان بالإجراءات المتخذة وكيفية معالجة المشاكل</li>
              <li style={{ marginBottom: 6 }}>تقارير الحالة النهائية والنتائج والتوصيات</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Required Resources and Skills */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ 
          color: '#ffb900', 
          marginBottom: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          borderBottom: '3px solid #ffb900',
          paddingBottom: 8
        }}>
          <Icon iconName="Toolbox" style={{ fontSize: 24 }} />
          الموارد والمهارات المطلوبة لتنفيذ الخطة
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <div style={{ backgroundColor: '#fffde7', padding: 16, borderRadius: 10, border: '1px solid #fff59d' }}>
            <h4 style={{ color: '#f57f17', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon iconName="Packages" /> الموارد المطلوبة
            </h4>
            <ul style={{ margin: 0, paddingRight: 20, fontSize: '0.85rem', color: '#555' }}>
              <li style={{ marginBottom: 6 }}>أعضاء فرق العمل المحددين</li>
              <li style={{ marginBottom: 6 }}>الأجهزة والبرامج والمعلومات والبيانات المطلوبة</li>
              <li style={{ marginBottom: 6 }}>البنية التحتية (مباني، إنترنت، هاتف، كهرباء)</li>
              <li style={{ marginBottom: 6 }}>التجهيزات اللوجستية (النقل، وسائل الاتصال)</li>
              <li style={{ marginBottom: 6 }}>الموارد المالية اللازمة</li>
            </ul>
          </div>
          <div style={{ backgroundColor: '#fff3e0', padding: 16, borderRadius: 10, border: '1px solid #ffe0b2' }}>
            <h4 style={{ color: '#e65100', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon iconName="Lightbulb" /> المهارات والكفاءات المطلوبة
            </h4>
            <ul style={{ margin: 0, paddingRight: 20, fontSize: '0.85rem', color: '#555' }}>
              <li style={{ marginBottom: 6 }}>المعرفة بخطة إدارة استمرارية الأعمال</li>
              <li style={{ marginBottom: 6 }}>فهم تحليل أثر توقف الأعمال (BIA) والمخاطر</li>
              <li style={{ marginBottom: 6 }}>معرفة الأعمال والتطبيقات والخدمات الأساسية</li>
              <li style={{ marginBottom: 6 }}>القدرة على التواصل الفعال مع فرق العمل</li>
              <li style={{ marginBottom: 6 }}>القدرة على اتخاذ القرارات السريعة</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Vital Records */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ 
          color: '#605e5c', 
          marginBottom: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          borderBottom: '3px solid #605e5c',
          paddingBottom: 8
        }}>
          <Icon iconName="Documentation" style={{ fontSize: 24 }} />
          السجلات الحيوية الواجب توفير نسخ بديلة منها
        </h2>
        <Text variant="medium" block style={{ color: '#555', marginBottom: 16 }}>
          يجب على إدارة المدرسة عمل نسخ بديلة يسهل الوصول إليها في حال الانقطاع:
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {[
            'بيانات الموظفين والطلاب',
            'كشوف الحضور والغياب',
            'سجل رصد الدرجات',
            'سجل قيد الشهادات',
            'سجل متابعة الطلاب',
            'سجل متابعة الموظفين',
            'الجدول المدرسي',
            'سجل الزيارات الإشرافية',
            'سجل الأنشطة الطلابية',
            'سجل التوجيه الطلابي'
          ].map((record, idx) => (
            <div key={idx} style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px 14px', 
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.85rem',
              color: '#444'
            }}>
              <Icon iconName="DocumentSet" style={{ color: '#605e5c' }} />
              {record}
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

    // Emergency Contacts that should be displayed prominently
    const emergencyContacts = [
      { name: 'رئيس وحدة عمليات الطوارئ', role: 'مسؤول العمليات', phone: '+966590006072' },
      { name: 'رئيس فريق السلامة', role: 'مسؤول السلامة', phone: '+966542079282' },
      { name: 'رئيس فريق الأمن', role: 'مسؤول الأمن', phone: '+966508633600' },
      { name: 'رئيس وحدة استمرارية الأعمال', role: 'مسؤول الاستمرارية', phone: '+966500076356' },
      { name: 'ضابط اتصال الطوارئ', role: 'ضابط اتصال', phone: '+966920033988' }
    ]

    const internalContacts = quickRefContacts.filter(c => c.category === 'internal')
    const externalContacts = quickRefContacts.filter(c => c.category === 'external')

    return (
      <Stack tokens={{ childrenGap: 24 }}>
        {/* Emergency Contacts - Prominent Display */}
        <div className="card" style={{ padding: 20, backgroundColor: '#ffebee', border: '2px solid #d32f2f' }}>
          <h3 style={{ color: '#d32f2f', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon iconName="AlertSolid" />
            جهات الاتصال للطوارئ - اتصل فوراً عند الحاجة
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 16 
          }}>
            {emergencyContacts.map((contact, idx) => (
              <div key={idx} style={{ 
                backgroundColor: '#fff', 
                borderRadius: 12, 
                padding: 16,
                border: '2px solid #ffcdd2',
                boxShadow: '0 2px 8px rgba(211, 47, 47, 0.2)'
              }}>
                <div style={{ fontWeight: 700, color: '#c62828', marginBottom: 4, fontSize: '1rem' }}>
                  {contact.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 12 }}>{contact.role}</div>
                <a 
                  href={`tel:${contact.phone}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#d32f2f',
                    color: '#fff',
                    padding: '10px 12px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    direction: 'ltr',
                    textAlign: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon iconName="Phone" />
                  {contact.phone}
                </a>
              </div>
            ))}
          </div>
        </div>

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

        {quickRefContacts.length === 0 && emergencyContacts.length > 0 && (
          <MessageBar messageBarType={MessageBarType.info}>
            يتم عرض جهات الاتصال الداخلية والخارجية من قاعدة بيانات المدرسة
          </MessageBar>
        )}
      </Stack>
    )
  }

  // Render RTO Section
  function renderRTOSection() {
    return (
      <Stack tokens={{ childrenGap: 20 }}>
        {/* RTO/RPO Summary */}
        <div className="card" style={{ padding: 24, backgroundColor: '#f0f8ff', border: '2px solid #0078d4' }}>
          <h3 style={{ color: '#0078d4', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon iconName="TimelineProgress" />
            أهداف وقت التعافي (RTO) وهدف نقطة استرجاع البيانات (RPO)
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div style={{ backgroundColor: '#fff', padding: 16, borderRadius: 8, borderRight: '4px solid #0078d4' }}>
              <h4 style={{ color: '#0078d4', margin: '0 0 8px 0' }}>RTO - هدف وقت التعافي</h4>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d83b01', margin: '8px 0' }}>24 ساعة</div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>الوقت المستهدف لاستئناف العملية التعليمية من أي انقطاع</p>
            </div>

            <div style={{ backgroundColor: '#fff', padding: 16, borderRadius: 8, borderRight: '4px solid #107c10' }}>
              <h4 style={{ color: '#107c10', margin: '0 0 8px 0' }}>RPO - هدف نقطة الاسترجاع</h4>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#107c10', margin: '8px 0' }}>4 ساعات</div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>أقصى حد لفقدان البيانات والعمليات المهمة</p>
            </div>
          </div>

          <Text variant="medium" block style={{ color: '#666', lineHeight: 1.6, backgroundColor: '#fff9e6', padding: 12, borderRadius: 4, borderRight: '3px solid #ffb900' }}>
            <strong style={{ color: '#333' }}>الهدف العام:</strong> ضمان استمرارية العملية التعليمية وعدم انقطاعها عن الطلاب لفترات طويلة، مع الحفاظ على سلامتهم وموظفي المدرسة.
          </Text>
        </div>

        {/* Available Alternatives */}
        <div className="card" style={{ padding: 24, backgroundColor: '#e8f5e9', border: '2px solid #107c10' }}>
          <h3 style={{ color: '#107c10', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon iconName="CheckMark" />
            البدائل المتاحة لضمان الاستمرارية
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { title: 'التعليم الإلكتروني', icon: 'ActivationStatus', desc: 'منصات التعليم الإلكتروني والفصول الافتراضية (منصة مدرستي)' },
              { title: 'المدرسة البديلة', icon: 'Education', desc: 'الانتقال للمدرسة البديلة المحددة في حال تعذر استخدام المبنى' },
              { title: 'قنوات عين التعليمية', icon: 'Television', desc: 'البث التعليمي عبر قنوات عين للمراحل الدراسية المختلفة' },
              { title: 'التعليم الذاتي', icon: 'ReadingMode', desc: 'مقررات سحابية مخففة للتعلم الذاتي مع متابعة المعلمين' }
            ].map((alt, idx) => (
              <div key={idx} style={{ 
                backgroundColor: '#fff', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #c8e6c9',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}>
                <Icon iconName={alt.icon} style={{ fontSize: 24, color: '#107c10', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>{alt.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{alt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disruption Classification */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ color: '#d83b01', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon iconName="Warning" />
            تصنيف حالات الاضطراب
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
            <div style={{ backgroundColor: '#fff3cd', padding: 16, borderRadius: 8, borderRight: '4px solid #ffc107' }}>
              <h4 style={{ color: '#856404', margin: '0 0 8px 0' }}>المستوى الأول</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                اضطراب لا يؤثر على استمرار التعليم ولا يؤدي إلى توقفه. يتم التنسيق مع الأطراف المعنية لمعالجته.
              </p>
            </div>
            <div style={{ backgroundColor: '#f8d7da', padding: 16, borderRadius: 8, borderRight: '4px solid #dc3545' }}>
              <h4 style={{ color: '#721c24', margin: '0 0 8px 0' }}>المستوى الثاني</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                اضطراب يؤثر على استمرار العملية التعليمية ويؤدي إلى توقفها. يتم تفعيل خطة استمرارية الأعمال.
              </p>
            </div>
          </div>
        </div>

        {/* Risk Categories */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ color: '#0078d4', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon iconName="Shield" />
            فئات المخاطر في إطار خطة الاستمرارية
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { title: 'فقدان البنية التحتية', desc: 'حريق، كوارث طبيعية، انقطاع الكهرباء أو الماء', icon: 'Warning', color: '#d83b01' },
              { title: 'فقدان الموارد البشرية', desc: 'عدم توفر معلمين أو طلاب أو كادر إداري', icon: 'People', color: '#8764b8' },
              { title: 'فقدان الموارد التقنية', desc: 'تعطل المنصات التعليمية الإلكترونية', icon: 'ServerProcesses', color: '#0078d4' },
              { title: 'اضطراب أمني', desc: 'اضطرابات أمنية داخل أو خارج المدرسة', icon: 'LockSolid', color: '#107c10' },
              { title: 'فقدان الاتصالات', desc: 'عدم توفر الاتصالات أو الإنترنت', icon: 'WifiWarning4', color: '#ffb900' }
            ].map((risk, idx) => (
              <div key={idx} style={{ 
                backgroundColor: '#f8f9fa', 
                padding: 14, 
                borderRadius: 8,
                borderRight: `4px solid ${risk.color}`,
                textAlign: 'center'
              }}>
                <Icon iconName={risk.icon} style={{ fontSize: 28, color: risk.color, marginBottom: 8 }} />
                <div style={{ fontWeight: 600, color: '#333', marginBottom: 4, fontSize: '0.9rem' }}>{risk.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>{risk.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Stack>
    )
  }

}

export default BCPlan
