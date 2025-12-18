/**
 * Test script to extract SharePoint choice field configurations
 * This script reads the schema files and identifies choice fields
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('SharePoint Choice Field Extractor');
console.log('========================================\n');

// Field configurations we're interested in
const targetFields = {
  'Coordination_Programs_Catalog': [
    { fieldName: 'ProviderEntity', fieldId: 'f48b36d7-b745-4db2-99a3-8356684f8a1c', description: 'الجهة المدربة' },
    { fieldName: 'ActivityType', fieldId: 'a9484ad1-c767-4555-9e3e-ccdf264c23e1', description: 'نوع النشاط' },
    { fieldName: 'TargetAudience', fieldId: 'cd87a6bf-0c1a-42c0-a0b4-d12a39416f4d', description: 'الفئة المستهدفة (multi-select)' },
    { fieldName: 'ExecutionMode', fieldId: 'd9be0b83-2647-40b0-88cc-8616795de4e3', description: 'آلية التنفيذ' },
    { fieldName: 'CoordinationStatus', fieldId: '29519557-d42e-4251-951f-75d02512e3bb', description: 'حالة البرنامج' }
  ],
  'SBC_Incidents_Log': [
    { fieldName: 'ActionTaken', fieldId: '37428e3c-5498-4c08-8fae-285879364143', description: 'الإجراءات المتخذة' }
  ]
};

// Read schema files
const schemaDir = path.join(__dirname, '.power', 'schemas', 'sharepointonline');

console.log('Schema Directory:', schemaDir);
console.log('\n========================================\n');

Object.keys(targetFields).forEach(listName => {
  const schemaFile = path.join(schemaDir, `${listName.toLowerCase()}.Schema.json`);
  
  console.log(`\n📋 List: ${listName}`);
  console.log('─'.repeat(50));
  
  if (!fs.existsSync(schemaFile)) {
    console.log(`❌ Schema file not found: ${schemaFile}`);
    return;
  }
  
  try {
    const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
    const properties = schema.schema?.items?.properties || {};
    
    targetFields[listName].forEach(field => {
      console.log(`\n  ✓ ${field.fieldName} (${field.description})`);
      console.log(`    Field ID: ${field.fieldId}`);
      
      const fieldSchema = properties[field.fieldName];
      if (fieldSchema) {
        const isMultiChoice = Array.isArray(fieldSchema.items);
        const isChoice = fieldSchema['x-ms-capabilities']?.['x-ms-sp']?.IsChoice || 
                        fieldSchema.items?.['x-ms-capabilities']?.['x-ms-sp']?.IsChoice;
        
        console.log(`    Type: ${isMultiChoice ? 'Multi-Choice' : 'Single Choice'}`);
        console.log(`    Is Choice Field: ${isChoice ? 'Yes' : 'No'}`);
        
        // Find the dynamic values configuration
        const dynamicValuesPath = isMultiChoice 
          ? fieldSchema.items?.properties?.Value?.['x-ms-dynamic-values']
          : fieldSchema.properties?.Value?.['x-ms-dynamic-values'];
        
        if (dynamicValuesPath) {
          console.log(`    ✅ Uses GetEntityValues API`);
          console.log(`       Operation: ${dynamicValuesPath.operationId}`);
          console.log(`       Field ID param: ${dynamicValuesPath.parameters.id}`);
        }
      } else {
        console.log(`    ❌ Field not found in schema`);
      }
    });
  } catch (error) {
    console.log(`❌ Error reading schema: ${error.message}`);
  }
});

console.log('\n\n========================================');
console.log('NEXT STEPS TO GET ACTUAL VALUES');
console.log('========================================\n');

console.log('Option 1: Manual SharePoint Check');
console.log('─'.repeat(50));
console.log('1. Go to: https://saudimoe.sharepoint.com/sites/em');
console.log('2. Navigate to each list');
console.log('3. Go to List Settings > Click on field name');
console.log('4. View the choice values\n');

console.log('Option 2: Power Platform Connector (Requires Auth)');
console.log('─'.repeat(50));
console.log('The GetEntityValues API requires:');
console.log('  - Connection ID from power.config.json');
console.log('  - Authentication to SharePoint');
console.log('  - Dataset: https://saudimoe.sharepoint.com/sites/em');
console.log('  - Table: <List Name>');
console.log('  - Entity ID: <Field ID>\n');

console.log('API URLs would be:');
Object.keys(targetFields).forEach(listName => {
  targetFields[listName].forEach(field => {
    const apiUrl = `/_api/web/lists/getbytitle('${listName}')/fields(guid'${field.fieldId}')?$select=Title,Choices`;
    console.log(`\n${field.fieldName}:`);
    console.log(`  ${apiUrl}`);
  });
});

console.log('\n\nOption 3: Check Generated TypeScript Models');
console.log('─'.repeat(50));
console.log('Check if fallback values exist in:');
console.log('  - src/generated/models/');
console.log('  - src/generated/services/\n');

// Try to read generated service files
const generatedServicesDir = path.join(__dirname, 'src', 'generated', 'services');
if (fs.existsSync(generatedServicesDir)) {
  console.log('\n📁 Found Generated Services:');
  fs.readdirSync(generatedServicesDir).forEach(file => {
    console.log(`   - ${file}`);
  });
}

console.log('\n========================================\n');
