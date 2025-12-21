import React, { useState, useEffect } from 'react'
import {
  Stack,
  PrimaryButton,
  DefaultButton,
  Panel,
  TextField,
  MessageBar,
  MessageBarType,
  Spinner,
  IDropdownOption,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  IGroup,
  IconButton,
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { AdminDataService, TestPlan } from '../services/adminDataService'
import { SharePointService, Drill } from '../services/sharepointService'
import { BC_Test_PlansService } from '../generated'
import {
  DEFAULT_HYPOTHESIS_OPTIONS,
  DEFAULT_STATUS_OPTIONS,
  DEFAULT_QUARTER_OPTIONS,
  toDropdownOptions,
  getStatusColor,
} from '../config/drillConstants'
import { getColumnConfig, ColumnType, renderDate } from '../config/tableConfig'

/**
 * Drills Component - School View (Card-Based UI)
 * 
 * Purpose: Display annual drill plans from BC_Test_Plans and allow schools to execute them
 * 
 * Data Source: BC_Test_Plans SharePoint list
 * Field Mapping:
 *   - Title = Title
 *   - field_1 = hypothesis (الفرضية)
 *   - field_2 = specificEvent (الحدث المحدد)
 *   - field_3 = targetGroup (الفئة المستهدفة)
 *   - field_4 = startDate (تاريخ البداية)
 *   - field_5 = endDate (تاريخ النهاية)
 *   - field_6 = status (الحالة)
 *   - field_7 = responsible (المسؤول)
 *   - field_8 = notes (الملاحظات)
 * 
 * Logic:
 *   - Execute button is DISABLED if today's date is outside the drill's startDate-endDate range
 *   - Schools can only execute drills during the allowed period
 *   - Execution saves to SBC_Drills_Log
 */

const Drills: React.FC = () => {
  const { user } = useAuth()
  
  // State management
  const [drills, setDrills] = useState<TestPlan[]>([])
  const [executedDrills, setExecutedDrills] = useState<Drill[]>([])
  const [filteredExecutedDrills, setFilteredExecutedDrills] = useState<Drill[]>([])
  const [executedGroups, setExecutedGroups] = useState<IGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingExecutions, setLoadingExecutions] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedDrill, setSelectedDrill] = useState<TestPlan | null>(null)
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)
  const [selectedLetter, setSelectedLetter] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none')
  
  // Choice field options from SharePoint
  const [statusOptions, setStatusOptions] = useState<IDropdownOption[]>(DEFAULT_STATUS_OPTIONS)
  
  // Execution form fields
  const [executionForm, setExecutionForm] = useState({
    executionDate: ''
  })

  // Load drills and choice options on mount
  useEffect(() => {
    if (user !== undefined) {
      loadDrillsAndOptions()
      loadExecutedDrills()
    }
  }, [user])

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
   * Load drill plans from BC_Test_Plans SharePoint list
   * This data is created and managed by administrators
   */
  const loadDrills = async () => {
    try {
      const loadedDrills = await AdminDataService.getDrillsForSchool()
      setDrills(loadedDrills)
      console.log(`Loaded ${loadedDrills.length} drills from BC_Test_Plans`)
    } catch (error) {
      console.error('Error loading drills:', error)
      setMessage({
        type: MessageBarType.error,
        text: 'خطأ في تحميل التمارين الفرضية'
      })
    }
  }

  /**
   * Load executed drills from SBC_Drills_Log
   * Shows drills that have been executed by schools
   */
  const loadExecutedDrills = async () => {
    setLoadingExecutions(true)
    try {
      const schoolName = user?.type === 'admin' ? undefined : user?.schoolName
      const data = await SharePointService.getDrills(schoolName)
      setExecutedDrills(data)
      const result = createExecutedDrillsGroups(data)
      setFilteredExecutedDrills(result.items)
      setExecutedGroups(result.groups)
      console.log(`Loaded ${data.length} executed drills from SBC_Drills_Log`)
    } catch (error) {
      console.error('Error loading executed drills:', error)
    } finally {
      setLoadingExecutions(false)
    }
  }

  // Create groups by school name for executed drills
  const createExecutedDrillsGroups = (data: Drill[]): { items: Drill[], groups: IGroup[] } => {
    const schoolMap = new Map<string, Drill[]>()
    data.forEach(item => {
      const schoolName = item.SchoolName_Ref || 'غير محدد'
      if (!schoolMap.has(schoolName)) {
        schoolMap.set(schoolName, [])
      }
      schoolMap.get(schoolName)!.push(item)
    })

    const sortedSchools = Array.from(schoolMap.keys()).sort((a, b) => {
      if (sortOrder === 'none') return 0
      return sortOrder === 'asc' ? a.localeCompare(b, 'ar') : b.localeCompare(a, 'ar')
    })

    const groupedItems: Drill[] = []
    const groups: IGroup[] = []
    let startIndex = 0

    sortedSchools.forEach(schoolName => {
      const schoolItems = schoolMap.get(schoolName)!
      groups.push({
        key: schoolName,
        name: schoolName,
        startIndex: startIndex,
        count: schoolItems.length,
        level: 0,
      })
      groupedItems.push(...schoolItems)
      startIndex += schoolItems.length
    })

    return { items: groupedItems, groups }
  }

  // Filter executed drills by school name alphabet
  const applySorting = (data: Drill[]) => {
    if (sortOrder === 'none') return data
    return [...data].sort((a, b) => {
      const nameA = a.SchoolName_Ref || ''
      const nameB = b.SchoolName_Ref || ''
      return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'ar') : nameB.localeCompare(nameA, 'ar')
    })
  }

  const sortBySchoolName = (order: 'asc' | 'desc' | 'none') => {
    setSortOrder(order)
    const sorted = applySorting(selectedLetter ? filteredExecutedDrills : executedDrills)
    setFilteredExecutedDrills(sorted)
  }

  const filterExecutedDrillsByLetter = (letter: string) => {
    setSelectedLetter(letter)
    let filtered = letter ? executedDrills.filter(item => item.SchoolName_Ref?.startsWith(letter)) : executedDrills
    filtered = applySorting(filtered)
    setFilteredExecutedDrills(filtered)
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
   * Check if drill is within execution date range
   */
  const isDrillInRange = (drill: TestPlan): boolean => {
    if (!drill.startDate || !drill.endDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(drill.startDate)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(drill.endDate)
    endDate.setHours(23, 59, 59, 999)
    return today >= startDate && today <= endDate
  }

  /**
   * Check if drill has been executed (exists in executedDrills)
   */
  const isDrillExecuted = (drillTitle: string): boolean => {
    return executedDrills.some(executed => executed.Title === drillTitle)
  }

  /**
   * Open execution panel when school clicks "تنفيذ"
   */
  const handleExecuteDrill = (drill: TestPlan) => {
    setSelectedDrill(drill)
    setExecutionForm({ executionDate: '' })
    setPanelOpen(true)
  }

  /**
   * Save drill execution to SBC_Drills_Log
   */
  const saveExecution = async () => {
    if (!selectedDrill || !executionForm.executionDate) {
      setMessage({
        type: MessageBarType.warning,
        text: 'يرجى ملء جميع الحقول المطلوبة'
      })
      return
    }

    // Validate execution date is not in the future
    const executionDate = new Date(executionForm.executionDate)
    const today = new Date()
    if (executionDate > today) {
      setMessage({
        type: MessageBarType.error,
        text: '⚠️ لا يمكن اختيار تاريخ مستقبلي - يجب اختيار تاريخ التنفيذ الفعلي (اليوم أو في الماضي)'
      })
      return
    }

    // Validate execution date is within the drill period
    const drillStartDate = new Date(selectedDrill.startDate)
    const drillEndDate = new Date(selectedDrill.endDate)
    if (executionDate < drillStartDate || executionDate > drillEndDate) {
      setMessage({
        type: MessageBarType.warning,
        text: `⚠️ تاريخ التنفيذ يجب أن يكون ضمن الفترة المسموحة: ${formatDate(selectedDrill.startDate)} - ${formatDate(selectedDrill.endDate)}`
      })
      return
    }

    try {
      // Save execution to SBC_Drills_Log with all drill plan information
      await AdminDataService.recordDrillExecution(selectedDrill.id, {
        executionDate: executionForm.executionDate,
        schoolName: user?.schoolName || 'Unknown',
        title: selectedDrill.title,
        hypothesis: selectedDrill.hypothesis,
        specificEvent: selectedDrill.specificEvent,
        targetGroup: selectedDrill.targetGroup
      })
      
      setMessage({
        type: MessageBarType.success,
        text: 'تم تسجيل التمرين بنجاح في النظام'
      })
      
      // Close panel and reload drills
      setTimeout(() => {
        setPanelOpen(false)
        setSelectedDrill(null)
        loadDrillsAndOptions()
        loadExecutedDrills()
      }, 1500)
    } catch (error: any) {
      console.error('Error saving execution:', error)
      const errorMessage = error?.message || error?.toString() || 'حدث خطأ غير معروف أثناء حفظ التمرين'
      setMessage({
        type: MessageBarType.error,
        text: `خطأ في حفظ تنفيذ التمرين: ${errorMessage}`
      })
    }
  }

  // Format date for display
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('ar-SA')
    } catch {
      return dateStr
    }
  }

  // Delete executed drill
  const onDeleteExecutedDrill = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التمرين المنفذ؟')) return
    
    try {
      await SharePointService.deleteDrill(id)
      setMessage({
        type: MessageBarType.success,
        text: 'تم حذف التمرين بنجاح'
      })
      loadExecutedDrills()
    } catch (error: any) {
      setMessage({
        type: MessageBarType.error,
        text: `خطأ في حذف التمرين: ${error?.message || error}`
      })
    }
  }

  // Edit executed drill
  const onEditExecutedDrill = (drill: Drill) => {
    // For now, just show a message - full edit functionality would require a panel
    setMessage({
      type: MessageBarType.info,
      text: 'وظيفة التعديل قيد التطوير'
    })
    // TODO: Add edit panel with form for execution date and other fields
  }

  // Build columns array for executed drills table
  const getExecutedDrillsColumns = (): IColumn[] => {
    const cols: IColumn[] = []
    
    // Admin sees school name column first
    if (user?.type === 'admin') {
      cols.push({
        ...getColumnConfig(ColumnType.SHORT_TEXT),
        key: 'SchoolName_Ref',
        name: 'المدرسة',
        fieldName: 'SchoolName_Ref',
        onRender: (item: Drill) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {item.SchoolName_Ref || '-'}
          </div>
        ),
      })
    }
    
    cols.push(
      {
        ...getColumnConfig(ColumnType.MEDIUM_TEXT),
        key: 'Title',
        name: 'عنوان التمرين',
        fieldName: 'Title',
        onRender: (item: Drill) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {item.Title || '-'}
          </div>
        ),
      },
      {
        ...getColumnConfig(ColumnType.MEDIUM_TEXT),
        key: 'DrillHypothesis',
        name: 'الفرضية',
        fieldName: 'DrillHypothesis',
        onRender: (item: Drill) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {item.DrillHypothesis || '-'}
          </div>
        ),
      },
      {
        ...getColumnConfig(ColumnType.LONG_TEXT),
        key: 'SpecificEvent',
        name: 'الحدث المحدد',
        fieldName: 'SpecificEvent',
        onRender: (item: Drill) => (
          <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {item.SpecificEvent || '-'}
          </div>
        ),
      },
      {
        ...getColumnConfig(ColumnType.SHORT_TEXT),
        key: 'TargetGroup',
        name: 'الفئة المستهدفة',
        fieldName: 'TargetGroup',
        onRender: (item: Drill) => (
          <div style={{ textAlign: 'center', width: '100%' }}>
            {item.TargetGroup || '-'}
          </div>
        ),
      },
      {
        ...getColumnConfig(ColumnType.DATE),
        key: 'ExecutionDate',
        name: 'تاريخ التنفيذ',
        fieldName: 'ExecutionDate',
        onRender: (item: Drill) => renderDate(item.ExecutionDate),
      },
      {
        ...getColumnConfig(ColumnType.ACTIONS),
        key: 'actions',
        name: 'الإجراءات',
        fieldName: 'actions',
        onRender: (item: Drill) => (
          <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="center">
            <IconButton
              iconProps={{ iconName: 'Edit', styles: { root: { fontSize: 16, fontWeight: 600 } } }}
              onClick={() => onEditExecutedDrill(item)}
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
              onClick={() => onDeleteExecutedDrill(item.Id!)}
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
    )
    return cols
  }

  // Show loading while waiting for user context
  if (user === undefined) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spinner label="جاري التحميل..." />
      </div>
    )
  }

  return (
    <Stack tokens={{ childrenGap: 20 }} style={{ padding: '20px' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ margin: '0 0 8px 0', color: '#008752' }}>
          سجل التمارين الفرضية
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
          خطة التمارين السنوية المعتمدة من الإدارة - يرجى تنفيذ وتسجيل جميع التمارين ضمن الفترة المحددة
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

      {/* Loading State */}
      {loading ? (
        <Spinner label="جاري تحميل التمارين الفرضية..." />
      ) : (
        /* Drills Cards */
        <>
          <div>
            <h2 style={{ margin: '0 0 16px 0', color: '#008752', fontSize: 18 }}>
              خطة التمارين السنوية
            </h2>
            {drills.length === 0 ? (
              <div style={{
                padding: 24,
                textAlign: 'center',
                backgroundColor: '#f7f7f7',
                borderRadius: 8,
                border: '1px dashed #e1e1e1'
              }}>
                <p style={{ color: '#666', fontSize: 14 }}>
                  لا توجد تمارين متاحة حاليا. يرجى التواصل مع الإدارة للحصول على خطة التمارين.
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                gap: 20 
              }}>
                {drills.map((drill) => {
                  const inRange = isDrillInRange(drill)
                  const isExecuted = isDrillExecuted(drill.title)
                  const statusColor = getStatusColor(drill.status)
                  
                  return (
                    <div 
                      key={drill.id}
                      style={{
                        border: inRange ? '2px solid #008752' : '1px solid #e1e1e1',
                        borderRadius: 8,
                        padding: 20,
                        backgroundColor: '#fff',
                        boxShadow: inRange 
                          ? '0 4px 12px rgba(0, 135, 82, 0.15)' 
                          : '0 2px 6px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.2s ease',
                        opacity: inRange ? 1 : 0.7,
                      }}
                    >
                      {/* Header with Title and Status */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: 16 
                      }}>
                        <h3 style={{ 
                          margin: 0, 
                          color: '#008752',
                          fontSize: 16,
                          fontWeight: 600,
                          flex: 1
                        }}>
                          {drill.title}
                        </h3>
                        <span style={{
                          backgroundColor: statusColor.color,
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: 4,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          marginRight: 8,
                          whiteSpace: 'nowrap'
                        }}>
                          {drill.status || 'قيد الانتظار'}
                        </span>
                      </div>

                      {/* Drill Details */}
                      <div style={{ marginBottom: 16 }}>
                        {/* Hypothesis */}
                        <div style={{ marginBottom: 12 }}>
                          <strong style={{ color: '#333', fontSize: 13, display: 'block', marginBottom: 4 }}>
                            الفرضية:
                          </strong>
                          <p style={{ 
                            margin: 0, 
                            color: '#555', 
                            fontSize: 13, 
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            backgroundColor: '#f9f9f9',
                            padding: 8,
                            borderRadius: 4
                          }}>
                            {drill.hypothesis || '-'}
                          </p>
                        </div>

                        {/* Target Group */}
                        <div style={{ marginBottom: 12 }}>
                          <strong style={{ color: '#333', fontSize: 13 }}>الفئة المستهدفة: </strong>
                          <span style={{ color: '#555', fontSize: 13 }}>{drill.targetGroup || '-'}</span>
                        </div>

                        {/* Date Range */}
                        <div style={{ 
                          backgroundColor: inRange ? '#e8f5e9' : '#fff3e0',
                          padding: 10,
                          borderRadius: 6,
                          border: `1px solid ${inRange ? '#c8e6c9' : '#ffe0b2'}`
                        }}>
                          <strong style={{ color: '#333', fontSize: 13, display: 'block', marginBottom: 4 }}>
                            📅 فترة التنفيذ المسموحة:
                          </strong>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            fontSize: 13,
                            color: inRange ? '#2e7d32' : '#e65100'
                          }}>
                            <span>من: {formatDate(drill.startDate)}</span>
                            <span>إلى: {formatDate(drill.endDate)}</span>
                          </div>
                          {!inRange && (
                            <p style={{ 
                              margin: '8px 0 0 0', 
                              fontSize: 12, 
                              color: '#d84315',
                              fontWeight: 500
                            }}>
                              ⚠️ التاريخ الحالي خارج فترة التنفيذ المسموحة
                            </p>
                          )}
                        </div>

                        {/* Responsible */}
                        {drill.responsible && (
                          <div style={{ marginTop: 12 }}>
                            <strong style={{ color: '#333', fontSize: 13 }}>المسؤول: </strong>
                            <span style={{ color: '#555', fontSize: 13 }}>{drill.responsible}</span>
                          </div>
                        )}

                        {/* Notes */}
                        {drill.notes && (
                          <div style={{ marginTop: 12 }}>
                            <strong style={{ color: '#333', fontSize: 13, display: 'block', marginBottom: 4 }}>
                              ملاحظات:
                            </strong>
                            <p style={{ 
                              margin: 0, 
                              color: '#666', 
                              fontSize: 12,
                              fontStyle: 'italic'
                            }}>
                              {drill.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Execute Button */}
                      <PrimaryButton
                        text={isExecuted ? "تم التنفيذ ✓" : (inRange ? "تنفيذ التمرين" : "خارج الفترة المسموحة")}
                        onClick={() => handleExecuteDrill(drill)}
                        disabled={!inRange || isExecuted}
                        iconProps={{ iconName: isExecuted ? 'CheckMark' : (inRange ? 'Play' : 'Clock') }}
                        styles={{
                          root: { 
                            width: '100%',
                            backgroundColor: isExecuted ? '#4caf50' : (inRange ? '#008752' : '#ccc'),
                            borderColor: isExecuted ? '#4caf50' : (inRange ? '#008752' : '#ccc')
                          },
                          rootDisabled: {
                            backgroundColor: isExecuted ? '#81c784' : '#e0e0e0',
                            color: isExecuted ? '#fff' : '#666'
                          }
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Executed Drills Table */}
          <div style={{ marginTop: 40 }}>
            <h2 style={{ margin: '0 0 16px 0', color: '#008752', fontSize: 18 }}>
              {user?.type === 'admin' ? 'التمارين المنفذة من جميع المدارس' : 'التمارين المنفذة'}
            </h2>

            {/* Alphabet Filter and Sorting for Admin */}
            {user?.type === 'admin' && executedDrills.length > 0 && (
              <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                <Stack horizontal horizontalAlign="space-between" style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#323130', fontSize: 12 }}>ترتيب:</span>
                  <Stack horizontal tokens={{ childrenGap: 8 }}>
                    <DefaultButton
                      text="تصاعدي (أ-ي)"
                      iconProps={{ iconName: 'SortUp' }}
                      onClick={() => sortBySchoolName('asc')}
                      styles={{
                        root: {
                          backgroundColor: sortOrder === 'asc' ? '#008752' : 'white',
                          color: sortOrder === 'asc' ? 'white' : '#333',
                          border: '1px solid #008752',
                        }
                      }}
                    />
                    <DefaultButton
                      text="تنازلي (ي-أ)"
                      iconProps={{ iconName: 'SortDown' }}
                      onClick={() => sortBySchoolName('desc')}
                      styles={{
                        root: {
                          backgroundColor: sortOrder === 'desc' ? '#008752' : 'white',
                          color: sortOrder === 'desc' ? 'white' : '#333',
                          border: '1px solid #008752',
                        }
                      }}
                    />
                    <DefaultButton
                      text="بدون ترتيب"
                      onClick={() => sortBySchoolName('none')}
                      styles={{
                        root: {
                          backgroundColor: sortOrder === 'none' ? '#008752' : 'white',
                          color: sortOrder === 'none' ? 'white' : '#333',
                          border: '1px solid #008752',
                        }
                      }}
                    />
                  </Stack>
                </Stack>
                <span style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#323130', fontSize: 12 }}>تصفية حسب اسم المدرسة:</span>
                <Stack horizontal tokens={{ childrenGap: 4 }} wrap>
                  <DefaultButton
                    text="الكل"
                    onClick={() => filterExecutedDrillsByLetter('')}
                    styles={{
                      root: {
                        minWidth: 35,
                        padding: '4px 8px',
                        backgroundColor: !selectedLetter ? '#008752' : '#fff',
                        color: !selectedLetter ? '#fff' : '#323130',
                        border: '1px solid #e1e1e1'
                      }
                    }}
                  />
                  {['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'].map(letter => (
                    <DefaultButton
                      key={letter}
                      text={letter}
                      onClick={() => filterExecutedDrillsByLetter(letter)}
                      styles={{
                        root: {
                          minWidth: 35,
                          padding: '4px 8px',
                          backgroundColor: selectedLetter === letter ? '#008752' : '#fff',
                          color: selectedLetter === letter ? '#fff' : '#323130',
                          border: '1px solid #e1e1e1'
                        }
                      }}
                    />
                  ))}
                </Stack>
                {selectedLetter && (
                  <span style={{ display: 'block', marginTop: 8, color: '#666', fontSize: 12 }}>
                    عرض {filteredExecutedDrills.length} تمرين منفذ يبدأ بحرف "{selectedLetter}"
                  </span>
                )}
              </div>
            )}

            {loadingExecutions ? (
              <Spinner label="جاري تحميل التمارين المنفذة..." />
            ) : filteredExecutedDrills.length === 0 ? (
              <div style={{
                padding: 24,
                textAlign: 'center',
                backgroundColor: '#f7f7f7',
                borderRadius: 8,
                border: '1px dashed #e1e1e1'
              }}>
                <p style={{ color: '#666', fontSize: 14 }}>
                  لا توجد تمارين منفذة بعد
                </p>
              </div>
            ) : (
              <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <DetailsList
                  items={filteredExecutedDrills}
                  columns={getExecutedDrillsColumns()}
                  groups={user?.type === 'admin' ? executedGroups : undefined}
                  layoutMode={DetailsListLayoutMode.justified}
                  selectionMode={SelectionMode.none}
                  groupProps={{
                    showEmptyGroups: false,
                  }}
                  styles={{
                    root: {
                      '.ms-DetailsRow': {
                        borderBottom: '1px solid #edebe9',
                      },
                      '.ms-DetailsRow:hover': {
                        background: '#f3f2f1',
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Execution Panel */}
      <Panel
        isOpen={panelOpen}
        onDismiss={() => {
          setPanelOpen(false)
          setSelectedDrill(null)
        }}
        headerText={selectedDrill ? `تنفيذ: ${selectedDrill.title}` : 'تنفيذ التمرين'}
        closeButtonAriaLabel="إغلاق"
      >
        <Stack tokens={{ childrenGap: 16 }} style={{ paddingTop: 16 }}>
          {/* Read-only Drill Info */}
          {selectedDrill && (
            <div style={{ 
              backgroundColor: '#f3f2f1', 
              padding: 16, 
              borderRadius: 8,
              borderRight: '4px solid #008752'
            }}>
              <div style={{ marginBottom: 12 }}>
                <strong style={{ color: '#333', fontSize: 14 }}>الفرضية:</strong>
                <p style={{ 
                  margin: '6px 0 0 0', 
                  color: '#555', 
                  whiteSpace: 'pre-wrap', 
                  wordWrap: 'break-word',
                  fontSize: 14,
                  lineHeight: 1.6
                }}>
                  {selectedDrill.hypothesis}
                </p>
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong style={{ color: '#333', fontSize: 14 }}>الفئة المستهدفة:</strong>
                <p style={{ margin: '6px 0 0 0', color: '#555', fontSize: 14 }}>
                  {selectedDrill.targetGroup || '-'}
                </p>
              </div>
              <div>
                <strong style={{ color: '#333', fontSize: 14 }}>الفترة المسموحة:</strong>
                <p style={{ margin: '6px 0 0 0', color: '#008752', fontWeight: 600, fontSize: 14 }}>
                  {formatDate(selectedDrill.startDate)} - {formatDate(selectedDrill.endDate)}
                </p>
              </div>
            </div>
          )}

          {/* Execution Date */}
          <div>
            <label style={{ 
              display: 'block', 
              fontWeight: 600, 
              marginBottom: 8,
              color: '#333',
              fontSize: 14
            }}>
              تاريخ التنفيذ الفعلي *
            </label>
            <TextField
              type="date"
              value={executionForm.executionDate}
              onChange={(e, val) => setExecutionForm({ 
                ...executionForm, 
                executionDate: val || '' 
              })}
              required
              placeholder="اختر التاريخ"
              max={new Date().toISOString().split('T')[0]}
              min={selectedDrill?.startDate?.split('T')[0]}
              description="يجب أن يكون التاريخ ضمن فترة التمرين المسموحة"
            />
          </div>

          {/* Action Buttons */}
          <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: 16 }}>
            <PrimaryButton 
              text="حفظ التنفيذ" 
              onClick={saveExecution}
              iconProps={{ iconName: 'Save' }}
              styles={{
                root: { backgroundColor: '#008752', borderColor: '#008752' }
              }}
            />
            <DefaultButton 
              text="إلغاء" 
              onClick={() => {
                setPanelOpen(false)
                setSelectedDrill(null)
              }}
            />
          </Stack>
        </Stack>
      </Panel>
    </Stack>
  )
}

export default Drills
