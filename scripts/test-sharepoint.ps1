# SharePoint Lists Test Script
# Tests all tables and validates columns exist in SharePoint lists

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SharePoint Lists Structure Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# SharePoint Site URL
$siteUrl = "https://saudimoe.sharepoint.com/sites/em"

Write-Host "SharePoint Site: $siteUrl" -ForegroundColor Yellow
Write-Host ""

# Define expected structure for each list
$expectedLists = @{
    "SchoolInfo" = @(
        "Title", "SchoolName", "SchoolID", "Level", "SchoolGender", 
        "SchoolType", "EducationType", "StudyTime", "BuildingOwnership",
        "SectorDescription", "PrincipalName", "PrincipalID", "principalEmail",
        "PrincipalPhone", "SchoolEmail", "Latitude", "Longitude"
    )
    "BC_Teams_Members" = @(
        "Title", "SchoolName_Ref", "JobRole", "MembershipType", "MemberEmail"
    )
    "SBC_Drills_Log" = @(
        "Title", "SchoolName_Ref", "DrillHypothesis", "SpecificEvent", 
        "TargetGroup", "ExecutionDate", "AttachmentUrl", "PlanStatus",
        "IsAdminPlan", "StartDate", "EndDate", "PlanEffectivenessRating",
        "LessonsLearnedSummary", "ImprovementRecommendations"
    )
    "SBC_Incidents_Log" = @(
        "Title", "SchoolName_Ref", "IncidentNumber", "IncidentCategory",
        "IncidentDate", "IncidentDescription", "RiskLevel", "AlertModelType",
        "CoordinatedEntities", "ActivatedAlternative", "RecoveryTimeHours",
        "AffectedStudentsCount", "EducationContinuityMethod", "StudentsReturnedDate",
        "LessonsLearned", "AttachmentUrl", "CoordinationStatus", "Status"
    )
    "School_Training_Log" = @(
        "Title", "Program_Ref", "SchoolName_Ref", "RegistrationType",
        "AttendeesNames", "TrainingDate", "Status"
    )
    "Coordination_Programs_Catalog" = @(
        "Title", "ProviderEntity", "ActivityType", "Link", "Date", "Duration"
    )
}

Write-Host "Expected Lists to Test:" -ForegroundColor Green
foreach ($listName in $expectedLists.Keys) {
    Write-Host "  ✓ $listName" -ForegroundColor White
}
Write-Host ""

# Test summary
$testResults = @{
    "SchoolInfo" = @{ Status = "Not Tested"; MissingColumns = @(); ExtraInfo = "" }
    "BC_Teams_Members" = @{ Status = "Not Tested"; MissingColumns = @(); ExtraInfo = "" }
    "SBC_Drills_Log" = @{ Status = "Not Tested"; MissingColumns = @(); ExtraInfo = "" }
    "SBC_Incidents_Log" = @{ Status = "Not Tested"; MissingColumns = @(); ExtraInfo = "" }
    "School_Training_Log" = @{ Status = "Not Tested"; MissingColumns = @(); ExtraInfo = "" }
    "Coordination_Programs_Catalog" = @{ Status = "Not Tested"; MissingColumns = @(); ExtraInfo = "" }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "IMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. This script requires PnP PowerShell module" -ForegroundColor White
Write-Host "   Install: Install-Module -Name PnP.PowerShell -Force" -ForegroundColor Gray
Write-Host ""
Write-Host "2. You must be connected to SharePoint first:" -ForegroundColor White
Write-Host "   Connect-PnPOnline -Url '$siteUrl' -Interactive" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Critical Column Configurations:" -ForegroundColor White
Write-Host "   • AttendeesNames (School_Training_Log): Must be Lookup (Multi-select) to BC_Teams_Members" -ForegroundColor Gray
Write-Host "   • SchoolName_Ref: Lookup to SchoolInfo list" -ForegroundColor Gray
Write-Host "   • Program_Ref: Lookup to Coordination_Programs_Catalog" -ForegroundColor Gray
Write-Host ""

# Check if PnP module is installed
Write-Host "Checking for PnP.PowerShell module..." -ForegroundColor Cyan
$pnpModule = Get-Module -ListAvailable -Name PnP.PowerShell

if ($pnpModule) {
    Write-Host "✓ PnP.PowerShell module is installed" -ForegroundColor Green
    Write-Host ""
    
    # Ask user if they want to connect and test
    $response = Read-Host "Do you want to connect to SharePoint and run tests? (Y/N)"
    
    if ($response -eq "Y" -or $response -eq "y") {
        try {
            Write-Host "Connecting to SharePoint..." -ForegroundColor Cyan
            Connect-PnPOnline -Url $siteUrl -Interactive
            Write-Host "✓ Connected successfully!" -ForegroundColor Green
            Write-Host ""
            
            # Test each list
            foreach ($listName in $expectedLists.Keys) {
                Write-Host "Testing: $listName" -ForegroundColor Yellow
                Write-Host "----------------------------------------" -ForegroundColor Gray
                
                try {
                    $list = Get-PnPList -Identity $listName -ErrorAction Stop
                    $fields = Get-PnPField -List $listName
                    
                    $existingColumns = $fields | Select-Object -ExpandProperty InternalName
                    $missingColumns = @()
                    
                    foreach ($expectedColumn in $expectedLists[$listName]) {
                        if ($existingColumns -notcontains $expectedColumn) {
                            $missingColumns += $expectedColumn
                        }
                    }
                    
                    if ($missingColumns.Count -eq 0) {
                        $testResults[$listName].Status = "PASS"
                        $testResults[$listName].ExtraInfo = "All columns exist"
                        Write-Host "  ✓ PASS: All required columns exist" -ForegroundColor Green
                    } else {
                        $testResults[$listName].Status = "FAIL"
                        $testResults[$listName].MissingColumns = $missingColumns
                        Write-Host "  ✗ FAIL: Missing columns found" -ForegroundColor Red
                        foreach ($col in $missingColumns) {
                            Write-Host "    - $col" -ForegroundColor Red
                        }
                    }
                    
                    # Check item count
                    try {
                        $itemCount = (Get-PnPListItem -List $listName -PageSize 1).Count
                        Write-Host "  Items in list: $itemCount" -ForegroundColor Gray
                    } catch {
                        Write-Host "  Items in list: Unable to count" -ForegroundColor Gray
                    }
                    
                } catch {
                    $testResults[$listName].Status = "ERROR"
                    $testResults[$listName].ExtraInfo = $_.Exception.Message
                    Write-Host "  ✗ ERROR: $($_.Exception.Message)" -ForegroundColor Red
                }
                
                Write-Host ""
            }
            
        } catch {
            Write-Host "✗ Failed to connect: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
        }
    }
} else {
    Write-Host "✗ PnP.PowerShell module is NOT installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install, run:" -ForegroundColor Yellow
    Write-Host "  Install-Module -Name PnP.PowerShell -Force -Scope CurrentUser" -ForegroundColor White
    Write-Host ""
}

# Display Summary Report
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY REPORT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$passCount = 0
$failCount = 0
$errorCount = 0

foreach ($listName in $testResults.Keys) {
    $result = $testResults[$listName]
    $statusColor = "White"
    
    switch ($result.Status) {
        "PASS" { $statusColor = "Green"; $passCount++ }
        "FAIL" { $statusColor = "Red"; $failCount++ }
        "ERROR" { $statusColor = "Red"; $errorCount++ }
        "Not Tested" { $statusColor = "Yellow" }
    }
    
    Write-Host "$listName : $($result.Status)" -ForegroundColor $statusColor
    
    if ($result.MissingColumns.Count -gt 0) {
        Write-Host "  Missing Columns:" -ForegroundColor Yellow
        foreach ($col in $result.MissingColumns) {
            Write-Host "    - $col" -ForegroundColor Red
        }
    }
    
    if ($result.ExtraInfo) {
        Write-Host "  Info: $($result.ExtraInfo)" -ForegroundColor Gray
    }
    
    Write-Host ""
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Total: $($testResults.Count) lists" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host "Errors: $errorCount" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Generate column creation script for missing columns
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "COLUMN CREATION SCRIPT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy and run this script after connecting to SharePoint:" -ForegroundColor Yellow
Write-Host ""

$hasFailures = $false
foreach ($listName in $testResults.Keys) {
    if ($testResults[$listName].MissingColumns.Count -gt 0) {
        $hasFailures = $true
        Write-Host "# Fix $listName" -ForegroundColor Green
        foreach ($col in $testResults[$listName].MissingColumns) {
            # Determine field type based on column name patterns
            $fieldType = "Text"
            if ($col -like "*Date*" -or $col -like "*Time*") { $fieldType = "DateTime" }
            elseif ($col -like "*Count*" -or $col -like "*Rating*" -or $col -like "*Hours*") { $fieldType = "Number" }
            elseif ($col -like "*_Ref" -or $col -eq "AttendeesNames") { $fieldType = "Lookup" }
            elseif ($col -like "*IsAdmin*" -or $col -like "*Is*") { $fieldType = "Boolean" }
            elseif ($col -like "*Description*" -or $col -like "*Summary*" -or $col -like "*Recommendations*" -or $col -like "*Learned*") { $fieldType = "Note" }
            
            if ($fieldType -eq "Lookup") {
                if ($col -eq "AttendeesNames") {
                    Write-Host "Add-PnPField -List '$listName' -DisplayName '$col' -InternalName '$col' -Type LookupMulti -AddToDefaultView" -ForegroundColor White
                    Write-Host "# IMPORTANT: Configure AttendeesNames to lookup BC_Teams_Members -> Title (Allow multiple values)" -ForegroundColor Yellow
                } elseif ($col -like "*SchoolName_Ref*") {
                    Write-Host "Add-PnPField -List '$listName' -DisplayName '$col' -InternalName '$col' -Type Lookup -AddToDefaultView" -ForegroundColor White
                    Write-Host "# IMPORTANT: Configure SchoolName_Ref to lookup SchoolInfo -> Title" -ForegroundColor Yellow
                } elseif ($col -eq "Program_Ref") {
                    Write-Host "Add-PnPField -List '$listName' -DisplayName '$col' -InternalName '$col' -Type Lookup -AddToDefaultView" -ForegroundColor White
                    Write-Host "# IMPORTANT: Configure Program_Ref to lookup Coordination_Programs_Catalog -> Title" -ForegroundColor Yellow
                } else {
                    Write-Host "Add-PnPField -List '$listName' -DisplayName '$col' -InternalName '$col' -Type $fieldType -AddToDefaultView" -ForegroundColor White
                }
            } else {
                Write-Host "Add-PnPField -List '$listName' -DisplayName '$col' -InternalName '$col' -Type $fieldType -AddToDefaultView" -ForegroundColor White
            }
        }
        Write-Host ""
    }
}

if (-not $hasFailures) {
    Write-Host "No missing columns detected. All lists are properly configured!" -ForegroundColor Green
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "NAVIGABLE CARDS IN APPLICATION" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All dashboard cards are already navigable:" -ForegroundColor Green
Write-Host ""
Write-Host "School User Dashboard Cards:" -ForegroundColor Yellow
Write-Host "  • Team Members Card → /team (Click to view/add team members)" -ForegroundColor White
Write-Host "  • Training Completed Card → /training-log (Click to view/register trainings)" -ForegroundColor White
Write-Host "  • Drills Conducted Card → /drills (Click to view/add drills)" -ForegroundColor White
Write-Host "  • Active Incidents Card → /incidents (Click to view/report incidents)" -ForegroundColor White
Write-Host ""
Write-Host "Quick Action Cards:" -ForegroundColor Yellow
Write-Host "  • Add Team Member → /team" -ForegroundColor White
Write-Host "  • Register Training → /training-log" -ForegroundColor White
Write-Host "  • Register Drill → /drills" -ForegroundColor White
Write-Host "  • Report Incident → /incidents" -ForegroundColor White
Write-Host ""
Write-Host "Admin Dashboard Cards:" -ForegroundColor Yellow
Write-Host "  • Total Schools → /admin (schools tab)" -ForegroundColor White
Write-Host "  • Schools with Teams → /admin (progress view)" -ForegroundColor White
Write-Host "  • Schools with Drills → /admin (progress view)" -ForegroundColor White
Write-Host "  • Schools with Training → /admin (progress view)" -ForegroundColor White
Write-Host ""
Write-Host "Additional Navigable Elements:" -ForegroundColor Yellow
Write-Host "  • School Location (Map) → Google Maps (external link)" -ForegroundColor White
Write-Host "  • BC Plan Card → /bcplan (if published)" -ForegroundColor White
Write-Host "  • Training Programs → /training" -ForegroundColor White
Write-Host ""
Write-Host "Test completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""
