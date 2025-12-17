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
  const [isFromPlan, setIsFromPlan] = useState(false)
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
        minWidth: 80,
        flexGrow: 2,
        isResizable: true,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word', fontSize: '0.85rem' }}>{item.SchoolName_Ref}</div>
        ),
      });
    }

    cols.push(
      {
        key: 'DrillHypothesis',
        name: 'الفرضية',
        fieldName: 'DrillHypothesis',
        minWidth: 100,
        flexGrow: 1,
        isResizable: true,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word', fontSize: '0.85rem', lineHeight: '1.4' }}>{item.DrillHypothesis}</div>
        ),
      },
      {
        key: 'SpecificEvent',
        name: 'وصف الحدث المحدد *',
        fieldName: 'SpecificEvent',
        minWidth: 200,
        flexGrow: 4,
        isResizable: true,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => (
          <div style={{ textAlign: 'right', width: '100%', whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '0.85rem', color: '#333', lineHeight: '1.5', padding: '4px 0' }}>
            {item.SpecificEvent || '-'}
          </div>
        ),
      },
      {
        key: 'TargetGroup',
        name: 'الفئة المستهدفة',
        fieldName: 'TargetGroup',
        minWidth: 110,
        flexGrow: 1,
        isResizable: true,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word', fontSize: '0.85rem', lineHeight: '1.4' }}>{item.TargetGroup}</div>
        ),
      },
      {
        key: 'ExecutionDate',
        name: 'تاريخ التنفيذ',
        fieldName: 'ExecutionDate',
        minWidth: 80,
        flexGrow: 0,
        isResizable: true,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => {
          if (!item.ExecutionDate) return <div style={{ textAlign: 'center', width: '100%' }}>-</div>;
          const date = new Date(item.ExecutionDate);
          return <div style={{ textAlign: 'center', width: '100%' }}>{date.toLocaleDateString('ar-SA')}</div>;
        },
      },
      // أعمدة التقييم - تظهر للأدمن فقط
      ...(user?.type === 'admin' ? [{
        key: 'PlanRating',
        name: 'تقييم الخطة',
        minWidth: 70,
        flexGrow: 0,
        isResizable: true,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => {
          const rating = item.PlanEffectivenessRating
          if (!rating) return <div style={{ textAlign: 'center', color: '#999' }}>-</div>
          const colors = ['#d83b01', '#ff8c00', '#ffb900', '#107c10', '#0078d4']
          return (
            <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <span style={{ 
                backgroundColor: colors[rating - 1], 
                color: '#fff', 
                padding: '2px 8px', 
                borderRadius: 12, 
                fontSize: '0.8rem',
                fontWeight: 600 
              }}>
                {rating}/5
              </span>
            </div>
          )
        },
      },
      {
        key: 'ProceduresRating',
        name: 'تقييم الإجراءات',
        minWidth: 70,
        flexGrow: 0,
        isResizable: true,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => {
          const rating = item.ProceduresEffectivenessRating
          if (!rating) return <div style={{ textAlign: 'center', color: '#999' }}>-</div>
          const colors = ['#d83b01', '#ff8c00', '#ffb900', '#107c10', '#0078d4']
          return (
            <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <span style={{ 
                backgroundColor: colors[rating - 1], 
                color: '#fff', 
                padding: '2px 8px', 
                borderRadius: 12, 
                fontSize: '0.8rem',
                fontWeight: 600 
              }}>
                {rating}/5
              </span>
            </div>
          )
        },
      }] : []),
      {
        key: 'attachment',
        name: 'المرفق',
        minWidth: 65,
        flexGrow: 0,
        isResizable: true,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => {
          // Use DispForm.aspx?ID=X to open exact item in SharePoint
          const itemLink = `https://saudimoe.sharepoint.com/sites/em/Lists/SBC_Drills_Log/DispForm.aspx?ID=${item.Id}`;
          
          // Check if has attachment
          if (item.AttachmentUrl || item.HasAttachments) {
            return (
              <div style={{ textAlign: 'center', width: '100%' }}>
                <a
                  href={itemLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#0078d4',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  📎 عرض
                </a>
              </div>
            );
          }
          // No attachment - show add link to exact item
          return (
            <div style={{ textAlign: 'center', width: '100%' }}>
              <a
                href={itemLink}
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
                ➕ إضافة مرفق
              </a>
            </div>
          );
        },
      },
      {
        key: 'actions',
        name: 'الإجراءات',
        minWidth: 80,
        flexGrow: 0,
        styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
        onRender: (item: Drill) => (
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
              onClick={() => onDelete(item.Id || 0)}
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
      }
    );

    return cols;
  };

  // Load yearly drill plan from SharePoint service (secure storage)
  const [yearlyPlan, setYearlyPlan] = useState<any[]>([])
  
  useEffect(() => {
    loadDrills()
    loadYearlyPlan()
  }, [user])

  const loadYearlyPlan = async () => {
    try {
      // Load from SharePoint service (secure)
      const plans = await SharePointService.getAdminDrillPlans()
      setYearlyPlan(plans.map(p => ({
        id: p.Id,
        title: p.Title,
        hypothesis: p.DrillHypothesis || '',
        specificEvent: p.SpecificEvent || '',
        targetGroup: p.TargetGroup || '',
        startDate: p.StartDate || '',
        endDate: p.EndDate || '',
        status: p.PlanStatus || '',
        responsible: p.Responsible || '',
        notes: p.Notes || '',
      })))
    } catch (e) {
      console.error('Error loading yearly plan:', e)
      // Fallback to localStorage for backwards compatibility
      const savedPlan = localStorage.getItem('bc_test_plans')
      if (savedPlan) {
        setYearlyPlan(JSON.parse(savedPlan))
      }
    }
  }

  const loadDrills = async () => {
    setLoading(true)
    try {
      const schoolName = user?.type === 'admin' ? undefined : user?.schoolName
      // Get only school executions (not admin plans)
      const allData = await SharePointService.getDrills(schoolName)
      const schoolDrills = allData.filter(d => !d.IsAdminPlan)
      setDrills(schoolDrills)
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
    setIsFromPlan(false)
    setPanelOpen(true)
    setErrorMessage('')
  }

  // Store current plan being executed for date validation
  const [currentPlan, setCurrentPlan] = useState<any>(null)

  // Open from admin's plan - pre-fill all admin-defined fields
  const onOpenFromPlan = (plan: any) => {
    setForm({
      Title: plan.title || '',
      ExecutionDate: '',
      DrillHypothesis: plan.hypothesis || '',
      SpecificEvent: plan.specificEvent || '',  // Admin defined
      TargetGroup: plan.targetGroup || plan.responsible || '',  // Admin defined
      AttachmentUrl: '',
      SchoolName_Ref: user?.schoolName || '',
    })
    setCurrentPlan(plan)  // Store for date validation
    setShowCustomInput(false)
    setCustomTargetGroup('')
    setTargetGroupOptions([...defaultTargetGroupOptions])
    setIsEditing(false)
    setIsFromPlan(true)
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
    
    // Validate date is within admin's allowed range for plan-based drills
    if (isFromPlan && currentPlan && currentPlan.startDate && currentPlan.endDate) {
      const execDate = new Date(form.ExecutionDate)
      const startDate = new Date(currentPlan.startDate)
      const endDate = new Date(currentPlan.endDate)
      
      if (execDate < startDate || execDate > endDate) {
        setErrorMessage(`يجب أن يكون تاريخ التنفيذ بين ${startDate.toLocaleDateString('ar-SA')} و ${endDate.toLocaleDateString('ar-SA')}`)
        return false
      }
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
        await SharePointService.createDrill(drillData, user?.schoolId)
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
      {user?.schoolName && (
        <div style={{ backgroundColor: '#008752', borderRadius: '8px', padding: '16px 24px', color: '#fff', marginBottom: 16 }}>
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
            أهلاً - {user.schoolName}
          </span>
        </div>
      )}
      <h1 className="page-title" style={{ color: '#008752' }}>سجل التمارين الفرضية</h1>
      
      {message && (
        <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)} styles={{ root: { marginBottom: 16 } }}>
          {message.text}
        </MessageBar>
      )}

      {loading && <Spinner label="جاري التحميل..." />}

      {/* Yearly Drill Plan for Schools - Admin defined */}
      {yearlyPlan.length > 0 && (
        <div className="card" style={{ marginBottom: 20, padding: 16, backgroundColor: '#f0f9ff', border: '1px solid #0078d4', borderRadius: 8 }}>
          <h3 style={{ color: '#0078d4', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📋</span> خطة التمارين السنوية المعتمدة من الإدارة
          </h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 16 }}>
            اختر من التمارين المحددة من قبل الإدارة وقم بتنفيذها وتسجيل تاريخ التنفيذ
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: drills.length >= 4 ? '#107c10' : '#0078d4' }}>
              {drills.length} / {yearlyPlan.length}
            </span>
            <span style={{ color: drills.length >= yearlyPlan.length ? '#107c10' : '#666' }}>
              {drills.length >= yearlyPlan.length ? '✅ أكملت المدرسة الخطة السنوية' : `متبقي ${yearlyPlan.length - drills.length} تمرين`}
            </span>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {yearlyPlan.map((plan: any, idx: number) => {
              // Check if this drill was already executed by the school
              const executed = drills.find(d => 
                d.Title === plan.title || 
                d.DrillHypothesis === plan.hypothesis
              )
              
              // Check availability based on date range
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const startDate = plan.startDate ? new Date(plan.startDate) : null
              const endDate = plan.endDate ? new Date(plan.endDate) : null
              
              let availabilityStatus: 'not-started' | 'available' | 'expired' = 'available'
              if (startDate && today < startDate) {
                availabilityStatus = 'not-started'
              } else if (endDate && today > endDate) {
                availabilityStatus = 'expired'
              }
              
              return (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  padding: '12px 16px', 
                  backgroundColor: executed ? '#e8f5e9' : availabilityStatus === 'available' ? '#fff' : '#f5f5f5', 
                  borderRadius: 8, 
                  border: executed ? '2px solid #4caf50' : availabilityStatus === 'available' ? '1px solid #0078d4' : '1px solid #e1dfdd',
                  opacity: availabilityStatus === 'expired' && !executed ? 0.7 : 1
                }}>
                  <span style={{ 
                    backgroundColor: executed ? '#4caf50' : availabilityStatus === 'available' ? '#0078d4' : '#999', 
                    color: '#fff',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}>
                    {executed ? '✓' : idx + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#333' }}>{plan.title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{plan.hypothesis}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                      الفئة: {plan.targetGroup || plan.responsible || 'غير محدد'}
                    </div>
                    {/* Show date range availability */}
                    {(startDate || endDate) && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        marginTop: 4,
                        padding: '4px 8px',
                        borderRadius: 4,
                        backgroundColor: availabilityStatus === 'available' ? '#e6f7e6' : availabilityStatus === 'not-started' ? '#fff8e1' : '#ffebee',
                        color: availabilityStatus === 'available' ? '#107c10' : availabilityStatus === 'not-started' ? '#ff8f00' : '#d83b01',
                        display: 'inline-block'
                      }}>
                        {availabilityStatus === 'available' && '📅 متاح للتنفيذ حتى: ' + (endDate?.toLocaleDateString('ar-SA') || '')}
                        {availabilityStatus === 'not-started' && '⏳ يبدأ في: ' + (startDate?.toLocaleDateString('ar-SA') || '')}
                        {availabilityStatus === 'expired' && '⚠️ انتهت فترة التنفيذ'}
                      </div>
                    )}
                  </div>
                  {executed ? (
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: 16, 
                      fontSize: '0.8rem',
                      backgroundColor: '#4caf50',
                      color: '#fff'
                    }}>
                      ✅ تم التنفيذ
                    </span>
                  ) : availabilityStatus === 'available' ? (
                    <PrimaryButton 
                      text="تنفيذ التمرين" 
                      iconProps={{ iconName: 'Play' }}
                      onClick={() => onOpenFromPlan(plan)}
                      styles={{ root: { backgroundColor: '#107c10' } }}
                    />
                  ) : availabilityStatus === 'not-started' ? (
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: 16, 
                      fontSize: '0.8rem',
                      backgroundColor: '#ff8f00',
                      color: '#fff'
                    }}>
                      ⏳ لم يحن موعده
                    </span>
                  ) : (
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: 16, 
                      fontSize: '0.8rem',
                      backgroundColor: '#d83b01',
                      color: '#fff'
                    }}>
                      ⚠️ انتهى
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

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
        headerText={isEditing ? 'تعديل التمرين' : 'تنفيذ تمرين فرضي من الخطة السنوية'}
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

          {isFromPlan && (
            <MessageBar messageBarType={MessageBarType.info} styles={{ root: { marginBottom: 16 } }}>
              هذا التمرين محدد من قبل الإدارة. يمكنك فقط تحديد تاريخ التنفيذ ضمن الفترة المتاحة.
              {currentPlan?.startDate && currentPlan?.endDate && (
                <div style={{ marginTop: 8, fontWeight: 600 }}>
                  📅 فترة التنفيذ المتاحة: من {new Date(currentPlan.startDate).toLocaleDateString('ar-SA')} إلى {new Date(currentPlan.endDate).toLocaleDateString('ar-SA')}
                </div>
              )}
            </MessageBar>
          )}

          <TextField
            label="عنوان التمرين *"
            value={form.Title || ''}
            onChange={(_, v) => setForm({ ...form, Title: v || '' })}
            required
            placeholder="أدخل عنوان التمرين"
            readOnly={isFromPlan}
            disabled={isFromPlan}
            styles={isFromPlan ? { root: { backgroundColor: '#f3f2f1' } } : undefined}
          />

          <Dropdown
            label="فرضية التمرين *"
            selectedKey={form.DrillHypothesis}
            options={defaultDrillHypothesisOptions}
            onChange={(_, option) => setForm({ ...form, DrillHypothesis: option?.key as string || '' })}
            required
            styles={{ root: { marginTop: 16 } }}
            placeholder="اختر فرضية التمرين"
            disabled={isFromPlan}
          />

          <TextField
            label={isFromPlan ? "وصف الحدث المحدد (من الإدارة) *" : "وصف الحدث المحدد (اختياري)"}
            value={form.SpecificEvent || ''}
            onChange={(_, v) => setForm({ ...form, SpecificEvent: v || '' })}
            styles={{ 
              root: { marginTop: 16 },
              field: { 
                backgroundColor: isFromPlan ? '#e8f4fd' : undefined,
                minHeight: isFromPlan ? 100 : undefined,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                lineHeight: '1.6',
                padding: isFromPlan ? '12px' : undefined,
                fontSize: isFromPlan ? '0.95rem' : undefined
              }
            }}
            placeholder={isFromPlan ? '' : "وصف الحدث المحدد - يمكن للمدرسة كتابته"}
            multiline
            rows={isFromPlan ? 5 : 3}
            readOnly={isFromPlan}
            disabled={false}
            description={isFromPlan ? "هذا الوصف محدد من الإدارة - للقراءة فقط" : undefined}
          />

          <div style={{ marginTop: 16 }}>
            <Dropdown
              label="الفئة المستهدفة *"
              selectedKey={form.TargetGroup}
              options={targetGroupOptions}
              onChange={(_, option) => setForm({ ...form, TargetGroup: option?.key as string || '' })}
              required
              placeholder="اختر الفئة المستهدفة"
              disabled={isFromPlan}
            />
            
            {/* Add custom option button - only if not from plan */}
            {!isFromPlan && !showCustomInput ? (
              <DefaultButton
                text="+ إضافة فئة جديدة"
                onClick={() => setShowCustomInput(true)}
                styles={{ root: { marginTop: 8, fontSize: 12 } }}
              />
            ) : !isFromPlan && showCustomInput ? (
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
            ) : null}
          </div>

          <TextField
            label="تاريخ التنفيذ *"
            type="date"
            value={form.ExecutionDate || ''}
            onChange={(_, v) => setForm({ ...form, ExecutionDate: v || '' })}
            required
            styles={{ root: { marginTop: 16 } }}
            min={isFromPlan && currentPlan?.startDate ? currentPlan.startDate : undefined}
            max={new Date().toISOString().split('T')[0]}
            description={isFromPlan && currentPlan?.startDate && currentPlan?.endDate 
              ? `اختر تاريخ بين ${new Date(currentPlan.startDate).toLocaleDateString('ar-SA')} و اليوم (${new Date().toLocaleDateString('ar-SA')})`
              : `لا يمكن اختيار تاريخ مستقبلي - الحد الأقصى: ${new Date().toLocaleDateString('ar-SA')}`
            }
          />

          {/* قسم تقييم فعالية الخطة والإجراءات */}
          <div style={{ marginTop: 24, padding: 16, backgroundColor: '#fff8e1', borderRadius: 8, border: '1px solid #ffcc80' }}>
            <h4 style={{ color: '#ef6c00', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              📊 تقييم فعالية الخطة والإجراءات
            </h4>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: 16 }}>
              يرجى تقييم مدى فعالية الخطة والإجراءات المطبقة خلال التمرين (1 = ضعيف، 5 = ممتاز)
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>
                  تقييم فعالية الخطة *
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setForm({ ...form, PlanEffectivenessRating: rating })}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: form.PlanEffectivenessRating === rating ? '3px solid #0078d4' : '2px solid #ddd',
                        backgroundColor: form.PlanEffectivenessRating === rating ? '#0078d4' : '#fff',
                        color: form.PlanEffectivenessRating === rating ? '#fff' : '#333',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 4 }}>
                  {form.PlanEffectivenessRating === 1 && '⚠️ ضعيف - يحتاج تحسين جذري'}
                  {form.PlanEffectivenessRating === 2 && '📉 دون المتوقع'}
                  {form.PlanEffectivenessRating === 3 && '📊 متوسط - مقبول'}
                  {form.PlanEffectivenessRating === 4 && '📈 جيد جداً'}
                  {form.PlanEffectivenessRating === 5 && '⭐ ممتاز'}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>
                  تقييم فعالية الإجراءات *
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setForm({ ...form, ProceduresEffectivenessRating: rating })}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: form.ProceduresEffectivenessRating === rating ? '3px solid #107c10' : '2px solid #ddd',
                        backgroundColor: form.ProceduresEffectivenessRating === rating ? '#107c10' : '#fff',
                        color: form.ProceduresEffectivenessRating === rating ? '#fff' : '#333',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 4 }}>
                  {form.ProceduresEffectivenessRating === 1 && '⚠️ ضعيف - يحتاج تحسين جذري'}
                  {form.ProceduresEffectivenessRating === 2 && '📉 دون المتوقع'}
                  {form.ProceduresEffectivenessRating === 3 && '📊 متوسط - مقبول'}
                  {form.ProceduresEffectivenessRating === 4 && '📈 جيد جداً'}
                  {form.ProceduresEffectivenessRating === 5 && '⭐ ممتاز'}
                </div>
              </div>
            </div>
            
            <TextField
              label="ملاحظات وتعليقات المدرسة"
              value={form.SchoolFeedback || ''}
              onChange={(_, v) => setForm({ ...form, SchoolFeedback: v || '' })}
              multiline
              rows={2}
              styles={{ root: { marginTop: 16 } }}
              placeholder="أضف ملاحظاتك حول تنفيذ التمرين..."
            />
            
            <TextField
              label="مقترحات التحسين"
              value={form.ImprovementSuggestions || ''}
              onChange={(_, v) => setForm({ ...form, ImprovementSuggestions: v || '' })}
              multiline
              rows={2}
              styles={{ root: { marginTop: 12 } }}
              placeholder="ما هي مقترحاتك لتحسين الخطة والإجراءات؟"
            />
          </div>
        </div>
      </Panel>
    </div>
  )
}

export default Drills
