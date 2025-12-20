# SharePoint Lists Creation Script
param([string]$SiteUrl = "https://saudimoe.sharepoint.com/sites/em")

Write-Host "BC Management - SharePoint Lists Setup" -ForegroundColor Cyan

if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
    Write-Host "Installing PnP.PowerShell..." -ForegroundColor Yellow
    Install-Module -Name PnP.PowerShell -Force -Scope CurrentUser -AllowClobber
}
Import-Module PnP.PowerShell

Write-Host "Connecting to SharePoint: $SiteUrl" -ForegroundColor Yellow
# Use Device Code flow - will show a code to enter at microsoft.com/devicelogin
Connect-PnPOnline -Url $SiteUrl -DeviceLogin
Write-Host "Connected!" -ForegroundColor Green

function Create-ListIfNotExists { param([string]$ListName)
    $list = Get-PnPList -Identity $ListName -ErrorAction SilentlyContinue
    if ($list) { Write-Host "  List $ListName exists" -ForegroundColor Yellow; return $false }
    New-PnPList -Title $ListName -Template GenericList -EnableVersioning
    Write-Host "  Created: $ListName" -ForegroundColor Green; return $true
}

function Add-Field { param([string]$List, [string]$Name, [string]$Type, [string]$Choices="", [string]$LookupList="")
    $f = Get-PnPField -List $List -Identity $Name -ErrorAction SilentlyContinue
    if ($f) { return }
    switch ($Type) {
        "Text" { Add-PnPField -List $List -DisplayName $Name -InternalName $Name -Type Text | Out-Null }
        "Note" { Add-PnPField -List $List -DisplayName $Name -InternalName $Name -Type Note | Out-Null }
        "Number" { Add-PnPField -List $List -DisplayName $Name -InternalName $Name -Type Number | Out-Null }
        "DateTime" { Add-PnPField -List $List -DisplayName $Name -InternalName $Name -Type DateTime | Out-Null }
        "Boolean" { Add-PnPField -List $List -DisplayName $Name -InternalName $Name -Type Boolean | Out-Null }
        "URL" { Add-PnPField -List $List -DisplayName $Name -InternalName $Name -Type URL | Out-Null }
        "Choice" { Add-PnPField -List $List -DisplayName $Name -InternalName $Name -Type Choice -Choices ($Choices -split ",") | Out-Null }
        "Lookup" {
            $ll = Get-PnPList -Identity $LookupList -ErrorAction SilentlyContinue
            if ($ll) { Add-PnPField -List $List -DisplayName $Name -InternalName $Name -Type Lookup | Out-Null
                $fld = Get-PnPField -List $List -Identity $Name; $fld.LookupList = $ll.Id.ToString(); $fld.LookupField = "Title"; $fld.Update(); Invoke-PnPQuery }
        }
    }
    Write-Host "    + $Name ($Type)" -ForegroundColor Green
}

Write-Host "`n1. BC_Shared_Plan" -ForegroundColor White
Create-ListIfNotExists -ListName "BC_Shared_Plan"
Add-Field -List "BC_Shared_Plan" -Name "PlanDescription" -Type "Note"
Add-Field -List "BC_Shared_Plan" -Name "ScenariosJSON" -Type "Note"
Add-Field -List "BC_Shared_Plan" -Name "ContactsJSON" -Type "Note"
Add-Field -List "BC_Shared_Plan" -Name "AlternativeSchoolsJSON" -Type "Note"
Add-Field -List "BC_Shared_Plan" -Name "DrillPlanJSON" -Type "Note"
Add-Field -List "BC_Shared_Plan" -Name "IsPublished" -Type "Boolean"
Add-Field -List "BC_Shared_Plan" -Name "LastUpdated" -Type "DateTime"
Add-Field -List "BC_Shared_Plan" -Name "PublishedBy" -Type "Text"
Add-Field -List "BC_Shared_Plan" -Name "Version" -Type "Number"

Write-Host "`n2. BC_Plan_Review" -ForegroundColor White
Create-ListIfNotExists -ListName "BC_Plan_Review"
Add-Field -List "BC_Plan_Review" -Name "SchoolName_Ref" -Type "Lookup" -LookupList "SchoolInfo"
Add-Field -List "BC_Plan_Review" -Name "Task7_1_Complete" -Type "Boolean"
Add-Field -List "BC_Plan_Review" -Name "Task7_2_Complete" -Type "Boolean"
Add-Field -List "BC_Plan_Review" -Name "Task7_3_Complete" -Type "Boolean"
Add-Field -List "BC_Plan_Review" -Name "ReviewNotes" -Type "Note"
Add-Field -List "BC_Plan_Review" -Name "LastUpdated" -Type "DateTime"
Add-Field -List "BC_Plan_Review" -Name "ReviewedBy" -Type "Text"

Write-Host "`n3. BC_DR_Checklist" -ForegroundColor White
Create-ListIfNotExists -ListName "BC_DR_Checklist"
Add-Field -List "BC_DR_Checklist" -Name "Category" -Type "Choice" -Choices "Data,Systems,Communications,AlternativeSites,Teams"
Add-Field -List "BC_DR_Checklist" -Name "ItemDescription" -Type "Text"
Add-Field -List "BC_DR_Checklist" -Name "Status" -Type "Choice" -Choices "not_ready,in_progress,ready"
Add-Field -List "BC_DR_Checklist" -Name "LastChecked" -Type "DateTime"
Add-Field -List "BC_DR_Checklist" -Name "Notes" -Type "Note"
Add-Field -List "BC_DR_Checklist" -Name "CheckedBy" -Type "Text"
Add-Field -List "BC_DR_Checklist" -Name "Priority" -Type "Choice" -Choices "High,Medium,Low"

Write-Host "`n4. BC_Admin_Contacts" -ForegroundColor White
Create-ListIfNotExists -ListName "BC_Admin_Contacts"
Add-Field -List "BC_Admin_Contacts" -Name "ContactName" -Type "Text"
Add-Field -List "BC_Admin_Contacts" -Name "ContactRole" -Type "Text"
Add-Field -List "BC_Admin_Contacts" -Name "ContactPhone" -Type "Text"
Add-Field -List "BC_Admin_Contacts" -Name "ContactEmail" -Type "Text"
Add-Field -List "BC_Admin_Contacts" -Name "ContactEntity" -Type "Choice" -Choices "CivilDefense,RedCrescent,Police,Municipality,EducationDept,MOE,Other"
Add-Field -List "BC_Admin_Contacts" -Name "IsActive" -Type "Boolean"
Add-Field -List "BC_Admin_Contacts" -Name "Notes" -Type "Note"

Write-Host "`n5. BC_Plan_Documents" -ForegroundColor White
Create-ListIfNotExists -ListName "BC_Plan_Documents"
Add-Field -List "BC_Plan_Documents" -Name "DocumentType" -Type "Choice" -Choices "Plan,Guide,Template,Report,Other"
Add-Field -List "BC_Plan_Documents" -Name "DocumentDescription" -Type "Note"
Add-Field -List "BC_Plan_Documents" -Name "DocumentURL" -Type "URL"
Add-Field -List "BC_Plan_Documents" -Name "UploadDate" -Type "DateTime"
Add-Field -List "BC_Plan_Documents" -Name "UploadedBy" -Type "Text"
Add-Field -List "BC_Plan_Documents" -Name "DocVersion" -Type "Text"
Add-Field -List "BC_Plan_Documents" -Name "IsActive" -Type "Boolean"

Write-Host "`n6. BC_Incident_Evaluations" -ForegroundColor White
Create-ListIfNotExists -ListName "BC_Incident_Evaluations"
Add-Field -List "BC_Incident_Evaluations" -Name "IncidentRef" -Type "Lookup" -LookupList "SBC_Incidents_Log"
Add-Field -List "BC_Incident_Evaluations" -Name "SchoolName_Ref" -Type "Lookup" -LookupList "SchoolInfo"
Add-Field -List "BC_Incident_Evaluations" -Name "ResponseRating" -Type "Number"
Add-Field -List "BC_Incident_Evaluations" -Name "CommunicationRating" -Type "Number"
Add-Field -List "BC_Incident_Evaluations" -Name "RecoveryRating" -Type "Number"
Add-Field -List "BC_Incident_Evaluations" -Name "OverallRating" -Type "Number"
Add-Field -List "BC_Incident_Evaluations" -Name "LessonsLearned" -Type "Note"
Add-Field -List "BC_Incident_Evaluations" -Name "Recommendations" -Type "Note"
Add-Field -List "BC_Incident_Evaluations" -Name "EvaluatedBy" -Type "Text"
Add-Field -List "BC_Incident_Evaluations" -Name "EvaluationDate" -Type "DateTime"

Write-Host "`n7. BC_Damage_Reports" -ForegroundColor White
Create-ListIfNotExists -ListName "BC_Damage_Reports"
Add-Field -List "BC_Damage_Reports" -Name "SchoolName_Ref" -Type "Lookup" -LookupList "SchoolInfo"
Add-Field -List "BC_Damage_Reports" -Name "IncidentRef" -Type "Lookup" -LookupList "SBC_Incidents_Log"
Add-Field -List "BC_Damage_Reports" -Name "DamageType" -Type "Choice" -Choices "Infrastructure,Equipment,Furniture,Buildings,Other"
Add-Field -List "BC_Damage_Reports" -Name "DamageDescription" -Type "Note"
Add-Field -List "BC_Damage_Reports" -Name "DamageSeverity" -Type "Choice" -Choices "Minor,Moderate,Severe,Total"
Add-Field -List "BC_Damage_Reports" -Name "EstimatedCost" -Type "Number"
Add-Field -List "BC_Damage_Reports" -Name "RepairStatus" -Type "Choice" -Choices "UnderAssessment,UnderRepair,Completed,Postponed"
Add-Field -List "BC_Damage_Reports" -Name "ReportDate" -Type "DateTime"
Add-Field -List "BC_Damage_Reports" -Name "ReportedBy" -Type "Text"
Add-Field -List "BC_Damage_Reports" -Name "AttachmentURL" -Type "URL"

Write-Host "`n8. Updating SBC_Drills_Log" -ForegroundColor White
$dl = Get-PnPList -Identity "SBC_Drills_Log" -ErrorAction SilentlyContinue
if ($dl) {
    Add-Field -List "SBC_Drills_Log" -Name "PlanEffectivenessRating" -Type "Number"
    Add-Field -List "SBC_Drills_Log" -Name "ProceduresEffectivenessRating" -Type "Number"
    Add-Field -List "SBC_Drills_Log" -Name "SchoolFeedback" -Type "Note"
    Add-Field -List "SBC_Drills_Log" -Name "ImprovementSuggestions" -Type "Note"
} else { Write-Host "  SBC_Drills_Log not found" -ForegroundColor Yellow }

Write-Host "`nSetup Complete!" -ForegroundColor Green
Disconnect-PnPOnline
