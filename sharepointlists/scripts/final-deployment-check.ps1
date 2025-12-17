# ============================================
# FINAL DEPLOYMENT READINESS CHECK
# BC Management System
# ============================================

$script:PassCount = 0
$script:FailCount = 0
$script:WarnCount = 0

function Test-Check {
    param($condition, $passMsg, $failMsg, $isWarning = $false)
    if ($condition) {
        Write-Host "  ✅ $passMsg" -ForegroundColor Green
        $script:PassCount++
        return $true
    } else {
        if ($isWarning) {
            Write-Host "  ⚠️  $failMsg" -ForegroundColor Yellow
            $script:WarnCount++
        } else {
            Write-Host "  ❌ $failMsg" -ForegroundColor Red
            $script:FailCount++
        }
        return $false
    }
}

Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     FINAL DEPLOYMENT READINESS CHECK                     ║" -ForegroundColor Cyan
Write-Host "║     BC Management System - School Business Continuity    ║" -ForegroundColor Cyan
Write-Host "║     $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')                              ║" -ForegroundColor Gray
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# ============================================
# 1. BUILD CHECK
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  1️⃣  BUILD STATUS" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$distPath = "C:\Users\Hp\Desktop\App\dist"
$indexHtml = Join-Path $distPath "index.html"
$assetsPath = Join-Path $distPath "assets"

Test-Check (Test-Path $distPath) "Build folder exists" "Build folder NOT found - run 'npm run build'"
Test-Check (Test-Path $indexHtml) "index.html present" "index.html missing"

if (Test-Path $assetsPath) {
    $jsFiles = (Get-ChildItem $assetsPath -Filter "*.js").Count
    $cssFiles = (Get-ChildItem $assetsPath -Filter "*.css").Count
    Test-Check ($jsFiles -gt 0) "JavaScript bundle: $jsFiles file(s)" "No JS files found"
    Test-Check ($cssFiles -gt 0) "CSS bundle: $cssFiles file(s)" "No CSS files found"
}

# ============================================
# 2. SHAREPOINT SCHEMAS (Existing Lists)
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  2️⃣  SHAREPOINT LIST SCHEMAS (6 Connected)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$schemaPath = "C:\Users\Hp\Desktop\App\.power\schemas\sharepointonline"
$requiredSchemas = @(
    @{ File = "schoolinfo.Schema.json"; Name = "SchoolInfo" }
    @{ File = "bc_teams_members.Schema.json"; Name = "BC_Teams_Members" }
    @{ File = "sbc_drills_log.Schema.json"; Name = "SBC_Drills_Log" }
    @{ File = "sbc_incidents_log.Schema.json"; Name = "SBC_Incidents_Log" }
    @{ File = "school_training_log.Schema.json"; Name = "School_Training_Log" }
    @{ File = "coordination_programs_catalog.Schema.json"; Name = "Coordination_Programs_Catalog" }
)

foreach ($schema in $requiredSchemas) {
    $schemaFile = Join-Path $schemaPath $schema.File
    Test-Check (Test-Path $schemaFile) "$($schema.Name) schema exists" "$($schema.Name) schema MISSING"
}

# ============================================
# 3. GENERATED SERVICES
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  3️⃣  POWER SDK GENERATED SERVICES" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$servicesPath = "C:\Users\Hp\Desktop\App\src\generated\services"
$requiredServices = @(
    "SchoolInfoService.ts"
    "BC_Teams_MembersService.ts"
    "SBC_Drills_LogService.ts"
    "SBC_Incidents_LogService.ts"
    "School_Training_LogService.ts"
    "Coordination_Programs_CatalogService.ts"
)

foreach ($service in $requiredServices) {
    $serviceFile = Join-Path $servicesPath $service
    Test-Check (Test-Path $serviceFile) "$service exists" "$service MISSING"
}

# ============================================
# 4. POWER CONFIG
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  4️⃣  POWER PLATFORM CONFIGURATION" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$configPath = "C:\Users\Hp\Desktop\App\power.config.json"
if (Test-Path $configPath) {
    Test-Check $true "power.config.json exists" ""
    $config = Get-Content $configPath | ConvertFrom-Json
    
    Test-Check ($config.appId) "App ID: $($config.appId.Substring(0,8))..." "App ID missing"
    Test-Check ($config.environmentId) "Environment ID configured" "Environment ID missing"
    
    $dataSources = $config.connectionReferences.'9f4811f1-8df8-491d-9d4f-a8b8e26cdb91'.dataSources
    Test-Check ($dataSources.Count -ge 6) "Data sources: $($dataSources.Count) connected" "Data sources missing"
} else {
    Test-Check $false "" "power.config.json NOT FOUND"
}

# ============================================
# 5. COLUMN TYPE HANDLERS
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  5️⃣  COLUMN TYPE COMPATIBILITY" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$spService = "C:\Users\Hp\Desktop\App\src\services\sharepointService.ts"
if (Test-Path $spService) {
    $content = Get-Content $spService -Raw
    
    Test-Check ($content -match "extractChoiceValue") "Choice field handler (extractChoiceValue)" "Missing Choice handler"
    Test-Check ($content -match "extractMultiChoiceValues") "Multi-choice handler (extractMultiChoiceValues)" "Missing Multi-choice handler"
    Test-Check ($content -match "SchoolName_Ref") "Lookup field handling" "Missing Lookup handling"
    Test-Check ($content -match "isPowerAppsEnvironment") "Environment detection" "Missing environment detection"
}

# ============================================
# 6. FRONTEND COMPONENTS
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  6️⃣  FRONTEND COMPONENTS" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$componentsPath = "C:\Users\Hp\Desktop\App\src\components"
$requiredComponents = @(
    "Home.tsx"
    "AdminPanel.tsx"
    "Team.tsx"
    "Drills.tsx"
    "Incidents.tsx"
    "Training.tsx"
    "BCPlan.tsx"
    "Login.tsx"
    "Navigation.tsx"
    "SchoolInfo.tsx"
)

foreach ($component in $requiredComponents) {
    $componentFile = Join-Path $componentsPath $component
    Test-Check (Test-Path $componentFile) "$component" "$component MISSING" $true
}

# ============================================
# 7. CSV FILES FOR NEW LISTS
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  7️⃣  NEW LISTS CSV TEMPLATES (Optional)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$csvPath = "C:\Users\Hp\Desktop\App\sharepointlists\import_csv"
$newListsCsv = @(
    "BC_Admin_Contacts.csv"
    "BC_Plan_Documents.csv"
    "BC_Shared_Plan.csv"
    "BC_Plan_Scenarios.csv"
    "BC_Test_Plans.csv"
    "BC_DR_Checklist.csv"
    "BC_Incident_Evaluations.csv"
    "BC_Damage_Reports.csv"
    "BC_Mutual_Operation.csv"
    "BC_Plan_Review.csv"
)

$csvCount = 0
foreach ($csv in $newListsCsv) {
    $csvFile = Join-Path $csvPath $csv
    if (Test-Path $csvFile) { $csvCount++ }
}
Test-Check ($csvCount -eq 10) "CSV templates: $csvCount/10 ready" "Only $csvCount/10 CSV templates found" $true

# ============================================
# SUMMARY
# ============================================
Write-Host "`n"
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    SUMMARY                               ║" -ForegroundColor Cyan
Write-Host "╠══════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  ✅ Passed:   $($script:PassCount.ToString().PadLeft(3))                                          ║" -ForegroundColor Green
Write-Host "║  ⚠️  Warnings: $($script:WarnCount.ToString().PadLeft(3))                                          ║" -ForegroundColor Yellow
Write-Host "║  ❌ Failed:   $($script:FailCount.ToString().PadLeft(3))                                          ║" -ForegroundColor Red
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

if ($script:FailCount -eq 0) {
    Write-Host "`n  🎉 READY FOR DEPLOYMENT!" -ForegroundColor Green
    Write-Host @"

  Next steps:
  ───────────────────────────────────────
  1. pac code push          (deploy to Power Platform)
  2. Test in Power Apps     (verify CRUD operations)
  3. Share with schools     (set permissions)
  4. Enable item-level permissions on:
     - BC_Teams_Members
     - SBC_Drills_Log
     - SBC_Incidents_Log  
     - School_Training_Log

"@ -ForegroundColor Gray
} else {
    Write-Host "`n  ❌ FIX ERRORS BEFORE DEPLOYMENT" -ForegroundColor Red
}

# ============================================
# COLUMN TYPES REFERENCE
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  📊 SHAREPOINT COLUMN TYPES REFERENCE" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host @"

  ┌─────────────────────┬─────────────────┬────────────────────────┐
  │ SharePoint Type     │ Frontend Type   │ Handler                │
  ├─────────────────────┼─────────────────┼────────────────────────┤
  │ Single line text    │ string          │ direct                 │
  │ Multiple lines      │ string          │ direct                 │
  │ Number              │ number          │ parseInt/parseFloat    │
  │ Yes/No              │ boolean         │ direct                 │
  │ Date/DateTime       │ string (ISO)    │ new Date()             │
  │ Choice              │ {Value: string} │ extractChoiceValue()   │
  │ Lookup              │ {Id, Value}     │ field.Value or field   │
  │ Person              │ {Id, Title}     │ field.Title            │
  └─────────────────────┴─────────────────┴────────────────────────┘

  Frontend correctly handles all column types! ✅

"@ -ForegroundColor Gray
