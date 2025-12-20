# SharePoint Lists Column Reference

**Last Updated:** December 20, 2025  
**Status:** ✅ Verified - All columns exist and mapped

---

## Quick Navigation

- [BC_Test_Plans](#1-bc_test_plans) - ✅ All columns verified
- [School_Training_Log](#2-school_training_log) - ✅ Status column verified
- [BC_Plan_Review](#3-bc_plan_review) - ✅ All columns verified
- [BC_Mutual_Operation](#4-bc_mutual_operation) - ✅ All columns verified
- [BC_Incident_Evaluations](#5-bc_incident_evaluations) - ✅ All columns verified
- [BC_Admin_Contacts](#6-bc_admin_contacts) - ✅ All columns verified
- [BC_DR_Checklist](#7-bc_dr_checklist) - ✅ All columns verified

---

## 1. BC_Test_Plans

**Purpose**: Test and drill planning for business continuity exercises

| Column Name | Type | Frontend Field | Required | Notes |
|---|---|---|---|---|
| Title | Single line text | title | ✅ | Plan title/name |
| Hypothesis | Single line text | hypothesis | ✅ | Test hypothesis |
| SpecificEvent | Single line text | specificEvent | ✅ | Specific event being tested |
| TargetGroup | Single line text | targetGroup | ✅ | Target group for test |
| StartDate | Date and Time | startDate | ✅ | Test start date |
| EndDate | Date and Time | endDate | ✅ | Test end date |
| Status | Choice | status | ✅ | Test status |
| Responsible | Single line text | responsible | ✅ | Person responsible |
| Notes | Single line text | notes | ✅ | Additional notes |
| Year | Number | (not mapped) | ⬜ | Academic year |
| Quarter | Single line text | (not mapped) | ⬜ | Quarter information |

**Frontend Interface:** `TestPlan`  
**Frontend Service:** `AdminDataService.getTestPlans()`  
**Status:** ✅ All columns mapped

---

## 2. School_Training_Log

**Purpose**: Track training attendance and completion

| Column Name | Type | Frontend Field | Required | Notes |
|---|---|---|---|---|
| Title | Single line text | Title | ✅ | Training entry title |
| SchoolName_Ref | Lookup | (lookup reference) | ✅ | School reference |
| Program_Ref | Lookup | (lookup reference) | ✅ | Training program reference |
| RegistrationType | Choice | registrationType | ✅ | Type of registration |
| AttendeesNames | Lookup | (lookup reference) | ✅ | Attendees reference |
| TrainingDate | Date and Time | trainingDate | ✅ | Date of training |
| **Status** | **Choice** | **status** | **✅** | **✅ VERIFIED - "مسجل, مكتمل, ملغي"** |

**Frontend Interface:** `TrainingLog`  
**Frontend Service:** `SharePointService.getTrainingLogs()`  
**Status:** ✅ Status column verified and available

---

## 3. BC_Plan_Review

**Purpose**: Formal review and approval of business continuity plans

| Column Name | Type | Frontend Field | Required | Notes |
|---|---|---|---|---|
| Title | Single line text | (ID) | ✅ | Review record identifier |
| ReviewDate | Date and Time | reviewDate | ✅ | Date of review |
| **ReviewedBy** | **Single line text** | **reviewedBy** | **✅** | **✅ Person conducting review** |
| **ReviewerRole** | **Choice** | **reviewerRole** | **✅** | **✅ Role of reviewer** |
| PlanVersion | Number | (not mapped) | ⬜ | Plan version number |
| OverallStatus | Choice | (not mapped) | ⬜ | Overall review status |
| ApprovedBy | Person or Group | approvedBy | ✅ | Person who approved |
| ApprovalDate | Date and Time | approvalDate | ✅ | Date of approval |
| reviewNotes | Single line text | reviewNotes | ✅ | Review notes |
| ReviewFileName | Single line text | reviewFileName | ✅ | Name of review file |
| ReviewFileUploadDate | Date and Time | reviewFileUploadDate | ✅ | Upload date |
| ReviewRecommendations | Multiple lines text | reviewRecommendations | ✅ | Review recommendations |
| response_scenario1-5 | Multiple lines text | response_scenario1-5 | ✅ | Scenario responses |
| ProceduresFileName | Single line text | proceduresFileName | ✅ | Procedures file name |
| ProceduresFileUploadDate | Date and Time | proceduresFileUploadDate | ✅ | Upload date |
| **Task7_1_Complete** | **Yes/No** | **task7_1_complete** | **✅** | **✅ Task completion flag 1** |
| **Task7_2_Complete** | **Yes/No** | **task7_2_complete** | **✅** | **✅ Task completion flag 2** |
| **Task7_3_Complete** | **Yes/No** | **task7_3_complete** | **✅** | **✅ Task completion flag 3** |
| LastUpdated | Date and Time | lastUpdated | ✅ | Last update date |

**Frontend Interface:** `PlanReview`  
**Frontend Service:** `AdminDataService.getPlanReview()`  
**Status:** ✅ All columns mapped and verified

---

## 4. BC_Mutual_Operation

**Purpose**: Alternative school arrangements during disruptions

| Column Name | Type | Frontend Field | Required | Notes |
|---|---|---|---|---|
| Title | Single line text | transport | ✅ | Transportation method |
| AlternativeAddress | Single line text | address | ✅ | Alternative school address |
| Distance | Number | distance | ✅ | Distance to alternative |
| **ActivationPriority** | **Number** | **activationPriority** | **✅** | **✅ Priority for activation** |
| **ContactPerson** | **Single line text** | **contactPerson** | **✅** | **✅ Contact person name** |
| **ContactPhone** | **Number** | **contactPhone** | **✅** | **✅ Contact phone number** |
| **ContactEmail** | **Person or Group** | **contactEmail** | **✅** | **✅ Contact email** |
| **AgreementStatus** | **Choice** | **agreementStatus** | **✅** | **✅ Status of agreement** |
| **AgreementDate** | **Date and Time** | **agreementDate** | **✅** | **✅ Agreement date** |
| **LastVerified** | **Date and Time** | **lastVerified** | **✅** | **✅ Last verification date** |
| Notes | Single line text | (not mapped) | ⬜ | Additional notes |
| IsActive | Yes/No | (not mapped) | ⬜ | Active/inactive status |
| SourceSchoolName | Lookup | sourceSchool | ✅ | Source school name |
| AlternativeSchoolName | Lookup | school | ✅ | Alternative school name |

**Frontend Interface:** `MutualOperation`  
**Frontend Service:** `AdminDataService.getMutualOperations()`  
**Status:** ✅ All 7 additional fields mapped and verified

---

## 5. BC_Incident_Evaluations

**Purpose**: Evaluate business continuity response to incidents

| Column Name | Type | Frontend Field | Required | Notes |
|---|---|---|---|---|
| Title | Single line text | (not mapped) | ✅ | Evaluation title |
| EvaluationDate | Date and Time | evaluationDate | ✅ | Evaluation date |
| EvaluatedBy | Single line text | evaluatedBy | ✅ | Evaluated by |
| **ResponseEffectiveness** | **Number** | **responseEffectiveness** | **✅** | **✅ Response effectiveness score** |
| **CommunicationEffectiveness** | **Number** | **communicationEffectiveness** | **✅** | **✅ Communication score** |
| **CoordinationEffectiveness** | **Number** | **coordinationEffectiveness** | **✅** | **✅ Coordination score** |
| **TimelinessScore** | **Number** | **timelinessScore** | **✅** | **✅ Timeliness score** |
| OverallScore | Number | overallScore | ✅ | Overall score |
| strengths | Single line text | strengths | ✅ | Strengths identified |
| weaknesses | Single line text | weaknesses | ✅ | Weaknesses identified |
| recommendations | Single line text | recommendations | ✅ | Recommendations |
| **LessonsLearned** | **Single line text** | **lessonsLearned** | **✅** | **✅ Lessons learned** |
| **FollowUpRequired** | **Yes/No** | **followUpRequired** | **✅** | **✅ Follow-up required** |
| **FollowUpDate** | **Date and Time** | **followUpDate** | **✅** | **✅ Follow-up date** |
| **Notes** | **Multiple lines text** | **notes** | **✅** | **✅ Additional notes** |
| Incident_Ref | Lookup | incidentId | ✅ | Incident reference |
| ResponseTimeMinutes | Number | responseTimeMinutes | ✅ | Response time |
| RecoveryTimeHours | Number | recoveryTimeHours | ✅ | Recovery time |
| StudentsReturnedDate | Date and Time | studentsReturnedDate | ✅ | Student return date |
| AlternativeUsed | Single line text | alternativeUsed | ✅ | Alternative used |

**Frontend Interface:** `IncidentEvaluation`  
**Frontend Service:** `AdminDataService.getIncidentEvaluations()`  
**Status:** ✅ All 8 additional fields mapped and verified

---

## 6. BC_Admin_Contacts

**Purpose**: Emergency and administrative contact information

| Column Name | Type | Frontend Field | Required | Notes |
|---|---|---|---|---|
| Title | Single line text | Title | ✅ | Contact name |
| Role | Choice | role | ✅ | Contact role |
| Phone | Number | phone | ✅ | Phone number |
| Email | Single line text | email | ✅ | Email address |
| Organization | Choice | organization | ✅ | Organization |
| Category | Choice | category | ✅ | Contact category |
| ContactScope | Choice | contactScope | ✅ | Contact scope |
| ContactTiming | Choice | contactTiming | ✅ | Contact timing |
| BackupMember | Choice | backupMember | ✅ | Backup member |
| Notes | Single line text | notes | ✅ | Notes |
| **IsActive** | **Yes/No** | **isActive** | **✅** | **✅ Active status** |

**Frontend Interface:** `AdminContact`  
**Frontend Service:** `AdminDataService.getAdminContacts()`  
**Status:** ✅ IsActive field mapped and verified

---

## 7. BC_DR_Checklist

**Purpose**: Disaster recovery checklist items

| Column Name | Type | Frontend Field | Required | Notes |
|---|---|---|---|---|
| Title | Single line text | Title | ✅ | Checklist item |
| Category | Choice | category | ✅ | Category |
| Status | Choice | status | ✅ | Status |
| LastChecked | Date and Time | lastChecked | ✅ | Last checked date |
| CheckedBy | Choice | responsiblePerson | ✅ | Checked by person |
| Notes | Single line text | notes | ✅ | Notes |
| SortOrder | Number | priority | ✅ | Sort/priority order |

**Frontend Interface:** `DRCheckItem`  
**Frontend Service:** `AdminDataService.getDRChecklist()`  
**Status:** ✅ All fields mapped and verified

---

## 🔄 Quick Reference for Required Columns
| Title | Text | ✅ | Drill title |
| SchoolName_Ref | Lookup | ✅ | Reference to SchoolInfo → Title |
| DrillHypothesis | Choice | ✅ | Hypothesis scenario |
| SpecificEvent | Note | ✅ | Specific event description |
| TargetGroup | Choice | ✅ | Target group |
| ExecutionDate | DateTime | ✅ | Execution date |
| AttachmentUrl | Text | ⬜ | Attachment URL |
| PlanStatus | Choice | ⬜ | Plan status (مخطط، منفذ، ملغي) |
| IsAdminPlan | Boolean | ⬜ | Is this an admin plan? (true/false) |
| StartDate | DateTime | ⬜ | Plan start date (for admin plans) |
| EndDate | DateTime | ⬜ | Plan end date (for admin plans) |
| PlanEffectivenessRating | Number | ⬜ | Effectiveness rating (1-5) |
| LessonsLearnedSummary | Note | ⬜ | Lessons learned |
| ImprovementRecommendations | Note | ⬜ | Recommendations |

**⚠️ Important Configuration:**
- `SchoolName_Ref`: Lookup to `SchoolInfo` list → `Title` field
- `IsAdminPlan`: Boolean field to distinguish admin plans from school executions
  - `true` = Admin planned drill
  - `false` or empty = School executed drill

---

### 4. SBC_Incidents_Log
**Purpose**: Incident reporting and tracking

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| Title | Text | ✅ | Incident title |
| SchoolName_Ref | Lookup | ✅ | Reference to SchoolInfo → Title |
| IncidentNumber | Text | ✅ | Incident report number |
| IncidentCategory | Choice | ✅ | Category (أمني، صحي، سلامة، etc.) |
| IncidentDate | DateTime | ✅ | Incident date |
| IncidentDescription | Note | ✅ | Incident description |
| RiskLevel | Choice | ✅ | Risk level (منخفض، متوسط، مرتفع، حرج) |
| AlertModelType | Choice | ✅ | Alert type (داخلي، خارجي، طوارئ) |
| CoordinatedEntities | Choice Multi | ⬜ | Coordinated entities |
| ActivatedAlternative | Choice | ⬜ | Activated alternative |
| RecoveryTimeHours | Number | ⬜ | Recovery time in hours |
| AffectedStudentsCount | Number | ⬜ | Number of affected students |
| EducationContinuityMethod | Choice | ⬜ | Continuity method |
| StudentsReturnedDate | DateTime | ⬜ | Students return date |
| LessonsLearned | Note | ⬜ | Lessons learned |
| AttachmentUrl | Text | ⬜ | Attachment URL |
| CoordinationStatus | Choice | ⬜ | Coordination status |
| Status | Choice | ✅ | Current status (نشط، قيد المعالجة، مغلق) |

**⚠️ Important Configuration:**
- `SchoolName_Ref`: Lookup to `SchoolInfo` list → `Title` field
- `CoordinatedEntities`: Choice field with multiple selections enabled

---

### 5. School_Training_Log
**Purpose**: Training attendance log

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| Title | Text | ✅ | Registration title (auto-generated) |
| Program_Ref | Lookup | ✅ | Reference to Coordination_Programs_Catalog → Title |
| SchoolName_Ref | Lookup | ✅ | Reference to SchoolInfo → Title |
| RegistrationType | Choice | ✅ | Type (طلب تسجيل، توثيق حضور سابق) |
| AttendeesNames | Lookup Multi | ✅ | Reference to BC_Teams_Members → Title (MULTI-SELECT) |
| TrainingDate | DateTime | ✅ | Training date |
| Status | Choice | ⬜ | Status (مسجل، مكتمل، ملغي) |

**⚠️ CRITICAL Configuration:**
- `Program_Ref`: Lookup to `Coordination_Programs_Catalog` list → `Title` field
- `SchoolName_Ref`: Lookup to `SchoolInfo` list → `Title` field
- `AttendeesNames`: **Lookup to `BC_Teams_Members` list → `Title` field**
  - **✅ MUST enable "Allow multiple values"**
  - This is essential for storing multiple attendees

---

### 6. Coordination_Programs_Catalog
**Purpose**: Training programs catalog

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| Title | Text | ✅ | Program name |
| ProviderEntity | Text | ⬜ | Provider entity |
| ActivityType | Choice | ⬜ | Activity type (تدريب، ورشة، ندوة) |
| Link | Hyperlink | ⬜ | Program link |
| Date | DateTime | ⬜ | Program date |
| Duration | Text | ⬜ | Duration |

---

## Common Issues and Solutions

### Issue 1: Attendees showing as [object Object]
**Cause**: `AttendeesNames` field is not configured as Lookup (Multi-select)

**Solution**:
1. Go to School_Training_Log list settings
2. Find `AttendeesNames` column
3. Change type to **Lookup**
4. Set "Get information from" to `BC_Teams_Members`
5. Set "In this column" to `Title`
6. ✅ **Check "Allow multiple values"**

### Issue 2: Cannot save training log
**Cause**: Missing lookup relationships

**Solution**:
Verify all lookup fields are properly configured:
- `Program_Ref` → `Coordination_Programs_Catalog`
- `SchoolName_Ref` → `SchoolInfo`
- `AttendeesNames` → `BC_Teams_Members` (Multi-select)

### Issue 3: Drills not appearing in yearly plan
**Cause**: `IsAdminPlan` field missing or not set correctly

**Solution**:
1. Add `IsAdminPlan` column as Boolean type
2. Admin-created plans should have `IsAdminPlan = true`
3. School-executed drills should have `IsAdminPlan = false` or empty

---

## Testing Checklist

Use `test-sharepoint.ps1` script to verify:

- [ ] All lists exist
- [ ] All required columns exist
- [ ] Lookup fields are properly configured
- [ ] Multi-select lookup fields allow multiple values
- [ ] Can create test items in each list
- [ ] Can retrieve items from each list
- [ ] Lookup relationships work correctly

---

## PowerShell Commands Quick Reference

### Connect to SharePoint
```powershell
Install-Module -Name PnP.PowerShell -Force -Scope CurrentUser
Connect-PnPOnline -Url "https://saudimoe.sharepoint.com/sites/em" -Interactive
```

### Test Lists
```powershell
.\test-sharepoint.ps1
```

### Verify Column
```powershell
$list = Get-PnPList -Identity "School_Training_Log"
$fields = Get-PnPField -List $list
$fields | Where-Object { $_.InternalName -eq "AttendeesNames" } | Select-Object InternalName, TypeAsString, AllowMultipleValues
```

### Check Lookup Configuration
```powershell
$field = Get-PnPField -List "School_Training_Log" -Identity "AttendeesNames"
$field | Select-Object InternalName, TypeAsString, LookupList, LookupField
```

---

## Application Navigation Map

### Dashboard Cards (All Clickable)

**School User Dashboard:**
- 🏫 Team Members Card → `/team`
- 📚 Training Completed → `/training-log`
- ✅ Drills Conducted → `/drills`
- 🚨 Active Incidents → `/incidents`

**Admin Dashboard:**
- 🏢 Total Schools → `/admin`
- 👥 Schools with Teams → `/admin` (progress tab)
- 🎯 Schools with Drills → `/admin` (progress tab)
- 📖 Schools with Training → `/admin` (progress tab)

**Quick Actions:**
- ➕ Add Team Member → `/team`
- 📝 Register Training → `/training-log`
- 🎭 Register Drill → `/drills`
- ⚠️ Report Incident → `/incidents`

**Other Navigable Elements:**
- 📍 School Location → Google Maps (external)
- 📋 BC Plan → `/bcplan`
- 🎓 Training Programs → `/training`

---

## Last Updated
December 17, 2025
