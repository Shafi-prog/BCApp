# Field Mapping Fix - Complete Audit
**Date:** December 20, 2025  
**Goal:** Perfect equality between Frontend fields and SharePoint columns

---

## 📋 SECTION A: MISSING SHAREPOINT COLUMNS (For You to ADD)

These fields exist in frontend code but are NOT in SharePoint. You must add these columns to SharePoint.

### ✅ 1. **BC_Test_Plans** (NEW LIST - Already Exists with All Columns)
**Frontend Interface:** `Drill` needs new interface `TestPlan` in [src/services/adminDataService.ts](src/services/adminDataService.ts)

**SharePoint Columns (VERIFIED - All Present):**
- Title (Single line text)
- Hypothesis (Single line text)
- SpecificEvent (Single line text)
- TargetGroup (Single line text)
- StartDate (Date and Time)
- EndDate (Date and Time)
- Status (Choice)
- Responsible (Single line text)
- Notes (Single line text)
- Year (Number)
- Quarter (Single line text)

**Action:** ✅ No columns to add - Create new frontend interface `TestPlan` to map this list.

---

### ✅ 2. **School_Training_Log** (STATUS COLUMN EXISTS)
**Frontend Interface:** `TrainingLog` in [src/services/sharepointService.ts](src/services/sharepointService.ts#L164-L175)

**SharePoint Columns (VERIFIED - All Present):**
- Title (Single line text)
- SchoolName_Ref (Lookup)
- Program_Ref (Lookup)
- RegistrationType (Choice)
- AttendeesNames (Lookup)
- TrainingDate (Date and Time)
- Status (Choice: "مسجل, مكتمل, ملغي")

**Action:** ✅ No columns to add - Update frontend to map Status field.

---

### 3. **Coordination_Programs_Catalog** (Status Column - Optional Rename)
**Frontend Interface:** `TrainingProgram` in [src/services/sharepointService.ts](src/services/sharepointService.ts#L152-L162)

**Current State:** Uses `CoordinationStatus` as the status field in SharePoint.

**Action:** ⬜ Optional - You can either:
- Rename `CoordinationStatus` column to `Status` for consistency, OR  
- Keep as-is and update frontend to use `CoordinationStatus`

---

### ✅ 4. **BC_Plan_Review** (ALL COLUMNS EXIST)
**Frontend Interface:** `PlanReview` in [src/services/adminDataService.ts](src/services/adminDataService.ts#L96-L118)

**SharePoint Columns (VERIFIED - All Present):**
- Title, ReviewDate, ReviewedBy, ReviewerRole, PlanVersion, OverallStatus, CompletionPercentage
- ScenariosReviewed, ProceduresReviewed, ContactsReviewed, ResourcesReviewed, TrainingReviewed
- FindingsCount, CriticalFindings, RecommendationsCount, NextReviewDate, ApprovalStatus
- ApprovedBy, ApprovalDate, reviewNotes, Plan_Ref, ReviewFileName, ReviewFileUploadDate
- ReviewRecommendations, response_scenario1-5, ProceduresFileName, ProceduresFileUploadDate
- Task7_1_Complete, Task7_2_Complete, Task7_3_Complete, LastUpdated

**Action:** ✅ No columns to add - Update frontend transformers to map all fields correctly.

---

### ✅ 5. **BC_Mutual_Operation** (ALL COLUMNS EXIST)
**Frontend Interface:** `MutualOperation` in [src/services/adminDataService.ts](src/services/adminDataService.ts#L111-L117)

**SharePoint Columns (VERIFIED - All Present):**
- Title, AlternativeAddress, Distance, ActivationPriority, ContactPerson, ContactPhone, ContactEmail
- AgreementStatus, AgreementDate, LastVerified, Notes, IsActive
- SourceSchoolID, SourceSchoolName, AlternativeSchoolID, AlternativeSchoolName
- Capacity, SupportingGrades

**Action:** ✅ No columns to add - Map frontend fields to actual column names (not field_N pattern).

---

### ✅ 6. **BC_Incident_Evaluations** (ALL COLUMNS EXIST)
**Frontend Interface:** `IncidentEvaluation` in [src/services/adminDataService.ts](src/services/adminDataService.ts#L85-L108)

**SharePoint Columns (VERIFIED - All Present):**
- Title, EvaluationDate, EvaluatedBy, ResponseEffectiveness, CommunicationEffectiveness
- CoordinationEffectiveness, TimelinessScore, OverallScore, strengths, weaknesses
- recommendations, LessonsLearned, FollowUpRequired, FollowUpDate, Notes
- IncidentNumber, Incident_Ref, ResponseTimeMinutes, RecoveryTimeHours
- StudentsReturnedDate, AlternativeUsed

**Action:** ✅ No columns to add - Update frontend transformers to map all fields correctly.

---

### ✅ 7. **BC_Admin_Contacts** (ALL COLUMNS EXIST)
**Frontend Interface:** `AdminContact` in [src/services/adminDataService.ts](src/services/adminDataService.ts#L20-L35)

**SharePoint Columns (VERIFIED - All Present):**
- Title, Role, Phone, Email, Organization, Category, ContactScope, ContactTiming, BackupMember, Notes, IsActive

**Action:** ✅ No columns to add - IsActive already exists and is mapped.

---

### ✅ 8. **BC_DR_Checklist** (ALL COLUMNS EXIST)
**Frontend Interface:** `DRCheckItem` in [src/services/adminDataService.ts](src/services/adminDataService.ts#L77-L84)

**SharePoint Columns (VERIFIED - All Present):**
- Title, Category, Status, LastChecked, CheckedBy, Notes, SortOrder

**Action:** ✅ No columns to add - All fields exist in SharePoint.

---

---

## 📝 SECTION B: MISSING FRONTEND FIELDS (For Me to ADD to Code)

These columns exist in SharePoint but are NOT in frontend interfaces/code. I will add these.

### ✅ 1. **BC_Incident_Evaluations** - Already Added
All 8 fields have been added to `IncidentEvaluation` interface:
- ResponseEffectiveness, CommunicationEffectiveness, CoordinationEffectiveness, TimelinessScore
- LessonsLearned, FollowUpRequired, FollowUpDate, Notes

**Status:** ✅ COMPLETED - Transformers updated to map from actual column names

---

### ✅ 2. **BC_Admin_Contacts** - Already Added
Field added to `AdminContact` interface:
- IsActive

**Status:** ✅ COMPLETED - Transformer updated

---

### ✅ 3. **BC_DR_Checklist** - Already Added
Fields added to `DRCheckItem` interface:
- Priority, ResponsiblePerson (SortOrder may also be needed)

**Status:** ✅ COMPLETED - Transformers updated

---

### ✅ 4. **BC_Plan_Review** - Already Added
Fields added to `PlanReview` interface:
- ReviewedBy, ReviewerRole

**Status:** ✅ COMPLETED - Need to map additional SharePoint columns (ApprovedBy, ApprovalDate, ReviewFileUploadDate, etc.)

---

### ✅ 5. **BC_Mutual_Operation** - Already Added
Fields added to `MutualOperation` interface:
- ActivationPriority, ContactPerson, ContactPhone, ContactEmail, AgreementStatus, AgreementDate, LastVerified

**Status:** ✅ COMPLETED - Need to update transformers to map from actual column names (AlternativeAddress, SourceSchoolName, AlternativeSchoolName, etc.)

---

### 🆕 6. **BC_Test_Plans** - NEW INTERFACE NEEDED
**New Frontend Interface:** `TestPlan` (will add to [src/services/adminDataService.ts](src/services/adminDataService.ts))

**SharePoint Columns to Map:**
```
Title, Hypothesis, SpecificEvent, TargetGroup, StartDate, EndDate, 
Status, Responsible, Notes, Year, Quarter
```

**Action:** CREATE new `TestPlan` interface + `transformTestPlan()` function

---

### ✅ 7. **BC_Shared_Plan** - Already Added
Field added to `SharedBCPlan` interface:
- publishDate

**Status:** ✅ COMPLETED

---

### ✅ 8. **BC_Plan_Scenarios** - Already Added
Fields added to `PlanScenario` interface:
- scenarioNumber, sortOrder, planRef

**Status:** ✅ COMPLETED

---

### ✅ 9. **BC_Damage_Reports** - Already Added
Fields added to `DamageReport` interface:
- reportedBy, incidentRef

**Status:** ✅ COMPLETED

---

---

## 🔄 SUMMARY TABLE

| List Name | Missing in SharePoint | Missing in Frontend | Status |
|---|---|---|---|
| **BC_Test_Plans** | ✅ 0 (All columns exist) | 🆕 Create TestPlan interface | **NEW LIST** |
| **School_Training_Log** | ✅ 0 (Status exists) | ✅ 0 (needs mapping) | **READY** |
| **Coordination_Programs_Catalog** | ⬜ 1 (optional rename CoordinationStatus→Status) | 0 | **LOW PRIORITY** |
| **BC_Plan_Review** | ✅ 0 (All exist) | ✅ 2 added (need full mapping) | **READY** |
| **BC_Mutual_Operation** | ✅ 0 (All exist) | ✅ 7 added (need full mapping) | **READY** |
| **BC_Incident_Evaluations** | ✅ 0 (All exist) | ✅ 8 added (transformers updated) | **READY** |
| **BC_Admin_Contacts** | ✅ 0 (All exist) | ✅ 1 added (transformer updated) | **READY** |
| **BC_DR_Checklist** | ✅ 0 (All exist) | ✅ 2 added (transformers updated) | **READY** |
| **BC_Shared_Plan** | ✅ 0 | ✅ 1 added | **READY** |
| **BC_Plan_Scenarios** | ✅ 0 | ✅ 3 added | **READY** |
| **BC_Damage_Reports** | ✅ 0 | ✅ 2 added | **READY** |

---

## ✅ ACTION PLAN - UPDATED

### YOUR TASKS (SharePoint Columns):
✅ **COMPLETE** - All critical SharePoint columns already exist in:
- BC_Test_Plans ✅
- School_Training_Log ✅
- BC_Plan_Review ✅
- BC_Mutual_Operation ✅
- BC_Incident_Evaluations ✅
- BC_Admin_Contacts ✅
- BC_DR_Checklist ✅

### OPTIONAL TASK (Your Choice):
- Rename `CoordinationStatus` column to `Status` in Coordination_Programs_Catalog (for consistency)

### MY TASKS (Frontend Code):
✅ **COMPLETED:**
- ✅ Added 8 fields to `IncidentEvaluation`
- ✅ Added 1 field to `AdminContact`
- ✅ Added 2 fields to `DRCheckItem`
- ✅ Added 1 field to `SharedBCPlan`
- ✅ Added 3 fields to `PlanScenario`
- ✅ Added 7 fields to `MutualOperation`
- ✅ Added 2 fields to `DamageReport`
- ✅ Added 2 fields to `PlanReview`

🆕 **NEXT - TO DO:**
- CREATE new `TestPlan` interface for BC_Test_Plans list
- UPDATE all transformer functions to map from ACTUAL column names (not field_N patterns)

---

## 📌 NEXT STEPS

1. ✅ **SharePoint Setup:** All critical columns already exist - No action needed
2. 🔄 **Frontend Code Update:** 
   - ✅ Base interfaces created with 26 fields added
   - 🆕 CREATE new `TestPlan` interface for BC_Test_Plans
   - 🔄 UPDATE all transformers to map from actual SharePoint column names
3. **Power SDK Schema Regeneration:**
   ```bash
   pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "BC_Test_Plans" -d "https://saudimoe.sharepoint.com/sites/em"
   pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "School_Training_Log" -d "https://saudimoe.sharepoint.com/sites/em"
   ```
4. **Build, Test, and Deploy:**
   ```bash
   npm run build
   pac code push
   ```

---

**Report Updated: December 20, 2025**
