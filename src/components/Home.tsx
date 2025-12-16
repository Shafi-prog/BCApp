import React, { useState, useEffect } from 'react'
import {
  Spinner,
  MessageBar,
  MessageBarType,
  Stack,
  Icon,
  ProgressIndicator,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  SearchBox,
  Text,
  Dropdown,
  DefaultButton,
  TextField,
} from '@fluentui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SharePointService, SchoolInfo, TeamMember, Drill, TrainingLog as TrainingLogType } from '../services/sharepointService'

interface DashboardStats {
  teamMembers: number
  trainingsCompleted: number
  drillsConducted: number
  activeIncidents: number
  totalSchools?: number
  schoolsWithTeams?: number
  schoolsWithDrills?: number
  schoolsWithTraining?: number
}

interface SchoolProgress {
  schoolName: string
  teamCount: number
  drillCount: number
  trainingCount: number
  readinessPercent: number
}

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

// Target values for 100% completion
const TARGET_TEAM_MEMBERS = 6
const TARGET_DRILLS = 4
const TARGET_TRAININGS = 4

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null)
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const [schoolProgress, setSchoolProgress] = useState<SchoolProgress[]>([])
  const [filteredProgress, setFilteredProgress] = useState<SchoolProgress[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('readinessPercent')
  const [sortAscending, setSortAscending] = useState<boolean>(false)
  const [readinessFilter, setReadinessFilter] = useState<string>('all')
  const [columnFilters, setColumnFilters] = useState({
    schoolName: '',
    teamCount: '',
    drillCount: '',
    trainingCount: '',
    readinessPercent: '',
  })
  const [stats, setStats] = useState<DashboardStats>({
    teamMembers: 0,
    trainingsCompleted: 0,
    drillsConducted: 0,
    activeIncidents: 0,
    totalSchools: 0,
    schoolsWithTeams: 0,
    schoolsWithDrills: 0,
    schoolsWithTraining: 0,
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [sharedBCPlan, setSharedBCPlan] = useState<SharedBCPlan | null>(null)
  const [schoolRanking, setSchoolRanking] = useState<number | null>(null)

  useEffect(() => {
    // Load shared BC Plan from localStorage
    const savedPlan = localStorage.getItem('bc_shared_plan')
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan) as SharedBCPlan
        if (plan.isPublished) {
          setSharedBCPlan(plan)
        }
      } catch (e) {
        console.error('Error loading BC Plan:', e)
      }
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const isAdmin = user?.type === 'admin'
        const schoolName = isAdmin ? undefined : user?.schoolName

        // Load school info (for school users) or all schools count (for admin)
        const schools = await SharePointService.getSchoolInfo(schoolName)
        
        if (isAdmin) {
          setAllSchools(schools)
          setStats(prev => ({ ...prev, totalSchools: schools.length }))
          
          // Load all data for admin to calculate school progress
          const [allTeamMembers, allDrills, allIncidents, allTrainingLog] = await Promise.all([
            SharePointService.getTeamMembers(),
            SharePointService.getDrills(),
            SharePointService.getIncidents(),
            SharePointService.getTrainingLog(),
          ])
          
          // Calculate per-school progress
          const progressMap = new Map<string, SchoolProgress>()
          
          // Initialize all schools
          schools.forEach(school => {
            progressMap.set(school.SchoolName, {
              schoolName: school.SchoolName,
              teamCount: 0,
              drillCount: 0,
              trainingCount: 0,
              readinessPercent: 0,
            })
          })
          
          // Count team members per school
          allTeamMembers.forEach((member: TeamMember) => {
            const schoolName = member.SchoolName_Ref
            if (schoolName && progressMap.has(schoolName)) {
              const prog = progressMap.get(schoolName)!
              prog.teamCount++
            }
          })
          
          // Count drills per school
          allDrills.forEach((drill: Drill) => {
            const schoolName = drill.SchoolName_Ref
            if (schoolName && progressMap.has(schoolName)) {
              const prog = progressMap.get(schoolName)!
              prog.drillCount++
            }
          })
          
          // Count trainings per school
          allTrainingLog.forEach((log: TrainingLogType) => {
            const schoolName = log.SchoolName_Ref
            if (schoolName && progressMap.has(schoolName)) {
              const prog = progressMap.get(schoolName)!
              prog.trainingCount++
            }
          })
          
          // Calculate readiness percentage
          progressMap.forEach(prog => {
            const teamPercent = Math.min(prog.teamCount / TARGET_TEAM_MEMBERS, 1)
            const drillPercent = Math.min(prog.drillCount / TARGET_DRILLS, 1)
            const trainingPercent = Math.min(prog.trainingCount / TARGET_TRAININGS, 1)
            prog.readinessPercent = Math.round((teamPercent + drillPercent + trainingPercent) / 3 * 100)
          })
          
          const progressArray = Array.from(progressMap.values())
          setSchoolProgress(progressArray)
          setFilteredProgress(progressArray)
          
          // Save top 200 schools leaderboard to localStorage for school view
          const sortedByReadiness = [...progressArray].sort((a, b) => b.readinessPercent - a.readinessPercent)
          const top200 = sortedByReadiness.slice(0, 200).map((p, idx) => ({
            rank: idx + 1,
            schoolName: p.schoolName,
            readinessPercent: p.readinessPercent,
          }))
          localStorage.setItem('bc_top200_leaderboard', JSON.stringify(top200))
          
          // Calculate summary stats
          const schoolsWithTeams = progressArray.filter(p => p.teamCount > 0).length
          const schoolsWithDrills = progressArray.filter(p => p.drillCount > 0).length
          const schoolsWithTraining = progressArray.filter(p => p.trainingCount > 0).length
          
          setStats(prev => ({
            ...prev,
            teamMembers: allTeamMembers.length,
            drillsConducted: allDrills.length,
            activeIncidents: allIncidents.filter(i => i.Status !== 'مغلق').length,
            trainingsCompleted: allTrainingLog.length,
            schoolsWithTeams,
            schoolsWithDrills,
            schoolsWithTraining,
          }))
        } else {
          if (schools.length > 0) {
            setSchoolInfo(schools[0])
          }
          
          // Load ALL schools data to calculate ranking (same as admin)
          const allSchools = await SharePointService.getSchoolInfo()
          const [allTeamMembers, allDrills, allTrainingLog] = await Promise.all([
            SharePointService.getTeamMembers(),
            SharePointService.getDrills(),
            SharePointService.getTrainingLog(),
          ])
          
          // Calculate per-school progress for ranking
          const progressMap = new Map<string, { schoolName: string; readinessPercent: number; teamCount: number; drillCount: number; trainingCount: number }>()
          
          allSchools.forEach(school => {
            progressMap.set(school.SchoolName, {
              schoolName: school.SchoolName,
              teamCount: 0,
              drillCount: 0,
              trainingCount: 0,
              readinessPercent: 0,
            })
          })
          
          allTeamMembers.forEach((member: TeamMember) => {
            const sName = member.SchoolName_Ref
            if (sName && progressMap.has(sName)) {
              progressMap.get(sName)!.teamCount++
            }
          })
          
          allDrills.forEach((drill: Drill) => {
            const sName = drill.SchoolName_Ref
            if (sName && progressMap.has(sName)) {
              progressMap.get(sName)!.drillCount++
            }
          })
          
          allTrainingLog.forEach((log: TrainingLogType) => {
            const sName = log.SchoolName_Ref
            if (sName && progressMap.has(sName)) {
              progressMap.get(sName)!.trainingCount++
            }
          })
          
          // Calculate readiness percentage for each school
          progressMap.forEach(prog => {
            const teamPercent = Math.min(prog.teamCount / TARGET_TEAM_MEMBERS, 1)
            const drillPercent = Math.min(prog.drillCount / TARGET_DRILLS, 1)
            const trainingPercent = Math.min(prog.trainingCount / TARGET_TRAININGS, 1)
            prog.readinessPercent = Math.round((teamPercent + drillPercent + trainingPercent) / 3 * 100)
          })
          
          // Sort by readiness and find school's ranking
          const sortedSchools = Array.from(progressMap.values()).sort((a, b) => b.readinessPercent - a.readinessPercent)
          const schoolRankIndex = sortedSchools.findIndex(s => s.schoolName === schoolName)
          if (schoolRankIndex !== -1 && schoolRankIndex < 200) {
            setSchoolRanking(schoolRankIndex + 1)
          }
          
          // Save top 200 for navigation leaderboard display
          const top200 = sortedSchools.slice(0, 200).map((p, idx) => ({
            rank: idx + 1,
            schoolName: p.schoolName,
            readinessPercent: p.readinessPercent,
          }))
          localStorage.setItem('bc_top200_leaderboard', JSON.stringify(top200))

          // Load stats for single school (from already loaded data)
          const myTeamMembers = allTeamMembers.filter((m: TeamMember) => m.SchoolName_Ref === schoolName)
          const myDrills = allDrills.filter((d: Drill) => d.SchoolName_Ref === schoolName)
          const myTrainingLog = allTrainingLog.filter((t: TrainingLogType) => t.SchoolName_Ref === schoolName)
          const incidents = await SharePointService.getIncidents(schoolName)

          setStats(prev => ({
            ...prev,
            teamMembers: myTeamMembers.length,
            drillsConducted: myDrills.length,
            activeIncidents: incidents.filter(i => i.Status !== 'مغلق').length,
            trainingsCompleted: myTrainingLog.length,
          }))
        }
      } catch (error) {
        setMessage('حدث خطأ أثناء تحميل البيانات')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Filter school progress based on all filters
  useEffect(() => {
    let filtered = [...schoolProgress]
    
    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.schoolName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply readiness filter
    if (readinessFilter === 'ready') {
      filtered = filtered.filter(p => p.readinessPercent >= 100)
    } else if (readinessFilter === 'partial') {
      filtered = filtered.filter(p => p.readinessPercent >= 50 && p.readinessPercent < 100)
    } else if (readinessFilter === 'low') {
      filtered = filtered.filter(p => p.readinessPercent < 50)
    }
    
    // Apply column filters
    if (columnFilters.schoolName) {
      filtered = filtered.filter(p => p.schoolName.includes(columnFilters.schoolName))
    }
    if (columnFilters.teamCount) {
      const val = parseInt(columnFilters.teamCount)
      if (!isNaN(val)) filtered = filtered.filter(p => p.teamCount === val)
    }
    if (columnFilters.drillCount) {
      const val = parseInt(columnFilters.drillCount)
      if (!isNaN(val)) filtered = filtered.filter(p => p.drillCount === val)
    }
    if (columnFilters.trainingCount) {
      const val = parseInt(columnFilters.trainingCount)
      if (!isNaN(val)) filtered = filtered.filter(p => p.trainingCount === val)
    }
    if (columnFilters.readinessPercent) {
      const val = parseInt(columnFilters.readinessPercent)
      if (!isNaN(val)) filtered = filtered.filter(p => p.readinessPercent === val)
    }
    
    setFilteredProgress(filtered)
  }, [searchQuery, schoolProgress, readinessFilter, columnFilters])

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spinner label="جاري تحميل البيانات..." />
      </div>
    )
  }

  const isAdmin = user?.type === 'admin'

  // Handle column sort
  const onColumnClick = (ev: React.MouseEvent<HTMLElement>, column: IColumn): void => {
    const key = column.fieldName || column.key
    const newAscending = sortColumn === key ? !sortAscending : false
    setSortColumn(key)
    setSortAscending(newAscending)
    
    const sortedItems = [...filteredProgress].sort((a, b) => {
      const aVal = (a as any)[key]
      const bVal = (b as any)[key]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return newAscending ? aVal - bVal : bVal - aVal
      }
      return newAscending 
        ? String(aVal).localeCompare(String(bVal), 'ar')
        : String(bVal).localeCompare(String(aVal), 'ar')
    })
    setFilteredProgress(sortedItems)
  }

  // School progress columns for admin view
  const progressColumns: IColumn[] = [
    { 
      key: 'schoolName', 
      name: 'المدرسة', 
      fieldName: 'schoolName', 
      minWidth: 150, 
      maxWidth: 250,
      isResizable: true,
      flexGrow: 1,
      isSorted: sortColumn === 'schoolName',
      isSortedDescending: sortColumn === 'schoolName' && !sortAscending,
      onColumnClick,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: SchoolProgress) => (
        <div style={{ textAlign: 'center', width: '100%' }}>{item.schoolName}</div>
      )
    },
    { 
      key: 'teamCount', 
      name: 'أعضاء الفريق', 
      fieldName: 'teamCount', 
      minWidth: 100, 
      flexGrow: 1,
      isSorted: sortColumn === 'teamCount',
      isSortedDescending: sortColumn === 'teamCount' && !sortAscending,
      onColumnClick,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: SchoolProgress) => (
        <div style={{ textAlign: 'center', width: '100%', color: item.teamCount >= TARGET_TEAM_MEMBERS ? '#107c10' : '#323130' }}>
          {item.teamCount} / {TARGET_TEAM_MEMBERS}
        </div>
      )
    },
    { 
      key: 'drillCount', 
      name: 'التمارين', 
      fieldName: 'drillCount', 
      minWidth: 100, 
      flexGrow: 1,
      isSorted: sortColumn === 'drillCount',
      isSortedDescending: sortColumn === 'drillCount' && !sortAscending,
      onColumnClick,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: SchoolProgress) => (
        <div style={{ textAlign: 'center', width: '100%', color: item.drillCount >= TARGET_DRILLS ? '#107c10' : '#323130' }}>
          {item.drillCount} / {TARGET_DRILLS}
        </div>
      )
    },
    { 
      key: 'trainingCount', 
      name: 'التدريبات', 
      fieldName: 'trainingCount', 
      minWidth: 100, 
      flexGrow: 1,
      isSorted: sortColumn === 'trainingCount',
      isSortedDescending: sortColumn === 'trainingCount' && !sortAscending,
      onColumnClick,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: SchoolProgress) => (
        <div style={{ textAlign: 'center', width: '100%', color: item.trainingCount >= TARGET_TRAININGS ? '#107c10' : '#323130' }}>
          {item.trainingCount} / {TARGET_TRAININGS}
        </div>
      )
    },
    { 
      key: 'readinessPercent', 
      name: 'نسبة الجاهزية', 
      fieldName: 'readinessPercent', 
      minWidth: 120, 
      flexGrow: 1,
      isSorted: sortColumn === 'readinessPercent',
      isSortedDescending: sortColumn === 'readinessPercent' && !sortAscending,
      onColumnClick,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: SchoolProgress) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
          <ProgressIndicator 
            percentComplete={item.readinessPercent / 100} 
            barHeight={6}
            styles={{ 
              root: { width: 60 },
              progressBar: { 
                backgroundColor: item.readinessPercent >= 100 ? '#107c10' : item.readinessPercent >= 50 ? '#0078d4' : '#d83b01' 
              } 
            }} 
          />
          <span style={{ 
            fontWeight: 600, 
            color: item.readinessPercent >= 100 ? '#107c10' : item.readinessPercent >= 50 ? '#0078d4' : '#d83b01'
          }}>
            {item.readinessPercent}%
          </span>
        </div>
      )
    },
  ]

  // Quick action cards for school users (4 at bottom)
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

  // Admin dashboard cards
  const adminDashboardCards = [
    {
      title: 'إجمالي المدارس',
      value: stats.totalSchools || 0,
      icon: 'Org',
      color: '#008752',
      route: '/schoolinfo',
      description: 'المدارس المسجلة في النظام',
    },
    {
      title: 'مدارس لديها فرق',
      value: stats.schoolsWithTeams || 0,
      icon: 'Group',
      color: '#0078d4',
      route: '/team',
      description: `من ${stats.totalSchools || 0} مدرسة`,
    },
    {
      title: 'مدارس نفذت تمارين',
      value: stats.schoolsWithDrills || 0,
      icon: 'TaskList',
      color: '#107c10',
      route: '/drills',
      description: `من ${stats.totalSchools || 0} مدرسة`,
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

  // Render School User Homepage (Original Design)
  if (!isAdmin && schoolInfo) {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 className="page-title" style={{ color: '#008752', marginBottom: 8, fontSize: '1.5rem' }}>
            مرحباً بكم في نظام متابعة استمرارية العملية التعليمية
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            الإدارة العامة للتعليم بمنطقة المدينة المنورة
          </p>
        </div>

        {message && (
          <MessageBar messageBarType={MessageBarType.warning} onDismiss={() => setMessage(null)} styles={{ root: { marginBottom: 16 } }}>
            {message}
          </MessageBar>
        )}

        {/* School Name Banner with Readiness */}
        <div style={{ 
          backgroundColor: '#008752', 
          borderRadius: 12, 
          padding: '20px 24px', 
          color: '#fff', 
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Empty div for balance on the left (appears on right in RTL) */}
          <div style={{ minWidth: 120 }}></div>
          
          {/* School info in center */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <Icon iconName="Education" style={{ fontSize: 32, marginBottom: 8 }} />
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{schoolInfo.SchoolName}</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              <span style={{ opacity: 0.9 }}>الرقم الإحصائي: {schoolInfo.SchoolID || '-'}</span>
              {schoolRanking && (
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 6,
                  backgroundColor: 'rgba(255,215,0,0.25)', 
                  padding: '4px 12px', 
                  borderRadius: 16,
                  fontWeight: 600,
                }}>
                  <span style={{ color: '#FFD700', fontSize: '1.1rem' }}>⭐</span>
                  <span>الترتيب: {schoolRanking}</span>
                </span>
              )}
            </div>
          </div>
          
          {/* Circular progress on the right (appears on left in RTL) */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            minWidth: 120,
          }}>
            {/* Circular progress indicator */}
            <div style={{ 
              position: 'relative',
              width: 90,
              height: 90,
            }}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                {/* Background circle */}
                <circle
                  cx="45"
                  cy="45"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="45"
                  cy="45"
                  r="40"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.round((Math.min(stats.teamMembers / TARGET_TEAM_MEMBERS, 1) + Math.min(stats.trainingsCompleted / TARGET_TRAININGS, 1) + Math.min(stats.drillsConducted / TARGET_DRILLS, 1)) / 3 * 100) * 2.51} 251`}
                  transform="rotate(-90 45 45)"
                />
              </svg>
              {/* Percentage text in center */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '1.2rem',
                fontWeight: 700,
              }}>
                {Math.round((Math.min(stats.teamMembers / TARGET_TEAM_MEMBERS, 1) + Math.min(stats.trainingsCompleted / TARGET_TRAININGS, 1) + Math.min(stats.drillsConducted / TARGET_DRILLS, 1)) / 3 * 100)}%
              </div>
            </div>
            <span style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: 8 }}>نسبة الجاهزية</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20, marginBottom: 24 }}>
          
          {/* School Basic Info Card */}
          <div className="card" style={{ 
            borderRadius: 12, 
            padding: 0, 
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ backgroundColor: '#008752', color: '#fff', padding: '12px 16px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon iconName="School" />
                معلومات المدرسة الأساسية
              </h3>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                  <Icon iconName="Education" style={{ color: '#00a36c', fontSize: 16 }} />
                  <strong>المرحلة:</strong>
                  <span>{schoolInfo.Level || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                  <Icon iconName="People" style={{ color: '#d83b01', fontSize: 16 }} />
                  <strong>النوع:</strong>
                  <span>{schoolInfo.SchoolGender || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                  <Icon iconName="BuildingMultiple" style={{ color: '#107c10', fontSize: 16 }} />
                  <strong>نمط المدرسة:</strong>
                  <span>{schoolInfo.SchoolType || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                  <Icon iconName="Library" style={{ color: '#038387', fontSize: 16 }} />
                  <strong>نوع التعليم:</strong>
                  <span>{schoolInfo.EducationType || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                  <Icon iconName="Clock" style={{ color: '#ca5010', fontSize: 16 }} />
                  <strong>وقت الدراسة:</strong>
                  <span>{schoolInfo.StudyTime || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                  <Icon iconName="Home" style={{ color: '#5c2d91', fontSize: 16 }} />
                  <strong>ملكية المبنى:</strong>
                  <span>{schoolInfo.BuildingOwnership || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info Card */}
          <div className="card" style={{ 
            borderRadius: 12, 
            padding: 0, 
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ backgroundColor: '#0078d4', color: '#fff', padding: '12px 16px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon iconName="Contact" />
                بيانات التواصل
              </h3>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                  <Icon iconName="Contact" style={{ color: '#008752', fontSize: 16 }} />
                  <strong>مدير/ة المدرسة:</strong>
                  <span>{schoolInfo.PrincipalName || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: 8, flexWrap: 'wrap' }}>
                  <Icon iconName="Mail" style={{ color: '#0078d4', fontSize: 16 }} />
                  <strong>البريد الإلكتروني:</strong>
                  <span style={{ wordBreak: 'break-all' }}>{schoolInfo.principalEmail || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                  <Icon iconName="Phone" style={{ color: '#107c10', fontSize: 16 }} />
                  <strong>رقم الجوال:</strong>
                  <span dir="ltr">{schoolInfo.PrincipalPhone || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                  <Icon iconName="MapPin" style={{ color: '#004e8c', fontSize: 16 }} />
                  <strong>القطاع:</strong>
                  <span>{schoolInfo.SectorDescription || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <h2 style={{ color: '#333', marginBottom: 16, fontSize: '1.1rem' }}>
          <Icon iconName="ViewDashboard" style={{ marginLeft: 8 }} />
          لوحة المتابعة
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: 16, 
          marginBottom: 24 
        }}>
          <div
            className="card action-card"
            onClick={() => navigate('/team')}
            style={{ 
              cursor: 'pointer',
              borderTop: '4px solid #008752',
              textAlign: 'center',
              padding: 20,
              borderRadius: 12,
            }}
          >
            <Icon iconName="Group" style={{ fontSize: 32, color: '#008752', marginBottom: 8 }} />
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#008752' }}>{stats.teamMembers}</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>فريق الأمن والسلامة</div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>عدد أعضاء الفريق</div>
          </div>
          <div
            className="card action-card"
            onClick={() => navigate('/training-log')}
            style={{ 
              cursor: 'pointer',
              borderTop: '4px solid #0078d4',
              textAlign: 'center',
              padding: 20,
              borderRadius: 12,
            }}
          >
            <Icon iconName="ReadingMode" style={{ fontSize: 32, color: '#0078d4', marginBottom: 8 }} />
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0078d4' }}>{stats.trainingsCompleted}</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>التدريبات المكتملة</div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>تدريبات هذا العام</div>
          </div>
          <div
            className="card action-card"
            onClick={() => navigate('/drills')}
            style={{ 
              cursor: 'pointer',
              borderTop: '4px solid #107c10',
              textAlign: 'center',
              padding: 20,
              borderRadius: 12,
            }}
          >
            <Icon iconName="TaskList" style={{ fontSize: 32, color: '#107c10', marginBottom: 8 }} />
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#107c10' }}>{stats.drillsConducted}</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>التمارين الفرضية</div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>تمارين منفذة</div>
          </div>
          <div
            className="card action-card"
            onClick={() => navigate('/incidents')}
            style={{ 
              cursor: 'pointer',
              borderTop: `4px solid ${stats.activeIncidents > 0 ? '#d83b01' : '#107c10'}`,
              textAlign: 'center',
              padding: 20,
              borderRadius: 12,
            }}
          >
            <Icon iconName="ShieldAlert" style={{ fontSize: 32, color: stats.activeIncidents > 0 ? '#d83b01' : '#107c10', marginBottom: 8 }} />
            <div style={{ fontSize: '2rem', fontWeight: 700, color: stats.activeIncidents > 0 ? '#d83b01' : '#107c10' }}>{stats.activeIncidents}</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>الحوادث النشطة</div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>حوادث قيد المتابعة</div>
          </div>
        </div>

        {/* Readiness Progress */}
        <div className="card" style={{ marginBottom: 24, borderRadius: 12, padding: 20 }}>
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
                barHeight={8} 
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
                barHeight={8} 
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
                barHeight={8} 
                styles={{ progressBar: { backgroundColor: Math.min((stats.drillsConducted / TARGET_DRILLS) * 100, 100) >= 100 ? '#107c10' : '#107c10' } }} 
              />
            </div>
            <div style={{ marginTop: 8, padding: 16, backgroundColor: '#f3f2f1', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '1rem' }}>نسبة الجاهزية الكلية</span>
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: '1.5rem',
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

        {/* Quick Actions - 4 cards at bottom */}
        <h2 style={{ color: '#333', marginBottom: 16, fontSize: '1.1rem' }}>
          <Icon iconName="LightningBolt" style={{ marginLeft: 8 }} />
          الإجراءات السريعة
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
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
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 12,
                padding: 20,
                borderRadius: 12,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              <div style={{ 
                width: 56, 
                height: 56, 
                borderRadius: '50%', 
                background: `${action.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon iconName={action.icon} style={{ fontSize: 28, color: action.color }} />
              </div>
              <div style={{ fontWeight: 600, color: '#333' }}>{action.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>{action.description}</div>
            </div>
          ))}
        </div>

        {/* Google Map Section - at the bottom */}
        {schoolInfo.Latitude && schoolInfo.Longitude && (
          <div className="card" style={{ 
            borderRadius: 12, 
            padding: 0, 
            overflow: 'hidden',
            marginTop: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ backgroundColor: '#107c10', color: '#fff', padding: '12px 16px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon iconName="MapPin" />
                موقع المدرسة على الخريطة
              </h3>
            </div>
            <div style={{ padding: 0 }}>
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${schoolInfo.Latitude},${schoolInfo.Longitude}&zoom=15`}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              <div style={{ padding: '12px 16px', backgroundColor: '#f3f2f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <strong>الإحداثيات:</strong> {schoolInfo.Latitude}, {schoolInfo.Longitude}
                </span>
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
                  <Icon iconName="NavigateExternalInline" />
                  فتح في خرائط جوجل
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render Admin Dashboard
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title" style={{ color: '#008752', marginBottom: 8 }}>
          لوحة تحكم المشرف
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          الإدارة العامة للتعليم بمنطقة المدينة المنورة - نظرة شاملة على جميع المدارس
        </p>
      </div>

      {message && (
        <MessageBar messageBarType={MessageBarType.warning} onDismiss={() => setMessage(null)} styles={{ root: { marginBottom: 16 } }}>
          {message}
        </MessageBar>
      )}

      {/* Admin Dashboard Cards */}
      <h2 style={{ color: '#333', marginBottom: 16, fontSize: '1.1rem' }}>
        <Icon iconName="ViewDashboard" style={{ marginLeft: 8 }} />
        لوحة المتابعة
      </h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 20, 
        marginBottom: 24 
      }}>
        {adminDashboardCards.map((card, index) => (
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

      {/* Quick Actions for Admin */}
      <h2 style={{ color: '#333', marginBottom: 16, fontSize: '1.1rem' }}>
        <Icon iconName="LightningBolt" style={{ marginLeft: 8 }} />
        الإجراءات السريعة
      </h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: 16,
        marginBottom: 24
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

      {/* Admin Schools Progress Table */}
      <div id="schools-progress-print" className="card" style={{ marginTop: 24 }}>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center" style={{ marginBottom: 16 }}>
          <h2 style={{ color: '#008752', margin: 0, fontSize: '1.1rem' }}>
            <Icon iconName="BarChartVertical" style={{ marginLeft: 8 }} />
            تقدم المدارس ({stats.totalSchools || schoolProgress.length} مدرسة){filteredProgress.length !== schoolProgress.length ? ` - يُعرض ${filteredProgress.length}` : ''}
          </h2>
          <DefaultButton
            iconProps={{ iconName: 'Print' }}
            text="طباعة PDF"
            onClick={() => {
              const printContent = document.getElementById('schools-progress-print')
              if (printContent) {
                const printWindow = window.open('', '_blank')
                if (printWindow) {
                  printWindow.document.write(`
                    <html dir="rtl">
                      <head>
                        <title>تقدم المدارس</title>
                        <style>
                          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; direction: rtl; }
                          .header-title { text-align: center; color: #008752; font-size: 1.4rem; font-weight: 700; margin-bottom: 8px; }
                          .header-subtitle { text-align: center; color: #666; font-size: 1rem; margin-bottom: 20px; border-bottom: 2px solid #008752; padding-bottom: 16px; }
                          h2 { color: #008752; margin-bottom: 16px; }
                          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                          th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
                          th { background-color: #008752; color: white; }
                          tr:nth-child(even) { background-color: #f9f9f9; }
                          .ready { color: #107c10; font-weight: 600; }
                          .partial { color: #0078d4; font-weight: 600; }
                          .low { color: #d83b01; font-weight: 600; }
                          .summary { margin-top: 20px; padding: 16px; background: #f3f2f1; border-radius: 8px; display: flex; gap: 32px; justify-content: center; }
                          .summary-item { text-align: center; }
                          .summary-value { font-size: 1.5rem; font-weight: 700; display: block; }
                          .print-date { text-align: left; color: #666; font-size: 12px; margin-bottom: 16px; }
                        </style>
                      </head>
                      <body>
                        <div class="header-title">نظام استمرارية العملية التعليمية</div>
                        <div class="header-subtitle">قسم المخاطر والالتزام واستمرارية الأعمال</div>
                        <div class="print-date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</div>
                        <h2>تقدم المدارس (${stats.totalSchools || schoolProgress.length} مدرسة)${filteredProgress.length !== schoolProgress.length ? ` - يُعرض ${filteredProgress.length}` : ''}</h2>
                        <table>
                          <thead>
                            <tr>
                              <th>المدرسة</th>
                              <th>أعضاء الفريق</th>
                              <th>التمارين</th>
                              <th>التدريبات</th>
                              <th>نسبة الجاهزية</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${filteredProgress.map(p => `
                              <tr>
                                <td>${p.schoolName}</td>
                                <td>${p.teamCount} / ${TARGET_TEAM_MEMBERS}</td>
                                <td>${p.drillCount} / ${TARGET_DRILLS}</td>
                                <td>${p.trainingCount} / ${TARGET_TRAININGS}</td>
                                <td class="${p.readinessPercent >= 100 ? 'ready' : p.readinessPercent >= 50 ? 'partial' : 'low'}">${p.readinessPercent}%</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                        <div class="summary">
                          <div class="summary-item">
                            <span class="summary-value" style="color: #008752;">${stats.schoolsWithTeams}</span>
                            <span>مدارس لديها فرق</span>
                          </div>
                          <div class="summary-item">
                            <span class="summary-value" style="color: #0078d4;">${stats.schoolsWithDrills}</span>
                            <span>مدارس نفذت تمارين</span>
                          </div>
                          <div class="summary-item">
                            <span class="summary-value" style="color: #107c10;">${stats.schoolsWithTraining}</span>
                            <span>مدارس لديها تدريبات</span>
                          </div>
                          <div class="summary-item">
                            <span class="summary-value" style="color: #d83b01;">${Math.round(schoolProgress.filter(p => p.readinessPercent >= 100).length / (schoolProgress.length || 1) * 100)}%</span>
                            <span>نسبة المدارس الجاهزة</span>
                          </div>
                        </div>
                      </body>
                    </html>
                  `)
                  printWindow.document.close()
                  printWindow.print()
                }
              }
            }}
            styles={{ root: { minWidth: 100 } }}
          />
        </Stack>
        
        {/* Filters - Same line, equal widths */}
        <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center" style={{ marginBottom: 16 }}>
          <SearchBox
            placeholder="ابحث عن مدرسة..."
            value={searchQuery}
            onChange={(_, newValue) => setSearchQuery(newValue || '')}
            styles={{ root: { width: 200 } }}
          />
          <Dropdown
            placeholder="تصفية حسب الجاهزية"
            selectedKey={readinessFilter}
            options={[
              { key: 'all', text: 'الكل' },
              { key: 'ready', text: 'جاهزة (100%)' },
              { key: 'partial', text: 'جاهزة جزئياً (50-99%)' },
              { key: 'low', text: 'غير جاهزة (<50%)' },
            ]}
            onChange={(_, option) => setReadinessFilter(String(option?.key || 'all'))}
            styles={{ root: { width: 200 }, dropdown: { width: 200 } }}
          />
        </Stack>
        
        {/* Column Filters Row */}
        <Stack horizontal tokens={{ childrenGap: 8 }} style={{ marginBottom: 8 }}>
          <TextField
            placeholder="تصفية المدرسة"
            value={columnFilters.schoolName}
            onChange={(_, v) => setColumnFilters({...columnFilters, schoolName: v || ''})}
            styles={{ root: { width: 200 } }}
          />
          <TextField
            placeholder="الفريق (مثال: 3)"
            value={columnFilters.teamCount}
            onChange={(_, v) => setColumnFilters({...columnFilters, teamCount: v || ''})}
            styles={{ root: { width: 100 } }}
          />
          <TextField
            placeholder="التمارين"
            value={columnFilters.drillCount}
            onChange={(_, v) => setColumnFilters({...columnFilters, drillCount: v || ''})}
            styles={{ root: { width: 100 } }}
          />
          <TextField
            placeholder="التدريبات"
            value={columnFilters.trainingCount}
            onChange={(_, v) => setColumnFilters({...columnFilters, trainingCount: v || ''})}
            styles={{ root: { width: 100 } }}
          />
          <TextField
            placeholder="الجاهزية %"
            value={columnFilters.readinessPercent}
            onChange={(_, v) => setColumnFilters({...columnFilters, readinessPercent: v || ''})}
            styles={{ root: { width: 100 } }}
          />
          <DefaultButton
            text="مسح الفلاتر"
            onClick={() => {
              setColumnFilters({ schoolName: '', teamCount: '', drillCount: '', trainingCount: '', readinessPercent: '' })
              setSearchQuery('')
              setReadinessFilter('all')
            }}
            styles={{ root: { minWidth: 80 } }}
          />
        </Stack>
        
        <div style={{ maxHeight: 400, overflowY: 'auto', width: '100%' }}>
          <DetailsList
            items={filteredProgress}
            columns={progressColumns}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            compact
            styles={{ root: { width: '100%' } }}
          />
        </div>
        
        {filteredProgress.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
            لا توجد نتائج
          </div>
        )}
        
        {/* Summary stats */}
        <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f3f2f1', borderRadius: 8 }}>
          <Stack horizontal tokens={{ childrenGap: 100 }} horizontalAlign="center">
            <div style={{ textAlign: 'center' }}>
              <Text variant="xxLarge" style={{ color: '#008752', fontWeight: 700, display: 'block' }}>
                {stats.schoolsWithTeams}
              </Text>
              <Text variant="small" style={{ color: '#666' }}>مدارس لديها فرق</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text variant="xxLarge" style={{ color: '#0078d4', fontWeight: 700, display: 'block' }}>
                {stats.schoolsWithDrills}
              </Text>
              <Text variant="small" style={{ color: '#666' }}>مدارس نفذت تمارين</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text variant="xxLarge" style={{ color: '#107c10', fontWeight: 700, display: 'block' }}>
                {stats.schoolsWithTraining}
              </Text>
              <Text variant="small" style={{ color: '#666' }}>مدارس لديها تدريبات</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text variant="xxLarge" style={{ color: '#d83b01', fontWeight: 700, display: 'block' }}>
                {Math.round(schoolProgress.filter(p => p.readinessPercent >= 100).length / (schoolProgress.length || 1) * 100)}%
              </Text>
              <Text variant="small" style={{ color: '#666' }}>نسبة المدارس الجاهزة</Text>
            </div>
          </Stack>
        </div>
      </div>
    </div>
  )
}

export default Home
