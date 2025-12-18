# SharePoint Dropdown Values Mismatch Report
## Critical Analysis of Frontend vs SharePoint Choice Fields

**Generated:** December 18, 2025  
**Issue:** User reported that "الجهة المقدمة" (ProviderEntity) dropdown values in frontend don't match SharePoint list values

---

## Executive Summary

This report compares hardcoded dropdown values in the frontend React components with SharePoint choice field definitions found in the Power SDK schema files (`.power/schemas/sharepointonline/*.Schema.json`).

**Key Finding:** The SharePoint schema files use **dynamic value retrieval** via `GetEntityValues` API operation. The actual choice values are NOT stored in the schema files but are retrieved at runtime from SharePoint. This means:

1. ✅ **Frontend correctly loads values dynamically** using `getReferencedEntity()` method
2. ⚠️ **Fallback hardcoded values may not match** actual SharePoint choices
3. ⚠️ **No way to verify actual SharePoint values** without runtime API call or SharePoint admin access

---

## 1. Coordination_Programs_Catalog List

### 1.1 ProviderEntity (الجهة المقدمة)

**Schema File Location:** `.power/schemas/sharepointonline/coordination_programs_catalog.Schema.json`

**SharePoint Configuration:**
- **Field ID:** `f48b36d7-b745-4db2-99a3-8356684f8a1c`
- **Type:** Choice (IsChoice: true)
- **Display:** الجهة المدربة
- **Value Retrieval:** Dynamic via `GetEntityValues` API operation
- **Format:** `{Value: string, Id: number, @odata.type: string}`

**Frontend Hardcoded Fallback Values** (Training.tsx lines 32-38):
```typescript
const defaultProviderEntityOptions: IDropdownOption[] = [
  { key: 'إدارة الأمن والسلامة المدرسية', text: 'إدارة الأمن والسلامة المدرسية' },
  { key: 'إدارة التدريب والابتعاث', text: 'إدارة التدريب والابتعاث' },
  { key: 'الدفاع المدني', text: 'الدفاع المدني' },
  { key: 'الهلال الأحمر', text: 'الهلال الأحمر' },
  { key: 'جهة خارجية', text: 'جهة خارجية' },
]
```

**Dynamic Loading** (Training.tsx lines 143):
```typescript
Coordination_Programs_CatalogService.getReferencedEntity('', 'ProviderEntity')
```

**Status:** ⚠️ **CANNOT VERIFY** - Actual SharePoint values unknown without runtime call
**Action Required:** User must verify actual SharePoint choice values in list settings

---

### 1.2 ActivityType (نوع النشاط)

**SharePoint Configuration:**
- **Field ID:** `a9484ad1-c767-4555-9e3e-ccdf264c23e1`
- **Type:** Choice (IsChoice: true)
- **Display:** نوع النشاط
- **Value Retrieval:** Dynamic via `GetEntityValues` API operation

**Frontend Hardcoded Fallback Values** (Training.tsx lines 40-46):
```typescript
const defaultActivityTypeOptions: IDropdownOption[] = [
  { key: 'ورشة عمل', text: 'ورشة عمل' },
  { key: 'دورة تدريبية', text: 'دورة تدريبية' },
  { key: 'محاضرة', text: 'محاضرة' },
  { key: 'ندوة', text: 'ندوة' },
  { key: 'لقاء', text: 'لقاء' },
]
```

**Status:** ⚠️ **CANNOT VERIFY** without runtime API call

---

### 1.3 TargetAudience (الفئة المستهدفة)

**SharePoint Configuration:**
- **Field ID:** `cd87a6bf-0c1a-42c0-a0b4-d12a39416f4d`
- **Type:** Multi-Choice (Array of choices)
- **Display:** الفئة المستهدفة
- **Value Retrieval:** Dynamic via `GetEntityValues` API operation

**Frontend Hardcoded Fallback Values** (Training.tsx lines 48-55):
```typescript
const defaultTargetAudienceOptions: IDropdownOption[] = [
  { key: 'منسقي الأمن والسلامة', text: 'منسقي الأمن والسلامة' },
  { key: 'قادة المدارس', text: 'قادة المدارس' },
  { key: 'المعلمين', text: 'المعلمين' },
  { key: 'الطلاب', text: 'الطلاب' },
  { key: 'أولياء الأمور', text: 'أولياء الأمور' },
  { key: 'فريق الأمن والسلامة', text: 'فريق الأمن والسلامة' },
]
```

**Status:** ⚠️ **CANNOT VERIFY** without runtime API call

---

### 1.4 ExecutionMode (آلية التنفيذ)

**SharePoint Configuration:**
- **Field ID:** `d9be0b83-2647-40b0-88cc-8616795de4e3`
- **Type:** Choice (IsChoice: true)
- **Display:** آلية التنفيذ
- **Value Retrieval:** Dynamic via `GetEntityValues` API operation

**Frontend Hardcoded Fallback Values** (Training.tsx lines 57-63):
```typescript
const defaultExecutionModeOptions: IDropdownOption[] = [
  { key: 'حضوري', text: 'حضوري' },
  { key: 'تعليم عن بعد', text: 'تعليم عن بعد' },
  { key: 'عن بعد', text: 'عن بعد' },
  { key: 'تعليم مدمج', text: 'تعليم مدمج' },
  { key: 'مدمج', text: 'مدمج' },
]
```

**Notice:** Contains duplicate concepts:
- 'تعليم عن بعد' and 'عن بعد' (same meaning)
- 'تعليم مدمج' and 'مدمج' (same meaning)

**Status:** ⚠️ **LIKELY MISMATCH** - Duplicates suggest possible confusion

---

### 1.5 CoordinationStatus (حالة البرنامج)

**SharePoint Configuration:**
- **Field ID:** `29519557-d42e-4251-951f-75d02512e3bb`
- **Type:** Choice (IsChoice: true)
- **Display:** حالة البرنامج
- **Value Retrieval:** Dynamic via `GetEntityValues` API operation

**Frontend Hardcoded Fallback Values** (Training.tsx lines 65-71):
```typescript
const defaultCoordinationStatusOptions: IDropdownOption[] = [
  { key: 'تم التنفيذ', text: 'تم التنفيذ' },
  { key: 'قيد التنفيذ', text: 'قيد التنفيذ' },
  { key: 'مخطط', text: 'مخطط' },
  { key: 'ملغي', text: 'ملغي' },
  { key: 'مؤجل', text: 'مؤجل' },
]
```

**Status:** ⚠️ **CANNOT VERIFY** without runtime API call

---

## 2. SBC_Incidents_Log List

### 2.1 ActionTaken (الإجراء المتخذ / البديل المفعل)

**Schema File Location:** `.power/schemas/sharepointonline/sbc_incidents_log.Schema.json`

**SharePoint Configuration:**
- **Field ID:** `37428e3c-5498-4c08-8fae-285879364143`
- **Type:** Choice (IsChoice: true)
- **Display:** البديل المفعل (NOT "الإجراء المتخذ" as user mentioned!)
- **Value Retrieval:** Dynamic via `GetEntityValues` API operation

**Fallback Values in SharePointService** (sharepointService.ts lines 552-558):
```typescript
const actionTakenOptions: ChoiceOption[] = [
  { key: "إخلاء", text: "إخلاء" },
  { key: "إسعاف", text: "إسعاف" },
  { key: "إطفاء", text: "إطفاء" },
  { key: "إبلاغ الجهات", text: "إبلاغ الجهات المختصة" },
  { key: "أخرى", text: "أخرى" },
];
```

**⚠️ CRITICAL FINDING:** 
- **User said:** Field is called "الإجراء المتخذ" (Action Taken)
- **SharePoint Schema shows:** Field description is "البديل المفعل" (Activated Alternative)
- **This suggests a semantic mismatch** - the field name doesn't match its purpose

**Status:** ⚠️ **SEMANTIC CONFUSION** - Field purpose unclear

---

### 2.2 AltLocation (المدرسة البديلة)

**SharePoint Configuration:**
- **Field ID:** `0eb1c71c-a1f8-40a1-ad27-f4a93cb98e65`
- **Type:** Choice (IsChoice: true)
- **Display:** المدرسة البديلة
- **Value Retrieval:** Dynamic via `GetEntityValues` API operation

**Fallback Values in SharePointService** (sharepointService.ts lines 560-564):
```typescript
const altLocationOptions: ChoiceOption[] = [
  { key: "مدرسة مجاورة", text: "مدرسة مجاورة" },
  { key: "مركز إيواء", text: "مركز إيواء" },
  { key: "لا يوجد", text: "لا يوجد" },
];
```

**Status:** ⚠️ **CANNOT VERIFY** without runtime API call

---

### 2.3 ActivatedAlternative (البديل)

**SharePoint Configuration:**
- **Field ID:** `8d77ba7a-a715-4912-969b-71f90d0fdc43`
- **Type:** Choice (IsChoice: true)
- **Display:** البديل
- **Value Retrieval:** Dynamic via `GetEntityValues` API operation

**Fallback Values in SharePointService** (sharepointService.ts lines 542-548):
```typescript
const activatedAlternativeOptions: ChoiceOption[] = [
  { key: "لا يوجد", text: "لا يوجد بديل" },
  { key: "مدرسة بديلة", text: "مدرسة بديلة (من التشغيل المتبادل)" },
  { key: "تعليم عن بعد", text: "التحول للتعليم عن بعد" },
  { key: "نقل مؤقت", text: "نقل مؤقت لمبنى آخر" },
  { key: "دمج فصول", text: "دمج الفصول" },
];
```

**Status:** ⚠️ **CANNOT VERIFY** without runtime API call

---

## 3. How Dynamic Loading Works

The frontend correctly implements dynamic loading:

### Training Component (Training.tsx lines 137-183):
```typescript
const loadDropdownOptions = async () => {
  try {
    const [providerResult, activityResult, targetResult, executionResult, statusResult] = await Promise.all([
      Coordination_Programs_CatalogService.getReferencedEntity('', 'ProviderEntity'),
      Coordination_Programs_CatalogService.getReferencedEntity('', 'ActivityType'),
      Coordination_Programs_CatalogService.getReferencedEntity('', 'TargetAudience'),
      Coordination_Programs_CatalogService.getReferencedEntity('', 'ExecutionMode'),
      Coordination_Programs_CatalogService.getReferencedEntity('', 'CoordinationStatus'),
    ])
    
    // Update state with actual SharePoint values
    if (providerResult?.success && providerResult.data) {
      const options = toDropdownOptions(providerResult.data as any[])
      if (options.length > 0) setProviderEntityOptions(options)
    }
    // ... etc for other fields
  } catch (e) {
    // Fallback to hardcoded defaults
  }
}
```

### Incidents Component (Incidents.tsx lines 158-231):
```typescript
const loadDropdownOptions = async () => {
  try {
    const [
      incidentCategoryRes,
      riskLevelRes,
      alertModelTypeRes,
      activatedAlternativeRes,
      coordinatedEntitiesRes,
      actionTakenRes,
      altLocationRes,
    ] = await Promise.all([
      SBC_Incidents_LogService.getReferencedEntity('', 'IncidentCategory'),
      SBC_Incidents_LogService.getReferencedEntity('', 'RiskLevel'),
      SBC_Incidents_LogService.getReferencedEntity('', 'AlertModelType'),
      SBC_Incidents_LogService.getReferencedEntity('', 'ActivatedAlternative'),
      SBC_Incidents_LogService.getReferencedEntity('', 'CoordinatedEntities'),
      SBC_Incidents_LogService.getReferencedEntity('', 'ActionTaken'),
      SBC_Incidents_LogService.getReferencedEntity('', 'AltLocation'),
    ])
    
    // Update state with actual SharePoint values
    // Fallback to SharePointService hardcoded options on error
  } catch (error) {
    setIncidentCategoryOptions(SharePointService.getIncidentCategoryOptions())
    // ... etc
  }
}
```

---

## 4. Root Cause Analysis

### Why User Sees Mismatch

The user reported seeing wrong values in the dropdown. Possible causes:

1. **API Call Failure:** The `getReferencedEntity()` call might be failing, causing fallback to hardcoded values
2. **SharePoint Values Were Changed:** Admin changed choice values in SharePoint list settings after app was deployed
3. **Schema Not Regenerated:** App schema not updated after SharePoint changes (need to run `pac code add-data-source` again)
4. **Incorrect Fallback Values:** Hardcoded fallback values never matched actual SharePoint from the beginning

### Evidence from Code

**Training.tsx lines 143-154** shows proper error handling:
```typescript
Coordination_Programs_CatalogService.getReferencedEntity('', 'ProviderEntity')
  .catch(e => { console.warn('ProviderEntity:', e); return null }),
```

If the API call fails, it:
1. Logs warning to console
2. Returns null
3. Falls back to `defaultProviderEntityOptions` hardcoded values

**The user needs to check browser console logs** for warnings like:
- `ProviderEntity: [error details]`
- `ActivityType: [error details]`
- etc.

---

## 5. Verification Steps for User

### Step 1: Check SharePoint List Settings

1. Open SharePoint site: https://saudimoe.sharepoint.com/sites/em
2. Navigate to `Coordination_Programs_Catalog` list
3. Go to **List Settings** → **Column Settings** → Click on each choice column:
   - **ProviderEntity** (الجهة المدربة)
   - **ActivityType** (نوع النشاط)
   - **TargetAudience** (الفئة المستهدفة)
   - **ExecutionMode** (آلية التنفيذ)
   - **CoordinationStatus** (حالة البرنامج)
4. Document the **actual choice values** shown in SharePoint

### Step 2: Check Browser Console

1. Open the app in browser
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Look for logs starting with `[Training]`:
   - `[Training] Loading dropdown options from SharePoint...`
   - `[Training] ProviderEntity options: [...]`
   - `[Training] Dropdown options loaded successfully`
5. Check for any **warnings or errors**:
   - `ProviderEntity: [error]`
   - API authentication errors
   - Network errors

### Step 3: Compare Values

Create a comparison table:

| Field Name | SharePoint Actual Values | Frontend Fallback Values | Match? |
|-----------|-------------------------|--------------------------|--------|
| ProviderEntity | [user fills this] | إدارة الأمن والسلامة المدرسية, إدارة التدريب والابتعاث, الدفاع المدني, الهلال الأحمر, جهة خارجية | ? |
| ActivityType | [user fills this] | ورشة عمل, دورة تدريبية, محاضرة, ندوة, لقاء | ? |
| TargetAudience | [user fills this] | منسقي الأمن والسلامة, قادة المدارس, المعلمين, الطلاب, أولياء الأمور, فريق الأمن والسلامة | ? |
| ExecutionMode | [user fills this] | حضوري, تعليم عن بعد, عن بعد, تعليم مدمج, مدمج | ? |
| CoordinationStatus | [user fills this] | تم التنفيذ, قيد التنفيذ, مخطط, ملغي, مؤجل | ? |

---

## 6. Solutions

### Solution 1: Update Hardcoded Fallback Values

**If SharePoint values are correct but frontend fallbacks are wrong:**

Update the default values in `Training.tsx` (lines 32-71) to match actual SharePoint values.

**File:** `src/components/Training.tsx`

```typescript
// Replace with actual SharePoint values from Step 1
const defaultProviderEntityOptions: IDropdownOption[] = [
  // UPDATE THESE VALUES
]
```

### Solution 2: Fix API Call Issues

**If API calls are failing (check console warnings):**

Possible causes:
- Power Apps authentication issue
- SharePoint permissions issue
- Network connectivity issue
- Incorrect field ID in schema

**To regenerate schema:**
```bash
pac code add-data-source -a shared_sharepointonline -c [connectionId] -t "Coordination_Programs_Catalog" -d "https://saudimoe.sharepoint.com/sites/em"
```

### Solution 3: Update SharePoint Choice Values

**If SharePoint values are wrong:**

Admin needs to:
1. Go to SharePoint List Settings
2. Edit the choice column
3. Add/remove/modify choice values
4. Save changes
5. Regenerate app schema (see Solution 2)

### Solution 4: Remove Duplicate Values

**ExecutionMode has duplicates:**

Either in SharePoint or frontend, consolidate:
- Keep: `عن بعد` (remove: `تعليم عن بعد`)
- Keep: `مدمج` (remove: `تعليم مدمج`)

---

## 7. Summary Table - All Fields

| List | Field | Frontend Location | Schema Field ID | Status | Priority |
|------|-------|------------------|----------------|--------|----------|
| Coordination_Programs_Catalog | ProviderEntity | Training.tsx:32 | f48b36d7-b745-4db2-99a3-8356684f8a1c | ⚠️ Cannot Verify | 🔴 High |
| Coordination_Programs_Catalog | ActivityType | Training.tsx:40 | a9484ad1-c767-4555-9e3e-ccdf264c23e1 | ⚠️ Cannot Verify | 🟡 Medium |
| Coordination_Programs_Catalog | TargetAudience | Training.tsx:48 | cd87a6bf-0c1a-42c0-a0b4-d12a39416f4d | ⚠️ Cannot Verify | 🟡 Medium |
| Coordination_Programs_Catalog | ExecutionMode | Training.tsx:57 | d9be0b83-2647-40b0-88cc-8616795de4e3 | ⚠️ Likely Mismatch (duplicates) | 🟡 Medium |
| Coordination_Programs_Catalog | CoordinationStatus | Training.tsx:65 | 29519557-d42e-4251-951f-75d02512e3bb | ⚠️ Cannot Verify | 🟢 Low |
| SBC_Incidents_Log | ActionTaken | sharepointService.ts:552 | 37428e3c-5498-4c08-8fae-285879364143 | ⚠️ Semantic Confusion | 🔴 High |
| SBC_Incidents_Log | AltLocation | sharepointService.ts:560 | 0eb1c71c-a1f8-40a1-ad27-f4a93cb98e65 | ⚠️ Cannot Verify | 🟡 Medium |
| SBC_Incidents_Log | ActivatedAlternative | sharepointService.ts:542 | 8d77ba7a-a715-4912-969b-71f90d0fdc43 | ⚠️ Cannot Verify | 🟡 Medium |

---

## 8. Next Steps

### Immediate Actions (User Must Do):

1. ✅ **Check browser console** when opening Training or Incidents components
2. ✅ **Document SharePoint actual values** using Step 1 above
3. ✅ **Share console logs** if any errors appear
4. ✅ **Compare values** and identify specific mismatches

### Developer Actions (After Verification):

1. Update hardcoded fallback values to match SharePoint
2. Fix ExecutionMode duplicates
3. Clarify ActionTaken field semantic confusion
4. Add better error messages for API failures
5. Consider adding admin UI to view/test dropdown values

---

## 9. Technical Notes

### Why Schema Files Don't Contain Actual Values

SharePoint choice fields use **dynamic value retrieval** for several reasons:

1. **Centralized Management:** Values stored in SharePoint, not in app code
2. **Runtime Flexibility:** Admin can change values without redeploying app
3. **Security:** Some choice values may be permission-based
4. **Performance:** Reduces app bundle size

### API Operation Details

The `GetEntityValues` operation called by `getReferencedEntity()`:

**Endpoint Pattern:**
```
GET /{connectionId}/datasets/{dataset}/tables/{tableName}/entities/{fieldId}
```

**Example:**
```
GET /[conn]/datasets/https://saudimoe.sharepoint.com/sites/em/tables/Coordination_Programs_Catalog/entities/ProviderEntity
```

**Response Format:**
```json
{
  "value": [
    {"@odata.type": "...", "Id": 1, "Value": "إدارة الأمن والسلامة المدرسية"},
    {"@odata.type": "...", "Id": 2, "Value": "إدارة التدريب والابتعاث"},
    ...
  ]
}
```

---

## 10. Conclusion

**The app is architecturally correct** - it properly attempts to load choice values dynamically from SharePoint and only falls back to hardcoded values on error.

**The problem is likely one of:**
1. API call failures (check console)
2. Outdated fallback values
3. SharePoint choice values changed after deployment
4. Schema not regenerated after SharePoint changes

**User must perform verification steps** to identify the exact mismatch and root cause.

---

**Report End**
