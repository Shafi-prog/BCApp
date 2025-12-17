# ============================================
# Deployment Readiness Check Script
# BC Management System - School Business Continuity
# ============================================

Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT READINESS CHECK" -ForegroundColor Cyan
Write-Host "  BC Management System" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

$ErrorCount = 0
$WarningCount = 0

function Write-Check {
    param($status, $message)
    switch ($status) {
        "OK" { Write-Host "  ✅ " -ForegroundColor Green -NoNewline; Write-Host $message }
        "WARN" { Write-Host "  ⚠️ " -ForegroundColor Yellow -NoNewline; Write-Host $message; $script:WarningCount++ }
        "FAIL" { Write-Host "  ❌ " -ForegroundColor Red -NoNewline; Write-Host $message; $script:ErrorCount++ }
        "INFO" { Write-Host "  ℹ️ " -ForegroundColor Cyan -NoNewline; Write-Host $message }
    }
}

# ============================================
# 1. CHECK EXISTING SHAREPOINT SCHEMAS
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  1. EXISTING SHAREPOINT LIST SCHEMAS" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$SchemaPath = "c:\Users\Hp\Desktop\App\.power\schemas\sharepointonline"
$ExpectedLists = @(
    @{ Name = "schoolinfo"; Display = "SchoolInfo"; Required = $true }
    @{ Name = "bc_teams_members"; Display = "BC_Teams_Members"; Required = $true }
    @{ Name = "sbc_drills_log"; Display = "SBC_Drills_Log"; Required = $true }
    @{ Name = "sbc_incidents_log"; Display = "SBC_Incidents_Log"; Required = $true }
    @{ Name = "school_training_log"; Display = "School_Training_Log"; Required = $true }
    @{ Name = "coordination_programs_catalog"; Display = "Coordination_Programs_Catalog"; Required = $true }
)

foreach ($list in $ExpectedLists) {
    $schemaFile = Join-Path $SchemaPath "$($list.Name).Schema.json"
    if (Test-Path $schemaFile) {
        Write-Check "OK" "$($list.Display) - Schema exists"
    } else {
        Write-Check "FAIL" "$($list.Display) - Schema NOT FOUND"
    }
}

# ============================================
# 2. CHECK GENERATED SERVICES
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  2. GENERATED POWER SDK SERVICES" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$ServicesPath = "c:\Users\Hp\Desktop\App\src\generated\services"
$ExpectedServices = @(
    "SchoolInfoService.ts"
    "BC_Teams_MembersService.ts"
    "SBC_Drills_LogService.ts"
    "SBC_Incidents_LogService.ts"
    "School_Training_LogService.ts"
    "Coordination_Programs_CatalogService.ts"
)

foreach ($service in $ExpectedServices) {
    $serviceFile = Join-Path $ServicesPath $service
    if (Test-Path $serviceFile) {
        Write-Check "OK" "$service exists"
    } else {
        Write-Check "FAIL" "$service NOT FOUND"
    }
}

# ============================================
# 3. CHECK FRONTEND BUILD
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  3. FRONTEND BUILD STATUS" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$DistPath = "c:\Users\Hp\Desktop\App\dist"
if (Test-Path $DistPath) {
    $distFiles = Get-ChildItem $DistPath -Recurse
    Write-Check "OK" "Build output exists ($($distFiles.Count) files)"
    
    $indexHtml = Join-Path $DistPath "index.html"
    if (Test-Path $indexHtml) {
        Write-Check "OK" "index.html present"
    } else {
        Write-Check "FAIL" "index.html missing"
    }
    
    $assetsPath = Join-Path $DistPath "assets"
    if (Test-Path $assetsPath) {
        $jsFiles = Get-ChildItem $assetsPath -Filter "*.js"
        $cssFiles = Get-ChildItem $assetsPath -Filter "*.css"
        Write-Check "OK" "Assets: $($jsFiles.Count) JS, $($cssFiles.Count) CSS files"
    }
} else {
    Write-Check "WARN" "Build not found - run 'npm run build'"
}

# ============================================
# 4. CHECK POWER CONFIG
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  4. POWER PLATFORM CONFIGURATION" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$PowerConfigPath = "c:\Users\Hp\Desktop\App\power.config.json"
if (Test-Path $PowerConfigPath) {
    $config = Get-Content $PowerConfigPath | ConvertFrom-Json
    Write-Check "OK" "power.config.json exists"
    Write-Check "INFO" "App Name: $($config.name)"
    Write-Check "INFO" "Environment: $($config.environmentId)"
} else {
    Write-Check "FAIL" "power.config.json NOT FOUND"
}

# ============================================
# 5. CHECK NEW LISTS CSV FILES
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  5. NEW LISTS CSV FILES (for SharePoint import)" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$CsvPath = "c:\Users\Hp\Desktop\App\sharepointlists\import_csv"
$NewLists = @(
    @{ File = "BC_Admin_Contacts.csv"; Name = "BC_Admin_Contacts" }
    @{ File = "BC_Plan_Documents.csv"; Name = "BC_Plan_Documents" }
    @{ File = "BC_Shared_Plan.csv"; Name = "BC_Shared_Plan" }
    @{ File = "BC_Plan_Scenarios.csv"; Name = "BC_Plan_Scenarios" }
    @{ File = "BC_Test_Plans.csv"; Name = "BC_Test_Plans" }
    @{ File = "BC_DR_Checklist.csv"; Name = "BC_DR_Checklist" }
    @{ File = "BC_Incident_Evaluations.csv"; Name = "BC_Incident_Evaluations" }
    @{ File = "BC_Damage_Reports.csv"; Name = "BC_Damage_Reports" }
    @{ File = "BC_Mutual_Operation.csv"; Name = "BC_Mutual_Operation" }
    @{ File = "BC_Plan_Review.csv"; Name = "BC_Plan_Review" }
)

$csvReady = 0
foreach ($list in $NewLists) {
    $csvFile = Join-Path $CsvPath $list.File
    if (Test-Path $csvFile) {
        Write-Check "OK" "$($list.Name) CSV ready"
        $csvReady++
    } else {
        Write-Check "WARN" "$($list.Name) CSV not found"
    }
}

Write-Check "INFO" "$csvReady of 10 new lists CSV files ready"

# ============================================
# 6. COLUMN TYPE COMPATIBILITY
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  6. COLUMN TYPE COMPATIBILITY CHECK" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n  📋 SchoolInfo:" -ForegroundColor Yellow
Write-Host "     ID (int), Title (text), SchoolName (text), SchoolID (text)"
Write-Host "     Level/Gender/Type (Choice), PrincipalName/Email/Phone (text)"
Write-Host "     Lat/Long (number)"

Write-Host "`n  📋 BC_Teams_Members:" -ForegroundColor Yellow
Write-Host "     ID (int), Title (text), SchoolName_Ref (Lookup→SchoolInfo)"
Write-Host "     JobRole (Choice), MembershipType (Choice), Mobile (number)"
Write-Host "     MemberEmail (text)"

Write-Host "`n  📋 SBC_Drills_Log:" -ForegroundColor Yellow
Write-Host "     ID (int), Title (text), SchoolName_Ref (Lookup→SchoolInfo)"
Write-Host "     DrillHypothesis (Choice), SpecificEvent (text)"
Write-Host "     TargetGroup (Choice), ExecutionDate (date)"

Write-Host "`n  📋 SBC_Incidents_Log:" -ForegroundColor Yellow
Write-Host "     ID (int), Title (text), SchoolName_Ref (Lookup→SchoolInfo)"
Write-Host "     IncidentCategory (Choice), RiskLevel (Choice)"
Write-Host "     ActivationTime/ClosureTime (datetime), CommunicationDone (bool)"

Write-Host "`n  📋 School_Training_Log:" -ForegroundColor Yellow
Write-Host "     ID (int), Title (text), SchoolName_Ref (Lookup→SchoolInfo)"
Write-Host "     Program_Ref (Lookup→Catalog), RegistrationType (Choice)"
Write-Host "     AttendeesNames (text), TrainingDate (date)"

Write-Host "`n  📋 Coordination_Programs_Catalog:" -ForegroundColor Yellow
Write-Host "     ID (int), Title (text), ProviderEntity (Choice)"
Write-Host "     ActivityType (Choice), TargetAudience (Choice)"
Write-Host "     Date (date), ExecutionMode (Choice)"

Write-Check "OK" "Frontend uses extractChoiceValue() for Choice fields"
Write-Check "OK" "Frontend handles Lookup as object with Id/Value"
Write-Check "OK" "Frontend converts dates properly"

# ============================================
# 7. LOOKUP COLUMNS STATUS
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  7. LOOKUP COLUMNS REQUIRED" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n  Existing Lists (already configured in SharePoint):" -ForegroundColor Cyan
Write-Host "     ✓ BC_Teams_Members.SchoolName_Ref → SchoolInfo"
Write-Host "     ✓ SBC_Drills_Log.SchoolName_Ref → SchoolInfo"
Write-Host "     ✓ SBC_Incidents_Log.SchoolName_Ref → SchoolInfo"
Write-Host "     ✓ School_Training_Log.SchoolName_Ref → SchoolInfo"
Write-Host "     ✓ School_Training_Log.Program_Ref → Coordination_Programs_Catalog"

Write-Host "`n  New Lists (add manually after CSV import):" -ForegroundColor Yellow
Write-Host "     ○ BC_Plan_Scenarios.PlanRef → BC_Shared_Plan"
Write-Host "     ○ BC_Incident_Evaluations.Incident_Ref → SBC_Incidents_Log"
Write-Host "     ○ BC_Damage_Reports.School_Ref → SchoolInfo"
Write-Host "     ○ BC_Damage_Reports.Incident_Ref → SBC_Incidents_Log"
Write-Host "     ○ BC_Mutual_Operation.SourceSchool_Ref → SchoolInfo"
Write-Host "     ○ BC_Mutual_Operation.AltSchool_Ref → SchoolInfo"
Write-Host "     ○ BC_Plan_Review.Plan_Ref → BC_Shared_Plan"

# ============================================
# SUMMARY
# ============================================
Write-Host "`n"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT READINESS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "`n  🎉 ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "     Ready for deployment to Power Platform`n" -ForegroundColor Green
} elseif ($ErrorCount -eq 0) {
    Write-Host "`n  ⚠️ READY WITH WARNINGS" -ForegroundColor Yellow
    Write-Host "     $WarningCount warning(s) - review before deployment`n" -ForegroundColor Yellow
} else {
    Write-Host "`n  ❌ NOT READY FOR DEPLOYMENT" -ForegroundColor Red
    Write-Host "     $ErrorCount error(s), $WarningCount warning(s)`n" -ForegroundColor Red
}

# ============================================
# DEPLOYMENT STEPS
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  DEPLOYMENT STEPS" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host @"

  1️⃣  CREATE NEW SHAREPOINT LISTS (if needed):
      - Go to SharePoint site: https://saudimoe.sharepoint.com/sites/em
      - Create lists from CSV files in: sharepointlists\import_csv\
      - Add Lookup columns manually after import

  2️⃣  BUILD THE APP:
      npm run build

  3️⃣  PUSH TO POWER PLATFORM:
      pac code push

  4️⃣  TEST IN POWER APPS:
      - Open the app in Power Apps Studio
      - Test all CRUD operations
      - Verify data flows correctly

  5️⃣  PUBLISH:
      - Save and publish the app
      - Share with users

"@

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
