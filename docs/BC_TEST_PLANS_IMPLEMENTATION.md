# 🎓 BC_TEST_PLANS Implementation Guide

**Feature:** Drills (التمارين الفرضية السنوية)  
**SharePoint List:** BC_Test_Plans  
**Date:** December 20, 2025  

---

## 📊 SharePoint List Structure: BC_Test_Plans

### List Fields (Columns)

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| Title | Single line text | ✅ | Drill name (e.g., "التمرين الفرضي- الربع الأول") |
| Hypothesis | Single line text | ✅ | Which hypothesis (الفرضية الأولى، الثانية، إلخ) |
| SpecificEvent | Single line text | ❌ | Specific event description |
| TargetGroup | Single line text | ✅ | Target group (جميع المدارس، etc.) |
| StartDate | Date & Time | ✅ | Start date of drill period |
| EndDate | Date & Time | ✅ | End date of drill period |
| Status | Choice | ✅ | Status: قيد التنفيذ, مخطط, مكتمل |
| Responsible | Single line text | ❌ | Person/group responsible |
| Notes | Single line text | ❌ | Additional notes |
| Year | Number | ❌ | Year (e.g., 2025) |
| Quarter | Single line text | ❌ | Quarter (Q1, Q2, Q3, Q4) |
| Created | Date & Time | Auto | Creation date |
| Modified | Date & Time | Auto | Last modified date |
| Created By | Person/Group | Auto | Creator |
| Modified By | Person/Group | Auto | Last modifier |

---

## 📱 School View (Students/Teachers see this)

### Display Page Structure

```
[سجل التمارين الفرضية]

📋 خطة التمارين السنوية المعتمدة من الإدارة
اختر من التمارين المحددة من قبل الإدارة وقم بتنفيذها وتسجيل تاريخ التنفيذ

┌──────────────────────────────────────────────────────────────────┐
│ 1. التمرين الفرضي- الربع الأول                                  │
│    الفرضية: الفرضية الأولى: تعذر استخدام المبنى (كلي/جزئي)     │
│    الفئة المستهدفة: جميع المدارس                              │
│    الفترة: 15/1/2025 - 15/3/2025                              │
│    الحالة: قيد التنفيذ                                        │
│    [تنفيذ التمرين]                                            │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 2. تمرين التعليم عن بعد - الربع الثاني                          │
│    الفرضية: الفرضية الرابعة: انقطاع الخدمات (كهرباء/اتصال)  │
│    الفئة المستهدفة: جميع المدارس                              │
│    الفترة: 1/4/2025 - 30/6/2025                               │
│    الحالة: قيد التنفيذ                                        │
│    [تنفيذ التمرين]                                            │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 3. التمرين الفرضي الثالث - الربع الثالث                         │
│    الفرضية: الفرضية الخامسة: نقص الكوادر البشرية              │
│    الفئة المستهدفة: جميع المدارس                              │
│    الفترة: 1/7/2025 - 30/9/2025                               │
│    الحالة: مخطط                                              │
│    [تنفيذ التمرين]                                            │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 4. تمرين شامل - الربع الرابع                                    │
│    الفرضية: الفرضية الثانية: تعطل الأنظمة والمنصات           │
│    الفئة المستهدفة: جميع المدارس                              │
│    الفترة: 1/10/2025 - 31/12/2025                             │
│    الحالة: مخطط                                              │
│    [تنفيذ التمرين]                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Execution Form (When School Clicks "تنفيذ التمرين")

```
╔════════════════════════════════════════════════════════════╗
║        تنفيذ التمرين الفرضي - الربع الأول                ║
╚════════════════════════════════════════════════════════════╝

البيانات الأساسية (Read-Only):
───────────────────────────────
اسم التمرين (Title):
  التمرين الفرضي- الربع الأول

الفرضية (Hypothesis):
  الفرضية الأولى: تعذر استخدام المبنى (كلي/جزئي)

الفترة المسموحة:
  من: 15/1/2025  إلى: 15/3/2025

الفئة المستهدفة:
  جميع المدارس

───────────────────────────────

بيانات التنفيذ (يملؤها المدرسة):
───────────────────────────────

تاريخ التنفيذ الفعلي *
[📅 ________________]

التقييم *
[
_________________________________
_________________________________
_________________________________
]

التعليقات والملاحظات
[
_________________________________
_________________________________
]

[حفظ التنفيذ]  [إلغاء]
```

### Data Saved For School Execution

When school submits execution, create a new record in a separate list (SBC_Drill_Executions or store in SBC_Drills_Log):

```
Fields saved:
- DrillRef: Link to BC_Test_Plans record
- SchoolName: Name of school executing
- ExecutionDate: When they executed it
- Evaluation: Their evaluation text
- Comments: Additional comments
- CreatedBy: School/user who recorded
- CreatedDate: When recorded
```

---

## 👨‍💼 Admin View

### Admin Drills Management Page (`/admin?tab=drills`)

```
╔════════════════════════════════════════════════════════════╗
║             إدارة التمارين الفرضية السنوية              ║
╚════════════════════════════════════════════════════════════╝

[+ إضافة تمرين جديد]

┌─────────────────────────────────────────────────────────────┐
│ الاسم      │ الفرضية    │ الفترة         │ الحالة  │ إجراء │
├─────────────────────────────────────────────────────────────┤
│التمرين Q1 │ الفرضية 1  │ 15/1 - 15/3   │ قيد     │[✏][✕]│
│التمرين Q2 │ الفرضية 4  │ 1/4 - 30/6    │ قيد     │[✏][✕]│
│التمرين Q3 │ الفرضية 5  │ 1/7 - 30/9    │ مخطط    │[✏][✕]│
│التمرين Q4 │ الفرضية 2  │ 1/10 - 31/12  │ مخطط    │[✏][✕]│
└─────────────────────────────────────────────────────────────┘
```

### Admin Create/Edit Form

```
╔════════════════════════════════════════════════════════════╗
║           إضافة/تعديل تمرين فرضي جديد                    ║
╚════════════════════════════════════════════════════════════╝

اسم التمرين (Title) *
[_______________________________]
مثال: التمرين الفرضي- الربع الأول

الفرضية (Hypothesis) *
[▼ اختر الفرضية ▼]
 ├─ الفرضية الأولى: تعذر استخدام المبنى
 ├─ الفرضية الثانية: تعطل الأنظمة
 ├─ الفرضية الثالثة: تعطل البث
 ├─ الفرضية الرابعة: انقطاع الخدمات
 └─ الفرضية الخامسة: نقص الكوادر

وصف الحدث المحدد (SpecificEvent)
[_______________________________]
مثال: إخلاء كامل أو جزئي

الفئة المستهدفة (TargetGroup) *
[_______________________________]
مثال: جميع المدارس

تاريخ البدء (StartDate) *
[📅 15/1/2025]

تاريخ الانتهاء (EndDate) *
[📅 15/3/2025]

الربع (Quarter)
[▼ Q1 ▼]
 ├─ Q1 (الربع الأول)
 ├─ Q2 (الربع الثاني)
 ├─ Q3 (الربع الثالث)
 └─ Q4 (الربع الرابع)

السنة (Year)
[_______]
مثال: 2025

الحالة (Status) *
[▼ قيد التنفيذ ▼]
 ├─ قيد التنفيذ
 ├─ مخطط
 └─ مكتمل

المسؤول (Responsible)
[_______________________________]

الملاحظات (Notes)
[_______________________________]
[_______________________________]

[حفظ]  [إلغاء]
```

---

## 🔄 Data Flow

### School Executing Drill

```
1. School user opens Drills page
   ↓
2. Loads all drills from BC_Test_Plans
   (showing 4 drills for current year)
   ↓
3. School selects drill to execute
   ↓
4. Opens execution form with drill details (read-only)
   ↓
5. School fills in:
   - Execution Date
   - Evaluation
   - Comments
   ↓
6. Clicks "حفظ" (Save)
   ↓
7. Data saved to SBC_Drills_Log or similar list
   ↓
8. Success message shown
   ↓
9. School can view/edit their execution records
```

### Admin Creating Drill

```
1. Admin opens Admin → Drills tab
   ↓
2. Clicks "إضافة تمرين جديد"
   ↓
3. Fills form with all fields
   ↓
4. Clicks "حفظ"
   ↓
5. Data saved to BC_Test_Plans
   ↓
6. Drill appears in school view automatically
   ↓
7. All schools can now see and execute it
```

---

## 🔧 Frontend Components Needed

### 1. School View: `/src/components/Drills.tsx`

```typescript
interface TestPlan {
  id: number;
  title: string;
  hypothesis: string;
  specificEvent: string;
  targetGroup: string;
  startDate: string;
  endDate: string;
  status: string;
  responsible: string;
  notes: string;
  year?: number;
  quarter?: string;
}

// Display list of drills
// Show cards for each drill
// Allow execution with:
//   - Date picker for ExecutionDate
//   - Text area for Evaluation
//   - Text area for Comments
```

### 2. Admin View: `/src/components/AdminPanel.tsx` (Drills Tab)

```typescript
// List all test plans from BC_Test_Plans
// Add/Edit/Delete drills
// All fields from SharePoint must be editable:
//   - Title
//   - Hypothesis
//   - SpecificEvent
//   - TargetGroup
//   - StartDate
//   - EndDate
//   - Status (Choice field)
//   - Responsible
//   - Notes
//   - Year
//   - Quarter
```

---

## 📋 Checklist for Implementation

### Backend (SharePoint)
- ✅ BC_Test_Plans list exists
- ✅ All fields created with correct types
- ⏳ Sample data created (4 drills for year)
- ⏳ Choice values for Status defined

### Frontend - School View
- ⏳ Load drills from BC_Test_Plans
- ⏳ Display as cards/list
- ⏳ Show drill details (hypothesis, dates, status)
- ⏳ "Execute Drill" button for each
- ⏳ Execution form with:
  - Execution Date (date picker)
  - Evaluation (text area)
  - Comments (text area)
- ⏳ Save to SBC_Drills_Log
- ⏳ Show success message

### Frontend - Admin View
- ⏳ Display all drills from BC_Test_Plans
- ⏳ Add new drill form
- ⏳ Edit drill form (with all fields)
- ⏳ Delete drill confirmation
- ⏳ Save changes to BC_Test_Plans
- ⏳ Show success/error messages

### Testing
- ⏳ Admin creates 4 drills (one per quarter)
- ⏳ School sees all 4 drills
- ⏳ School executes a drill
- ⏳ Verify data saves to SharePoint
- ⏳ Verify fields match SharePoint columns

---

## 🗂️ SharePoint Lists Involved

### 1. BC_Test_Plans (Admin creates)
- Stores the annual drill plan
- 4 drills per year (one per quarter)
- Admin manages these

### 2. SBC_Drills_Log (Schools record execution)
- Schools record when they execute each drill
- Contains: DrillRef, SchoolName, ExecutionDate, Evaluation, Comments
- One record per school execution

---

## 🎯 Success Criteria

✅ School can see all 4 annual drills  
✅ School can execute any drill they're responsible for  
✅ School records: Date, Evaluation, Comments  
✅ Data saves correctly to SharePoint  
✅ Admin can create/edit/delete drills  
✅ All fields match between frontend and SharePoint  
✅ Status field works (قيد التنفيذ, مخطط, مكتمل)  
✅ Quarter and Year fields display correctly  

---

## 🔗 Related Lists

- **BC_Test_Plans** ← Main drill definitions
- **SBC_Drills_Log** ← School execution records
- **BC_Mutual_Operation** ← Where drills might be shared with partner schools
- **BC_Shared_Plan** ← Overall BC plan that includes drill schedule

