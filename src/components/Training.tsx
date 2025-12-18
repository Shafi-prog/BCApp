import React, { useState, useEffect } from 'react'
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  PrimaryButton,
  DefaultButton,
  Stack,
  MessageBar,
  MessageBarType,
  Spinner,
  Panel,
  PanelType,
  Dropdown,
  IDropdownOption,
  Text,
  Label,
  Pivot,
  PivotItem,
  TextField,
  DatePicker,
  IconButton,
  Icon,
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { SharePointService, TrainingProgram, TrainingLog, TeamMember } from '../services/sharepointService'
import { Coordination_Programs_CatalogService } from '../generated'
import { getColumnConfig, ColumnType, renderDate } from '../config/tableConfig'

// Default fallback options (used if SharePoint options can't be loaded)
const defaultProviderEntityOptions: IDropdownOption[] = [
  { key: 'إدارة الأمن والسلامة المدرسية', text: 'إدارة الأمن والسلامة المدرسية' },
  { key: 'إدارة التدريب والابتعاث', text: 'إدارة التدريب والابتعاث' },
  { key: 'الدفاع المدني', text: 'الدفاع المدني' },
  { key: 'الهلال الأحمر', text: 'الهلال الأحمر' },
  { key: 'جهة خارجية', text: 'جهة خارجية' },
]

const defaultActivityTypeOptions: IDropdownOption[] = [
  { key: 'ورشة عمل', text: 'ورشة عمل' },
  { key: 'دورة تدريبية', text: 'دورة تدريبية' },
  { key: 'محاضرة', text: 'محاضرة' },
  { key: 'ندوة', text: 'ندوة' },
  { key: 'لقاء', text: 'لقاء' },
]

const defaultTargetAudienceOptions: IDropdownOption[] = [
  { key: 'منسقي الأمن والسلامة', text: 'منسقي الأمن والسلامة' },
  { key: 'قادة المدارس', text: 'قادة المدارس' },
  { key: 'المعلمين', text: 'المعلمين' },
  { key: 'الطلاب', text: 'الطلاب' },
  { key: 'أولياء الأمور', text: 'أولياء الأمور' },
  { key: 'فريق الأمن والسلامة', text: 'فريق الأمن والسلامة' },
]

const defaultExecutionModeOptions: IDropdownOption[] = [
  { key: 'حضوري', text: 'حضوري' },
  { key: 'عن بعد', text: 'عن بعد' },
  { key: 'مدمج', text: 'مدمج' },
]

const defaultCoordinationStatusOptions: IDropdownOption[] = [
  { key: 'تم التنفيذ', text: 'تم التنفيذ' },
  { key: 'قيد التنفيذ', text: 'قيد التنفيذ' },
  { key: 'مخطط', text: 'مخطط' },
  { key: 'ملغي', text: 'ملغي' },
  { key: 'مؤجل', text: 'مؤجل' },
]

// Helper function to convert SharePoint choice values to dropdown options
const toDropdownOptions = (values: any[]): IDropdownOption[] => {
  if (!Array.isArray(values)) return []
  return values.map((v: any) => {
    const text = typeof v === 'string' ? v : (v.Value || v.text || String(v))
    return { key: text, text }
  })
}

const Training: React.FC = () => {
  const { user } = useAuth()
  const isAdmin = user?.type === 'admin'
  
  // Programs state
  const [programs, setPrograms] = useState<TrainingProgram[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  
  // Training log state
  const [trainingLog, setTrainingLog] = useState<TrainingLog[]>([])
  const [loadingLog, setLoadingLog] = useState(false)
  
  // Team members state (for attendee selection)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loadingTeam, setLoadingTeam] = useState(false)
  
  // Registration panel state
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null)
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  
  // Edit panel state
  const [editPanelOpen, setEditPanelOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<TrainingLog | null>(null)
  const [editAttendees, setEditAttendees] = useState<string[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  
  // Admin program management state
  const [programPanelOpen, setProgramPanelOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null)
  const [programForm, setProgramForm] = useState<Partial<TrainingProgram>>({
    Title: '',
    ProviderEntity: '',
    ActivityType: '',
    TargetAudience: '',
    Date: '',
    ExecutionMode: '',
    CoordinationStatus: '',
  })
  const [selectedTargetAudience, setSelectedTargetAudience] = useState<string[]>([])
  const [savingProgram, setSavingProgram] = useState(false)
  
  // Messages
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Dynamic dropdown options from SharePoint
  const [providerEntityOptions, setProviderEntityOptions] = useState<IDropdownOption[]>(defaultProviderEntityOptions)
  const [activityTypeOptions, setActivityTypeOptions] = useState<IDropdownOption[]>(defaultActivityTypeOptions)
  const [targetAudienceOptions, setTargetAudienceOptions] = useState<IDropdownOption[]>(defaultTargetAudienceOptions)
  const [executionModeOptions, setExecutionModeOptions] = useState<IDropdownOption[]>(defaultExecutionModeOptions)
  const [coordinationStatusOptions, setCoordinationStatusOptions] = useState<IDropdownOption[]>(defaultCoordinationStatusOptions)

  // Load dropdown options from SharePoint
  const loadDropdownOptions = async () => {
    try {
      console.log('[Training] Loading dropdown options from SharePoint...')
      
      // Load all choice field options in parallel
      const [providerResult, activityResult, targetResult, executionResult, statusResult] = await Promise.all([
        Coordination_Programs_CatalogService.getReferencedEntity('', 'ProviderEntity').catch(e => { console.warn('ProviderEntity:', e); return null }),
        Coordination_Programs_CatalogService.getReferencedEntity('', 'ActivityType').catch(e => { console.warn('ActivityType:', e); return null }),
        Coordination_Programs_CatalogService.getReferencedEntity('', 'TargetAudience').catch(e => { console.warn('TargetAudience:', e); return null }),
        Coordination_Programs_CatalogService.getReferencedEntity('', 'ExecutionMode').catch(e => { console.warn('ExecutionMode:', e); return null }),
        Coordination_Programs_CatalogService.getReferencedEntity('', 'CoordinationStatus').catch(e => { console.warn('CoordinationStatus:', e); return null }),
      ])
      
      // Update options if successfully loaded from SharePoint
      if (providerResult?.success && providerResult.data) {
        const options = toDropdownOptions(providerResult.data as any[])
        if (options.length > 0) setProviderEntityOptions(options)
        console.log('[Training] ProviderEntity options:', options)
      }
      
      if (activityResult?.success && activityResult.data) {
        const options = toDropdownOptions(activityResult.data as any[])
        if (options.length > 0) setActivityTypeOptions(options)
        console.log('[Training] ActivityType options:', options)
      }
      
      if (targetResult?.success && targetResult.data) {
        const options = toDropdownOptions(targetResult.data as any[])
        if (options.length > 0) setTargetAudienceOptions(options)
        console.log('[Training] TargetAudience options:', options)
      }
      
      if (executionResult?.success && executionResult.data) {
        const options = toDropdownOptions(executionResult.data as any[])
        if (options.length > 0) setExecutionModeOptions(options)
        console.log('[Training] ExecutionMode options:', options)
      }
      
      if (statusResult?.success && statusResult.data) {
        const options = toDropdownOptions(statusResult.data as any[])
        if (options.length > 0) setCoordinationStatusOptions(options)
        console.log('[Training] CoordinationStatus options:', options)
      }
      
      console.log('[Training] Dropdown options loaded successfully')
    } catch (e) {
      console.error('[Training] Error loading dropdown options:', e)
      // Keep using default options on error
    }
  }

  useEffect(() => {
    loadPrograms()
    loadTrainingLog()
    loadTeamMembers()
    loadDropdownOptions()
  }, [user])

  const loadPrograms = async () => {
    try {
      setLoadingPrograms(true)
      // Load ALL programs from catalog (don't filter by status)
      const data = await SharePointService.getTrainingPrograms(false)
      setPrograms(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPrograms(false)
    }
  }

  const loadTrainingLog = async () => {
    try {
      setLoadingLog(true)
      const schoolName = user?.type === 'admin' ? undefined : user?.schoolName || undefined
      const data = await SharePointService.getTrainingLog(schoolName)
      setTrainingLog(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingLog(false)
    }
  }

  const loadTeamMembers = async () => {
    try {
      setLoadingTeam(true)
      const schoolName = user?.type === 'admin' ? undefined : user?.schoolName || undefined
      const data = await SharePointService.getTeamMembers(schoolName)
      setTeamMembers(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingTeam(false)
    }
  }

  // Check if date is in the past
  const isDatePast = (date?: string): boolean => {
    if (!date) return false
    const programDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return programDate < today
  }

  // Get registration type based on date
  const getRegistrationType = (date?: string): string => {
    return isDatePast(date) ? 'توثيق حضور سابق' : 'طلب تسجيل'
  }

  // Handle registration click - CHECK BC TEAM FIRST (original app logic)
  const handleRegisterClick = (program: TrainingProgram) => {
    setErrorMessage('')
    setSuccessMessage('')

    // Check if user is school type and has no BC team members (original app logic)
    if (user?.type !== 'admin' && teamMembers.length === 0) {
      setErrorMessage('يجب إضافة أعضاء فريق الأمن والسلامة أولاً قبل التسجيل في البرامج التدريبية. يرجى الانتقال إلى صفحة "فريق الأمن والسلامة" وإضافة الأعضاء.')
      return
    }

    // Check if already registered
    if (trainingLog.some(log => log.Program_RefId === program.Id)) {
      setErrorMessage('لقد تم التسجيل في هذا البرنامج مسبقاً')
      return
    }

    setSelectedProgram(program)
    setSelectedAttendees([])
    setPanelOpen(true)
  }

  // Handle save registration
  const handleSaveRegistration = async () => {
    if (!selectedProgram) return

    if (selectedAttendees.length === 0) {
      setErrorMessage('يجب اختيار الحضور من فريق الأمن والسلامة')
      return
    }

    try {
      setSaving(true)
      setErrorMessage('')
      setSuccessMessage('')

      const attendeeIds = selectedAttendees.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      const registrationType = getRegistrationType(selectedProgram.Date)
      const trainingDate = selectedProgram.Date || new Date().toISOString()
      const schoolName = user?.schoolName || 'Unknown School'
      const programName = selectedProgram.Title

      await SharePointService.registerForTraining(
        schoolName,
        selectedProgram.Id || 0,
        attendeeIds,
        user?.schoolId,
        registrationType,
        trainingDate,
        programName
      )

      setSuccessMessage('تم التسجيل بنجاح')
      setPanelOpen(false)
      loadTrainingLog()
    } catch (e: any) {
      console.error('Registration error:', e)
      const errorMsg = e?.message || e?.error || JSON.stringify(e)
      setErrorMessage(`فشل التسجيل: ${errorMsg}`)
    } finally {
      setSaving(false)
    }
  }

  // Handle edit log
  const handleEditLog = (log: TrainingLog) => {
    setEditingLog(log)
    
    // Parse attendees from names
    const attendeeIds: string[] = []
    if (log.AttendeesNames) {
      log.AttendeesNames.split('، ').filter(name => name.trim()).forEach(name => {
        const member = teamMembers.find(m => m.Title === name)
        if (member && member.Id) {
          attendeeIds.push(member.Id.toString())
        }
      })
    }
    
    setEditAttendees(attendeeIds)
    setEditPanelOpen(true)
    setErrorMessage('')
    setSuccessMessage('')
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingLog) return

    if (editAttendees.length === 0) {
      setErrorMessage('يجب اختيار الحضور')
      return
    }

    try {
      setSavingEdit(true)
      setErrorMessage('')

      const attendeeIds = editAttendees.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      await SharePointService.updateTrainingLog(editingLog.Id || 0, { attendeeIds })

      setSuccessMessage('تم تحديث التسجيل بنجاح')
      setEditPanelOpen(false)
      setEditingLog(null)
      loadTrainingLog()
    } catch (e) {
      console.error(e)
      setErrorMessage('فشل تحديث التسجيل')
    } finally {
      setSavingEdit(false)
    }
  }

  // Handle delete log
  const handleDeleteLog = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التسجيل؟')) return

    try {
      setErrorMessage('')
      await SharePointService.deleteTrainingLog(id)
      setSuccessMessage('تم حذف التسجيل بنجاح')
      loadTrainingLog()
    } catch (e) {
      console.error(e)
      setErrorMessage('فشل حذف التسجيل')
    }
  }

  // ========== ADMIN PROGRAM MANAGEMENT ==========
  
  // Open add program panel
  const handleAddProgram = () => {
    setEditingProgram(null)
    setProgramForm({
      Title: '',
      ProviderEntity: '',
      ActivityType: '',
      TargetAudience: '',
      Date: '',
      ExecutionMode: '',
      CoordinationStatus: 'مخطط',
    })
    setSelectedTargetAudience([])
    setProgramPanelOpen(true)
    setErrorMessage('')
    setSuccessMessage('')
  }

  // Open edit program panel
  const handleEditProgram = (program: TrainingProgram) => {
    setEditingProgram(program)
    setProgramForm({
      Title: program.Title,
      ProviderEntity: program.ProviderEntity || '',
      ActivityType: program.ActivityType || '',
      TargetAudience: program.TargetAudience || '',
      Date: program.Date || '',
      ExecutionMode: program.ExecutionMode || '',
      CoordinationStatus: program.CoordinationStatus || '',
    })
    // Parse target audience
    const audiences = (program.TargetAudience || '').split('، ').filter(a => a.trim())
    setSelectedTargetAudience(audiences)
    setProgramPanelOpen(true)
    setErrorMessage('')
    setSuccessMessage('')
  }

  // Save program (create or update)
  const handleSaveProgram = async () => {
    if (!programForm.Title) {
      setErrorMessage('يجب إدخال عنوان البرنامج')
      return
    }

    try {
      setSavingProgram(true)
      setErrorMessage('')

      const programData: TrainingProgram = {
        Title: programForm.Title || '',
        ProviderEntity: programForm.ProviderEntity,
        ActivityType: programForm.ActivityType,
        TargetAudience: selectedTargetAudience.join('، '),
        Date: programForm.Date,
        ExecutionMode: programForm.ExecutionMode,
        CoordinationStatus: programForm.CoordinationStatus,
      }

      if (editingProgram) {
        await SharePointService.updateTrainingProgram(editingProgram.Id || 0, programData)
        setSuccessMessage('تم تحديث البرنامج بنجاح')
      } else {
        await SharePointService.createTrainingProgram(programData)
        setSuccessMessage('تم إضافة البرنامج بنجاح')
      }

      setProgramPanelOpen(false)
      setEditingProgram(null)
      loadPrograms()
    } catch (e) {
      console.error(e)
      setErrorMessage(editingProgram ? 'فشل تحديث البرنامج' : 'فشل إضافة البرنامج')
    } finally {
      setSavingProgram(false)
    }
  }

  // Delete program
  const handleDeleteProgram = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا البرنامج؟')) return

    try {
      setErrorMessage('')
      await SharePointService.deleteTrainingProgram(id)
      setSuccessMessage('تم حذف البرنامج بنجاح')
      loadPrograms()
    } catch (e) {
      console.error(e)
      setErrorMessage('فشل حذف البرنامج')
    }
  }

  // Attendee options for dropdown
  const attendeeOptions: IDropdownOption[] = teamMembers.map(m => ({
    key: m.Id?.toString() || m.Title,
    text: `${m.Title} - ${m.JobRole || 'عضو'}`
  }))

  // Get selected attendee names
  const selectedAttendeeNames = selectedAttendees.map(id => {
    const option = attendeeOptions.find(o => o.key === id)
    return option ? option.text : id
  })

  const editAttendeeNames = editAttendees.map(id => {
    const option = attendeeOptions.find(o => o.key === id)
    return option ? option.text : id
  })

  // Programs columns
  const getProgramColumns = (): IColumn[] => {
    const cols: IColumn[] = [
      { 
        ...getColumnConfig(ColumnType.MEDIUM_TEXT),
        key: 'Title', 
        name: 'البرنامج', 
        fieldName: 'Title', 
        onRender: (item: TrainingProgram) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {item.Title}
          </div>
        )
      },
      { 
        ...getColumnConfig(ColumnType.SHORT_TEXT),
        key: 'ProviderEntity', 
        name: 'الجهة', 
        fieldName: 'ProviderEntity', 
        onRender: (item: TrainingProgram) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {item.ProviderEntity || '-'}
          </div>
        )
      },
      { 
        ...getColumnConfig(ColumnType.SHORT_TEXT),
        key: 'ActivityType', 
        name: 'النوع', 
        fieldName: 'ActivityType', 
        onRender: (item: TrainingProgram) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {item.ActivityType || '-'}
          </div>
        )
      },
      { 
        ...getColumnConfig(ColumnType.LONG_TEXT),
        key: 'TargetAudience', 
        name: 'الفئة', 
        fieldName: 'TargetAudience', 
        onRender: (item: TrainingProgram) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {item.TargetAudience || '-'}
          </div>
        )
      },
      { 
        ...getColumnConfig(ColumnType.DATE),
        key: 'Date', 
        name: 'التاريخ', 
        fieldName: 'Date', 
        onRender: (item: TrainingProgram) => renderDate(item.Date)
      },
      { 
        ...getColumnConfig(ColumnType.SHORT_TEXT),
        key: 'ExecutionMode', 
        name: 'التنفيذ', 
        fieldName: 'ExecutionMode', 
        onRender: (item: TrainingProgram) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {item.ExecutionMode || '-'}
          </div>
        )
      },
    ]

    // Admin sees status and actions
    if (isAdmin) {
      cols.push(
        { 
          ...getColumnConfig(ColumnType.STATUS),
          key: 'CoordinationStatus', 
          name: 'الحالة', 
          fieldName: 'CoordinationStatus', 
          onRender: (item: TrainingProgram) => {
            const status = item.CoordinationStatus || '-'
            const color = status === 'تم التنفيذ' ? '#107c10' : status === 'قيد التنفيذ' ? '#0078d4' : status === 'ملغي' ? '#d83b01' : '#666'
            return (
              <div style={{ textAlign: 'center', width: '100%', color, fontWeight: 600 }}>{status}</div>
            )
          }
        },
        { 
          ...getColumnConfig(ColumnType.ACTIONS),
          key: 'adminActions', 
          name: 'الإجراءات', 
          onRender: (item: TrainingProgram) => (
            <Stack horizontal tokens={{ childrenGap: 4 }} style={{ justifyContent: 'center', width: '100%' }}>
              <IconButton
                iconProps={{ iconName: 'Edit' }}
                title="تعديل"
                onClick={() => handleEditProgram(item)}
                styles={{ root: { color: '#0078d4', width: 28, height: 28 }, icon: { fontSize: 14 } }}
              />
              <IconButton
                iconProps={{ iconName: 'Delete' }}
                title="حذف"
                onClick={() => handleDeleteProgram(item.Id || 0)}
                styles={{ root: { color: '#d83b01', width: 28, height: 28 }, icon: { fontSize: 14 } }}
              />
            </Stack>
          )
        }
      )
    }

    // Schools see registration action
    if (!isAdmin) {
      cols.push({ 
        key: 'actions', 
        name: 'التسجيل', 
        minWidth: 90,
        flexGrow: 0,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: TrainingProgram) => {
          const isRegistered = trainingLog.some(log => log.Program_RefId === item.Id)
          const isPast = isDatePast(item.Date)

          return (
            <div style={{ textAlign: 'center', width: '100%' }}>
              {isRegistered ? (
                <span style={{ color: '#008752', fontWeight: 600 }}>✓ مسجل</span>
              ) : (
                <PrimaryButton
                  text={isPast ? 'توثيق حضور' : 'تسجيل'}
                  onClick={() => handleRegisterClick(item)}
                  styles={{
                    root: {
                      backgroundColor: isPast ? '#0078d4' : '#008752',
                      borderColor: isPast ? '#0078d4' : '#008752'
                    }
                  }}
                />
              )}
            </div>
          )
        }
      })
    }

    return cols
  }

  // Training log columns
  const getLogColumns = (): IColumn[] => {
    const cols: IColumn[] = []

    // Admin sees school name
    if (isAdmin) {
      cols.push({ 
        ...getColumnConfig(ColumnType.MEDIUM_TEXT),
        key: 'SchoolName_Ref', 
        name: 'المدرسة', 
        fieldName: 'SchoolName_Ref', 
        onRender: (item: TrainingLog) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {item.SchoolName_Ref || '-'}
          </div>
        )
      })
    }

    cols.push(
      { 
        ...getColumnConfig(ColumnType.MEDIUM_TEXT),
        key: 'Program_Ref', 
        name: 'البرنامج', 
        fieldName: 'Program_Ref', 
        onRender: (item: TrainingLog) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {item.Program_Ref || '-'}
          </div>
        )
      },
      { 
        ...getColumnConfig(ColumnType.SHORT_TEXT),
        key: 'RegistrationType', 
        name: 'نوع التسجيل', 
        fieldName: 'RegistrationType', 
        onRender: (item: TrainingLog) => (
          <div style={{ textAlign: 'center', width: '100%' }}>
            {item.RegistrationType}
          </div>
        )
      },
      { 
        ...getColumnConfig(ColumnType.MULTI_VALUE),
        key: 'AttendeesNames', 
        name: 'الحضور', 
        fieldName: 'AttendeesNames', 
        onRender: (item: TrainingLog) => {
          let names = item.AttendeesNames;
          if (typeof names === 'object' && names !== null) {
            names = (names as any)?.Value || (names as any)?.results?.join('، ') || '-';
          }
          return (
            <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
              {names || '-'}
            </div>
          );
        }
      },
      { 
        ...getColumnConfig(ColumnType.DATE),
        key: 'TrainingDate', 
        name: 'تاريخ التدريب', 
        fieldName: 'TrainingDate', 
        onRender: (item: TrainingLog) => renderDate(item.TrainingDate)
      },
      { 
        ...getColumnConfig(ColumnType.ACTIONS),
        key: 'actions', 
        name: 'الإجراءات', 
        onRender: (item: TrainingLog) => (
          <Stack horizontal tokens={{ childrenGap: 8 }} style={{ justifyContent: 'center', width: '100%' }}>
            <IconButton
              iconProps={{ iconName: 'Edit' }}
              title="تعديل"
              onClick={() => handleEditLog(item)}
              styles={{ root: { color: '#0078d4' } }}
            />
            <IconButton
              iconProps={{ iconName: 'Delete' }}
              title="حذف"
              onClick={() => handleDeleteLog(item.Id || 0)}
              styles={{ root: { color: '#d83b01' } }}
            />
          </Stack>
        )
      }
    )

    return cols
  }

  // Check if schools should see warning
  const showTeamWarning = user?.type !== 'admin' && !loadingTeam && teamMembers.length === 0

  return (
    <div style={{ padding: 32 }}>
      <Stack tokens={{ childrenGap: 12 }}>
        {user?.schoolName && (
          <div style={{ backgroundColor: '#008752', borderRadius: '8px', padding: '16px 24px', color: '#fff', marginBottom: '8px' }}>
            <Text variant="large" style={{ color: '#fff', fontWeight: 600 }}>
              أهلاً - {user.schoolName}
            </Text>
          </div>
        )}

        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <Text variant="xxLarge">
            <strong>بوابة التدريب</strong>
          </Text>
          {isAdmin && (
            <PrimaryButton
              text="إضافة برنامج جديد"
              iconProps={{ iconName: 'Add' }}
              onClick={handleAddProgram}
              styles={{ root: { backgroundColor: '#008752', borderColor: '#008752' } }}
            />
          )}
        </Stack>

        {/* Warning for schools without team members */}
        {showTeamWarning && (
          <MessageBar messageBarType={MessageBarType.warning} isMultiline styles={{ root: { marginBottom: '12px' } }}>
            <strong>تنبيه:</strong> لم يتم تسجيل أعضاء فريق الأمن والسلامة بعد. يجب إضافة أعضاء الفريق أولاً من صفحة "فريق الأمن والسلامة" قبل التمكن من التسجيل في البرامج التدريبية.
          </MessageBar>
        )}

        {/* Error message */}
        {errorMessage && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setErrorMessage('')}>
            {errorMessage}
          </MessageBar>
        )}

        {/* Success message */}
        {successMessage && (
          <MessageBar messageBarType={MessageBarType.success} onDismiss={() => setSuccessMessage('')}>
            {successMessage}
          </MessageBar>
        )}

        {/* Tabs for programs and log */}
        <Pivot>
          <PivotItem headerText={isAdmin ? 'كتالوج البرامج' : 'البرامج المتاحة'}>
            <div className="card" style={{ marginTop: 16, padding: 16 }}>
              {loadingPrograms ? (
                <Spinner label="جارٍ تحميل البرامج..." />
              ) : programs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                  لا توجد برامج متاحة حالياً
                </div>
              ) : (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <DetailsList
                    items={programs}
                    columns={getProgramColumns()}
                    layoutMode={DetailsListLayoutMode.justified}
                    selectionMode={SelectionMode.none}
                    styles={{ root: { width: '100%' } }}
                  />
                </div>
              )}
            </div>
          </PivotItem>

          <PivotItem headerText="السجل التدريبي">
            <div className="card" style={{ marginTop: 16, padding: 16 }}>
              {loadingLog ? (
                <Spinner label="جارٍ تحميل السجل..." />
              ) : trainingLog.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                  {showTeamWarning ? (
                    <div style={{ 
                      padding: '32px', 
                      textAlign: 'center', 
                      backgroundColor: '#fff4ce', 
                      border: '1px solid #ffb900', 
                      borderRadius: '8px' 
                    }}>
                      <Text variant="large" block style={{ marginBottom: '12px', color: '#323130' }}>
                        ⚠️ يجب إضافة أعضاء فريق الأمن والسلامة أولاً
                      </Text>
                      <Text variant="medium" style={{ color: '#605e5c' }}>
                        يرجى الانتقال إلى صفحة "فريق الأمن والسلامة" وإضافة الأعضاء قبل التسجيل في البرامج التدريبية
                      </Text>
                    </div>
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center' }}>
                      <Icon iconName="PageList" style={{ fontSize: 48, color: '#999', marginBottom: 12 }} />
                      <Text variant="large" block style={{ color: '#666' }}>لا يوجد سجل تدريبي</Text>
                      <Text variant="medium" style={{ color: '#999' }}>قم بالتسجيل في البرامج التدريبية من تبويب "البرامج المتاحة"</Text>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <DetailsList
                    items={trainingLog}
                    columns={getLogColumns()}
                    layoutMode={DetailsListLayoutMode.justified}
                    selectionMode={SelectionMode.none}
                    styles={{ root: { width: '100%' } }}
                  />
                </div>
              )}
            </div>
          </PivotItem>
        </Pivot>
      </Stack>

      {/* Registration Panel (for schools) */}
      <Panel
        isOpen={panelOpen}
        onDismiss={() => setPanelOpen(false)}
        headerText={selectedProgram && isDatePast(selectedProgram.Date) ? 'توثيق حضور سابق' : 'تسجيل في البرنامج التدريبي'}
        type={PanelType.medium}
      >
        {selectedProgram && (
          <Stack tokens={{ childrenGap: 16 }} style={{ marginTop: '16px' }}>
            {/* Registration type badge */}
            <div style={{ 
              padding: '8px 16px', 
              backgroundColor: isDatePast(selectedProgram.Date) ? '#deecf9' : '#e8f4e8', 
              borderRadius: '4px', 
              textAlign: 'center' 
            }}>
              <Text variant="medium" style={{ 
                fontWeight: 600, 
                color: isDatePast(selectedProgram.Date) ? '#0078d4' : '#008752' 
              }}>
                {getRegistrationType(selectedProgram.Date)}
              </Text>
            </div>

            {/* Program info */}
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f3f2f1', 
              borderRadius: '8px', 
              borderRight: '4px solid #008752' 
            }}>
              <Text variant="large" block style={{ fontWeight: 600, marginBottom: '12px' }}>
                {selectedProgram.Title}
              </Text>
              <Stack tokens={{ childrenGap: 8 }}>
                <div><strong>الجهة المقدمة:</strong> {selectedProgram.ProviderEntity || '-'}</div>
                <div><strong>نوع النشاط:</strong> {selectedProgram.ActivityType || '-'}</div>
                <div><strong>الفئة المستهدفة:</strong> {selectedProgram.TargetAudience || '-'}</div>
                <div><strong>تاريخ التدريب:</strong> {selectedProgram.Date ? new Date(selectedProgram.Date).toLocaleDateString('ar-SA') : '-'}</div>
                <div><strong>طريقة التنفيذ:</strong> {selectedProgram.ExecutionMode || '-'}</div>
              </Stack>
            </div>

            {/* Attendee selection */}
            <div>
              <Label required>اختيار الحضور من فريق الأمن والسلامة *</Label>
              <Dropdown
                placeholder="اختر الحضور (إلزامي)"
                multiSelect
                options={attendeeOptions}
                selectedKeys={selectedAttendees}
                onChange={(_, option) => {
                  if (option) {
                    setSelectedAttendees(prev => 
                      option.selected 
                        ? [...prev, option.key as string] 
                        : prev.filter(k => k !== option.key)
                    )
                  }
                }}
                styles={{ dropdown: { marginTop: '8px' } }}
                required
              />
              
              {selectedAttendees.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <Label>الحضور المختارون:</Label>
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#e8f4e8', 
                    borderRadius: '4px', 
                    marginTop: '4px' 
                  }}>
                    {selectedAttendeeNames.length > 0 
                      ? `${selectedAttendeeNames.join(' | ')} (${selectedAttendeeNames.length})` 
                      : 'لا يوجد حضور مختارون'}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: '24px' }}>
              <PrimaryButton
                text={isDatePast(selectedProgram.Date) ? 'تأكيد التوثيق' : 'تأكيد التسجيل'}
                onClick={handleSaveRegistration}
                disabled={saving || selectedAttendees.length === 0}
                styles={{
                  root: {
                    backgroundColor: isDatePast(selectedProgram.Date) ? '#0078d4' : '#008752',
                    borderColor: isDatePast(selectedProgram.Date) ? '#0078d4' : '#008752'
                  }
                }}
              />
              <DefaultButton
                text="إلغاء"
                onClick={() => setPanelOpen(false)}
                disabled={saving}
              />
            </Stack>
          </Stack>
        )}
      </Panel>

      {/* Edit Log Panel */}
      <Panel
        isOpen={editPanelOpen}
        onDismiss={() => setEditPanelOpen(false)}
        headerText="تعديل التسجيل التدريبي"
        type={PanelType.medium}
      >
        {editingLog && (
          <Stack tokens={{ childrenGap: 16 }} style={{ marginTop: '16px' }}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f3f2f1', 
              borderRadius: '8px', 
              borderRight: '4px solid #0078d4' 
            }}>
              <Text variant="large" block style={{ fontWeight: 600, marginBottom: '12px' }}>
                {editingLog.Title || editingLog.Program_Ref}
              </Text>
              <Stack tokens={{ childrenGap: 8 }}>
                <div><strong>نوع التسجيل:</strong> {editingLog.RegistrationType || '-'}</div>
                <div><strong>تاريخ التدريب:</strong> {editingLog.TrainingDate ? new Date(editingLog.TrainingDate).toLocaleDateString('ar-SA') : '-'}</div>
              </Stack>
            </div>

            <div>
              <Label required>تعديل الحضور *</Label>
              <Dropdown
                placeholder="اختر الحضور"
                multiSelect
                options={attendeeOptions}
                selectedKeys={editAttendees}
                onChange={(_, option) => {
                  if (option) {
                    setEditAttendees(prev => 
                      option.selected 
                        ? [...prev, option.key as string] 
                        : prev.filter(k => k !== option.key)
                    )
                  }
                }}
                styles={{ dropdown: { marginTop: '8px' } }}
                required
              />
              
              {editAttendees.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <Label>الحضور المختارون ({editAttendees.length}):</Label>
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#deecf9', 
                    borderRadius: '4px', 
                    marginTop: '4px' 
                  }}>
                    {editAttendeeNames.join(' | ')}
                  </div>
                </div>
              )}
            </div>

            <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: '24px' }}>
              <PrimaryButton
                text="تحديث التسجيل"
                onClick={handleSaveEdit}
                disabled={savingEdit || editAttendees.length === 0}
                styles={{ root: { backgroundColor: '#0078d4', borderColor: '#0078d4' } }}
              />
              <DefaultButton
                text="إلغاء"
                onClick={() => setEditPanelOpen(false)}
                disabled={savingEdit}
              />
            </Stack>
          </Stack>
        )}
      </Panel>

      {/* Admin Program Management Panel */}
      <Panel
        isOpen={programPanelOpen}
        onDismiss={() => setProgramPanelOpen(false)}
        headerText={editingProgram ? 'تعديل البرنامج التدريبي' : 'إضافة برنامج تدريبي جديد'}
        type={PanelType.medium}
      >
        <Stack tokens={{ childrenGap: 16 }} style={{ marginTop: '16px' }}>
          <TextField
            label="عنوان البرنامج *"
            value={programForm.Title || ''}
            onChange={(_, val) => setProgramForm({ ...programForm, Title: val || '' })}
            required
          />

          <Dropdown
            label="الجهة المقدمة"
            placeholder="اختر الجهة المقدمة"
            options={providerEntityOptions}
            selectedKey={programForm.ProviderEntity}
            onChange={(_, option) => setProgramForm({ ...programForm, ProviderEntity: option?.key as string || '' })}
          />

          <Dropdown
            label="نوع النشاط"
            placeholder="اختر نوع النشاط"
            options={activityTypeOptions}
            selectedKey={programForm.ActivityType}
            onChange={(_, option) => setProgramForm({ ...programForm, ActivityType: option?.key as string || '' })}
          />

          <Dropdown
            label="الفئة المستهدفة"
            placeholder="اختر الفئة المستهدفة"
            multiSelect
            options={targetAudienceOptions}
            selectedKeys={selectedTargetAudience}
            onChange={(_, option) => {
              if (option) {
                setSelectedTargetAudience(prev => 
                  option.selected 
                    ? [...prev, option.key as string] 
                    : prev.filter(k => k !== option.key)
                )
              }
            }}
          />

          <TextField
            label="تاريخ التدريب"
            type="date"
            value={programForm.Date ? programForm.Date.split('T')[0] : ''}
            onChange={(_, val) => setProgramForm({ ...programForm, Date: val || '' })}
          />

          <Dropdown
            label="طريقة التنفيذ"
            placeholder="اختر طريقة التنفيذ"
            options={executionModeOptions}
            selectedKey={programForm.ExecutionMode}
            onChange={(_, option) => setProgramForm({ ...programForm, ExecutionMode: option?.key as string || '' })}
          />

          <Dropdown
            label="حالة التنسيق"
            placeholder="اختر الحالة"
            options={coordinationStatusOptions}
            selectedKey={programForm.CoordinationStatus}
            onChange={(_, option) => setProgramForm({ ...programForm, CoordinationStatus: option?.key as string || '' })}
          />

          <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: '24px' }}>
            <PrimaryButton
              text={editingProgram ? 'تحديث البرنامج' : 'إضافة البرنامج'}
              onClick={handleSaveProgram}
              disabled={savingProgram || !programForm.Title}
              styles={{ root: { backgroundColor: '#008752', borderColor: '#008752' } }}
            />
            <DefaultButton
              text="إلغاء"
              onClick={() => setProgramPanelOpen(false)}
              disabled={savingProgram}
            />
          </Stack>
        </Stack>
      </Panel>
    </div>
  )
}

export default Training
