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
  IconButton,
  MessageBar,
  MessageBarType,
  Spinner,
  Stack,
  PanelType,
  IDropdownOption,
  Label,
  Text,
  Icon,
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { SharePointService, TrainingLog as TrainingLogType, TrainingProgram, TeamMember } from '../services/sharepointService'
import { getColumnConfig, ColumnType, renderChoice, renderDate, renderMultiValue } from '../config/tableConfig.tsx'

// Only valid SharePoint RegistrationType values
const registrationTypeOptions: IDropdownOption[] = [
  { key: 'طلب تسجيل', text: 'طلب تسجيل' },
  { key: 'توثيق حضور سابق', text: 'توثيق حضور سابق' },
]

// Helper to determine registration type based on date
const getRegistrationType = (date?: string): string => {
  if (!date) return 'طلب تسجيل'
  const programDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return programDate < today ? 'توثيق حضور سابق' : 'طلب تسجيل'
}

const TrainingLog: React.FC = () => {
  const { user } = useAuth()
  const [items, setItems] = useState<TrainingLogType[]>([])
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)
  
  // Programs and team members for dropdown selection
  const [programs, setPrograms] = useState<TrainingProgram[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null)
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  
  const [form, setForm] = useState<Partial<TrainingLogType>>({
    Title: '',
    Program_Ref: '',
    RegistrationType: '',
    AttendeesNames: '',
    TrainingDate: '',
  })

  // Get SharePoint attachment link - use DispForm.aspx?ID=X to open exact item
  const getAttachmentLink = (item: TrainingLogType) => {
    return `https://saudimoe.sharepoint.com/sites/em/Lists/School_Training_Log/DispForm.aspx?ID=${item.Id}`
  }

  const columns: IColumn[] = [
    { 
      ...getColumnConfig(ColumnType.MEDIUM_TEXT),
      key: 'Program_Ref', 
      name: 'البرنامج', 
      fieldName: 'Program_Ref', 
      onRender: (item: TrainingLogType) => renderChoice(item.Program_Ref)
    },
    { 
      ...getColumnConfig(ColumnType.SHORT_TEXT),
      key: 'RegistrationType', 
      name: 'نوع التسجيل', 
      fieldName: 'RegistrationType', 
      onRender: (item: TrainingLogType) => renderChoice(item.RegistrationType)
    },
    { 
      ...getColumnConfig(ColumnType.MULTI_VALUE),
      key: 'AttendeesNames', 
      name: 'أسماء الحضور', 
      fieldName: 'AttendeesNames', 
      onRender: (item: TrainingLogType) => renderMultiValue(item.AttendeesNames)
    },
    { 
      ...getColumnConfig(ColumnType.DATE),
      key: 'TrainingDate', 
      name: 'تاريخ التدريب', 
      fieldName: 'TrainingDate', 
      onRender: (item: TrainingLogType) => renderDate(item.TrainingDate)
    },
    { 
      ...getColumnConfig(ColumnType.MEDIUM_TEXT),
      key: 'GeneralNotes', 
      name: 'ملاحظات عامة', 
      fieldName: 'GeneralNotes', 
      onRender: (item: TrainingLogType) => {
        // If GeneralNotes is empty, show "Program Name - Date"
        const displayText = item.GeneralNotes || (item.Program_Ref && item.TrainingDate 
          ? `${item.Program_Ref} - ${new Date(item.TrainingDate).toLocaleDateString('ar-SA')}`
          : '-');
        return (
          <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {displayText}
          </div>
        );
      }
    },
    {
      ...getColumnConfig(ColumnType.ATTACHMENT),
      key: 'attachment',
      name: 'المرفق',
      onRender: (item: TrainingLogType) => (
        <div style={{ textAlign: 'center', width: '100%' }}>
          <a
            href={getAttachmentLink(item)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#008752',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            📎 أضف مرفق
          </a>
        </div>
      ),
    },
    {
      ...getColumnConfig(ColumnType.ACTIONS),
      key: 'actions',
      name: 'الإجراءات',
      onRender: (item: TrainingLogType) => (
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
    },
  ]

  const loadTrainingLog = async () => {
    setLoading(true)
    try {
      const schoolName = user?.type === 'admin' ? undefined : user?.schoolName
      const data = await SharePointService.getTrainingLog(schoolName)
      setItems(data)
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل تحميل سجل التدريب: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  const loadPrograms = async () => {
    try {
      const data = await SharePointService.getTrainingPrograms(true)
      setPrograms(data || [])
    } catch (e) {
      console.error('Failed to load programs:', e)
    }
  }

  const loadTeamMembers = async () => {
    try {
      const schoolName = user?.type === 'admin' ? undefined : user?.schoolName
      const data = await SharePointService.getTeamMembers(schoolName)
      setTeamMembers(data || [])
    } catch (e) {
      console.error('Failed to load team members:', e)
    }
  }

  useEffect(() => {
    loadTrainingLog()
    loadPrograms()
    loadTeamMembers()
  }, [user])

  // Program options for dropdown
  const programOptions: IDropdownOption[] = programs.map(p => ({
    key: p.Id?.toString() || p.Title,
    text: p.Title
  }))

  // Team member options for dropdown
  const attendeeOptions: IDropdownOption[] = teamMembers.map(m => ({
    key: m.Id?.toString() || m.Title,
    text: `${m.Title} - ${m.JobRole || 'عضو'}`
  }))

  const onOpen = () => {
    setEditingId(null)
    setSelectedProgram(null)
    setSelectedAttendees([])
    setForm({
      Title: '',
      Program_Ref: '',
      RegistrationType: '',  // Will be set when program is selected
      AttendeesNames: '',
      TrainingDate: new Date().toISOString().split('T')[0],
    })
    setPanelOpen(true)
  }

  const onEdit = (item: TrainingLogType) => {
    setEditingId(item.Id!)
    setForm(item)
    // Parse attendees from names
    const attendeeIds: string[] = []
    if (item.AttendeesNames) {
      item.AttendeesNames.split('، ').forEach(name => {
        const member = teamMembers.find(m => m.Title === name.trim())
        if (member && member.Id) {
          attendeeIds.push(member.Id.toString())
        }
      })
    }
    setSelectedAttendees(attendeeIds)
    // Find program
    const program = programs.find(p => p.Title === item.Program_Ref)
    setSelectedProgram(program || null)
    setPanelOpen(true)
  }

  const onClose = () => {
    setPanelOpen(false)
    setEditingId(null)
    setSelectedProgram(null)
    setSelectedAttendees([])
  }

  const onSave = async () => {
    // Validate required fields
    if (!form.Program_Ref && !selectedProgram) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى اختيار البرنامج التدريبي' })
      return
    }
    if (selectedAttendees.length === 0 && !form.AttendeesNames) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى اختيار الحضور' })
      return
    }

    setLoading(true)
    try {
      const attendeeIds = selectedAttendees.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      const programId = selectedProgram?.Id || 0
      const schoolName = user?.schoolName || ''
      const trainingDate = form.TrainingDate || selectedProgram?.Date || new Date().toISOString()
      const registrationType = form.RegistrationType || 'طلب تسجيل'
      const programName = selectedProgram?.Title || ''

      if (editingId) {
        // Update existing record
        await SharePointService.updateTrainingLog(editingId, { attendeeIds })
        setMessage({ type: MessageBarType.success, text: 'تم تحديث السجل بنجاح' })
      } else {
        // Create new record
        await SharePointService.registerForTraining(
          schoolName,
          programId,
          attendeeIds,
          user?.schoolId,
          registrationType,
          trainingDate,
          programName
        )
        setMessage({ type: MessageBarType.success, text: 'تم تسجيل التدريب بنجاح' })
      }
      await loadTrainingLog()
      onClose()
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل الحفظ: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return

    setLoading(true)
    try {
      await SharePointService.deleteTrainingLog(id)
      setMessage({ type: MessageBarType.success, text: 'تم حذف السجل بنجاح' })
      await loadTrainingLog()
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
      <h1 className="page-title" style={{ color: '#008752' }}>سجل التدريبات</h1>

      {message && (
        <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)} styles={{ root: { marginBottom: 16 } }}>
          {message.text}
        </MessageBar>
      )}

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spinner label="جاري التحميل..." />
        </div>
      ) : (
        <>
          <Stack horizontal horizontalAlign="start" style={{ marginBottom: 16 }}>
            <PrimaryButton 
              text="تسجيل تدريب جديد" 
              iconProps={{ iconName: 'Add' }} 
              onClick={onOpen}
              disabled={loading}
              styles={{ root: { backgroundColor: '#008752', borderColor: '#008752' } }}
            />
          </Stack>

          <div className="card">
            {items.length > 0 ? (
              <DetailsList
                items={items}
                columns={columns}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.none}
              />
            ) : (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <Icon iconName="PageList" style={{ fontSize: 48, color: '#999', marginBottom: 12 }} />
                <Text variant="large" block style={{ color: '#666', marginBottom: 8 }}>لا توجد سجلات تدريب حالياً</Text>
                <Text variant="medium" style={{ color: '#999' }}>قم بالتسجيل في البرامج التدريبية بالضغط على الزر أعلاه</Text>
              </div>
            )}
          </div>
        </>
      )}

      <Panel
        isOpen={panelOpen}
        onDismiss={onClose}
        headerText={editingId ? 'تعديل سجل التدريب' : 'تسجيل تدريب جديد'}
        type={PanelType.medium}
        isFooterAtBottom={true}
        onRenderFooterContent={() => (
          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <PrimaryButton text="حفظ" onClick={onSave} disabled={loading} styles={{ root: { backgroundColor: '#008752', borderColor: '#008752' } }} />
            <DefaultButton text="إلغاء" onClick={onClose} disabled={loading} />
          </Stack>
        )}
      >
        <div style={{ padding: 16 }}>
          {/* Program Selection - disabled in edit mode */}
          <Dropdown
            label="البرنامج التدريبي *"
            placeholder="اختر البرنامج التدريبي"
            selectedKey={selectedProgram?.Id?.toString() || form.Program_Ref}
            options={programOptions}
            onChange={(_, option) => {
              if (!editingId) {
                const program = programs.find(p => (p.Id?.toString() === option?.key) || (p.Title === option?.key))
                setSelectedProgram(program || null)
                // Auto-set registration type based on program date
                const regType = getRegistrationType(program?.Date)
                setForm({ 
                  ...form, 
                  Program_Ref: program?.Title || option?.text || '',
                  RegistrationType: regType,
                  TrainingDate: program?.Date || form.TrainingDate
                })
              }
            }}
            required
            disabled={!!editingId}
            styles={{ root: { marginBottom: 16 } }}
          />

          {/* Program info if selected */}
          {selectedProgram && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f3f2f1', 
              borderRadius: '8px', 
              borderRight: '4px solid #008752',
              marginBottom: 16
            }}>
              <Text variant="medium" block style={{ fontWeight: 600, marginBottom: 8 }}>{selectedProgram.Title}</Text>
              <div style={{ fontSize: 13 }}>
                <div><strong>الجهة:</strong> {selectedProgram.ProviderEntity || '-'}</div>
                <div><strong>التاريخ:</strong> {selectedProgram.Date ? new Date(selectedProgram.Date).toLocaleDateString('ar-SA') : '-'}</div>
              </div>
            </div>
          )}

          {/* Registration Type - Auto-determined, read-only display */}
          <div style={{ marginBottom: 16 }}>
            <Label>نوع التسجيل</Label>
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: form.RegistrationType === 'توثيق حضور سابق' ? '#fff4ce' : '#e8f4e8',
              borderRadius: '4px',
              border: '1px solid ' + (form.RegistrationType === 'توثيق حضور سابق' ? '#ffb900' : '#107c10'),
              color: form.RegistrationType === 'توثيق حضور سابق' ? '#8a6914' : '#107c10',
              fontWeight: 600
            }}>
              {form.RegistrationType || 'يتم تحديده عند اختيار البرنامج'}
            </div>
            <Text variant="small" style={{ color: '#666', marginTop: 4, display: 'block' }}>
              يتم تحديد نوع التسجيل تلقائياً بناءً على تاريخ البرنامج
            </Text>
          </div>

          {/* Attendee Selection */}
          <Label required>اختيار الحضور من فريق الأمن والسلامة *</Label>
          <Dropdown
            placeholder="اختر الحضور"
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
            styles={{ dropdown: { marginBottom: 8 } }}
          />

          {selectedAttendees.length > 0 && (
            <div style={{ marginTop: 8, marginBottom: 16 }}>
              <Text variant="small" style={{ fontWeight: 600 }}>الحضور المختارون ({selectedAttendees.length}):</Text>
              <div style={{ 
                padding: '8px 12px', 
                backgroundColor: '#e8f4e8', 
                borderRadius: '4px', 
                marginTop: '4px',
                fontSize: 13
              }}>
                {selectedAttendees.map(id => {
                  const member = teamMembers.find(m => m.Id?.toString() === id)
                  return member?.Title
                }).filter(Boolean).join(' | ')}
              </div>
            </div>
          )}

          <TextField
            label="ملاحظات"
            value={form.Title || ''}
            onChange={(_, v) => setForm({ ...form, Title: v || '' })}
            placeholder="أدخل ملاحظات إضافية (اختياري)"
            styles={{ root: { marginBottom: 16 } }}
          />

          {/* Attachment info */}
          <div style={{ padding: '12px', backgroundColor: '#f0f9ff', border: '1px solid #0078d4', borderRadius: '4px', marginTop: 16 }}>
            <Text variant="small" style={{ color: '#004578' }}>
              📎 <strong>لإضافة مرفق:</strong> بعد الحفظ، يمكنك إضافة المرفقات من خلال عمود "المرفق" في الجدول
            </Text>
          </div>
        </div>
      </Panel>
    </div>
  )
}

export default TrainingLog
