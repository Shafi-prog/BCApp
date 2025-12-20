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
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { AdminDataService, TestPlan } from '../services/adminDataService'
import { BC_Test_PlansService } from '../generated'
import {
  DEFAULT_HYPOTHESIS_OPTIONS,
  DEFAULT_STATUS_OPTIONS,
  DEFAULT_QUARTER_OPTIONS,
  toDropdownOptions,
  getStatusColor,
} from '../config/drillConstants'

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
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedDrill, setSelectedDrill] = useState<TestPlan | null>(null)
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)
  
  // Choice field options from SharePoint
  const [statusOptions, setStatusOptions] = useState<IDropdownOption[]>(DEFAULT_STATUS_OPTIONS)
  
  // Execution form fields
  const [executionForm, setExecutionForm] = useState({
    executionDate: ''
  })

  // Load drills and choice options on mount
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
      // Save execution to SBC_Drills_Log
      await AdminDataService.recordDrillExecution(selectedDrill.id, {
        executionDate: executionForm.executionDate,
        schoolName: user?.schoolName || 'Unknown'
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
      }, 1500)
    } catch (error) {
      console.error('Error saving execution:', error)
      setMessage({
        type: MessageBarType.error,
        text: 'خطأ في حفظ تنفيذ التمرين: ' + (error instanceof Error ? error.message : 'Unknown error')
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
                      text={inRange ? "تنفيذ التمرين" : "خارج الفترة المسموحة"}
                      onClick={() => handleExecuteDrill(drill)}
                      disabled={!inRange}
                      iconProps={{ iconName: inRange ? 'Play' : 'Clock' }}
                      styles={{
                        root: { 
                          width: '100%',
                          backgroundColor: inRange ? '#008752' : '#ccc',
                          borderColor: inRange ? '#008752' : '#ccc'
                        },
                        rootDisabled: {
                          backgroundColor: '#e0e0e0',
                          color: '#666'
                        }
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}
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
