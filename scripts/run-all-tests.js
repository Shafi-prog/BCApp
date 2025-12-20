#!/usr/bin/env node

/**
 * Comprehensive App Test Runner
 * 
 * Executes all validation tests sequentially and generates a final report
 * Tests:
 * 1. test-drills.js - Drill functionality
 * 2. validate-schema.js - SharePoint schema
 * 3. validate-mapping.js - Field mappings
 * 4. test-data-integrity.js - Data save/restore
 * 5. test-buttons.js - Button functionality
 * 6. test-cards.js - Card data sources
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('🧪 COMPREHENSIVE APP TEST RUNNER');
console.log('='.repeat(70) + '\n');

const tests = [
  {
    name: 'Drill Functionality Test',
    file: 'test-drills.js',
    description: 'Tests date validation, execution validation, constants, and UI elements'
  },
  {
    name: 'SharePoint Schema Validation',
    file: 'validate-schema.js',
    description: 'Validates SharePoint model definitions and field structures'
  },
  {
    name: 'Field Mapping Validation',
    file: 'validate-mapping.js',
    description: 'Verifies all SharePoint fields map correctly to frontend properties'
  },
  {
    name: 'Data Integrity Test',
    file: 'test-data-integrity.js',
    description: 'Ensures data is preserved during save/restore operations'
  },
  {
    name: 'Button Functionality Audit',
    file: 'test-buttons.js',
    description: 'Validates all buttons have handlers and proper functionality'
  },
  {
    name: 'Card Data Source Validation',
    file: 'test-cards.js',
    description: 'Verifies card components display correct data from sources'
  }
];

const results = [];
let totalPassed = 0;
let totalTests = 0;

// Execute each test
tests.forEach((test, index) => {
  const testNum = index + 1;
  console.log(`\n[${testNum}/${tests.length}] Running: ${test.name}`);
  console.log('-'.repeat(70));
  console.log(`📝 ${test.description}`);
  console.log();
  
  const scriptPath = path.join(__dirname, test.file);
  
  if (!fs.existsSync(scriptPath)) {
    console.log(`❌ Test file not found: ${test.file}\n`);
    results.push({
      name: test.name,
      status: 'FAILED',
      reason: 'Test file not found'
    });
    return;
  }
  
  try {
    const output = execSync(`node "${scriptPath}"`, {
      cwd: __dirname,
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    console.log(output);
    
    results.push({
      name: test.name,
      status: 'PASSED',
      output: output
    });
    totalPassed++;
    totalTests++;
    
  } catch (error) {
    console.log(`❌ Test execution failed`);
    console.log(error.stdout || '');
    console.log(error.stderr || '');
    
    results.push({
      name: test.name,
      status: 'FAILED',
      reason: error.message,
      output: error.stdout
    });
    totalTests++;
  }
});

// Generate final report
console.log('\n\n' + '='.repeat(70));
console.log('📊 COMPREHENSIVE TEST REPORT');
console.log('='.repeat(70) + '\n');

console.log('TEST RESULTS:\n');
results.forEach((result, index) => {
  const status = result.status === 'PASSED' ? '✅' : '❌';
  console.log(`${status} ${index + 1}. ${result.name}`);
  if (result.reason) {
    console.log(`   Reason: ${result.reason}`);
  }
});

console.log('\n' + '-'.repeat(70));
console.log(`\nTotal Tests: ${totalTests}`);
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalTests - totalPassed}`);
console.log(`Success Rate: ${totalTests > 0 ? ((totalPassed/totalTests)*100).toFixed(1) : 0}%\n`);

if (totalPassed === totalTests) {
  console.log('✅ ALL TESTS PASSED!');
  console.log('\n🎉 App Comprehensive Validation Complete');
  console.log('\n✓ All drill functionality working correctly');
  console.log('✓ SharePoint schema properly defined');
  console.log('✓ All fields correctly mapped');
  console.log('✓ Data integrity maintained');
  console.log('✓ All buttons functional');
  console.log('✓ Card data sources correct');
  console.log('✓ No data loss detected');
  console.log('✓ No missing columns or fields\n');
  
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. See details above.\n');
  process.exit(1);
}
