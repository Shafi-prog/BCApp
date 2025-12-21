import React, { useState, useEffect } from 'react'
import {
  Stack, Text, Icon, PrimaryButton, DefaultButton, TextField, Dropdown,
  DetailsList, DetailsListLayoutMode, SelectionMode, IColumn, Panel, PanelType,
  MessageBar, MessageBarType, Spinner, Pivot, PivotItem, Toggle, DatePicker,
  IDropdownOption, Checkbox, ProgressIndicator, SearchBox, IconButton
} from '@fluentui/react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SharePointService, SchoolInfo, TeamMember, Drill, Incident, TrainingLog } from '../services/sharepointService'
import { AdminDataService } from '../services/adminDataService'
import { AnnouncementService, Announcement } from '../services/announcementService'
import { mutualOperationPlan, SchoolAlternatives } from '../data/mutualOperation'
import BCTasksDashboard from './BCTasksDashboard'
import DrilsManagement from './DrilsManagement'
import SupportingDocsSidebar from './SupportingDocsSidebar'
import BCDRChecklistComponent from './BCDRChecklist'
import { getColumnConfig, ColumnType, renderDate } from '../config/tableConfig'
import { sanitizeString, sanitizeHTML, isValidEmail, isValidSaudiPhone, isValidDate, formatSaudiPhone } from '../utils/security'

// Interfaces
// Admin Contacts - for admin's own contact list (not school teams)
// Based on BC_Plan_Content.txt official structure:
// - Internal: قائمة اتصال إدارة التعليم (م، الاسم، المنصب، رقم الجوال، البريد الإلكتروني)
// - External: قائمة جهات الاتصال الخارجية (نطاق التواصل، التوقيت، العضو الأساسي، العضو البديل)
interface AdminContact {
  id: number
  Title: string  // الاسم - matches SharePoint Title column
  role: string  // المنصب / الوظيفة
  email: string  // البريد الإلكتروني
  phone: string  // رقم الجوال
  organization: 'operations' | 'bc_team' | 'bc_team_backup' | 'civil_defense' | 'red_crescent' | 'police' | 'ambulance' | 'tatweer' | 'it_systems' | 'infosec' | 'external' | 'ministry'
  category: 'internal' | 'external'
  notes: string
  // External contact specific fields based on Word file structure
  contactScope?: string  // نطاق التواصل (شركة تطوير، الدفاع المدني، etc.)
  contactTiming?: string  // التوقيت (عند وجود اضطراب بحسب كل فرضية، عند الحريق، etc.)
  backupMember?: string  // العضو البديل
}

// BC Plan Document with attachment tracking
interface BCPlanDocument {
  id: number
  title: string
  documentType: 'policy' | 'plan' | 'procedure' | 'template' | 'report' | 'other'
  version: string
  uploadDate: string
  shareDate: string
  isShared: boolean
  fileName: string
  description: string
  notes: string
}

// Incident Evaluation - for monitoring and evaluation
interface IncidentEvaluation {
  id: number
  incidentId: number
  evaluationDate: string
  responseTimeMinutes: number | undefined
  recoveryTimeHours: number | undefined
  studentsReturnedDate: string
  alternativeUsed: string
  overallScore: number  // 1-5
  strengths: string
  weaknesses: string
  recommendations: string
  evaluatedBy: string
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

interface DRCheckItem {
  id: number
  category: string
  Title: string  // matches SharePoint Title column (checklist item description)
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
  // New fields for file upload and notes
  fileName?: string
  fileUploadDate?: string
  notes?: string
  publishHistory?: { date: string; version: string; notes: string }[]
  // Task 1 sub-tasks completion
  task1_1_complete?: boolean  // إعداد الخطة الأساسية
  task1_2_complete?: boolean  // السيناريوهات
  task1_3_complete?: boolean  // النشر
  task1_4_complete?: boolean  // التحديث الدوري
  reviewPeriodMonths?: number
  nextReviewDate?: string
}

// Task 7: Plan Review and Response Procedures
interface PlanReview {
  id: number
  // 7.1: مراجعة الخطط
  reviewFileName?: string
  reviewFileUploadDate?: string
  reviewDate?: string
  reviewNotes?: string
  reviewRecommendations?: string
  // 7.2: إجراءات الاستجابة
  response_scenario1?: string
  response_scenario2?: string
  response_scenario3?: string
  response_scenario4?: string
  response_scenario5?: string
  // 7.3: التوثيق والاعتماد
  proceduresFileName?: string
  proceduresFileUploadDate?: string
  approvalDate?: string
  approvedBy?: string
  // حالة الإكمال
  task7_1_complete?: boolean
  task7_2_complete?: boolean
  task7_3_complete?: boolean
  lastUpdated?: string
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // Get initial tab from URL parameter, default to 'tasks25'
  const initialTab = searchParams.get('tab') || 'tasks25'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: MessageBarType, text: string} | null>(null)
  
  // Data states
  const [schools, setSchools] = useState<SchoolInfo[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [drills, setDrills] = useState<Drill[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([])
  
  // Local storage states (for admin-only data not in SharePoint yet)
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [drChecklist, setDRChecklist] = useState<DRCheckItem[]>([])
  const [sharedBCPlan, setSharedBCPlan] = useState<SharedBCPlan | null>(null)
  const [planReview, setPlanReview] = useState<PlanReview | null>(null)  // Task 7
  
  // Admin-specific states
  const [adminContacts, setAdminContacts] = useState<AdminContact[]>([])
  const [bcPlanDocuments, setBCPlanDocuments] = useState<BCPlanDocument[]>([])
  const [incidentEvaluations, setIncidentEvaluations] = useState<IncidentEvaluation[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  
  // Panel states
  const [testPlanPanelOpen, setTestPlanPanelOpen] = useState(false)
  const [editingTestPlan, setEditingTestPlan] = useState<TestPlan | null>(null)
  const [contactPanelOpen, setContactPanelOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<AdminContact | null>(null)
  const [bcPlanPanelOpen, setBCPlanPanelOpen] = useState(false)
  const [editingBCPlan, setEditingBCPlan] = useState<BCPlanDocument | null>(null)
  const [evaluationPanelOpen, setEvaluationPanelOpen] = useState(false)
  const [editingEvaluation, setEditingEvaluation] = useState<IncidentEvaluation | null>(null)
  const [announcementPanelOpen, setAnnouncementPanelOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  // Scenario editing state
  const [scenarioPanelOpen, setScenarioPanelOpen] = useState(false)
  const [editingScenario, setEditingScenario] = useState<{ id: number; title: string; description: string; actions: string[] } | null>(null)
  // Supporting docs sidebar state
  const [supportingDocsSidebarOpen, setSupportingDocsSidebarOpen] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadAllData()
    loadLocalData()
  }, [])

  // Sync URL parameter with active tab
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [searchParams, activeTab])

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
      // Load DR checklist from SharePoint
      const drItems = await AdminDataService.getDRChecklist()
      if (drItems.length > 0) setDRChecklist(drItems)
      else initializeDRChecklist()
      
      // Load admin contacts from SharePoint
      const contacts = await AdminDataService.getAdminContacts()
      setAdminContacts(contacts)
      
      // Load BC Plan documents from SharePoint
      const planDocs = await AdminDataService.getBCPlanDocuments()
      setBCPlanDocuments(planDocs)
      
      // Load incident evaluations from SharePoint
      const evaluations = await AdminDataService.getIncidentEvaluations()
      setIncidentEvaluations(evaluations)
      
      // Load test plans from SharePoint
      try {
        const plans = await AdminDataService.getTestPlans()
        setTestPlans(plans)
      } catch (e) {
        console.error('Error loading test plans:', e)
      }
      
      // Load shared BC Plan from SharePoint
      const bcPlan = await AdminDataService.getSharedBCPlan()
      if (bcPlan) setSharedBCPlan(bcPlan)
      else initializeSharedBCPlan()
      
      // Load Plan Review (Task 7) from SharePoint
      const review = await AdminDataService.getPlanReview()
      if (review) setPlanReview(review)
      else initializePlanReview()
      
      // Load announcements
      const announcementsData = await AnnouncementService.getAnnouncements()
      setAnnouncements(announcementsData)
    } catch (e) {
      console.error('Error loading local data:', e)
      initializeDRChecklist()
    }
  }

  // Initialize Plan Review (Task 7)
  const initializePlanReview = async () => {
    const defaultReview: PlanReview = {
      id: 1,
      task7_1_complete: false,
      task7_2_complete: false,
      task7_3_complete: false,
      lastUpdated: new Date().toISOString()
    }
    setPlanReview(defaultReview)
    // Save to SharePoint (no localStorage for security compliance)
    try {
      await AdminDataService.savePlanReview(defaultReview)
    } catch (e) {
      console.error('Error saving default plan review to SharePoint:', e)
    }
  }

  // Save Plan Review
  const savePlanReview = async (data: PlanReview) => {
    try {
      // Auto-mark الجزء 7.3 مكتملًا عند اكتمال الحقول الرئيسية (اسم ملف الإجراءات + تاريخ الاعتماد + الجهة المعتمدة)
      const autoTask7_3_Complete = Boolean(
        data.proceduresFileName &&
        data.approvalDate &&
        data.approvedBy
      )

      const updated = {
        ...data,
        task7_3_complete: autoTask7_3_Complete || data.task7_3_complete,
        lastUpdated: new Date().toISOString(),
      }
      await AdminDataService.savePlanReview(updated)
      setPlanReview(updated)
      setMessage({ type: MessageBarType.success, text: 'تم حفظ بيانات المراجعة وإجراءات الاستجابة' })
    } catch (e) {
      console.error('Error saving plan review:', e)
      setMessage({ type: MessageBarType.error, text: 'حدث خطأ أثناء حفظ بيانات المراجعة' })
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
    // Save to SharePoint (no localStorage for security compliance)
    AdminDataService.saveSharedBCPlan(defaultPlan).catch(e => {
      console.error('Error saving default BC plan to SharePoint:', e)
    })
  }

  const saveSharedBCPlan = async (plan: SharedBCPlan) => {
    try {
      const updatedPlan = { ...plan, lastUpdated: new Date().toISOString() }
      await AdminDataService.saveSharedBCPlan(updatedPlan)
      setSharedBCPlan(updatedPlan)
      setMessage({ type: MessageBarType.success, text: plan.isPublished ? 'تم نشر الخطة للمدارس بنجاح' : 'تم حفظ الخطة' })
    } catch (e) {
      console.error('Error saving shared BC plan:', e)
      setMessage({ type: MessageBarType.error, text: 'حدث خطأ أثناء حفظ الخطة' })
    }
  }

  const initializeDRChecklist = async () => {
    const defaultChecklist: DRCheckItem[] = [
      { id: 1, category: 'البيانات', Title: 'النسخ الاحتياطي للبيانات', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 2, category: 'البيانات', Title: 'اختبار استعادة البيانات', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 3, category: 'الأنظمة', Title: 'منصة مدرستي', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 4, category: 'الأنظمة', Title: 'نظام نور', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 5, category: 'الأنظمة', Title: 'قنوات عين', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 6, category: 'الاتصالات', Title: 'قوائم الاتصال محدثة', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 7, category: 'الاتصالات', Title: 'وسائل التواصل البديلة', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 8, category: 'المواقع البديلة', Title: 'تحديد المدارس البديلة', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 9, category: 'المواقع البديلة', Title: 'اتفاقيات التشغيل المتبادل', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 10, category: 'الفرق', Title: 'تشكيل فريق استمرارية الأعمال', status: 'not_ready', lastChecked: '', notes: '' },
      { id: 11, category: 'الفرق', Title: 'تدريب الفرق على الخطة', status: 'not_ready', lastChecked: '', notes: '' },
    ]
    setDRChecklist(defaultChecklist)
    // Create initial checklist items in SharePoint when list is empty
    try {
      const createdItems: DRCheckItem[] = []
      for (const item of defaultChecklist) {
        const created = await AdminDataService.createDRCheckItem({
          Title: item.Title,
          category: item.category,
          status: item.status,
          lastChecked: '',
          notes: '',
        })
        createdItems.push(created)
      }
      setDRChecklist(createdItems)
      console.log('[AdminPanel] DR checklist initialized and saved to SharePoint')
    } catch (e) {
      console.error('[AdminPanel] Error initializing DR checklist in SharePoint:', e)
    }
  }

  const saveTestPlans = async (data: TestPlan[]) => {
    setTestPlans(data)
    // Save yearly test plans to BC_Test_Plans list via AdminDataService
    try {
      // Load existing plans from SharePoint
      const existing = await AdminDataService.getTestPlans()

      // Delete plans that were removed in the UI
      for (const oldPlan of existing) {
        if (!data.find(p => p.id === oldPlan.id)) {
          await AdminDataService.deleteTestPlan(oldPlan.id)
        }
      }

      // Create or update current plans
      for (const plan of data) {
        if (!plan.id || !existing.find(p => p.id === plan.id)) {
          // New plan
          await AdminDataService.createTestPlan({
            title: plan.title,
            hypothesis: plan.hypothesis,
            specificEvent: plan.specificEvent,
            targetGroup: plan.targetGroup,
            startDate: plan.startDate,
            endDate: plan.endDate,
            status: plan.status,
            responsible: plan.responsible,
            notes: plan.notes,
          })
        } else {
          // Existing plan – update
          await AdminDataService.updateTestPlan(plan.id, {
            title: plan.title,
            hypothesis: plan.hypothesis,
            specificEvent: plan.specificEvent,
            targetGroup: plan.targetGroup,
            startDate: plan.startDate,
            endDate: plan.endDate,
            status: plan.status,
            responsible: plan.responsible,
            notes: plan.notes,
          })
        }
      }

      // Refresh from SharePoint to keep IDs in sync
      const refreshed = await AdminDataService.getTestPlans()
      setTestPlans(refreshed)

      setMessage({ type: MessageBarType.success, text: 'تم حفظ خطة التمارين السنوية في قائمة BC_Test_Plans بنجاح' })
    } catch (e) {
      console.error('[AdminPanel] Error saving test plans to BC_Test_Plans:', e)
      setMessage({ type: MessageBarType.error, text: 'فشل حفظ خطة التمارين - يرجى المحاولة مرة أخرى' })
    }
  }

  const saveDRChecklist = (data: DRCheckItem[]) => {
    setDRChecklist(data)
  }

  // Save admin contacts - uses AdminDataService for individual operations
  const saveAdminContact = async (contact: AdminContact, isEdit: boolean) => {
    try {
      if (isEdit) {
        await AdminDataService.updateAdminContact(contact.id, contact)
      } else {
        await AdminDataService.createAdminContact(contact)
      }
      // Reload contacts from SharePoint
      const contacts = await AdminDataService.getAdminContacts()
      setAdminContacts(contacts)
      setMessage({ type: MessageBarType.success, text: isEdit ? 'تم تحديث جهة الاتصال بنجاح' : 'تم إضافة جهة الاتصال بنجاح' })
    } catch (e: any) {
      console.error('Error saving admin contact:', e)
      setMessage({ type: MessageBarType.error, text: 'فشل حفظ جهة الاتصال: ' + (e.message || 'خطأ غير معروف') })
    }
  }

  const deleteAdminContact = async (id: number) => {
    try {
      await AdminDataService.deleteAdminContact(id)
      const contacts = await AdminDataService.getAdminContacts()
      setAdminContacts(contacts)
      setMessage({ type: MessageBarType.success, text: 'تم حذف جهة الاتصال بنجاح' })
    } catch (e: any) {
      console.error('Error deleting admin contact:', e)
      setMessage({ type: MessageBarType.error, text: 'فشل حذف جهة الاتصال: ' + (e.message || 'خطأ غير معروف') })
    }
  }

  // Save BC Plan documents - uses AdminDataService for individual operations
  const saveBCPlanDocument = async (doc: BCPlanDocument, isEdit: boolean) => {
    try {
      if (isEdit) {
        await AdminDataService.updateBCPlanDocument(doc.id, doc)
      } else {
        await AdminDataService.createBCPlanDocument(doc)
      }
      // Reload documents from SharePoint
      const planDocs = await AdminDataService.getBCPlanDocuments()
      setBCPlanDocuments(planDocs)
      setMessage({ type: MessageBarType.success, text: isEdit ? 'تم تحديث المستند بنجاح' : 'تم إضافة المستند بنجاح' })
    } catch (e: any) {
      console.error('Error saving BC plan document:', e)
      setMessage({ type: MessageBarType.error, text: 'فشل حفظ المستند: ' + (e.message || 'خطأ غير معروف') })
    }
  }

  const deleteBCPlanDocument = async (id: number) => {
    try {
      await AdminDataService.deleteBCPlanDocument(id)
      const planDocs = await AdminDataService.getBCPlanDocuments()
      setBCPlanDocuments(planDocs)
      setMessage({ type: MessageBarType.success, text: 'تم حذف المستند بنجاح' })
    } catch (e: any) {
      console.error('Error deleting BC plan document:', e)
      setMessage({ type: MessageBarType.error, text: 'فشل حذف المستند: ' + (e.message || 'خطأ غير معروف') })
    }
  }

  // Save incident evaluations - uses AdminDataService for individual operations
  const saveIncidentEvaluation = async (evaluation: IncidentEvaluation, isEdit: boolean) => {
    try {
      if (isEdit) {
        await AdminDataService.updateIncidentEvaluation(evaluation.id, evaluation)
      } else {
        await AdminDataService.createIncidentEvaluation(evaluation)
      }
      // Reload evaluations from SharePoint
      const evaluations = await AdminDataService.getIncidentEvaluations()
      setIncidentEvaluations(evaluations)
      setMessage({ type: MessageBarType.success, text: isEdit ? 'تم تحديث التقييم بنجاح' : 'تم إضافة التقييم بنجاح' })
    } catch (e: any) {
      console.error('Error saving incident evaluation:', e)
      setMessage({ type: MessageBarType.error, text: 'فشل حفظ التقييم: ' + (e.message || 'خطأ غير معروف') })
    }
  }

  const deleteIncidentEvaluation = async (id: number) => {
    try {
      await AdminDataService.deleteIncidentEvaluation(id)
      const evaluations = await AdminDataService.getIncidentEvaluations()
      setIncidentEvaluations(evaluations)
      setMessage({ type: MessageBarType.success, text: 'تم حذف التقييم بنجاح' })
    } catch (e: any) {
      console.error('Error deleting incident evaluation:', e)
      setMessage({ type: MessageBarType.error, text: 'فشل حذف التقييم: ' + (e.message || 'خطأ غير معروف') })
    }
  }

  // Export data to JSON (all data now comes from SharePoint)
  const exportData = (type: string) => {
    let data: any
    let filename: string
    
    switch(type) {
      case 'schools': data = schools; filename = 'schools_data.json'; break
      case 'team': data = teamMembers; filename = 'team_members.json'; break
      case 'drills': data = drills; filename = 'drills_log.json'; break
      case 'incidents': data = incidents; filename = 'incidents_log.json'; break
      case 'training': data = trainingLogs; filename = 'training_log.json'; break
      case 'testplans': data = testPlans; filename = 'test_plans.json'; break
      case 'contacts': data = adminContacts; filename = 'admin_contacts.json'; break
      case 'evaluations': data = incidentEvaluations; filename = 'incident_evaluations.json'; break
      case 'all': 
        data = { schools, teamMembers, drills, incidents, trainingLogs, testPlans, drChecklist, adminContacts, bcPlanDocuments, incidentEvaluations }
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

  // Calculate Task 1 completion (all 4 sub-tasks)
  const task1Complete = Boolean(
    sharedBCPlan?.fileName && // 1.1: ملف الخطة
    sharedBCPlan?.scenarios?.length >= 5 && // 1.2: السيناريوهات
    sharedBCPlan?.isPublished && // 1.3: النشر
    sharedBCPlan?.publishHistory && sharedBCPlan.publishHistory.length > 0 // 1.4: سجل التحديث
  )

  // Calculate Task 7 completion (all 3 sub-tasks)
  const task7Complete = Boolean(
    planReview?.task7_1_complete && // 7.1: مراجعة الخطط
    planReview?.task7_2_complete && // 7.2: إجراءات الاستجابة
    planReview?.task7_3_complete   // 7.3: التوثيق والاعتماد
  )

  // BC Duties checklist - 25 مهمة كاملة من متابعة إنجاز مهام الوحدة
  // مهام وحدة الطوارئ واستمرارية الأعمال - إدارة التعليم بمنطقة المدينة المنورة
  
  // حساب التمارين مع التقييمات
  const drillsWithRatings = drills.filter(d => d.PlanEffectivenessRating || d.ProceduresEffectivenessRating)
  
  // المهمة 2: إعداد خطة التمارين - تكتمل عندما يوجد 4 تمارين في الخطة السنوية
  const task2Complete = testPlans.length >= 4
  
  // المهمة 16: تقييم فعالية الخطة - تكتمل عندما توجد تقييمات من المدارس
  const task16Complete = drillsWithRatings.length > 0
  
  // المهمة 22: تنفيذ اختبار الفريق للخطة - تكتمل عندما تنفذ المدارس تمارين
  const task22Complete = drills.length > 0
  
  // المهام المترابطة: 2 و 16 و 22
  const linkedTasks_2_16_22 = [2, 16, 22]
  
  // المهام المترابطة: 1 و 21
  const linkedTasks_1_21 = [1, 21]
  
  const bcDuties = [
    // ===== مهام إدارة التعليم العامة (1-14) =====
    // 1. إعداد خطط الطوارئ ومراجعتها وتحديثها دورياً - مرتبطة بالمهمة 21
    { id: 1, title: 'إعداد خطط الطوارئ على مستوى إدارة التعليم العامة وقطاعاتها التابعة، ومراجعتها وتحديثها دورياً', done: task1Complete, tab: 'bcplan', category: 'planning', linkedWith: 21 },
    // 2. إعداد خطة تنفيذ التمارين الفرضية - مرتبطة بالمهام 16 و 22
    { id: 2, title: `إعداد خطة تنفيذ التمارين الفرضية لإدارة التعليم العامة وقطاعاتها التابعة، ومتابعة تنفيذها، والرفع بالتقارير عنها (${testPlans.length}/4 تمارين)`, done: task2Complete, tab: 'testplans', category: 'drills', linkedWith: [16, 22] },
    // 3. متابعة تطبيق معايير ومستويات إدارة الحالة الطارئة
    { id: 3, title: 'متابعة تطبيق معايير ومستويات إدارة الحالة الطارئة وتصعيدها وخفضها ونماذج الرصد والمراقبة والإنذار والتحذير للحالة الطارئة، بالتنسيق مع القطاعات ذات العلاقة', done: incidentEvaluations.length > 0, tab: 'monitoring', category: 'monitoring' },
    // 4. متابعة برامج وحلول معالجة مخاطر الانقطاع
    { id: 4, title: 'متابعة تطبيق برامج وحلول معالجة مخاطر الانقطاع أو التعطل ذات الصلة بتقديم الخدمات الأساسية لإدارة التعليم العامة وقطاعاتها التابعة لضمان استمرارية الأعمال', done: stats.drReadiness > 0, tab: 'dr', category: 'dr' },
    // 5. مراقبة أوقات التعافي المستهدفة
    { id: 5, title: 'مراقبة أوقات التعافي المستهدفة والفترات الزمنية القصوى المقبولة للانقطاع والحد الأدنى من أهداف استمرارية الأعمال للأنشطة التي تعتمد على البيانات، والتأكد من الالتزام بها ونقاط الاسترجاع المستهدفة', done: incidentEvaluations.filter(e => e.recoveryTimeHours).length > 0, tab: 'monitoring', category: 'dr' },
    // 6. مراقبة وتقييم إجراءات الاستجابة
    { id: 6, title: 'مراقبة وتقييم إجراءات وعمليات الاستجابة للحالة الطارئة والتعافي منها وإجراءات استمرارية الأعمال، وتوثيق الدروس المستفادة منها، والحلول المقترحة لمعالجتها، وإبلاغها للقطاعات والجهات ذات العلاقة', done: incidents.filter(i => i.LessonsLearned).length > 0, tab: 'monitoring', category: 'evaluation' },
    // 7. تقييم الموارد والإمكانات والقدرات
    { id: 7, title: 'تقييم الموارد والإمكانات والقدرات الحالية لإدارة التعليم العامة وقطاعاتها التابعة للاستعداد للحالات الطارئة والاستجابة لها والتعافي منها، واقتراح القدرات اللازمة، والرفع لها للاعتماد', done: adminContacts.filter(c => c.organization === 'bc_team').length > 0, tab: 'contacts', category: 'resources' },
    // 8. التنسيق لإعداد خطط التدريب
    { id: 8, title: 'التنسيق مع القطاعات ذات العلاقة لإعداد وتطوير خطط وبرامج التدريب والتأهيل والتوعية والتثقيف والتواصل الخاصة ضمن مجال اختصاصها، وتقديم الدعم لتنفيذها', done: trainingLogs.length > 0, tab: 'stats', category: 'training' },
    // 9. متابعة تطبيق السياسات والبرامج
    { id: 9, title: 'متابعة تطبيق السياسات والبرامج والخطط والمنهجيات والأدلة والنماذج المعتمدة ذات الصلة بالطوارئ والأزمات والكوارث واستمرارية الأعمال، بالتنسيق مع القطاعات ذات العلاقة', done: bcPlanDocuments.filter(d => d.documentType === 'policy').length > 0, tab: 'bcplans', category: 'policies' },
    // 10. المشاركة في إدارة المخاطر والطوارئ
    { id: 10, title: 'المشاركة في إدارة المخاطر والطوارئ واستمرارية الأعمال ضمن تنفيذ استراتيجية إدارة التعليم العامة وقطاعاتها على مستوى الاختصاص، بالتنسيق مع القطاعات ذات العلاقة', done: incidentEvaluations.length > 0 && bcPlanDocuments.length > 0, tab: 'monitoring', category: 'risks' },
    // 11. متابعة مؤشرات الأداء الرئيسة
    { id: 11, title: 'متابعة مؤشرات الأداء الرئيسة ضمن اختصاص إدارة التعليم العامة في الطوارئ واستمرارية الأعمال، والتأكد من الالتزام بها، ورفع التقارير بذلك بالتنسيق مع القطاعات والجهات ذات العلاقة', done: incidentEvaluations.length > 0 && schools.length > 0, tab: 'monitoring', category: 'kpi' },
    // 12. متابعة معايير ومؤشرات الجاهزية
    { id: 12, title: 'متابعة معايير ومؤشرات الجاهزية الخاصة بالطوارئ واستمرارية الأعمال لإدارة التعليم العامة وقطاعاتها، ومراقبتها، وإعداد تقارير الجاهزية على مستوى إدارة التعليم العامة بالتنسيق مع القطاعات ذات العلاقة', done: stats.drReadiness > 50, tab: 'dr', category: 'readiness' },
    // 13. متابعة معايير تفعيل خطط الطوارئ
    { id: 13, title: 'متابعة تطبيق معايير وإجراءات تفعيل خطط الطوارئ واستمرارية الأعمال والخطط ذات العلاقة، والانتقال من مرحلة الاستجابة إلى مرحلة التعافي، بالتنسيق مع القطاعات ذات العلاقة', done: incidentEvaluations.filter(e => e.studentsReturnedDate).length > 0, tab: 'monitoring', category: 'recovery' },
    // 14. تمثيل إدارة التعليم في الاستراتيجيات الوطنية
    { id: 14, title: 'تمثيل إدارة التعليم العامة في الاستراتيجيات الوطنية للطوارئ والكوارث والأزمات واستمرارية الأعمال', done: adminContacts.filter(c => c.organization === 'ministry').length > 0, tab: 'contacts', category: 'representation' },
    
    // ===== مهام استمرارية الأعمال (15-25) =====
    // 15. جمع وتحليل البيانات وإدارة خطة استمرارية الأعمال
    { id: 15, title: 'جمع وتحليل البيانات وإدارة خطة استمرارية الأعمال ومراجعة الإجراءات والسياسات والخطط المرتبطة بها', done: schools.length > 0 && bcPlanDocuments.length > 0, tab: 'bcplans', category: 'planning' },
    // 16. إعداد خطة سنوية للاختبارات (تقييم فعالية الخطة) - مرتبطة بالمهام 2 و 22
    { id: 16, title: `إعداد خطة سنوية للاختبارات، بالتنسيق مع الأطراف المعنية بالخطة لتقييم مدى فعالية الخطة والإجراءات المرتبطة بها (${drillsWithRatings.length} تقييم من المدارس)`, done: task16Complete, tab: 'testplans', category: 'drills', linkedWith: [2, 22] },
    // 17. تحديد فرق العمل المعنية
    { id: 17, title: 'تحديد فرق العمل المعنية بحسب طبيعة الاضطراب لتنفيذ خطة استمرارية الأعمال', done: teamMembers.length > 0, tab: 'contacts', category: 'teams' },
    // 18. مراجعة وتحديث بيانات التواصل وبيانات الأصول
    { id: 18, title: 'مراجعة وتحديث بيانات التواصل وبيانات الأصول، ومراجعة مدى جاهزية مركز البيانات الاحتياطي (DR) وآليات وإجراءات النسخ الاحتياطي مع الأطراف المعنية (داخلياً أو خارجياً)', done: adminContacts.length > 0 && stats.drReadiness > 0, tab: 'dr', category: 'dr' },
    // 19. التأكد من وعي الموظفين
    { id: 19, title: 'التأكد من وعي ومعرفة كافة الموظفين وفرق العمل بخطة استمرارية الأعمال وإجراءاتها', done: trainingLogs.filter(t => t.RegistrationType === 'توعية').length > 0, tab: 'stats', category: 'awareness' },
    // 20. الالتزام بتطبيق سياسات استمرارية الأعمال
    { id: 20, title: 'الالتزام بتطبيق سياسات استمرارية الأعمال أثناء تنفيذ خطط استمرارية الأعمال', done: bcPlanDocuments.filter(d => d.documentType === 'policy').length > 0, tab: 'bcplans', category: 'policies' },
    // 21. المشاركة في مراجعة خطط العمل - مرتبطة بالمهمة 1
    { id: 21, title: 'المشاركة في مراجعة خطط العمل ووضع إجراءات فعالة للاستجابة للاضطرابات', done: task7Complete, tab: 'bcplan', category: 'risks', linkedWith: 1 },
    // 22. تنفيذ اختبار الفريق للخطة - مرتبطة بالمهام 2 و 16
    { id: 22, title: `تنفيذ اختبار الفريق للخطة ورفع تقرير بالنتائج لفريق استمرارية الأعمال (${drills.length} تمرين منفذ)`, done: task22Complete, tab: 'testplans', category: 'drills', linkedWith: [2, 16] },
    // 23. الاحتفاظ بقائمة الأصول الهامة
    { id: 23, title: 'الاحتفاظ بقائمة الأصول الهامة بالتنسيق مع فريق استمرارية الأعمال', done: schools.length > 0, tab: 'stats', category: 'assets' },
    // 24. توفير المعلومات للدفاع المدني
    { id: 24, title: 'توفير المعلومات والمخططات الخاصة بالمدارس لتقديمها إلى الجهات المختصة (الدفاع المدني) كلما دعت الحاجة لذلك', done: adminContacts.filter(c => c.organization === 'civil_defense').length > 0, tab: 'contacts', category: 'assets' },
    // 25. التنسيق للتأكد من جاهزية DR
    { id: 25, title: 'التنسيق مع الأطراف المعنية للتأكد من مدى جاهزية مركز البيانات الاحتياطي (DR)', done: stats.drReadiness > 0, tab: 'dr', category: 'dr' },
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

      <Pivot selectedKey={activeTab} onLinkClick={(item) => {
        const newTab = item?.props.itemKey || 'tasks25'
        setActiveTab(newTab)
        setSearchParams({ tab: newTab })
      }}>
        {/* Tab 1: BC Tasks Dashboard - 25 Tasks (Main Dashboard) */}
        <PivotItem headerText="لوحة المهام الـ25" itemKey="tasks25" itemIcon="ViewDashboard">
          <BCTasksDashboard
            schools={schools}
            teamMembers={teamMembers}
            drills={drills}
            incidents={incidents}
            trainingLogs={trainingLogs}
            testPlans={testPlans}
            adminContacts={adminContacts}
            bcPlanDocuments={bcPlanDocuments}
            incidentEvaluations={incidentEvaluations}
            drChecklist={drChecklist}
            sharedBCPlan={sharedBCPlan}
            planReview={planReview}
          />
        </PivotItem>

        {/* Tab 2: Statistics */}
        <PivotItem headerText="إحصائيات شاملة" itemKey="stats" itemIcon="BarChartVertical">
          <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { title: 'إجمالي المدارس', value: stats.totalSchools, icon: 'Org', color: '#008752', navigate: 'home', tooltip: 'عرض قائمة المدارس' },
                { title: 'مدارس لديها فرق', value: stats.schoolsWithTeams, icon: 'Group', color: '#0078d4', navigate: 'team', tooltip: 'عرض فرق الأمن والسلامة' },
                { title: 'مدارس نفذت تمارين', value: stats.schoolsWithDrills, icon: 'CheckList', color: '#107c10', navigate: 'drills', tooltip: 'عرض سجل التمارين' },
                { title: 'مدارس لديها تدريبات', value: stats.schoolsWithTraining, icon: 'ReadingMode', color: '#5c2d91', navigate: 'training', tooltip: 'عرض سجل التدريبات' },
                { title: 'أعضاء الفرق', value: stats.totalTeamMembers, icon: 'People', color: '#0078d4', navigate: 'team', tooltip: 'عرض أعضاء الفرق' },
                { title: 'التمارين المنفذة', value: stats.totalDrills, icon: 'CheckList', color: '#107c10', navigate: 'drills', tooltip: 'عرض التمارين المنفذة' },
                { title: 'الحوادث المسجلة', value: stats.totalIncidents, icon: 'Warning', color: '#d83b01', navigate: 'incidents', tooltip: 'عرض سجل الحوادث' },
                { title: 'الحوادث النشطة', value: stats.activeIncidents, icon: 'ShieldAlert', color: stats.activeIncidents > 0 ? '#d83b01' : '#107c10', navigate: 'incidents', tooltip: 'عرض الحوادث النشطة' },
                { title: 'جاهزية DR', value: `${stats.drReadiness}%`, icon: 'CloudUpload', color: stats.drReadiness >= 70 ? '#107c10' : '#ffb900', navigate: 'dr', tooltip: 'عرض قائمة جاهزية DR' },
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className="card" 
                  style={{ 
                    padding: 20, 
                    textAlign: 'center', 
                    borderTop: `4px solid ${stat.color}`,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onClick={() => {
                    // Navigate to the appropriate tab or page
                    if (['team', 'drills', 'training', 'incidents', 'home'].includes(stat.navigate)) {
                      // These are main navigation items - emit event for Navigation.tsx
                      window.dispatchEvent(new CustomEvent('navigate', { detail: stat.navigate }))
                    } else {
                      // Internal admin tabs
                      setActiveTab(stat.navigate)
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = ''
                  }}
                  title={stat.tooltip}
                >
                  <Icon iconName={stat.icon} style={{ fontSize: 28, color: stat.color, marginBottom: 8 }} />
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ color: '#666' }}>{stat.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 4 }}>
                    <Icon iconName="Forward" style={{ fontSize: 10, marginLeft: 4 }} />
                    {stat.tooltip}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PivotItem>

        {/* Tab 1.5: BC Plan Sharing - Task 1 & Task 7 */}
        <PivotItem headerText="المهمة 1 و 7: الخطط والاستجابة" itemKey="bcplan" itemIcon="Share">
          <div style={{ padding: '20px 0' }}>
            {/* Task Status Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="card" style={{ padding: 16, borderTop: `4px solid ${task1Complete ? '#107c10' : '#ffb900'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon iconName={task1Complete ? 'CheckMark' : 'Clock'} style={{ fontSize: 32, color: task1Complete ? '#107c10' : '#ffb900' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>المهمة 1: إعداد خطط الطوارئ</div>
                    <div style={{ color: task1Complete ? '#107c10' : '#835c00', fontSize: '0.9rem' }}>
                      {task1Complete ? '✅ مكتمل' : '⏳ قيد العمل'}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: sharedBCPlan?.fileName ? '#e8f5e9' : '#fff3e0', color: sharedBCPlan?.fileName ? '#2e7d32' : '#ef6c00', fontSize: 11 }}>1.1 الخطة {sharedBCPlan?.fileName ? '✓' : '○'}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: (sharedBCPlan?.scenarios?.length || 0) >= 5 ? '#e8f5e9' : '#fff3e0', color: (sharedBCPlan?.scenarios?.length || 0) >= 5 ? '#2e7d32' : '#ef6c00', fontSize: 11 }}>1.2 السيناريوهات {(sharedBCPlan?.scenarios?.length || 0) >= 5 ? '✓' : '○'}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: sharedBCPlan?.isPublished ? '#e8f5e9' : '#fff3e0', color: sharedBCPlan?.isPublished ? '#2e7d32' : '#ef6c00', fontSize: 11 }}>1.3 النشر {sharedBCPlan?.isPublished ? '✓' : '○'}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: (sharedBCPlan?.publishHistory?.length || 0) > 0 ? '#e8f5e9' : '#fff3e0', color: (sharedBCPlan?.publishHistory?.length || 0) > 0 ? '#2e7d32' : '#ef6c00', fontSize: 11 }}>1.4 سجل التحديث {(sharedBCPlan?.publishHistory?.length || 0) > 0 ? '✓' : '○'}</span>
                </div>
              </div>
              <div className="card" style={{ padding: 16, borderTop: `4px solid ${task7Complete ? '#107c10' : '#ffb900'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon iconName={task7Complete ? 'CheckMark' : 'Clock'} style={{ fontSize: 32, color: task7Complete ? '#107c10' : '#ffb900' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>المهمة 7: مراجعة الخطط والاستجابة</div>
                    <div style={{ color: task7Complete ? '#107c10' : '#835c00', fontSize: '0.9rem' }}>
                      {task7Complete ? '✅ مكتمل' : '⏳ قيد العمل'} <span style={{ color: '#666', fontSize: '0.8rem' }}>(مرتبط بالمهمة 1)</span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: planReview?.task7_1_complete ? '#e8f5e9' : '#fff3e0', color: planReview?.task7_1_complete ? '#2e7d32' : '#ef6c00', fontSize: 11 }}>7.1 المراجعة {planReview?.task7_1_complete ? '✓' : '○'}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: planReview?.task7_2_complete ? '#e8f5e9' : '#fff3e0', color: planReview?.task7_2_complete ? '#2e7d32' : '#ef6c00', fontSize: 11 }}>7.2 الإجراءات {planReview?.task7_2_complete ? '✓' : '○'}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: planReview?.task7_3_complete ? '#e8f5e9' : '#fff3e0', color: planReview?.task7_3_complete ? '#2e7d32' : '#ef6c00', fontSize: 11 }}>7.3 التوثيق {planReview?.task7_3_complete ? '✓' : '○'}</span>
                </div>
              </div>
            </div>

            {/* Task 1: BC Plan */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ color: '#008752', margin: 0 }}>
                  <Icon iconName="ClipboardList" style={{ marginLeft: 8 }} />
                  المهمة 1: خطة استمرارية العملية التعليمية
                </h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <PrimaryButton
                    text="📄 عرض خطة الاستمرارية (كما تراها المدارس)"
                    iconProps={{ iconName: 'DocumentSet' }}
                    onClick={() => setSupportingDocsSidebarOpen(true)}
                    styles={{ 
                      root: { 
                        fontSize: 14,
                        backgroundColor: '#0078d4',
                        borderColor: '#0078d4',
                        fontWeight: 600
                      },
                      rootHovered: {
                        backgroundColor: '#106ebe',
                        borderColor: '#106ebe'
                      }
                    }}
                  />
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

              {/* 1.1: File Upload Section */}
              <div style={{ backgroundColor: '#e3f2fd', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #90caf9' }}>
                <h4 style={{ color: '#1565c0', margin: '0 0 12px 0' }}>
                  <Icon iconName="Attach" style={{ marginLeft: 8 }} />
                  الجزء 1.1: ملف الخطة
                </h4>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    id="bcPlanFile"
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && sharedBCPlan) {
                        setSharedBCPlan({
                          ...sharedBCPlan,
                          fileName: file.name,
                          fileUploadDate: new Date().toISOString()
                        })
                        setMessage({ type: MessageBarType.success, text: `تم رفع الملف: ${file.name}` })
                      }
                    }}
                  />
                  <DefaultButton
                    text="رفع ملف الخطة"
                    iconProps={{ iconName: 'Upload' }}
                    onClick={() => document.getElementById('bcPlanFile')?.click()}
                  />
                  {sharedBCPlan?.fileName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#e8f5e9', padding: '6px 12px', borderRadius: 6 }}>
                      <Icon iconName="Document" style={{ color: '#2e7d32' }} />
                      <span style={{ color: '#2e7d32', fontWeight: 500 }}>{sharedBCPlan.fileName}</span>
                      <span style={{ color: '#666', fontSize: '0.8rem' }}>
                        (رُفع: {sharedBCPlan.fileUploadDate ? new Date(sharedBCPlan.fileUploadDate).toLocaleDateString('ar-SA') : '-'})
                      </span>
                      <IconButton
                        iconProps={{ iconName: 'Cancel' }}
                        title="حذف الملف"
                        onClick={() => sharedBCPlan && setSharedBCPlan({ ...sharedBCPlan, fileName: undefined, fileUploadDate: undefined })}
                        styles={{ root: { color: '#d32f2f', height: 24, width: 24 } }}
                      />
                    </div>
                  )}
                </div>
                <p style={{ color: '#666', fontSize: '0.8rem', margin: '8px 0 0 0' }}>
                  💡 رفع الملف للأرشفة فقط - المحتوى المنشور للمدارس هو ما تكتبه أدناه
                </p>
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
                {(sharedBCPlan?.scenarios || []).map((scenario, idx) => (
                  <div key={scenario.id} style={{ padding: 12, backgroundColor: '#f3f2f1', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: '#008752' }}>{idx + 1}. {scenario.title}</strong>
                        <p style={{ margin: '8px 0', color: '#605e5c', fontSize: 13 }}>{scenario.description}</p>
                        <div style={{ fontSize: 12, color: '#323130' }}>
                          <strong>الإجراءات:</strong> {(scenario.actions || []).join(' ← ')}
                        </div>
                      </div>
                      <IconButton
                        iconProps={{ iconName: 'Edit' }}
                        title="تعديل السيناريو"
                        onClick={() => {
                          setEditingScenario({ ...scenario })
                          setScenarioPanelOpen(true)
                        }}
                        styles={{ root: { color: '#0078d4' } }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Scenario Edit Panel */}
              <Panel
                isOpen={scenarioPanelOpen}
                onDismiss={() => { setScenarioPanelOpen(false); setEditingScenario(null) }}
                headerText="تعديل السيناريو"
                type={PanelType.medium}
              >
                {editingScenario && (
                  <Stack tokens={{ childrenGap: 16 }} style={{ padding: 20 }}>
                    <TextField
                      label="📝 عنوان السيناريو"
                      value={editingScenario.title}
                      onChange={(_, v) => setEditingScenario({ ...editingScenario, title: v || '' })}
                      required
                    />
                    <TextField
                      label="📋 وصف السيناريو"
                      multiline
                      rows={3}
                      value={editingScenario.description}
                      onChange={(_, v) => setEditingScenario({ ...editingScenario, description: v || '' })}
                      required
                    />
                    <TextField
                      label="⚡ الإجراءات (كل إجراء في سطر جديد)"
                      multiline
                      rows={5}
                      value={editingScenario.actions.join('\n')}
                      onChange={(_, v) => setEditingScenario({ ...editingScenario, actions: v ? v.split('\n').map(a => a.trim()).filter(a => a) : [] })}
                      placeholder="مثال:
التواصل مع إدارة التعليم
تفعيل المدرسة البديلة
التحول للتعليم عن بعد"
                      required
                    />
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                      <DefaultButton text="إلغاء" onClick={() => { setScenarioPanelOpen(false); setEditingScenario(null) }} />
                      <PrimaryButton 
                        text="حفظ التعديلات" 
                        onClick={() => {
                          if (sharedBCPlan && editingScenario) {
                            const updatedScenarios = sharedBCPlan.scenarios.map(s => 
                              s.id === editingScenario.id ? editingScenario : s
                            )
                            setSharedBCPlan({ ...sharedBCPlan, scenarios: updatedScenarios })
                            setMessage({ type: MessageBarType.success, text: `تم تحديث السيناريو: ${editingScenario.title}` })
                            setScenarioPanelOpen(false)
                            setEditingScenario(null)
                          }
                        }}
                        styles={{ root: { backgroundColor: '#008752' } }}
                      />
                    </div>
                  </Stack>
                )}
              </Panel>

              {/* Admin Notes */}
              <TextField 
                label="ملاحظات الأدمن على الخطة الحالية"
                multiline rows={2}
                placeholder="أضف ملاحظاتك هنا (لن تظهر للمدارس)..."
                value={sharedBCPlan?.notes || ''}
                onChange={(_, v) => sharedBCPlan && setSharedBCPlan({ ...sharedBCPlan, notes: v || '' })}
                styles={{ root: { marginBottom: 16 } }}
              />
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <DefaultButton 
                  text="حفظ كمسودة" 
                  iconProps={{ iconName: 'Save' }}
                  onClick={() => sharedBCPlan && saveSharedBCPlan({ ...sharedBCPlan, isPublished: false })}
                />
                <PrimaryButton 
                  text={sharedBCPlan?.isPublished ? 'تحديث ونشر للمدارس' : 'نشر للمدارس'} 
                  iconProps={{ iconName: 'Share' }}
                  onClick={() => {
                    if (sharedBCPlan) {
                      const newHistory = sharedBCPlan.publishHistory || []
                      newHistory.push({
                        date: new Date().toISOString(),
                        version: `v${newHistory.length + 1}.0`,
                        notes: sharedBCPlan.notes || ''
                      })
                      saveSharedBCPlan({ ...sharedBCPlan, isPublished: true, publishHistory: newHistory })
                    }
                  }}
                  styles={{ root: { backgroundColor: '#008752' } }}
                />
              </div>
              
              {sharedBCPlan?.isPublished && (
                <MessageBar messageBarType={MessageBarType.success} styles={{ root: { marginTop: 16 } }}>
                  ✅ الخطة منشورة ومتاحة للمدارس - آخر تحديث: {new Date(sharedBCPlan.lastUpdated).toLocaleString('ar-SA')}
                </MessageBar>
              )}

              {/* Publish History */}
              {sharedBCPlan?.publishHistory && sharedBCPlan.publishHistory.length > 0 && (
                <div style={{ marginTop: 20, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                  <h4 style={{ color: '#323130', margin: '0 0 12px 0' }}>
                    <Icon iconName="History" style={{ marginLeft: 8 }} />
                    سجل النشر (الجزء 1.4)
                  </h4>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(sharedBCPlan.publishHistory || []).slice().reverse().map((h, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8, backgroundColor: '#fff', borderRadius: 6, fontSize: '0.85rem' }}>
                        <span style={{ backgroundColor: '#e3f2fd', padding: '2px 8px', borderRadius: 4, color: '#1565c0', fontWeight: 600 }}>{h.version}</span>
                        <span style={{ color: '#666' }}>{new Date(h.date).toLocaleString('ar-SA')}</span>
                        {h.notes && <span style={{ color: '#333' }}>- {h.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Task 7: Plan Review and Response Procedures */}
            <div className="card" style={{ padding: 20, marginBottom: 20, borderTop: '4px solid #5c2d91' }}>
              <h3 style={{ color: '#5c2d91', marginBottom: 16 }}>
                <Icon iconName="ReviewSolid" style={{ marginLeft: 8 }} />
                المهمة 7: مراجعة الخطط وإجراءات الاستجابة
              </h3>
              <p style={{ color: '#666', marginBottom: 20, fontSize: '0.9rem' }}>
                المشاركة في مراجعة خطط العمل ووضع إجراءات فعالة للاستجابة للاضطرابات (مرتبطة بالمهمة 1)
              </p>

              {/* 7.1: Plan Review */}
              <div style={{ backgroundColor: '#f3e5f5', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #ce93d8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ color: '#7b1fa2', margin: 0 }}>
                    <Icon iconName="DocumentSearch" style={{ marginLeft: 8 }} />
                    الجزء 7.1: مراجعة خطط العمل
                  </h4>
                  <Checkbox 
                    label="مكتمل" 
                    checked={planReview?.task7_1_complete || false}
                    onChange={(_, checked) => planReview && savePlanReview({ ...planReview, task7_1_complete: checked || false })}
                    styles={{ checkbox: { backgroundColor: planReview?.task7_1_complete ? '#7b1fa2' : undefined } }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                  <input
                    type="file"
                    id="reviewFile"
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && planReview) {
                        savePlanReview({
                          ...planReview,
                          reviewFileName: file.name,
                          reviewFileUploadDate: new Date().toISOString()
                        })
                      }
                    }}
                  />
                  <DefaultButton
                    text="رفع ملف المراجعة"
                    iconProps={{ iconName: 'Upload' }}
                    onClick={() => document.getElementById('reviewFile')?.click()}
                  />
                  {planReview?.reviewFileName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#e8f5e9', padding: '6px 12px', borderRadius: 6 }}>
                      <Icon iconName="Document" style={{ color: '#2e7d32' }} />
                      <span style={{ color: '#2e7d32', fontWeight: 500 }}>{planReview.reviewFileName}</span>
                      <span style={{ color: '#666', fontSize: '0.8rem' }}>
                        (رُفع: {planReview.reviewFileUploadDate ? new Date(planReview.reviewFileUploadDate).toLocaleDateString('ar-SA') : '-'})
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <DatePicker
                    label="تاريخ المراجعة"
                    value={planReview?.reviewDate ? new Date(planReview.reviewDate) : undefined}
                    onSelectDate={(date) => planReview && date && savePlanReview({ ...planReview, reviewDate: date.toISOString() })}
                    placeholder="اختر التاريخ"
                  />
                  <TextField
                    label="ملاحظات المراجعة"
                    value={planReview?.reviewNotes || ''}
                    onChange={(_, v) => planReview && setPlanReview({ ...planReview, reviewNotes: v || '' })}
                  />
                </div>
                <TextField
                  label="التوصيات الناتجة عن المراجعة"
                  multiline rows={2}
                  value={planReview?.reviewRecommendations || ''}
                  onChange={(_, v) => planReview && setPlanReview({ ...planReview, reviewRecommendations: v || '' })}
                  styles={{ root: { marginTop: 12 } }}
                />
              </div>

              {/* 7.2: Response Procedures */}
              <div style={{ backgroundColor: '#fff3e0', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #ffcc80' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ color: '#ef6c00', margin: 0 }}>
                    <Icon iconName="CheckList" style={{ marginLeft: 8 }} />
                    الجزء 7.2: إجراءات الاستجابة للاضطرابات
                  </h4>
                  <Checkbox 
                    label="مكتمل" 
                    checked={planReview?.task7_2_complete || false}
                    onChange={(_, checked) => planReview && savePlanReview({ ...planReview, task7_2_complete: checked || false })}
                    styles={{ checkbox: { backgroundColor: planReview?.task7_2_complete ? '#ef6c00' : undefined } }}
                  />
                </div>
                <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: 12 }}>
                  توثيق إجراءات الاستجابة لكل سيناريو من السيناريوهات الخمسة:
                </p>
                {(sharedBCPlan?.scenarios || []).map((scenario, idx) => (
                  <TextField
                    key={scenario.id}
                    label={`إجراءات الاستجابة - ${scenario.title}`}
                    multiline rows={2}
                    placeholder={`إجراءات الاستجابة للسيناريو ${idx + 1}...`}
                    value={(planReview as any)?.[`response_scenario${scenario.id}`] || ''}
                    onChange={(_, v) => planReview && setPlanReview({ ...planReview, [`response_scenario${scenario.id}`]: v || '' })}
                    styles={{ root: { marginBottom: 8 } }}
                  />
                ))}
              </div>

              {/* 7.3: Documentation and Approval */}
              <div style={{ backgroundColor: '#e8f5e9', padding: 16, borderRadius: 8, border: '1px solid #a5d6a7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ color: '#2e7d32', margin: 0 }}>
                    <Icon iconName="Certificate" style={{ marginLeft: 8 }} />
                    الجزء 7.3: توثيق واعتماد الإجراءات
                  </h4>
                  <Checkbox 
                    label="مكتمل" 
                    checked={planReview?.task7_3_complete || false}
                    onChange={(_, checked) => planReview && savePlanReview({ ...planReview, task7_3_complete: checked || false })}
                    styles={{ checkbox: { backgroundColor: planReview?.task7_3_complete ? '#2e7d32' : undefined } }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                  <input
                    type="file"
                    id="proceduresFile"
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && planReview) {
                        savePlanReview({
                          ...planReview,
                          proceduresFileName: file.name,
                          proceduresFileUploadDate: new Date().toISOString()
                        })
                      }
                    }}
                  />
                  <DefaultButton
                    text="رفع ملف إجراءات الاستجابة"
                    iconProps={{ iconName: 'Upload' }}
                    onClick={() => document.getElementById('proceduresFile')?.click()}
                  />
                  {planReview?.proceduresFileName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#c8e6c9', padding: '6px 12px', borderRadius: 6 }}>
                      <Icon iconName="Document" style={{ color: '#2e7d32' }} />
                      <span style={{ color: '#2e7d32', fontWeight: 500 }}>{planReview.proceduresFileName}</span>
                      <span style={{ color: '#666', fontSize: '0.8rem' }}>
                        (رُفع: {planReview.proceduresFileUploadDate ? new Date(planReview.proceduresFileUploadDate).toLocaleDateString('ar-SA') : '-'})
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <DatePicker
                    label="تاريخ الاعتماد"
                    value={planReview?.approvalDate ? new Date(planReview.approvalDate) : undefined}
                    onSelectDate={(date) => planReview && date && savePlanReview({ ...planReview, approvalDate: date.toISOString() })}
                    placeholder="اختر التاريخ"
                  />
                  <TextField
                    label="الجهة المعتمدة"
                    value={planReview?.approvedBy || ''}
                    onChange={(_, v) => planReview && setPlanReview({ ...planReview, approvedBy: v || '' })}
                    placeholder="مثال: مدير إدارة التعليم"
                  />
                </div>
              </div>

              {/* Save Button for Task 7 */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                <PrimaryButton 
                  text="حفظ بيانات المهمة 7" 
                  iconProps={{ iconName: 'Save' }}
                  onClick={() => planReview && savePlanReview(planReview)}
                  styles={{ root: { backgroundColor: '#5c2d91' } }}
                />
              </div>

              {/* Task 7 Completion Status */}
              {task7Complete && (
                <MessageBar messageBarType={MessageBarType.success} styles={{ root: { marginTop: 16 } }}>
                  ✅ المهمة 7 مكتملة - تم توثيق المراجعة وإجراءات الاستجابة والاعتماد
                </MessageBar>
              )}
            </div>
          </div>
        </PivotItem>

        {/* Tab 3: Yearly Drill Plan */}
        <PivotItem headerText="خطة التمارين السنوية" itemKey="testplans" itemIcon="TestPlan">
          <div style={{ padding: '20px 0' }}>
            {/* Summary Card */}
            <div className="card" style={{ padding: 20, marginBottom: 20, backgroundColor: '#f3f2f1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.08)', borderTop: '4px solid #008752' }}>
                  <Text variant="xxLarge" style={{ color: '#008752', fontWeight: 700, display: 'block' }}>{schools.length}</Text>
                  <Text style={{ display: 'block', color: '#666', marginTop: 8 }}>إجمالي المدارس</Text>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.08)', borderTop: '4px solid #107c10' }}>
                  <Text variant="xxLarge" style={{ color: '#107c10', fontWeight: 700, display: 'block' }}>{schoolsCompleted4Drills}</Text>
                  <Text style={{ display: 'block', color: '#666', marginTop: 8 }}>مدارس أكملت 4 تمارين</Text>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.08)', borderTop: '4px solid #0078d4' }}>
                  <Text variant="xxLarge" style={{ color: '#0078d4', fontWeight: 700, display: 'block' }}>{stats.totalDrills}</Text>
                  <Text style={{ display: 'block', color: '#666', marginTop: 8 }}>إجمالي التمارين</Text>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.08)', borderTop: '4px solid #5c2d91' }}>
                  <Text variant="xxLarge" style={{ color: schools.length > 0 ? '#5c2d91' : '#666', fontWeight: 700, display: 'block' }}>{schools.length > 0 ? Math.round(schoolsCompleted4Drills / schools.length * 100) : 0}%</Text>
                  <Text style={{ display: 'block', color: '#666', marginTop: 8 }}>نسبة الإنجاز</Text>
                </div>
              </div>
            </div>

            {/* Drills Management Component */}
            <DrilsManagement />

            {/* Schools Progress */}
            <div className="card" style={{ marginTop: 20 }}>
              <h4 style={{ color: '#008752', marginBottom: 12 }}>تقدم المدارس في تنفيذ التمارين الفرضية</h4>
              <DetailsList
                items={schools.map(s => ({
                  schoolName: s.SchoolName,
                  drillCount: drillsPerSchool.get(s.SchoolName) || 0,
                  progress: Math.min(((drillsPerSchool.get(s.SchoolName) || 0) / 4) * 100, 100)
                })).sort((a, b) => b.drillCount - a.drillCount)}
                columns={[
                  { ...getColumnConfig(ColumnType.MEDIUM_TEXT), key: 'schoolName', name: 'المدرسة', fieldName: 'schoolName', onRender: (item: any) => <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.schoolName}</div> },
                  { ...getColumnConfig(ColumnType.SHORT_TEXT), key: 'drillCount', name: 'التمارين المنفذة', fieldName: 'drillCount', onRender: (item: any) => <div style={{ textAlign: 'center', width: '100%' }}><span style={{ color: item.drillCount >= 4 ? '#107c10' : '#323130' }}>{item.drillCount} / 4</span></div> },
                  { ...getColumnConfig(ColumnType.MEDIUM_TEXT), key: 'progress', name: 'نسبة الإنجاز', onRender: (item: any) => (
                    <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }} horizontalAlign="center">
                      <ProgressIndicator percentComplete={item.progress / 100} barHeight={6} styles={{ root: { width: 80 }, progressBar: { backgroundColor: item.progress >= 100 ? '#107c10' : '#0078d4' } }} />
                      <span style={{ color: item.progress >= 100 ? '#107c10' : '#323130', fontWeight: 600 }}>{Math.round(item.progress)}%</span>
                    </Stack>
                  )}
                ]}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.none}
                styles={{ root: { maxHeight: 600, overflowY: 'auto' } }}
              />
            </div>
          </div>
        </PivotItem>

        {/* Tab 4: Admin Contacts - separate from school teams */}
        <PivotItem headerText="جهات الاتصال" itemKey="contacts" itemIcon="ContactList">
          <div style={{ padding: '20px 0' }}>
            {/* Admin's Own Contacts */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center" style={{ marginBottom: 16 }}>
                <h3 style={{ color: '#008752', margin: 0 }}>
                  <Icon iconName="ContactList" style={{ marginLeft: 8 }} />
                  جهات اتصال الإدارة (غرفة العمليات والجهات الخارجية)
                </h3>
                <PrimaryButton 
                  text="إضافة جهة اتصال" 
                  iconProps={{ iconName: 'AddFriend' }} 
                  onClick={() => { setEditingContact(null); setContactPanelOpen(true) }}
                  styles={{ root: { backgroundColor: '#008752' } }}
                />
              </Stack>

              {/* Organization Stats - matching BC_Plan_Content.txt structure */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
                {/* Internal Contacts */}
                <div style={{ gridColumn: '1 / -1', fontWeight: 600, color: '#333', marginBottom: 4 }}>قائمة جهات الاتصال الداخلية:</div>
                {[
                  { key: 'operations', label: 'فريق غرفة العمليات', icon: '🏢', color: '#1565c0' },
                  { key: 'bc_team', label: 'فريق استمرارية الأعمال', icon: '👥', color: '#2e7d32' },
                  { key: 'bc_team_backup', label: 'الأعضاء الاحتياطيون', icon: '👤', color: '#558b2f' },
                  { key: 'ministry', label: 'الوزارة', icon: '🏛️', color: '#7b1fa2' },
                ].map(org => (
                  <div key={org.key} style={{ background: '#f5f5f5', padding: 10, borderRadius: 8, textAlign: 'center', borderRight: `3px solid ${org.color}` }}>
                    <div style={{ fontSize: 20 }}>{org.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: org.color }}>{adminContacts.filter(c => c.organization === org.key).length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{org.label}</div>
                  </div>
                ))}
                {/* External Contacts */}
                <div style={{ gridColumn: '1 / -1', fontWeight: 600, color: '#333', marginTop: 8, marginBottom: 4 }}>قائمة جهات الاتصال الخارجية:</div>
                {[
                  { key: 'tatweer', label: 'شركة تطوير', icon: '🏗️', color: '#00796b' },
                  { key: 'it_systems', label: 'الأنظمة والتطبيقات', icon: '💻', color: '#0277bd' },
                  { key: 'infosec', label: 'أمن المعلومات', icon: '🔐', color: '#5d4037' },
                  { key: 'police', label: 'الشرطة', icon: '👮', color: '#37474f' },
                  { key: 'civil_defense', label: 'الدفاع المدني', icon: '🚒', color: '#d32f2f' },
                  { key: 'ambulance', label: 'الإسعاف', icon: '🚑', color: '#c2185b' },
                  { key: 'red_crescent', label: 'الهلال الأحمر', icon: '🏥', color: '#e91e63' },
                  { key: 'external', label: 'جهات أخرى', icon: '🌐', color: '#455a64' },
                ].map(org => (
                  <div key={org.key} style={{ background: '#f5f5f5', padding: 10, borderRadius: 8, textAlign: 'center', borderRight: `3px solid ${org.color}` }}>
                    <div style={{ fontSize: 20 }}>{org.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: org.color }}>{adminContacts.filter(c => c.organization === org.key).length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{org.label}</div>
                  </div>
                ))}
              </div>

              {/* Contacts Table */}
              {adminContacts.length > 0 ? (
                <DetailsList
                  items={adminContacts}
                  columns={[
                    { ...getColumnConfig(ColumnType.MEDIUM_TEXT), key: 'Title', name: 'الاسم', fieldName: 'Title', onRender: (item: AdminContact) => <div style={{ textAlign: 'center', width: '100%', fontWeight: 500, whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.Title}</div> },
                    { ...getColumnConfig(ColumnType.SHORT_TEXT), key: 'role', name: 'المنصب/الوظيفة', fieldName: 'role', onRender: (item: AdminContact) => <div style={{ textAlign: 'center', width: '100%' }}>{item.role || '-'}</div> },
                    { ...getColumnConfig(ColumnType.MEDIUM_TEXT), key: 'organization', name: 'الجهة', fieldName: 'organization', onRender: (item: AdminContact) => {
                      const labels: any = { 
                        operations: 'غرفة العمليات', bc_team: 'فريق BC', bc_team_backup: 'احتياطي BC',
                        civil_defense: 'الدفاع المدني', red_crescent: 'الهلال الأحمر', ministry: 'الوزارة', 
                        tatweer: 'شركة تطوير', it_systems: 'الأنظمة والتطبيقات', infosec: 'أمن المعلومات',
                        police: 'الشرطة', ambulance: 'الإسعاف', external: 'جهة خارجية' 
                      }
                      const colors: any = { 
                        operations: '#1565c0', bc_team: '#2e7d32', bc_team_backup: '#558b2f',
                        civil_defense: '#d32f2f', red_crescent: '#c2185b', ministry: '#7b1fa2',
                        tatweer: '#00796b', it_systems: '#0277bd', infosec: '#5d4037',
                        police: '#37474f', ambulance: '#c2185b', external: '#455a64'
                      }
                      return <div style={{ textAlign: 'center', width: '100%' }}><span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: (colors[item.organization] || '#455a64') + '20', color: colors[item.organization] || '#455a64', fontSize: 12, fontWeight: 500 }}>{labels[item.organization] || 'أخرى'}</span></div>
                    }},
                    { ...getColumnConfig(ColumnType.PHONE), key: 'phone', name: 'رقم الجوال', fieldName: 'phone', onRender: (item: AdminContact) => <div style={{ textAlign: 'center', width: '100%', direction: 'ltr' }}>{item.phone || '-'}</div> },
                    { ...getColumnConfig(ColumnType.EMAIL), key: 'email', name: 'البريد الإلكتروني', fieldName: 'email', onRender: (item: AdminContact) => <div style={{ textAlign: 'center', width: '100%' }}>{item.email || '-'}</div> },
                    { key: 'visible', name: 'في المرجع السريع', minWidth: 120, maxWidth: 120, styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } }, onRender: (item: AdminContact) => (
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <Toggle 
                          checked={item.isVisibleToSchools || false}
                          onChange={async (_, checked) => {
                            try {
                              await AdminDataService.updateAdminContact(item.id, { isVisibleToSchools: checked })
                              const contacts = await AdminDataService.getAdminContacts()
                              setAdminContacts(contacts)
                            } catch (e) {
                              console.error('Error updating contact visibility:', e)
                              setMessage({ type: MessageBarType.error, text: 'فشل تحديث حالة الظهور' })
                            }
                          }}
                          onText="نعم"
                          offText="لا"
                        />
                      </div>
                    )},
                    { key: 'actions', name: 'إجراءات', minWidth: 100, flexGrow: 0, styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } }, onRender: (item: AdminContact) => (
                      <Stack horizontal tokens={{ childrenGap: 4 }} horizontalAlign="center">
                        <IconButton iconProps={{ iconName: 'Edit' }} title="تعديل" onClick={() => { setEditingContact(item); setContactPanelOpen(true) }} styles={{ root: { color: '#0078d4' } }} />
                        <IconButton iconProps={{ iconName: 'Delete' }} title="حذف" onClick={() => deleteAdminContact(item.id)} styles={{ root: { color: '#d83b01' } }} />
                      </Stack>
                    )}
                  ]}
                  layoutMode={DetailsListLayoutMode.justified}
                  selectionMode={SelectionMode.none}
                />
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#666', backgroundColor: '#fafafa', borderRadius: 8 }}>
                  <Icon iconName="ContactList" style={{ fontSize: 48, marginBottom: 12, color: '#ccc' }} />
                  <div>لا توجد جهات اتصال مسجلة</div>
                  <div style={{ fontSize: '0.85rem', marginTop: 8 }}>أضف جهات اتصال غرفة العمليات والجهات الخارجية</div>
                </div>
              )}
            </div>

            {/* School Teams Summary */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ color: '#0078d4', marginBottom: 16 }}>
                <Icon iconName="Group" style={{ marginLeft: 8 }} />
                ملخص فرق الأمن والسلامة بالمدارس
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#e8f5e9', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2e7d32' }}>{teamMembers.length}</div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>إجمالي أعضاء الفرق</div>
                </div>
                <div style={{ background: '#e3f2fd', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1565c0' }}>{new Set(teamMembers.map(t => t.SchoolName_Ref)).size}</div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>مدارس لديها فرق</div>
                </div>
                <div style={{ background: '#fff3e0', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ef6c00' }}>{teamMembers.filter(t => t.MembershipType === 'رئيس الفريق').length}</div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>رؤساء فرق</div>
                </div>
              </div>
              <MessageBar messageBarType={MessageBarType.info}>
                لعرض تفاصيل فرق المدارس، انتقل إلى صفحة "فريق الأمن والسلامة" من القائمة الجانبية.
              </MessageBar>
            </div>
          </div>
        </PivotItem>

        {/* Tab: Notifications Management */}
        <PivotItem headerText="الإشعارات والتنبيهات" itemKey="notifications" itemIcon="Ringer">
          <div style={{ padding: '20px 0' }}>
            <Stack horizontal horizontalAlign="space-between" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>إدارة الإشعارات للمدارس</h3>
                <Text variant="small" style={{ color: '#666' }}>
                  إنشاء وإدارة الإشعارات المهمة التي ستصل للمدارس
                </Text>
              </div>
              <PrimaryButton
                text="إشعار جديد"
                iconProps={{ iconName: 'Add' }}
                onClick={() => {
                  setEditingAnnouncement(null)
                  setAnnouncementPanelOpen(true)
                }}
              />
            </Stack>

            <MessageBar messageBarType={MessageBarType.info} styles={{ root: { marginBottom: 16 } }}>
              الإشعارات ستظهر للمدارس في أيقونة الجرس (🔔) أعلى التطبيق. يمكنك إرسال إشعارات لجميع المدارس أو مدارس محددة.
            </MessageBar>

            {/* Announcements Table */}
            <div className="card" style={{ padding: 20 }}>
              <DetailsList
                items={announcements.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())}
                columns={[
                  {
                    key: 'priority',
                    name: 'الأولوية',
                    minWidth: 80,
                    maxWidth: 100,
                    onRender: (item: Announcement) => {
                      const icons = {
                        critical: { icon: '🚨', color: '#d83b01', label: 'عاجل' },
                        urgent: { icon: '⚠️', color: '#ff8c00', label: 'مهم' },
                        normal: { icon: '📢', color: '#0078d4', label: 'عادي' }
                      }
                      const p = icons[item.priority]
                      return (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: p.color, fontWeight: 600 }}>
                          {p.icon} {p.label}
                        </span>
                      )
                    }
                  },
                  {
                    key: 'Title',
                    name: 'العنوان',
                    minWidth: 200,
                    maxWidth: 300,
                    isMultiline: true,
                    onRender: (item: Announcement) => <strong>{item.Title}</strong>
                  },
                  {
                    key: 'message',
                    name: 'الرسالة',
                    minWidth: 300,
                    maxWidth: 400,
                    isMultiline: true,
                    onRender: (item: Announcement) => (
                      <div style={{ whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.message.length > 150 ? item.message.substring(0, 150) + '...' : item.message}
                      </div>
                    )
                  },
                  {
                    key: 'targetAudience',
                    name: 'الفئة المستهدفة',
                    minWidth: 120,
                    maxWidth: 150,
                    onRender: (item: Announcement) => (
                      <span>
                        {item.targetAudience === 'all' ? 'جميع المدارس' : `${item.targetSchools?.length || 0} مدرسة`}
                      </span>
                    )
                  },
                  {
                    key: 'publishDate',
                    name: 'تاريخ النشر',
                    minWidth: 120,
                    maxWidth: 150,
                    onRender: (item: Announcement) => renderDate(item.publishDate)
                  },
                  {
                    key: 'isActive',
                    name: 'الحالة',
                    minWidth: 80,
                    maxWidth: 100,
                    onRender: (item: Announcement) => {
                      const now = new Date()
                      const expired = item.expiryDate && new Date(item.expiryDate) < now
                      return (
                        <span style={{ color: expired ? '#999' : item.isActive ? '#107c10' : '#d83b01' }}>
                          {expired ? '⏱️ منتهي' : item.isActive ? '✅ نشط' : '⏸️ متوقف'}
                        </span>
                      )
                    }
                  },
                  {
                    key: 'actions',
                    name: 'الإجراءات',
                    minWidth: 120,
                    maxWidth: 150,
                    onRender: (item: Announcement) => (
                      <Stack horizontal tokens={{ childrenGap: 8 }}>
                        <IconButton
                          iconProps={{ iconName: 'Edit' }}
                          title="تعديل"
                          onClick={() => {
                            setEditingAnnouncement(item)
                            setAnnouncementPanelOpen(true)
                          }}
                        />
                        <IconButton
                          iconProps={{ iconName: item.isActive ? 'CirclePause' : 'Play' }}
                          title={item.isActive ? 'إيقاف' : 'تنشيط'}
                          onClick={async () => {
                            try {
                              await AnnouncementService.updateAnnouncement(item.id, { isActive: !item.isActive })
                              const updated = await AnnouncementService.getAnnouncements()
                              setAnnouncements(updated)
                              setMessage({
                                type: MessageBarType.success,
                                text: item.isActive ? 'تم إيقاف الإشعار' : 'تم تنشيط الإشعار'
                              })
                            } catch (e) {
                              setMessage({ type: MessageBarType.error, text: 'حدث خطأ' })
                            }
                          }}
                        />
                        <IconButton
                          iconProps={{ iconName: 'Delete' }}
                          title="حذف"
                          onClick={async () => {
                            if (window.confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
                              try {
                                await AnnouncementService.deleteAnnouncement(item.id)
                                const updated = await AnnouncementService.getAnnouncements()
                                setAnnouncements(updated)
                                setMessage({ type: MessageBarType.success, text: 'تم حذف الإشعار' })
                              } catch (e) {
                                setMessage({ type: MessageBarType.error, text: 'حدث خطأ في الحذف' })
                              }
                            }
                          }}
                        />
                      </Stack>
                    )
                  }
                ]}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.none}
              />

              {announcements.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  <Icon iconName="Ringer" style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
                  <Text variant="large" block>لا توجد إشعارات</Text>
                  <Text variant="small" block style={{ marginTop: 8 }}>
                    اضغط على "إشعار جديد" لإنشاء أول إشعار للمدارس
                  </Text>
                </div>
              )}
            </div>

            {/* Announcement Form Panel */}
            <Panel
              isOpen={announcementPanelOpen}
              onDismiss={() => {
                setAnnouncementPanelOpen(false)
                setEditingAnnouncement(null)
              }}
              type={PanelType.medium}
              headerText={editingAnnouncement ? 'تعديل إشعار' : 'إشعار جديد'}
              closeButtonAriaLabel="إغلاق"
            >
              <AnnouncementForm
                announcement={editingAnnouncement}
                schools={schools}
                onSave={async (announcement) => {
                  try {
                    if (editingAnnouncement) {
                      await AnnouncementService.updateAnnouncement(editingAnnouncement.id, announcement)
                      setMessage({ type: MessageBarType.success, text: 'تم تحديث الإشعار' })
                    } else {
                      await AnnouncementService.createAnnouncement(announcement as Omit<Announcement, 'id'>)
                      setMessage({ type: MessageBarType.success, text: 'تم إنشاء الإشعار' })
                    }
                    const updated = await AnnouncementService.getAnnouncements()
                    setAnnouncements(updated)
                    setAnnouncementPanelOpen(false)
                    setEditingAnnouncement(null)
                  } catch (e) {
                    setMessage({ type: MessageBarType.error, text: 'حدث خطأ في الحفظ' })
                  }
                }}
                onCancel={() => {
                  setAnnouncementPanelOpen(false)
                  setEditingAnnouncement(null)
                }}
              />
            </Panel>
          </div>
        </PivotItem>

        {/* Tab 5: DR Checklist */}
        <PivotItem headerText="جاهزية DR" itemKey="dr" itemIcon="CloudUpload">
          <BCDRChecklistComponent />
        </PivotItem>

        {/* Tab 6: Lessons Learned - from SharePoint Incidents */}
        <PivotItem headerText="الدروس المستفادة" itemKey="lessons" itemIcon="Lightbulb">
          <div style={{ padding: '20px 0' }}>
            {/* Schools Lessons - from Incidents */}
            <SchoolLessonsAnalysis incidents={incidents} drills={drills} />
            
            {/* Note about data source */}
            <div style={{ marginTop: 24 }}>
              <MessageBar messageBarType={MessageBarType.info}>
                <strong>ملاحظة:</strong> يتم جلب الدروس المستفادة من قائمة الحوادث في SharePoint (SBC_Incidents_Log). لإضافة درس مستفاد، قم بتعديل الحادث من صفحة "الحوادث والطوارئ" وإضافة الدروس المستفادة والتحديات والمقترحات.
              </MessageBar>
              
              {/* Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 16 }}>
                <div style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                  <Icon iconName="Warning" style={{ fontSize: 24, color: '#1565c0', marginBottom: 8 }} />
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1565c0' }}>{incidents.length}</div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>إجمالي الحوادث المسجلة</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                  <Icon iconName="Lightbulb" style={{ fontSize: 24, color: '#2e7d32', marginBottom: 8 }} />
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2e7d32' }}>{incidents.filter(i => i.LessonsLearned).length}</div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>حوادث بدروس مستفادة</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                  <Icon iconName="Error" style={{ fontSize: 24, color: '#ef6c00', marginBottom: 8 }} />
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ef6c00' }}>{incidents.filter(i => i.Challenges).length}</div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>حوادث بتحديات موثقة</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                  <Icon iconName="Lightbulb" style={{ fontSize: 24, color: '#c2185b', marginBottom: 8 }} />
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#c2185b' }}>{incidents.filter(i => i.Suggestions).length}</div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>حوادث بمقترحات</div>
                </div>
              </div>

              {/* Link to Incidents page */}
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <PrimaryButton 
                  text="الذهاب لصفحة الحوادث لإضافة دروس مستفادة" 
                  iconProps={{ iconName: 'NavigateForward' }}
                  onClick={() => window.location.href = '/incidents'}
                  styles={{ root: { backgroundColor: '#008752' } }}
                />
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

        {/* Tab 9: BC Supporting Documents (distinct from main BC Plan in tab 3) */}
        <PivotItem headerText="المستندات المساندة" itemKey="bcplans" itemIcon="DocumentSet">
          <div style={{ padding: '20px 0' }}>
            {/* Clarification Note */}
            <MessageBar messageBarType={MessageBarType.info} style={{ marginBottom: 16 }}>
              <strong>ملاحظة:</strong> هذا التبويب لإدارة المستندات المساندة للخطة (السياسات، الإجراءات، النماذج). 
              لرفع خطة استمرارية الأعمال الرئيسية ونشرها للمدارس، انتقل إلى تبويب "📋 المهمة 1 و 7".
            </MessageBar>
            
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center" style={{ marginBottom: 16 }}>
                <div>
                  <h3 style={{ color: '#008752', margin: 0 }}>
                    <Icon iconName="DocumentSet" style={{ marginLeft: 8 }} />
                    المستندات المساندة لاستمرارية الأعمال
                  </h3>
                  <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '0.9rem' }}>إدارة السياسات والإجراءات والنماذج والتقارير</p>
                </div>
                <PrimaryButton 
                  text="إضافة مستند" 
                  iconProps={{ iconName: 'PageAdd' }} 
                  onClick={() => { setEditingBCPlan(null); setBCPlanPanelOpen(true) }}
                  styles={{ root: { backgroundColor: '#008752' } }}
                />
              </Stack>

              {/* Document Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                <div style={{ background: '#e8f5e9', padding: 12, borderRadius: 8, textAlign: 'center', borderRight: '3px solid #2e7d32' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2e7d32' }}>{bcPlanDocuments.length}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>إجمالي المستندات</div>
                </div>
                <div style={{ background: '#e3f2fd', padding: 12, borderRadius: 8, textAlign: 'center', borderRight: '3px solid #1565c0' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1565c0' }}>{bcPlanDocuments.filter(d => d.isShared).length}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>تمت مشاركتها</div>
                </div>
                <div style={{ background: '#fff3e0', padding: 12, borderRadius: 8, textAlign: 'center', borderRight: '3px solid #ef6c00' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ef6c00' }}>{bcPlanDocuments.filter(d => !d.isShared).length}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>في الانتظار</div>
                </div>
                <div style={{ background: '#fce4ec', padding: 12, borderRadius: 8, textAlign: 'center', borderRight: '3px solid #c2185b' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#c2185b' }}>{new Set(bcPlanDocuments.map(d => d.documentType)).size}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>أنواع مختلفة</div>
                </div>
              </div>

              {/* Documents by Type */}
              {['policy', 'plan', 'procedure', 'template', 'report', 'other'].map(docType => {
                const docs = bcPlanDocuments.filter(d => d.documentType === docType)
                if (docs.length === 0) return null
                const labels: any = { policy: '📜 السياسات', plan: '📋 الخطط', procedure: '📝 الإجراءات', template: '📄 النماذج', report: '📊 التقارير', other: '📁 أخرى' }
                return (
                  <div key={docType} style={{ marginBottom: 16 }}>
                    <h4 style={{ color: '#333', marginBottom: 8 }}>{labels[docType]}</h4>
                    {docs.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <Icon iconName="Document" style={{ fontSize: 20, color: '#0078d4' }} />
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontWeight: 600 }}>{doc.title}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{doc.description}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: '#666' }}>تاريخ الرفع</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{doc.uploadDate || '-'}</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: '#666' }}>تاريخ المشاركة</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: doc.shareDate ? '#2e7d32' : '#999' }}>{doc.shareDate || 'لم تتم'}</div>
                          </div>
                          <div>
                            {doc.isShared ? (
                              <span style={{ padding: '4px 10px', borderRadius: 12, backgroundColor: '#e8f5e9', color: '#2e7d32', fontSize: 12 }}>✓ تمت المشاركة</span>
                            ) : (
                              <span style={{ padding: '4px 10px', borderRadius: 12, backgroundColor: '#fff3e0', color: '#ef6c00', fontSize: 12 }}>⏳ في الانتظار</span>
                            )}
                          </div>
                          <Stack horizontal tokens={{ childrenGap: 4 }}>
                            <IconButton iconProps={{ iconName: 'Edit' }} title="تعديل" onClick={() => { setEditingBCPlan(doc); setBCPlanPanelOpen(true) }} styles={{ root: { color: '#0078d4' } }} />
                            <IconButton iconProps={{ iconName: 'Delete' }} title="حذف" onClick={() => deleteBCPlanDocument(doc.id)} styles={{ root: { color: '#d83b01' } }} />
                          </Stack>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}

              {bcPlanDocuments.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#666', backgroundColor: '#fafafa', borderRadius: 8 }}>
                  <Icon iconName="DocumentSet" style={{ fontSize: 48, marginBottom: 12, color: '#ccc' }} />
                  <div>لا توجد مستندات مسجلة</div>
                  <div style={{ fontSize: '0.85rem', marginTop: 8 }}>أضف خطط BC والسياسات والإجراءات</div>
                </div>
              )}
            </div>
          </div>
        </PivotItem>

        {/* Tab 10: Monitoring & Evaluation */}
        <PivotItem headerText="المراقبة والتقييم" itemKey="monitoring" itemIcon="AnalyticsView">
          <div style={{ padding: '20px 0' }}>
            {/* KPI Summary */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ color: '#008752', marginBottom: 16 }}>
                <Icon iconName="AnalyticsView" style={{ marginLeft: 8 }} />
                مؤشرات الأداء الرئيسية (KPIs)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                {/* Response Time KPI */}
                <div style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', padding: 16, borderRadius: 12 }}>
                  <Icon iconName="Timer" style={{ fontSize: 28, color: '#1565c0', marginBottom: 8 }} />
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1565c0' }}>
                    {incidentEvaluations.length > 0 
                      ? Math.round(incidentEvaluations.reduce((sum, e) => sum + (e.responseTimeMinutes || 0), 0) / incidentEvaluations.length)
                      : '-'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#333' }}>متوسط وقت الاستجابة (دقيقة)</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>الهدف: أقل من 30 دقيقة</div>
                </div>

                {/* Recovery Time KPI */}
                <div style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', padding: 16, borderRadius: 12 }}>
                  <Icon iconName="CalendarReply" style={{ fontSize: 28, color: '#2e7d32', marginBottom: 8 }} />
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2e7d32' }}>
                    {incidentEvaluations.filter(e => e.studentsReturnedDate).length > 0
                      ? Math.round(incidentEvaluations.filter(e => e.recoveryTimeHours).reduce((sum, e) => sum + (e.recoveryTimeHours || 0), 0) / incidentEvaluations.filter(e => e.recoveryTimeHours).length)
                      : '-'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#333' }}>متوسط وقت التعافي (ساعة)</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>الهدف: أقل من 24 ساعة</div>
                </div>

                {/* Student Return Rate */}
                <div style={{ background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', padding: 16, borderRadius: 12 }}>
                  <Icon iconName="Group" style={{ fontSize: 28, color: '#ef6c00', marginBottom: 8 }} />
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ef6c00' }}>
                    {incidentEvaluations.length > 0 
                      ? Math.round((incidentEvaluations.filter(e => e.studentsReturnedDate).length / incidentEvaluations.length) * 100)
                      : '-'}%
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#333' }}>نسبة عودة الطلاب للمدرسة</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>بعد حالات الاضطراب</div>
                </div>

                {/* Overall Score */}
                <div style={{ background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)', padding: 16, borderRadius: 12 }}>
                  <Icon iconName="Ribbon" style={{ fontSize: 28, color: '#c2185b', marginBottom: 8 }} />
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#c2185b' }}>
                    {incidentEvaluations.length > 0 
                      ? (incidentEvaluations.reduce((sum, e) => sum + e.overallScore, 0) / incidentEvaluations.length).toFixed(1)
                      : '-'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#333' }}>متوسط تقييم الاستجابة</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>من 5 نقاط</div>
                </div>
              </div>
            </div>

            {/* Incident Evaluations */}
            <div className="card" style={{ padding: 20 }}>
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center" style={{ marginBottom: 16 }}>
                <h3 style={{ color: '#0078d4', margin: 0 }}>
                  <Icon iconName="ClipboardList" style={{ marginLeft: 8 }} />
                  تقييمات الحوادث والاستجابة
                </h3>
                <PrimaryButton 
                  text="إضافة تقييم" 
                  iconProps={{ iconName: 'Add' }} 
                  onClick={() => { setEditingEvaluation(null); setEvaluationPanelOpen(true) }}
                  styles={{ root: { backgroundColor: '#0078d4' } }}
                />
              </Stack>

              {incidentEvaluations.length > 0 ? (
                <DetailsList
                  items={incidentEvaluations}
                  columns={[
                    { key: 'incident', name: 'الحادث', minWidth: 80, flexGrow: 2, styles: { cellTitle: { justifyContent: 'center' } }, onRender: (item: IncidentEvaluation) => {
                      const incident = incidents.find(i => i.Id === item.incidentId)
                      return <div style={{ textAlign: 'center' }}>{incident?.Title || `حادث #${item.incidentId}`}</div>
                    }},
                    { key: 'responseTime', name: 'وقت الاستجابة', minWidth: 80, flexGrow: 1, styles: { cellTitle: { justifyContent: 'center' } }, onRender: (item: IncidentEvaluation) => (
                      <div style={{ textAlign: 'center' }}>{item.responseTimeMinutes ? `${item.responseTimeMinutes} دقيقة` : '-'}</div>
                    )},
                    { key: 'recoveryTime', name: 'وقت التعافي', minWidth: 80, flexGrow: 1, styles: { cellTitle: { justifyContent: 'center' } }, onRender: (item: IncidentEvaluation) => (
                      <div style={{ textAlign: 'center' }}>{item.recoveryTimeHours ? `${item.recoveryTimeHours} ساعة` : '-'}</div>
                    )},
                    { key: 'studentsReturned', name: 'عودة الطلاب', minWidth: 90, flexGrow: 1, styles: { cellTitle: { justifyContent: 'center' } }, onRender: (item: IncidentEvaluation) => (
                      <div style={{ textAlign: 'center' }}>{item.studentsReturnedDate || <span style={{ color: '#999' }}>-</span>}</div>
                    )},
                    { key: 'score', name: 'التقييم', minWidth: 70, flexGrow: 0, styles: { cellTitle: { justifyContent: 'center' } }, onRender: (item: IncidentEvaluation) => (
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: item.overallScore >= 4 ? '#e8f5e9' : item.overallScore >= 3 ? '#fff3e0' : '#ffebee', color: item.overallScore >= 4 ? '#2e7d32' : item.overallScore >= 3 ? '#ef6c00' : '#d32f2f', fontWeight: 600 }}>
                          {item.overallScore}/5
                        </span>
                      </div>
                    )},
                    { key: 'actions', name: 'إجراءات', minWidth: 100, flexGrow: 0, styles: { cellTitle: { justifyContent: 'center' } }, onRender: (item: IncidentEvaluation) => (
                      <Stack horizontal tokens={{ childrenGap: 4 }} horizontalAlign="center">
                        <IconButton iconProps={{ iconName: 'Edit' }} title="تعديل" onClick={() => { setEditingEvaluation(item); setEvaluationPanelOpen(true) }} styles={{ root: { color: '#0078d4' } }} />
                        <IconButton iconProps={{ iconName: 'Delete' }} title="حذف" onClick={() => deleteIncidentEvaluation(item.id)} styles={{ root: { color: '#d83b01' } }} />
                      </Stack>
                    )}
                  ]}
                  layoutMode={DetailsListLayoutMode.justified}
                  selectionMode={SelectionMode.none}
                />
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#666', backgroundColor: '#fafafa', borderRadius: 8 }}>
                  <Icon iconName="AnalyticsView" style={{ fontSize: 48, marginBottom: 12, color: '#ccc' }} />
                  <div>لا توجد تقييمات مسجلة</div>
                  <div style={{ fontSize: '0.85rem', marginTop: 8 }}>أضف تقييمات للحوادث لتتبع أوقات الاستجابة والتعافي</div>
                </div>
              )}

              {/* Incidents without evaluation */}
              {incidents.filter(i => !incidentEvaluations.find(e => e.incidentId === i.Id)).length > 0 && (
                <MessageBar messageBarType={MessageBarType.warning} styles={{ root: { marginTop: 16 } }}>
                  يوجد {incidents.filter(i => !incidentEvaluations.find(e => e.incidentId === i.Id)).length} حادث بدون تقييم. يُنصح بتقييم جميع الحوادث لتحسين مؤشرات الأداء.
                </MessageBar>
              )}
            </div>
          </div>
        </PivotItem>

        {/* Tab 11: Export/Import */}
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

      {/* Admin Contact Panel */}
      <Panel isOpen={contactPanelOpen} onDismiss={() => setContactPanelOpen(false)} headerText={editingContact ? 'تعديل جهة اتصال' : 'إضافة جهة اتصال'} type={PanelType.medium}>
        <AdminContactForm contact={editingContact} onSave={async (c) => { await saveAdminContact(c, !!editingContact); setContactPanelOpen(false); setEditingContact(null) }} />
      </Panel>

      {/* Test Plan Panel */}
      <Panel isOpen={testPlanPanelOpen} onDismiss={() => setTestPlanPanelOpen(false)} headerText={editingTestPlan ? 'تعديل تمرين فرضي' : 'إضافة تمرين فرضي'} type={PanelType.medium}>
        <TestPlanForm plan={editingTestPlan} onSave={(p) => { saveTestPlans(editingTestPlan ? testPlans.map(x => x.id === p.id ? p : x) : [...testPlans, { ...p, id: Date.now() }]); setTestPlanPanelOpen(false) }} />
      </Panel>

      {/* BC Plan Document Panel */}
      <Panel isOpen={bcPlanPanelOpen} onDismiss={() => setBCPlanPanelOpen(false)} headerText={editingBCPlan ? 'تعديل مستند' : 'إضافة مستند خطة BC'} type={PanelType.medium}>
        <BCPlanDocumentForm document={editingBCPlan} onSave={async (d) => { await saveBCPlanDocument(d, !!editingBCPlan); setBCPlanPanelOpen(false); setEditingBCPlan(null) }} />
      </Panel>

      {/* Evaluation Panel */}
      <Panel isOpen={evaluationPanelOpen} onDismiss={() => setEvaluationPanelOpen(false)} headerText={editingEvaluation ? 'تعديل تقييم' : 'إضافة تقييم حادث'} type={PanelType.medium}>
        <IncidentEvaluationForm evaluation={editingEvaluation} incidents={incidents} onSave={async (e) => { await saveIncidentEvaluation(e, !!editingEvaluation); setEvaluationPanelOpen(false); setEditingEvaluation(null) }} />
      </Panel>

      {/* Supporting Docs Sidebar - View as schools see it */}
      <SupportingDocsSidebar
        isOpen={supportingDocsSidebarOpen}
        onClose={() => setSupportingDocsSidebarOpen(false)}
      />
    </div>
  )
}

// Sub-components for forms

// Admin Contact Form
const AdminContactForm: React.FC<{ contact: AdminContact | null, onSave: (c: AdminContact) => void }> = ({ contact, onSave }) => {
  const [form, setForm] = useState<Partial<AdminContact>>(contact || { Title: '', role: '', organization: 'operations', phone: '', email: '', notes: '', category: 'internal', contactScope: '', contactTiming: '', backupMember: '' })
  
  // Organization options matching BC_Plan_Content.txt structure
  const internalOrganizations = [
    { key: 'operations', text: 'فريق غرفة العمليات في إدارة التعليم' },
    { key: 'bc_team', text: 'فريق استمرارية الأعمال' },
    { key: 'bc_team_backup', text: 'الأعضاء الاحتياطيون لفريق استمرارية الأعمال' },
    { key: 'ministry', text: 'الوزارة' },
  ]
  
  const externalOrganizations = [
    { key: 'tatweer', text: 'شركة تطوير (المباني والموارد الحيوية)' },
    { key: 'it_systems', text: 'الأنظمة وخدمات تقنية المعلومات' },
    { key: 'infosec', text: 'أمن المعلومات (حوادث سيبرانية)' },
    { key: 'police', text: 'الشرطة (الاضطرابات الأمنية)' },
    { key: 'civil_defense', text: 'الدفاع المدني (الحريق)' },
    { key: 'ambulance', text: 'الإسعاف (الإصابات)' },
    { key: 'red_crescent', text: 'الهلال الأحمر' },
    { key: 'external', text: 'جهة خارجية أخرى' },
  ]
  
  const contactTimingOptions = [
    { key: 'disruption', text: 'عند وجود اضطراب بحسب كل فرضية' },
    { key: 'fire', text: 'عند الحريق' },
    { key: 'security', text: 'عند الاضطرابات الأمنية' },
    { key: 'cyber', text: 'عند وجود حوادث سيبرانية' },
    { key: 'injury', text: 'عند إصابة أحد منسوبي المدرسة' },
    { key: 'evacuation', text: 'عند الحريق أو الكوارث الطبيعية والأمنية' },
    { key: 'other', text: 'حسب الحاجة' },
  ]
  
  const isExternal = ['tatweer', 'it_systems', 'infosec', 'police', 'civil_defense', 'ambulance', 'red_crescent', 'external'].includes(form.organization || '')
  
  return (
    <Stack tokens={{ childrenGap: 12 }} style={{ padding: 16 }}>
      {/* Category Selection */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <DefaultButton 
          text="جهة اتصال داخلية" 
          iconProps={{ iconName: 'CityNext' }}
          primary={form.category === 'internal'}
          onClick={() => setForm({ ...form, category: 'internal', organization: 'operations' })}
        />
        <DefaultButton 
          text="جهة اتصال خارجية" 
          iconProps={{ iconName: 'Globe' }}
          primary={form.category === 'external'}
          onClick={() => setForm({ ...form, category: 'external', organization: 'tatweer' })}
        />
      </div>
      
      <Dropdown 
        label="الجهة *" 
        selectedKey={form.organization} 
        options={form.category === 'external' ? externalOrganizations : internalOrganizations} 
        onChange={(_, opt) => setForm({ ...form, organization: opt?.key as any })} 
        required 
      />
      
      {/* Internal Contact Fields (matching Word file: م، الاسم، المنصب، رقم الجوال، البريد الإلكتروني) */}
      <TextField label="الاسم *" value={form.Title} onChange={(_, v) => setForm({ ...form, Title: v })} required placeholder="الاسم الكامل" />
      <TextField label={isExternal ? 'الوظيفة' : 'المنصب'} value={form.role} onChange={(_, v) => setForm({ ...form, role: v })} placeholder={isExternal ? 'مثال: ضابط اتصال' : 'مثال: رئيس وحدة استمرارية العملية التعليمية'} />
      <TextField label="رقم الجوال" value={form.phone} onChange={(_, v) => setForm({ ...form, phone: v })} placeholder="05xxxxxxxx" />
      <TextField label="البريد الإلكتروني" value={form.email} onChange={(_, v) => setForm({ ...form, email: v })} placeholder="email@moe.gov.sa" />
      
      {/* External Contact Specific Fields (matching Word file: نطاق التواصل، التوقيت، العضو البديل) */}
      {isExternal && (
        <div style={{ backgroundColor: '#fff3e0', padding: 16, borderRadius: 8, marginTop: 8 }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#ef6c00' }}>📞 معلومات الاتصال الخارجي</h4>
          <Stack tokens={{ childrenGap: 12 }}>
            <TextField 
              label="نطاق التواصل" 
              value={form.contactScope} 
              onChange={(_, v) => setForm({ ...form, contactScope: v })} 
              placeholder="مثال: مشاكل المبنى أو الموارد الحيوية"
            />
            <Dropdown 
              label="توقيت التواصل" 
              selectedKey={form.contactTiming} 
              options={contactTimingOptions}
              onChange={(_, opt) => setForm({ ...form, contactTiming: opt?.key as string })} 
              placeholder="متى يتم التواصل مع هذه الجهة"
            />
            <TextField 
              label="العضو البديل" 
              value={form.backupMember} 
              onChange={(_, v) => setForm({ ...form, backupMember: v })} 
              placeholder="اسم ورقم العضو البديل للتواصل"
            />
          </Stack>
        </div>
      )}
      
      <TextField label="ملاحظات" multiline rows={2} value={form.notes} onChange={(_, v) => setForm({ ...form, notes: v })} />
      
      {/* Visibility Toggle */}
      <div style={{ backgroundColor: '#f0f8ff', padding: 16, borderRadius: 8, marginTop: 8 }}>
        <Checkbox 
          label="🔖 إظهار جهة الاتصال هذه في المرجع السريع للمدارس"
          checked={form.isVisibleToSchools || false}
          onChange={(_, checked) => setForm({ ...form, isVisibleToSchools: checked })}
          styles={{ text: { fontWeight: 600 } }}
        />
        <Text variant="small" style={{ color: '#666', marginTop: 4, display: 'block' }}>
          عند التفعيل، ستظهر جهة الاتصال للمدارس في المرجع السريع. وإلا ستبقى مخفية وتظهر فقط في لوحة الإدارة.
        </Text>
      </div>
      
      <PrimaryButton 
        text="حفظ" 
        onClick={() => {
          // Validate inputs before saving
          const sanitizedContact = {
            ...form,
            Title: sanitizeString(form.Title || '', 200),
            role: sanitizeString(form.role || '', 200),
            email: form.email && isValidEmail(form.email) ? form.email : '',
            phone: form.phone && isValidSaudiPhone(form.phone) ? formatSaudiPhone(form.phone) : form.phone,
            notes: sanitizeHTML(form.notes || ''),
            contactScope: sanitizeString(form.contactScope || '', 500),
            backupMember: sanitizeString(form.backupMember || '', 200)
          } as AdminContact;
          
          if (!sanitizedContact.Title || !sanitizedContact.organization) {
            alert('يرجى ملء الحقول المطلوبة');
            return;
          }
          
          if (sanitizedContact.email && !isValidEmail(sanitizedContact.email)) {
            alert('البريد الإلكتروني غير صحيح');
            return;
          }
          
          onSave(sanitizedContact);
        }} 
        disabled={!form.Title || !form.organization} 
      />
    </Stack>
  )
}

// BC Plan Document Form
const BCPlanDocumentForm: React.FC<{ document: BCPlanDocument | null, onSave: (d: BCPlanDocument) => void }> = ({ document, onSave }) => {
  const [form, setForm] = useState<Partial<BCPlanDocument>>(document || { 
    title: '', 
    documentType: 'plan', 
    description: '', 
    fileName: '', 
    uploadDate: new Date().toISOString().split('T')[0], 
    shareDate: '', 
    isShared: false, 
    version: '1.0',
    notes: '' 
  })
  
  const documentTypeOptions = [
    { key: 'policy', text: '📜 سياسة' },
    { key: 'plan', text: '📋 خطة' },
    { key: 'procedure', text: '📝 إجراء' },
    { key: 'template', text: '📄 نموذج' },
    { key: 'report', text: '📊 تقرير' },
    { key: 'other', text: '📁 أخرى' },
  ]
  
  return (
    <Stack tokens={{ childrenGap: 12 }} style={{ padding: 16 }}>
      <TextField label="عنوان المستند *" value={form.title} onChange={(_, v) => setForm({ ...form, title: v })} required placeholder="مثال: خطة استمرارية الأعمال 1446" />
      <Dropdown label="نوع المستند *" selectedKey={form.documentType} options={documentTypeOptions} onChange={(_, opt) => setForm({ ...form, documentType: opt?.key as any })} required />
      <TextField label="الوصف" multiline rows={2} value={form.description} onChange={(_, v) => setForm({ ...form, description: v })} placeholder="وصف مختصر للمستند" />
      <TextField label="اسم الملف / الرابط" value={form.fileName} onChange={(_, v) => setForm({ ...form, fileName: v })} placeholder="اسم الملف أو رابط SharePoint" />
      <TextField label="الإصدار" value={form.version} onChange={(_, v) => setForm({ ...form, version: v })} placeholder="1.0" styles={{ root: { width: 100 } }} />
      
      <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
        <h4 style={{ margin: '0 0 12px 0' }}>📅 التواريخ</h4>
        <Stack horizontal tokens={{ childrenGap: 16 }}>
          <TextField label="تاريخ الرفع" type="date" value={form.uploadDate} onChange={(_, v) => setForm({ ...form, uploadDate: v })} styles={{ root: { flex: 1 } }} />
          <TextField label="تاريخ المشاركة" type="date" value={form.shareDate} onChange={(_, v) => setForm({ ...form, shareDate: v, isShared: !!v })} styles={{ root: { flex: 1 } }} />
        </Stack>
      </div>
      
      <Checkbox label="تمت مشاركة المستند مع المدارس" checked={form.isShared} onChange={(_, checked) => setForm({ ...form, isShared: checked })} />
      <TextField label="ملاحظات" multiline rows={2} value={form.notes} onChange={(_, v) => setForm({ ...form, notes: v })} />
      <PrimaryButton text="حفظ" onClick={() => onSave(form as BCPlanDocument)} disabled={!form.title || !form.documentType} />
    </Stack>
  )
}

// Incident Evaluation Form
const IncidentEvaluationForm: React.FC<{ evaluation: IncidentEvaluation | null, incidents: Incident[], onSave: (e: IncidentEvaluation) => void }> = ({ evaluation, incidents, onSave }) => {
  const [form, setForm] = useState<Partial<IncidentEvaluation>>(evaluation || { 
    incidentId: 0, 
    evaluationDate: new Date().toISOString().split('T')[0],
    responseTimeMinutes: undefined,
    recoveryTimeHours: undefined,
    studentsReturnedDate: '',
    alternativeUsed: '',
    overallScore: 3,
    strengths: '',
    weaknesses: '',
    recommendations: '',
    evaluatedBy: ''
  })
  
  const incidentOptions = incidents.map(i => ({ key: i.Id || 0, text: `${i.Title} - ${i.SchoolName_Ref}` }))
  
  return (
    <Stack tokens={{ childrenGap: 12 }} style={{ padding: 16 }}>
      <Dropdown label="الحادث *" selectedKey={form.incidentId} options={incidentOptions} onChange={(_, opt) => setForm({ ...form, incidentId: opt?.key as number })} required placeholder="اختر الحادث" />
      <TextField label="تاريخ التقييم" type="date" value={form.evaluationDate} onChange={(_, v) => setForm({ ...form, evaluationDate: v })} />
      
      <div style={{ backgroundColor: '#e3f2fd', padding: 16, borderRadius: 8 }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#1565c0' }}>⏱️ مؤشرات الوقت</h4>
        <Stack horizontal tokens={{ childrenGap: 16 }}>
          <TextField 
            label="وقت الاستجابة (دقيقة)" 
            type="number" 
            value={form.responseTimeMinutes?.toString() || ''} 
            onChange={(_, v) => setForm({ ...form, responseTimeMinutes: v ? parseInt(v) : undefined })} 
            placeholder="مثال: 15"
            description="من لحظة الإبلاغ حتى بدء التعامل"
            styles={{ root: { flex: 1 } }} 
          />
          <TextField 
            label="وقت التعافي (ساعة)" 
            type="number" 
            value={form.recoveryTimeHours?.toString() || ''} 
            onChange={(_, v) => setForm({ ...form, recoveryTimeHours: v ? parseInt(v) : undefined })} 
            placeholder="مثال: 4"
            description="حتى عودة العمل الطبيعي"
            styles={{ root: { flex: 1 } }} 
          />
        </Stack>
      </div>

      <div style={{ backgroundColor: '#e8f5e9', padding: 16, borderRadius: 8 }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#2e7d32' }}>🎓 عودة الطلاب</h4>
        <TextField label="تاريخ عودة الطلاب للمدرسة" type="date" value={form.studentsReturnedDate} onChange={(_, v) => setForm({ ...form, studentsReturnedDate: v })} description="متى عاد الطلاب للحضور الفعلي (ليس عن بُعد)" />
        <TextField label="البديل المستخدم" value={form.alternativeUsed} onChange={(_, v) => setForm({ ...form, alternativeUsed: v })} placeholder="مثال: مدرسة البديلة / التعليم عن بعد" style={{ marginTop: 12 }} />
      </div>
      
      <div style={{ backgroundColor: '#fff3e0', padding: 16, borderRadius: 8 }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#ef6c00' }}>⭐ التقييم العام (1-5)</h4>
        <Dropdown 
          selectedKey={form.overallScore} 
          options={[
            { key: 1, text: '1 - ضعيف جداً' },
            { key: 2, text: '2 - ضعيف' },
            { key: 3, text: '3 - متوسط' },
            { key: 4, text: '4 - جيد' },
            { key: 5, text: '5 - ممتاز' },
          ]} 
          onChange={(_, opt) => setForm({ ...form, overallScore: opt?.key as number })} 
        />
      </div>
      
      <TextField label="نقاط القوة" multiline rows={2} value={form.strengths} onChange={(_, v) => setForm({ ...form, strengths: v })} placeholder="ما الذي تم بشكل جيد؟" />
      <TextField label="نقاط الضعف" multiline rows={2} value={form.weaknesses} onChange={(_, v) => setForm({ ...form, weaknesses: v })} placeholder="ما الذي يحتاج تحسين؟" />
      <TextField label="التوصيات" multiline rows={2} value={form.recommendations} onChange={(_, v) => setForm({ ...form, recommendations: v })} placeholder="اقتراحات للتحسين" />
      <TextField label="المُقيّم" value={form.evaluatedBy} onChange={(_, v) => setForm({ ...form, evaluatedBy: v })} placeholder="اسم المسؤول عن التقييم" />
      
      <PrimaryButton text="حفظ التقييم" onClick={() => onSave(form as IncidentEvaluation)} disabled={!form.incidentId} />
    </Stack>
  )
}

const TestPlanForm: React.FC<{ plan: TestPlan | null, onSave: (p: TestPlan) => void }> = ({ plan, onSave }) => {
  const [form, setForm] = useState<Partial<TestPlan>>(plan || { title: '', hypothesis: '', specificEvent: '', targetGroup: '', startDate: '', endDate: '', status: 'مخطط', responsible: '', notes: '' })
  const [dateError, setDateError] = useState<string>('')
  
  // التحقق من التواريخ
  const validateDates = (startDate: string, endDate: string): boolean => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end < start) {
        setDateError('تاريخ النهاية يجب أن يكون بعد تاريخ البداية')
        return false
      }
    }
    setDateError('')
    return true
  }
  
  const handleStartDateChange = (v: string | undefined) => {
    const newStartDate = v || ''
    setForm({ ...form, startDate: newStartDate })
    validateDates(newStartDate, form.endDate || '')
  }
  
  const handleEndDateChange = (v: string | undefined) => {
    const newEndDate = v || ''
    setForm({ ...form, endDate: newEndDate })
    validateDates(form.startDate || '', newEndDate)
  }
  
  const canSave = form.title && form.hypothesis && form.targetGroup && form.startDate && form.endDate && form.specificEvent && !dateError
  
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
          <TextField 
            label="تاريخ البداية *" 
            type="date" 
            value={form.startDate} 
            onChange={(_, v) => handleStartDateChange(v)} 
            styles={{ root: { flex: 1 } }} 
            required 
          />
          <TextField 
            label="تاريخ النهاية *" 
            type="date" 
            value={form.endDate} 
            onChange={(_, v) => handleEndDateChange(v)} 
            styles={{ root: { flex: 1 } }} 
            required 
            min={form.startDate || undefined}
            errorMessage={dateError}
          />
        </Stack>
        <p style={{ fontSize: '0.85rem', color: '#666', margin: '8px 0 0 0' }}>المدارس ستتمكن من تنفيذ التمرين فقط خلال هذه الفترة</p>
        {dateError && <p style={{ fontSize: '0.85rem', color: '#d83b01', margin: '8px 0 0 0', fontWeight: 600 }}>⚠️ {dateError}</p>}
      </div>
      
      <Dropdown label="الحالة" selectedKey={form.status} options={[
        { key: 'مخطط', text: 'مخطط' },
        { key: 'قيد التنفيذ', text: 'متاح للتنفيذ' },
        { key: 'مكتمل', text: 'مكتمل' },
        { key: 'مؤجل', text: 'مؤجل' }
      ]} onChange={(_, opt) => setForm({ ...form, status: opt?.key as string })} />
      
      <TextField label="المسؤول عن المتابعة" value={form.responsible} onChange={(_, v) => setForm({ ...form, responsible: v })} placeholder="اسم المسؤول من الإدارة" />
      
      <TextField label="ملاحظات إضافية" multiline rows={2} value={form.notes} onChange={(_, v) => setForm({ ...form, notes: v })} />
      
      {/* عرض أعمدة SharePoint المطلوبة */}
      <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8, fontSize: '0.8rem', color: '#666' }}>
        <strong>💾 أعمدة SharePoint المطلوبة في SBC_Drills_Log:</strong>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <span>• Title (عنوان التمرين)</span>
          <span>• DrillHypothesis (الفرضية)</span>
          <span>• SpecificEvent (وصف الحدث)</span>
          <span>• TargetGroup (الفئة المستهدفة)</span>
          <span>• StartDate (تاريخ البداية)</span>
          <span>• EndDate (تاريخ النهاية)</span>
          <span>• PlanStatus (الحالة)</span>
          <span>• Responsible (المسؤول)</span>
          <span>• Notes (ملاحظات)</span>
          <span>• IsAdminPlan=true (خطة إدارية)</span>
        </div>
      </div>
      
      <PrimaryButton text="حفظ" onClick={() => onSave(form as TestPlan)} disabled={!canSave} styles={{ root: { marginTop: 16 } }} />
    </Stack>
  )
}

// Alternative Schools Manager Component
interface AltSchoolMapping { id: number; primarySchool: string; altSchool1: string; altSchool2: string; notes: string }
const AltSchoolsManager: React.FC<{ schools: SchoolInfo[] }> = ({ schools }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [sectorFilter, setSectorFilter] = useState<string>('all')

  // Get unique levels, genders, and sectors for filters
  const levels = [...new Set(mutualOperationPlan.map(s => s.level))].filter(Boolean)
  const genders = [...new Set(mutualOperationPlan.map(s => s.gender))].filter(Boolean)
  const sectors = [...new Set(mutualOperationPlan.map(s => s.sector))].filter(Boolean)

  // Filter the data
  const filteredData = mutualOperationPlan.filter(school => {
    const matchesSearch = !searchQuery || 
      school.schoolName.includes(searchQuery) ||
      school.alternatives.some(a => a.schoolName.includes(searchQuery))
    const matchesLevel = levelFilter === 'all' || school.level === levelFilter
    const matchesGender = genderFilter === 'all' || school.gender === genderFilter
    const matchesSector = sectorFilter === 'all' || school.sector === sectorFilter
    return matchesSearch && matchesLevel && matchesGender && matchesSector
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

  const genderOptions: IDropdownOption[] = [
    { key: 'all', text: 'الجميع (بنين/بنات)' },
    ...genders.map(g => ({ key: g, text: g }))
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

      {/* Criteria Info Box - Now with customization note */}
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
            <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#666' }}>
              💡 استخدم الفلاتر أدناه لتخصيص العرض حسب المرحلة والجنس والقطاع
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

      {/* Filters - Now with Gender filter */}
      <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginBottom: 16 }} wrap>
        <SearchBox 
          placeholder="بحث عن مدرسة..." 
          value={searchQuery}
          onChange={(_, v) => setSearchQuery(v || '')}
          styles={{ root: { width: 200 } }}
        />
        <Dropdown 
          label="المرحلة" 
          selectedKey={levelFilter} 
          options={levelOptions} 
          onChange={(_, opt) => setLevelFilter(opt?.key as string)} 
          styles={{ root: { width: 160 } }} 
        />
        <Dropdown 
          label="الجنس" 
          selectedKey={genderFilter} 
          options={genderOptions} 
          onChange={(_, opt) => setGenderFilter(opt?.key as string)} 
          styles={{ root: { width: 140 } }} 
        />
        <Dropdown 
          label="القطاع" 
          selectedKey={sectorFilter} 
          options={sectorOptions} 
          onChange={(_, opt) => setSectorFilter(opt?.key as string)} 
          styles={{ root: { width: 180 } }} 
        />
      </Stack>

      {/* Results count */}
      <div style={{ marginBottom: 12, color: '#666' }}>
        عرض {filteredData.length} من {mutualOperationPlan.length} مدرسة
      </div>

      {/* Table */}
      <div style={{ maxHeight: 500, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#008752', color: 'white', position: 'sticky', top: 0 }}>
              <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #006644', width: '18%' }}>المدرسة الأساسية</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #006644', width: '12%' }}>المرحلة</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #006644', width: '8%' }}>الجنس</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #006644', width: '18%' }}>المدرسة البديلة 1</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #006644', width: '8%' }}>المسافة</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #006644', width: '18%' }}>المدرسة البديلة 2</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #006644', width: '8%' }}>المسافة</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #006644', width: '10%' }}>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((school, idx) => (
              <tr key={school.schoolId} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{school.schoolName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{school.sector}</div>
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', fontSize: '0.85rem', textAlign: 'center' }}>
                  {school.level}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                  <span style={{ 
                    backgroundColor: school.gender === 'بنين' ? '#e3f2fd' : '#fce4ec',
                    color: school.gender === 'بنين' ? '#1565c0' : '#c2185b',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}>
                    {school.gender}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
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
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
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
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffcc80' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'center', width: '20%' }}>المدرسة الأساسية</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', width: '15%' }}>المرحلة</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', width: '15%' }}>القطاع</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', width: '17%' }}>المدرسة البديلة 1</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', width: '17%' }}>المدرسة البديلة 2</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', width: '16%' }}>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {schools.filter(s => s.SectorDescription?.includes('ثرب')).slice(0, 20).map((school, idx) => (
                  <tr key={school.SchoolID || idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff8e1' : '#fffde7' }}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', textAlign: 'center' }}>{school.SchoolName}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', textAlign: 'center' }}>{school.Level}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', textAlign: 'center' }}>{school.SectorDescription}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', color: '#999', textAlign: 'center' }}>-</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', color: '#999', textAlign: 'center' }}>-</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', color: '#d32f2f', fontWeight: 500, textAlign: 'center' }}>المدارس متباعدة جداً</td>
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
        <Icon iconName="Lightbulb" />
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
          iconProps={{ iconName: 'People' }}
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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ backgroundColor: '#008752', color: 'white', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '15%' }}>المدرسة</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '20%' }}>الحادث</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '20%' }}>التحديات</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '25%' }}>الدروس المستفادة</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '20%' }}>المقترحات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.slice(0, 50).map((incident, idx) => (
                    <tr key={incident.Id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 500, textAlign: 'center' }}>
                        {incident.SchoolName_Ref || '-'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        <div>{incident.Title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{incident.IncidentCategory}</div>
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '0.85rem', color: '#d32f2f', textAlign: 'center' }}>
                        {incident.Challenges || '-'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '0.85rem', color: '#2e7d32', textAlign: 'center' }}>
                        {incident.LessonsLearned || '-'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '0.85rem', color: '#1565c0', textAlign: 'center' }}>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ef6c00', color: 'white', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '20%' }}>المدرسة</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '20%' }}>نوع التمرين</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '25%' }}>الفرضية</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '20%' }}>الفئة المستهدفة</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '15%' }}>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {drills.slice(0, 50).map((drill, idx) => (
                    <tr key={drill.Id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff8e1' : 'white' }}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', fontWeight: 500, textAlign: 'center' }}>
                        {drill.SchoolName_Ref || '-'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', textAlign: 'center' }}>
                        {drill.Title}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', fontSize: '0.85rem', textAlign: 'center' }}>
                        {drill.DrillHypothesis || '-'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', fontSize: '0.85rem', textAlign: 'center' }}>
                        {drill.TargetGroup || '-'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ffe0b2', fontSize: '0.85rem', textAlign: 'center' }}>
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
              <Icon iconName="People" style={{ fontSize: 48, marginBottom: 12, color: '#ccc' }} />
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
  const [reports, setReports] = useState<DamageReport[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<DamageReport | null>(null)
  const [form, setForm] = useState<Partial<DamageReport>>({ incidentTitle: '', date: '', buildingDamage: 'لا يوجد', equipmentDamage: 'لا يوجد', dataLoss: 'لا يوجد', estimatedCost: '', recoveryTime: '', status: 'قيد التقييم', notes: '' })
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)

  // Load damage reports from SharePoint on mount
  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const data = await AdminDataService.getDamageReports()
      setReports(data)
    } catch (e) {
      console.error('Error loading damage reports:', e)
    }
  }

  const saveReport = async (report: DamageReport, isEdit: boolean) => {
    try {
      if (isEdit) {
        await AdminDataService.updateDamageReport(report.id, report)
      } else {
        await AdminDataService.createDamageReport(report)
      }
      await loadReports()
      setMessage({ type: MessageBarType.success, text: isEdit ? 'تم تحديث تقرير الأضرار بنجاح' : 'تم إضافة تقرير الأضرار بنجاح' })
    } catch (e: any) {
      console.error('Error saving damage report:', e)
      setMessage({ type: MessageBarType.error, text: 'فشل حفظ تقرير الأضرار: ' + (e.message || 'خطأ غير معروف') })
    }
  }

  const deleteReport = async (id: number) => {
    try {
      await AdminDataService.deleteDamageReport(id)
      await loadReports()
      setMessage({ type: MessageBarType.success, text: 'تم حذف تقرير الأضرار بنجاح' })
    } catch (e: any) {
      console.error('Error deleting damage report:', e)
      setMessage({ type: MessageBarType.error, text: 'فشل حذف تقرير الأضرار: ' + (e.message || 'خطأ غير معروف') })
    }
  }

  const damageOptions = [{ key: 'لا يوجد', text: 'لا يوجد' }, { key: 'طفيف', text: 'طفيف' }, { key: 'متوسط', text: 'متوسط' }, { key: 'كبير', text: 'كبير' }, { key: 'كلي', text: 'كلي' }]
  const statusOptions = [{ key: 'قيد التقييم', text: 'قيد التقييم' }, { key: 'تم التقييم', text: 'تم التقييم' }, { key: 'قيد الإصلاح', text: 'قيد الإصلاح' }, { key: 'تم الإصلاح', text: 'تم الإصلاح' }]

  return (
    <div>
      {message && <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)} style={{ marginBottom: 16 }}>{message.text}</MessageBar>}
      <PrimaryButton text="إضافة تقرير تقييم" iconProps={{ iconName: 'Add' }} onClick={() => { setEditing(null); setForm({ incidentTitle: '', date: new Date().toISOString().split('T')[0], buildingDamage: 'لا يوجد', equipmentDamage: 'لا يوجد', dataLoss: 'لا يوجد', estimatedCost: '', recoveryTime: '', status: 'قيد التقييم', notes: '' }); setPanelOpen(true) }} style={{ marginBottom: 16 }} />
      <DetailsList
        items={reports}
        columns={[
          { ...getColumnConfig(ColumnType.MEDIUM_TEXT), key: 'incidentTitle', name: 'الحادث', fieldName: 'incidentTitle', onRender: (item: DamageReport) => <div style={{ textAlign: 'center', width: '100%' }}>{item.incidentTitle}</div> },
          { ...getColumnConfig(ColumnType.DATE), key: 'date', name: 'التاريخ', fieldName: 'date', onRender: (item: DamageReport) => <div style={{ textAlign: 'center', width: '100%' }}>{item.date}</div> },
          { ...getColumnConfig(ColumnType.SHORT_TEXT), key: 'buildingDamage', name: 'أضرار المبنى', fieldName: 'buildingDamage', onRender: (item: DamageReport) => <div style={{ textAlign: 'center', width: '100%' }}>{item.buildingDamage}</div> },
          { ...getColumnConfig(ColumnType.SHORT_TEXT), key: 'equipmentDamage', name: 'أضرار المعدات', fieldName: 'equipmentDamage', onRender: (item: DamageReport) => <div style={{ textAlign: 'center', width: '100%' }}>{item.equipmentDamage}</div> },
          { ...getColumnConfig(ColumnType.STATUS), key: 'status', name: 'الحالة', fieldName: 'status', onRender: (item: DamageReport) => <div style={{ textAlign: 'center', width: '100%' }}>{item.status}</div> },
          { key: 'actions', name: '', minWidth: 100, styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } }, onRender: (item: DamageReport) => (
            <Stack horizontal tokens={{ childrenGap: 4 }} horizontalAlign="center">
              <IconButton iconProps={{ iconName: 'Edit' }} title="تعديل" onClick={() => { setEditing(item); setForm(item); setPanelOpen(true) }} styles={{ root: { color: '#0078d4' } }} />
              <IconButton iconProps={{ iconName: 'Delete' }} title="حذف" onClick={() => deleteReport(item.id)} styles={{ root: { color: '#d83b01' } }} />
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
          <PrimaryButton text="حفظ" onClick={async () => { 
            if (form.incidentTitle) { 
              const report = editing ? { ...form as DamageReport, id: editing.id } : { ...form as DamageReport, id: Date.now() }
              await saveReport(report, !!editing)
              setPanelOpen(false)
              setEditing(null)
            }
          }} disabled={!form.incidentTitle} />
        </Stack>
      </Panel>
    </div>
  )
}

// Announcement Form Component
interface AnnouncementFormProps {
  announcement: Announcement | null
  schools: Array<{ SchoolName: string; Id: number }>
  onSave: (announcement: Partial<Announcement>) => void
  onCancel: () => void
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ announcement, schools, onSave, onCancel }) => {
  const [form, setForm] = useState({
    Title: announcement?.Title || '',
    message: announcement?.message || '',
    priority: announcement?.priority || 'normal',
    targetAudience: announcement?.targetAudience || 'all',
    targetSchools: announcement?.targetSchools || [],
    publishDate: announcement?.publishDate || new Date().toISOString(),
    expiryDate: announcement?.expiryDate || '',
    isActive: announcement?.isActive ?? true,
    attachmentUrl: announcement?.attachmentUrl || ''
  })

  const [selectedSchoolsText, setSelectedSchoolsText] = useState(
    announcement?.targetSchools?.join('\n') || ''
  )

  return (
    <Stack tokens={{ childrenGap: 16 }} style={{ padding: '20px 0' }}>
      <TextField
        label="عنوان الإشعار"
        required
        value={form.Title}
        onChange={(_, v) => setForm({ ...form, Title: v || '' })}
        placeholder="مثال: تحديث مهم في خطة الطوارئ"
      />

      <TextField
        label="نص الإشعار"
        required
        multiline
        rows={5}
        value={form.message}
        onChange={(_, v) => setForm({ ...form, message: v || '' })}
        placeholder="اكتب نص الإشعار هنا..."
      />

      <Dropdown
        label="الأولوية"
        required
        selectedKey={form.priority}
        options={[
          { key: 'normal', text: '📢 عادي - إشعار عام' },
          { key: 'urgent', text: '⚠️ مهم - يتطلب الانتباه' },
          { key: 'critical', text: '🚨 عاجل - يتطلب إجراء فوري' }
        ]}
        onChange={(_, opt) => setForm({ ...form, priority: opt?.key as any })}
      />

      <Dropdown
        label="الفئة المستهدفة"
        required
        selectedKey={form.targetAudience}
        options={[
          { key: 'all', text: 'جميع المدارس' },
          { key: 'specific', text: 'مدارس محددة' }
        ]}
        onChange={(_, opt) => {
          setForm({ ...form, targetAudience: opt?.key as any })
          if (opt?.key === 'all') {
            setSelectedSchoolsText('')
            setForm({ ...form, targetAudience: 'all', targetSchools: [] })
          }
        }}
      />

      {form.targetAudience === 'specific' && (
        <div>
          <Label required>المدارس المستهدفة</Label>
          <MessageBar messageBarType={MessageBarType.info} styles={{ root: { marginBottom: 8 } }}>
            اكتب اسم كل مدرسة في سطر منفصل
          </MessageBar>
          <TextField
            multiline
            rows={6}
            value={selectedSchoolsText}
            onChange={(_, v) => {
              setSelectedSchoolsText(v || '')
              const schoolsArray = v?.split('\n').map(s => s.trim()).filter(s => s.length > 0) || []
              setForm({ ...form, targetSchools: schoolsArray })
            }}
            placeholder="مدرسة ابن خلدون الابتدائية&#10;مدرسة الفارابي الثانوية&#10;مدرسة الجاحظ المتوسطة"
          />
          <Text variant="small" style={{ color: '#666', marginTop: 4 }}>
            عدد المدارس المحددة: {form.targetSchools.length}
          </Text>
        </div>
      )}

      <DatePicker
        label="تاريخ النشر"
        value={new Date(form.publishDate)}
        onSelectDate={(date) => setForm({ ...form, publishDate: date?.toISOString() || new Date().toISOString() })}
        formatDate={(date) => date?.toLocaleDateString('ar-SA') || ''}
      />

      <DatePicker
        label="تاريخ انتهاء الصلاحية (اختياري)"
        value={form.expiryDate ? new Date(form.expiryDate) : undefined}
        onSelectDate={(date) => setForm({ ...form, expiryDate: date?.toISOString() || '' })}
        formatDate={(date) => date?.toLocaleDateString('ar-SA') || ''}
        placeholder="اترك فارغاً إذا كان الإشعار دائماً"
      />

      <TextField
        label="رابط مرفق (اختياري)"
        value={form.attachmentUrl}
        onChange={(_, v) => setForm({ ...form, attachmentUrl: v || '' })}
        placeholder="https://example.com/document.pdf"
      />

      <Toggle
        label="الإشعار نشط"
        checked={form.isActive}
        onText="نعم"
        offText="لا"
        onChange={(_, checked) => setForm({ ...form, isActive: checked || false })}
      />

      <MessageBar messageBarType={MessageBarType.warning}>
        <strong>تنبيه:</strong> بعد حفظ الإشعار، سيظهر فوراً للمدارس المستهدفة في أيقونة الجرس 🔔
      </MessageBar>

      <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: 16 }}>
        <PrimaryButton
          text="حفظ الإشعار"
          iconProps={{ iconName: 'Save' }}
          onClick={() => onSave(form)}
          disabled={!form.Title || !form.message}
        />
        <DefaultButton text="إلغاء" onClick={onCancel} />
      </Stack>
    </Stack>
  )
}

export default AdminPanel
