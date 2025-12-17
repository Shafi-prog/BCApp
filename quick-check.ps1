# SharePoint Lists Quick Check
# Simple script to display list status

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SharePoint Lists Status Check" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Site: https://saudimoe.sharepoint.com/sites/em" -ForegroundColor Yellow
Write-Host ""

Write-Host "EXISTING LISTS (in SharePoint):" -ForegroundColor Green
Write-Host "--------------------------------"
Write-Host "  [OK] SchoolInfo" -ForegroundColor Green
Write-Host "  [OK] BC_Teams_Members" -ForegroundColor Green
Write-Host "  [OK] SBC_Drills_Log" -ForegroundColor Green
Write-Host "  [OK] SBC_Incidents_Log" -ForegroundColor Green
Write-Host "  [OK] School_Training_Log" -ForegroundColor Green
Write-Host "  [OK] Coordination_Programs_Catalog" -ForegroundColor Green
Write-Host ""

Write-Host "LISTS TO CREATE (Admin Data):" -ForegroundColor Red
Write-Host "--------------------------------"
Write-Host "  [X] BC_Admin_Settings" -ForegroundColor Red
Write-Host "  [X] BC_DR_Checklist" -ForegroundColor Red
Write-Host "  [X] BC_External_Contacts" -ForegroundColor Red
Write-Host ""
Write-Host "COLUMNS TO ADD (in SBC_Incidents_Log):" -ForegroundColor Yellow
Write-Host "--------------------------------"
Write-Host "  [+] ResponseTimeMinutes (Number)" -ForegroundColor Yellow
Write-Host "  [+] RecoveryTimeHours (Number)" -ForegroundColor Yellow
Write-Host "  [+] ResponseRating (Number)" -ForegroundColor Yellow
Write-Host "  [+] CoordinationRating (Number)" -ForegroundColor Yellow
Write-Host "  [+] CommunicationRating (Number)" -ForegroundColor Yellow
Write-Host "  [+] RecoveryRating (Number)" -ForegroundColor Yellow
Write-Host "  [+] OverallRating (Number)" -ForegroundColor Yellow
Write-Host "  [+] EvaluationNotes (Note)" -ForegroundColor Yellow
Write-Host "  [+] IsEvaluated (Yes/No)" -ForegroundColor Yellow
Write-Host ""

Write-Host "CSV TEMPLATES READY:" -ForegroundColor Yellow
Write-Host "--------------------------------"
$templates = @(
    "BC_Admin_Settings.csv",
    "BC_DR_Checklist.csv",
    "BC_External_Contacts.csv",
    "SBC_Incidents_Log_NewColumns.csv"
)

foreach ($t in $templates) {
    $path = "c:\Users\Hp\Desktop\App\templates\$t"
    if (Test-Path $path) {
        $rows = (Import-Csv $path -ErrorAction SilentlyContinue | Measure-Object).Count
        Write-Host "  [OK] $t ($rows rows)" -ForegroundColor Green
    } else {
        Write-Host "  [X] $t (not found)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HOW TO CREATE MISSING LISTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open SharePoint Site Contents:" -ForegroundColor White
Write-Host "   https://saudimoe.sharepoint.com/sites/em/_layouts/15/viewlsts.aspx" -ForegroundColor Gray
Write-Host ""
Write-Host "2. For each missing list:" -ForegroundColor White
Write-Host "   - Click '+ New' -> 'List'" -ForegroundColor Gray
Write-Host "   - Choose 'From CSV'" -ForegroundColor Gray
Write-Host "   - Upload from: c:\Users\Hp\Desktop\App\templates\" -ForegroundColor Gray
Write-Host "   - Click Create" -ForegroundColor Gray
Write-Host ""

$open = Read-Host "Open SharePoint Site Contents? (Y/N)"
if ($open -eq "Y" -or $open -eq "y") {
    Start-Process "https://saudimoe.sharepoint.com/sites/em/_layouts/15/viewlsts.aspx"
}
