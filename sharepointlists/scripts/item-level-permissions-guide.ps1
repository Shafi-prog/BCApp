# ============================================
# SharePoint Item-Level Permissions Setup Guide
# ============================================

Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SHAREPOINT ITEM-LEVEL PERMISSIONS" -ForegroundColor Cyan
Write-Host "  Setup Guide for School Isolation" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host @"
📌 WHAT IS ITEM-LEVEL PERMISSIONS?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This SharePoint feature allows you to restrict users so they can
ONLY see and edit items they personally created.

Perfect for: Each school sees only their own data!


🔧 HOW TO ENABLE (for each list):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Open SharePoint site: https://saudimoe.sharepoint.com/sites/em

2. Go to the list (e.g., BC_Teams_Members)

3. Click ⚙️ Settings icon (top right) → List Settings

4. Click "Advanced settings"

5. Scroll to "Item-level Permissions" section

6. Set these options:
   
   ┌─────────────────────────────────────────────────────┐
   │ Read access:                                        │
   │ ● Read items that were created by the user         │
   │                                                     │
   │ Create and Edit access:                             │
   │ ● Create items and edit items that were created    │
   │   by the user                                       │
   └─────────────────────────────────────────────────────┘

7. Click OK


"@ -ForegroundColor White

Write-Host "📋 LISTS TO CONFIGURE:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

$ListsConfig = @(
    @{ Name = "BC_Teams_Members"; Enable = $true; Reason = "Schools see only their team members" }
    @{ Name = "SBC_Drills_Log"; Enable = $true; Reason = "Schools see only their drills" }
    @{ Name = "SBC_Incidents_Log"; Enable = $true; Reason = "Schools see only their incidents" }
    @{ Name = "School_Training_Log"; Enable = $true; Reason = "Schools see only their training" }
    @{ Name = "SchoolInfo"; Enable = $false; Reason = "Need to read all for statistics/lookup" }
    @{ Name = "Coordination_Programs_Catalog"; Enable = $false; Reason = "All need to see programs" }
    @{ Name = "BC_Admin_Contacts"; Enable = $false; Reason = "Admin-only list, schools read only" }
    @{ Name = "BC_Plan_Documents"; Enable = $false; Reason = "Shared documents for all" }
    @{ Name = "BC_Shared_Plan"; Enable = $false; Reason = "Shared plan for all" }
    @{ Name = "BC_Mutual_Operation"; Enable = $false; Reason = "Need to see all for alternatives" }
)

foreach ($list in $ListsConfig) {
    if ($list.Enable) {
        Write-Host "  ✅ $($list.Name)" -ForegroundColor Green
        Write-Host "     → Enable item-level permissions" -ForegroundColor Gray
        Write-Host "     → $($list.Reason)" -ForegroundColor DarkGray
    } else {
        Write-Host "  ⬜ $($list.Name)" -ForegroundColor Gray
        Write-Host "     → Keep default (all can read)" -ForegroundColor DarkGray
        Write-Host "     → $($list.Reason)" -ForegroundColor DarkGray
    }
    Write-Host ""
}

Write-Host @"

⚠️  IMPORTANT NOTES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. This setting is PER LIST - you must configure each list separately

2. Admins with "Full Control" can still see all items

3. The "Created By" field determines ownership

4. If a school adds a team member, only that school sees it

5. This works with the app's filter logic:
   - App filters by SchoolName_Ref
   - SharePoint filters by Created By
   - Double protection! 🛡️


📊 RECOMMENDED PERMISSION MATRIX:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────────────┬──────────┬─────────────┬─────────────┐
│ List                         │ Schools  │ Item-Level  │ Admin       │
├──────────────────────────────┼──────────┼─────────────┼─────────────┤
│ SchoolInfo                   │ Read     │ No          │ Full        │
│ BC_Teams_Members             │ Contrib  │ YES ✅      │ Full        │
│ SBC_Drills_Log               │ Contrib  │ YES ✅      │ Full        │
│ SBC_Incidents_Log            │ Contrib  │ YES ✅      │ Full        │
│ School_Training_Log          │ Contrib  │ YES ✅      │ Full        │
│ Coordination_Programs_Catalog│ Read     │ No          │ Full        │
│ BC_Admin_Contacts            │ Read     │ No          │ Full        │
│ BC_Plan_Documents            │ Read     │ No          │ Full        │
└──────────────────────────────┴──────────┴─────────────┴─────────────┘

"@ -ForegroundColor White

Write-Host "🔗 DIRECT LINKS TO LIST SETTINGS:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

$SiteUrl = "https://saudimoe.sharepoint.com/sites/em"
$Lists = @("BC_Teams_Members", "SBC_Drills_Log", "SBC_Incidents_Log", "School_Training_Log")

foreach ($list in $Lists) {
    Write-Host "  $list :" -ForegroundColor Cyan
    Write-Host "  $SiteUrl/Lists/$list → Settings → Advanced settings`n" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Apply these settings to enable" -ForegroundColor Cyan
Write-Host "  school-level data isolation! 🏫" -ForegroundColor Cyan  
Write-Host "========================================`n" -ForegroundColor Cyan
