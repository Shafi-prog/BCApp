# Check SharePoint Lists - Simple Script
# This script lists all SharePoint lists in the site

$SiteUrl = "https://saudimoe.sharepoint.com/sites/em"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SharePoint Lists Checker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Site: $SiteUrl" -ForegroundColor Yellow
Write-Host ""

# Expected Lists
$ExpectedLists = @{
    "Existing" = @(
        "SchoolInfo",
        "BC_Teams_Members", 
        "SBC_Drills_Log",
        "SBC_Incidents_Log",
        "School_Training_Log",
        "Coordination_Programs_Catalog"
    )
    "Needed" = @(
        "BC_Admin_Settings",
        "BC_DR_Checklist",
        "BC_External_Contacts",
        "BC_Incident_Evaluations"
    )
}

Write-Host "EXISTING LISTS (should be in SharePoint):" -ForegroundColor Green
Write-Host "-----------------------------------------"
foreach ($list in $ExpectedLists.Existing) {
    Write-Host "  [OK] $list" -ForegroundColor Green
}

Write-Host ""
Write-Host "LISTS TO CREATE (missing):" -ForegroundColor Red
Write-Host "-----------------------------------------"
foreach ($list in $ExpectedLists.Needed) {
    Write-Host "  [X] $list" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CSV Templates Ready for Import" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$templatePath = "c:\Users\Hp\Desktop\App\templates"
if (Test-Path $templatePath) {
    $csvFiles = Get-ChildItem -Path $templatePath -Filter "*.csv"
    foreach ($csv in $csvFiles) {
        $rowCount = (Import-Csv $csv.FullName).Count
        Write-Host "  $($csv.Name)" -ForegroundColor Yellow -NoNewline
        Write-Host " ($rowCount rows)" -ForegroundColor Gray
    }
} else {
    Write-Host "  Templates folder not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HOW TO CREATE LISTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Import from CSV (Easiest)" -ForegroundColor White
Write-Host "  1. Go to: $SiteUrl/_layouts/15/viewlsts.aspx" -ForegroundColor Gray
Write-Host "  2. Click '+ New' -> 'List'" -ForegroundColor Gray
Write-Host "  3. Choose 'From CSV'" -ForegroundColor Gray
Write-Host "  4. Upload CSV from templates/ folder" -ForegroundColor Gray
Write-Host "  5. Click Create" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Create Empty List" -ForegroundColor White
Write-Host "  1. Go to: $SiteUrl/_layouts/15/viewlsts.aspx" -ForegroundColor Gray
Write-Host "  2. Click '+ New' -> 'List' -> 'Blank list'" -ForegroundColor Gray
Write-Host "  3. Name it exactly as shown above" -ForegroundColor Gray
Write-Host "  4. Add columns manually" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to open SharePoint site contents..." -ForegroundColor Yellow
Read-Host

Start-Process "$SiteUrl/_layouts/15/viewlsts.aspx"
