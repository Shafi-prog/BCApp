# Quick Reference: Dropdown Values Comparison

## For User: Fill in "SharePoint Actual" column by checking list settings

---

## Coordination_Programs_Catalog List

### ProviderEntity (الجهة المقدمة / الجهة المدربة)

| SharePoint Actual Values | Frontend Fallback Values | Match? |
|-------------------------|--------------------------|--------|
| [Check SharePoint] | إدارة الأمن والسلامة المدرسية | ❓ |
| [Check SharePoint] | إدارة التدريب والابتعاث | ❓ |
| [Check SharePoint] | الدفاع المدني | ❓ |
| [Check SharePoint] | الهلال الأحمر | ❓ |
| [Check SharePoint] | جهة خارجية | ❓ |

**Location in code:** `src/components/Training.tsx` lines 32-38  
**Schema Field ID:** `f48b36d7-b745-4db2-99a3-8356684f8a1c`

---

### ActivityType (نوع النشاط)

| SharePoint Actual Values | Frontend Fallback Values | Match? |
|-------------------------|--------------------------|--------|
| [Check SharePoint] | ورشة عمل | ❓ |
| [Check SharePoint] | دورة تدريبية | ❓ |
| [Check SharePoint] | محاضرة | ❓ |
| [Check SharePoint] | ندوة | ❓ |
| [Check SharePoint] | لقاء | ❓ |

**Location in code:** `src/components/Training.tsx` lines 40-46  
**Schema Field ID:** `a9484ad1-c767-4555-9e3e-ccdf264c23e1`

---

### TargetAudience (الفئة المستهدفة)

| SharePoint Actual Values | Frontend Fallback Values | Match? |
|-------------------------|--------------------------|--------|
| [Check SharePoint] | منسقي الأمن والسلامة | ❓ |
| [Check SharePoint] | قادة المدارس | ❓ |
| [Check SharePoint] | المعلمين | ❓ |
| [Check SharePoint] | الطلاب | ❓ |
| [Check SharePoint] | أولياء الأمور | ❓ |
| [Check SharePoint] | فريق الأمن والسلامة | ❓ |

**Location in code:** `src/components/Training.tsx` lines 48-55  
**Schema Field ID:** `cd87a6bf-0c1a-42c0-a0b4-d12a39416f4d`

---

### ExecutionMode (آلية التنفيذ)

⚠️ **WARNING:** Contains duplicate concepts

| SharePoint Actual Values | Frontend Fallback Values | Match? | Notes |
|-------------------------|--------------------------|--------|-------|
| [Check SharePoint] | حضوري | ❓ | |
| [Check SharePoint] | تعليم عن بعد | ❓ | Duplicate? |
| [Check SharePoint] | عن بعد | ❓ | Duplicate? |
| [Check SharePoint] | تعليم مدمج | ❓ | Duplicate? |
| [Check SharePoint] | مدمج | ❓ | Duplicate? |

**Location in code:** `src/components/Training.tsx` lines 57-63  
**Schema Field ID:** `d9be0b83-2647-40b0-88cc-8616795de4e3`

**Recommendation:** Remove duplicates - keep either "عن بعد" OR "تعليم عن بعد", and either "مدمج" OR "تعليم مدمج"

---

### CoordinationStatus (حالة البرنامج)

| SharePoint Actual Values | Frontend Fallback Values | Match? |
|-------------------------|--------------------------|--------|
| [Check SharePoint] | تم التنفيذ | ❓ |
| [Check SharePoint] | قيد التنفيذ | ❓ |
| [Check SharePoint] | مخطط | ❓ |
| [Check SharePoint] | ملغي | ❓ |
| [Check SharePoint] | مؤجل | ❓ |

**Location in code:** `src/components/Training.tsx` lines 65-71  
**Schema Field ID:** `29519557-d42e-4251-951f-75d02512e3bb`

---

## SBC_Incidents_Log List

### ActionTaken (الإجراء المتخذ)

⚠️ **SEMANTIC CONFUSION:** Schema shows "البديل المفعل" but user mentioned "الإجراء المتخذ"

| SharePoint Actual Values | Frontend Fallback Values | Match? |
|-------------------------|--------------------------|--------|
| [Check SharePoint] | إخلاء | ❓ |
| [Check SharePoint] | إسعاف | ❓ |
| [Check SharePoint] | إطفاء | ❓ |
| [Check SharePoint] | إبلاغ الجهات المختصة | ❓ |
| [Check SharePoint] | أخرى | ❓ |

**Location in code:** `src/services/sharepointService.ts` lines 552-558  
**Schema Field ID:** `37428e3c-5498-4c08-8fae-285879364143`  
**Schema Description:** البديل المفعل (NOT الإجراء المتخذ!)

---

### AltLocation (المدرسة البديلة)

| SharePoint Actual Values | Frontend Fallback Values | Match? |
|-------------------------|--------------------------|--------|
| [Check SharePoint] | مدرسة مجاورة | ❓ |
| [Check SharePoint] | مركز إيواء | ❓ |
| [Check SharePoint] | لا يوجد | ❓ |

**Location in code:** `src/services/sharepointService.ts` lines 560-564  
**Schema Field ID:** `0eb1c71c-a1f8-40a1-ad27-f4a93cb98e65`

---

### ActivatedAlternative (البديل)

| SharePoint Actual Values | Frontend Fallback Values | Match? |
|-------------------------|--------------------------|--------|
| [Check SharePoint] | لا يوجد بديل | ❓ |
| [Check SharePoint] | مدرسة بديلة (من التشغيل المتبادل) | ❓ |
| [Check SharePoint] | التحول للتعليم عن بعد | ❓ |
| [Check SharePoint] | نقل مؤقت لمبنى آخر | ❓ |
| [Check SharePoint] | دمج الفصول | ❓ |

**Location in code:** `src/services/sharepointService.ts` lines 542-548  
**Schema Field ID:** `8d77ba7a-a715-4912-969b-71f90d0fdc43`

---

## How to Fill This Form

### Step 1: Access SharePoint
1. Go to: https://saudimoe.sharepoint.com/sites/em
2. Navigate to the list (e.g., `Coordination_Programs_Catalog`)

### Step 2: Check Column Settings
1. Click **Settings** (gear icon) → **List Settings**
2. Under **Columns**, click on the column name (e.g., "ProviderEntity")
3. Look for **Choices** section
4. Write down EXACT text of each choice value

### Step 3: Fill the Table
For each field:
- Write the SharePoint actual value next to the frontend value
- Mark ✅ if they match exactly
- Mark ❌ if they don't match
- Mark ⚠️ if similar but not exact

### Step 4: Check Browser Console
1. Open app in browser
2. Press F12 (Developer Tools)
3. Go to **Console** tab
4. Look for messages starting with `[Training]` or errors
5. Screenshot any errors and share

---

## Example (How to Fill):

If SharePoint shows these values for ProviderEntity:
- إدارة الأمن والسلامة
- التدريب والابتعاث
- الدفاع المدني

Then the table would be:

| SharePoint Actual Values | Frontend Fallback Values | Match? |
|-------------------------|--------------------------|--------|
| إدارة الأمن والسلامة | إدارة الأمن والسلامة المدرسية | ⚠️ Similar but different |
| التدريب والابتعاث | إدارة التدريب والابتعاث | ⚠️ Similar but different |
| الدفاع المدني | الدفاع المدني | ✅ Exact match |
| [Not in SharePoint] | الهلال الأحمر | ❌ Extra in frontend |
| [Not in SharePoint] | جهة خارجية | ❌ Extra in frontend |

This shows:
1. Some values are similar but not exact
2. Frontend has extra values not in SharePoint
3. Need to update frontend to match SharePoint exactly

---

## After Filling This Form

Send the completed form with:
1. Filled comparison tables
2. Screenshots from SharePoint list settings
3. Screenshots from browser console (if any errors)
4. Description of which field(s) the user is having issues with

Then the developer can:
1. Update the hardcoded fallback values in the code
2. Fix any API call issues
3. Ensure dropdown values match SharePoint exactly

---

**Quick Reference End**
