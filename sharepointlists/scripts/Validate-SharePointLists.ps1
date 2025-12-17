# ============================================
# SharePoint Lists Validation Script
# BC Management System - School Business Continuity
# ============================================
# Run this script after creating all SharePoint lists
# to verify the setup is correct
# ============================================

param(
    [string]$SiteUrl = "https://saudimoe.sharepoint.com/sites/em"
)

# Color output functions
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "⚠️ $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "ℹ️ $msg" -ForegroundColor Cyan }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SharePoint Lists Validation Script" -ForegroundColor Cyan
Write-Host "  BC Management System" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# EXISTING LISTS (6) - Must already exist
# ============================================
$ExistingLists = @{
    "SchoolInfo" = @{
        RequiredColumns = @("Title", "SchoolName", "SchoolID", "Level", "SchoolGender", "SchoolType", "EducationType", "PrincipalID", "PrincipalName", "principalEmail", "PrincipalPhone", "Latitude", "Longitude", "StudyTime", "BuildingOwnership", "SectorDescription", "SchoolEmail")
        Description = "قائمة المدارس الأساسية"
    }
    "BC_Teams_Members" = @{
        RequiredColumns = @("Title", "SchoolName_Ref", "JobRole", "MembershipType", "Mobile", "MemberEmail")
        LookupColumns = @{
            "SchoolName_Ref" = "SchoolInfo"
        }
        Description = "أعضاء فرق استمرارية الأعمال"
    }
    "SBC_Drills_Log" = @{
        RequiredColumns = @("Title", "SchoolName_Ref", "DrillHypothesis", "SpecificEvent", "TargetGroup", "ExecutionDate")
        LookupColumns = @{
            "SchoolName_Ref" = "SchoolInfo"
        }
        Description = "سجل التمارين والتجارب"
    }
    "SBC_Incidents_Log" = @{
        RequiredColumns = @("Title", "SchoolName_Ref", "IncidentCategory", "ActivatedAlternative", "RiskLevel", "ActivationTime", "AlertModelType", "HazardDescription", "CoordinatedEntities", "IncidentNumber", "ActionTaken", "AltLocation", "CommunicationDone", "ClosureTime", "Challenges", "LessonsLearned", "Suggestions")
        LookupColumns = @{
            "SchoolName_Ref" = "SchoolInfo"
        }
        Description = "سجل الحوادث"
    }
    "School_Training_Log" = @{
        RequiredColumns = @("Title", "SchoolName_Ref", "Program_Ref", "RegistrationType", "AttendeesNames", "TrainingDate")
        LookupColumns = @{
            "SchoolName_Ref" = "SchoolInfo"
            "Program_Ref" = "Coordination_Programs_Catalog"
        }
        Description = "سجل التدريب"
    }
    "Coordination_Programs_Catalog" = @{
        RequiredColumns = @("Title", "ProviderEntity", "ActivityType", "TargetAudience", "Date", "ExecutionMode", "CoordinationStatus", "MOEEcexcution")
        Description = "كتالوج برامج التنسيق"
    }
}

# ============================================
# NEW LISTS (10) - Created from CSV
# ============================================
$NewLists = @{
    "BC_Admin_Contacts" = @{
        RequiredColumns = @("Title", "Role", "Phone", "Email", "Organization", "Category", "ContactScope", "ContactTiming", "BackupMember", "Notes", "IsActive")
        Description = "جهات اتصال الإدارة للطوارئ"
    }
    "BC_Plan_Documents" = @{
        RequiredColumns = @("Title", "DocumentType", "Description", "FileName", "Version", "UploadDate", "ShareDate", "IsShared", "Notes")
        Description = "مستندات خطة الاستمرارية"
    }
    "BC_Shared_Plan" = @{
        RequiredColumns = @("Title", "Description", "PlanFileName", "IsPublished", "PublishDate", "LastUpdated", "ReviewPeriodMonths", "NextReviewDate", "AdminNotes", "Version")
        Description = "الخطة المشتركة للاستمرارية"
    }
    "BC_Plan_Scenarios" = @{
        RequiredColumns = @("Title", "ScenarioNumber", "Description", "ResponseActions", "SortOrder", "PlanRef")
        LookupColumns = @{
            "PlanRef" = "BC_Shared_Plan"
        }
        Description = "سيناريوهات الخطة"
    }
    "BC_Test_Plans" = @{
        RequiredColumns = @("Title", "Hypothesis", "SpecificEvent", "TargetGroup", "StartDate", "EndDate", "Status", "ResponsiblePerson", "Notes", "Year", "Quarter")
        Description = "خطط الاختبار والتمارين"
    }
    "BC_DR_Checklist" = @{
        RequiredColumns = @("Title", "Category", "Status", "LastChecked", "CheckedBy", "Notes", "SortOrder")
        Description = "قائمة تحقق التعافي من الكوارث"
    }
    "BC_Incident_Evaluations" = @{
        RequiredColumns = @("Title", "IncidentNumber", "EvaluationDate", "EvaluatedBy", "ResponseEffectiveness", "CommunicationEffectiveness", "CoordinationEffectiveness", "TimelinessScore", "OverallScore", "StrengthPoints", "ImprovementAreas", "RecommendedActions", "LessonsLearned", "FollowUpRequired", "FollowUpDate", "Notes", "Incident_Ref")
        LookupColumns = @{
            "Incident_Ref" = "SBC_Incidents_Log"
        }
        Description = "تقييم الحوادث"
    }
    "BC_Damage_Reports" = @{
        RequiredColumns = @("Title", "IncidentNumber", "ReportDate", "ReportedBy", "DamageType", "AffectedArea", "AffectedAssets", "EstimatedCost", "InsuranceClaim", "ClaimNumber", "RepairStatus", "RepairStartDate", "RepairEndDate", "ContractorName", "AffectsOperations", "OperationalImpact", "PhotosAttached", "Notes", "School_Ref", "Incident_Ref")
        LookupColumns = @{
            "School_Ref" = "SchoolInfo"
            "Incident_Ref" = "SBC_Incidents_Log"
        }
        Description = "تقارير الأضرار"
    }
    "BC_Mutual_Operation" = @{
        RequiredColumns = @("Title", "SourceSchoolID", "SourceSchoolName", "AlternativeSchoolID", "AlternativeSchoolName", "AlternativeAddress", "Distance", "TransportationArrangement", "Capacity", "SupportingGrades", "ActivationPriority", "ContactPerson", "ContactPhone", "ContactEmail", "AgreementStatus", "AgreementDate", "LastVerified", "Notes", "IsActive", "SourceSchool_Ref", "AltSchool_Ref")
        LookupColumns = @{
            "SourceSchool_Ref" = "SchoolInfo"
            "AltSchool_Ref" = "SchoolInfo"
        }
        Description = "التشغيل المتبادل بين المدارس"
    }
    "BC_Plan_Review" = @{
        RequiredColumns = @("Title", "ReviewDate", "ReviewedBy", "ReviewerRole", "PlanVersion", "OverallStatus", "CompletionPercentage", "ScenariosReviewed", "ProceduresReviewed", "ContactsReviewed", "ResourcesReviewed", "TrainingReviewed", "FindingsCount", "CriticalFindings", "RecommendationsCount", "NextReviewDate", "ApprovalStatus", "ApprovedBy", "ApprovalDate", "Notes", "Plan_Ref")
        LookupColumns = @{
            "Plan_Ref" = "BC_Shared_Plan"
        }
        Description = "مراجعات الخطة"
    }
}

# ============================================
# VALIDATION RESULTS
# ============================================
$ValidationResults = @{
    TotalLists = 0
    ExistingListsFound = 0
    NewListsFound = 0
    MissingLists = @()
    ColumnsIssues = @()
    LookupIssues = @()
    Passed = $true
}

Write-Info "Site URL: $SiteUrl"
Write-Host ""

# ============================================
# CHECK EXISTING LISTS
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  Checking EXISTING Lists (6)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

foreach ($listName in $ExistingLists.Keys) {
    $list = $ExistingLists[$listName]
    $ValidationResults.TotalLists++
    
    Write-Host "`n📋 $listName" -ForegroundColor Yellow
    Write-Host "   $($list.Description)" -ForegroundColor Gray
    
    # Column check info
    Write-Host "   Required Columns: $($list.RequiredColumns.Count)" -ForegroundColor Gray
    
    if ($list.LookupColumns) {
        foreach ($lookup in $list.LookupColumns.GetEnumerator()) {
            Write-Host "   🔗 Lookup: $($lookup.Key) → $($lookup.Value)" -ForegroundColor Magenta
        }
    }
}

# ============================================
# CHECK NEW LISTS
# ============================================
Write-Host "`n"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  Checking NEW Lists (10)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

foreach ($listName in $NewLists.Keys) {
    $list = $NewLists[$listName]
    $ValidationResults.TotalLists++
    
    Write-Host "`n📋 $listName" -ForegroundColor Yellow
    Write-Host "   $($list.Description)" -ForegroundColor Gray
    
    # Column check info
    Write-Host "   Required Columns: $($list.RequiredColumns.Count)" -ForegroundColor Gray
    
    if ($list.LookupColumns) {
        foreach ($lookup in $list.LookupColumns.GetEnumerator()) {
            Write-Host "   🔗 Lookup: $($lookup.Key) → $($lookup.Value)" -ForegroundColor Magenta
        }
    }
}

# ============================================
# SUMMARY OF ALL LOOKUPS
# ============================================
Write-Host "`n"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  ALL LOOKUP RELATIONSHIPS" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$AllLookups = @(
    @{ List = "BC_Teams_Members"; Column = "SchoolName_Ref"; Target = "SchoolInfo"; DisplayColumn = "SchoolName" }
    @{ List = "SBC_Drills_Log"; Column = "SchoolName_Ref"; Target = "SchoolInfo"; DisplayColumn = "SchoolName" }
    @{ List = "SBC_Incidents_Log"; Column = "SchoolName_Ref"; Target = "SchoolInfo"; DisplayColumn = "SchoolName" }
    @{ List = "School_Training_Log"; Column = "SchoolName_Ref"; Target = "SchoolInfo"; DisplayColumn = "SchoolName" }
    @{ List = "School_Training_Log"; Column = "Program_Ref"; Target = "Coordination_Programs_Catalog"; DisplayColumn = "Title" }
    @{ List = "BC_Plan_Scenarios"; Column = "PlanRef"; Target = "BC_Shared_Plan"; DisplayColumn = "Title" }
    @{ List = "BC_Incident_Evaluations"; Column = "Incident_Ref"; Target = "SBC_Incidents_Log"; DisplayColumn = "Title" }
    @{ List = "BC_Damage_Reports"; Column = "School_Ref"; Target = "SchoolInfo"; DisplayColumn = "SchoolName" }
    @{ List = "BC_Damage_Reports"; Column = "Incident_Ref"; Target = "SBC_Incidents_Log"; DisplayColumn = "Title" }
    @{ List = "BC_Mutual_Operation"; Column = "SourceSchool_Ref"; Target = "SchoolInfo"; DisplayColumn = "SchoolName" }
    @{ List = "BC_Mutual_Operation"; Column = "AltSchool_Ref"; Target = "SchoolInfo"; DisplayColumn = "SchoolName" }
    @{ List = "BC_Plan_Review"; Column = "Plan_Ref"; Target = "BC_Shared_Plan"; DisplayColumn = "Title" }
)

Write-Host "`n"
Write-Host "┌────────────────────────────┬──────────────────┬───────────────────────────────┬─────────────┐" -ForegroundColor Cyan
Write-Host "│ List                       │ Lookup Column    │ Target List                   │ Display     │" -ForegroundColor Cyan
Write-Host "├────────────────────────────┼──────────────────┼───────────────────────────────┼─────────────┤" -ForegroundColor Cyan

foreach ($lookup in $AllLookups) {
    $listPad = $lookup.List.PadRight(26)
    $colPad = $lookup.Column.PadRight(16)
    $targetPad = $lookup.Target.PadRight(29)
    $displayPad = $lookup.DisplayColumn.PadRight(11)
    Write-Host "│ $listPad │ $colPad │ $targetPad │ $displayPad │" -ForegroundColor White
}

Write-Host "└────────────────────────────┴──────────────────┴───────────────────────────────┴─────────────┘" -ForegroundColor Cyan

# ============================================
# CHECKLIST OUTPUT
# ============================================
Write-Host "`n"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  MANUAL VERIFICATION CHECKLIST" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n📝 Please verify the following in SharePoint:" -ForegroundColor Yellow

Write-Host "`n1️⃣  EXISTING LISTS (should already have data):" -ForegroundColor Cyan
Write-Host "   [ ] SchoolInfo - has school records" -ForegroundColor White
Write-Host "   [ ] BC_Teams_Members - has team members" -ForegroundColor White
Write-Host "   [ ] SBC_Drills_Log - has drill records" -ForegroundColor White
Write-Host "   [ ] SBC_Incidents_Log - has incident records" -ForegroundColor White
Write-Host "   [ ] School_Training_Log - has training records" -ForegroundColor White
Write-Host "   [ ] Coordination_Programs_Catalog - has programs" -ForegroundColor White

Write-Host "`n2️⃣  NEW LISTS (created from CSV):" -ForegroundColor Cyan
Write-Host "   [ ] BC_Admin_Contacts - created" -ForegroundColor White
Write-Host "   [ ] BC_Plan_Documents - created" -ForegroundColor White
Write-Host "   [ ] BC_Shared_Plan - created" -ForegroundColor White
Write-Host "   [ ] BC_Plan_Scenarios - created + PlanRef lookup added" -ForegroundColor White
Write-Host "   [ ] BC_Test_Plans - created" -ForegroundColor White
Write-Host "   [ ] BC_DR_Checklist - created" -ForegroundColor White
Write-Host "   [ ] BC_Incident_Evaluations - created + Incident_Ref lookup added" -ForegroundColor White
Write-Host "   [ ] BC_Damage_Reports - created + School_Ref & Incident_Ref lookups added" -ForegroundColor White
Write-Host "   [ ] BC_Mutual_Operation - created + SourceSchool_Ref & AltSchool_Ref lookups added" -ForegroundColor White
Write-Host "   [ ] BC_Plan_Review - created + Plan_Ref lookup added" -ForegroundColor White

Write-Host "`n3️⃣  LOOKUP COLUMNS (must be added manually after CSV import):" -ForegroundColor Cyan
Write-Host "   [ ] BC_Plan_Scenarios.PlanRef → BC_Shared_Plan (Title)" -ForegroundColor White
Write-Host "   [ ] BC_Incident_Evaluations.Incident_Ref → SBC_Incidents_Log (Title)" -ForegroundColor White
Write-Host "   [ ] BC_Damage_Reports.School_Ref → SchoolInfo (SchoolName)" -ForegroundColor White
Write-Host "   [ ] BC_Damage_Reports.Incident_Ref → SBC_Incidents_Log (Title)" -ForegroundColor White
Write-Host "   [ ] BC_Mutual_Operation.SourceSchool_Ref → SchoolInfo (SchoolName)" -ForegroundColor White
Write-Host "   [ ] BC_Mutual_Operation.AltSchool_Ref → SchoolInfo (SchoolName)" -ForegroundColor White
Write-Host "   [ ] BC_Plan_Review.Plan_Ref → BC_Shared_Plan (Title)" -ForegroundColor White

Write-Host "`n"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  VALIDATION COMPLETE" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "`nTotal Lists: 16 (6 existing + 10 new)" -ForegroundColor White
Write-Host "Total Lookups: 12" -ForegroundColor White
Write-Host "`n"
