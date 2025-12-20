# Extract SharePoint Choice Field Information from Schema Files

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SharePoint Choice Field Extractor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Field configurations we're interested in
$targetFields = @{
    'coordination_programs_catalog' = @(
        @{ FieldName = 'ProviderEntity'; FieldId = 'f48b36d7-b745-4db2-99a3-8356684f8a1c'; Description = 'الجهة المدربة' },
        @{ FieldName = 'ActivityType'; FieldId = 'a9484ad1-c767-4555-9e3e-ccdf264c23e1'; Description = 'نوع النشاط' },
        @{ FieldName = 'TargetAudience'; FieldId = 'cd87a6bf-0c1a-42c0-a0b4-d12a39416f4d'; Description = 'الفئة المستهدفة (multi-select)' },
        @{ FieldName = 'ExecutionMode'; FieldId = 'd9be0b83-2647-40b0-88cc-8616795de4e3'; Description = 'آلية التنفيذ' },
        @{ FieldName = 'CoordinationStatus'; FieldId = '29519557-d42e-4251-951f-75d02512e3bb'; Description = 'حالة البرنامج' }
    )
    'sbc_incidents_log' = @(
        @{ FieldName = 'ActionTaken'; FieldId = '37428e3c-5498-4c08-8fae-285879364143'; Description = 'الإجراءات المتخذة' }
    )
}

$schemaDir = Join-Path $PSScriptRoot ".power\schemas\sharepointonline"

Write-Host "Schema Directory: $schemaDir" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($listName in $targetFields.Keys) {
    $schemaFile = Join-Path $schemaDir "$listName.Schema.json"
    
    Write-Host "📋 List: $listName" -ForegroundColor Green
    Write-Host ("─" * 50) -ForegroundColor Gray
    
    if (-not (Test-Path $schemaFile)) {
        Write-Host "  ❌ Schema file not found: $schemaFile" -ForegroundColor Red
        continue
    }
    
    try {
        $schema = Get-Content $schemaFile -Raw | ConvertFrom-Json
        $properties = $schema.schema.items.properties
        
        foreach ($field in $targetFields[$listName]) {
            Write-Host ""
            Write-Host "  ✓ $($field.FieldName) ($($field.Description))" -ForegroundColor White
            Write-Host "    Field ID: $($field.FieldId)" -ForegroundColor Gray
            
            $fieldSchema = $properties.($field.FieldName)
            if ($fieldSchema) {
                $isMultiChoice = $fieldSchema.type -eq 'array'
                $isChoice = $fieldSchema.'x-ms-capabilities'.'x-ms-sp'.IsChoice -or 
                           $fieldSchema.items.'x-ms-capabilities'.'x-ms-sp'.IsChoice
                
                Write-Host "    Type: $(if ($isMultiChoice) { 'Multi-Choice' } else { 'Single Choice' })" -ForegroundColor Cyan
                Write-Host "    Is Choice Field: $(if ($isChoice) { 'Yes' } else { 'No' })" -ForegroundColor Cyan
                
                # Find the dynamic values configuration
                $dynamicValues = if ($isMultiChoice) {
                    $fieldSchema.items.properties.Value.'x-ms-dynamic-values'
                } else {
                    $fieldSchema.properties.Value.'x-ms-dynamic-values'
                }
                
                if ($dynamicValues) {
                    Write-Host "    ✅ Uses GetEntityValues API" -ForegroundColor Green
                    Write-Host "       Operation: $($dynamicValues.operationId)" -ForegroundColor Yellow
                    Write-Host "       Field ID param: $($dynamicValues.parameters.id)" -ForegroundColor Yellow
                }
            } else {
                Write-Host "    ❌ Field not found in schema" -ForegroundColor Red
            }
        }
        
        Write-Host ""
    } catch {
        Write-Host "  ❌ Error reading schema: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MANUAL VERIFICATION REQUIRED" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "The schema files confirm these are choice fields that use" -ForegroundColor White
Write-Host "the GetEntityValues API for dynamic values." -ForegroundColor White
Write-Host ""

Write-Host "To get the ACTUAL choice values, you need to:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Option 1: Check SharePoint Directly" -ForegroundColor Cyan
Write-Host ("─" * 50) -ForegroundColor Gray
Write-Host "1. Navigate to: https://saudimoe.sharepoint.com/sites/em" -ForegroundColor White
Write-Host "2. Go to Coordination_Programs_Catalog list" -ForegroundColor White
Write-Host "3. Click ⚙️ Settings > List Settings" -ForegroundColor White
Write-Host "4. Under 'Columns', click on each field name:" -ForegroundColor White
Write-Host "   - ProviderEntity (الجهة المدربة)" -ForegroundColor Gray
Write-Host "   - ActivityType (نوع النشاط)" -ForegroundColor Gray
Write-Host "   - TargetAudience (الفئة المستهدفة)" -ForegroundColor Gray
Write-Host "   - ExecutionMode (آلية التنفيذ)" -ForegroundColor Gray
Write-Host "   - CoordinationStatus (حالة البرنامج)" -ForegroundColor Gray
Write-Host "5. Do the same for SBC_Incidents_Log > ActionTaken" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Use SharePoint REST API" -ForegroundColor Cyan
Write-Host ("─" * 50) -ForegroundColor Gray
Write-Host "Open these URLs in your browser (while logged into SharePoint):" -ForegroundColor White
Write-Host ""

$siteUrl = "https://saudimoe.sharepoint.com/sites/em"

foreach ($listName in $targetFields.Keys) {
    $displayListName = if ($listName -eq 'coordination_programs_catalog') { 'Coordination_Programs_Catalog' } else { 'SBC_Incidents_Log' }
    
    foreach ($field in $targetFields[$listName]) {
        $restUrl = "$siteUrl/_api/web/lists/getbytitle('$displayListName')/fields(guid'{$($field.FieldId)}')?`$select=Title,Choices"
        Write-Host "$($field.FieldName):" -ForegroundColor Yellow
        Write-Host "  $restUrl" -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host ""
Write-Host "Option 3: Check Current Fallback Values in Code" -ForegroundColor Cyan
Write-Host ("─" * 50) -ForegroundColor Gray
Write-Host "Search in your codebase for existing fallback values:" -ForegroundColor White
Write-Host "  src/components/coordination/CoordinationProgramForm.tsx" -ForegroundColor Gray
Write-Host "  src/components/incidents/IncidentForm.tsx" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
