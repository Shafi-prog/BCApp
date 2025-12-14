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
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { SharePointService, TrainingProgram, TrainingLog, TeamMember } from '../services/sharepointService'

const Training: React.FC = () => {
  const { user } = useAuth()
  
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
  
  // Messages
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadPrograms()
    loadTrainingLog()
    loadTeamMembers()
  }, [user])

  const loadPrograms = async () => {
    try {
      setLoadingPrograms(true)
      const data = await SharePointService.getTrainingPrograms(true)
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

      await SharePointService.registerForTraining(
        schoolName,
        selectedProgram.Id || 0,
        attendeeIds,
        user?.schoolId,
        registrationType,
        trainingDate
      )

      setSuccessMessage('تم التسجيل بنجاح')
      setPanelOpen(false)
      loadTrainingLog()
    } catch (e) {
      console.error(e)
      setErrorMessage('فشل التسجيل')
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
  const programColumns: IColumn[] = [
    { 
      key: 'Title', 
      name: 'البرنامج', 
      fieldName: 'Title', 
      minWidth: 200, 
      maxWidth: 300, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: TrainingProgram) => (
        <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', lineHeight: '1.4' }}>
          {item.Title}
        </div>
      )
    },
    { 
      key: 'ProviderEntity', 
      name: 'الجهة المقدمة', 
      fieldName: 'ProviderEntity', 
      minWidth: 150, 
      maxWidth: 200, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: TrainingProgram) => (
        <div style={{ textAlign: 'center', width: '100%' }}>{item.ProviderEntity || '-'}</div>
      )
    },
    { 
      key: 'ActivityType', 
      name: 'نوع النشاط', 
      fieldName: 'ActivityType', 
      minWidth: 120, 
      maxWidth: 160, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: TrainingProgram) => (
        <div style={{ textAlign: 'center', width: '100%' }}>{item.ActivityType || '-'}</div>
      )
    },
    { 
      key: 'TargetAudience', 
      name: 'الفئة المستهدفة', 
      fieldName: 'TargetAudience', 
      minWidth: 140, 
      maxWidth: 180, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: TrainingProgram) => (
        <div style={{ textAlign: 'center', width: '100%' }}>{item.TargetAudience || '-'}</div>
      )
    },
    { 
      key: 'Date', 
      name: 'تاريخ التدريب', 
      fieldName: 'Date', 
      minWidth: 120, 
      maxWidth: 140, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: TrainingProgram) => (
        <div style={{ textAlign: 'center', width: '100%' }}>
          {item.Date ? new Date(item.Date).toLocaleDateString('ar-SA') : '-'}
        </div>
      )
    },
    { 
      key: 'ExecutionMode', 
      name: 'طريقة التنفيذ', 
      fieldName: 'ExecutionMode', 
      minWidth: 120, 
      maxWidth: 160, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: TrainingProgram) => (
        <div style={{ textAlign: 'center', width: '100%' }}>{item.ExecutionMode || '-'}</div>
      )
    },
    { 
      key: 'actions', 
      name: 'الإجراءات', 
      minWidth: 120,
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
    }
  ]

  // Training log columns
  const logColumns: IColumn[] = [
    { 
      key: 'Program_Ref', 
      name: 'البرنامج', 
      fieldName: 'Program_Ref', 
      minWidth: 200, 
      maxWidth: 280, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: TrainingLog) => (
        <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', lineHeight: '1.4' }}>
          {item.Program_Ref || '-'}
        </div>
      )
    },
    { 
      key: 'RegistrationType', 
      name: 'نوع التسجيل', 
      fieldName: 'RegistrationType', 
      minWidth: 120, 
      maxWidth: 150, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: TrainingLog) => (
        <div style={{ textAlign: 'center', width: '100%' }}>{item.RegistrationType}</div>
      )
    },
    { 
      key: 'AttendeesNames', 
      name: 'الحضور', 
      fieldName: 'AttendeesNames', 
      minWidth: 200, 
      maxWidth: 280, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: TrainingLog) => (
        <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', lineHeight: '1.4' }}>
          {item.AttendeesNames || '-'}
        </div>
      )
    },
    { 
      key: 'TrainingDate', 
      name: 'تاريخ التدريب', 
      fieldName: 'TrainingDate', 
      minWidth: 120, 
      maxWidth: 140, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: TrainingLog) => (
        <div style={{ textAlign: 'center', width: '100%' }}>
          {item.TrainingDate ? new Date(item.TrainingDate).toLocaleDateString('ar-SA') : '-'}
        </div>
      )
    },
    { 
      key: 'Title', 
      name: 'ملاحظات', 
      fieldName: 'Title', 
      minWidth: 150, 
      maxWidth: 200, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: TrainingLog) => (
        <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', lineHeight: '1.4' }}>
          {item.Title || '-'}
        </div>
      )
    },
    { 
      key: 'actions', 
      name: 'الإجراءات', 
      minWidth: 150,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: TrainingLog) => (
        <Stack horizontal tokens={{ childrenGap: 8 }} style={{ justifyContent: 'center', width: '100%' }}>
          <button
            onClick={() => handleEditLog(item)}
            title="تعديل"
            style={{
              padding: '4px 12px',
              backgroundColor: '#0078d4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            ✏️ تعديل
          </button>
          <button
            onClick={() => handleDeleteLog(item.Id || 0)}
            title="حذف"
            style={{
              padding: '4px 12px',
              backgroundColor: '#d13438',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            🗑️ حذف
          </button>
        </Stack>
      )
    }
  ]

  // Check if schools should see warning
  const showTeamWarning = user?.type !== 'admin' && !loadingTeam && teamMembers.length === 0

  return (
    <div style={{ padding: 32 }}>
      <Stack tokens={{ childrenGap: 12 }}>
        {user?.schoolName && (
          <div style={{ backgroundColor: '#008752', borderRadius: '8px', padding: '16px 24px', color: '#fff', marginBottom: '8px' }}>
            <Text variant="large" style={{ color: '#fff', fontWeight: 600 }}>
              حياكم الله - {user.schoolName}
            </Text>
          </div>
        )}

        <Text variant="xxLarge">
          <strong>بوابة التدريب</strong>
        </Text>

        {/* Warning for schools without team members */}
        {showTeamWarning && (
          <MessageBar messageBarType={MessageBarType.warning} isMultiline styles={{ root: { marginBottom: '12px' } }}>
            <strong>تنبيه:</strong> لم يتم تسجيل أعضاء فريق الأمن والسلامة بعد. يجب إضافة أعضاء الفريق أولاً من صفحة "فريق الأمن والسلامة" قبل التمكن من التسجيل في البرامج التدريبية.
          </MessageBar>
        )}

        {/* Error message */}
        {errorMessage && (
          <div style={{ padding: '12px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c50f1f' }}>
            {errorMessage}
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div style={{ padding: '12px', backgroundColor: '#efe', border: '1px solid #cfc', borderRadius: '4px', color: '#107c10' }}>
            {successMessage}
          </div>
        )}

        {/* Tabs for programs and log */}
        <Pivot>
          <PivotItem headerText="البرامج المتاحة">
            {loadingPrograms ? (
              <Spinner label="جارٍ تحميل البرامج..." />
            ) : programs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                لا توجد برامج متاحة حالياً
              </div>
            ) : (
              <DetailsList
                items={programs}
                columns={programColumns}
                layoutMode={DetailsListLayoutMode.fixedColumns}
                selectionMode={SelectionMode.none}
              />
            )}
          </PivotItem>

          <PivotItem headerText="السجل التدريبي">
            {showTeamWarning ? (
              <div style={{ 
                padding: '32px', 
                textAlign: 'center', 
                backgroundColor: '#fff4ce', 
                border: '1px solid #ffb900', 
                borderRadius: '8px', 
                margin: '16px 0' 
              }}>
                <Text variant="large" block style={{ marginBottom: '12px', color: '#323130' }}>
                  ⚠️ يجب إضافة أعضاء فريق الأمن والسلامة أولاً
                </Text>
                <Text variant="medium" style={{ color: '#605e5c' }}>
                  يرجى الانتقال إلى صفحة "فريق الأمن والسلامة" وإضافة الأعضاء قبل التسجيل في البرامج التدريبية
                </Text>
              </div>
            ) : loadingLog ? (
              <Spinner label="جارٍ تحميل السجل..." />
            ) : trainingLog.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                لا يوجد سجل تدريبي
              </div>
            ) : (
              <DetailsList
                items={trainingLog}
                columns={logColumns}
                layoutMode={DetailsListLayoutMode.fixedColumns}
                selectionMode={SelectionMode.none}
              />
            )}
          </PivotItem>
        </Pivot>
      </Stack>

      {/* Registration Panel */}
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
              
              {selectedAttendees.length === 0 && (
                <Text variant="small" style={{ color: '#a4262c', marginTop: '4px', display: 'block' }}>
                  * يجب اختيار الحضور للتسجيل
                </Text>
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

      {/* Edit Panel */}
      <Panel
        isOpen={editPanelOpen}
        onDismiss={() => setEditPanelOpen(false)}
        headerText="تعديل التسجيل التدريبي"
        type={PanelType.medium}
      >
        {editingLog && (
          <Stack tokens={{ childrenGap: 16 }} style={{ marginTop: '16px' }}>
            {/* Log info */}
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

            {/* Attendee selection */}
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

            {/* Buttons */}
            <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: '24px' }}>
              <PrimaryButton
                text="تحديث التسجيل"
                onClick={handleSaveEdit}
                disabled={savingEdit || editAttendees.length === 0}
                styles={{
                  root: {
                    backgroundColor: '#0078d4',
                    borderColor: '#0078d4'
                  }
                }}
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
    </div>
  )
}

export default Training
