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
  IDropdownOption,
  Stack,
  MessageBar,
  MessageBarType,
  IconButton,
  Spinner
} from '@fluentui/react'
import { AdminDataService, TestPlan } from '../services/adminDataService'
import { BC_Test_PlansService } from '../generated'
import {
  DEFAULT_HYPOTHESIS_OPTIONS,
  DEFAULT_STATUS_OPTIONS,
  toDropdownOptions,
  getStatusColor,
} from '../config/drillConstants'

/**
 * DrilsManagement Component - Admin View
 * 
 * Purpose: Allow administrators to create, edit, and delete annual drill plans
 * 
 * Data Flow:
 * 1. Load all drill plans from BC_Test_Plans
 * 2. Display as table with Title, Hypothesis, Dates, Status, Quarter
 * 3. Admin can create new drill with all BC_Test_Plans fields
 * 4. Admin can edit existing drills
 * 5. Admin can delete drills with confirmation
 * 6. All changes sync to BC_Test_Plans SharePoint list
 */

const DrilsManagement: React.FC = () => {
  const [drills, setDrills] = useState<TestPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)
  
  // Choice field options from SharePoint
  const [hypothesisOptions, setHypothesisOptions] = useState<IDropdownOption[]>(DEFAULT_HYPOTHESIS_OPTIONS)
  const [statusOptions, setStatusOptions] = useState<IDropdownOption[]>(DEFAULT_STATUS_OPTIONS)
  
  const [form, setForm] = useState<Partial<TestPlan>>({
    title: '',
    hypothesis: '',
    specificEvent: '',
    targetGroup: '',
    startDate: '',
    endDate: '',
    status: '',
    responsible: '',
    notes: ''
  })

  useEffect(() => {
    loadDrillsAndOptions()
  }, [])

  /**
   * Load choice field values from SharePoint
   */
  const loadChoiceOptions = async () => {
    try {
      // Try to load Status (field_6) options from SharePoint
      const statusResult = await BC_Test_PlansService.getReferencedEntity('', 'field_6')
      const statusValues = (statusResult?.data as any)?.value
      if (statusValues && Array.isArray(statusValues)) {
        const options = toDropdownOptions(statusValues)
        if (options.length > 0) {
          setStatusOptions(options)
          console.log('✓ Loaded Status options from SharePoint:', options.map(o => o.text))
        }
      }
    } catch (error) {
      console.warn('Could not load choice options from SharePoint, using defaults')
    }
  }

  /**
   * Calculate the correct status based on dates
   * Logic:
   * - مخطط: Start date is in the future
   * - قيد التنفيذ: Current date is between start and end date  
   * - انتهى: End date has passed and not marked as مكتمل
   * - مكتمل: Only when school completes the drill (manual)
   */
  const calculateStatus = (drill: TestPlan): string => {
    if (!drill.startDate || !drill.endDate) return drill.status || 'مخطط'
    
    // If already completed, keep it
    if (drill.status === 'مكتمل') return 'مكتمل'
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(drill.startDate)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(drill.endDate)
    endDate.setHours(0, 0, 0, 0)
    
    if (today < startDate) {
      return 'مخطط'  // Start date is in the future
    } else if (today >= startDate && today <= endDate) {
      return 'قيد التنفيذ'  // Within date range
    } else if (today > endDate) {
      return 'انتهى'  // End date passed without completion
    }
    
    return drill.status || 'مخطط'
  }

  /**
   * Load all drill plans from BC_Test_Plans and auto-update statuses
   */
  const loadDrills = async () => {
    try {
      const loadedDrills = await AdminDataService.getTestPlans()
      
      // Auto-update statuses based on current date
      const updatedDrills = loadedDrills.map(drill => {
        const calculatedStatus = calculateStatus(drill)
        // If status changed, update in SharePoint in background
        if (calculatedStatus !== drill.status) {
          console.log(`[Drills] Auto-updating status for "${drill.title}": ${drill.status} → ${calculatedStatus}`)
          AdminDataService.updateTestPlan(drill.id, { ...drill, status: calculatedStatus })
            .catch(e => console.error(`Failed to update status for drill ${drill.id}:`, e))
        }
        return { ...drill, status: calculatedStatus }
      })
      
      setDrills(updatedDrills)
      console.log(`Loaded ${updatedDrills.length} drills from BC_Test_Plans`)
    } catch (error) {
      console.error('Error loading drills:', error)
      setMessage({
        type: MessageBarType.error,
        text: 'خطأ في تحميل التمارين الفرضية'
      })
    }
  }

  /**
   * Load both drills and choice options
   */
  const loadDrillsAndOptions = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadDrills(),
        loadChoiceOptions()
      ])
    } finally {
      setLoading(false)
    }
  }

  /**
   * Open panel to create new drill
   */
  const openCreatePanel = () => {
    setForm({
      title: '',
      hypothesis: '',
      specificEvent: '',
      targetGroup: '',
      startDate: '',
      endDate: '',
      status: '',
      responsible: '',
      notes: ''
    })
    setIsEditing(false)
    setPanelOpen(true)
  }

  /**
   * Open panel to edit existing drill
   */
  const openEditPanel = (drill: TestPlan) => {
    setForm(drill)
    setIsEditing(true)
    setPanelOpen(true)
  }

  /**
   * Save new or updated drill to BC_Test_Plans
   */
  const saveDrill = async () => {
    // Validation
    if (!form.title || !form.title.trim()) {
      setMessage({
        type: MessageBarType.warning,
        text: '⚠️ يرجى ملء اسم التمرين (الحقل مطلوب)'
      })
      return
    }
    
    if (!form.hypothesis || !form.hypothesis.trim()) {
      setMessage({
        type: MessageBarType.warning,
        text: '⚠️ يرجى اختيار الفرضية (الحقل مطلوب)'
      })
      return
    }
    
    if (!form.startDate) {
      setMessage({
        type: MessageBarType.warning,
        text: '⚠️ يرجى تحديد تاريخ البدء (الحقل مطلوب)'
      })
      return
    }
    
    if (!form.endDate) {
      setMessage({
        type: MessageBarType.warning,
        text: '⚠️ يرجى تحديد تاريخ الانتهاء (الحقل مطلوب)'
      })
      return
    }
    
    if (!form.targetGroup || !form.targetGroup.trim()) {
      setMessage({
        type: MessageBarType.warning,
        text: '⚠️ يرجى ملء الفئة المستهدفة (الحقل مطلوب)'
      })
      return
    }

    // Date validation: end date must be after start date
    if (form.startDate && form.endDate) {
      const startDate = new Date(form.startDate)
      const endDate = new Date(form.endDate)
      if (endDate <= startDate) {
        setMessage({
          type: MessageBarType.error,
          text: '⚠️ تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء'
        })
        return
      }
    }

    // Auto-calculate status based on current date
    // Logic:
    // - مخطط (Planned): Start date is in the future
    // - قيد التنفيذ (In Progress): Current date is between start and end date
    // - انتهى (Expired): End date has passed and school didn't complete
    // - مكتمل (Completed): Only set manually when school completes the drill
    let autoStatus = form.status
    if (form.startDate && form.endDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time for date comparison
      const startDate = new Date(form.startDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(form.endDate)
      endDate.setHours(0, 0, 0, 0)
      
      // Only auto-calculate if status is not manually set to مكتمل
      if (form.status !== 'مكتمل') {
        if (today < startDate) {
          autoStatus = 'مخطط'  // Planned - start date is in the future
        } else if (today >= startDate && today <= endDate) {
          autoStatus = 'قيد التنفيذ'  // In progress - within date range
        } else if (today > endDate) {
          autoStatus = 'انتهى'  // Expired - end date passed without completion
        }
      }
    }

    try {
      const drillToSave = {
        ...form,
        status: autoStatus  // Use auto-calculated status
      }
      
      if (isEditing && form.id) {
        // Update existing drill
        await AdminDataService.updateTestPlan(form.id, drillToSave)
        setMessage({
          type: MessageBarType.success,
          text: 'تم تحديث التمرين بنجاح (تم تحديث الحالة تلقائياً بناءً على التواريخ)'
        })
      } else {
        // Create new drill
        await AdminDataService.createTestPlan(drillToSave as Omit<TestPlan, 'id'>)
        setMessage({
          type: MessageBarType.success,
          text: 'تم إنشاء التمرين الجديد بنجاح'
        })
      }
      
      // Close panel and reload
      setTimeout(() => {
        setPanelOpen(false)
        loadDrillsAndOptions()
      }, 1000)
    } catch (error) {
      console.error('Error saving drill:', error)
      setMessage({
        type: MessageBarType.error,
        text: 'خطأ في حفظ التمرين: ' + (error instanceof Error ? error.message : 'Unknown error')
      })
    }
  }

  /**
   * Delete drill with confirmation
   */
  const deleteDrill = async (drillId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التمرين؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return
    }

    try {
      await AdminDataService.deleteTestPlan(drillId)
      setMessage({
        type: MessageBarType.success,
        text: 'تم حذف التمرين بنجاح'
      })
      await loadDrillsAndOptions()
    } catch (error) {
      console.error('Error deleting drill:', error)
      setMessage({
        type: MessageBarType.error,
        text: 'خطأ في حذف التمرين: ' + (error instanceof Error ? error.message : 'Unknown error')
      })
    }
  }

  /**
   * Table columns configuration
   */
  const columns: IColumn[] = [
    {
      key: 'title',
      name: 'اسم التمرين',
      fieldName: 'title',
      minWidth: 200,
      isResizable: true,
      onRender: (item: TestPlan) => (
        <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {item.title}
        </div>
      )
    },
    {
      key: 'hypothesis',
      name: 'الفرضية',
      fieldName: 'hypothesis',
      minWidth: 250,
      isResizable: true,
      onRender: (item: TestPlan) => (
        <div style={{ whiteSpace: 'normal', wordWrap: 'break-word', fontSize: 12 }}>
          {item.hypothesis}
        </div>
      )
    },
    {
      key: 'startDate',
      name: 'تاريخ البدء',
      fieldName: 'startDate',
      minWidth: 100,
      onRender: (item: TestPlan) => formatDate(item.startDate)
    },
    {
      key: 'endDate',
      name: 'تاريخ الانتهاء',
      fieldName: 'endDate',
      minWidth: 100,
      onRender: (item: TestPlan) => formatDate(item.endDate)
    },
    {
      key: 'status',
      name: 'الحالة',
      fieldName: 'status',
      minWidth: 100,
      onRender: (item: TestPlan) => (
        <span style={{
          padding: '4px 8px',
          borderRadius: 4,
          backgroundColor: item.status === 'مكتمل' ? '#e7f5e1' : 
                           item.status === 'قيد التنفيذ' ? '#e3f2fd' : '#fff3e0',
          color: item.status === 'مكتمل' ? '#107c10' : 
                 item.status === 'قيد التنفيذ' ? '#0078d4' : '#d97300',
          fontSize: 12,
          fontWeight: 600
        }}>
          {item.status}
        </span>
      )
    },
    {
      key: 'actions',
      name: 'الإجراءات',
      minWidth: 100,
      onRender: (item: TestPlan) => (
        <Stack horizontal tokens={{ childrenGap: 4 }}>
          <IconButton
            iconProps={{ iconName: 'Edit' }}
            onClick={() => openEditPanel(item)}
            title="تعديل"
            styles={{ root: { color: '#0078d4' } }}
          />
          <IconButton
            iconProps={{ iconName: 'Delete' }}
            onClick={() => deleteDrill(item.id)}
            title="حذف"
            styles={{ root: { color: '#d83b01' } }}
          />
        </Stack>
      )
    },
  ]

  /**
   * Dropdown options
   */
  const hypothesisOptionsToUse: IDropdownOption[] = hypothesisOptions.length > 0 ? hypothesisOptions : DEFAULT_HYPOTHESIS_OPTIONS
  const statusOptionsToUse: IDropdownOption[] = statusOptions.length > 0 ? statusOptions : DEFAULT_STATUS_OPTIONS

  // Format date for display
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('ar-SA')
    } catch {
      return dateStr || '-'
    }
  }

  return (
    <Stack tokens={{ childrenGap: 16 }} style={{ padding: '20px 0' }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 8px 0', color: '#008752' }}>
          إدارة خطة التمارين الفرضية السنوية
        </h2>
        <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
          أنشئ وأدر التمارين الفرضية السنوية (عادة 4 تمارين للمدارس)
        </p>
      </div>

      {/* Message Bar */}
      {message && (
        <MessageBar 
          messageBarType={message.type} 
          onDismiss={() => setMessage(null)}
          isMultiline={true}
        >
          {message.text}
        </MessageBar>
      )}

      {/* Create Button */}
      <PrimaryButton 
        text="+ إضافة تمرين جديد" 
        onClick={openCreatePanel}
        iconProps={{ iconName: 'Add' }}
      />

      {/* Drills List */}
      {loading ? (
        <Spinner label="جاري تحميل التمارين..." />
      ) : (
        <DetailsList
          items={drills}
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
          styles={{
            root: {
              marginTop: 12,
              border: '1px solid #e1e1e1',
              borderRadius: 8
            }
          }}
        />
      )}

      {drills.length === 0 && !loading && (
        <div style={{
          padding: 24,
          textAlign: 'center',
          backgroundColor: '#f7f7f7',
          borderRadius: 8,
          border: '1px dashed #e1e1e1'
        }}>
          <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
            لا توجد تمارين مخططة بعد. اضغط على "إضافة تمرين جديد" لبدء الإدارة.
          </p>
        </div>
      )}

      {/* Create/Edit Panel */}
      <Panel
        isOpen={panelOpen}
        onDismiss={() => {
          setPanelOpen(false)
          setForm({})
        }}
        headerText={isEditing ? 'تعديل التمرين الفرضي' : 'إضافة تمرين فرضي جديد'}
        closeButtonAriaLabel="إغلاق"
        isFooterAtBottom={true}
      >
        <Stack tokens={{ childrenGap: 16 }}>
          {/* Drill Title */}
          <TextField
            label="اسم التمرين *"
            value={form.title || ''}
            onChange={(e, val) => setForm({ ...form, title: val })}
            required
            placeholder="مثال: التمرين الفرضي - الربع الأول"
          />

          {/* Hypothesis */}
          <Dropdown
            label="الفرضية *"
            options={hypothesisOptionsToUse}
            selectedKey={form.hypothesis ? hypothesisOptionsToUse.find(h => h.text === form.hypothesis)?.key : ''}
            onChange={(e, val) => setForm({ ...form, hypothesis: val?.text || '' })}
            required
            placeholder="اختر الفرضية"
          />

          {/* Specific Event */}
          <TextField
            label="وصف الحدث المحدد"
            value={form.specificEvent || ''}
            onChange={(e, val) => setForm({ ...form, specificEvent: val })}
            placeholder="اشرح سيناريو التمرين بالتفصيل"
            multiline
            rows={2}
          />

          {/* Target Group */}
          <TextField
            label="الفئة المستهدفة *"
            value={form.targetGroup || ''}
            onChange={(e, val) => setForm({ ...form, targetGroup: val })}
            required
            placeholder="مثال: جميع المدارس، فريق الأمن، الطلاب والمعلمين"
          />

          {/* Start Date */}
          <TextField
            label="تاريخ البدء *"
            type="date"
            value={form.startDate || ''}
            onChange={(e, val) => setForm({ ...form, startDate: val })}
            required
          />

          {/* End Date */}
          <TextField
            label="تاريخ الانتهاء *"
            type="date"
            value={form.endDate || ''}
            onChange={(e, val) => setForm({ ...form, endDate: val })}
            required
          />

          {/* Status */}
          <Dropdown
            label="الحالة *"
            options={statusOptionsToUse}
            selectedKey={form.status ? statusOptionsToUse.find(s => s.text === form.status)?.key : ''}
            onChange={(e, val) => setForm({ ...form, status: val?.text || '' })}
            required
            placeholder="اختر الحالة"
          />

          {/* Responsible */}
          <TextField
            label="المسؤول"
            value={form.responsible || ''}
            onChange={(e, val) => setForm({ ...form, responsible: val })}
            placeholder="اسم الشخص المسؤول عن التمرين"
          />

          {/* Notes */}
          <TextField
            label="الملاحظات"
            multiline
            rows={3}
            value={form.notes || ''}
            onChange={(e, val) => setForm({ ...form, notes: val })}
            placeholder="أضف أي ملاحظات إضافية أو تعليمات"
          />

          {/* Action Buttons */}
          <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: 16 }}>
            <PrimaryButton 
              text="حفظ" 
              onClick={saveDrill}
            />
            <DefaultButton 
              text="إلغاء" 
              onClick={() => {
                setPanelOpen(false)
                setForm({})
              }}
            />
          </Stack>
        </Stack>
      </Panel>
    </Stack>
  )
}

export default DrilsManagement
