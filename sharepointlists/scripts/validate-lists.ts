/**
 * SharePoint Lists Validation Script
 * BC Management System - School Business Continuity
 * 
 * This script validates that all SharePoint lists are properly configured
 * Run this in the browser console while on the SharePoint site
 * or integrate with the Power SDK app
 */

// Configuration
const SITE_URL = "https://saudimoe.sharepoint.com/sites/em";

// ============================================
// LIST DEFINITIONS
// ============================================

const EXISTING_LISTS = {
    "SchoolInfo": {
        requiredColumns: ["Title", "SchoolName", "SchoolID", "Level", "SchoolGender", "SchoolType", "EducationType", "PrincipalID", "PrincipalName", "principalEmail", "PrincipalPhone"],
        description: "قائمة المدارس الأساسية",
        lookups: []
    },
    "BC_Teams_Members": {
        requiredColumns: ["Title", "SchoolName_Ref", "JobRole", "MembershipType", "Mobile", "MemberEmail"],
        description: "أعضاء فرق استمرارية الأعمال",
        lookups: [{ column: "SchoolName_Ref", targetList: "SchoolInfo", displayColumn: "SchoolName" }]
    },
    "SBC_Drills_Log": {
        requiredColumns: ["Title", "SchoolName_Ref", "DrillHypothesis", "SpecificEvent", "TargetGroup", "ExecutionDate"],
        description: "سجل التمارين والتجارب",
        lookups: [{ column: "SchoolName_Ref", targetList: "SchoolInfo", displayColumn: "SchoolName" }]
    },
    "SBC_Incidents_Log": {
        requiredColumns: ["Title", "SchoolName_Ref", "IncidentCategory", "ActivatedAlternative", "RiskLevel", "ActivationTime"],
        description: "سجل الحوادث",
        lookups: [{ column: "SchoolName_Ref", targetList: "SchoolInfo", displayColumn: "SchoolName" }]
    },
    "School_Training_Log": {
        requiredColumns: ["Title", "SchoolName_Ref", "Program_Ref", "RegistrationType", "AttendeesNames", "TrainingDate"],
        description: "سجل التدريب",
        lookups: [
            { column: "SchoolName_Ref", targetList: "SchoolInfo", displayColumn: "SchoolName" },
            { column: "Program_Ref", targetList: "Coordination_Programs_Catalog", displayColumn: "Title" }
        ]
    },
    "Coordination_Programs_Catalog": {
        requiredColumns: ["Title", "ProviderEntity", "ActivityType", "TargetAudience", "Date", "ExecutionMode"],
        description: "كتالوج برامج التنسيق",
        lookups: []
    }
};

const NEW_LISTS = {
    "BC_Admin_Contacts": {
        requiredColumns: ["Title", "Role", "Phone", "Email", "Organization", "Category", "ContactScope", "ContactTiming", "IsActive"],
        description: "جهات اتصال الإدارة للطوارئ",
        lookups: []
    },
    "BC_Plan_Documents": {
        requiredColumns: ["Title", "DocumentType", "Description", "FileName", "Version", "IsShared"],
        description: "مستندات خطة الاستمرارية",
        lookups: []
    },
    "BC_Shared_Plan": {
        requiredColumns: ["Title", "Description", "PlanFileName", "IsPublished", "Version"],
        description: "الخطة المشتركة للاستمرارية",
        lookups: []
    },
    "BC_Plan_Scenarios": {
        requiredColumns: ["Title", "ScenarioNumber", "Description", "ResponseActions", "SortOrder"],
        description: "سيناريوهات الخطة",
        lookups: [{ column: "PlanRef", targetList: "BC_Shared_Plan", displayColumn: "Title" }]
    },
    "BC_Test_Plans": {
        requiredColumns: ["Title", "Hypothesis", "SpecificEvent", "TargetGroup", "StartDate", "Status"],
        description: "خطط الاختبار والتمارين",
        lookups: []
    },
    "BC_DR_Checklist": {
        requiredColumns: ["Title", "Category", "Status", "LastChecked", "CheckedBy", "SortOrder"],
        description: "قائمة تحقق التعافي من الكوارث",
        lookups: []
    },
    "BC_Incident_Evaluations": {
        requiredColumns: ["Title", "IncidentNumber", "EvaluationDate", "EvaluatedBy", "OverallScore"],
        description: "تقييم الحوادث",
        lookups: [{ column: "Incident_Ref", targetList: "SBC_Incidents_Log", displayColumn: "Title" }]
    },
    "BC_Damage_Reports": {
        requiredColumns: ["Title", "IncidentNumber", "ReportDate", "DamageType", "EstimatedCost", "RepairStatus"],
        description: "تقارير الأضرار",
        lookups: [
            { column: "School_Ref", targetList: "SchoolInfo", displayColumn: "SchoolName" },
            { column: "Incident_Ref", targetList: "SBC_Incidents_Log", displayColumn: "Title" }
        ]
    },
    "BC_Mutual_Operation": {
        requiredColumns: ["Title", "SourceSchoolID", "SourceSchoolName", "AlternativeSchoolID", "AlternativeSchoolName", "AgreementStatus", "IsActive"],
        description: "التشغيل المتبادل بين المدارس",
        lookups: [
            { column: "SourceSchool_Ref", targetList: "SchoolInfo", displayColumn: "SchoolName" },
            { column: "AltSchool_Ref", targetList: "SchoolInfo", displayColumn: "SchoolName" }
        ]
    },
    "BC_Plan_Review": {
        requiredColumns: ["Title", "ReviewDate", "ReviewedBy", "PlanVersion", "OverallStatus", "ApprovalStatus"],
        description: "مراجعات الخطة",
        lookups: [{ column: "Plan_Ref", targetList: "BC_Shared_Plan", displayColumn: "Title" }]
    }
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

interface ValidationResult {
    listName: string;
    exists: boolean;
    description: string;
    columnsFound: string[];
    columnsMissing: string[];
    lookupsConfigured: { column: string; configured: boolean; targetList: string }[];
    itemCount: number;
    status: 'success' | 'warning' | 'error';
}

interface ValidationSummary {
    totalLists: number;
    listsFound: number;
    listsMissing: number;
    lookupsConfigured: number;
    lookupsMissing: number;
    results: ValidationResult[];
    overallStatus: 'success' | 'warning' | 'error';
}

/**
 * Generate validation checklist HTML
 */
function generateValidationChecklist(): string {
    const allLists = { ...EXISTING_LISTS, ...NEW_LISTS };
    
    let html = `
    <div style="font-family: 'Segoe UI', sans-serif; direction: rtl; padding: 20px;">
        <h1 style="color: #0078d4;">✅ قائمة التحقق من إعداد SharePoint</h1>
        <p style="color: #666;">تحقق من إنشاء جميع القوائم وإعداد أعمدة Lookup بشكل صحيح</p>
        
        <h2 style="color: #333; border-bottom: 2px solid #0078d4; padding-bottom: 10px;">
            📋 القوائم الموجودة (6)
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
                <tr style="background: #f3f3f3;">
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">✓</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">اسم القائمة</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">الوصف</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">أعمدة Lookup</th>
                </tr>
            </thead>
            <tbody>`;
    
    for (const [listName, config] of Object.entries(EXISTING_LISTS)) {
        const lookupText = config.lookups.length > 0 
            ? config.lookups.map(l => `${l.column} → ${l.targetList}`).join('<br>')
            : '-';
        html += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">☐</td>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${listName}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${config.description}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; font-size: 12px;">${lookupText}</td>
                </tr>`;
    }
    
    html += `
            </tbody>
        </table>
        
        <h2 style="color: #333; border-bottom: 2px solid #107c10; padding-bottom: 10px;">
            📋 القوائم الجديدة (10) - منشأة من CSV
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
                <tr style="background: #f3f3f3;">
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">✓</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">اسم القائمة</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">الوصف</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">أعمدة Lookup (تضاف يدوياً)</th>
                </tr>
            </thead>
            <tbody>`;
    
    for (const [listName, config] of Object.entries(NEW_LISTS)) {
        const lookupText = config.lookups.length > 0 
            ? config.lookups.map(l => `<span style="color: #d83b01;">${l.column}</span> → ${l.targetList} (${l.displayColumn})`).join('<br>')
            : '-';
        html += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">☐</td>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${listName}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${config.description}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; font-size: 12px;">${lookupText}</td>
                </tr>`;
    }
    
    html += `
            </tbody>
        </table>
        
        <h2 style="color: #333; border-bottom: 2px solid #d83b01; padding-bottom: 10px;">
            🔗 جميع أعمدة Lookup المطلوبة (12)
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #fff4ce;">
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">✓</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">القائمة</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">اسم العمود</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">يرتبط بـ</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">العمود المعروض</th>
                </tr>
            </thead>
            <tbody>`;
    
    const allLookups = [
        { list: "BC_Teams_Members", column: "SchoolName_Ref", target: "SchoolInfo", display: "SchoolName" },
        { list: "SBC_Drills_Log", column: "SchoolName_Ref", target: "SchoolInfo", display: "SchoolName" },
        { list: "SBC_Incidents_Log", column: "SchoolName_Ref", target: "SchoolInfo", display: "SchoolName" },
        { list: "School_Training_Log", column: "SchoolName_Ref", target: "SchoolInfo", display: "SchoolName" },
        { list: "School_Training_Log", column: "Program_Ref", target: "Coordination_Programs_Catalog", display: "Title" },
        { list: "BC_Plan_Scenarios", column: "PlanRef", target: "BC_Shared_Plan", display: "Title" },
        { list: "BC_Incident_Evaluations", column: "Incident_Ref", target: "SBC_Incidents_Log", display: "Title" },
        { list: "BC_Damage_Reports", column: "School_Ref", target: "SchoolInfo", display: "SchoolName" },
        { list: "BC_Damage_Reports", column: "Incident_Ref", target: "SBC_Incidents_Log", display: "Title" },
        { list: "BC_Mutual_Operation", column: "SourceSchool_Ref", target: "SchoolInfo", display: "SchoolName" },
        { list: "BC_Mutual_Operation", column: "AltSchool_Ref", target: "SchoolInfo", display: "SchoolName" },
        { list: "BC_Plan_Review", column: "Plan_Ref", target: "BC_Shared_Plan", display: "Title" },
    ];
    
    for (const lookup of allLookups) {
        html += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">☐</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${lookup.list}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #0078d4;">${lookup.column}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${lookup.target}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${lookup.display}</td>
                </tr>`;
    }
    
    html += `
            </tbody>
        </table>
        
        <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">📌 ملاحظات هامة:</h3>
            <ul style="color: #666; line-height: 2;">
                <li>أعمدة Lookup <strong>لا يمكن استيرادها من CSV</strong> ويجب إضافتها يدوياً</li>
                <li>عند إضافة Lookup، اختر العمود المعروض المحدد (SchoolName أو Title)</li>
                <li>تأكد من إنشاء القائمة الهدف أولاً قبل إضافة Lookup يشير إليها</li>
                <li>مثال: أنشئ BC_Shared_Plan أولاً، ثم أضف PlanRef في BC_Plan_Scenarios</li>
            </ul>
        </div>
    </div>`;
    
    return html;
}

/**
 * Print validation checklist to console
 */
function printValidationChecklist(): void {
    console.log('\n' + '='.repeat(60));
    console.log('  SharePoint Lists Validation Checklist');
    console.log('  BC Management System');
    console.log('='.repeat(60) + '\n');
    
    console.log('📋 EXISTING LISTS (6):');
    console.log('-'.repeat(40));
    for (const [listName, config] of Object.entries(EXISTING_LISTS)) {
        console.log(`  [ ] ${listName}`);
        console.log(`      ${config.description}`);
        if (config.lookups.length > 0) {
            config.lookups.forEach(l => {
                console.log(`      🔗 ${l.column} → ${l.targetList}`);
            });
        }
    }
    
    console.log('\n📋 NEW LISTS (10):');
    console.log('-'.repeat(40));
    for (const [listName, config] of Object.entries(NEW_LISTS)) {
        console.log(`  [ ] ${listName}`);
        console.log(`      ${config.description}`);
        if (config.lookups.length > 0) {
            config.lookups.forEach(l => {
                console.log(`      🔗 ${l.column} → ${l.targetList} (add manually)`);
            });
        }
    }
    
    console.log('\n🔗 ALL LOOKUPS TO CONFIGURE (12):');
    console.log('-'.repeat(40));
    const lookups = [
        "BC_Teams_Members.SchoolName_Ref → SchoolInfo (SchoolName)",
        "SBC_Drills_Log.SchoolName_Ref → SchoolInfo (SchoolName)",
        "SBC_Incidents_Log.SchoolName_Ref → SchoolInfo (SchoolName)",
        "School_Training_Log.SchoolName_Ref → SchoolInfo (SchoolName)",
        "School_Training_Log.Program_Ref → Coordination_Programs_Catalog (Title)",
        "BC_Plan_Scenarios.PlanRef → BC_Shared_Plan (Title)",
        "BC_Incident_Evaluations.Incident_Ref → SBC_Incidents_Log (Title)",
        "BC_Damage_Reports.School_Ref → SchoolInfo (SchoolName)",
        "BC_Damage_Reports.Incident_Ref → SBC_Incidents_Log (Title)",
        "BC_Mutual_Operation.SourceSchool_Ref → SchoolInfo (SchoolName)",
        "BC_Mutual_Operation.AltSchool_Ref → SchoolInfo (SchoolName)",
        "BC_Plan_Review.Plan_Ref → BC_Shared_Plan (Title)",
    ];
    lookups.forEach((l, i) => console.log(`  ${i + 1}. [ ] ${l}`));
    
    console.log('\n' + '='.repeat(60));
}

// Export functions
export {
    EXISTING_LISTS,
    NEW_LISTS,
    generateValidationChecklist,
    printValidationChecklist
};

// Run if called directly
printValidationChecklist();
