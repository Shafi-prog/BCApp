import React, { useState, useEffect } from 'react'
import {
  Stack, Text, Icon, PrimaryButton, DefaultButton, TextField, Dropdown,
  DetailsList, DetailsListLayoutMode, SelectionMode, IColumn, Panel, PanelType,
  MessageBar, MessageBarType, Spinner, Pivot, PivotItem, Toggle, DatePicker,
  IDropdownOption, Checkbox, ProgressIndicator, SearchBox
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { SharePointService, SchoolInfo, TeamMember, Drill, Incident, TrainingLog } from '../services/sharepointService'
import { mutualOperationPlan, SchoolAlternatives } from '../data/mutualOperation'

// Interfaces
interface ContactItem {
  id: number
  name: string
  role: string
  email: string
  phone: string
  category: 'operations' | 'bc_team' | 'safety_team' | 'external'
}

interface TestPlan {
  id: number
  title: string
  hypothesis: string
  specificEvent: string  // وصف الحدث المحدد
  targetGroup: string    // الفئة المستهدفة
  startDate: string      // تاريخ بداية التنفيذ
  endDate: string        // تاريخ نهاية التنفيذ
  status: string
  responsible: string
  notes: string
}

interface LessonsLearned {
  id: number
  incidentTitle: string
  date: string
  challenges: string
  lessonsLearned: string
  recommendations: string
  actionItems: string
}

interface DRCheckItem {
  id: number
  category: string
  item: string
  status: 'ready' | 'partial' | 'not_ready'
  lastChecked: string
  notes: string
}

// BC Plan that will be shared with schools
interface SharedBCPlan {
  title: string
  description: string
  lastUpdated: string
  scenarios: { id: number; title: string; description: string; actions: string[] }[]
  contacts: { name: string; role: string; phone: string }[]
  alternativeSchools: { schoolName: string; alternativeSchool: string }[]
  drillPlan: { quarter: number; drillType: string; targetDate: string }[]
  isPublished: boolean
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('duties')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: MessageBarType, text: string} | null>(null)
  
  // Data states
  const [schools, setSchools] = useState<SchoolInfo[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [drills, setDrills] = useState<Drill[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([])
  
  // Local storage states
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [lessonsLearned, setLessonsLearned] = useState<LessonsLearned[]>([])
  const [drChecklist, setDRChecklist] = useState<DRCheckItem[]>([])
  const [sharedBCPlan, setSharedBCPlan] = useState<SharedBCPlan | null>(null)
  
  // Panel states
  const [contactPanelOpen, setContactPanelOpen] = useState(false)
  const [testPlanPanelOpen, setTestPlanPanelOpen] = useState(false)
  const [lessonPanelOpen, setLessonPanelOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null)
  const [editingTestPlan, setEditingTestPlan] = useState<TestPlan | null>(null)
  const [editingLesson, setEditingLesson] = useState<LessonsLearned | null>(null)

  // Load data on mount
  useEffect(() => {
    loadAllData()
    loadLocalData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [schoolsData, teamData, drillsData, incidentsData, trainingData] = await Promise.all([
        SharePointService.getSchoolInfo(),
        SharePointService.getTeamMembers(),
        SharePointService.getDrills(),
        SharePointService.getIncidents(),
        SharePointService.getTrainingLog()
      ])
      setSchools(schoolsData)
      setTeamMembers(teamData)
      setDrills(drillsData)
      setIncidents(incidentsData)
      setTrainingLogs(trainingData)
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: 'فشل تحميل البيانات' })
    } finally {
      setLoading(false)
    }
  }

  const loadLocalData = async () => {
    try {
      const savedContacts = localStorage.getItem('bc_contacts')
      const savedLessons = localStorage.getItem('bc_lessons_learned')
      const savedDR = localStorage.getItem('bc_dr_checklist')
      
      if (savedContacts) setContacts(JSON.parse(savedContacts))
      if (savedLessons) setLessonsLearned(JSON.parse(savedLessons))
      if (savedDR) setDRChecklist(JSON.parse(savedDR))
      else initializeDRChecklist()
      
      // Load admin drill plans from SharePoint service (secure storage)
      try {
        const drillPlans = await SharePointService.getAdminDrillPlans()
        setTestPlans(drillPlans.map(p => ({
          id: p.Id || 0,
          title: p.Title,
          hypothesis: p.DrillHypothesis || '',
          specificEvent: p.SpecificEvent || '',
          targetGroup: p.TargetGroup || '',
          startDate: p.StartDate || '',
          endDate: p.EndDate || '',
          status: p.PlanStatus || 'مخطط',
          responsible: p.Responsible || '',
          notes: p.Notes || '',
        })))
      } catch (e) {
        console.error('Error loading drill plans from SharePoint:', e)
        // Fallback to old localStorage data for migration
        const savedTestPlans = localStorage.getItem('bc_test_plans')
        if (savedTestPlans) setTestPlans(JSON.parse(savedTestPlans))
      }
      
      // Load shared BC Plan
      const savedBCPlan = localStorage.getItem('bc_shared_plan')
      if (savedBCPlan) setSharedBCPlan(JSON.parse(savedBCPlan))
      else initializeSharedBCPlan()
    } catch (e) {
      console.error('Error loading local data:', e)
      initializeDRChecklist()
    }
  }

  const initializeSharedBCPlan = () => {
    const defaultPlan: SharedBCPlan = {
      title: 'خطة استمرارية العملية التعليمية',
      description: 'تهدف هذه الخطة إلى استمرارية العملية التعليمية من خلال توضيح جميع الجوانب التي تعزز قدرة المدارس على استمرارية تقديم التعليم أثناء الاضطراب',
      lastUpdated: new Date().toISOString(),
      scenarios: [
        { id: 1, title: 'تعذر تنفيذ العملية التعليمية في المبنى المدرسي', description: 'حالة تعطل المبنى المدرسي بسبب كوارث طبيعية أو طوارئ', actions: ['التواصل مع إدارة التعليم', 'تفعيل المدرسة البديلة', 'التحول للتعليم عن بعد'] },
        { id: 2, title: 'تعطل المنصات التعليمية (مدرستي/روضتي)', description: 'انقطاع خدمات المنصات الإلكترونية', actions: ['استخدام قنوات عين البديلة', 'توزيع المواد الورقية', 'التواصل مع أولياء الأمور'] },
        { id: 3, title: 'تعطل البث التعليمي عبر قنوات عين', description: 'انقطاع خدمة البث التلفزيوني التعليمي', actions: ['استخدام منصة مدرستي', 'توفير روابط بديلة', 'التواصل مع الدعم الفني'] },
        { id: 4, title: 'تعطل المنصات وقنوات عين معاً', description: 'انقطاع شامل للخدمات الإلكترونية', actions: ['توزيع المواد الورقية', 'التواصل المباشر مع الطلاب', 'تفعيل خطة الطوارئ'] },
        { id: 5, title: 'نقص الكادر التعليمي', description: 'غياب عدد كبير من المعلمين', actions: ['تفعيل خطة الدمج', 'الاستعانة بمعلمين بديلين', 'التنسيق مع المدارس المجاورة'] },
      ],
      contacts: [],
      alternativeSchools: [],
      drillPlan: [
        { quarter: 1, drillType: 'تمرين إخلاء', targetDate: '' },
        { quarter: 2, drillType: 'تمرين حريق', targetDate: '' },
        { quarter: 3, drillType: 'تمرين زلزال', targetDate: '' },
        { quarter: 4, drillType: 'تمرين شامل', targetDate: '' },
      ],
      isPublished: false
    }
    setSharedBCPlan(defaultPlan)
    localStorage.setItem('bc_shared_plan', JSON.stringify(defaultPlan))
  }

  const saveSharedBCPlan = (plan: SharedBCPlan) => {
    const updatedPlan = { ...plan, lastUpdated: new Date().toISOString() }
    setSharedBCPlan(updatedPlan)
    localStorage.setItem('bc_shared_plan', JSON.stringify(updatedPlan))
    setMessage({ type: MessageBarType.success, text: plan.isPublished ? 'تم نشر الخطة للمدارس بنجاح' : 'تم حفظ الخطة' })
  }

  const initializeDRChecklist = () => {
    const defaultChecklist: DRCheckItem[] = [
      { id: 1, category: 'البيانات', item: 'النسخ الاحتياطي للبيانات', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 2, category: 'البيانات', item: 'اختبار استعادة البيانات', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 3, category: 'الأنظمة', item: 'منصة مدرستي', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 4, category: 'الأنظمة', item: 'نظام نور', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 5, category: 'الأنظمة', item: 'قنوات عين', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 6, category: 'الاتصالات', item: 'قوائم الاتصال محدثة', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 7, category: 'الاتصالات', item: 'وسائل التواصل البديلة', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 8, category: 'المواقع البديلة', item: 'تحديد المدارس البديلة', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 9, category: 'المواقع البديلة', item: 'اتفاقيات التشغيل المتبادل', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 10, category: 'الفرق', item: 'تشكيل فريق استمرارية الأعمال', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 11, category: 'الفرق', item: 'تدريب الفرق على الخطة', status: 'not_ready', lastChecked: '', notes: '' },
    ]
    setDRChecklist(defaultChecklist)
    localStorage.setItem('bc_dr_checklist', JSON.stringify(defaultChecklist))
  }

  const saveContacts = (data: ContactItem[]) => {
    setContacts(data)
    localStorage.setItem('bc_contacts', JSON.stringify(data))
  }

  const saveTestPlans = async (data: TestPlan[]) => {
    setTestPlans(data)
    // Save to SharePoint service (SBC_Drills_Log with IsAdminPlan=true)
    try {
      // Clear existing admin plans and save new
      const existing = await SharePointService.getAdminDrillPlans()
      for (const plan of existing) {
        if (plan.Id) await SharePointService.deleteAdminDrillPlan(plan.Id)
      }
      for (const plan of data) {
        await SharePointService.createAdminDrillPlan({
          Title: plan.title,
          DrillHypothesis: plan.hypothesis,
          SpecificEvent: plan.specificEvent || '',
          TargetGroup: plan.targetGroup || '',
          StartDate: plan.startDate || '',
          EndDate: plan.endDate || '',
          Quarter: data.indexOf(plan) + 1,
          PlanStatus: plan.status,
          Responsible: plan.responsible,
          Notes: plan.notes,
          AcademicYear: new Date().getFullYear().toString(),
          IsAdminPlan: true,
        })
      }
      setMessage({ type: MessageBarType.success, text: 'تم حفظ خطة التمارين بنجاح في SharePoint' })
    } catch (e) {
      console.error('Error saving drill plans to SharePoint:', e)
      // Fallback to localStorage
      localStorage.setItem('bc_test_plans', JSON.stringify(data))
      setMessage({ type: MessageBarType.warning, text: 'تم الحفظ محلياً - سيتم المزامنة لاحقاً' })
    }
  }

  const saveLessonsLearned = (data: LessonsLearned[]) => {
    setLessonsLearned(data)
    localStorage.setItem('bc_lessons_learned', JSON.stringify(data))
  }

  const saveDRChecklist = (data: DRCheckItem[]) => {
    setDRChecklist(data)
    localStorage.setItem('bc_dr_checklist', JSON.stringify(data))
  }

  // Export data to JSON
  const exportData = (type: string) => {
    let data: any
    let filename: string
    
    switch(type) {
      case 'schools': data = schools; filename = 'schools_data.json'; break
      case 'team': data = teamMembers; filename = 'team_members.json'; break
      case 'drills': data = drills; filename = 'drills_log.json'; break
      case 'incidents': data = incidents; filename = 'incidents_log.json'; break
      case 'training': data = trainingLogs; filename = 'training_log.json'; break
      case 'contacts': data = contacts; filename = 'contacts.json'; break
      case 'testplans': data = testPlans; filename = 'test_plans.json'; break
      case 'lessons': data = lessonsLearned; filename = 'lessons_learned.json'; break
      case 'all': 
        data = { schools, teamMembers, drills, incidents, trainingLogs, contacts, testPlans, lessonsLearned, drChecklist }
        filename = 'bc_full_backup.json'
        break
      default: return
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ type: MessageBarType.success, text: `تم تصدير ${filename}` })
  }

  // Calculate statistics
  const stats = {
    totalSchools: schools.length,
    schoolsWithTeams: new Set(teamMembers.map(t => t.SchoolName_Ref)).size,
    schoolsWithDrills: new Set(drills.map(d => d.SchoolName_Ref)).size,
    schoolsWithTraining: new Set(trainingLogs.map(t => t.SchoolName_Ref)).size,
    totalTeamMembers: teamMembers.length,
    totalDrills: drills.length,
    totalIncidents: incidents.length,
    activeIncidents: incidents.filter(i => !i.ClosureTime).length,
    totalTrainings: trainingLogs.length,
    drReadiness: drChecklist.length > 0 ? Math.round(drChecklist.filter(d => d.status === 'ready').length / drChecklist.length * 100) : 0
  }

  // Calculate schools that completed all 4 drills
  const drillsPerSchool = new Map<string, number>()
  drills.forEach(d => {
    if (d.SchoolName_Ref) {
      drillsPerSchool.set(d.SchoolName_Ref, (drillsPerSchool.get(d.SchoolName_Ref) || 0) + 1)
    }
  })
  const schoolsCompleted4Drills = Array.from(drillsPerSchool.entries()).filter(([_, count]) => count >= 4).length

  // BC Duties checklist - Merged 18 duties from متابعة إنجاز مهام الوحدة.xlsx (25 tasks merged)
  // مهام وحدة الطوارئ واستمرارية الأعمال - إدارة التعليم بمنطقة المدينة المنورة
  const bcDuties = [
    // 1. إعداد خطط الطوارئ ومراجعتها وتحديثها دورياً
    { id: 1, title: 'إعداد خطط الطوارئ على مستوى إدارة التعليم العامة وقطاعاتها التابعة، ومراجعتها وتحديثها دورياً', done: schools.length > 0, tab: 'stats', category: 'planning' },
    // 2. جمع وتحليل البيانات وإدارة خطة استمرارية الأعمال (NEW - was missing)
    { id: 2, title: 'جمع وتحليل البيانات وإدارة خطة استمرارية الأعمال ومراجعة الإجراءات والسياسات والخطط المرتبطة بها', done: schools.length > 0, tab: 'stats', category: 'planning' },
    // 3. إعداد خطة تنفيذ التمارين الفرضية + إعداد خطة سنوية للاختبارات (MERGED)
    { id: 3, title: `إعداد خطة سنوية للتمارين الفرضية (4 تمارين/مدرسة) ومتابعة تنفيذها والرفع بالتقارير (${schoolsCompleted4Drills} مدرسة أكملت)`, done: testPlans.length > 0 || drills.length > 0, tab: 'testplans', category: 'drills' },
    // 4. تحديد فرق العمل + تقييم الموارد والإمكانات والقدرات (MERGED)
    { id: 4, title: 'تحديد فرق العمل المعنية وتقييم الموارد والإمكانات والقدرات للاستعداد للحالات الطارئة والاستجابة والتعافي', done: teamMembers.length > 0, tab: 'stats', category: 'teams' },
    // 5. متابعة تطبيق معايير ومستويات إدارة الحالة الطارئة
    { id: 5, title: 'متابعة تطبيق معايير ومستويات إدارة الحالة الطارئة وتصعيدها وخفضها ونماذج الرصد والمراقبة والإنذار', done: incidents.length >= 0, tab: 'stats', category: 'monitoring' },
    // 6. متابعة برامج وحلول معالجة مخاطر الانقطاع
    { id: 6, title: 'متابعة تطبيق برامج وحلول معالجة مخاطر الانقطاع أو التعطل لضمان استمرارية الأعمال', done: stats.drReadiness > 0, tab: 'dr', category: 'dr' },
    // 7. مراقبة أوقات التعافي المستهدفة والفترات الزمنية
    { id: 7, title: 'مراقبة أوقات التعافي المستهدفة والفترات الزمنية القصوى للانقطاع ونقاط الاسترجاع المستهدفة', done: stats.drReadiness > 0, tab: 'dr', category: 'dr' },
    // 8. مراجعة وتحديث بيانات التواصل + التنسيق للتأكد من جاهزية DR (MERGED)
    { id: 8, title: 'مراجعة وتحديث بيانات التواصل والأصول، والتأكد من جاهزية مركز البيانات الاحتياطي (DR) وآليات النسخ الاحتياطي', done: contacts.length > 0 && stats.drReadiness > 0, tab: 'dr', category: 'dr' },
    // 9. التنسيق لإعداد خطط التدريب + التأكد من وعي الموظفين (MERGED)
    { id: 9, title: 'التنسيق لإعداد خطط التدريب والتوعية والتأكد من وعي ومعرفة الموظفين وفرق العمل بخطة استمرارية الأعمال', done: trainingLogs.length > 0, tab: 'stats', category: 'training' },
    // 10. متابعة تطبيق السياسات والبرامج + الالتزام بتطبيقها (MERGED)
    { id: 10, title: 'متابعة تطبيق السياسات والبرامج والخطط المعتمدة والالتزام بتطبيقها أثناء تنفيذ خطط استمرارية الأعمال', done: true, tab: 'duties', category: 'policies' },
    // 11. المشاركة في إدارة المخاطر + مراجعة خطط العمل (MERGED)
    { id: 11, title: 'المشاركة في إدارة المخاطر والطوارئ ومراجعة خطط العمل ووضع إجراءات فعالة للاستجابة للاضطرابات', done: drills.length > 0, tab: 'stats', category: 'risks' },
    // 12. تنفيذ اختبار الفريق للخطة ورفع تقرير بالنتائج
    { id: 12, title: 'تنفيذ اختبار الفريق للخطة (التمارين الفرضية) ورفع تقرير بالنتائج لفريق استمرارية الأعمال', done: drills.length > 0, tab: 'testplans', category: 'drills' },
    // 13. مراقبة وتقييم إجراءات الاستجابة + توثيق الدروس المستفادة (MERGED)
    { id: 13, title: 'مراقبة وتقييم إجراءات الاستجابة للحالة الطارئة والتعافي منها وتوثيق الدروس المستفادة والحلول المقترحة', done: lessonsLearned.length > 0 || incidents.length > 0, tab: 'lessons', category: 'lessons' },
    // 14. متابعة مؤشرات الأداء الرئيسة ورفع التقارير
    { id: 14, title: 'متابعة مؤشرات الأداء الرئيسة في الطوارئ واستمرارية الأعمال والتأكد من الالتزام بها ورفع التقارير', done: schools.length > 0 && drills.length > 0, tab: 'stats', category: 'kpi' },
    // 15. متابعة معايير ومؤشرات الجاهزية وإعداد تقارير الجاهزية
    { id: 15, title: 'متابعة معايير ومؤشرات الجاهزية الخاصة بالطوارئ واستمرارية الأعمال وإعداد تقارير الجاهزية', done: stats.drReadiness > 50, tab: 'dr', category: 'readiness' },
    // 16. متابعة تطبيق معايير تفعيل خطط الطوارئ والانتقال للتعافي
    { id: 16, title: 'متابعة تطبيق معايير وإجراءات تفعيل خطط الطوارئ والانتقال من مرحلة الاستجابة إلى مرحلة التعافي', done: drills.length > 0 && lessonsLearned.length >= 0, tab: 'stats', category: 'recovery' },
    // 17. الاحتفاظ بقائمة الأصول + توفير المعلومات للجهات المختصة (MERGED)
    { id: 17, title: 'الاحتفاظ بقائمة الأصول الهامة وتوفير المعلومات والمخططات للجهات المختصة (الدفاع المدني) كلما دعت الحاجة', done: contacts.filter(c => c.category === 'external').length > 0, tab: 'contacts', category: 'assets' },
    // 18. تمثيل إدارة التعليم في الاستراتيجيات الوطنية
    { id: 18, title: 'تمثيل إدارة التعليم العامة في الاستراتيجيات الوطنية للطوارئ والكوارث والأزمات واستمرارية الأعمال', done: contacts.filter(c => c.category === 'external').length > 0, tab: 'contacts', category: 'representation' },
  ]

  // Export duties progress to CSV for SharePoint
  const exportDutiesCSV = () => {
    const dutiesData = bcDuties.map(d => ({
      'رقم المهمة': d.id,
      'المهمة': d.title,
      'الحالة': d.done ? 'مكتمل' : 'قيد العمل',
      'تاريخ التحديث': new Date().toLocaleDateString('ar-SA')
    }))
    
    // Create CSV content with BOM for Arabic support
    const headers = Object.keys(dutiesData[0])
    const csvContent = '\ufeff' + headers.join(',') + '\n' + 
      dutiesData.map(row => headers.map(h => `"${(row as any)[h]}"`).join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'مهام_استمرارية_الاعمال.csv'
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ type: MessageBarType.success, text: 'تم تصدير مهام استمرارية الأعمال - يمكن رفعها إلى SharePoint' })
  }

  if (user?.type !== 'admin') {
    return <div style={{ padding: 24 }}><MessageBar messageBarType={MessageBarType.warning}>هذه الصفحة متاحة للمشرفين فقط</MessageBar></div>
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 className="page-title" style={{ color: '#008752', marginBottom: 8 }}>
        <Icon iconName="Settings" style={{ marginLeft: 8 }} />
        لوحة إدارة استمرارية الأعمال
      </h1>
      <p style={{ color: '#666', marginBottom: 24 }}>إدارة مهام ومتطلبات خطة استمرارية العملية التعليمية</p>

      {message && (
        <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)} styles={{ root: { marginBottom: 16 } }}>
          {message.text}
        </MessageBar>
      )}

      {loading && <Spinner label="جاري التحميل..." />}

      <Pivot selectedKey={activeTab} onLinkClick={(item) => setActiveTab(item?.props.itemKey || 'duties')}>
        {/* Tab 1: Duties Checklist */}
        <PivotItem headerText="مهام استمرارية الأعمال" itemKey="duties" itemIcon="TaskList">
          <div style={{ padding: '20px 0' }}>
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ color: '#008752', marginBottom: 16 }}>قائمة المهام (قبل حالة الاضطراب - مرحلة الاستعداد)</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {bcDuties.map(duty => (
                  <div key={duty.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', backgroundColor: duty.done ? '#dff6dd' : '#fff4ce', borderRadius: 8, border: `1px solid ${duty.done ? '#107c10' : '#ffb900'}` }}>
                    <Icon iconName={duty.done ? 'CheckMark' : 'Clock'} style={{ color: duty.done ? '#107c10' : '#ffb900', fontSize: 20 }} />
                    <span style={{ flex: 1 }}>{duty.id}. {duty.title}</span>
                    <span style={{ color: duty.done ? '#107c10' : '#835c00', fontWeight: 600, fontSize: 12 }}>{duty.done ? 'مكتمل' : 'قيد العمل'}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: 16, backgroundColor: '#f3f2f1', borderRadius: 8 }}>
                <ProgressIndicator label={`نسبة الإنجاز: ${Math.round(bcDuties.filter(d => d.done).length / bcDuties.length * 100)}%`} percentComplete={bcDuties.filter(d => d.done).length / bcDuties.length} barHeight={8} />
              </div>
            </div>
          </div>
        </PivotItem>

        {/* Tab 2: Statistics */}
        <PivotItem headerText="إحصائيات شاملة" itemKey="stats" itemIcon="BarChartVertical">
          <div style={{ padding: '20px 0' }}>

        {/* Tab 1.5: BC Plan Sharing (NEW) */}
        <PivotItem headerText="📋 نشر الخطة للمدارس" itemKey="bcplan" itemIcon="Share">
          <div style={{ padding: '20px 0' }}>
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ color: '#008752', margin: 0 }}>خطة استمرارية العملية التعليمية</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: 16, 
                    backgroundColor: sharedBCPlan?.isPublished ? '#dff6dd' : '#fff4ce',
                    color: sharedBCPlan?.isPublished ? '#107c10' : '#835c00',
                    fontSize: 12, fontWeight: 600
                  }}>
                    {sharedBCPlan?.isPublished ? '✓ منشورة للمدارس' : '⏳ مسودة'}
                  </span>
                </div>
              </div>
              
              <TextField 
                label="عنوان الخطة"
                value={sharedBCPlan?.title || ''}
                onChange={(_, v) => sharedBCPlan && setSharedBCPlan({ ...sharedBCPlan, title: v || '' })}
                styles={{ root: { marginBottom: 12 } }}
              />
              
              <TextField 
                label="وصف الخطة"
                multiline rows={3}
                value={sharedBCPlan?.description || ''}
                onChange={(_, v) => sharedBCPlan && setSharedBCPlan({ ...sharedBCPlan, description: v || '' })}
                styles={{ root: { marginBottom: 16 } }}
              />
              
              <h4 style={{ color: '#323130', marginBottom: 12 }}>🎭 سيناريوهات الاضطراب</h4>
              <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                {sharedBCPlan?.scenarios.map((scenario, idx) => (
                  <div key={scenario.id} style={{ padding: 12, backgroundColor: '#f3f2f1', borderRadius: 8 }}>
                    <strong style={{ color: '#008752' }}>{idx + 1}. {scenario.title}</strong>
                    <p style={{ margin: '8px 0', color: '#605e5c', fontSize: 13 }}>{scenario.description}</p>
                    <div style={{ fontSize: 12, color: '#323130' }}>
                      <strong>الإجراءات:</strong> {scenario.actions.join(' ← ')}
                    </div>
                  </div>
                ))}
              </div>
              
              <h4 style={{ color: '#323130', marginBottom: 12 }}>📅 خطة التمارين السنوية (4 تمارين)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {sharedBCPlan?.drillPlan.map((drill, idx) => (
                  <div key={idx} style={{ padding: 12, backgroundColor: '#e8f4ea', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#008752' }}>الربع {drill.quarter}</div>
                    <div style={{ fontSize: 13 }}>{drill.drillType}</div>
                    <TextField 
                      type="date"
                      label="تاريخ التنفيذ"
                      value={drill.targetDate}
                      onChange={(_, v) => {
                        if (sharedBCPlan) {
                          const updated = [...sharedBCPlan.drillPlan]
                          updated[idx] = { ...updated[idx], targetDate: v || '' }
                          setSharedBCPlan({ ...sharedBCPlan, drillPlan: updated })
                        }
                      }}
                      styles={{ root: { marginTop: 8 } }}
                    />
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <DefaultButton 
                  text="حفظ كمسودة" 
                  iconProps={{ iconName: 'Save' }}
                  onClick={() => sharedBCPlan && saveSharedBCPlan({ ...sharedBCPlan, isPublished: false })}
                />
                <PrimaryButton 
                  text={sharedBCPlan?.isPublished ? 'تحديث ونشر للمدارس' : 'نشر للمدارس'} 
                  iconProps={{ iconName: 'Share' }}
                  onClick={() => sharedBCPlan && saveSharedBCPlan({ ...sharedBCPlan, isPublished: true })}
                  styles={{ root: { backgroundColor: '#008752' } }}
                />
              </div>
              
              {sharedBCPlan?.isPublished && (
                <MessageBar messageBarType={MessageBarType.success} styles={{ root: { marginTop: 16 } }}>
                  ✅ الخطة منشورة ومتاحة للمدارس - آخر تحديث: {new Date(sharedBCPlan.lastUpdated).toLocaleString('ar-SA')}
                </MessageBar>
              )}
            </div>
          </div>
        </PivotItem>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { title: 'إجمالي المدارس', value: stats.totalSchools, icon: 'Org', color: '#008752' },
                { title: 'مدارس لديها فرق', value: stats.schoolsWithTeams, icon: 'Group', color: '#0078d4' },
                { title: 'مدارس نفذت تمارين', value: stats.schoolsWithDrills, icon: 'TaskList', color: '#107c10' },
                { title: 'مدارس لديها تدريبات', value: stats.schoolsWithTraining, icon: 'ReadingMode', color: '#5c2d91' },
                { title: 'أعضاء الفرق', value: stats.totalTeamMembers, icon: 'People', color: '#0078d4' },
                { title: 'التمارين المنفذة', value: stats.totalDrills, icon: 'CheckList', color: '#107c10' },
                { title: 'الحوادث المسجلة', value: stats.totalIncidents, icon: 'Warning', color: '#d83b01' },
                { title: 'الحوادث النشطة', value: stats.activeIncidents, icon: 'ShieldAlert', color: stats.activeIncidents > 0 ? '#d83b01' : '#107c10' },
                { title: 'جاهزية DR', value: `${stats.drReadiness}%`, icon: 'CloudUpload', color: stats.drReadiness >= 70 ? '#107c10' : '#ffb900' },
              ].map((stat, i) => (
                <div key={i} className="card" style={{ padding: 20, textAlign: 'center', borderTop: `4px solid ${stat.color}` }}>
                  <Icon iconName={stat.icon} style={{ fontSize: 28, color: stat.color, marginBottom: 8 }} />
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ color: '#666' }}>{stat.title}</div>
                </div>
              ))}
            </div>
          </div>
        </PivotItem>

        {/* Tab 3: Yearly Drill Plan */}
        <PivotItem headerText="خطة التمارين السنوية" itemKey="testplans" itemIcon="TestPlan">
          <div style={{ padding: '20px 0' }}>
            {/* Summary Card */}
            <div className="card" style={{ padding: 16, marginBottom: 20, backgroundColor: '#f3f2f1' }}>
              <Stack horizontal tokens={{ childrenGap: 40 }} horizontalAlign="center">
                <div style={{ textAlign: 'center' }}>
                  <Text variant="xxLarge" style={{ color: '#008752', fontWeight: 700 }}>{schools.length}</Text>
                  <Text style={{ display: 'block', color: '#666' }}>إجمالي المدارس</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text variant="xxLarge" style={{ color: '#107c10', fontWeight: 700 }}>{schoolsCompleted4Drills}</Text>
                  <Text style={{ display: 'block', color: '#666' }}>مدارس أكملت 4 تمارين</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text variant="xxLarge" style={{ color: '#0078d4', fontWeight: 700 }}>{stats.totalDrills}</Text>
                  <Text style={{ display: 'block', color: '#666' }}>إجمالي التمارين</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text variant="xxLarge" style={{ color: schools.length > 0 ? '#5c2d91' : '#666', fontWeight: 700 }}>{schools.length > 0 ? Math.round(schoolsCompleted4Drills / schools.length * 100) : 0}%</Text>
                  <Text style={{ display: 'block', color: '#666' }}>نسبة الإنجاز</Text>
                </div>
              </Stack>
            </div>

            <Stack horizontal horizontalAlign="space-between" style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>خطة التمارين الفرضية السنوية (4 تمارين لكل مدرسة)</h3>
              <PrimaryButton text="إضافة تمرين مخطط" iconProps={{ iconName: 'Add' }} onClick={() => { setEditingTestPlan(null); setTestPlanPanelOpen(true) }} />
            </Stack>
            
            {/* Yearly Plan Table */}
            <div className="card">
              <DetailsList
                items={testPlans}
                columns={[
                  { key: 'title', name: 'عنوان التمرين', fieldName: 'title', minWidth: 100 },
                  { key: 'hypothesis', name: 'الفرضية', fieldName: 'hypothesis', minWidth: 100 },
                  { key: 'targetGroup', name: 'الفئة المستهدفة', fieldName: 'targetGroup', minWidth: 80 },
                  { key: 'startDate', name: 'من', fieldName: 'startDate', minWidth: 80, onRender: (item: TestPlan) => item.startDate ? new Date(item.startDate).toLocaleDateString('ar-SA') : '-' },
                  { key: 'endDate', name: 'إلى', fieldName: 'endDate', minWidth: 80, onRender: (item: TestPlan) => item.endDate ? new Date(item.endDate).toLocaleDateString('ar-SA') : '-' },
                  { key: 'status', name: 'الحالة', fieldName: 'status', minWidth: 70, onRender: (item: TestPlan) => {
                    const colors: any = { 'مخطط': '#ffb900', 'قيد التنفيذ': '#0078d4', 'مكتمل': '#107c10', 'مؤجل': '#d83b01' }
                    return <span style={{ color: colors[item.status] || '#666', fontWeight: 600 }}>{item.status}</span>
                  }},
                  { key: 'actions', name: 'إجراءات', minWidth: 80, maxWidth: 100, onRender: (item: TestPlan) => (
                    <Stack horizontal tokens={{ childrenGap: 4 }}>
                      <IconButton iconProps={{ iconName: 'Edit' }} title="تعديل" onClick={() => { setEditingTestPlan(item); setTestPlanPanelOpen(true) }} styles={{ root: { color: '#0078d4' } }} />
                      <IconButton iconProps={{ iconName: 'Delete' }} title="حذف" onClick={() => saveTestPlans(testPlans.filter(t => t.id !== item.id))} styles={{ root: { color: '#d83b01' } }} />
                    </Stack>
                  )}
                ]}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.none}
              />
              {testPlans.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>لا توجد تمارين مخططة - أضف الخطة السنوية للتمارين</div>}
            </div>

            {/* Schools Progress */}
            <div className="card" style={{ marginTop: 20 }}>
              <h4 style={{ color: '#008752', marginBottom: 12 }}>تقدم المدارس في تنفيذ التمارين</h4>
              <DetailsList
                items={schools.map(s => ({
                  schoolName: s.SchoolName,
                  drillCount: drillsPerSchool.get(s.SchoolName) || 0,
                  progress: Math.min(((drillsPerSchool.get(s.SchoolName) || 0) / 4) * 100, 100)
                })).sort((a, b) => b.drillCount - a.drillCount)}
                columns={[
                  { key: 'schoolName', name: 'المدرسة', fieldName: 'schoolName', minWidth: 200 },
                  { key: 'drillCount', name: 'التمارين المنفذة', fieldName: 'drillCount', minWidth: 100, onRender: (item: any) => <span style={{ color: item.drillCount >= 4 ? '#107c10' : '#323130' }}>{item.drillCount} / 4</span> },
                  { key: 'progress', name: 'نسبة الإنجاز', minWidth: 150, onRender: (item: any) => (
                    <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                      <ProgressIndicator percentComplete={item.progress / 100} barHeight={6} styles={{ root: { width: 80 }, progressBar: { backgroundColor: item.progress >= 100 ? '#107c10' : '#0078d4' } }} />
                      <span style={{ color: item.progress >= 100 ? '#107c10' : '#323130', fontWeight: 600 }}>{Math.round(item.progress)}%</span>
                    </Stack>
                  )}
                ]}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.none}
                styles={{ root: { maxHeight: 300, overflowY: 'auto' } }}
              />
            </div>
          </div>
        </PivotItem>

        {/* Tab 4: Contacts */}
        <PivotItem headerText="قوائم الاتصال" itemKey="contacts" itemIcon="ContactList">
          <div style={{ padding: '20px 0' }}>
            <Stack horizontal horizontalAlign="space-between" style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>بيانات التواصل الداخلية والخارجية</h3>
              <PrimaryButton text="إضافة جهة اتصال" iconProps={{ iconName: 'AddFriend' }} onClick={() => { setEditingContact(null); setContactPanelOpen(true) }} />
            </Stack>
            <div className="card">
              <DetailsList
                items={contacts}
                columns={[
                  { key: 'name', name: 'الاسم', fieldName: 'name', minWidth: 120 },
                  { key: 'role', name: 'الدور', fieldName: 'role', minWidth: 120 },
                  { key: 'email', name: 'البريد', fieldName: 'email', minWidth: 150 },
                  { key: 'phone', name: 'الهاتف', fieldName: 'phone', minWidth: 100 },
                  { key: 'category', name: 'التصنيف', fieldName: 'category', minWidth: 100, onRender: (item: ContactItem) => {
                    const labels: any = { operations: 'غرفة العمليات', bc_team: 'فريق BC', safety_team: 'الأمن والسلامة', external: 'جهة خارجية' }
                    return labels[item.category] || item.category
                  }},
                  { key: 'actions', name: 'إجراءات', minWidth: 80, onRender: (item: ContactItem) => (
                    <Stack horizontal tokens={{ childrenGap: 4 }}>
                      <DefaultButton text="تعديل" onClick={() => { setEditingContact(item); setContactPanelOpen(true) }} />
                      <DefaultButton text="حذف" onClick={() => saveContacts(contacts.filter(c => c.id !== item.id))} />
                    </Stack>
                  )}
                ]}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.none}
              />
              {contacts.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>لا توجد جهات اتصال مسجلة</div>}
            </div>
          </div>
        </PivotItem>

        {/* Tab 5: DR Checklist */}
        <PivotItem headerText="جاهزية DR" itemKey="dr" itemIcon="CloudUpload">
          <div style={{ padding: '20px 0' }}>
            <h3 style={{ marginBottom: 16 }}>قائمة التحقق من جاهزية مركز البيانات الاحتياطي</h3>
            <div className="card" style={{ padding: 20 }}>
              {['البيانات', 'الأنظمة', 'الاتصالات', 'المواقع البديلة', 'الفرق'].map(category => (
                <div key={category} style={{ marginBottom: 20 }}>
                  <h4 style={{ color: '#008752', marginBottom: 12 }}>{category}</h4>
                  {drChecklist.filter(d => d.category === category).map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: 4, marginBottom: 8 }}>
                      <Dropdown
                        selectedKey={item.status}
                        options={[
                          { key: 'ready', text: '✅ جاهز' },
                          { key: 'partial', text: '⚠️ جزئي' },
                          { key: 'not_ready', text: '❌ غير جاهز' }
                        ]}
                        onChange={(_, opt) => {
                          const updated = drChecklist.map(d => d.id === item.id ? { ...d, status: opt?.key as any, lastChecked: new Date().toISOString().split('T')[0] } : d)
                          saveDRChecklist(updated)
                        }}
                        styles={{ root: { width: 120 } }}
                      />
                      <span style={{ flex: 1 }}>{item.item}</span>
                      <TextField placeholder="ملاحظات" value={item.notes} onChange={(_, v) => {
                        const updated = drChecklist.map(d => d.id === item.id ? { ...d, notes: v || '' } : d)
                        saveDRChecklist(updated)
                      }} styles={{ root: { width: 200 } }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </PivotItem>

        {/* Tab 6: Lessons Learned */}
        <PivotItem headerText="الدروس المستفادة" itemKey="lessons" itemIcon="LightBulb">
          <div style={{ padding: '20px 0' }}>
            {/* Schools Lessons - from Incidents */}
            <SchoolLessonsAnalysis incidents={incidents} drills={drills} />
            
            {/* Admin's Lessons */}
            <div style={{ marginTop: 24 }}>
              <Stack horizontal horizontalAlign="space-between" style={{ marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>📝 تقارير الإدارة</h3>
                <PrimaryButton text="إضافة تقرير" iconProps={{ iconName: 'Add' }} onClick={() => { setEditingLesson(null); setLessonPanelOpen(true) }} />
              </Stack>
              <div className="card">
                <DetailsList
                  items={lessonsLearned}
                  columns={[
                    { key: 'incidentTitle', name: 'الحادث', fieldName: 'incidentTitle', minWidth: 150 },
                    { key: 'date', name: 'التاريخ', fieldName: 'date', minWidth: 100 },
                    { key: 'lessonsLearned', name: 'الدروس المستفادة', fieldName: 'lessonsLearned', minWidth: 200 },
                    { key: 'actions', name: 'إجراءات', minWidth: 80, onRender: (item: LessonsLearned) => (
                      <Stack horizontal tokens={{ childrenGap: 4 }}>
                        <DefaultButton text="تعديل" onClick={() => { setEditingLesson(item); setLessonPanelOpen(true) }} />
                        <DefaultButton text="حذف" onClick={() => saveLessonsLearned(lessonsLearned.filter(l => l.id !== item.id))} />
                      </Stack>
                    )}
                  ]}
                  layoutMode={DetailsListLayoutMode.justified}
                  selectionMode={SelectionMode.none}
                />
                {lessonsLearned.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>لا توجد تقارير مسجلة من الإدارة</div>}
              </div>
            </div>
          </div>
        </PivotItem>

        {/* Tab 7: Alternative Schools */}
        <PivotItem headerText="المدارس البديلة" itemKey="altschools" itemIcon="Switch">
          <div style={{ padding: '20px 0' }}>
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ color: '#008752', marginBottom: 16 }}>التشغيل المتبادل للمدارس</h3>
              <p style={{ color: '#666', marginBottom: 16 }}>تحديد المدارس البديلة لاستخدامها خلال حالات الاضطراب (المبنى أو المدرسة التي يمكن استخدامها في حالة تعذر استخدام المدرسة الأصلية)</p>
              <AltSchoolsManager schools={schools} />
            </div>
          </div>
        </PivotItem>

        {/* Tab 8: Damage Assessment */}
        <PivotItem headerText="تقييم الأضرار" itemKey="damage" itemIcon="ReportWarning">
          <div style={{ padding: '20px 0' }}>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ color: '#008752', marginBottom: 16 }}>نموذج تقييم الأضرار</h3>
              <p style={{ color: '#666', marginBottom: 16 }}>يتم تعبئة هذا النموذج بعد انتهاء حالة الاضطراب لتوثيق الأضرار</p>
              <DamageAssessmentManager incidents={incidents} />
            </div>
          </div>
        </PivotItem>

        {/* Tab 9: Export/Import */}
        <PivotItem headerText="تصدير واستيراد" itemKey="export" itemIcon="CloudDownload">
          <div style={{ padding: '20px 0' }}>
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ color: '#008752', marginBottom: 16 }}>📊 تصدير مهام استمرارية الأعمال (للمشاركة عبر SharePoint)</h3>
              <p style={{ color: '#666', marginBottom: 16 }}>صدّر المهام الـ14 بصيغة CSV لمشاركتها مع الفريق أو رفعها إلى SharePoint</p>
              <PrimaryButton 
                text="تصدير المهام (CSV)" 
                iconProps={{ iconName: 'ExcelDocument' }} 
                onClick={exportDutiesCSV}
                styles={{ root: { backgroundColor: '#107c10' } }}
              />
            </div>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ color: '#008752', marginBottom: 16 }}>تصدير البيانات الأخرى</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <PrimaryButton text="تصدير المدارس" iconProps={{ iconName: 'Download' }} onClick={() => exportData('schools')} />
                <PrimaryButton text="تصدير الفرق" iconProps={{ iconName: 'Download' }} onClick={() => exportData('team')} />
                <PrimaryButton text="تصدير التمارين" iconProps={{ iconName: 'Download' }} onClick={() => exportData('drills')} />
                <PrimaryButton text="تصدير الحوادث" iconProps={{ iconName: 'Download' }} onClick={() => exportData('incidents')} />
                <PrimaryButton text="تصدير التدريبات" iconProps={{ iconName: 'Download' }} onClick={() => exportData('training')} />
                <PrimaryButton text="تصدير جهات الاتصال" iconProps={{ iconName: 'Download' }} onClick={() => exportData('contacts')} />
                <DefaultButton text="نسخة احتياطية كاملة" iconProps={{ iconName: 'CloudUpload' }} onClick={() => exportData('all')} style={{ gridColumn: 'span 2' }} />
              </div>
            </div>
          </div>
        </PivotItem>
      </Pivot>

      {/* Contact Panel */}
      <Panel isOpen={contactPanelOpen} onDismiss={() => setContactPanelOpen(false)} headerText={editingContact ? 'تعديل جهة اتصال' : 'إضافة جهة اتصال'} type={PanelType.medium}>
        <ContactForm contact={editingContact} onSave={(c) => { saveContacts(editingContact ? contacts.map(x => x.id === c.id ? c : x) : [...contacts, { ...c, id: Date.now() }]); setContactPanelOpen(false) }} />
      </Panel>

      {/* Test Plan Panel */}
      <Panel isOpen={testPlanPanelOpen} onDismiss={() => setTestPlanPanelOpen(false)} headerText={editingTestPlan ? 'تعديل اختبار' : 'إضافة اختبار'} type={PanelType.medium}>
        <TestPlanForm plan={editingTestPlan} onSave={(p) => { saveTestPlans(editingTestPlan ? testPlans.map(x => x.id === p.id ? p : x) : [...testPlans, { ...p, id: Date.now() }]); setTestPlanPanelOpen(false) }} />
      </Panel>

      {/* Lessons Panel */}
      <Panel isOpen={lessonPanelOpen} onDismiss={() => setLessonPanelOpen(false)} headerText={editingLesson ? 'تعديل تقرير' : 'إضافة تقرير'} type={PanelType.medium}>
        <LessonForm lesson={editingLesson} incidents={incidents} onSave={(l) => { saveLessonsLearned(editingLesson ? lessonsLearned.map(x => x.id === l.id ? l : x) : [...lessonsLearned, { ...l, id: Date.now() }]); setLessonPanelOpen(false) }} />
      </Panel>
    </div>
  )
}

// Sub-components for forms
const ContactForm: React.FC<{ contact: ContactItem | null, onSave: (c: ContactItem) => void }> = ({ contact, onSave }) => {
  const [form, setForm] = useState<Partial<ContactItem>>(contact || { name: '', role: '', email: '', phone: '', category: 'bc_team' })
  return (
    <Stack tokens={{ childrenGap: 12 }} style={{ padding: 16 }}>
      <TextField label="الاسم" value={form.name} onChange={(_, v) => setForm({ ...form, name: v })} required />
      <TextField label="الدور الوظيفي" value={form.role} onChange={(_, v) => setForm({ ...form, role: v })} />
      <TextField label="البريد الإلكتروني" value={form.email} onChange={(_, v) => setForm({ ...form, email: v })} />
      <TextField label="رقم الهاتف" value={form.phone} onChange={(_, v) => setForm({ ...form, phone: v })} />
      <Dropdown label="التصنيف" selectedKey={form.category} options={[
        { key: 'operations', text: 'غرفة العمليات' },
        { key: 'bc_team', text: 'فريق استمرارية الأعمال' },
        { key: 'safety_team', text: 'فريق الأمن والسلامة' },
        { key: 'external', text: 'جهة خارجية' }
      ]} onChange={(_, opt) => setForm({ ...form, category: opt?.key as any })} />
      <PrimaryButton text="حفظ" onClick={() => onSave(form as ContactItem)} disabled={!form.name} />
    </Stack>
  )
}

const TestPlanForm: React.FC<{ plan: TestPlan | null, onSave: (p: TestPlan) => void }> = ({ plan, onSave }) => {
  const [form, setForm] = useState<Partial<TestPlan>>(plan || { title: '', hypothesis: '', specificEvent: '', targetGroup: '', startDate: '', endDate: '', status: 'مخطط', responsible: '', notes: '' })
  
  const hypothesisOptions = [
    { key: 'الفرضية الأولى: تعذر استخدام المبنى المدرسي (كلي/جزئي).', text: 'تعذر استخدام المبنى المدرسي' },
    { key: 'الفرضية الثانية: تعطل الأنظمة والمنصات التعليمية (مدرستي/تيمز).', text: 'تعطل المنصات التعليمية' },
    { key: 'الفرضية الثالثة: تعطل خدمة البث التعليمي (قنوات عين).', text: 'تعطل قنوات عين' },
    { key: 'الفرضية الرابعة: انقطاع الخدمات الأساسية (كهرباء/اتصال/مياه).', text: 'انقطاع الخدمات الأساسية' },
    { key: 'الفرضية الخامسة: نقص الكوادر البشرية (جوائح/أوبئة).', text: 'نقص الكوادر البشرية' },
  ]
  
  const targetGroupOptions = [
    { key: 'إخلاء كامل (طلاب ومعلمين).', text: 'إخلاء كامل (طلاب ومعلمين)' },
    { key: 'تمرين مكتبي (فريق الأمن والسلامة فقط).', text: 'تمرين مكتبي (فريق الأمن والسلامة)' },
    { key: 'محاكاة تقنية (عن بعد).', text: 'محاكاة تقنية (عن بعد)' },
    { key: 'إخلاء جزئي', text: 'إخلاء جزئي' },
  ]
  
  return (
    <Stack tokens={{ childrenGap: 12 }} style={{ padding: 16 }}>
      <TextField label="عنوان التمرين *" value={form.title} onChange={(_, v) => setForm({ ...form, title: v })} required placeholder="مثال: تمرين إخلاء الربع الأول" />
      
      <Dropdown label="فرضية التمرين *" selectedKey={form.hypothesis} options={hypothesisOptions} onChange={(_, opt) => setForm({ ...form, hypothesis: opt?.key as string })} required placeholder="اختر الفرضية" />
      
      <TextField label="وصف الحدث المحدد *" value={form.specificEvent} onChange={(_, v) => setForm({ ...form, specificEvent: v })} multiline rows={2} placeholder="وصف تفصيلي للحدث الذي سيتم محاكاته" required />
      
      <Dropdown label="الفئة المستهدفة *" selectedKey={form.targetGroup} options={targetGroupOptions} onChange={(_, opt) => setForm({ ...form, targetGroup: opt?.key as string })} required placeholder="اختر الفئة المستهدفة" />
      
      <div style={{ backgroundColor: '#f0f9ff', padding: 16, borderRadius: 8, border: '1px solid #0078d4' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#0078d4' }}>📅 فترة التنفيذ المتاحة للمدارس</h4>
        <Stack horizontal tokens={{ childrenGap: 16 }}>
          <TextField label="تاريخ البداية" type="date" value={form.startDate} onChange={(_, v) => setForm({ ...form, startDate: v })} styles={{ root: { flex: 1 } }} required />
          <TextField label="تاريخ النهاية" type="date" value={form.endDate} onChange={(_, v) => setForm({ ...form, endDate: v })} styles={{ root: { flex: 1 } }} required />
        </Stack>
        <p style={{ fontSize: '0.85rem', color: '#666', margin: '8px 0 0 0' }}>المدارس ستتمكن من تنفيذ التمرين فقط خلال هذه الفترة</p>
      </div>
      
      <Dropdown label="الحالة" selectedKey={form.status} options={[
        { key: 'مخطط', text: 'مخطط' },
        { key: 'قيد التنفيذ', text: 'متاح للتنفيذ' },
        { key: 'مكتمل', text: 'مكتمل' },
        { key: 'مؤجل', text: 'مؤجل' }
      ]} onChange={(_, opt) => setForm({ ...form, status: opt?.key as string })} />
      
      <TextField label="المسؤول عن المتابعة" value={form.responsible} onChange={(_, v) => setForm({ ...form, responsible: v })} placeholder="اسم المسؤول من الإدارة" />
      
      <TextField label="ملاحظات إضافية" multiline rows={2} value={form.notes} onChange={(_, v) => setForm({ ...form, notes: v })} />
      
      <PrimaryButton text="حفظ" onClick={() => onSave(form as TestPlan)} disabled={!form.title || !form.hypothesis || !form.targetGroup || !form.startDate || !form.endDate} />
    </Stack>
  )
}

const LessonForm: React.FC<{ lesson: LessonsLearned | null, incidents: Incident[], onSave: (l: LessonsLearned) => void }> = ({ lesson, incidents, onSave }) => {
  const [form, setForm] = useState<Partial<LessonsLearned>>(lesson || { incidentTitle: '', date: '', challenges: '', lessonsLearned: '', recommendations: '', actionItems: '' })
  return (
    <Stack tokens={{ childrenGap: 12 }} style={{ padding: 16 }}>
      <Dropdown label="الحادث المرتبط" selectedKey={form.incidentTitle} options={incidents.map(i => ({ key: i.Title, text: i.Title }))} onChange={(_, opt) => setForm({ ...form, incidentTitle: opt?.key as string })} placeholder="اختر حادث أو أدخل يدوياً" />
      <TextField label="أو أدخل عنوان الحادث" value={form.incidentTitle} onChange={(_, v) => setForm({ ...form, incidentTitle: v })} />
      <TextField label="التاريخ" type="date" value={form.date} onChange={(_, v) => setForm({ ...form, date: v })} />
      <TextField label="التحديات" multiline rows={2} value={form.challenges} onChange={(_, v) => setForm({ ...form, challenges: v })} />
      <TextField label="الدروس المستفادة" multiline rows={3} value={form.lessonsLearned} onChange={(_, v) => setForm({ ...form, lessonsLearned: v })} required />
      <TextField label="التوصيات" multiline rows={2} value={form.recommendations} onChange={(_, v) => setForm({ ...form, recommendations: v })} />
      <TextField label="الإجراءات المطلوبة" multiline rows={2} value={form.actionItems} onChange={(_, v) => setForm({ ...form, actionItems: v })} />
      <PrimaryButton text="حفظ" onClick={() => onSave(form as LessonsLearned)} disabled={!form.lessonsLearned} />
    </Stack>
  )
}

// Alternative Schools Manager Component
interface AltSchoolMapping { id: number; primarySchool: string; altSchool1: string; altSchool2: string; notes: string }
const AltSchoolsManager: React.FC<{ schools: SchoolInfo[] }> = ({ schools }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [sectorFilter, setSectorFilter] = useState<string>('all')

  // Get unique levels and sectors for filters
  const levels = [...new Set(mutualOperationPlan.map(s => s.level))].filter(Boolean)
  const sectors = [...new Set(mutualOperationPlan.map(s => s.sector))].filter(Boolean)

  // Filter the data
  const filteredData = mutualOperationPlan.filter(school => {
    const matchesSearch = !searchQuery || 
      school.schoolName.includes(searchQuery) ||
      school.alternatives.some(a => a.schoolName.includes(searchQuery))
    const matchesLevel = levelFilter === 'all' || school.level === levelFilter
    const matchesSector = sectorFilter === 'all' || school.sector === sectorFilter
    return matchesSearch && matchesLevel && matchesSector
  })

  // Schools without alternatives (like ثرب)
  const schoolsWithoutAlternatives = schools.filter(s => 
    !mutualOperationPlan.find(m => m.schoolName === s.SchoolName)
  )

  // Get note for sector
  const getNoteForSchool = (school: SchoolAlternatives): string => {
    if (school.sector.includes('ثرب')) {
      return 'المدارس متباعدة جداً'
    }
    if (school.alternatives.length === 0) {
      return 'لا توجد مدارس بديلة قريبة'
    }
    if (school.alternatives.length === 1) {
      return 'بديل واحد فقط متاح'
    }
    return ''
  }

  const levelOptions: IDropdownOption[] = [
    { key: 'all', text: 'جميع المراحل' },
    ...levels.map(l => ({ key: l, text: l }))
  ]

  const sectorOptions: IDropdownOption[] = [
    { key: 'all', text: 'جميع القطاعات' },
    ...sectors.map(s => ({ key: s, text: s }))
  ]

  // Export to Excel
  const exportToExcel = () => {
    const today = new Date().toLocaleDateString('ar-SA')
    
    // Create CSV content with BOM for Arabic support
    let csvContent = '\ufeff'
    csvContent += 'نظام استمرارية العملية التعليمية\n'
    csvContent += 'التشغيل المتبادل بين المدارس\n'
    csvContent += `التاريخ: ${today}\n\n`
    csvContent += 'المدرسة الأساسية,المرحلة,الجنس,القطاع,المدرسة البديلة 1,المسافة (كم),قائد المدرسة 1,جوال القائد 1,المدرسة البديلة 2,المسافة (كم),قائد المدرسة 2,جوال القائد 2,ملاحظات\n'
    
    filteredData.forEach(school => {
      const alt1 = school.alternatives[0]
      const alt2 = school.alternatives[1]
      csvContent += `"${school.schoolName}","${school.level}","${school.gender}","${school.sector}",`
      csvContent += alt1 ? `"${alt1.schoolName}","${alt1.distanceKm}","${alt1.principalName}","${alt1.principalPhone}",` : `"-","-","-","-",`
      csvContent += alt2 ? `"${alt2.schoolName}","${alt2.distanceKm}","${alt2.principalName}","${alt2.principalPhone}",` : `"-","-","-","-",`
      csvContent += `"${getNoteForSchool(school)}"\n`
    })
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `التشغيل_المتبادل_${today.replace(/\//g, '-')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export to PDF (using print functionality)
  const exportToPDF = () => {
    const today = new Date().toLocaleDateString('ar-SA')
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    let tableRows = ''
    filteredData.forEach((school, idx) => {
      const alt1 = school.alternatives[0]
      const alt2 = school.alternatives[1]
      tableRows += `
        <tr style="background-color: ${idx % 2 === 0 ? '#f9f9f9' : 'white'}">
          <td style="padding: 8px; border: 1px solid #ddd;">
            <div style="font-weight: bold;">${school.schoolName}</div>
            <div style="font-size: 11px; color: #666;">${school.sector}</div>
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;">${school.level}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${school.gender}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            ${alt1 ? `<div>${alt1.schoolName}</div><div style="font-size: 11px;">${alt1.principalName} - ${alt1.principalPhone}</div>` : '-'}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
            ${alt1 ? `${alt1.distanceKm} كم` : '-'}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            ${alt2 ? `<div>${alt2.schoolName}</div><div style="font-size: 11px;">${alt2.principalName} - ${alt2.principalPhone}</div>` : '-'}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
            ${alt2 ? `${alt2.distanceKm} كم` : '-'}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd; font-size: 11px; color: #666;">${getNoteForSchool(school)}</td>
        </tr>
      `
    })
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>التشغيل المتبادل بين المدارس</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #008752; padding-bottom: 20px; }
          .header h1 { color: #008752; margin: 0; font-size: 24px; }
          .header h2 { color: #333; margin: 10px 0 0 0; font-size: 20px; }
          .header .date { color: #666; font-size: 14px; margin-top: 10px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background-color: #008752; color: white; padding: 10px 8px; text-align: right; }
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>نظام استمرارية العملية التعليمية</h1>
          <h2>التشغيل المتبادل بين المدارس</h2>
          <div class="date">التاريخ: ${today}</div>
          <div style="margin-top: 10px; font-size: 14px;">
            إجمالي المدارس: ${filteredData.length} | 
            المرحلة: ${levelFilter === 'all' ? 'جميع المراحل' : levelFilter} | 
            القطاع: ${sectorFilter === 'all' ? 'جميع القطاعات' : sectorFilter}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>المدرسة الأساسية</th>
              <th>المرحلة</th>
              <th>الجنس</th>
              <th>المدرسة البديلة 1</th>
              <th>المسافة</th>
              <th>المدرسة البديلة 2</th>
              <th>المسافة</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div style="margin-top: 20px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
          <strong>معايير التشغيل المتبادل:</strong> نفس المرحلة الدراسية + نفس الجنس + أقرب مسافة جغرافية
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div>
      {/* Statistics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: 12, 
        marginBottom: 20 
      }}>
        <div style={{ background: '#e8f5e9', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2e7d32' }}>{mutualOperationPlan.length}</div>
          <div style={{ color: '#666' }}>مدرسة لها بدائل</div>
        </div>
        <div style={{ background: '#fff3e0', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ef6c00' }}>{schools.length - mutualOperationPlan.length}</div>
          <div style={{ color: '#666' }}>مدرسة بدون بدائل</div>
        </div>
        <div style={{ background: '#e3f2fd', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1565c0' }}>{Math.round(mutualOperationPlan.length / schools.length * 100)}%</div>
          <div style={{ color: '#666' }}>نسبة التغطية</div>
        </div>
      </div>

      {/* Criteria Info Box */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: 16, 
        borderRadius: 8, 
        marginBottom: 16,
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, color: '#333', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon iconName="Settings" style={{ color: '#008752' }} />
              معايير التشغيل المتبادل الحالية:
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ background: '#e8f5e9', padding: '4px 12px', borderRadius: 16, fontSize: '0.85rem' }}>
                ✓ نفس المرحلة الدراسية
              </span>
              <span style={{ background: '#e8f5e9', padding: '4px 12px', borderRadius: 16, fontSize: '0.85rem' }}>
                ✓ نفس الجنس (بنين/بنات)
              </span>
              <span style={{ background: '#e8f5e9', padding: '4px 12px', borderRadius: 16, fontSize: '0.85rem' }}>
                ✓ أقرب مسافة جغرافية
              </span>
              <span style={{ background: '#fff3e0', padding: '4px 12px', borderRadius: 16, fontSize: '0.85rem' }}>
                الحد الأقصى: 10 كم
              </span>
            </div>
          </div>
          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <DefaultButton
              iconProps={{ iconName: 'ExcelDocument' }}
              text="تصدير Excel"
              onClick={exportToExcel}
              styles={{ root: { backgroundColor: '#217346', color: 'white', border: 'none' }, rootHovered: { backgroundColor: '#1e5e3a', color: 'white' } }}
            />
            <DefaultButton
              iconProps={{ iconName: 'PDF' }}
              text="تصدير PDF"
              onClick={exportToPDF}
              styles={{ root: { backgroundColor: '#d32f2f', color: 'white', border: 'none' }, rootHovered: { backgroundColor: '#b71c1c', color: 'white' } }}
            />
          </Stack>
        </div>
      </div>

      {/* Filters */}
      <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginBottom: 16 }} wrap>
        <SearchBox 
          placeholder="بحث عن مدرسة..." 
          value={searchQuery}
          onChange={(_, v) => setSearchQuery(v || '')}
          styles={{ root: { width: 250 } }}
        />
        <Dropdown 
          label="المرحلة" 
          selectedKey={levelFilter} 
          options={levelOptions} 
          onChange={(_, opt) => setLevelFilter(opt?.key as string)} 
          styles={{ root: { width: 180 } }} 
        />
        <Dropdown 
          label="القطاع" 
          selectedKey={sectorFilter} 
          options={sectorOptions} 
          onChange={(_, opt) => setSectorFilter(opt?.key as string)} 
          styles={{ root: { width: 200 } }} 
        />
      </Stack>

      {/* Results count */}
      <div style={{ marginBottom: 12, color: '#666' }}>
        عرض {filteredData.length} من {mutualOperationPlan.length} مدرسة
      </div>

      {/* Table */}
      <div style={{ maxHeight: 500, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#008752', color: 'white', position: 'sticky', top: 0 }}>
              <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #006644' }}>المدرسة الأساسية</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #006644' }}>المرحلة</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #006644' }}>المدرسة البديلة 1</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #006644' }}>المسافة</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #006644' }}>المدرسة البديلة 2</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #006644' }}>المسافة</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #006644' }}>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((school, idx) => (
              <tr key={school.schoolId} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontWeight: 600 }}>{school.schoolName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{school.sector}</div>
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', fontSize: '0.85rem' }}>
                  {school.level}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee' }}>
                  {school.alternatives[0] ? (
                    <div>
                      <div style={{ fontWeight: 500 }}>{school.alternatives[0].schoolName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>{school.alternatives[0].principalName}</div>
                    </div>
                  ) : <span style={{ color: '#999' }}>-</span>}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                  {school.alternatives[0] ? (
                    <span style={{ 
                      backgroundColor: school.alternatives[0].distanceKm < 3 ? '#e8f5e9' : school.alternatives[0].distanceKm < 6 ? '#fff3e0' : '#ffebee',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '0.85rem'
                    }}>
                      {school.alternatives[0].distanceKm} كم
                    </span>
                  ) : '-'}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee' }}>
                  {school.alternatives[1] ? (
                    <div>
                      <div style={{ fontWeight: 500 }}>{school.alternatives[1].schoolName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>{school.alternatives[1].principalName}</div>
                    </div>
                  ) : <span style={{ color: '#999' }}>-</span>}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                  {school.alternatives[1] ? (
                    <span style={{ 
                      backgroundColor: school.alternatives[1].distanceKm < 3 ? '#e8f5e9' : school.alternatives[1].distanceKm < 6 ? '#fff3e0' : '#ffebee',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '0.85rem'
                    }}>
                      {school.alternatives[1].distanceKm} كم
                    </span>
                  ) : '-'}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', fontSize: '0.85rem', color: '#666' }}>
                  {getNoteForSchool(school)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schools without alternatives - ثرب section */}
      {sectorFilter === 'all' && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ color: '#d32f2f', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon iconName="Warning" />
            المدارس بدون بدائل (قطاع ثرب والمناطق النائية)
          </h4>
          <div style={{ backgroundColor: '#fff3e0', padding: 16, borderRadius: 8, border: '1px solid #ffcc80' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffcc80' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>المدرسة الأساسية</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>المرحلة</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>القطاع</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>المدرسة البديلة 1</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>المدرسة البديلة 2</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {schools.filter(s => s.SectorDescription?.includes('ثرب')).slice(0, 20).map((school, idx) => (
                  <tr key={school.SchoolID || idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff8e1' : '#fffde7' }}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2' }}>{school.SchoolName}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2' }}>{school.Level}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2' }}>{school.SectorDescription}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', color: '#999' }}>-</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', color: '#999' }}>-</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', color: '#d32f2f', fontWeight: 500 }}>المدارس متباعدة جداً</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, fontSize: '0.85rem', color: '#666' }}>
              * قطاع ثرب: المدارس متباعدة جغرافياً ولا توجد بدائل ضمن نطاق 10 كم
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// School Lessons Analysis Component - Analyzes lessons from schools' incidents and drills
const SchoolLessonsAnalysis: React.FC<{ incidents: Incident[]; drills: Drill[] }> = ({ incidents, drills }) => {
  const [viewMode, setViewMode] = useState<'summary' | 'incidents' | 'drills'>('summary')
  const [searchQuery, setSearchQuery] = useState('')

  // Extract lessons from incidents
  const incidentsWithLessons = incidents.filter(i => 
    i.LessonsLearned || i.Challenges || i.Suggestions
  )

  // Analyze word frequency for popular themes
  const analyzeWords = (): { word: string; count: number; type: string }[] => {
    const wordCounts: { [key: string]: { count: number; type: string } } = {}
    
    // Common Arabic stop words to ignore
    const stopWords = ['من', 'في', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي', 'كان', 'قد', 'ما', 'لا', 'أن', 'و', 'أو', 'ثم', 'بعد', 'قبل', 'كل', 'بين', 'عند', 'حتى', 'إذا', 'لم', 'لن', 'كانت', 'يكون', 'تم', 'يتم', 'ذلك', 'هناك', 'أي', 'به', 'بها', 'له', 'لها', 'منها', 'منه', 'وقد', 'ولا', 'وهو', 'وهي']
    
    // Process incidents lessons
    incidents.forEach(incident => {
      const texts = [
        incident.LessonsLearned || '',
        incident.Challenges || '',
        incident.Suggestions || '',
        incident.ActionTaken || ''
      ].join(' ')
      
      const words = texts.split(/[\s،,.\-:؛]+/).filter(w => w.length > 2 && !stopWords.includes(w))
      words.forEach(word => {
        if (!wordCounts[word]) {
          wordCounts[word] = { count: 0, type: 'incident' }
        }
        wordCounts[word].count++
      })
    })

    // Process drills
    drills.forEach(drill => {
      const texts = [
        drill.DrillHypothesis || '',
        drill.SpecificEvent || '',
        drill.TargetGroup || ''
      ].join(' ')
      
      const words = texts.split(/[\s،,.\-:؛]+/).filter(w => w.length > 2 && !stopWords.includes(w))
      words.forEach(word => {
        if (!wordCounts[word]) {
          wordCounts[word] = { count: 0, type: 'drill' }
        }
        wordCounts[word].count++
      })
    })

    return Object.entries(wordCounts)
      .map(([word, data]) => ({ word, ...data }))
      .filter(w => w.count >= 3) // Only words that appear 3+ times
      .sort((a, b) => b.count - a.count)
      .slice(0, 20) // Top 20 words
  }

  const popularWords = analyzeWords()

  // Group lessons by category/theme
  const categorizedLessons = {
    safety: incidentsWithLessons.filter(i => 
      (i.LessonsLearned || '').includes('سلامة') || 
      (i.LessonsLearned || '').includes('إخلاء') ||
      (i.LessonsLearned || '').includes('أمن')
    ),
    communication: incidentsWithLessons.filter(i => 
      (i.LessonsLearned || '').includes('تواصل') || 
      (i.LessonsLearned || '').includes('إبلاغ') ||
      (i.LessonsLearned || '').includes('تنسيق')
    ),
    preparation: incidentsWithLessons.filter(i => 
      (i.LessonsLearned || '').includes('تدريب') || 
      (i.LessonsLearned || '').includes('استعداد') ||
      (i.LessonsLearned || '').includes('جاهزية')
    ),
    other: incidentsWithLessons.filter(i => 
      !(i.LessonsLearned || '').includes('سلامة') && 
      !(i.LessonsLearned || '').includes('إخلاء') &&
      !(i.LessonsLearned || '').includes('تواصل') &&
      !(i.LessonsLearned || '').includes('تدريب')
    )
  }

  // Filter by search
  const filteredIncidents = searchQuery 
    ? incidentsWithLessons.filter(i => 
        (i.SchoolName_Ref || '').includes(searchQuery) ||
        (i.LessonsLearned || '').includes(searchQuery) ||
        (i.Challenges || '').includes(searchQuery) ||
        (i.Title || '').includes(searchQuery)
      )
    : incidentsWithLessons

  return (
    <div>
      <h3 style={{ color: '#008752', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon iconName="LightBulb" />
        توثيق الدروس المستفادة من الاضطرابات
      </h3>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#e3f2fd', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1565c0' }}>{incidents.length}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>إجمالي الحوادث</div>
        </div>
        <div style={{ background: '#e8f5e9', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2e7d32' }}>{incidentsWithLessons.length}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>حوادث موثقة بدروس</div>
        </div>
        <div style={{ background: '#fff3e0', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ef6c00' }}>{drills.length}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>تمارين منفذة</div>
        </div>
        <div style={{ background: '#fce4ec', padding: 16, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#c2185b' }}>{popularWords.length}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>كلمات متكررة</div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <Stack horizontal tokens={{ childrenGap: 8 }} style={{ marginBottom: 16 }}>
        <DefaultButton 
          text="ملخص الدروس" 
          iconProps={{ iconName: 'BulletedList' }}
          primary={viewMode === 'summary'}
          onClick={() => setViewMode('summary')}
        />
        <DefaultButton 
          text={`الحوادث (${incidentsWithLessons.length})`}
          iconProps={{ iconName: 'Warning' }}
          primary={viewMode === 'incidents'}
          onClick={() => setViewMode('incidents')}
        />
        <DefaultButton 
          text={`التمارين (${drills.length})`}
          iconProps={{ iconName: 'Running' }}
          primary={viewMode === 'drills'}
          onClick={() => setViewMode('drills')}
        />
      </Stack>

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="card" style={{ padding: 20 }}>
          {/* Popular Words Cloud */}
          <h4 style={{ color: '#333', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon iconName="Tag" />
            أكثر الكلمات تكراراً في تقارير المدارس
          </h4>
          {popularWords.length > 0 ? (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 8, 
              marginBottom: 24,
              padding: 16,
              backgroundColor: '#f5f5f5',
              borderRadius: 8
            }}>
              {popularWords.map((item, idx) => (
                <span 
                  key={idx} 
                  style={{ 
                    backgroundColor: idx < 5 ? '#e3f2fd' : idx < 10 ? '#e8f5e9' : '#fff3e0',
                    color: idx < 5 ? '#1565c0' : idx < 10 ? '#2e7d32' : '#ef6c00',
                    padding: '6px 12px',
                    borderRadius: 16,
                    fontSize: Math.max(12, 18 - idx * 0.5),
                    fontWeight: idx < 5 ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {item.word}
                  <span style={{ 
                    backgroundColor: 'rgba(0,0,0,0.1)', 
                    padding: '2px 6px', 
                    borderRadius: 10,
                    fontSize: '0.75rem'
                  }}>
                    {item.count}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#666', backgroundColor: '#f5f5f5', borderRadius: 8 }}>
              لا توجد بيانات كافية للتحليل
            </div>
          )}

          {/* Categorized Lessons Summary */}
          <h4 style={{ color: '#333', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon iconName="GroupedList" />
            تصنيف الدروس المستفادة
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div style={{ backgroundColor: '#ffebee', padding: 16, borderRadius: 8, borderRight: '4px solid #d32f2f' }}>
              <div style={{ fontWeight: 600, color: '#d32f2f', marginBottom: 8 }}>🛡️ السلامة والإخلاء</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{categorizedLessons.safety.length}</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>درس مستفاد</div>
            </div>
            <div style={{ backgroundColor: '#e3f2fd', padding: 16, borderRadius: 8, borderRight: '4px solid #1565c0' }}>
              <div style={{ fontWeight: 600, color: '#1565c0', marginBottom: 8 }}>📞 التواصل والتنسيق</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{categorizedLessons.communication.length}</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>درس مستفاد</div>
            </div>
            <div style={{ backgroundColor: '#e8f5e9', padding: 16, borderRadius: 8, borderRight: '4px solid #2e7d32' }}>
              <div style={{ fontWeight: 600, color: '#2e7d32', marginBottom: 8 }}>📋 التدريب والاستعداد</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{categorizedLessons.preparation.length}</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>درس مستفاد</div>
            </div>
            <div style={{ backgroundColor: '#fff3e0', padding: 16, borderRadius: 8, borderRight: '4px solid #ef6c00' }}>
              <div style={{ fontWeight: 600, color: '#ef6c00', marginBottom: 8 }}>📝 دروس أخرى</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{categorizedLessons.other.length}</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>درس مستفاد</div>
            </div>
          </div>
        </div>
      )}

      {/* Incidents View */}
      {viewMode === 'incidents' && (
        <div className="card" style={{ padding: 20 }}>
          <SearchBox 
            placeholder="بحث في الدروس المستفادة..." 
            value={searchQuery}
            onChange={(_, v) => setSearchQuery(v || '')}
            styles={{ root: { marginBottom: 16, maxWidth: 400 } }}
          />
          
          {filteredIncidents.length > 0 ? (
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#008752', color: 'white', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>المدرسة</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>الحادث</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>التحديات</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>الدروس المستفادة</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>المقترحات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.slice(0, 50).map((incident, idx) => (
                    <tr key={incident.Id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 500 }}>
                        {incident.SchoolName_Ref || '-'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                        <div>{incident.Title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{incident.IncidentCategory}</div>
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '0.85rem', color: '#d32f2f' }}>
                        {incident.Challenges || '-'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '0.85rem', color: '#2e7d32' }}>
                        {incident.LessonsLearned || '-'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '0.85rem', color: '#1565c0' }}>
                        {incident.Suggestions || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredIncidents.length > 50 && (
                <div style={{ padding: 12, textAlign: 'center', color: '#666', backgroundColor: '#f5f5f5' }}>
                  عرض 50 من {filteredIncidents.length} - استخدم البحث لتصفية النتائج
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
              <Icon iconName="SearchIssue" style={{ fontSize: 48, marginBottom: 12, color: '#ccc' }} />
              <div>لا توجد حوادث موثقة بدروس مستفادة</div>
            </div>
          )}
        </div>
      )}

      {/* Drills View */}
      {viewMode === 'drills' && (
        <div className="card" style={{ padding: 20 }}>
          {drills.length > 0 ? (
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ef6c00', color: 'white', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>المدرسة</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>نوع التمرين</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>الفرضية</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>الفئة المستهدفة</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {drills.slice(0, 50).map((drill, idx) => (
                    <tr key={drill.Id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff8e1' : 'white' }}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', fontWeight: 500 }}>
                        {drill.SchoolName_Ref || '-'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2' }}>
                        {drill.Title}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', fontSize: '0.85rem' }}>
                        {drill.DrillHypothesis || '-'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', fontSize: '0.85rem' }}>
                        {drill.TargetGroup || '-'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', fontSize: '0.85rem' }}>
                        {drill.ExecutionDate ? new Date(drill.ExecutionDate).toLocaleDateString('ar-SA') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {drills.length > 50 && (
                <div style={{ padding: 12, textAlign: 'center', color: '#666', backgroundColor: '#fff8e1' }}>
                  عرض 50 من {drills.length} تمرين
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
              <Icon iconName="Running" style={{ fontSize: 48, marginBottom: 12, color: '#ccc' }} />
              <div>لا توجد تمارين مسجلة</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Damage Assessment Manager Component
interface DamageReport { id: number; incidentTitle: string; date: string; buildingDamage: string; equipmentDamage: string; dataLoss: string; estimatedCost: string; recoveryTime: string; status: string; notes: string }
const DamageAssessmentManager: React.FC<{ incidents: Incident[] }> = ({ incidents }) => {
  const [reports, setReports] = useState<DamageReport[]>(() => {
    const saved = localStorage.getItem('bc_damage_reports')
    return saved ? JSON.parse(saved) : []
  })
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<DamageReport | null>(null)
  const [form, setForm] = useState<Partial<DamageReport>>({ incidentTitle: '', date: '', buildingDamage: 'لا يوجد', equipmentDamage: 'لا يوجد', dataLoss: 'لا يوجد', estimatedCost: '', recoveryTime: '', status: 'قيد التقييم', notes: '' })

  const saveReports = (data: DamageReport[]) => {
    setReports(data)
    localStorage.setItem('bc_damage_reports', JSON.stringify(data))
  }

  const damageOptions = [{ key: 'لا يوجد', text: 'لا يوجد' }, { key: 'طفيف', text: 'طفيف' }, { key: 'متوسط', text: 'متوسط' }, { key: 'كبير', text: 'كبير' }, { key: 'كلي', text: 'كلي' }]
  const statusOptions = [{ key: 'قيد التقييم', text: 'قيد التقييم' }, { key: 'تم التقييم', text: 'تم التقييم' }, { key: 'قيد الإصلاح', text: 'قيد الإصلاح' }, { key: 'تم الإصلاح', text: 'تم الإصلاح' }]

  return (
    <div>
      <PrimaryButton text="إضافة تقرير تقييم" iconProps={{ iconName: 'Add' }} onClick={() => { setEditing(null); setForm({ incidentTitle: '', date: new Date().toISOString().split('T')[0], buildingDamage: 'لا يوجد', equipmentDamage: 'لا يوجد', dataLoss: 'لا يوجد', estimatedCost: '', recoveryTime: '', status: 'قيد التقييم', notes: '' }); setPanelOpen(true) }} style={{ marginBottom: 16 }} />
      <DetailsList
        items={reports}
        columns={[
          { key: 'incidentTitle', name: 'الحادث', fieldName: 'incidentTitle', minWidth: 120 },
          { key: 'date', name: 'التاريخ', fieldName: 'date', minWidth: 80 },
          { key: 'buildingDamage', name: 'أضرار المبنى', fieldName: 'buildingDamage', minWidth: 80 },
          { key: 'equipmentDamage', name: 'أضرار المعدات', fieldName: 'equipmentDamage', minWidth: 80 },
          { key: 'status', name: 'الحالة', fieldName: 'status', minWidth: 80 },
          { key: 'actions', name: '', minWidth: 100, onRender: (item: DamageReport) => (
            <Stack horizontal tokens={{ childrenGap: 4 }}>
              <DefaultButton text="تعديل" onClick={() => { setEditing(item); setForm(item); setPanelOpen(true) }} />
              <DefaultButton text="حذف" onClick={() => saveReports(reports.filter(r => r.id !== item.id))} />
            </Stack>
          )}
        ]}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
      />
      {reports.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>لا توجد تقارير تقييم أضرار</div>}
      
      <Panel isOpen={panelOpen} onDismiss={() => setPanelOpen(false)} headerText={editing ? 'تعديل تقرير' : 'إضافة تقرير تقييم أضرار'} type={PanelType.medium}>
        <Stack tokens={{ childrenGap: 12 }} style={{ padding: 16 }}>
          <Dropdown label="الحادث المرتبط" selectedKey={form.incidentTitle} options={incidents.map(i => ({ key: i.Title, text: i.Title }))} onChange={(_, opt) => setForm({ ...form, incidentTitle: opt?.key as string })} />
          <TextField label="أو أدخل عنوان الحادث" value={form.incidentTitle} onChange={(_, v) => setForm({ ...form, incidentTitle: v })} />
          <TextField label="التاريخ" type="date" value={form.date} onChange={(_, v) => setForm({ ...form, date: v })} />
          <Dropdown label="أضرار المبنى" selectedKey={form.buildingDamage} options={damageOptions} onChange={(_, opt) => setForm({ ...form, buildingDamage: opt?.key as string })} />
          <Dropdown label="أضرار المعدات والأجهزة" selectedKey={form.equipmentDamage} options={damageOptions} onChange={(_, opt) => setForm({ ...form, equipmentDamage: opt?.key as string })} />
          <Dropdown label="فقدان البيانات" selectedKey={form.dataLoss} options={damageOptions} onChange={(_, opt) => setForm({ ...form, dataLoss: opt?.key as string })} />
          <TextField label="التكلفة التقديرية" value={form.estimatedCost} onChange={(_, v) => setForm({ ...form, estimatedCost: v })} placeholder="ريال سعودي" />
          <TextField label="الوقت المتوقع للاستعادة" value={form.recoveryTime} onChange={(_, v) => setForm({ ...form, recoveryTime: v })} placeholder="مثال: 24 ساعة" />
          <Dropdown label="حالة التقييم" selectedKey={form.status} options={statusOptions} onChange={(_, opt) => setForm({ ...form, status: opt?.key as string })} />
          <TextField label="ملاحظات" multiline rows={3} value={form.notes} onChange={(_, v) => setForm({ ...form, notes: v })} />
          <PrimaryButton text="حفظ" onClick={() => { 
            if (form.incidentTitle) { 
              saveReports(editing ? reports.map(r => r.id === editing.id ? { ...form as DamageReport, id: editing.id } : r) : [...reports, { ...form as DamageReport, id: Date.now() }])
              setPanelOpen(false) 
            }
          }} disabled={!form.incidentTitle} />
        </Stack>
      </Panel>
    </div>
  )
}

export default AdminPanel
