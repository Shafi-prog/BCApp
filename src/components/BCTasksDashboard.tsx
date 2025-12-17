/**
 * BC Tasks Dashboard - لوحة متابعة المهام الـ 25
 * Comprehensive dashboard for tracking all 25 BC tasks
 * Connects all data sources and provides unified view
 */

import React, { useState, useEffect, useMemo } from 'react'
import {
  Stack, Text, Icon, ProgressIndicator, DetailsList, DetailsListLayoutMode,
  SelectionMode, IColumn, Pivot, PivotItem, MessageBar, MessageBarType,
  SearchBox, Dropdown, IDropdownOption, DefaultButton, TooltipHost
} from '@fluentui/react'
import { bcTasks, getTasksByCategory, taskCategories, BCTask, TaskStatus } from '../data/tasksStructure'
import { columnWidths, cellStyles, renderCenteredText, getStatusStyle } from '../config/tableStyles'

interface BCTasksDashboardProps {
  // Data from parent component
  schools: any[]
  teamMembers: any[]
  drills: any[]
  incidents: any[]
  trainingLogs: any[]
  testPlans: any[]
  adminContacts: any[]
  bcPlanDocuments: any[]
  incidentEvaluations: any[]
  drChecklist: any[]
  sharedBCPlan: any
  planReview: any
}

interface TaskProgress {
  taskId: number
  status: 'not_started' | 'in_progress' | 'completed'
  completionPercent: number
  evidence: string
  lastUpdated: string
}

const BCTasksDashboard: React.FC<BCTasksDashboardProps> = ({
  schools, teamMembers, drills, incidents, trainingLogs,
  testPlans, adminContacts, bcPlanDocuments, incidentEvaluations,
  drChecklist, sharedBCPlan, planReview
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Calculate task statuses based on real data
  const taskProgress = useMemo((): TaskProgress[] => {
    return bcTasks.map(task => {
      const progress = calculateTaskProgress(task, {
        schools, teamMembers, drills, incidents, trainingLogs,
        testPlans, adminContacts, bcPlanDocuments, incidentEvaluations,
        drChecklist, sharedBCPlan, planReview
      })
      return {
        taskId: task.taskId,
        ...progress
      }
    })
  }, [schools, teamMembers, drills, incidents, trainingLogs, testPlans, 
      adminContacts, bcPlanDocuments, incidentEvaluations, drChecklist, 
      sharedBCPlan, planReview])

  // Stats
  const stats = useMemo(() => {
    const completed = taskProgress.filter(t => t.status === 'completed').length
    const inProgress = taskProgress.filter(t => t.status === 'in_progress').length
    const notStarted = taskProgress.filter(t => t.status === 'not_started').length
    const avgCompletion = Math.round(taskProgress.reduce((acc, t) => acc + t.completionPercent, 0) / taskProgress.length)
    
    return { completed, inProgress, notStarted, avgCompletion, total: bcTasks.length }
  }, [taskProgress])

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return bcTasks.filter(task => {
      const progress = taskProgress.find(p => p.taskId === task.taskId)
      
      // Category filter
      if (filterCategory !== 'all' && task.category !== filterCategory) return false
      
      // Status filter
      if (filterStatus !== 'all' && progress?.status !== filterStatus) return false
      
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        return task.title.toLowerCase().includes(searchLower) ||
               task.description.toLowerCase().includes(searchLower) ||
               task.taskNumber.includes(searchQuery)
      }
      
      return true
    })
  }, [filterCategory, filterStatus, searchQuery, taskProgress])

  // Category options
  const categoryOptions: IDropdownOption[] = [
    { key: 'all', text: 'جميع التصنيفات' },
    ...Object.entries(taskCategories).map(([key, val]) => ({
      key,
      text: `${val.icon} ${val.label}`
    }))
  ]

  // Status options
  const statusOptions: IDropdownOption[] = [
    { key: 'all', text: 'جميع الحالات' },
    { key: 'completed', text: '✅ مكتملة' },
    { key: 'in_progress', text: '⏳ قيد التنفيذ' },
    { key: 'not_started', text: '○ لم تبدأ' }
  ]

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard 
          title="إجمالي المهام" 
          value={stats.total} 
          icon="TaskList" 
          color="#0078d4" 
        />
        <StatCard 
          title="مكتملة" 
          value={stats.completed} 
          icon="CheckMark" 
          color="#107c10" 
        />
        <StatCard 
          title="قيد التنفيذ" 
          value={stats.inProgress} 
          icon="Clock" 
          color="#ffb900" 
        />
        <StatCard 
          title="لم تبدأ" 
          value={stats.notStarted} 
          icon="StatusCircleRing" 
          color="#d83b01" 
        />
        <StatCard 
          title="نسبة الإنجاز" 
          value={`${stats.avgCompletion}%`} 
          icon="ProgressRingDots" 
          color="#5c2d91" 
        />
      </div>

      {/* Progress Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text variant="mediumPlus" style={{ fontWeight: 600 }}>تقدم المهام الإجمالي</Text>
          <Text variant="large" style={{ fontWeight: 700, color: '#008752' }}>{stats.avgCompletion}%</Text>
        </div>
        <ProgressIndicator 
          percentComplete={stats.avgCompletion / 100} 
          barHeight={12}
          styles={{
            progressBar: { backgroundColor: '#008752' },
            progressTrack: { backgroundColor: '#e8e8e8' }
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.8rem', color: '#666' }}>
          <span>✅ {stats.completed} مكتملة</span>
          <span>⏳ {stats.inProgress} قيد التنفيذ</span>
          <span>○ {stats.notStarted} لم تبدأ</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <Stack horizontal tokens={{ childrenGap: 16 }} wrap>
          <SearchBox
            placeholder="بحث في المهام..."
            value={searchQuery}
            onChange={(_, v) => setSearchQuery(v || '')}
            styles={{ root: { width: 250 } }}
          />
          <Dropdown
            placeholder="التصنيف"
            selectedKey={filterCategory}
            options={categoryOptions}
            onChange={(_, opt) => setFilterCategory(opt?.key as string || 'all')}
            styles={{ root: { width: 180 } }}
          />
          <Dropdown
            placeholder="الحالة"
            selectedKey={filterStatus}
            options={statusOptions}
            onChange={(_, opt) => setFilterStatus(opt?.key as string || 'all')}
            styles={{ root: { width: 150 } }}
          />
          <div style={{ flex: 1 }} />
          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <DefaultButton
              text="بطاقات"
              iconProps={{ iconName: 'GridViewMedium' }}
              checked={viewMode === 'cards'}
              onClick={() => setViewMode('cards')}
            />
            <DefaultButton
              text="جدول"
              iconProps={{ iconName: 'Table' }}
              checked={viewMode === 'table'}
              onClick={() => setViewMode('table')}
            />
          </Stack>
        </Stack>
      </div>

      {/* Tasks Display */}
      {viewMode === 'cards' ? (
        <TaskCards tasks={filteredTasks} taskProgress={taskProgress} />
      ) : (
        <TaskTable tasks={filteredTasks} taskProgress={taskProgress} />
      )}

      {/* Category Summary */}
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <Text variant="mediumPlus" style={{ fontWeight: 600, marginBottom: 16, display: 'block' }}>
          ملخص حسب التصنيف
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {Object.entries(taskCategories).map(([key, category]) => {
            const categoryTasks = bcTasks.filter(t => t.category === key)
            const categoryProgress = taskProgress.filter(p => 
              categoryTasks.some(t => t.taskId === p.taskId)
            )
            const completed = categoryProgress.filter(p => p.status === 'completed').length
            const percent = Math.round((completed / categoryTasks.length) * 100)
            
            return (
              <div 
                key={key}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: '#f5f5f5',
                  borderRight: `4px solid ${category.color}`,
                  cursor: 'pointer',
                }}
                onClick={() => setFilterCategory(key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>{category.icon}</span>
                  <Text variant="small" style={{ fontWeight: 600 }}>{category.label}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666', fontSize: '0.75rem' }}>{completed}/{categoryTasks.length}</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: percent === 100 ? '#107c10' : percent > 50 ? '#ffb900' : '#d83b01',
                    fontSize: '1rem'
                  }}>
                    {percent}%
                  </span>
                </div>
                <ProgressIndicator 
                  percentComplete={percent / 100}
                  barHeight={4}
                  styles={{ 
                    progressBar: { backgroundColor: category.color },
                    root: { marginTop: 8 }
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Linked Tasks Summary */}
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <Text variant="mediumPlus" style={{ fontWeight: 600, marginBottom: 16, display: 'block' }}>
          🔗 المهام المترابطة (الإدخال الواحد يحقق عدة مهام)
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {/* Group 1: Plans */}
          <LinkedTasksCard
            title="مجموعة الخطط"
            tasks={[1, 7]}
            taskProgress={taskProgress}
            color="#5c2d91"
            description="رفع خطة BC واحدة = يحقق المهمتين 1 و 7"
          />
          
          {/* Group 2: Drills */}
          <LinkedTasksCard
            title="مجموعة التمارين"
            tasks={[2, 16, 22]}
            taskProgress={taskProgress}
            color="#0078d4"
            description="تنفيذ تمرين واحد = يحقق المهام 2 و 16 و 22"
          />
          
          {/* Group 3: Evaluation */}
          <LinkedTasksCard
            title="مجموعة التقييم"
            tasks={[6, 13, 14, 23]}
            taskProgress={taskProgress}
            color="#d83b01"
            description="تقييم حادث واحد = يحقق المهام 6 و 13 و 14 و 23"
          />
          
          {/* Group 4: Teams */}
          <LinkedTasksCard
            title="مجموعة الفرق"
            tasks={[16, 17]}
            taskProgress={taskProgress}
            color="#107c10"
            description="إضافة عضو فريق = يحقق المهمتين 16 و 17"
          />
        </div>
      </div>
    </div>
  )
}

// ============================================
// Helper Components
// ============================================

// Linked Tasks Card - shows grouped tasks that are satisfied by single entry
const LinkedTasksCard: React.FC<{
  title: string
  tasks: number[]
  taskProgress: TaskProgress[]
  color: string
  description: string
}> = ({ title, tasks, taskProgress, color, description }) => {
  const linkedProgress = taskProgress.filter(p => tasks.includes(p.taskId))
  const completed = linkedProgress.filter(p => p.status === 'completed').length
  const avgPercent = Math.round(linkedProgress.reduce((acc, p) => acc + p.completionPercent, 0) / linkedProgress.length)
  const allComplete = completed === tasks.length
  
  return (
    <div style={{
      padding: 16,
      borderRadius: 8,
      backgroundColor: allComplete ? '#dff6dd' : '#f9f9f9',
      border: `2px solid ${allComplete ? '#107c10' : color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon iconName="Link" style={{ color, fontSize: 16 }} />
        <Text variant="medium" style={{ fontWeight: 600 }}>{title}</Text>
        {allComplete && <Icon iconName="CheckMark" style={{ color: '#107c10', fontSize: 14 }} />}
      </div>
      
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {tasks.map(taskId => {
          const progress = taskProgress.find(p => p.taskId === taskId)
          const isComplete = progress?.status === 'completed'
          return (
            <span key={taskId} style={{
              padding: '2px 8px',
              borderRadius: 12,
              backgroundColor: isComplete ? '#e8f5e9' : '#fff3e0',
              color: isComplete ? '#2e7d32' : '#ef6c00',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              المهمة {taskId} {isComplete ? '✓' : `${progress?.completionPercent || 0}%`}
            </span>
          )
        })}
      </div>
      
      <Text variant="small" style={{ color: '#666', display: 'block', marginBottom: 8 }}>
        {description}
      </Text>
      
      <ProgressIndicator 
        percentComplete={avgPercent / 100}
        barHeight={6}
        styles={{ progressBar: { backgroundColor: allComplete ? '#107c10' : color } }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.7rem', color: '#666' }}>
        <span>{completed}/{tasks.length} مكتملة</span>
        <span style={{ fontWeight: 600, color: allComplete ? '#107c10' : color }}>{avgPercent}%</span>
      </div>
    </div>
  )
}

const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = 
  ({ title, value, icon, color }) => (
  <div className="card" style={{ padding: 16, textAlign: 'center', borderTop: `4px solid ${color}` }}>
    <Icon iconName={icon} style={{ fontSize: 24, color, marginBottom: 8 }} />
    <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
    <div style={{ color: '#666', fontSize: '0.8rem' }}>{title}</div>
  </div>
)

const TaskCards: React.FC<{ tasks: BCTask[]; taskProgress: TaskProgress[] }> = ({ tasks, taskProgress }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
    {tasks.map(task => {
      const progress = taskProgress.find(p => p.taskId === task.taskId)
      const category = taskCategories[task.category]
      const statusColors = {
        completed: { bg: '#dff6dd', border: '#107c10', text: '#107c10' },
        in_progress: { bg: '#fff4ce', border: '#ffb900', text: '#835c00' },
        not_started: { bg: '#f3f2f1', border: '#a19f9d', text: '#605e5c' }
      }
      const colors = statusColors[progress?.status || 'not_started']
      
      return (
        <div 
          key={task.taskId}
          className="card"
          style={{
            padding: 16,
            backgroundColor: colors.bg,
            border: `2px solid ${colors.border}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                backgroundColor: category.color,
                color: '#fff',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}>
                {task.taskNumber}
              </span>
              <span style={{ fontSize: '1.1rem' }}>{category.icon}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {task.isSharedTask && (
                <TooltipHost content="مهمة مشتركة">
                  <Icon iconName="Link" style={{ color: '#5c2d91', fontSize: 14 }} />
                </TooltipHost>
              )}
              {task.linkedTaskId && (
                <TooltipHost content={`مرتبطة بالمهمة ${task.linkedTaskId}`}>
                  <span style={{ 
                    padding: '2px 6px', 
                    backgroundColor: '#e3f2fd', 
                    color: '#0078d4',
                    borderRadius: 8,
                    fontSize: '0.7rem',
                    fontWeight: 600
                  }}>
                    🔗 {task.linkedTaskId}
                  </span>
                </TooltipHost>
              )}
            </div>
          </div>
          
          <Text variant="medium" style={{ fontWeight: 600, marginBottom: 8, display: 'block', lineHeight: 1.4 }}>
            {task.title}
          </Text>
          
          <Text variant="small" style={{ color: '#666', marginBottom: 12, display: 'block', fontSize: '0.8rem' }}>
            {task.description.substring(0, 100)}...
          </Text>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', color: '#666' }}>الإنجاز</span>
              <span style={{ fontWeight: 600, color: colors.text }}>{progress?.completionPercent || 0}%</span>
            </div>
            <ProgressIndicator 
              percentComplete={(progress?.completionPercent || 0) / 100}
              barHeight={6}
              styles={{ progressBar: { backgroundColor: colors.border } }}
            />
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '8px 0',
            borderTop: '1px solid rgba(0,0,0,0.1)',
            fontSize: '0.75rem'
          }}>
            <span style={{ 
              padding: '2px 8px', 
              borderRadius: 12, 
              backgroundColor: colors.border + '20',
              color: colors.text,
              fontWeight: 600
            }}>
              {progress?.status === 'completed' ? '✅ مكتمل' : 
               progress?.status === 'in_progress' ? '⏳ قيد التنفيذ' : '○ لم يبدأ'}
            </span>
            <span style={{ color: '#999' }}>
              📁 {task.dataSource}
            </span>
          </div>
        </div>
      )
    })}
  </div>
)

const TaskTable: React.FC<{ tasks: BCTask[]; taskProgress: TaskProgress[] }> = ({ tasks, taskProgress }) => {
  const columns: IColumn[] = [
    {
      key: 'taskNumber',
      name: '#',
      fieldName: 'taskNumber',
      minWidth: 40,
      maxWidth: 50,
      onRender: (item: BCTask) => (
        <div style={{ textAlign: 'center', fontWeight: 700 }}>{item.taskNumber}</div>
      )
    },
    {
      key: 'title',
      name: 'المهمة',
      fieldName: 'title',
      minWidth: 250,
      flexGrow: 2,
      onRender: (item: BCTask) => (
        <div style={{ textAlign: 'right', lineHeight: 1.4 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>{item.description.substring(0, 80)}...</div>
        </div>
      )
    },
    {
      key: 'category',
      name: 'التصنيف',
      fieldName: 'category',
      minWidth: 100,
      maxWidth: 120,
      onRender: (item: BCTask) => {
        const cat = taskCategories[item.category]
        return (
          <div style={{ textAlign: 'center' }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: 12,
              backgroundColor: cat.color + '20',
              color: cat.color,
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              {cat.icon} {cat.label}
            </span>
          </div>
        )
      }
    },
    {
      key: 'progress',
      name: 'الإنجاز',
      minWidth: 100,
      maxWidth: 120,
      onRender: (item: BCTask) => {
        const progress = taskProgress.find(p => p.taskId === item.taskId)
        return (
          <div style={{ textAlign: 'center' }}>
            <ProgressIndicator 
              percentComplete={(progress?.completionPercent || 0) / 100}
              barHeight={8}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{progress?.completionPercent || 0}%</span>
          </div>
        )
      }
    },
    {
      key: 'status',
      name: 'الحالة',
      minWidth: 80,
      maxWidth: 100,
      onRender: (item: BCTask) => {
        const progress = taskProgress.find(p => p.taskId === item.taskId)
        const statusText = {
          completed: '✅ مكتمل',
          in_progress: '⏳ جاري',
          not_started: '○ لم يبدأ'
        }
        const statusStyle = getStatusStyle(progress?.status || 'not_started')
        return (
          <div style={{ textAlign: 'center' }}>
            <span style={statusStyle}>{statusText[progress?.status || 'not_started']}</span>
          </div>
        )
      }
    },
    {
      key: 'links',
      name: 'الارتباط',
      minWidth: 60,
      maxWidth: 80,
      onRender: (item: BCTask) => (
        <div style={{ textAlign: 'center' }}>
          {item.linkedTaskId ? (
            <span style={{
              padding: '2px 6px',
              backgroundColor: '#e3f2fd',
              color: '#0078d4',
              borderRadius: 8,
              fontSize: '0.7rem',
              fontWeight: 600
            }}>
              🔗 {item.linkedTaskId}
            </span>
          ) : '-'}
        </div>
      )
    }
  ]

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <DetailsList
        items={tasks}
        columns={columns}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
        isHeaderVisible={true}
      />
    </div>
  )
}

// ============================================
// Task Progress Calculator - with Linked Tasks Support
// ============================================

/**
 * المهام المترابطة:
 * - المهمة 1 (إعداد الخطط) ← المهمة 7 (مراجعة الخطط) ← المهمة 21 (لوحة bcDuties)
 * - المهمة 2 (تخطيط التمارين) ← المهمة 16 (تقييم الفعالية) ← المهمة 22 (تنفيذ الاختبارات)
 * - المهمة 6 (تقييم الاستجابة) ← المهمة 13 (تقارير الأداء) ← المهمة 23 (تقييم الأضرار)
 * 
 * الإدخال الواحد يحقق عدة مهام:
 * - إضافة تمرين منفذ → يحقق المهمة 2 + 16 + 22
 * - إضافة عضو فريق → يحقق المهمة 16 + 17
 * - تقييم حادث → يحقق المهمة 6 + 13 + 14
 */

function calculateTaskProgress(
  task: BCTask, 
  data: any
): { status: 'not_started' | 'in_progress' | 'completed'; completionPercent: number; evidence: string; lastUpdated: string } {
  
  const { schools, teamMembers, drills, incidents, trainingLogs, testPlans, 
          adminContacts, bcPlanDocuments, incidentEvaluations, drChecklist, 
          sharedBCPlan, planReview } = data
  
  let percent = 0
  let evidence = ''
  
  // ════════════════════════════════════════════════════════════════
  // المجموعة 1: الخطط (المهام 1, 7, 21 مترابطة)
  // ════════════════════════════════════════════════════════════════
  
  if ([1, 7].includes(task.taskId)) {
    // كلاهما يعتمد على sharedBCPlan و planReview
    const hasFile = !!sharedBCPlan?.fileName
    const hasScenarios = (sharedBCPlan?.scenarios?.length || 0) >= 5
    const isPublished = !!sharedBCPlan?.isPublished
    const hasReview = planReview?.task7_1_complete
    const hasResponse = planReview?.task7_2_complete
    const hasApproval = planReview?.task7_3_complete
    
    if (task.taskId === 1) {
      percent = [hasFile, hasScenarios, isPublished, hasReview].filter(Boolean).length * 25
      evidence = `ملف: ${hasFile ? '✓' : '○'}, سيناريوهات: ${hasScenarios ? '✓' : '○'}, منشور: ${isPublished ? '✓' : '○'}, مراجعة: ${hasReview ? '✓' : '○'}`
    } else { // task 7
      percent = [hasReview, hasResponse, hasApproval].filter(Boolean).length / 3 * 100
      evidence = `مراجعة: ${hasReview ? '✓' : '○'}, إجراءات: ${hasResponse ? '✓' : '○'}, اعتماد: ${hasApproval ? '✓' : '○'}`
    }
  }
  
  // ════════════════════════════════════════════════════════════════
  // المجموعة 2: التمارين (المهام 2, 16, 22 مترابطة)
  // إدخال واحد (تمرين) يحقق الثلاثة
  // ════════════════════════════════════════════════════════════════
  
  else if ([2, 16, 22].includes(task.taskId)) {
    const planCount = testPlans?.length || 0
    const drillCount = drills?.length || 0
    const drillsWithRating = drills?.filter((d: any) => d.DrillRating)?.length || 0
    
    // المهمة 2: خطة 4 تمارين سنوية
    if (task.taskId === 2) {
      percent = Math.min((planCount / 4) * 100, 100)
      evidence = `${planCount}/4 تمارين مخططة`
    }
    // المهمة 16: تقييم فعالية الخطة من تنفيذ المدارس
    else if (task.taskId === 16) {
      percent = drillsWithRating > 0 ? Math.min((drillsWithRating / Math.max(schools?.length || 1, 1)) * 100, 100) : 0
      evidence = `${drillsWithRating} تقييم من المدارس`
    }
    // المهمة 22: تنفيذ الاختبارات
    else {
      percent = drillCount > 0 ? Math.min((drillCount / Math.max(schools?.length || 1, 1)) * 100, 100) : 0
      evidence = `${drillCount} تمرين منفذ`
    }
  }
  
  // ════════════════════════════════════════════════════════════════
  // المجموعة 3: المراقبة والتقييم (المهام 6, 13, 14, 23 مترابطة)
  // ════════════════════════════════════════════════════════════════
  
  else if ([6, 13, 14, 23].includes(task.taskId)) {
    const evalCount = incidentEvaluations?.length || 0
    const incidentsWithLessons = incidents?.filter((i: any) => i.LessonsLearned)?.length || 0
    const incidentCount = incidents?.length || 0
    
    if (task.taskId === 6) { // مراقبة وتقييم الاستجابة
      percent = evalCount > 0 ? Math.min(evalCount * 25, 100) : 0
      evidence = `${evalCount} تقييم استجابة`
    } else if (task.taskId === 13) { // تقارير الأداء
      percent = evalCount > 0 ? Math.min(evalCount * 20, 100) : 0
      evidence = `${evalCount} تقرير أداء`
    } else if (task.taskId === 14) { // نقاط الضعف والتوصيات
      percent = incidentsWithLessons > 0 ? Math.min((incidentsWithLessons / Math.max(incidentCount, 1)) * 100, 100) : 0
      evidence = `${incidentsWithLessons}/${incidentCount} حادث موثق الدروس`
    } else { // 23: تقييم الأضرار
      percent = evalCount > 0 ? Math.min(evalCount * 25, 100) : 0
      evidence = `${evalCount} تقييم أضرار`
    }
  }
  
  // ════════════════════════════════════════════════════════════════
  // المجموعة 4: الفرق (المهمة 16 + 17 مترابطة)
  // إضافة عضو فريق = يحقق الاثنتين
  // ════════════════════════════════════════════════════════════════
  
  else if ([16, 17].includes(task.taskId)) {
    const schoolsWithTeams = new Set(teamMembers?.map((t: any) => t.SchoolName_Ref)).size
    const schoolCount = schools?.length || 1
    
    percent = Math.min((schoolsWithTeams / schoolCount) * 100, 100)
    evidence = `${schoolsWithTeams}/${schoolCount} مدرسة لديها فريق`
  }
  
  // ════════════════════════════════════════════════════════════════
  // مهام أخرى
  // ════════════════════════════════════════════════════════════════
  
  else {
    switch(task.taskId) {
      case 3: // خطة التشغيل المتبادل
        percent = schools?.length > 0 ? 75 : 0
        evidence = `${schools?.length || 0} مدرسة بديلة محددة`
        break
        
      case 4: // برامج معالجة المخاطر
        const drReady = drChecklist?.filter((d: any) => d.status === 'ready')?.length || 0
        percent = drChecklist?.length > 0 ? Math.min((drReady / drChecklist.length) * 100, 100) : 0
        evidence = `${drReady}/${drChecklist?.length || 0} عنصر جاهز`
        break
        
      case 5: // RTO/RPO
        const withRecoveryTime = incidentEvaluations?.filter((e: any) => e.recoveryTimeHours)?.length || 0
        percent = withRecoveryTime > 0 ? 100 : 0
        evidence = `${withRecoveryTime} قياس وقت تعافي`
        break
        
      case 8: // تقييم الموارد
        const bcTeamContacts = adminContacts?.filter((c: any) => c.organization === 'bc_team')?.length || 0
        percent = bcTeamContacts > 0 ? Math.min(bcTeamContacts * 25, 100) : 0
        evidence = `${bcTeamContacts} عضو فريق BC`
        break
        
      case 9: // السياسات
        const policyDocs = bcPlanDocuments?.filter((d: any) => d.documentType === 'policy')?.length || 0
        percent = policyDocs > 0 ? Math.min(policyDocs * 50, 100) : 0
        evidence = `${policyDocs} سياسة موثقة`
        break
        
      case 10: // إدارة المخاطر
        percent = (incidentEvaluations?.length > 0 && bcPlanDocuments?.length > 0) ? 75 : 
                  (incidentEvaluations?.length > 0 || bcPlanDocuments?.length > 0) ? 50 : 0
        evidence = `تقييمات: ${incidentEvaluations?.length || 0}, مستندات: ${bcPlanDocuments?.length || 0}`
        break
        
      case 11: // KPIs
        percent = incidentEvaluations?.length > 0 ? 75 : 0
        evidence = `${incidentEvaluations?.length || 0} مؤشر أداء`
        break
        
      case 12: // البدائل
        percent = sharedBCPlan?.scenarios?.length >= 5 ? 100 : 
                  sharedBCPlan?.scenarios?.length > 0 ? 50 : 0
        evidence = `${sharedBCPlan?.scenarios?.length || 0}/5 سيناريوهات`
        break
        
      case 15: // متابعة التوصيات
        const lessonsForRecommendations = incidents?.filter((i: any) => i.LessonsLearned)?.length || 0
        percent = lessonsForRecommendations > 0 ? 75 : 0
        evidence = `${lessonsForRecommendations} توصية موثقة`
        break
        
      case 18: // التوعية
        const awarenessTraining = trainingLogs?.filter((t: any) => 
          t.TrainingType === 'توعية' || t.Program_Ref?.includes('توعية'))?.length || 0
        percent = awarenessTraining > 0 ? Math.min(awarenessTraining * 25, 100) : 0
        evidence = `${awarenessTraining} برنامج توعوي`
        break
        
      case 19: // جهات الاتصال
        const contactCount = adminContacts?.length || 0
        percent = contactCount > 0 ? Math.min(contactCount * 20, 100) : 0
        evidence = `${contactCount} جهة اتصال`
        break
        
      case 20: // سجل الحوادث
        const incidentCount = incidents?.length || 0
        percent = incidentCount > 0 ? 100 : 0
        evidence = `${incidentCount} حادث موثق`
        break
        
      case 21: // التقارير الدورية (مرتبط بـ 1)
        percent = sharedBCPlan?.publishHistory?.length > 0 ? 100 : 
                  sharedBCPlan?.isPublished ? 50 : 0
        evidence = `${sharedBCPlan?.publishHistory?.length || 0} تقرير دوري`
        break
        
      case 24: // الدروس المستفادة
        const lessonsCount = incidents?.filter((i: any) => i.LessonsLearned)?.length || 0
        percent = lessonsCount > 0 ? Math.min(lessonsCount * 25, 100) : 0
        evidence = `${lessonsCount} درس مستفاد`
        break
        
      case 25: // DR Readiness
        const drReadyCount = drChecklist?.filter((d: any) => d.status === 'ready')?.length || 0
        percent = drChecklist?.length > 0 ? Math.min((drReadyCount / drChecklist.length) * 100, 100) : 0
        evidence = `جاهزية DR: ${Math.round(percent)}%`
        break
        
      default:
        percent = 0
        evidence = 'غير محدد'
    }
  }
  
  // ════════════════════════════════════════════════════════════════
  // تحديد الحالة النهائية
  // ════════════════════════════════════════════════════════════════
  
  let status: 'not_started' | 'in_progress' | 'completed'
  if (percent >= 100) {
    status = 'completed'
  } else if (percent > 0) {
    status = 'in_progress'
  } else {
    status = 'not_started'
  }
  
  return {
    status,
    completionPercent: Math.round(percent),
    evidence,
    lastUpdated: new Date().toISOString()
  }
}

export default BCTasksDashboard
