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
import { SharePointService, Drill } from '../services/sharepointService'

const Drills: React.FC = () => {
  const { user } = useAuth()
  const [drills, setDrills] = useState<Drill[]>([])
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)
  const [form, setForm] = useState<Partial<Drill>>({
    Title: '',
    DrillHypothesis: '',
    SpecificEvent: '',
    TargetGroup: '',
    ExecutionDate: '',
  })

  const drillHypothesisOptions = SharePointService.getDrillHypothesisOptions()
  const targetGroupOptions = SharePointService.getTargetGroupOptions()

  const columns: IColumn[] = [
    { key: 'Title', name: 'عنوان التمرين', fieldName: 'Title', minWidth: 150, maxWidth: 200 },
    { key: 'DrillHypothesis', name: 'الفرضية', fieldName: 'DrillHypothesis', minWidth: 80, maxWidth: 100 },
    { key: 'TargetGroup', name: 'الفئة المستهدفة', fieldName: 'TargetGroup', minWidth: 100, maxWidth: 130 },
    { key: 'ExecutionDate', name: 'التاريخ', fieldName: 'ExecutionDate', minWidth: 90, maxWidth: 100 },
    {
      key: 'actions',
      name: 'الإجراءات',
      fieldName: 'actions',
      minWidth: 100,
      onRender: (item: Drill) => (
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
    loadDrills()
  }, [user])

  const loadDrills = async () => {
    setLoading(true)
    try {
      const schoolName = user?.type === 'admin' ? undefined : user?.schoolName
      const data = await SharePointService.getDrills(schoolName)
      setDrills(data)
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل تحميل التمارين: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  const onOpen = () => {
    setEditingId(null)
    setForm({
      Title: '',
      DrillHypothesis: '',
      SpecificEvent: '',
      TargetGroup: '',
      ExecutionDate: '',
    })
    setPanelOpen(true)
  }

  const onEdit = (item: Drill) => {
    setEditingId(item.Id!)
    setForm({ ...item })
    setPanelOpen(true)
  }

  const onClose = () => {
    setPanelOpen(false)
    setEditingId(null)
  }

  const onSave = async () => {
    if (!form.Title || !form.DrillHypothesis || !form.ExecutionDate) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى ملء جميع الحقول المطلوبة' })
      return
    }

    setLoading(true)
    try {
      const drillData: Drill = {
        ...form,
        Title: form.Title!,
        SchoolName_Ref: user?.schoolName,
      }
      
      if (editingId) {
        await SharePointService.updateDrill(editingId, drillData)
        setMessage({ type: MessageBarType.success, text: 'تم تحديث التمرين بنجاح' })
      } else {
        await SharePointService.createDrill(drillData)
        setMessage({ type: MessageBarType.success, text: 'تم تسجيل التمرين بنجاح' })
      }
      await loadDrills()
      onClose()
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل الحفظ: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التمرين؟')) return

    setLoading(true)
    try {
      await SharePointService.deleteDrill(id)
      setMessage({ type: MessageBarType.success, text: 'تم حذف التمرين بنجاح' })
      await loadDrills()
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل الحذف: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 className="page-title" style={{ color: '#008752' }}>سجل التمارين الفرضية</h1>
      
      {message && (
        <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)} styles={{ root: { marginBottom: 16 } }}>
          {message.text}
        </MessageBar>
      )}

      {loading && <Spinner label="جاري التحميل..." />}

      <Stack horizontal horizontalAlign="end" style={{ marginBottom: 16 }}>
        <PrimaryButton text="تسجيل تمرين جديد" iconProps={{ iconName: 'CirclePlus' }} onClick={onOpen} disabled={loading} />
      </Stack>

      <div className="card">
        <DetailsList
          items={drills}
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
        />
        {drills.length === 0 && !loading && (
          <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
            لا توجد تمارين مسجلة حالياً
          </div>
        )}
      </div>

      <Panel
        isOpen={panelOpen}
        onDismiss={onClose}
        headerText={editingId ? 'تعديل التمرين' : 'تسجيل تمرين جديد'}
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
            label="عنوان التمرين *"
            value={form.Title || ''}
            onChange={(_, v) => setForm({ ...form, Title: v || '' })}
            required
          />
          <Dropdown
            label="فرضية التمرين *"
            selectedKey={form.DrillHypothesis}
            options={drillHypothesisOptions}
            onChange={(_, option) => setForm({ ...form, DrillHypothesis: option?.key as string || '' })}
            required
            styles={{ root: { marginTop: 12 } }}
          />
          <TextField
            label="الحدث المحدد"
            value={form.SpecificEvent || ''}
            onChange={(_, v) => setForm({ ...form, SpecificEvent: v || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          <Dropdown
            label="الفئة المستهدفة"
            selectedKey={form.TargetGroup}
            options={targetGroupOptions}
            onChange={(_, option) => setForm({ ...form, TargetGroup: option?.key as string || '' })}
            styles={{ root: { marginTop: 12 } }}
          />
          <TextField
            label="تاريخ التمرين *"
            type="date"
            value={form.ExecutionDate || ''}
            onChange={(_, v) => setForm({ ...form, ExecutionDate: v || '' })}
            required
            styles={{ root: { marginTop: 12 } }}
          />
        </div>
      </Panel>
    </div>
  )
}

export default Drills
