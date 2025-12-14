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
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { SharePointService, TrainingLog as TrainingLogType } from '../services/sharepointService'

const registrationTypeOptions = [
  { key: 'فردي', text: 'فردي' },
  { key: 'مجموعة', text: 'مجموعة' },
  { key: 'فريق كامل', text: 'فريق كامل' },
]

const TrainingLog: React.FC = () => {
  const { user } = useAuth()
  const [items, setItems] = useState<TrainingLogType[]>([])
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)
  const [form, setForm] = useState<Partial<TrainingLogType>>({
    Title: '',
    Program_Ref: '',
    RegistrationType: '',
    AttendeesNames: '',
    TrainingDate: '',
  })

  const columns: IColumn[] = [
    { key: 'Title', name: 'العنوان', fieldName: 'Title', minWidth: 150, maxWidth: 200 },
    { key: 'Program_Ref', name: 'البرنامج', fieldName: 'Program_Ref', minWidth: 150, maxWidth: 200 },
    { key: 'RegistrationType', name: 'نوع التسجيل', fieldName: 'RegistrationType', minWidth: 80, maxWidth: 100 },
    { key: 'AttendeesNames', name: 'أسماء الحضور', fieldName: 'AttendeesNames', minWidth: 150, maxWidth: 250 },
    { key: 'TrainingDate', name: 'تاريخ التدريب', fieldName: 'TrainingDate', minWidth: 100, maxWidth: 120 },
    {
      key: 'actions',
      name: 'الإجراءات',
      fieldName: 'actions',
      minWidth: 100,
      onRender: (item: TrainingLogType) => (
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

  useEffect(() => {
    loadTrainingLog()
  }, [user])

  const onOpen = () => {
    setEditingId(null)
    setForm({
      Title: '',
      Program_Ref: '',
      RegistrationType: '',
      AttendeesNames: '',
      TrainingDate: '',
    })
    setPanelOpen(true)
  }

  const onEdit = (item: TrainingLogType) => {
    setEditingId(item.Id!)
    setForm(item)
    setPanelOpen(true)
  }

  const onClose = () => {
    setPanelOpen(false)
    setEditingId(null)
  }

  const onSave = async () => {
    if (!form.Title || !form.Program_Ref) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى ملء جميع الحقول المطلوبة' })
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        await SharePointService.updateTrainingLog(editingId, { attendeeIds: [] })
        setMessage({ type: MessageBarType.success, text: 'تم تحديث السجل بنجاح' })
      } else {
        await SharePointService.registerForTraining(
          user?.schoolName || '',  // schoolName
          0,                        // programId
          [],                       // attendeeIds
          user?.schoolId,           // schoolId
          form.RegistrationType || 'فردي',  // registrationType
          form.TrainingDate         // trainingDate
        )
        setMessage({ type: MessageBarType.success, text: 'تم إضافة السجل بنجاح' })
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
      <h1 className="page-title" style={{ color: '#008752' }}>سجل التدريبات</h1>

      {message && (
        <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)} styles={{ root: { marginBottom: 16 } }}>
          {message.text}
        </MessageBar>
      )}

      {loading && <Spinner label="جاري التحميل..." />}

      <Stack horizontal horizontalAlign="end" style={{ marginBottom: 16 }}>
        <PrimaryButton 
          text="تسجيل تدريب جديد" 
          iconProps={{ iconName: 'Add' }} 
          onClick={onOpen}
          disabled={loading}
        />
      </Stack>

      <div className="card">
        <DetailsList
          items={items}
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
        />
        {items.length === 0 && !loading && (
          <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
            لا توجد سجلات تدريب حالياً
          </div>
        )}
      </div>

      <Panel
        isOpen={panelOpen}
        onDismiss={onClose}
        headerText={editingId ? 'تعديل سجل التدريب' : 'تسجيل تدريب جديد'}
        isFooterAtBottom={true}
        onRenderFooterContent={() => (
          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <PrimaryButton text="حفظ" onClick={onSave} disabled={loading} />
          </Stack>
        )}
      >
        <div style={{ padding: 16 }}>
          <TextField
            label="العنوان *"
            value={form.Title || ''}
            onChange={(_, v) => setForm({ ...form, Title: v || '' })}
            required
          />
          <TextField
            label="البرنامج التدريبي *"
            value={form.Program_Ref || ''}
            onChange={(_, v) => setForm({ ...form, Program_Ref: v || '' })}
            required
            styles={{ root: { marginTop: 12 } }}
          />
          <Dropdown
            label="نوع التسجيل"
            selectedKey={form.RegistrationType}
            options={registrationTypeOptions}
            onChange={(_, option) => setForm({ ...form, RegistrationType: option?.key as string || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          <TextField
            label="أسماء الحضور"
            value={form.AttendeesNames || ''}
            onChange={(_, v) => setForm({ ...form, AttendeesNames: v || '' })}
            multiline
            rows={3}
            styles={{ root: { marginTop: 12 } }}
          />
          <TextField
            label="تاريخ التدريب"
            type="date"
            value={form.TrainingDate || ''}
            onChange={(_, v) => setForm({ ...form, TrainingDate: v || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
        </div>
      </Panel>
    </div>
  )
}

export default TrainingLog
