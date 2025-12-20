# SharePoint Lists Column Reference

## Quick Reference for Required Columns

### 1. SchoolInfo
**Purpose**: Store school basic information

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| Title | Text | ✅ | School name |
| SchoolName | Text | ✅ | Official school name |
| SchoolID | Text | ✅ | Unique school identifier |
| Level | Choice | ✅ | School level (ابتدائي، متوسط، ثانوي) |
| SchoolGender | Choice | ✅ | Gender type (بنين، بنات، مختلط) |
| SchoolType | Choice | ✅ | School type |
| EducationType | Choice | ✅ | Education type (حكومي، أهلي) |
| StudyTime | Choice | ✅ | Study time (صباحي، مسائي) |
| BuildingOwnership | Choice | ✅ | Building ownership |
| SectorDescription | Text | ⬜ | Sector description |
| PrincipalName | Text | ✅ | Principal name |
| PrincipalID | Text | ✅ | Principal ID number |
| principalEmail | Text | ✅ | Principal email |
| PrincipalPhone | Text | ✅ | Principal phone |
| SchoolEmail | Text | ✅ | School email |
| Latitude | Text | ⬜ | GPS Latitude |
| Longitude | Text | ⬜ | GPS Longitude |

---

### 2. BC_Teams_Members
**Purpose**: Safety and security team members

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| Title | Text | ✅ | Member name |
| SchoolName_Ref | Lookup | ✅ | Reference to SchoolInfo → Title |
| JobRole | Choice | ✅ | Job role (معلم، وكيل، مشرف، etc.) |
| MembershipType | Choice | ✅ | Membership type (فريق رئيسي، فريق احتياطي) |
| MemberEmail | Text | ⬜ | Member email |

**⚠️ Important Configuration:**
- `SchoolName_Ref`: Lookup to `SchoolInfo` list → `Title` field

---

### 3. SBC_Drills_Log
**Purpose**: Drill exercises log (both school executions and admin plans)

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
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
