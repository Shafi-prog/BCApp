# Test script to query SharePoint choice field values
# This script uses SharePoint REST API to get field metadata

$siteUrl = "https://saudimoe.sharepoint.com/sites/em"

# Field configurations
$fields = @(
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

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SharePoint Choice Field Values Query" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PnP.PowerShell is installed
$pnpModule = Get-Module -ListAvailable -Name "PnP.PowerShell"
if (-not $pnpModule) {
    Write-Host "ERROR: PnP.PowerShell module is not installed" -ForegroundColor Red
    Write-Host "Please install it with: Install-Module -Name PnP.PowerShell -Scope CurrentUser" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Attempting to install now..." -ForegroundColor Yellow
    Install-Module -Name PnP.PowerShell -Scope CurrentUser -Force -AllowClobber
}

try {
    Write-Host "Connecting to SharePoint site: $siteUrl" -ForegroundColor Green
    Connect-PnPOnline -Url $siteUrl -Interactive
    Write-Host "Connected successfully!" -ForegroundColor Green
    Write-Host ""
    
    $results = @{}
    
    foreach ($fieldConfig in $fields) {
        $listName = $fieldConfig.ListName
        $fieldName = $fieldConfig.FieldName
        $fieldId = $fieldConfig.FieldId
        
        Write-Host "----------------------------------------" -ForegroundColor Cyan
        Write-Host "List: $listName" -ForegroundColor White
        Write-Host "Field: $fieldName" -ForegroundColor White
        Write-Host "Field ID: $fieldId" -ForegroundColor Gray
        
        try {
            # Get the field by ID
            $field = Get-PnPField -List $listName -Identity $fieldId -Includes Choices
            
            if ($field -and $field.Choices) {
                Write-Host "Choice Values:" -ForegroundColor Green
                $field.Choices | ForEach-Object {
                    Write-Host "  - $_" -ForegroundColor Yellow
                }
                
                # Store results
                if (-not $results.ContainsKey($listName)) {
                    $results[$listName] = @{}
                }
                $results[$listName][$fieldName] = $field.Choices
            } else {
                Write-Host "No choices found or field is not a choice field" -ForegroundColor Red
            }
        } catch {
            Write-Host "ERROR: $_" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    # Disconnect
    Disconnect-PnPOnline
    
    # Generate summary report
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "SUMMARY - JSON FORMAT FOR CODE" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($listName in $results.Keys) {
        Write-Host "// $listName" -ForegroundColor Green
        foreach ($fieldName in $results[$listName].Keys) {
            $choices = $results[$listName][$fieldName]
            $jsonChoices = $choices | ConvertTo-Json -Compress
            Write-Host "$fieldName : $jsonChoices" -ForegroundColor White
        }
        Write-Host ""
    }
    
} catch {
    Write-Host "ERROR: Failed to connect or query SharePoint" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. You have access to the SharePoint site" -ForegroundColor Yellow
    Write-Host "  2. PnP.PowerShell module is installed" -ForegroundColor Yellow
    Write-Host "  3. You're authenticated with proper permissions" -ForegroundColor Yellow
}
