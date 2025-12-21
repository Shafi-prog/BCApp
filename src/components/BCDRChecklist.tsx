import React, { useState, useEffect } from 'react'
import {
  Stack, Text, PrimaryButton, DefaultButton, TextField, Dropdown,
  DetailsList, DetailsListLayoutMode, SelectionMode, IColumn, Panel, PanelType,
  MessageBar, MessageBarType, Spinner, IDropdownOption, IconButton, DatePicker
} from '@fluentui/react'
import { SharePointService, BCDRChecklist } from '../services/sharepointService'
import { getColumnConfig, ColumnType } from '../config/tableConfig'

const categoryOptions: IDropdownOption[] = [
  { key: 'الأجهزة', text: 'الأجهزة' },
  { key: 'البرمجيات', text: 'البرمجيات' },
  { key: 'الشبكة', text: 'الشبكة' },
  { key: 'الكهرباء', text: 'الكهرباء' },
  { key: 'التكييف', text: 'التكييف' },
  { key: 'الأمن', text: 'الأمن' },
  { key: 'النسخ الاحتياطي', text: 'النسخ الاحتياطي' },
  { key: 'الاتصالات', text: 'الاتصالات' },
  { key: 'أخرى', text: 'أخرى' },
]

const statusOptions: IDropdownOption[] = [
  { key: 'جاهز', text: 'جاهز' },
  { key: 'يحتاج صيانة', text: 'يحتاج صيانة' },
  { key: 'غير جاهز', text: 'غير جاهز' },
  { key: 'قيد الصيانة', text: 'قيد الصيانة' },
]

const BCDRChecklistComponent: React.FC = () => {
  const [items, setItems] = useState<BCDRChecklist[]>([])
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)
  
  const [form, setForm] = useState<Partial<BCDRChecklist>>({
    Title: '',
    Category: '',
    Status: '',
    LastChecked: '',
    CheckedBy: '',
    Notes: '',
    SortOrder: 0,
  })

  const columns: IColumn[] = [
    {
      ...getColumnConfig(ColumnType.SHORT_TEXT),
      key: 'SortOrder',
      name: 'الترتيب',
      fieldName: 'SortOrder',
      minWidth: 60,
      maxWidth: 80,
      onRender: (item: BCDRChecklist) => (
        <div style={{ textAlign: 'center', width: '100%' }}>{item.SortOrder || ''}</div>
      ),
    },
    {
      ...getColumnConfig(ColumnType.MEDIUM_TEXT),
      key: 'Title',
      name: 'العنصر',
      fieldName: 'Title',
      onRender: (item: BCDRChecklist) => (
        <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {item.Title}
        </div>
      ),
    },
    {
      ...getColumnConfig(ColumnType.SHORT_TEXT),
      key: 'Category',
      name: 'الفئة',
      fieldName: 'Category',
      onRender: (item: BCDRChecklist) => (
        <div style={{ textAlign: 'center', width: '100%' }}>{item.Category}</div>
      ),
    },
    {
      ...getColumnConfig(ColumnType.SHORT_TEXT),
      key: 'Status',
      name: 'الحالة',
      fieldName: 'Status',
      onRender: (item: BCDRChecklist) => {
        let color = '#666'
        if (item.Status === 'جاهز') color = '#008752'
        else if (item.Status === 'يحتاج صيانة') color = '#ff8c00'
        else if (item.Status === 'غير جاهز') color = '#d83b01'
        else if (item.Status === 'قيد الصيانة') color = '#0078d4'
        return (
          <div style={{ textAlign: 'center', width: '100%', color, fontWeight: 600 }}>
            {item.Status}
          </div>
        )
      },
    },
    {
      ...getColumnConfig(ColumnType.DATE),
      key: 'LastChecked',
      name: 'آخر فحص',
      fieldName: 'LastChecked',
      onRender: (item: BCDRChecklist) => {
        if (!item.LastChecked) return <div style={{ textAlign: 'center', width: '100%' }}>-</div>
        const date = new Date(item.LastChecked)
        return (
          <div style={{ textAlign: 'center', width: '100%' }}>
            {date.toLocaleDateString('ar-SA')}
          </div>
        )
      },
    },
    {
      ...getColumnConfig(ColumnType.SHORT_TEXT),
      key: 'CheckedBy',
      name: 'تم الفحص بواسطة',
      fieldName: 'CheckedBy',
      onRender: (item: BCDRChecklist) => (
        <div style={{ textAlign: 'center', width: '100%' }}>{item.CheckedBy || '-'}</div>
      ),
    },
    {
      ...getColumnConfig(ColumnType.LONG_TEXT),
      key: 'Notes',
      name: 'الملاحظات',
      fieldName: 'Notes',
      onRender: (item: BCDRChecklist) => (
        <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {item.Notes || '-'}
        </div>
      ),
    },
    {
      ...getColumnConfig(ColumnType.ACTIONS),
      key: 'actions',
      name: 'الإجراءات',
      onRender: (item: BCDRChecklist) => (
        <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="center">
          <IconButton
            iconProps={{ iconName: 'Edit' }}
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
            iconProps={{ iconName: 'Delete' }}
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

  const loadChecklist = async () => {
    setLoading(true)
    try {
      const data = await SharePointService.getBCDRChecklist()
      setItems(data)
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل تحميل قائمة التحقق: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChecklist()
  }, [])

  const onOpen = () => {
    setEditingId(null)
    setForm({
      Title: '',
      Category: '',
      Status: '',
      LastChecked: new Date().toISOString(),
      CheckedBy: '',
      Notes: '',
      SortOrder: items.length + 1,
    })
    setPanelOpen(true)
  }

  const onEdit = (item: BCDRChecklist) => {
    setEditingId(item.Id!)
    setForm({
      Title: item.Title,
      Category: item.Category,
      Status: item.Status,
      LastChecked: item.LastChecked,
      CheckedBy: item.CheckedBy,
      Notes: item.Notes,
      SortOrder: item.SortOrder,
    })
    setPanelOpen(true)
  }

  const onClose = () => {
    setPanelOpen(false)
    setEditingId(null)
    setForm({
      Title: '',
      Category: '',
      Status: '',
      LastChecked: '',
      CheckedBy: '',
      Notes: '',
      SortOrder: 0,
    })
  }

  const onSave = async () => {
    if (!form.Title || !form.Category || !form.Status) {
      setMessage({ type: MessageBarType.error, text: 'يرجى ملء جميع الحقول المطلوبة' })
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        await SharePointService.updateBCDRChecklistItem(editingId, form)
        setMessage({ type: MessageBarType.success, text: 'تم تحديث العنصر بنجاح' })
      } else {
        await SharePointService.createBCDRChecklistItem(form)
        setMessage({ type: MessageBarType.success, text: 'تم إضافة العنصر بنجاح' })
      }
      await loadChecklist()
      onClose()
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل حفظ العنصر: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) return

    setLoading(true)
    try {
      await SharePointService.deleteBCDRChecklistItem(id)
      setMessage({ type: MessageBarType.success, text: 'تم حذف العنصر بنجاح' })
      await loadChecklist()
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل حذف العنصر: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 className="page-title" style={{ color: '#008752' }}>قائمة التحقق من جاهزية مركز البيانات الاحتياطي</h1>

      {message && (
        <MessageBar
          messageBarType={message.type}
          onDismiss={() => setMessage(null)}
          styles={{ root: { marginBottom: 16 } }}
        >
          {message.text}
        </MessageBar>
      )}

      {loading && <Spinner label="جاري التحميل..." />}

      <Stack horizontal horizontalAlign="start" style={{ marginBottom: 16 }}>
        <PrimaryButton
          text="إضافة عنصر جديد"
          iconProps={{ iconName: 'Add' }}
          onClick={onOpen}
          disabled={loading}
          styles={{ root: { backgroundColor: '#008752', borderColor: '#008752' } }}
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
            لا توجد عناصر في قائمة التحقق حالياً
          </div>
        )}
      </div>

      <Panel
        isOpen={panelOpen}
        onDismiss={onClose}
        headerText={editingId ? 'تعديل عنصر' : 'إضافة عنصر جديد'}
        type={PanelType.medium}
        isFooterAtBottom={true}
        onRenderFooterContent={() => (
          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <PrimaryButton text="حفظ" onClick={onSave} disabled={loading} />
            <DefaultButton text="إلغاء" onClick={onClose} disabled={loading} />
          </Stack>
        )}
      >
        <Stack tokens={{ childrenGap: 16 }} style={{ marginTop: 20 }}>
          <TextField
            label="العنصر *"
            value={form.Title}
            onChange={(_, val) => setForm({ ...form, Title: val || '' })}
            required
          />
          
          <Dropdown
            label="الفئة *"
            selectedKey={form.Category}
            options={categoryOptions}
            onChange={(_, option) => setForm({ ...form, Category: option?.key as string || '' })}
            required
          />
          
          <Dropdown
            label="الحالة *"
            selectedKey={form.Status}
            options={statusOptions}
            onChange={(_, option) => setForm({ ...form, Status: option?.key as string || '' })}
            required
          />
          
          <DatePicker
            label="تاريخ آخر فحص"
            value={form.LastChecked ? new Date(form.LastChecked) : undefined}
            onSelectDate={(date) => setForm({ ...form, LastChecked: date?.toISOString() || '' })}
            formatDate={(date) => date?.toLocaleDateString('ar-SA') || ''}
          />
          
          <TextField
            label="تم الفحص بواسطة"
            value={form.CheckedBy}
            onChange={(_, val) => setForm({ ...form, CheckedBy: val || '' })}
          />
          
          <TextField
            label="الملاحظات"
            value={form.Notes}
            onChange={(_, val) => setForm({ ...form, Notes: val || '' })}
            multiline
            rows={4}
          />
          
          <TextField
            label="الترتيب"
            type="number"
            value={form.SortOrder?.toString()}
            onChange={(_, val) => setForm({ ...form, SortOrder: parseInt(val || '0') })}
          />
        </Stack>
      </Panel>
    </div>
  )
}

export default BCDRChecklistComponent
