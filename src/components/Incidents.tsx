import React, { useState, useEffect } from 'react'
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
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
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { SharePointService, Incident } from '../services/sharepointService'
import { SBC_Incidents_LogService } from '../generated/services/SBC_Incidents_LogService'

// Full risk level list grouped by incident category
const allRiskLevels = [
  // Group 1: تعطل البنية التحتية (indices 0-2, 3 items)
  'تعذر استخدام المبنى المدرسي ليوم واحد',
  'تعذر استخدام المبنى المدرسي لأكثر من يوم واحد إلى 3 أيام',
  'تعذر استخدام المبنى المدرسي لأكثر من ثلاثة أيام إلى شهر',
  // Group 2: نقص الموارد البشرية (indices 3-6, 4 items)
  'غياب أقل من 30% من المعلمين',
  'غياب أكثر من 30% من المعلمين',
  'غياب أكثر من 60% من المعلمين',
  'غياب كافة المعلمين',
  // Group 3: تعطل الأنظمة/المنصات التعليمية (indices 7-10, 4 items)
  'تعطل الأنظمة لا يزيد عن 8 ساعات',
  'تعطل الأنظمة أكثر من 8 ساعات إلى خمسة أيام',
  'تعطل الأنظمة أكثر من خمسة أيام',
  'تعطل الأنظمة أكثر من أسبوعين',
  // Group 4: تعطل البث التلفزيوني (indices 11-14, 4 items) - same as systems
  'تعطل الأنظمة لا يزيد عن 8 ساعات',
  'تعطل الأنظمة أكثر من 8 ساعات إلى خمسة أيام',
  'تعطل الأنظمة أكثر من خمسة أيام',
  'تعطل الأنظمة أكثر من أسبوعين',
  // Group 5: اضطراب أمني (indices 15-18, 4 items)
  'اضطراب أمني خارج حدود المدرسة يؤثر على استمرار التعليم بالمدرسة ليوم أو أقل',
  'اضطراب أمني يؤثر على استمرار التعليم بالمدرسة لأكثر من يوم إلى 3 أيام',
  'اضطراب أمني يؤثر على استمرار التعليم بالمدرسة لأكثر من ثلاثة أيام إلى أسبوعين',
  'اضطراب أمني يؤثر على استمرار التعليم بالمدرسة لأكثر من أسبوعين',
  // Group 6: فقدان الاتصالات/الإنترنت (indices 19-22, 4 items)
  'انقطاع الاتصالات ليومين أو أقل',
  'انقطاع الاتصالات أكثر من يومين إلى خمسة أيام',
  'انقطاع الاتصالات أكثر من خمسة أيام إلى أسبوعين',
  'انقطاع الاتصالات أكثر من أسبوعين',
]

// Mapping of incident category to risk level indices
const categoryToRiskLevelMapping: { [key: string]: { start: number; count: number } } = {
  'تعطل البنية التحتية': { start: 0, count: 3 },
  'نقص الموارد البشرية': { start: 3, count: 4 },
  'تعطل الأنظمة/المنصات التعليمية': { start: 7, count: 4 },
  'تعطل البث التلفزيوني': { start: 11, count: 4 },
  'اضطراب أمني': { start: 15, count: 4 },
  'فقدان الاتصالات/الإنترنت': { start: 19, count: 4 },
}

// Alert type constants
const ALERT_GREEN = '1. أخضر (نموذج رصد ومراقبة)'
const ALERT_YELLOW = '2. أصفر (نموذج تحذير)'
const ALERT_RED = '3. أحمر (نموذج إنذار)'

// Function to get alert type based on risk level position within its group
const getAlertTypeForRiskLevel = (riskLevel: string, category: string): string => {
  const mapping = categoryToRiskLevelMapping[category]
  if (!mapping) return ''
  
  const groupRiskLevels = allRiskLevels.slice(mapping.start, mapping.start + mapping.count)
  const positionInGroup = groupRiskLevels.indexOf(riskLevel)
  
  if (positionInGroup === -1) return ''
  
  // For 3-item groups (تعطل البنية التحتية)
  if (mapping.count === 3) {
    if (positionInGroup === 0) return ALERT_GREEN
    if (positionInGroup === 1) return ALERT_YELLOW
    if (positionInGroup === 2) return ALERT_RED
  }
  
  // For 4-item groups
  if (mapping.count === 4) {
    if (positionInGroup === 0) return ALERT_GREEN
    if (positionInGroup === 1 || positionInGroup === 2) return ALERT_YELLOW
    if (positionInGroup === 3) return ALERT_RED
  }
  
  return ''
}

const Incidents: React.FC = () => {
  const { user } = useAuth()
  const [incidents, setIncidents] = useState<Incident[]>([])
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
  const [actionTakenOptions, setActionTakenOptions] = useState<IDropdownOption[]>([])
  const [altLocationOptions, setAltLocationOptions] = useState<IDropdownOption[]>([])
  const [schoolOptions, setSchoolOptions] = useState<IDropdownOption[]>([])
  
  const [form, setForm] = useState<Partial<Incident>>({
    Title: '',
    IncidentCategory: '',
    ActivatedAlternative: '',
    RiskLevel: '',
    ActivationTime: '',
    AlertModelType: '',
    HazardDescription: '',
    CoordinatedEntities: '',
    IncidentNumber: '',
    ActionTaken: '',
    AltLocation: '',
    CommunicationDone: false,
    ClosureTime: '',
    Challenges: '',
    LessonsLearned: '',
    Suggestions: '',
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
      console.log('Loading dropdown options from SharePoint...')
      
      const [
        incidentCategoryRes,
        riskLevelRes,
        alertModelTypeRes,
        activatedAlternativeRes,
        coordinatedEntitiesRes,
        actionTakenRes,
        altLocationRes,
      ] = await Promise.all([
        SBC_Incidents_LogService.getReferencedEntity('', 'IncidentCategory'),
        SBC_Incidents_LogService.getReferencedEntity('', 'RiskLevel'),
        SBC_Incidents_LogService.getReferencedEntity('', 'AlertModelType'),
        SBC_Incidents_LogService.getReferencedEntity('', 'ActivatedAlternative'),
        SBC_Incidents_LogService.getReferencedEntity('', 'CoordinatedEntities'),
        SBC_Incidents_LogService.getReferencedEntity('', 'ActionTaken'),
        SBC_Incidents_LogService.getReferencedEntity('', 'AltLocation'),
      ])

      if (incidentCategoryRes.data) {
        const opts = toDropdownOptions((incidentCategoryRes.data as any)?.value)
        if (opts.length > 0) setIncidentCategoryOptions(opts)
      }
      if (riskLevelRes.data) {
        const opts = toDropdownOptions((riskLevelRes.data as any)?.value)
        if (opts.length > 0) setRiskLevelOptions(opts)
      }
      if (alertModelTypeRes.data) {
        const opts = toDropdownOptions((alertModelTypeRes.data as any)?.value)
        if (opts.length > 0) setAlertModelTypeOptions(opts)
      }
      if (activatedAlternativeRes.data) {
        const opts = toDropdownOptions((activatedAlternativeRes.data as any)?.value)
        if (opts.length > 0) setActivatedAlternativeOptions(opts)
      }
      if (coordinatedEntitiesRes.data) {
        const opts = toDropdownOptions((coordinatedEntitiesRes.data as any)?.value)
        if (opts.length > 0) setCoordinatedEntitiesOptions(opts)
      }
      if (actionTakenRes.data) {
        const opts = toDropdownOptions((actionTakenRes.data as any)?.value)
        if (opts.length > 0) setActionTakenOptions(opts)
      }
      if (altLocationRes.data) {
        const opts = toDropdownOptions((altLocationRes.data as any)?.value)
        if (opts.length > 0) setAltLocationOptions(opts)
      }
      
      // Load schools for AltLocation dropdown (when "مدرسة بديلة" is selected)
      try {
        const schools = await SharePointService.getSchoolInfo()
        const schoolOpts: IDropdownOption[] = schools.map(s => ({
          key: s.SchoolName,
          text: s.SchoolName,
        }))
        setSchoolOptions(schoolOpts)
        console.log(`Loaded ${schoolOpts.length} schools for AltLocation dropdown`)
      } catch (schoolError) {
        console.error('Error loading schools for AltLocation:', schoolError)
      }
      
      console.log('Dropdown options loaded successfully')
    } catch (error) {
      console.error('Error loading dropdown options:', error)
      // Fallback to hardcoded options from SharePointService
      setIncidentCategoryOptions(SharePointService.getIncidentCategoryOptions())
      setRiskLevelOptions(SharePointService.getRiskLevelOptions())
      setAlertModelTypeOptions(SharePointService.getAlertModelTypeOptions())
      setActivatedAlternativeOptions(SharePointService.getActivatedAlternativeOptions())
      setCoordinatedEntitiesOptions(SharePointService.getCoordinatedEntitiesOptions())
      setActionTakenOptions(SharePointService.getActionTakenOptions())
      setAltLocationOptions(SharePointService.getAltLocationOptions())
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

  const columns: IColumn[] = [
    { key: 'Title', name: 'العنوان', fieldName: 'Title', minWidth: 80 },
    { key: 'IncidentNumber', name: 'رقم البلاغ', fieldName: 'IncidentNumber', minWidth: 70 },
    { key: 'IncidentCategory', name: 'التصنيف', fieldName: 'IncidentCategory', minWidth: 70 },
    { 
      key: 'RiskLevel', 
      name: 'مستوى الخطر', 
      fieldName: 'RiskLevel', 
      minWidth: 80,
      onRender: (item: Incident) => (
        <span style={{ 
          padding: '2px 8px', 
          borderRadius: 4, 
          backgroundColor: getRiskLevelColor(item.RiskLevel || ''),
          color: 'white',
          fontSize: 11 
        }}>
          {item.RiskLevel}
        </span>
      )
    },
    { 
      key: 'AlertModelType', 
      name: 'المؤشر', 
      fieldName: 'AlertModelType', 
      minWidth: 70,
      onRender: (item: Incident) => {
        const alertType = item.AlertModelType || ''
        let bgColor = '#666'
        if (alertType.includes('أخضر')) bgColor = '#4caf50'
        else if (alertType.includes('أصفر')) bgColor = '#ff9800'
        else if (alertType.includes('أحمر')) bgColor = '#d83b01'
        return (
          <span style={{ 
            padding: '2px 8px', 
            borderRadius: 4, 
            backgroundColor: bgColor,
            color: 'white',
            fontSize: 11 
          }}>
            {alertType.split(' ')[0]}
          </span>
        )
      }
    },
    { key: 'ActivatedAlternative', name: 'البديل', fieldName: 'ActivatedAlternative', minWidth: 70 },
    { key: 'Created', name: 'التاريخ', fieldName: 'Created', minWidth: 80 },
    {
      key: 'actions',
      name: 'الإجراءات',
      fieldName: 'actions',
      minWidth: 80,
      maxWidth: 100,
      onRender: (item: Incident) => (
        <Stack horizontal tokens={{ childrenGap: 8 }}>
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
    },
  ]

  useEffect(() => {
    loadIncidents()
    loadDropdownOptions()
  }, [user])

  const loadIncidents = async () => {
    setLoading(true)
    try {
      const schoolName = user?.type === 'admin' ? undefined : user?.schoolName
      const data = await SharePointService.getIncidents(schoolName)
      setIncidents(data)
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل تحميل الحوادث: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  const onOpen = () => {
    setEditingId(null)
    setFilteredRiskLevelOptions([]) // Clear filtered options for new form
    setForm({
      Title: '',
      IncidentCategory: '',
      ActivatedAlternative: '',
      RiskLevel: '',
      ActivationTime: '',
      AlertModelType: '',
      HazardDescription: '',
      CoordinatedEntities: '',
      IncidentNumber: '',
      ActionTaken: '',
      AltLocation: '',
      CommunicationDone: false,
      ClosureTime: '',
      Challenges: '',
      LessonsLearned: '',
      Suggestions: '',
    })
    setPanelOpen(true)
  }

  const onEdit = (item: Incident) => {
    setEditingId(item.Id!)
    setForm({ ...item })
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
    if (!form.Title || !form.IncidentCategory || !form.RiskLevel || !form.IncidentNumber) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى ملء جميع الحقول المطلوبة (العنوان، تصنيف الحادث، مستوى الخطر، رقم بلاغ الدعم الموحد)' })
      return
    }

    setLoading(true)
    try {
      const incidentData: Incident = {
        ...form,
        Title: form.Title!,
        SchoolName_Ref: user?.schoolName,
      }

      if (editingId) {
        await SharePointService.updateIncident(editingId, incidentData)
        setMessage({ type: MessageBarType.success, text: 'تم تحديث الحادث بنجاح' })
      } else {
        await SharePointService.createIncident(incidentData, user?.schoolId)
        setMessage({ type: MessageBarType.success, text: 'تم تسجيل الحادث بنجاح' })
      }
      await loadIncidents()
      onClose()
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل الحفظ: ${e}` })
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
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل الحذف: ${e}` })
    } finally {
      setLoading(false)
    }
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

      <div className="card">
        <DetailsList
          items={incidents}
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
        />
        {incidents.length === 0 && !loading && (
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
          {/* 1. Title - العنوان */}
          <TextField
            label="العنوان *"
            value={form.Title || ''}
            onChange={(_, v) => setForm({ ...form, Title: v || '' })}
            required
            placeholder="أدخل عنوان الانقطاع"
          />
          
          {/* 2. IncidentCategory - تصنيف الحادث */}
          <Dropdown
            label="تصنيف الحادث *"
            selectedKey={form.IncidentCategory}
            options={incidentCategoryOptions}
            onChange={(_, option) => {
              const category = option?.key as string || ''
              // Filter risk levels based on selected category
              const mapping = categoryToRiskLevelMapping[category]
              if (mapping) {
                const filteredLevels = allRiskLevels.slice(mapping.start, mapping.start + mapping.count)
                const filteredOpts: IDropdownOption[] = filteredLevels.map(level => ({
                  key: level,
                  text: level,
                }))
                setFilteredRiskLevelOptions(filteredOpts)
              } else {
                // If category not in mapping, show all risk levels
                setFilteredRiskLevelOptions(riskLevelOptions)
              }
              // Clear RiskLevel and AlertModelType when category changes
              setForm({ ...form, IncidentCategory: category, RiskLevel: '', AlertModelType: '' })
            }}
            required
            styles={{ root: { marginTop: 12 } }}
          />
          
          {/* 3. ActivatedAlternative - البديل */}
          <Dropdown
            label="البديل"
            selectedKey={form.ActivatedAlternative}
            options={activatedAlternativeOptions}
            onChange={(_, option) => {
              const newValue = option?.key as string || ''
              // Clear AltLocation if not selecting "مدرسة بديلة"
              if (newValue !== 'مدرسة بديلة') {
                setForm({ ...form, ActivatedAlternative: newValue, AltLocation: '' })
              } else {
                setForm({ ...form, ActivatedAlternative: newValue })
              }
            }}
            styles={{ root: { marginTop: 12 } }}
          />
          
          {/* 4. RiskLevel - مستوى الخطر */}
          <Dropdown
            label="مستوى الخطر *"
            selectedKey={form.RiskLevel}
            options={filteredRiskLevelOptions.length > 0 ? filteredRiskLevelOptions : riskLevelOptions}
            onChange={(_, option) => {
              const riskLevel = option?.key as string || ''
              // Auto-select AlertModelType based on RiskLevel and Category
              const alertType = getAlertTypeForRiskLevel(riskLevel, form.IncidentCategory || '')
              setForm({ ...form, RiskLevel: riskLevel, AlertModelType: alertType })
            }}
            required
            styles={{ root: { marginTop: 12 } }}
            disabled={!form.IncidentCategory}
            placeholder={!form.IncidentCategory ? 'اختر تصنيف الحادث أولاً' : 'اختر مستوى الخطر'}
          />
          
          {/* 5. ActivationTime - وقت التفعيل */}
          <TextField
            label="تاريخ التفعيل"
            type="date"
            value={form.ActivationTime ? form.ActivationTime.split('T')[0] : ''}
            onChange={(_, v) => setForm({ ...form, ActivationTime: v || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          
          {/* 6. AlertModelType - نوع التنبيه (auto-calculated, view only) */}
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
          
          {/* 7. HazardDescription - وصف الخطر */}
          <TextField
            label="وصف الخطر"
            value={form.HazardDescription || ''}
            onChange={(_, v) => setForm({ ...form, HazardDescription: v || '' })}
            multiline
            rows={3}
            styles={{ root: { marginTop: 12 } }}
          />
          
          {/* 8. CoordinatedEntities - الجهات التي تم تنسيقها */}
          <Dropdown
            label="الجهات التي تم تنسيقها"
            selectedKey={form.CoordinatedEntities}
            options={coordinatedEntitiesOptions}
            onChange={(_, option) => setForm({ ...form, CoordinatedEntities: option?.key as string || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          
          {/* 9. IncidentNumber - رقم بلاغ الدعم الموحد */}
          <TextField
            label="رقم بلاغ الدعم الموحد"
            type="number"
            value={form.IncidentNumber || ''}
            onChange={(_, v) => setForm({ ...form, IncidentNumber: v || '' })}
            styles={{ root: { marginTop: 12 } }}
            placeholder="أدخل رقم البلاغ"
            required
          />
          
          {/* 10. ActionTaken - البديل المفعل */}
          <Dropdown
            label="البديل المفعل"
            selectedKey={form.ActionTaken}
            options={actionTakenOptions}
            onChange={(_, option) => setForm({ ...form, ActionTaken: option?.key as string || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          
          {/* 11. AltLocation - المدرسة البديلة (conditional) */}
          {form.ActivatedAlternative === 'مدرسة بديلة' && (
            <Dropdown
              label="المدرسة البديلة"
              selectedKey={form.AltLocation}
              options={schoolOptions}
              onChange={(_, option) => setForm({ ...form, AltLocation: option?.key as string || '' })}
              styles={{ root: { marginTop: 12 } }}
              placeholder="اختر المدرسة البديلة"
            />
          )}
          
          {/* 12. CommunicationDone - التواصل مع أولياء الأمور */}
          <Toggle
            label="التواصل مع أولياء الأمور"
            checked={form.CommunicationDone || false}
            onChange={(_, checked) => setForm({ ...form, CommunicationDone: checked || false })}
            styles={{ root: { marginTop: 12 } }}
          />
          
          {/* 13. ClosureTime - وقت استعادة الخدمة */}
          <TextField
            label="تاريخ استعادة الخدمة"
            type="date"
            value={form.ClosureTime ? form.ClosureTime.split('T')[0] : ''}
            onChange={(_, v) => setForm({ ...form, ClosureTime: v || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          
          {/* 14. Challenges - التحديات */}
          <TextField
            label="التحديات"
            value={form.Challenges || ''}
            onChange={(_, v) => setForm({ ...form, Challenges: v || '' })}
            multiline
            rows={2}
            styles={{ root: { marginTop: 12 } }}
          />
          
          {/* 15. LessonsLearned - الدروس المستفادة */}
          <TextField
            label="الدروس المستفادة"
            value={form.LessonsLearned || ''}
            onChange={(_, v) => setForm({ ...form, LessonsLearned: v || '' })}
            multiline
            rows={2}
            styles={{ root: { marginTop: 12 } }}
          />
          
          {/* 16. Suggestions - المقترحات */}
          <TextField
            label="المقترحات لتحسين الاستجابة المستقبلية"
            value={form.Suggestions || ''}
            onChange={(_, v) => setForm({ ...form, Suggestions: v || '' })}
            multiline
            rows={2}
            styles={{ root: { marginTop: 12 } }}
          />
        </div>
      </Panel>
    </div>
  )
}

export default Incidents
