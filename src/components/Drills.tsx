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
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { SharePointService, Drill, ChoiceOption } from '../services/sharepointService'

// Default options matching original app
const defaultDrillHypothesisOptions: IDropdownOption[] = [
  { key: "الفرضية الأولى: تعذر استخدام المبنى المدرسي (كلي/جزئي).", text: "الفرضية الأولى: تعذر استخدام المبنى المدرسي (كلي/جزئي)." },
  { key: "الفرضية الثانية: تعطل الأنظمة والمنصات التعليمية (مدرستي/تيمز).", text: "الفرضية الثانية: تعطل الأنظمة والمنصات التعليمية (مدرستي/تيمز)." },
  { key: "الفرضية الثالثة: تعطل خدمة البث التعليمي (قنوات عين).", text: "الفرضية الثالثة: تعطل خدمة البث التعليمي (قنوات عين)." },
  { key: "الفرضية الرابعة: انقطاع الخدمات الأساسية (كهرباء/اتصال/مياه).", text: "الفرضية الرابعة: انقطاع الخدمات الأساسية (كهرباء/اتصال/مياه)." },
  { key: "الفرضية الخامسة: نقص الكوادر البشرية (جوائح/أوبئة).", text: "الفرضية الخامسة: نقص الكوادر البشرية (جوائح/أوبئة)." },
];

const defaultTargetGroupOptions: IDropdownOption[] = [
  { key: "إخلاء كامل (طلاب ومعلمين).", text: "إخلاء كامل (طلاب ومعلمين)." },
  { key: "تمرين مكتبي (فريق الأمن والسلامة فقط).", text: "تمرين مكتبي (فريق الأمن والسلامة فقط)." },
  { key: "محاكاة تقنية (عن بعد).", text: "محاكاة تقنية (عن بعد)." },
  { key: "إخلاء جزئي", text: "إخلاء جزئي" },
];

const Drills: React.FC = () => {
  const { user } = useAuth()
  const [drills, setDrills] = useState<Drill[]>([])
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customTargetGroup, setCustomTargetGroup] = useState('')
  const [targetGroupOptions, setTargetGroupOptions] = useState<IDropdownOption[]>([...defaultTargetGroupOptions])
  const [form, setForm] = useState<Partial<Drill>>({
    Title: '',
    DrillHypothesis: '',
    SpecificEvent: '',
    TargetGroup: '',
    ExecutionDate: '',
  })

  // Define columns matching original app
  const getColumns = (): IColumn[] => {
    const cols: IColumn[] = [];
    
    // Admin sees school name column
    if (user?.type === 'admin') {
      cols.push({
        key: 'SchoolName_Ref',
        name: 'المدرسة',
        fieldName: 'SchoolName_Ref',
        minWidth: 180,
        isResizable: true,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => (
          <div style={{ textAlign: 'center', width: '100%' }}>{item.SchoolName_Ref}</div>
        ),
      });
    }

    cols.push(
      {
        key: 'DrillHypothesis',
        name: 'الفرضية',
        fieldName: 'DrillHypothesis',
        minWidth: 280,
        isResizable: true,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => (
          <div style={{ textAlign: 'center', width: '100%' }}>{item.DrillHypothesis}</div>
        ),
      },
      {
        key: 'TargetGroup',
        name: 'الفئة المستهدفة',
        fieldName: 'TargetGroup',
        minWidth: 180,
        isResizable: true,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => (
          <div style={{ textAlign: 'center', width: '100%' }}>{item.TargetGroup}</div>
        ),
      },
      {
        key: 'ExecutionDate',
        name: 'تاريخ التنفيذ',
        fieldName: 'ExecutionDate',
        minWidth: 120,
        isResizable: true,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => {
          if (!item.ExecutionDate) return <div style={{ textAlign: 'center', width: '100%' }}>-</div>;
          const date = new Date(item.ExecutionDate);
          return <div style={{ textAlign: 'center', width: '100%' }}>{date.toLocaleDateString('ar-SA')}</div>;
        },
      },
      {
        key: 'actions',
        name: 'الإجراءات',
        minWidth: 140,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => (
          <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="center">
            <button
              onClick={() => onEdit(item)}
              title="تعديل"
              style={{
                padding: '4px 12px',
                backgroundColor: '#0078d4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              ✏️ تعديل
            </button>
            <button
              onClick={() => onDelete(item.Id || 0)}
              title="حذف"
              style={{
                padding: '4px 12px',
                backgroundColor: '#d13438',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              🗑️ حذف
            </button>
          </Stack>
        ),
      }
    );

    return cols;
  };

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
    setForm({
      Title: '',
      ExecutionDate: '',
      DrillHypothesis: '',
      SpecificEvent: '',
      TargetGroup: '',
      AttachmentUrl: '',
      SchoolName_Ref: user?.schoolName || '',
    })
    setShowCustomInput(false)
    setCustomTargetGroup('')
    setTargetGroupOptions([...defaultTargetGroupOptions])
    setIsEditing(false)
    setPanelOpen(true)
    setErrorMessage('')
  }

  const onEdit = (item: Drill) => {
    setForm({ ...item })
    setShowCustomInput(false)
    setCustomTargetGroup('')
    setTargetGroupOptions([...defaultTargetGroupOptions])
    setIsEditing(true)
    setPanelOpen(true)
    setErrorMessage('')
  }

  const onClose = () => {
    setPanelOpen(false)
    setIsEditing(false)
  }

  // Add custom target group
  const addCustomTargetGroup = () => {
    if (customTargetGroup.trim() && customTargetGroup.length <= 266) {
      const newOption: IDropdownOption = { key: customTargetGroup.trim(), text: customTargetGroup.trim() }
      setTargetGroupOptions([...targetGroupOptions, newOption])
      setForm({ ...form, TargetGroup: customTargetGroup.trim() })
      setShowCustomInput(false)
      setCustomTargetGroup('')
    }
  }

  // Validation matching original
  const validateForm = (): boolean => {
    if (!form.Title) {
      setErrorMessage('يرجى إدخال العنوان')
      return false
    }
    if (!form.DrillHypothesis) {
      setErrorMessage('يرجى اختيار الفرضية')
      return false
    }
    if (!form.TargetGroup) {
      setErrorMessage('يرجى اختيار الفئة المستهدفة')
      return false
    }
    if (!form.ExecutionDate) {
      setErrorMessage('يرجى اختيار تاريخ التنفيذ')
      return false
    }
    return true
  }

  const onSave = async () => {
    if (!validateForm()) return

    setLoading(true)
    setErrorMessage('')
    try {
      const drillData: Drill = {
        ...form,
        Title: form.Title!,
        SchoolName_Ref: user?.schoolName,
      }
      
      if (isEditing && form.Id) {
        await SharePointService.updateDrill(form.Id, drillData)
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
        <PrimaryButton 
          text="تسجيل تمرين جديد" 
          iconProps={{ iconName: 'CirclePlus' }} 
          onClick={onOpen} 
          disabled={loading}
          styles={{ root: { backgroundColor: '#008752', borderColor: '#008752' } }}
        />
      </Stack>

      <div className="card" style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <DetailsList
          items={drills}
          columns={getColumns()}
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
        headerText={isEditing ? 'تعديل التمرين' : 'تسجيل تمرين جديد'}
        type={PanelType.medium}
        isFooterAtBottom={true}
        onRenderFooterContent={() => (
          <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: 24 }}>
            <PrimaryButton 
              text={isEditing ? 'تحديث' : 'حفظ'} 
              onClick={onSave} 
              disabled={loading}
              styles={{ root: { backgroundColor: '#0078d4', borderColor: '#0078d4' } }}
            />
            <DefaultButton text="إلغاء" onClick={onClose} disabled={loading} />
          </Stack>
        )}
      >
        <div style={{ padding: 16 }}>
          {errorMessage && (
            <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setErrorMessage('')} styles={{ root: { marginBottom: 16 } }}>
              {errorMessage}
            </MessageBar>
          )}

          <TextField
            label="عنوان التمرين *"
            value={form.Title || ''}
            onChange={(_, v) => setForm({ ...form, Title: v || '' })}
            required
            placeholder="أدخل عنوان التمرين"
          />

          <Dropdown
            label="فرضية التمرين *"
            selectedKey={form.DrillHypothesis}
            options={defaultDrillHypothesisOptions}
            onChange={(_, option) => setForm({ ...form, DrillHypothesis: option?.key as string || '' })}
            required
            styles={{ root: { marginTop: 16 } }}
            placeholder="اختر فرضية التمرين"
          />

          <TextField
            label="الحدث المحدد"
            value={form.SpecificEvent || ''}
            onChange={(_, v) => setForm({ ...form, SpecificEvent: v || '' })}
            styles={{ root: { marginTop: 16 } }}
            placeholder="وصف الحدث المحدد (اختياري)"
          />

          <div style={{ marginTop: 16 }}>
            <Dropdown
              label="الفئة المستهدفة *"
              selectedKey={form.TargetGroup}
              options={targetGroupOptions}
              onChange={(_, option) => setForm({ ...form, TargetGroup: option?.key as string || '' })}
              required
              placeholder="اختر الفئة المستهدفة"
            />
            
            {/* Add custom option button */}
            {!showCustomInput ? (
              <DefaultButton
                text="+ إضافة فئة جديدة"
                onClick={() => setShowCustomInput(true)}
                styles={{ root: { marginTop: 8, fontSize: 12 } }}
              />
            ) : (
              <Stack horizontal tokens={{ childrenGap: 8 }} style={{ marginTop: 8 }}>
                <TextField
                  value={customTargetGroup}
                  onChange={(_, v) => setCustomTargetGroup(v || '')}
                  placeholder="أدخل الفئة الجديدة"
                  maxLength={266}
                  styles={{ root: { flex: 1 } }}
                />
                <PrimaryButton text="إضافة" onClick={addCustomTargetGroup} disabled={!customTargetGroup.trim()} />
                <DefaultButton text="إلغاء" onClick={() => { setShowCustomInput(false); setCustomTargetGroup(''); }} />
              </Stack>
            )}
          </div>

          <TextField
            label="تاريخ التنفيذ *"
            type="date"
            value={form.ExecutionDate || ''}
            onChange={(_, v) => setForm({ ...form, ExecutionDate: v || '' })}
            required
            styles={{ root: { marginTop: 16 } }}
          />
        </div>
      </Panel>
    </div>
  )
}

export default Drills
