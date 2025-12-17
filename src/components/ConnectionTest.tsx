import React, { useState, useEffect } from 'react';

// Import services
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
import { SchoolInfoService } from '../generated/services/SchoolInfoService';
import { BC_Teams_MembersService } from '../generated/services/BC_Teams_MembersService';
import { SBC_Drills_LogService } from '../generated/services/SBC_Drills_LogService';
import { SBC_Incidents_LogService } from '../generated/services/SBC_Incidents_LogService';
import { School_Training_LogService } from '../generated/services/School_Training_LogService';
import { Coordination_Programs_CatalogService } from '../generated/services/Coordination_Programs_CatalogService';

interface TestResult {
  listName: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  itemCount?: number;
}

export default function ConnectionTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [writeTest, setWriteTest] = useState<TestResult | null>(null);
  const [isPowerApps, setIsPowerApps] = useState(false);

  useEffect(() => {
    // Check if running in Power Apps environment
    const checkEnvironment = () => {
      try {
        const win = window as any;
        const hasPowerApps = typeof window !== 'undefined' && 
          (win.PowerApps || win.Xrm || document.querySelector('[data-control-name]'));
        setIsPowerApps(!!hasPowerApps);
      } catch {
        setIsPowerApps(false);
      }
    };
    checkEnvironment();
  }, []);

  const allLists = [
    // Original 6 lists
    { name: 'SchoolInfo', service: SchoolInfoService },
    { name: 'BC_Teams_Members', service: BC_Teams_MembersService },
    { name: 'SBC_Drills_Log', service: SBC_Drills_LogService },
    { name: 'SBC_Incidents_Log', service: SBC_Incidents_LogService },
    { name: 'School_Training_Log', service: School_Training_LogService },
    { name: 'Coordination_Programs_Catalog', service: Coordination_Programs_CatalogService },
    // New 10 lists
    { name: 'BC_Admin_Contacts', service: BC_Admin_ContactsService },
    { name: 'BC_Plan_Documents', service: BC_Plan_DocumentsService },
    { name: 'BC_Shared_Plan', service: BC_Shared_PlanService },
    { name: 'BC_Test_Plans', service: BC_Test_PlansService },
    { name: 'BC_DR_Checklist', service: BC_DR_ChecklistService },
    { name: 'BC_Incident_Evaluations', service: BC_Incident_EvaluationsService },
    { name: 'BC_Damage_Reports', service: BC_Damage_ReportsService },
    { name: 'BC_Plan_Review', service: BC_Plan_ReviewService },
    { name: 'BC_Plan_Scenarios', service: BC_Plan_ScenariosService },
    { name: 'BC_Mutual_Operation', service: BC_Mutual_OperationService },
  ];

  const runConnectionTests = async () => {
    setTesting(true);
    const newResults: TestResult[] = [];

    for (const list of allLists) {
      const result: TestResult = {
        listName: list.name,
        status: 'pending',
        message: 'Testing...'
      };
      newResults.push(result);
      setResults([...newResults]);

      try {
        const response = await list.service.getAll();
        const items = response?.data || response || [];
        result.status = 'success';
        result.message = `Connected successfully`;
        result.itemCount = Array.isArray(items) ? items.length : 0;
      } catch (error: any) {
        result.status = 'error';
        result.message = error.message || 'Connection failed';
      }

      newResults[newResults.length - 1] = result;
      setResults([...newResults]);
    }

    setTesting(false);
  };

  const runWriteTest = async () => {
    setWriteTest({
      listName: 'BC_Admin_Contacts',
      status: 'pending',
      message: 'Creating test record...'
    });

    try {
      // Create test record
      const testData = {
        Title: 'Test Entry - ' + new Date().toISOString(),
        field_2: 500000000,
        field_3: 'test@test.com'
      };

      const createResponse = await BC_Admin_ContactsService.create(testData);
      const createdId = createResponse?.data?.ID;

      if (createdId) {
        // Try to delete it
        await BC_Admin_ContactsService.delete(createdId.toString());
        setWriteTest({
          listName: 'BC_Admin_Contacts',
          status: 'success',
          message: `Write test passed! Created and deleted record ID: ${createdId}`
        });
      } else {
        setWriteTest({
          listName: 'BC_Admin_Contacts',
          status: 'success',
          message: 'Record created but ID not returned. Check SharePoint for test entry.'
        });
      }
    } catch (error: any) {
      setWriteTest({
        listName: 'BC_Admin_Contacts',
        status: 'error',
        message: `Write test failed: ${error.message}`
      });
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">اختبار اتصال SharePoint</h1>
      
      {/* Environment Status */}
      <div className={`mb-4 p-4 rounded-lg ${isPowerApps ? 'bg-green-100' : 'bg-yellow-100'}`}>
        <h3 className="font-semibold">
          البيئة: {isPowerApps ? '✅ Power Apps (متصل)' : '⚠️ متصفح محلي (للاختبار فقط)'}
        </h3>
        <p className="text-sm text-gray-600">
          {isPowerApps 
            ? 'التطبيق يعمل داخل Power Apps ويمكنه الاتصال بـ SharePoint' 
            : 'التطبيق يعمل في المتصفح. اتصال SharePoint يتطلب تشغيل التطبيق داخل Power Apps'}
        </p>
      </div>

      {/* Test Buttons */}
      <div className="mb-6 space-x-2 space-x-reverse">
        <button 
          onClick={runConnectionTests}
          disabled={testing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {testing ? 'جاري الاختبار...' : '🔄 اختبار الاتصال (قراءة)'}
        </button>
        <button 
          onClick={runWriteTest}
          disabled={testing}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          📝 اختبار الكتابة
        </button>
      </div>

      {/* Summary */}
      {results.length > 0 && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold">ملخص النتائج:</h3>
          <p>✅ نجح: {successCount} / {results.length}</p>
          <p>❌ فشل: {errorCount} / {results.length}</p>
        </div>
      )}

      {/* Write Test Result */}
      {writeTest && (
        <div className={`mb-4 p-4 rounded-lg ${
          writeTest.status === 'success' ? 'bg-green-100' : 
          writeTest.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
        }`}>
          <h3 className="font-semibold">نتيجة اختبار الكتابة:</h3>
          <p>{writeTest.status === 'pending' ? '⏳' : writeTest.status === 'success' ? '✅' : '❌'} {writeTest.message}</p>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border-b text-right">القائمة</th>
                <th className="px-4 py-2 border-b text-center">الحالة</th>
                <th className="px-4 py-2 border-b text-center">عدد السجلات</th>
                <th className="px-4 py-2 border-b text-right">الرسالة</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 border-b font-mono text-sm">{result.listName}</td>
                  <td className="px-4 py-2 border-b text-center">
                    {result.status === 'pending' ? '⏳' : 
                     result.status === 'success' ? '✅' : '❌'}
                  </td>
                  <td className="px-4 py-2 border-b text-center">
                    {result.itemCount !== undefined ? result.itemCount : '-'}
                  </td>
                  <td className="px-4 py-2 border-b text-sm">
                    <span className={result.status === 'error' ? 'text-red-600' : ''}>
                      {result.message}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">📋 تعليمات الاختبار:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>انقر على "اختبار الاتصال" لفحص جميع القوائم الـ 16</li>
          <li>انقر على "اختبار الكتابة" للتأكد من إمكانية إضافة سجلات</li>
          <li>إذا ظهرت أخطاء في المتصفح المحلي، فهذا طبيعي - الاتصال يعمل فقط داخل Power Apps</li>
          <li>لاختبار الاتصال الفعلي، قم بنشر التطبيق باستخدام <code>pac code push</code></li>
        </ol>
      </div>
    </div>
  );
}
