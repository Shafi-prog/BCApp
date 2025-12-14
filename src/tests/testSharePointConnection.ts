// SharePoint Connection Test Script
// Run with: npx ts-node src/tests/testSharePointConnection.ts

import SharePointService from '../services/sharepointService';

async function testSharePointConnection() {
  console.log('===========================================');
  console.log('SharePoint Connection Test');
  console.log('تجربة اتصال SharePoint');
  console.log('===========================================\n');

  // Test 1: Connection Test
  console.log('Test 1: Testing SharePoint Connection...');
  console.log('الاختبار 1: اختبار اتصال SharePoint...');
  
  const connectionResult = await SharePointService.testConnection();
  console.log(`Result: ${connectionResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Message: ${connectionResult.message}`);
  if (connectionResult.details) {
    console.log('Details:', connectionResult.details);
  }
  console.log('');

  // Test 2: List Available Lists
  console.log('Test 2: Getting available lists...');
  console.log('الاختبار 2: الحصول على القوائم المتاحة...');
  
  const lists = await SharePointService.getLists();
  console.log(`Found ${lists.length} lists:`);
  lists.forEach((list, index) => {
    console.log(`  ${index + 1}. ${list}`);
  });
  console.log('');

  // Test 3: Get School Info
  console.log('Test 3: Fetching school information...');
  console.log('الاختبار 3: جلب معلومات المدارس...');
  
  try {
    const schools = await SharePointService.getSchoolInfo();
    console.log(`✅ Found ${schools.length} schools`);
    schools.forEach(school => {
      console.log(`  - ${school.SchoolName} (${school.Level})`);
    });
  } catch (error) {
    console.log('❌ Failed to fetch schools:', error);
  }
  console.log('');

  // Test 4: Get Team Members
  console.log('Test 4: Fetching team members...');
  console.log('الاختبار 4: جلب أعضاء الفريق...');
  
  try {
    const members = await SharePointService.getTeamMembers();
    console.log(`✅ Found ${members.length} team members`);
    members.forEach(member => {
      console.log(`  - ${member.Title} (${member.JobRole})`);
    });
  } catch (error) {
    console.log('❌ Failed to fetch team members:', error);
  }
  console.log('');

  // Test 5: Get Drills
  console.log('Test 5: Fetching drills...');
  console.log('الاختبار 5: جلب التمارين...');
  
  try {
    const drills = await SharePointService.getDrills();
    console.log(`✅ Found ${drills.length} drills`);
    drills.forEach(drill => {
      console.log(`  - ${drill.Title} (${drill.ExecutionDate})`);
    });
  } catch (error) {
    console.log('❌ Failed to fetch drills:', error);
  }
  console.log('');

  // Test 6: Get Incidents
  console.log('Test 6: Fetching incidents...');
  console.log('الاختبار 6: جلب الحوادث...');
  
  try {
    const incidents = await SharePointService.getIncidents();
    console.log(`✅ Found ${incidents.length} incidents`);
    incidents.forEach(incident => {
      console.log(`  - ${incident.Title} (${incident.RiskLevel})`);
    });
  } catch (error) {
    console.log('❌ Failed to fetch incidents:', error);
  }
  console.log('');

  // Test 7: Get Training Programs
  console.log('Test 7: Fetching training programs...');
  console.log('الاختبار 7: جلب برامج التدريب...');
  
  try {
    const programs = await SharePointService.getTrainingPrograms();
    console.log(`✅ Found ${programs.length} training programs`);
    programs.forEach(program => {
      console.log(`  - ${program.Title} (${program.Status})`);
    });
  } catch (error) {
    console.log('❌ Failed to fetch training programs:', error);
  }
  console.log('');

  // Summary
  console.log('===========================================');
  console.log('Test Complete | اكتمل الاختبار');
  console.log('===========================================');
  console.log(`Environment: ${SharePointService.isLocalDevelopment() ? 'Local (Mock Data)' : 'SharePoint'}`);
  console.log(`البيئة: ${SharePointService.isLocalDevelopment() ? 'محلي (بيانات تجريبية)' : 'SharePoint'}`);
}

// Run tests
testSharePointConnection().catch(console.error);
