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
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { SharePointService, Incident } from '../services/sharepointService'

const statusOptions = [
  { key: 'جديد', text: 'جديد' },
  { key: 'قيد المعالجة', text: 'قيد المعالجة' },
  { key: 'تم الحل', text: 'تم الحل' },
  { key: 'مغلق', text: 'مغلق' },
]

const Incidents: React.FC = () => {
  const { user } = useAuth()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)
  const [form, setForm] = useState<Partial<Incident>>({
    Title: '',
    IncidentCategory: '',
    RiskLevel: '',
    AlertModelType: '',
    HazardDescription: '',
    ActivatedAlternative: '',
    ActivationTime: '',
    ClosureTime: '',
    CoordinatedEntities: '',
    ActionTaken: '',
    AltLocation: '',
    Challenges: '',
    LessonsLearned: '',
    Suggestions: '',
    Status: 'جديد',
  })

  const incidentCategoryOptions = SharePointService.getIncidentCategoryOptions()
  const riskLevelOptions = SharePointService.getRiskLevelOptions()
  const alertModelTypeOptions = SharePointService.getAlertModelTypeOptions()
  const actionTakenOptions = SharePointService.getActionTakenOptions()

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'حرج': return '#d32f2f'
      case 'مرتفع': return '#f57c00'
      case 'متوسط': return '#fbc02d'
      case 'منخفض': return '#388e3c'
      default: return '#666'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'جديد': return '#2196f3'
      case 'قيد المعالجة': return '#ff9800'
      case 'تم الحل': return '#4caf50'
      case 'مغلق': return '#9e9e9e'
      default: return '#666'
    }
  }

  const columns: IColumn[] = [
    { key: 'Title', name: 'عنوان الحادث', fieldName: 'Title', minWidth: 150, maxWidth: 200 },
    { key: 'IncidentCategory', name: 'التصنيف', fieldName: 'IncidentCategory', minWidth: 70, maxWidth: 90 },
    { 
      key: 'RiskLevel', 
      name: 'مستوى الخطر', 
      fieldName: 'RiskLevel', 
      minWidth: 80, 
      maxWidth: 100,
      onRender: (item: Incident) => (
        <span style={{ 
          padding: '2px 8px', 
          borderRadius: 4, 
          backgroundColor: getRiskLevelColor(item.RiskLevel || ''),
          color: 'white',
          fontSize: 12 
        }}>
          {item.RiskLevel}
        </span>
      )
    },
    { key: 'Created', name: 'التاريخ', fieldName: 'Created', minWidth: 90, maxWidth: 100 },
    { 
      key: 'Status', 
      name: 'الحالة', 
      fieldName: 'Status', 
      minWidth: 80, 
      maxWidth: 100,
      onRender: (item: Incident) => (
        <span style={{ 
          padding: '2px 8px', 
          borderRadius: 4, 
          backgroundColor: getStatusColor(item.Status || ''),
          color: 'white',
          fontSize: 12 
        }}>
          {item.Status}
        </span>
      )
    },
    {
      key: 'actions',
      name: 'الإجراءات',
      fieldName: 'actions',
      minWidth: 100,
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
    setForm({
      Title: '',
      IncidentCategory: '',
      RiskLevel: '',
      AlertModelType: '',
      HazardDescription: '',
      ActivatedAlternative: '',
      ActivationTime: '',
      ClosureTime: '',
      CoordinatedEntities: '',
      ActionTaken: '',
      AltLocation: '',
      Challenges: '',
      LessonsLearned: '',
      Suggestions: '',
      Status: 'جديد',
    })
    setPanelOpen(true)
  }

  const onEdit = (item: Incident) => {
    setEditingId(item.Id!)
    setForm({ ...item })
    setPanelOpen(true)
  }

  const onClose = () => {
    setPanelOpen(false)
    setEditingId(null)
  }

  const onSave = async () => {
    if (!form.Title || !form.IncidentCategory) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى ملء جميع الحقول المطلوبة' })
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
      <h1 className="page-title" style={{ color: '#d83b01' }}>غرفة العمليات - سجل الحوادث</h1>
      
      {message && (
        <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)} styles={{ root: { marginBottom: 16 } }}>
          {message.text}
        </MessageBar>
      )}

      {loading && <Spinner label="جاري التحميل..." />}

      <Stack horizontal horizontalAlign="end" style={{ marginBottom: 16 }}>
        <PrimaryButton 
          text="تسجيل حادث جديد" 
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
        headerText={editingId ? 'تعديل الحادث' : 'تسجيل حادث جديد'}
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
          <TextField
            label="عنوان الحادث *"
            value={form.Title || ''}
            onChange={(_, v) => setForm({ ...form, Title: v || '' })}
            required
          />
          <Dropdown
            label="تصنيف الحادث *"
            selectedKey={form.IncidentCategory}
            options={incidentCategoryOptions}
            onChange={(_, option) => setForm({ ...form, IncidentCategory: option?.key as string || '' })}
            required
            styles={{ root: { marginTop: 12 } }}
          />
          <Dropdown
            label="مستوى الخطر *"
            selectedKey={form.RiskLevel}
            options={riskLevelOptions}
            onChange={(_, option) => setForm({ ...form, RiskLevel: option?.key as string || '' })}
            required
            styles={{ root: { marginTop: 12 } }}
          />
          <Dropdown
            label="نوع التنبيه"
            selectedKey={form.AlertModelType}
            options={alertModelTypeOptions}
            onChange={(_, option) => setForm({ ...form, AlertModelType: option?.key as string || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          <TextField
            label="وصف الخطر"
            value={form.HazardDescription || ''}
            onChange={(_, v) => setForm({ ...form, HazardDescription: v || '' })}
            multiline
            rows={3}
            styles={{ root: { marginTop: 12 } }}
          />
          <Dropdown
            label="تفعيل البديل"
            selectedKey={form.ActivatedAlternative}
            options={SharePointService.getActivatedAlternativeOptions()}
            onChange={(_, option) => setForm({ ...form, ActivatedAlternative: option?.key as string || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          <TextField
            label="وقت التفعيل"
            type="datetime-local"
            value={form.ActivationTime || ''}
            onChange={(_, v) => setForm({ ...form, ActivationTime: v || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          <TextField
            label="وقت الإغلاق"
            type="datetime-local"
            value={form.ClosureTime || ''}
            onChange={(_, v) => setForm({ ...form, ClosureTime: v || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          <Dropdown
            label="الجهات المنسقة"
            selectedKey={form.CoordinatedEntities}
            options={SharePointService.getCoordinatedEntitiesOptions()}
            onChange={(_, option) => setForm({ ...form, CoordinatedEntities: option?.key as string || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          <Dropdown
            label="الإجراء المتخذ"
            selectedKey={form.ActionTaken}
            options={actionTakenOptions}
            onChange={(_, option) => setForm({ ...form, ActionTaken: option?.key as string || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          <Dropdown
            label="الموقع البديل"
            selectedKey={form.AltLocation}
            options={SharePointService.getAltLocationOptions()}
            onChange={(_, option) => setForm({ ...form, AltLocation: option?.key as string || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          <TextField
            label="التحديات"
            value={form.Challenges || ''}
            onChange={(_, v) => setForm({ ...form, Challenges: v || '' })}
            multiline
            rows={2}
            styles={{ root: { marginTop: 12 } }}
          />
          <TextField
            label="الدروس المستفادة"
            value={form.LessonsLearned || ''}
            onChange={(_, v) => setForm({ ...form, LessonsLearned: v || '' })}
            multiline
            rows={2}
            styles={{ root: { marginTop: 12 } }}
          />
          <TextField
            label="المقترحات"
            value={form.Suggestions || ''}
            onChange={(_, v) => setForm({ ...form, Suggestions: v || '' })}
            multiline
            rows={2}
            styles={{ root: { marginTop: 12 } }}
          />
          <Dropdown
            label="حالة الحادث"
            selectedKey={form.Status}
            options={statusOptions}
            onChange={(_, option) => setForm({ ...form, Status: option?.key as string || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
        </div>
      </Panel>
    </div>
  )
}

export default Incidents
