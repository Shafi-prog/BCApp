import React, { useState, useEffect } from 'react'
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  IGroup,
  PrimaryButton,
  DefaultButton,
  Panel,
  TextField,
  Dropdown,
  Stack,
  MessageBar,
  MessageBarType,
  IconButton,
  Spinner,
  PanelType,
  IDropdownOption,
  Toggle,
  ComboBox,
  IComboBoxOption,
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { SharePointService, Incident } from '../services/sharepointService'
import { AdminDataService } from '../services/adminDataService'
import { SBC_Incidents_LogService } from '../generated/services/SBC_Incidents_LogService'
import { getColumnConfig, ColumnType, renderDate } from '../config/tableConfig'
import { allRiskLevels, categoryToRiskLevelMapping, getAlertTypeForRiskLevel } from '../config/incidentConfig'

/**
 * All dropdown options for incident management are now loaded dynamically from SharePoint
 * This ensures cyber compliance - no hardcoded data in the app
 * 
 * Form Phases (matching SharePoint columns):
 * Phase 1 - During Incident:
 *   - Title, IncidentCategory, RiskLevel, AlertModelType, ActivationTime
 *   - HazardDescription, ActivatedAlternative, AltLocation (conditional)
 *   - CoordinatedEntities (multi-select), CommunicationDone
 * 
 * Phase 2 - After First Phase:
 *   - ClosureTime
 * 
 * Phase 3 - Learning:
 *   - Challenges, LessonsLearned, Suggestions, IncidentNumber
 */

const Incidents: React.FC = () => {
  const { user } = useAuth()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [filteredItems, setFilteredItems] = useState<Incident[]>([])
  const [incidentGroups, setIncidentGroups] = useState<IGroup[]>([])
  const [selectedLetter, setSelectedLetter] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none')
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)
  
  // Dynamic dropdown options state
  const [incidentCategoryOptions, setIncidentCategoryOptions] = useState<IDropdownOption[]>([])
  const [riskLevelOptions, setRiskLevelOptions] = useState<IDropdownOption[]>([])
  const [filteredRiskLevelOptions, setFilteredRiskLevelOptions] = useState<IDropdownOption[]>([])
  const [alertModelTypeOptions, setAlertModelTypeOptions] = useState<IDropdownOption[]>([])
  const [activatedAlternativeOptions, setActivatedAlternativeOptions] = useState<IDropdownOption[]>([])
  const [coordinatedEntitiesOptions, setCoordinatedEntitiesOptions] = useState<IDropdownOption[]>([])

  const [altLocationOptions, setAltLocationOptions] = useState<IComboBoxOption[]>([])
  const [mutualSchools, setMutualSchools] = useState<string[]>([])
  
  // Multi-select state for CoordinatedEntities
  const [selectedEntities, setSelectedEntities] = useState<string[]>([])
  
  const [form, setForm] = useState<Partial<Incident>>({
    Title: '',
    IncidentCategory: '',
    ActivatedAlternative: '',
    RiskLevel: '',
    ActivationTime: '',
    AlertModelType: '',
    HazardDescription: '',
    CoordinatedEntities: '',
    AltLocation: '',
    CommunicationDone: false,
    ClosureTime: '',
    Challenges: '',
    LessonsLearned: '',
    Suggestions: '',
    UnifiedSupportTicketNumber: undefined,
  })

  // Helper function to convert SharePoint response to dropdown options
  const toDropdownOptions = (data: any): IDropdownOption[] => {
    if (!data || !Array.isArray(data)) return []
    return data.map((item: any) => ({
      key: item.Value || item,
      text: item.Value || item,
    }))
  }

  // Load dropdown options from SharePoint
  const loadDropdownOptions = async () => {
    try {
      console.log('[Incidents] Loading dropdown options from SharePoint...')
      
      const [
        incidentCategoryRes,
        riskLevelRes,
        alertModelTypeRes,
        activatedAlternativeRes,
        coordinatedEntitiesRes,
        altLocationRes,
      ] = await Promise.all([
        SBC_Incidents_LogService.getReferencedEntity('', 'IncidentCategory'),
        SBC_Incidents_LogService.getReferencedEntity('', 'RiskLevel'),
        SBC_Incidents_LogService.getReferencedEntity('', 'AlertModelType'),
        SBC_Incidents_LogService.getReferencedEntity('', 'ActivatedAlternative'),
        SBC_Incidents_LogService.getReferencedEntity('', 'CoordinatedEntities'),
        SBC_Incidents_LogService.getReferencedEntity('', 'AltLocation'),
      ])

      // Process each dropdown and log results
      const processField = (fieldName: string, res: any, setter: (opts: IDropdownOption[]) => void) => {
        if (res.data) {
          const opts = toDropdownOptions((res.data as any)?.value)
          if (opts.length > 0) {
            console.log(`[Incidents] ✓ Loaded ${opts.length} options for ${fieldName}:`, opts.map(o => o.text))
            setter(opts)
          } else {
            console.warn(`[Incidents] ⚠ ZERO VALUES for ${fieldName} from SharePoint!`)
          }
        } else {
          console.warn(`[Incidents] ⚠ No data returned for ${fieldName}`)
        }
      }

      processField('IncidentCategory', incidentCategoryRes, setIncidentCategoryOptions)
      processField('RiskLevel', riskLevelRes, setRiskLevelOptions)
      processField('AlertModelType', alertModelTypeRes, setAlertModelTypeOptions)
      processField('ActivatedAlternative', activatedAlternativeRes, setActivatedAlternativeOptions)
      processField('CoordinatedEntities', coordinatedEntitiesRes, setCoordinatedEntitiesOptions)
      
      // Process AltLocation as ComboBox options
      if (altLocationRes.data) {
        const opts = toDropdownOptions((altLocationRes.data as any)?.value)
        if (opts.length > 0) {
          setAltLocationOptions(opts.map(o => ({ key: o.key, text: o.text })))
        }
      }
      
      // Load mutual operation schools for current school
      if (user?.schoolName) {
        try {
          const mutualOps = await AdminDataService.getMutualOperations()
          const schoolMutualSchools = mutualOps
            .filter(op => op.sourceSchool === user.schoolName)
            .map(op => op.school)
          setMutualSchools(schoolMutualSchools)
          console.log(`[Incidents] Loaded ${schoolMutualSchools.length} mutual schools for ${user.schoolName}`)
        } catch (e) {
          console.error('[Incidents] Error loading mutual schools:', e)
        }
      }
      
      console.log('Dropdown options loaded successfully from SharePoint')
    } catch (error) {
      console.error('Error loading dropdown options from SharePoint:', error)
      // No fallback - all data must come from SharePoint for cyber compliance
      // If SharePoint is unavailable, the app will show empty dropdowns and error message
      setMessage({
        type: MessageBarType.error,
        text: 'خطأ في الاتصال بـ SharePoint - تعذر تحميل خيارات الإنشاء'
      })
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'حرج': return '#d32f2f'
      case 'مرتفع': return '#f57c00'
      case 'متوسط': return '#fbc02d'
      case 'منخفض': return '#388e3c'
      default: return '#666'
    }
  }

  // Build columns - admin sees school name column
  const getColumns = (): IColumn[] => {
    const cols: IColumn[] = []
    
    // Admin sees school name column first
    if (user?.type === 'admin') {
      cols.push({
        ...getColumnConfig(ColumnType.SHORT_TEXT),
        key: 'SchoolName_Ref',
        name: 'المدرسة',
        fieldName: 'SchoolName_Ref',
        onRender: (item: Incident) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {item.SchoolName_Ref || '-'}
          </div>
        ),
      })
    }
    
    cols.push({ 
      ...getColumnConfig(ColumnType.MEDIUM_TEXT),
      key: 'Title', 
      name: 'العنوان', 
      fieldName: 'Title', 
      onRender: (item: Incident) => (
        <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {item.Title}
        </div>
      ),
    },
    { 
      ...getColumnConfig(ColumnType.SHORT_TEXT),
      key: 'IncidentCategory', 
      name: 'التصنيف', 
      fieldName: 'IncidentCategory', 
      onRender: (item: Incident) => (
        <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {item.IncidentCategory}
        </div>
      ),
    },
    { 
      ...getColumnConfig(ColumnType.STATUS),
      key: 'RiskLevel', 
      name: 'مستوى الخطر', 
      fieldName: 'RiskLevel', 
      onRender: (item: Incident) => (
        <div style={{ textAlign: 'center', width: '100%' }}>
          <span style={{ 
            padding: '2px 8px', 
            borderRadius: 4, 
            backgroundColor: getRiskLevelColor(item.RiskLevel || ''),
            color: 'white',
            fontSize: 11 
          }}>
            {item.RiskLevel}
          </span>
        </div>
      )
    },
    { 
      ...getColumnConfig(ColumnType.SHORT_TEXT),
      key: 'AlertModelType', 
      name: 'المؤشر', 
      fieldName: 'AlertModelType', 
      onRender: (item: Incident) => {
        const alertType = item.AlertModelType || ''
        let bgColor = '#666'
        if (alertType.includes('أخضر')) bgColor = '#4caf50'
        else if (alertType.includes('أصفر')) bgColor = '#ff9800'
        else if (alertType.includes('أحمر')) bgColor = '#d83b01'
        return (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <span style={{ 
              padding: '2px 8px', 
              borderRadius: 4, 
              backgroundColor: bgColor,
              color: 'white',
              fontSize: 11 
            }}>
              {alertType.split(' ')[0]}
            </span>
          </div>
        )
      }
    },
    { 
      ...getColumnConfig(ColumnType.SHORT_TEXT),
      key: 'ActivatedAlternative', 
      name: 'البديل', 
      fieldName: 'ActivatedAlternative', 
      onRender: (item: Incident) => (
        <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {item.ActivatedAlternative}
        </div>
      ),
    },
    { 
      ...getColumnConfig(ColumnType.DATE),
      key: 'Created', 
      name: 'التاريخ', 
      fieldName: 'Created', 
      onRender: (item: Incident) => renderDate(item.Created)
    },
    {
      ...getColumnConfig(ColumnType.ACTIONS),
      key: 'actions',
      name: 'الإجراءات',
      fieldName: 'actions',
      onRender: (item: Incident) => (
        <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="center">
          <IconButton
            iconProps={{ iconName: 'Edit', styles: { root: { fontSize: 16, fontWeight: 600 } } }}
            onClick={() => onEdit(item)}
            title="تعديل"
            ariaLabel="تعديل"
            styles={{ 
              root: { 
                color: '#0078d4',
                backgroundColor: '#e6f2ff',
                borderRadius: 4,
                width: 32,
                height: 32,
              },
              rootHovered: { backgroundColor: '#cce4ff' },
              icon: { color: '#0078d4', fontSize: 16 }
            }}
          />
          <IconButton
            iconProps={{ iconName: 'Delete', styles: { root: { fontSize: 16, fontWeight: 600 } } }}
            onClick={() => onDelete(item.Id!)}
            title="حذف"
            ariaLabel="حذف"
            styles={{ 
              root: { 
                color: '#d83b01',
                backgroundColor: '#fce8e6',
                borderRadius: 4,
                width: 32,
                height: 32,
              },
              rootHovered: { backgroundColor: '#f5d0cc' },
              icon: { color: '#d83b01', fontSize: 16 }
            }}
          />
        </Stack>
      ),
    })
    
    return cols
  }

  const columns = getColumns()

  useEffect(() => {
    if (user !== undefined) {
      loadIncidents()
      loadDropdownOptions()
    }
  }, [user])

  const loadIncidents = async () => {
    setLoading(true)
    try {
      const schoolName = user?.type === 'admin' ? undefined : user?.schoolName
      const data = await SharePointService.getIncidents(schoolName)
      setIncidents(data)
      // Create groups for admin view
      if (user?.type === 'admin') {
        const result = createIncidentGroups(data)
        setFilteredItems(result.items)
        setIncidentGroups(result.groups)
      } else {
        setFilteredItems(data)
      }
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل تحميل الحوادث: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  // Create groups by school name for admin view
  const createIncidentGroups = (data: Incident[]): { items: Incident[], groups: IGroup[] } => {
    const schoolMap = new Map<string, Incident[]>()
    data.forEach(item => {
      const schoolName = item.SchoolName_Ref || 'غير محدد'
      if (!schoolMap.has(schoolName)) {
        schoolMap.set(schoolName, [])
      }
      schoolMap.get(schoolName)!.push(item)
    })

    const groupedItems: Incident[] = []
    const groups: IGroup[] = []
    let startIndex = 0

    // Sort schools alphabetically
    const sortedSchools = Array.from(schoolMap.keys()).sort((a, b) => a.localeCompare(b, 'ar'))

    sortedSchools.forEach(schoolName => {
      const schoolItems = schoolMap.get(schoolName)!
      groups.push({
        key: schoolName,
        name: `${schoolName} (${schoolItems.length})`,
        startIndex,
        count: schoolItems.length,
        isCollapsed: true,
      })
      groupedItems.push(...schoolItems)
      startIndex += schoolItems.length
    })

    return { items: groupedItems, groups }
  }

  const applySorting = (data: Incident[]) => {
    if (sortOrder === 'none') return data
    return [...data].sort((a, b) => {
      const nameA = a.SchoolName_Ref || ''
      const nameB = b.SchoolName_Ref || ''
      return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'ar') : nameB.localeCompare(nameA, 'ar')
    })
  }

  const sortBySchoolName = (order: 'asc' | 'desc' | 'none') => {
    setSortOrder(order)
    const sorted = applySorting(selectedLetter ? filteredItems : incidents)
    setFilteredItems(sorted)
  }

  const filterByLetter = (letter: string) => {
    setSelectedLetter(letter)
    let filtered = letter ? incidents.filter(item => item.SchoolName_Ref?.startsWith(letter)) : incidents
    filtered = applySorting(filtered)
    setFilteredItems(filtered)
  }

  const onOpen = () => {
    setEditingId(null)
    setFilteredRiskLevelOptions([]) // Clear filtered options for new form
    setSelectedEntities([]) // Clear multi-select
    setForm({
      Title: '',
      IncidentCategory: '',
      ActivatedAlternative: '',
      RiskLevel: '',
      ActivationTime: '',
      AlertModelType: '',
      HazardDescription: '',
      CoordinatedEntities: '',
      AltLocation: '',
      CommunicationDone: false,
      ClosureTime: '',
      Challenges: '',
      LessonsLearned: '',
      Suggestions: '',
      UnifiedSupportTicketNumber: undefined,
    })
    setPanelOpen(true)
  }

  const onEdit = (item: Incident) => {
    setEditingId(item.Id!)
    // Properly copy all fields, converting empty strings to actual values
    setForm({
      ...item,
      UnifiedSupportTicketNumber: item.UnifiedSupportTicketNumber || undefined,
      IncidentCategory: item.IncidentCategory || '',
      RiskLevel: item.RiskLevel || '',
      AlertModelType: item.AlertModelType || '',
      ActivatedAlternative: item.ActivatedAlternative || '',
      AltLocation: item.AltLocation || '',
      CoordinatedEntities: item.CoordinatedEntities || '',
    })
    // Set selected entities for multi-select
    if (item.CoordinatedEntities) {
      setSelectedEntities(item.CoordinatedEntities.split(',').map(e => e.trim()))
    } else {
      setSelectedEntities([])
    }
    // Set filtered risk levels based on the item's category
    const mapping = categoryToRiskLevelMapping[item.IncidentCategory || '']
    if (mapping) {
      const filteredLevels = allRiskLevels.slice(mapping.start, mapping.start + mapping.count)
      const filteredOpts: IDropdownOption[] = filteredLevels.map(level => ({
        key: level,
        text: level,
      }))
      setFilteredRiskLevelOptions(filteredOpts)
    } else {
      setFilteredRiskLevelOptions(riskLevelOptions)
    }
    setPanelOpen(true)
  }

  const onClose = () => {
    setPanelOpen(false)
    setEditingId(null)
  }

  const onSave = async () => {
    console.log('[Incidents] ⚡ onSave called - Starting validation');
    console.log('[Incidents] Form data:', form);
    console.log('[Incidents] Selected entities:', selectedEntities);
    
    // Phase 1 Required Fields Validation
    if (!form.Title) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى إدخال العنوان' })
      return
    }
    if (!form.IncidentCategory) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى اختيار تصنيف الحادث' })
      return
    }
    if (!form.RiskLevel) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى اختيار مستوى الخطر' })
      return
    }
    if (!form.ActivatedAlternative) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى اختيار البديل المفعل' })
      return
    }
    // Conditional: If alternative requires location, validate it
    if (form.ActivatedAlternative === 'نقل العملية التعليمية إلى مدرسة مجاورة' && !form.AltLocation) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى اختيار الموقع البديل (المدرسة المجاورة)' })
      return
    }
    if (!form.ActivationTime) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى إدخال تاريخ التفعيل' })
      return
    }
    if (!form.HazardDescription) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى إدخال وصف الخطر' })
      return
    }
    if (selectedEntities.length === 0) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى اختيار الجهات المنسق معها (جهة واحدة على الأقل)' })
      return
    }
    
    // Date validation: ClosureTime cannot be before ActivationTime
    if (form.ClosureTime && form.ActivationTime) {
      const activationDate = new Date(form.ActivationTime)
      const closureDate = new Date(form.ClosureTime)
      if (closureDate < activationDate) {
        setMessage({ type: MessageBarType.error, text: 'تاريخ استعادة الخدمة لا يمكن أن يكون قبل تاريخ التفعيل' })
        return
      }
    }

    setLoading(true)
    try {
      const incidentData: Incident = {
        ...form,
        Title: form.Title!,
        SchoolName_Ref: user?.schoolName,
        CoordinatedEntities: selectedEntities.join(', '), // Convert array to comma-separated string
      }

      console.log('[Incidents] Saving incident data:', {
        incidentData,
        schoolId: user?.schoolId,
        schoolName: user?.schoolName,
        userType: user?.type
      });

      if (editingId) {
        await SharePointService.updateIncident(editingId, incidentData)
        setMessage({ type: MessageBarType.success, text: 'تم تحديث الحادث بنجاح' })
      } else {
        await SharePointService.createIncident(incidentData, user?.schoolId)
        setMessage({ type: MessageBarType.success, text: 'تم تسجيل الحادث بنجاح' })
      }
      await loadIncidents()
      onClose()
    } catch (e: any) {
      console.error('[Incidents] Save error:', e)
      
      // Try to stringify the error safely
      try {
        console.error('[Incidents] Error details:', JSON.stringify(e, null, 2))
      } catch {
        console.error('[Incidents] Error cannot be stringified')
      }
      
      let errorMessage = 'حدث خطأ غير متوقع'
      
      // Try multiple ways to extract the error message
      if (typeof e === 'string') {
        errorMessage = e
      } else if (e?.message && typeof e.message === 'string' && e.message !== '[object Object]') {
        errorMessage = e.message
      } else if (e?.error?.message && typeof e.error.message === 'string') {
        errorMessage = e.error.message
      } else if (e?.response?.data?.error?.message && typeof e.response.data.error.message === 'string') {
        errorMessage = e.response.data.error.message
      } else if (e?.response?.data?.message && typeof e.response.data.message === 'string') {
        errorMessage = e.response.data.message
      } else if (e?.response?.statusText) {
        errorMessage = `خطأ ${e.response.status}: ${e.response.statusText}`
      } else if (e?.statusText && typeof e.statusText === 'string') {
        errorMessage = e.statusText
      } else if (e?.status) {
        errorMessage = `خطأ في الخادم: ${e.status}`
      } else if (e?.body && typeof e.body === 'string') {
        errorMessage = e.body
      } else if (e?.text && typeof e.text === 'string') {
        errorMessage = e.text
      } else {
        // If all else fails, try to convert to string
        try {
          const errorStr = String(e)
          if (errorStr && errorStr !== '[object Object]') {
            errorMessage = errorStr
          }
        } catch {
          errorMessage = 'حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.'
        }
      }
      
      // Log the data being sent for debugging
      console.error('[Incidents] Failed to save incident data:', {
        editingId,
        title: form.Title,
        category: form.IncidentCategory,
        schoolName: user?.schoolName,
        unifiedSupportTicketNumber: form.UnifiedSupportTicketNumber,
        errorMessage
      })
      
      setMessage({ type: MessageBarType.error, text: `فشل الحفظ: ${errorMessage}` })
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحادث؟')) return

    setLoading(true)
    try {
      await SharePointService.deleteIncident(id)
      setMessage({ type: MessageBarType.success, text: 'تم حذف الحادث بنجاح' })
      await loadIncidents()
    } catch (e: any) {
      console.error('[Incidents] Delete error:', e)
      let errorMessage = 'حدث خطأ غير متوقع'
      
      if (typeof e === 'string') {
        errorMessage = e
      } else if (e?.message) {
        errorMessage = e.message
      } else if (e?.error?.message) {
        errorMessage = e.error.message
      } else if (e?.response?.data?.error?.message) {
        errorMessage = e.response.data.error.message
      } else if (e?.statusText) {
        errorMessage = e.statusText
      }
      
      setMessage({ type: MessageBarType.error, text: `فشل الحذف: ${errorMessage}` })
    } finally {
      setLoading(false)
    }
  }

  // Show loading while waiting for user context
  if (user === undefined) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spinner label="جاري التحميل..." />
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
      <h1 className="page-title" style={{ color: '#d83b01' }}>الإبلاغ عن حالة انقطاع في العملية التعليمية</h1>
      
      {message && (
        <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)} styles={{ root: { marginBottom: 16 } }}>
          {message.text}
        </MessageBar>
      )}

      {loading && <Spinner label="جاري التحميل..." />}

      <Stack horizontal horizontalAlign="start" style={{ marginBottom: 16 }}>
        <PrimaryButton 
          text="تسجيل انقطاع في العملية التعليمية جديد" 
          iconProps={{ iconName: 'Warning' }} 
          onClick={onOpen} 
          disabled={loading}
          styles={{ root: { backgroundColor: '#d83b01' } }}
        />
      </Stack>

      {user?.type === 'admin' && incidents.length > 0 && (
        <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
          <Stack horizontal horizontalAlign="space-between" style={{ marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>ترتيب:</span>
            <Stack horizontal tokens={{ childrenGap: 8 }}>
              <DefaultButton
                text="تصاعدي (أ-ي)"
                iconProps={{ iconName: 'SortUp' }}
                onClick={() => sortBySchoolName('asc')}
                styles={{
                  root: {
                    backgroundColor: sortOrder === 'asc' ? '#008752' : 'white',
                    color: sortOrder === 'asc' ? 'white' : '#333',
                    border: '1px solid #008752',
                  }
                }}
              />
              <DefaultButton
                text="تنازلي (ي-أ)"
                iconProps={{ iconName: 'SortDown' }}
                onClick={() => sortBySchoolName('desc')}
                styles={{
                  root: {
                    backgroundColor: sortOrder === 'desc' ? '#008752' : 'white',
                    color: sortOrder === 'desc' ? 'white' : '#333',
                    border: '1px solid #008752',
                  }
                }}
              />
              <DefaultButton
                text="بدون ترتيب"
                onClick={() => sortBySchoolName('none')}
                styles={{
                  root: {
                    backgroundColor: sortOrder === 'none' ? '#008752' : 'white',
                    color: sortOrder === 'none' ? 'white' : '#333',
                    border: '1px solid #008752',
                  }
                }}
              />
            </Stack>
          </Stack>
          <span style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 14 }}>
            تصفية حسب الحرف الأول لاسم المدرسة:
          </span>
          <Stack horizontal wrap tokens={{ childrenGap: 8 }}>
            <DefaultButton 
              text="الكل"
              onClick={() => filterByLetter('')}
              styles={{
                root: {
                  backgroundColor: selectedLetter === '' ? '#008752' : 'white',
                  color: selectedLetter === '' ? 'white' : '#333',
                  border: '1px solid #008752',
                  minWidth: 40,
                },
                rootHovered: {
                  backgroundColor: selectedLetter === '' ? '#006d42' : '#f0f0f0',
                }
              }}
            />
            {['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'].map(letter => (
              <DefaultButton 
                key={letter}
                text={letter}
                onClick={() => filterByLetter(letter)}
                styles={{
                  root: {
                    backgroundColor: selectedLetter === letter ? '#008752' : 'white',
                    color: selectedLetter === letter ? 'white' : '#333',
                    border: '1px solid #008752',
                    minWidth: 40,
                  },
                  rootHovered: {
                    backgroundColor: selectedLetter === letter ? '#006d42' : '#f0f0f0',
                  }
                }}
              />
            ))}
          </Stack>
          {selectedLetter && (
            <span style={{ display: 'block', marginTop: 8, color: '#666', fontSize: 12 }}>
              عرض {filteredItems.length} حادث يبدأ اسم المدرسة بحرف "{selectedLetter}"
            </span>
          )}
        </div>
      )}

      <div className="card">
        <DetailsList
          items={filteredItems}
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
          groups={user?.type === 'admin' ? incidentGroups : undefined}
          groupProps={{
            showEmptyGroups: false,
          }}
        />
        {filteredItems.length === 0 && !loading && (
          <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
            لا توجد حوادث مسجلة حالياً
          </div>
        )}
      </div>

      <Panel
        isOpen={panelOpen}
        onDismiss={onClose}
        headerText={editingId ? 'تعديل الانقطاع' : 'تسجيل انقطاع في العملية التعليمية جديد'}
        type={PanelType.medium}
        isFooterAtBottom={true}
        onRenderFooterContent={() => (
          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <PrimaryButton text="حفظ" onClick={onSave} disabled={loading} />
            <DefaultButton text="إلغاء" onClick={onClose} disabled={loading} />
          </Stack>
        )}
      >
        <div style={{ padding: 16 }}>
          {/* ========== المرحلة الأولى: أثناء الحادث ========== */}
          <div style={{ 
            backgroundColor: '#fff4e5', 
            border: '2px solid #d83b01', 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 20 
          }}>
            <h3 style={{ color: '#d83b01', margin: '0 0 16px 0', borderBottom: '1px solid #d83b01', paddingBottom: 8 }}>
              🔴 المرحلة الأولى: أثناء الحادث
            </h3>
            
            {/* 1. Title - العنوان */}
            <TextField
              label="العنوان *"
              value={form.Title || ''}
              onChange={(_, v) => setForm({ ...form, Title: v || '' })}
              required
              placeholder="أدخل عنوان الانقطاع"
            />
            
            {/* 2. UnifiedSupportTicketNumber - رقم بلاغ الدعم الموحد */}
            <TextField
              label="رقم بلاغ الدعم الموحد"
              type="number"
              value={form.UnifiedSupportTicketNumber?.toString() || ''}
              onChange={(_, v) => {
                // Only allow numbers
                if (v === '' || v === undefined) {
                  setForm({ ...form, UnifiedSupportTicketNumber: undefined })
                } else {
                  const numValue = parseInt(v)
                  if (!isNaN(numValue) && numValue >= 0) {
                    setForm({ ...form, UnifiedSupportTicketNumber: numValue })
                  }
                }
              }}
              onGetErrorMessage={(value) => {
                if (value && !/^\d+$/.test(value)) {
                  return 'يرجى إدخال أرقام فقط'
                }
                return ''
              }}
              validateOnFocusOut
              validateOnLoad={false}
              styles={{ root: { marginTop: 12 } }}
              placeholder="أدخل رقم البلاغ (أرقام فقط)"
            />
            
            {/* 3. IncidentCategory - تصنيف الحادث */}
            <Dropdown
              label="تصنيف الحادث *"
              selectedKey={form.IncidentCategory || undefined}
              options={incidentCategoryOptions}
              placeholder={incidentCategoryOptions.length === 0 ? "جاري التحميل..." : "اختر تصنيف الحادث"}
              disabled={incidentCategoryOptions.length === 0}
              onChange={(_, option) => {
                const category = option?.key as string || ''
                const mapping = categoryToRiskLevelMapping[category]
                if (mapping) {
                  const filteredLevels = allRiskLevels.slice(mapping.start, mapping.start + mapping.count)
                  const filteredOpts: IDropdownOption[] = filteredLevels.map(level => ({
                    key: level,
                    text: level,
                  }))
                  setFilteredRiskLevelOptions(filteredOpts)
                } else {
                  setFilteredRiskLevelOptions(riskLevelOptions)
                }
                setForm({ ...form, IncidentCategory: category, RiskLevel: '', AlertModelType: '' })
              }}
              required
              styles={{ root: { marginTop: 12 } }}
            />
            
            {/* 3. ActivatedAlternative - البديل المفعل */}
            <Dropdown
              label="البديل المفعل *"
              selectedKey={form.ActivatedAlternative}
              options={activatedAlternativeOptions}
              onChange={(_, option) => {
                const alt = option?.key as string || ''
                setForm({ 
                  ...form, 
                  ActivatedAlternative: alt,
                  // Clear AltLocation if different alternative selected
                  AltLocation: alt === 'نقل العملية التعليمية إلى مدرسة مجاورة' ? form.AltLocation : ''
                })
              }}
              required
              styles={{ root: { marginTop: 12 } }}
              placeholder="اختر البديل المفعل"
            />
            
            {/* 4. AltLocation - الموقع البديل (Conditional - only when نقل العملية التعليمية إلى مدرسة مجاورة) */}
            {form.ActivatedAlternative === 'نقل العملية التعليمية إلى مدرسة مجاورة' && (
              <div style={{ 
                backgroundColor: '#f0f9ff', 
                padding: 12, 
                borderRadius: 8, 
                marginTop: 12,
                border: '1px solid #0078d4' 
              }}>
                <ComboBox
                  label="🏢 الموقع البديل (المدرسة المجاورة) *"
                  selectedKey={form.AltLocation}
                  options={[
                    // Show mutual schools at top with star prefix
                    ...mutualSchools.map(school => ({
                      key: school,
                      text: `⭐ ${school} (مدرسة متبادلة)`,
                    })),
                    // Then show all other locations
                    ...altLocationOptions.filter(opt => !mutualSchools.includes(opt.key as string))
                  ]}
                  onChange={(_, option) => setForm({ ...form, AltLocation: option?.key as string || '' })}
                  allowFreeform
                  autoComplete="on"
                  placeholder="ابحث أو اختر المدرسة البديلة"
                  styles={{ root: { marginTop: 8 } }}
                />
                {mutualSchools.length > 0 && (
                  <div style={{ fontSize: 12, color: '#0078d4', marginTop: 4 }}>
                    ⭐ المدارس المتبادلة تظهر في الأعلى
                  </div>
                )}
              </div>
            )}
            
            {/* 5. RiskLevel - مستوى الخطر */}
            <Dropdown
              label="مستوى الخطر *"
              selectedKey={form.RiskLevel}
              options={filteredRiskLevelOptions.length > 0 ? filteredRiskLevelOptions : riskLevelOptions}
              onChange={(_, option) => {
                const riskLevel = option?.key as string || ''
                const alertType = getAlertTypeForRiskLevel(riskLevel, form.IncidentCategory || '')
                setForm({ ...form, RiskLevel: riskLevel, AlertModelType: alertType })
              }}
              required
              styles={{ root: { marginTop: 12 } }}
              disabled={!form.IncidentCategory}
              placeholder={!form.IncidentCategory ? 'اختر تصنيف الحادث أولاً' : 'اختر مستوى الخطر'}
            />
            
            {/* 6. ActivationTime - وقت التفعيل */}
            <TextField
              label="تاريخ التفعيل *"
              type="date"
              value={form.ActivationTime ? form.ActivationTime.split('T')[0] : ''}
              onChange={(_, v) => setForm({ ...form, ActivationTime: v || '' })}
              required
              styles={{ root: { marginTop: 12 } }}
            />
            
            {/* 7. AlertModelType - نوع التنبيه (auto-calculated) */}
            <div style={{ marginTop: 12 }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 4 }}>نوع التنبيه</label>
              <div style={{ 
                padding: '8px 12px', 
                borderRadius: 4, 
                backgroundColor: form.AlertModelType?.includes('أخضر') ? '#dff6dd' : 
                                 form.AlertModelType?.includes('أصفر') ? '#fff4ce' : 
                                 form.AlertModelType?.includes('أحمر') ? '#fde7e9' : '#f3f2f1',
                border: `1px solid ${form.AlertModelType?.includes('أخضر') ? '#107c10' : 
                                     form.AlertModelType?.includes('أصفر') ? '#ffb900' : 
                                     form.AlertModelType?.includes('أحمر') ? '#d83b01' : '#c8c6c4'}`,
                color: form.AlertModelType?.includes('أخضر') ? '#107c10' : 
                       form.AlertModelType?.includes('أصفر') ? '#835c00' : 
                       form.AlertModelType?.includes('أحمر') ? '#a4262c' : '#605e5c',
                fontWeight: 600,
                minHeight: 32,
                display: 'flex',
                alignItems: 'center'
              }}>
                {form.AlertModelType || 'يتم تحديده تلقائياً بناءً على مستوى الخطر'}
              </div>
            </div>
            
            {/* 8. HazardDescription - وصف الخطر */}
            <TextField
              label="وصف الخطر *"
              value={form.HazardDescription || ''}
              onChange={(_, v) => setForm({ ...form, HazardDescription: v || '' })}
              multiline
              rows={3}
              required
              styles={{ root: { marginTop: 12 } }}
            />
            
            {/* 9. CoordinatedEntities - الجهات المنسق معها (Multi-Select) */}
            <Dropdown
              label="الجهات المنسق معها *"
              selectedKeys={selectedEntities}
              options={coordinatedEntitiesOptions}
              onChange={(_, option) => {
                if (option) {
                  const key = option.key as string
                  if (option.selected) {
                    setSelectedEntities([...selectedEntities, key])
                  } else {
                    setSelectedEntities(selectedEntities.filter(e => e !== key))
                  }
                }
              }}
              multiSelect
              required
              styles={{ root: { marginTop: 12 } }}
              placeholder="اختر الجهات المنسق معها (يمكن اختيار أكثر من جهة)"
            />
            
            {/* 10. CommunicationDone - التواصل مع أولياء الأمور */}
            <Toggle
              label="التواصل مع أولياء الأمور"
              checked={form.CommunicationDone || false}
              onChange={(_, checked) => setForm({ ...form, CommunicationDone: checked || false })}
              styles={{ root: { marginTop: 12 } }}
            />
          </div>
          
          {/* ========== المرحلة الثانية: بعد المرحلة الأولى ========== */}
          <div style={{ 
            backgroundColor: '#e6f7ff', 
            border: '2px solid #0078d4', 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 20 
          }}>
            <h3 style={{ color: '#0078d4', margin: '0 0 16px 0', borderBottom: '1px solid #0078d4', paddingBottom: 8 }}>
              🔵 المرحلة الثانية: بعد المرحلة الأولى
            </h3>
            
            {/* 12. ClosureTime - وقت استعادة الخدمة */}
            <TextField
              label="تاريخ استعادة الخدمة"
              type="date"
              value={form.ClosureTime ? form.ClosureTime.split('T')[0] : ''}
              onChange={(_, v) => setForm({ ...form, ClosureTime: v || '' })}
            />
          </div>
          
          {/* ========== المرحلة الثالثة: التعلم ========== */}
          <div style={{ 
            backgroundColor: '#e8f5e9', 
            border: '2px solid #107c10', 
            borderRadius: 8, 
            padding: 16 
          }}>
            <h3 style={{ color: '#107c10', margin: '0 0 16px 0', borderBottom: '1px solid #107c10', paddingBottom: 8 }}>
              🟢 المرحلة الثالثة: التعلم
            </h3>
            
            {/* 13. Challenges - التحديات */}
            <TextField
              label="التحديات"
              value={form.Challenges || ''}
              onChange={(_, v) => setForm({ ...form, Challenges: v || '' })}
              multiline
              rows={2}
            />
            
            {/* 14. LessonsLearned - الدروس المستفادة */}
            <TextField
              label="الدروس المستفادة"
              value={form.LessonsLearned || ''}
              onChange={(_, v) => setForm({ ...form, LessonsLearned: v || '' })}
              multiline
              rows={2}
              styles={{ root: { marginTop: 12 } }}
            />
            
            {/* 15. Suggestions - المقترحات */}
            <TextField
              label="المقترحات لتحسين الاستجابة المستقبلية"
              value={form.Suggestions || ''}
              onChange={(_, v) => setForm({ ...form, Suggestions: v || '' })}
              multiline
              rows={2}
              styles={{ root: { marginTop: 12 } }}
            />
          </div>
        </div>
      </Panel>
    </div>
  )
}

export default Incidents
