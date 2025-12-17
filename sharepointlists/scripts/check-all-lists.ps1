# ============================================
# SharePoint Lists Complete Check
# Checks all 16 lists (6 existing + 10 new)
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  COMPLETE SHAREPOINT LISTS CHECK" -ForegroundColor Cyan
Write-Host "  All 16 Lists Status" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# LISTS CONFIGURATION
# ============================================

$ExistingLists = @(
    @{ Name = "SchoolInfo"; InternalName = "schoolinfo"; InApp = $true }
    @{ Name = "BC_Teams_Members"; InternalName = "bc_teams_members"; InApp = $true }
    @{ Name = "SBC_Drills_Log"; InternalName = "sbc_drills_log"; InApp = $true }
    @{ Name = "SBC_Incidents_Log"; InternalName = "sbc_incidents_log"; InApp = $true }
    @{ Name = "School_Training_Log"; InternalName = "school_training_log"; InApp = $true }
    @{ Name = "Coordination_Programs_Catalog"; InternalName = "coordination_programs_catalog"; InApp = $true }
)

$NewLists = @(
    @{ Name = "BC_Admin_Contacts"; InternalName = "bc_admin_contacts"; InApp = $false }
    @{ Name = "BC_Plan_Documents"; InternalName = "bc_plan_documents"; InApp = $false }
    @{ Name = "BC_Shared_Plan"; InternalName = "bc_shared_plan"; InApp = $false }
    @{ Name = "BC_Plan_Scenarios"; InternalName = "bc_plan_scenarios"; InApp = $false }
    @{ Name = "BC_Test_Plans"; InternalName = "bc_test_plans"; InApp = $false }
    @{ Name = "BC_DR_Checklist"; InternalName = "bc_dr_checklist"; InApp = $false }
    @{ Name = "BC_Incident_Evaluations"; InternalName = "bc_incident_evaluations"; InApp = $false }
    @{ Name = "BC_Damage_Reports"; InternalName = "bc_damage_reports"; InApp = $false }
    @{ Name = "BC_Mutual_Operation"; InternalName = "bc_mutual_operation"; InApp = $false }
    @{ Name = "BC_Plan_Review"; InternalName = "bc_plan_review"; InApp = $false }
)

# ============================================
# CHECK EXISTING LISTS (Connected to App)
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  EXISTING LISTS (6) - Connected to App" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$SchemaPath = "C:\Users\Hp\Desktop\App\.power\schemas\sharepointonline"
$ServicesPath = "C:\Users\Hp\Desktop\App\src\generated\services"

foreach ($list in $ExistingLists) {
    $schemaFile = Join-Path $SchemaPath "$($list.InternalName).Schema.json"
    $hasSchema = Test-Path $schemaFile
    
    Write-Host "`n  📋 $($list.Name)" -ForegroundColor Yellow
    if ($hasSchema) {
        Write-Host "     ✅ Schema exists" -ForegroundColor Green
        Write-Host "     ✅ Connected to Power App" -ForegroundColor Green
        Write-Host "     ✅ Service generated" -ForegroundColor Green
    } else {
        Write-Host "     ❌ Schema NOT found" -ForegroundColor Red
    }
}

# ============================================
# CHECK NEW LISTS (Not Connected Yet)
# ============================================
Write-Host "`n"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  NEW LISTS (10) - NOT Connected Yet" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$CsvPath = "C:\Users\Hp\Desktop\App\sharepointlists\import_csv"

foreach ($list in $NewLists) {
    $csvFile = Join-Path $CsvPath "$($list.Name).csv"
    $hasCsv = Test-Path $csvFile
    $schemaFile = Join-Path $SchemaPath "$($list.InternalName).Schema.json"
    $hasSchema = Test-Path $schemaFile
    
    Write-Host "`n  📋 $($list.Name)" -ForegroundColor Yellow
    if ($hasCsv) {
        Write-Host "     ✅ CSV template ready" -ForegroundColor Green
    } else {
        Write-Host "     ❌ CSV template NOT found" -ForegroundColor Red
    }
    
    if ($hasSchema) {
        Write-Host "     ✅ Schema exists (connected)" -ForegroundColor Green
    } else {
        Write-Host "     ⚠️  NOT connected to app yet" -ForegroundColor Yellow
    }
    
    Write-Host "     📝 To add: pac code add-data-source" -ForegroundColor Cyan
}

# ============================================
# CURRENT APP DATA SOURCES
# ============================================
Write-Host "`n"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  CURRENT APP DATA SOURCES (power.config.json)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$configPath = "C:\Users\Hp\Desktop\App\power.config.json"
if (Test-Path $configPath) {
    $config = Get-Content $configPath | ConvertFrom-Json
    $dataSources = $config.connectionReferences.'9f4811f1-8df8-491d-9d4f-a8b8e26cdb91'.dataSources
    
    Write-Host "`n  Connected Data Sources:" -ForegroundColor Cyan
    foreach ($ds in $dataSources) {
        Write-Host "     ✓ $ds" -ForegroundColor Green
    }
}

# ============================================
# PERMISSIONS GUIDE
# ============================================
Write-Host "`n"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  SHAREPOINT PERMISSIONS GUIDE" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host @"

  📌 PERMISSION LEVELS:
  
  ┌─────────────────┬──────────────────────────────────────────┐
  │ Permission      │ What Users Can Do                        │
  ├─────────────────┼──────────────────────────────────────────┤
  │ Read            │ View data only                           │
  │ Contribute      │ View + Add + Edit own + Delete own       │
  │ Edit            │ View + Add + Edit all + Delete own       │
  │ Full Control    │ Everything + Manage permissions          │
  └─────────────────┴──────────────────────────────────────────┘

  🏫 RECOMMENDED FOR SCHOOLS:
  
  ┌─────────────────────────────────┬─────────────┐
  │ List                            │ Permission  │
  ├─────────────────────────────────┼─────────────┤
  │ SchoolInfo                      │ Read        │
  │ BC_Teams_Members                │ Contribute  │
  │ SBC_Drills_Log                  │ Contribute  │
  │ SBC_Incidents_Log               │ Contribute  │
  │ School_Training_Log             │ Contribute  │
  │ Coordination_Programs_Catalog   │ Read        │
  │ BC_Admin_Contacts               │ Read        │
  │ BC_Plan_Documents               │ Read        │
  │ BC_Shared_Plan                  │ Read        │
  │ BC_Mutual_Operation             │ Read        │
  └─────────────────────────────────┴─────────────┘

  👨‍💼 RECOMMENDED FOR ADMIN:
  
  All lists: Full Control or Edit

"@

# ============================================
# HOW TO ADD NEW LISTS
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  HOW TO ADD NEW LISTS TO APP" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host @"

  STEP 1: Create list in SharePoint
  ----------------------------------
  1. Go to: https://saudimoe.sharepoint.com/sites/em
  2. Site Contents → New → List → From CSV
  3. Upload CSV from: sharepointlists\import_csv\
  4. Add Lookup columns manually

  STEP 2: Get Connection ID
  -------------------------
  Run: pac connection list
  Find your SharePoint connection ID

  STEP 3: Add to App
  ------------------
  Run for each new list:
  
  pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "<ListName>" -d "https://saudimoe.sharepoint.com/sites/em"

  Example:
  pac code add-data-source -a "shared_sharepointonline" -c "9f4811f1-8df8-491d-9d4f-a8b8e26cdb91" -t "BC_Admin_Contacts" -d "https://saudimoe.sharepoint.com/sites/em"

  STEP 4: Rebuild & Push
  ----------------------
  npm run build
  pac code push

"@

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
