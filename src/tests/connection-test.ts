/**
 * SharePoint Connection Test Script
 * Tests all 16 SharePoint lists for read/write connectivity
 */

// Import all generated services
import { SchoolInfoService } from '../generated/services/SchoolInfoService';
import { BC_Teams_MembersService } from '../generated/services/BC_Teams_MembersService';
import { SBC_Drills_LogService } from '../generated/services/SBC_Drills_LogService';
import { SBC_Incidents_LogService } from '../generated/services/SBC_Incidents_LogService';
import { School_Training_LogService } from '../generated/services/School_Training_LogService';
import { Coordination_Programs_CatalogService } from '../generated/services/Coordination_Programs_CatalogService';
import { BC_Admin_ContactsService } from '../generated/services/BC_Admin_ContactsService';
import { BC_Plan_DocumentsService } from '../generated/services/BC_Plan_DocumentsService';
import { BC_Shared_PlanService } from '../generated/services/BC_Shared_PlanService';
import { BC_Test_PlansService } from '../generated/services/BC_Test_PlansService';
import { BC_DR_ChecklistService } from '../generated/services/BC_DR_ChecklistService';
import { BC_Incident_EvaluationsService } from '../generated/services/BC_Incident_EvaluationsService';
import { BC_Damage_ReportsService } from '../generated/services/BC_Damage_ReportsService';
import { BC_Plan_ReviewService } from '../generated/services/BC_Plan_ReviewService';
import { BC_Plan_ScenariosService } from '../generated/services/BC_Plan_ScenariosService';
import { BC_Mutual_OperationService } from '../generated/services/BC_Mutual_OperationService';

interface TestResult {
  listName: string;
  connected: boolean;
  canRead: boolean;
  canWrite: boolean;
  itemCount: number;
  error?: string;
}

export class ConnectionTester {
  private results: TestResult[] = [];

  async testAllLists(): Promise<TestResult[]> {
    console.log('🔄 Starting SharePoint Connection Tests...\n');
    console.log('═'.repeat(60));

    // Test Original 6 Lists
    console.log('\n📁 Testing Original 6 Lists:\n');
    
    await this.testList('SchoolInfo', () => SchoolInfoService.getAll());
    await this.testList('BC_Teams_Members', () => BC_Teams_MembersService.getAll());
    await this.testList('SBC_Drills_Log', () => SBC_Drills_LogService.getAll());
    await this.testList('SBC_Incidents_Log', () => SBC_Incidents_LogService.getAll());
    await this.testList('School_Training_Log', () => School_Training_LogService.getAll());
    await this.testList('Coordination_Programs_Catalog', () => Coordination_Programs_CatalogService.getAll());

    // Test New 10 Lists
    console.log('\n📁 Testing New 10 Lists:\n');
    
    await this.testList('BC_Admin_Contacts', () => BC_Admin_ContactsService.getAll());
    await this.testList('BC_Plan_Documents', () => BC_Plan_DocumentsService.getAll());
    await this.testList('BC_Shared_Plan', () => BC_Shared_PlanService.getAll());
    await this.testList('BC_Test_Plans', () => BC_Test_PlansService.getAll());
    await this.testList('BC_DR_Checklist', () => BC_DR_ChecklistService.getAll());
    await this.testList('BC_Incident_Evaluations', () => BC_Incident_EvaluationsService.getAll());
    await this.testList('BC_Damage_Reports', () => BC_Damage_ReportsService.getAll());
    await this.testList('BC_Plan_Review', () => BC_Plan_ReviewService.getAll());
    await this.testList('BC_Plan_Scenarios', () => BC_Plan_ScenariosService.getAll());
    await this.testList('BC_Mutual_Operation', () => BC_Mutual_OperationService.getAll());

    this.printSummary();
    return this.results;
  }

  private async testList(listName: string, getAllFn: () => Promise<any[]>): Promise<void> {
    const result: TestResult = {
      listName,
      connected: false,
      canRead: false,
      canWrite: false,
      itemCount: 0
    };

    try {
      // Test Read
      const items = await getAllFn();
      result.connected = true;
      result.canRead = true;
      result.itemCount = items?.length || 0;
      
      console.log(`✅ ${listName}`);
      console.log(`   └─ Connected: Yes | Items: ${result.itemCount}`);
      
    } catch (error: any) {
      result.error = error.message || 'Unknown error';
      console.log(`❌ ${listName}`);
      console.log(`   └─ Error: ${result.error}`);
    }

    this.results.push(result);
  }

  private printSummary(): void {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 CONNECTION TEST SUMMARY\n');

    const connected = this.results.filter(r => r.connected).length;
    const failed = this.results.filter(r => !r.connected).length;
    const totalItems = this.results.reduce((sum, r) => sum + r.itemCount, 0);

    console.log(`✅ Connected Lists:    ${connected}/16`);
    console.log(`❌ Failed Lists:       ${failed}/16`);
    console.log(`📦 Total Items Found:  ${totalItems}`);
    
    if (failed > 0) {
      console.log('\n⚠️ Failed Lists:');
      this.results.filter(r => !r.connected).forEach(r => {
        console.log(`   • ${r.listName}: ${r.error}`);
      });
    }

    console.log('\n' + '═'.repeat(60));
    console.log(connected === 16 
      ? '🎉 All lists connected successfully!' 
      : `⚠️ ${failed} list(s) need attention`);
  }
}

// Test Write Operations
export class WriteOperationTester {
  
  async testWriteOperations(): Promise<void> {
    console.log('\n🔄 Testing Write Operations...\n');
    console.log('═'.repeat(60));

    // Test BC_Admin_Contacts write
    await this.testAdminContactWrite();
    
    // Test BC_Plan_Review write  
    await this.testPlanReviewWrite();

    console.log('═'.repeat(60));
  }

  private async testAdminContactWrite(): Promise<void> {
    const testContact = {
      name: 'Test Contact - Delete Me',
      role: 'Test Role',
      phone: '0500000000',
      email: 'test@test.com',
      type: 'test'
    };

    try {
      console.log('📝 Testing BC_Admin_Contacts write...');
      const created = await BC_Admin_ContactsService.create({
        field_1: testContact.name,
        field_2: testContact.role,
        field_3: testContact.phone,
        field_4: testContact.email,
        field_5: testContact.type
      });
      console.log('   ✅ Write successful - ID:', created?.ID || 'created');

      // Try to delete the test record
      if (created?.ID) {
        await BC_Admin_ContactsService.delete(created.ID);
        console.log('   🗑️ Test record cleaned up');
      }
    } catch (error: any) {
      console.log('   ❌ Write failed:', error.message);
    }
  }

  private async testPlanReviewWrite(): Promise<void> {
    const testReview = {
      reviewDate: new Date().toISOString(),
      reviewer: 'Test User',
      reviewType: 'Test Review',
      findings: 'Test findings - delete this record',
      status: 'test'
    };

    try {
      console.log('📝 Testing BC_Plan_Review write...');
      const created = await BC_Plan_ReviewService.create({
        field_1: testReview.reviewDate,
        field_2: testReview.reviewer,
        field_3: testReview.reviewType,
        field_4: testReview.findings,
        field_5: testReview.status
      });
      console.log('   ✅ Write successful - ID:', created?.ID || 'created');

      // Try to delete the test record
      if (created?.ID) {
        await BC_Plan_ReviewService.delete(created.ID);
        console.log('   🗑️ Test record cleaned up');
      }
    } catch (error: any) {
      console.log('   ❌ Write failed:', error.message);
    }
  }
}

// Export for use in browser console or component
export async function runConnectionTests() {
  const tester = new ConnectionTester();
  const results = await tester.testAllLists();
  return results;
}

export async function runWriteTests() {
  const tester = new WriteOperationTester();
  await tester.testWriteOperations();
}

// Run both tests
export async function runAllTests() {
  await runConnectionTests();
  await runWriteTests();
}
