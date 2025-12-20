# 🔧 BC_TEST_PLANS Code Implementation Guide

**Task:** Implement Drills feature using BC_Test_Plans SharePoint list  
**Files to Modify:** Drills.tsx, AdminPanel.tsx  
**Files to Create:** DrillsExecution.tsx (optional)  

---

## 1️⃣ Service Layer - Already Complete ✅

### AdminDataService already has:

```typescript
// Load drills from BC_Test_Plans for schools
async getDrillsForSchool(): Promise<TestPlan[]> {
  // ✅ Already implemented
  // Returns list of all drills from BC_Test_Plans
}

// Get all test plans (for admin)
async getTestPlans(): Promise<TestPlan[]> {
  // ✅ Already implemented
  // Returns all test plans
}

// Create new test plan (admin)
async createTestPlan(plan: Omit<TestPlan, 'id'>): Promise<TestPlan> {
  // ✅ Already implemented
  // Saves to BC_Test_Plans
}

// Update test plan (admin)
async updateTestPlan(id: number, updates: Partial<TestPlan>): Promise<TestPlan | null> {
  // ✅ Already implemented
  // Updates BC_Test_Plans record
}

// Delete test plan (admin)
async deleteTestPlan(id: number): Promise<void> {
  // ✅ Already implemented
  // Deletes from BC_Test_Plans
}
```

### TestPlan Interface:

```typescript
export interface TestPlan {
  id: number;
  title: string;           // Title (e.g., "التمرين الفرضي- الربع الأول")
  hypothesis: string;      // Hypothesis (الفرضية الأولى, etc.)
  specificEvent: string;   // SpecificEvent (وصف الحدث)
  targetGroup: string;     // TargetGroup (جميع المدارس, etc.)
  startDate: string;       // StartDate (15/1/2025)
  endDate: string;         // EndDate (15/3/2025)
  status: string;          // Status (قيد التنفيذ, مخطط, مكتمل)
  responsible: string;     // Responsible (person/group)
  notes: string;           // Notes (additional notes)
  year?: number;           // Year (2025)
  quarter?: string;        // Quarter (Q1, Q2, Q3, Q4)
}
```

---

## 2️⃣ School View - Drills.tsx

### What Needs to Change:

#### BEFORE (Current - Wrong):
```typescript
// Currently loads from wrong place
// Needs to load from BC_Test_Plans instead
const [drills, setDrills] = useState<Drill[]>([])
```

#### AFTER (Needed - Correct):
```typescript
import { AdminDataService, TestPlan } from '../services/adminDataService'

const Drills: React.FC = () => {
  const { user } = useAuth()
  const [drills, setDrills] = useState<TestPlan[]>([])  // Changed type
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedDrill, setSelectedDrill] = useState<TestPlan | null>(null)
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)
  
  // Execution form fields
  const [executionForm, setExecutionForm] = useState({
    executionDate: '',
    evaluation: '',
    comments: ''
  })

  // Load drills on mount
  useEffect(() => {
    loadDrills()
  }, [])

  const loadDrills = async () => {
    setLoading(true)
    try {
      const loadedDrills = await AdminDataService.getDrillsForSchool()
      setDrills(loadedDrills)
      console.log(`Loaded ${loadedDrills.length} drills`)
    } catch (error) {
      console.error('Error loading drills:', error)
      setMessage({
        type: MessageBarType.error,
        text: 'خطأ في تحميل التمارين'
      })
    } finally {
      setLoading(false)
    }
  }

  // Execute drill
  const handleExecuteDrill = (drill: TestPlan) => {
    setSelectedDrill(drill)
    setExecutionForm({ executionDate: '', evaluation: '', comments: '' })
    setPanelOpen(true)
  }

  // Save execution
  const saveExecution = async () => {
    if (!selectedDrill || !executionForm.executionDate) {
      setMessage({
        type: MessageBarType.warning,
        text: 'يرجى ملء جميع الحقول المطلوبة'
      })
      return
    }

    try {
      // Save to SBC_Drills_Log or similar
      await AdminDataService.recordDrillExecution(selectedDrill.id, {
        executionDate: executionForm.executionDate,
        evaluation: executionForm.evaluation,
        comments: executionForm.comments,
        schoolName: user?.schoolName
      })
      
      setMessage({
        type: MessageBarType.success,
        text: 'تم تسجيل التمرين بنجاح'
      })
      setPanelOpen(false)
      // Reload drills to see updated status
      await loadDrills()
    } catch (error) {
      console.error('Error saving execution:', error)
      setMessage({
        type: MessageBarType.error,
        text: 'خطأ في حفظ التمرين'
      })
    }
  }

  // Render drills as cards
  return (
    <Stack tokens={{ childrenGap: 20 }}>
      <div>
        <h2>سجل التمارين الفرضية</h2>
        <p>خطة التمارين السنوية المعتمدة من الإدارة</p>
      </div>

      {message && (
        <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </MessageBar>
      )}

      {loading ? (
        <Spinner label="جاري تحميل التمارين..." />
      ) : (
        <Stack tokens={{ childrenGap: 16 }}>
          {drills.length === 0 ? (
            <p>لا توجد تمارين متاحة حالياً</p>
          ) : (
            drills.map((drill) => (
              <div 
                key={drill.id}
                style={{
                  border: '1px solid #e1e1e1',
                  borderRadius: 8,
                  padding: 16,
                  backgroundColor: '#f7f7f7'
                }}
              >
                <h3>{drill.title}</h3>
                <p><strong>الفرضية:</strong> {drill.hypothesis}</p>
                <p><strong>الفئة المستهدفة:</strong> {drill.targetGroup}</p>
                <p><strong>الفترة:</strong> {drill.startDate} - {drill.endDate}</p>
                <p><strong>الحالة:</strong> {drill.status}</p>
                {drill.notes && <p><strong>الملاحظات:</strong> {drill.notes}</p>}
                
                <PrimaryButton 
                  text="تنفيذ التمرين"
                  onClick={() => handleExecuteDrill(drill)}
                  style={{ marginTop: 12 }}
                />
              </div>
            ))
          )}
        </Stack>
      )}

      {/* Execution Panel */}
      <Panel
        isOpen={panelOpen}
        onDismiss={() => setPanelOpen(false)}
        headerText={`تنفيذ: ${selectedDrill?.title}`}
        closeButtonAriaLabel="Close"
      >
        <Stack tokens={{ childrenGap: 16 }}>
          {/* Read-only drill info */}
          <div style={{ backgroundColor: '#f3f2f1', padding: 12, borderRadius: 4 }}>
            <p><strong>الفرضية:</strong> {selectedDrill?.hypothesis}</p>
            <p><strong>الفترة المسموحة:</strong> {selectedDrill?.startDate} - {selectedDrill?.endDate}</p>
          </div>

          {/* Execution form */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
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
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
              التقييم *
            </label>
            <TextField
              multiline
              rows={4}
              placeholder="أكتب تقييمك للتمرين..."
              value={executionForm.evaluation}
              onChange={(e, val) => setExecutionForm({ 
                ...executionForm, 
                evaluation: val || '' 
              })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
              التعليقات والملاحظات
            </label>
            <TextField
              multiline
              rows={3}
              placeholder="أضف أي تعليقات إضافية..."
              value={executionForm.comments}
              onChange={(e, val) => setExecutionForm({ 
                ...executionForm, 
                comments: val || '' 
              })}
            />
          </div>

          <Stack horizontal tokens={{ childrenGap: 12 }}>
            <PrimaryButton 
              text="حفظ التنفيذ" 
              onClick={saveExecution}
            />
            <DefaultButton 
              text="إلغاء" 
              onClick={() => setPanelOpen(false)}
            />
          </Stack>
        </Stack>
      </Panel>
    </Stack>
  )
}

export default Drills
```

---

## 3️⃣ Admin View - AdminPanel.tsx

### Add Drills Tab to Admin Panel

#### In the Tab Pivot:

```typescript
<Pivot 
  selectedKey={currentTab} 
  onLinkClick={(item) => {
    setCurrentTab(item?.props.itemKey as string)
    setSearchParams({ tab: item?.props.itemKey as string })
  }}
>
  {/* ... other tabs ... */}
  
  {/* ADD THIS TAB */}
  <PivotItem headerText="التمارين الفرضية" itemKey="drills">
    <DrilsManagement />
  </PivotItem>
  
  {/* ... other tabs ... */}
</Pivot>
```

#### Create DrilsManagement Component:

```typescript
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

const DrilsManagement: React.FC = () => {
  const [drills, setDrills] = useState<TestPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)
  const [form, setForm] = useState<Partial<TestPlan>>({
    title: '',
    hypothesis: '',
    specificEvent: '',
    targetGroup: '',
    startDate: '',
    endDate: '',
    status: '',
    responsible: '',
    notes: '',
    year: new Date().getFullYear(),
    quarter: ''
  })

  useEffect(() => {
    loadDrills()
  }, [])

  const loadDrills = async () => {
    setLoading(true)
    try {
      const loadedDrills = await AdminDataService.getTestPlans()
      setDrills(loadedDrills)
    } catch (error) {
      console.error('Error loading drills:', error)
      setMessage({
        type: MessageBarType.error,
        text: 'خطأ في تحميل التمارين'
      })
    } finally {
      setLoading(false)
    }
  }

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
      notes: '',
      year: new Date().getFullYear(),
      quarter: ''
    })
    setIsEditing(false)
    setPanelOpen(true)
  }

  const openEditPanel = (drill: TestPlan) => {
    setForm(drill)
    setIsEditing(true)
    setPanelOpen(true)
  }

  const saveDrill = async () => {
    if (!form.title || !form.hypothesis || !form.startDate || !form.endDate) {
      setMessage({
        type: MessageBarType.warning,
        text: 'يرجى ملء جميع الحقول المطلوبة'
      })
      return
    }

    try {
      if (isEditing && form.id) {
        await AdminDataService.updateTestPlan(form.id, form)
        setMessage({
          type: MessageBarType.success,
          text: 'تم تحديث التمرين بنجاح'
        })
      } else {
        await AdminDataService.createTestPlan(form as Omit<TestPlan, 'id'>)
        setMessage({
          type: MessageBarType.success,
          text: 'تم إنشاء التمرين بنجاح'
        })
      }
      setPanelOpen(false)
      await loadDrills()
    } catch (error) {
      console.error('Error saving drill:', error)
      setMessage({
        type: MessageBarType.error,
        text: 'خطأ في حفظ التمرين'
      })
    }
  }

  const deleteDrill = async (drillId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التمرين؟')) return

    try {
      await AdminDataService.deleteTestPlan(drillId)
      setMessage({
        type: MessageBarType.success,
        text: 'تم حذف التمرين بنجاح'
      })
      await loadDrills()
    } catch (error) {
      console.error('Error deleting drill:', error)
      setMessage({
        type: MessageBarType.error,
        text: 'خطأ في حذف التمرين'
      })
    }
  }

  const columns: IColumn[] = [
    {
      key: 'title',
      name: 'اسم التمرين',
      fieldName: 'title',
      minWidth: 200,
    },
    {
      key: 'hypothesis',
      name: 'الفرضية',
      fieldName: 'hypothesis',
      minWidth: 250,
    },
    {
      key: 'startDate',
      name: 'تاريخ البدء',
      fieldName: 'startDate',
      minWidth: 100,
    },
    {
      key: 'endDate',
      name: 'تاريخ الانتهاء',
      fieldName: 'endDate',
      minWidth: 100,
    },
    {
      key: 'status',
      name: 'الحالة',
      fieldName: 'status',
      minWidth: 100,
    },
    {
      key: 'quarter',
      name: 'الربع',
      fieldName: 'quarter',
      minWidth: 80,
    },
    {
      key: 'actions',
      name: 'الإجراءات',
      minWidth: 120,
      onRender: (item: TestPlan) => (
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <IconButton
            iconProps={{ iconName: 'Edit' }}
            onClick={() => openEditPanel(item)}
            title="تعديل"
          />
          <IconButton
            iconProps={{ iconName: 'Delete' }}
            onClick={() => deleteDrill(item.id)}
            title="حذف"
          />
        </Stack>
      ),
    },
  ]

  const hypothesisOptions: IDropdownOption[] = [
    { key: '1', text: 'الفرضية الأولى: تعذر استخدام المبنى' },
    { key: '2', text: 'الفرضية الثانية: تعطل الأنظمة والمنصات' },
    { key: '3', text: 'الفرضية الثالثة: تعطل خدمة البث' },
    { key: '4', text: 'الفرضية الرابعة: انقطاع الخدمات' },
    { key: '5', text: 'الفرضية الخامسة: نقص الكوادر البشرية' },
  ]

  const statusOptions: IDropdownOption[] = [
    { key: '1', text: 'قيد التنفيذ' },
    { key: '2', text: 'مخطط' },
    { key: '3', text: 'مكتمل' },
  ]

  const quarterOptions: IDropdownOption[] = [
    { key: 'Q1', text: 'الربع الأول' },
    { key: 'Q2', text: 'الربع الثاني' },
    { key: 'Q3', text: 'الربع الثالث' },
    { key: 'Q4', text: 'الربع الرابع' },
  ]

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      {message && (
        <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </MessageBar>
      )}

      <PrimaryButton 
        text="+ إضافة تمرين جديد" 
        onClick={openCreatePanel}
      />

      {loading ? (
        <Spinner label="جاري تحميل التمارين..." />
      ) : (
        <DetailsList
          items={drills}
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
        />
      )}

      <Panel
        isOpen={panelOpen}
        onDismiss={() => setPanelOpen(false)}
        headerText={isEditing ? 'تعديل التمرين' : 'إضافة تمرين جديد'}
      >
        <Stack tokens={{ childrenGap: 16 }}>
          <TextField
            label="اسم التمرين *"
            value={form.title || ''}
            onChange={(e, val) => setForm({ ...form, title: val })}
            required
          />

          <Dropdown
            label="الفرضية *"
            options={hypothesisOptions}
            selectedKey={form.hypothesis}
            onChange={(e, val) => setForm({ ...form, hypothesis: val?.text || '' })}
            required
          />

          <TextField
            label="وصف الحدث المحدد"
            value={form.specificEvent || ''}
            onChange={(e, val) => setForm({ ...form, specificEvent: val })}
          />

          <TextField
            label="الفئة المستهدفة *"
            value={form.targetGroup || ''}
            onChange={(e, val) => setForm({ ...form, targetGroup: val })}
            required
          />

          <TextField
            label="تاريخ البدء *"
            type="date"
            value={form.startDate || ''}
            onChange={(e, val) => setForm({ ...form, startDate: val })}
            required
          />

          <TextField
            label="تاريخ الانتهاء *"
            type="date"
            value={form.endDate || ''}
            onChange={(e, val) => setForm({ ...form, endDate: val })}
            required
          />

          <Dropdown
            label="الربع"
            options={quarterOptions}
            selectedKey={form.quarter}
            onChange={(e, val) => setForm({ ...form, quarter: val?.key as string })}
          />

          <Dropdown
            label="الحالة *"
            options={statusOptions}
            selectedKey={form.status}
            onChange={(e, val) => setForm({ ...form, status: val?.text || '' })}
            required
          />

          <TextField
            label="المسؤول"
            value={form.responsible || ''}
            onChange={(e, val) => setForm({ ...form, responsible: val })}
          />

          <TextField
            label="الملاحظات"
            multiline
            rows={3}
            value={form.notes || ''}
            onChange={(e, val) => setForm({ ...form, notes: val })}
          />

          <Stack horizontal tokens={{ childrenGap: 12 }}>
            <PrimaryButton 
              text="حفظ" 
              onClick={saveDrill}
            />
            <DefaultButton 
              text="إلغاء" 
              onClick={() => setPanelOpen(false)}
            />
          </Stack>
        </Stack>
      </Panel>
    </Stack>
  )
}

export default DrilsManagement
```

---

## 4️⃣ Summary of Changes

### Files to Modify:
1. **src/components/Drills.tsx** - Complete rewrite to use BC_Test_Plans
2. **src/components/AdminPanel.tsx** - Add Drills Management tab

### Service Methods (Already Exist):
- ✅ AdminDataService.getDrillsForSchool()
- ✅ AdminDataService.getTestPlans()
- ✅ AdminDataService.createTestPlan()
- ✅ AdminDataService.updateTestPlan()
- ✅ AdminDataService.deleteTestPlan()
- ✅ AdminDataService.recordDrillExecution()

---

## 🎯 Implementation Checklist

- [ ] Update Drills.tsx with new code
- [ ] Add DrilsManagement component to AdminPanel.tsx
- [ ] Add Drills tab to Admin panel pivot
- [ ] Test school view loads drills from BC_Test_Plans
- [ ] Test admin can create drill
- [ ] Test admin can edit drill
- [ ] Test admin can delete drill
- [ ] Test school can execute drill
- [ ] Verify execution data saves to SBC_Drills_Log
- [ ] Verify all fields match SharePoint columns

---

Done! All code ready to copy and paste. 🚀

