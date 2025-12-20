# Simple SharePoint REST API test (requires authentication)
# This uses Windows authentication if running on domain-joined machine

$siteUrl = "https://saudimoe.sharepoint.com/sites/em"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SharePoint Choice Field Values Query" -ForegroundColor Cyan
Write-Host "Using REST API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Note: This requires SharePoint Online Management Shell or proper authentication
Write-Host "NOTE: This script requires authentication to SharePoint Online" -ForegroundColor Yellow
Write-Host "You may need to provide credentials when prompted" -ForegroundColor Yellow
Write-Host ""

# Field configurations
$fieldsToQuery = @(
    @{
        ListName = "Coordination_Programs_Catalog"
        FieldName = "ProviderEntity"
        FieldId = "f48b36d7-b745-4db2-99a3-8356684f8a1c"
    },
    @{
        ListName = "Coordination_Programs_Catalog"
        FieldName = "ActivityType"
        FieldId = "a9484ad1-c767-4555-9e3e-ccdf264c23e1"
    },
    @{
        ListName = "Coordination_Programs_Catalog"
        FieldName = "TargetAudience"
        FieldId = "cd87a6bf-0c1a-42c0-a0b4-d12a39416f4d"
    },
    @{
        ListName = "Coordination_Programs_Catalog"
        FieldName = "ExecutionMode"
        FieldId = "d9be0b83-2647-40b0-88cc-8616795de4e3"
    },
    @{
        ListName = "Coordination_Programs_Catalog"
        FieldName = "CoordinationStatus"
        FieldId = "29519557-d42e-4251-951f-75d02512e3bb"
    },
    @{
        ListName = "SBC_Incidents_Log"
        FieldName = "ActionTaken"
        FieldId = "37428e3c-5498-4c08-8fae-285879364143"
    }
)

Write-Host "Fields to query:" -ForegroundColor Green
foreach ($field in $fieldsToQuery) {
    Write-Host "  - $($field.ListName).$($field.FieldName)" -ForegroundColor White
}
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "MANUAL APPROACH REQUIRED:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Since automated REST API calls require complex authentication," -ForegroundColor White
Write-Host "here are the EXACT REST API URLs you can use in a browser:" -ForegroundColor White
Write-Host ""

foreach ($field in $fieldsToQuery) {
    $listName = $field.ListName
    $fieldId = $field.FieldId
    
    $restUrl = "$siteUrl/_api/web/lists/getbytitle('$listName')/fields(guid'$fieldId')?`$select=Title,Choices"
    
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    Write-Host "Field: $($field.FieldName) in $listName" -ForegroundColor Green
    Write-Host $restUrl -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ALTERNATIVE: Check SharePoint Directly" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: $siteUrl" -ForegroundColor White
Write-Host "2. Open List Settings for each list" -ForegroundColor White
Write-Host "3. Click on the field name to see choices" -ForegroundColor White
Write-Host ""
Write-Host "OR use SharePoint Designer / Power Platform to inspect field metadata" -ForegroundColor White
Write-Host ""
