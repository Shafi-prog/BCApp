/**
 * أعمدة قوائم SharePoint المطلوبة لنظام استمرارية الأعمال
 * SharePoint Lists Schema for BC Management System
 */

// ═══════════════════════════════════════════════════════════════════════════
// قائمة 1: BC_Master_Plan - خطة استمرارية الأعمال الرئيسية (المهمة 1)
// ═══════════════════════════════════════════════════════════════════════════
export const BC_Master_Plan_Schema = {
  listName: 'BC_Master_Plan',
  listNameAr: 'خطة استمرارية الأعمال',
  description: 'الخطة الرئيسية لاستمرارية العملية التعليمية',
  relatedTasks: [1],  // المهمة 1
  columns: [
    // الجزء 1.1: إعداد الخطة الأساسية
    { name: 'Title', type: 'Text', required: true, maxLength: 255, description: 'عنوان الخطة', subTask: '1.1' },
    { name: 'Description', type: 'Note', required: true, description: 'وصف الخطة', subTask: '1.1' },
    { name: 'PlanFileName', type: 'Text', required: true, maxLength: 255, description: 'اسم ملف الخطة المرفق', subTask: '1.1' },
    { name: 'PlanFileUploadDate', type: 'DateTime', required: false, description: 'تاريخ رفع الملف', subTask: '1.1' },
    
    // الجزء 1.2: السيناريوهات
    { name: 'ScenariosJSON', type: 'Note', required: true, description: 'السيناريوهات الخمسة بصيغة JSON', subTask: '1.2' },
    { name: 'Scenario1_Complete', type: 'Boolean', required: false, description: 'سيناريو تعذر التعليم في المبنى', subTask: '1.2' },
    { name: 'Scenario2_Complete', type: 'Boolean', required: false, description: 'سيناريو تعطل المنصات', subTask: '1.2' },
    { name: 'Scenario3_Complete', type: 'Boolean', required: false, description: 'سيناريو تعطل القنوات', subTask: '1.2' },
    { name: 'Scenario4_Complete', type: 'Boolean', required: false, description: 'سيناريو تعطل شامل', subTask: '1.2' },
    { name: 'Scenario5_Complete', type: 'Boolean', required: false, description: 'سيناريو نقص الكادر', subTask: '1.2' },
    
    // الجزء 1.3: النشر
    { name: 'Status', type: 'Choice', required: true, choices: ['مسودة', 'منشورة', 'مؤرشفة'], description: 'حالة الخطة', subTask: '1.3' },
    { name: 'IsPublished', type: 'Boolean', required: true, default: false, description: 'منشورة للمدارس', subTask: '1.3' },
    { name: 'PublishDate', type: 'DateTime', required: false, description: 'تاريخ النشر', subTask: '1.3' },
    { name: 'Version', type: 'Text', required: false, maxLength: 10, description: 'رقم الإصدار (v1.0)', subTask: '1.3' },
    
    // الجزء 1.4: التحديث الدوري
    { name: 'ReviewPeriodMonths', type: 'Choice', required: false, choices: ['3', '6', '12'], description: 'فترة المراجعة (أشهر)', subTask: '1.4' },
    { name: 'NextReviewDate', type: 'DateTime', required: false, description: 'تاريخ المراجعة القادمة', subTask: '1.4' },
    { name: 'PublishHistoryJSON', type: 'Note', required: false, description: 'سجل التحديثات بصيغة JSON', subTask: '1.4' },
    { name: 'LastUpdated', type: 'DateTime', required: true, description: 'آخر تحديث' },
    
    // ملاحظات داخلية
    { name: 'AdminNotes', type: 'Note', required: false, description: 'ملاحظات الأدمن (مخفية عن المدارس)' },
  ],
  permissions: {
    admin: 'FullControl',
    supervisors: 'Read',
    schools: 'Read (Published only)'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// قائمة 2: BC_Plan_Reviews - مراجعة الخطط وإجراءات الاستجابة (المهمة 7)
// ═══════════════════════════════════════════════════════════════════════════
export const BC_Plan_Reviews_Schema = {
  listName: 'BC_Plan_Reviews',
  listNameAr: 'مراجعة الخطط وإجراءات الاستجابة',
  description: 'المشاركة في مراجعة خطط العمل ووضع إجراءات فعالة للاستجابة للاضطرابات',
  relatedTasks: [7],  // المهمة 7
  linkedToTask: 1,  // مرتبطة بالمهمة 1
  columns: [
    // الجزء 7.1: مراجعة خطط العمل
    { name: 'Title', type: 'Text', required: true, maxLength: 255, description: 'عنوان المراجعة', subTask: '7.1' },
    { name: 'ReviewFileName', type: 'Text', required: true, maxLength: 255, description: 'اسم ملف/تقرير المراجعة', subTask: '7.1' },
    { name: 'ReviewFileUploadDate', type: 'DateTime', required: false, description: 'تاريخ رفع ملف المراجعة', subTask: '7.1' },
    { name: 'ReviewDate', type: 'DateTime', required: true, description: 'تاريخ المراجعة', subTask: '7.1' },
    { name: 'ReviewNotes', type: 'Note', required: false, description: 'ملاحظات المراجعة', subTask: '7.1' },
    { name: 'ReviewRecommendations', type: 'Note', required: true, description: 'التوصيات الناتجة عن المراجعة', subTask: '7.1' },
    
    // الجزء 7.2: إجراءات الاستجابة للاضطرابات
    { name: 'Response_Scenario1', type: 'Note', required: true, description: 'إجراءات الاستجابة - تعطل المبنى', subTask: '7.2' },
    { name: 'Response_Scenario2', type: 'Note', required: true, description: 'إجراءات الاستجابة - تعطل المنصات', subTask: '7.2' },
    { name: 'Response_Scenario3', type: 'Note', required: true, description: 'إجراءات الاستجابة - تعطل القنوات', subTask: '7.2' },
    { name: 'Response_Scenario4', type: 'Note', required: true, description: 'إجراءات الاستجابة - تعطل شامل', subTask: '7.2' },
    { name: 'Response_Scenario5', type: 'Note', required: true, description: 'إجراءات الاستجابة - نقص الكادر', subTask: '7.2' },
    
    // الجزء 7.3: توثيق واعتماد الإجراءات
    { name: 'ProceduresFileName', type: 'Text', required: true, maxLength: 255, description: 'اسم ملف إجراءات الاستجابة', subTask: '7.3' },
    { name: 'ProceduresFileUploadDate', type: 'DateTime', required: false, description: 'تاريخ رفع ملف الإجراءات', subTask: '7.3' },
    { name: 'ApprovalDate', type: 'DateTime', required: true, description: 'تاريخ الاعتماد', subTask: '7.3' },
    { name: 'ApprovedBy', type: 'Text', required: true, maxLength: 100, description: 'الجهة المعتمدة', subTask: '7.3' },
    
    // حقول عامة
    { name: 'PlanRef', type: 'Lookup', required: true, lookupList: 'BC_Master_Plan', description: 'مرجع الخطة المراجَعة' },
    { name: 'LastUpdated', type: 'DateTime', required: true, description: 'آخر تحديث' },
  ],
  permissions: {
    admin: 'FullControl',
    supervisors: 'Contribute',
    schools: 'Read'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// قائمة 3: BC_Tasks_Status - حالة إنجاز المهام
// ═══════════════════════════════════════════════════════════════════════════
export const BC_Tasks_Status_Schema = {
  listName: 'BC_Tasks_Status',
  listNameAr: 'حالة إنجاز المهام',
  description: 'متابعة حالة إنجاز المهام الـ 25',
  columns: [
    { name: 'TaskID', type: 'Number', required: true, description: 'رقم المهمة (1-25)' },
    { name: 'Title', type: 'Text', required: true, maxLength: 255, description: 'عنوان المهمة' },
    { name: 'Status', type: 'Choice', required: true, choices: ['لم يبدأ', 'قيد التنفيذ', 'مكتمل'], description: 'الحالة' },
    { name: 'CompletionPercent', type: 'Number', required: false, min: 0, max: 100, description: 'نسبة الإنجاز' },
    { name: 'LinkedTaskID', type: 'Number', required: false, description: 'مرتبط بمهمة أخرى' },
    { name: 'IsSharedTask', type: 'Boolean', required: false, default: false, description: 'مهمة مشتركة' },
    { name: 'LastUpdated', type: 'DateTime', required: true, description: 'آخر تحديث' },
    { name: 'CompletedDate', type: 'DateTime', required: false, description: 'تاريخ الإكمال' },
    { name: 'CompletedBy', type: 'Text', required: false, description: 'أُكمل بواسطة' },
    { name: 'Notes', type: 'Note', required: false, description: 'ملاحظات' },
    { name: 'AcademicYear', type: 'Text', required: true, description: 'العام الدراسي' },
  ],
  permissions: {
    admin: 'FullControl',
    supervisors: 'Contribute',
    schools: 'Read'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// قائمة 3: BC_Admin_Contacts - جهات اتصال الإدارة
// ═══════════════════════════════════════════════════════════════════════════
export const BC_Admin_Contacts_Schema = {
  listName: 'BC_Admin_Contacts',
  listNameAr: 'جهات اتصال الإدارة',
  description: 'جهات الاتصال للطوارئ (داخلية وخارجية)',
  columns: [
    { name: 'Title', type: 'Text', required: true, maxLength: 255, description: 'اسم جهة الاتصال' },
    { name: 'Role', type: 'Text', required: true, maxLength: 100, description: 'الدور/المنصب' },
    { name: 'Email', type: 'Text', required: false, maxLength: 100, description: 'البريد الإلكتروني' },
    { name: 'Phone', type: 'Text', required: true, maxLength: 20, description: 'رقم الهاتف' },
    { name: 'Organization', type: 'Choice', required: true, 
      choices: ['غرفة العمليات', 'فريق BC', 'الدفاع المدني', 'الهلال الأحمر', 'الوزارة', 'جهة خارجية'], 
      description: 'الجهة' },
    { name: 'Category', type: 'Choice', required: true, choices: ['داخلي', 'خارجي'], description: 'التصنيف' },
    { name: 'Notes', type: 'Note', required: false, description: 'ملاحظات' },
    { name: 'IsActive', type: 'Boolean', required: true, default: true, description: 'نشط' },
  ],
  permissions: {
    admin: 'FullControl',
    supervisors: 'Read',
    schools: 'NoAccess'  // 🔒 محمية
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// قائمة 4: BC_Recovery_Targets - أهداف التعافي
// ═══════════════════════════════════════════════════════════════════════════
export const BC_Recovery_Targets_Schema = {
  listName: 'BC_Recovery_Targets',
  listNameAr: 'أهداف التعافي',
  description: 'أوقات التعافي المستهدفة للخدمات الحرجة',
  columns: [
    { name: 'Title', type: 'Text', required: true, maxLength: 255, description: 'اسم الخدمة' },
    { name: 'ServiceCategory', type: 'Choice', required: true, 
      choices: ['تعليمية', 'إدارية', 'تقنية', 'مالية', 'لوجستية'], 
      description: 'تصنيف الخدمة' },
    { name: 'RTO_Hours', type: 'Number', required: true, min: 0, description: 'وقت التعافي المستهدف (ساعات)' },
    { name: 'RPO_Hours', type: 'Number', required: false, min: 0, description: 'نقطة الاسترجاع (ساعات)' },
    { name: 'MTPD_Hours', type: 'Number', required: false, min: 0, description: 'الحد الأقصى للانقطاع (ساعات)' },
    { name: 'Priority', type: 'Choice', required: true, choices: ['حرجة', 'عالية', 'متوسطة', 'منخفضة'], description: 'الأولوية' },
    { name: 'ResponsibleTeam', type: 'Text', required: false, description: 'الفريق المسؤول' },
    { name: 'Notes', type: 'Note', required: false, description: 'ملاحظات' },
  ],
  permissions: {
    admin: 'FullControl',
    supervisors: 'Contribute',
    schools: 'Read'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// قائمة 5: BC_Policy_Compliance - متابعة الالتزام بالسياسات
// ═══════════════════════════════════════════════════════════════════════════
export const BC_Policy_Compliance_Schema = {
  listName: 'BC_Policy_Compliance',
  listNameAr: 'متابعة الالتزام بالسياسات',
  description: 'متابعة تطبيق السياسات والأدلة',
  columns: [
    { name: 'Title', type: 'Text', required: true, maxLength: 255, description: 'اسم السياسة/الدليل' },
    { name: 'PolicyType', type: 'Choice', required: true, 
      choices: ['سياسة', 'دليل', 'إجراء', 'نموذج', 'معيار'], 
      description: 'النوع' },
    { name: 'ComplianceStatus', type: 'Choice', required: true, 
      choices: ['ملتزم', 'ملتزم جزئياً', 'غير ملتزم'], 
      description: 'حالة الالتزام' },
    { name: 'LastReviewDate', type: 'DateTime', required: false, description: 'تاريخ آخر مراجعة' },
    { name: 'NextReviewDate', type: 'DateTime', required: false, description: 'تاريخ المراجعة القادمة' },
    { name: 'ResponsiblePerson', type: 'Text', required: false, description: 'المسؤول' },
    { name: 'Notes', type: 'Note', required: false, description: 'ملاحظات' },
  ],
  permissions: {
    admin: 'FullControl',
    supervisors: 'Contribute',
    schools: 'Read'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// قائمة 6: BC_Incident_Evaluations - تقييمات الحوادث
// ═══════════════════════════════════════════════════════════════════════════
export const BC_Incident_Evaluations_Schema = {
  listName: 'BC_Incident_Evaluations',
  listNameAr: 'تقييمات الحوادث',
  description: 'تقييم الاستجابة والتعافي من الحوادث',
  columns: [
    { name: 'Title', type: 'Text', required: true, maxLength: 255, description: 'عنوان التقييم' },
    { name: 'IncidentRef', type: 'Lookup', required: true, lookupList: 'SBC_Incidents_Log', description: 'مرجع الحادث' },
    { name: 'EvaluationDate', type: 'DateTime', required: true, description: 'تاريخ التقييم' },
    { name: 'ResponseTimeMinutes', type: 'Number', required: false, min: 0, description: 'وقت الاستجابة (دقائق)' },
    { name: 'RecoveryTimeHours', type: 'Number', required: false, min: 0, description: 'وقت التعافي (ساعات)' },
    { name: 'StudentsReturnDate', type: 'DateTime', required: false, description: 'تاريخ عودة الطلاب' },
    { name: 'AlternativeUsed', type: 'Choice', required: false, 
      choices: ['مدرسة بديلة', 'تعليم عن بعد', 'دوام مسائي', 'لا يوجد'], 
      description: 'البديل المستخدم' },
    { name: 'OverallScore', type: 'Number', required: true, min: 1, max: 5, description: 'التقييم العام (1-5)' },
    { name: 'Strengths', type: 'Note', required: false, description: 'نقاط القوة' },
    { name: 'Weaknesses', type: 'Note', required: false, description: 'نقاط الضعف' },
    { name: 'Recommendations', type: 'Note', required: false, description: 'التوصيات' },
    { name: 'EvaluatedBy', type: 'Text', required: true, description: 'المقيّم' },
  ],
  permissions: {
    admin: 'FullControl',
    supervisors: 'Contribute',
    schools: 'Read'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// قائمة 7: BC_Recommendations - التوصيات ومتابعتها
// ═══════════════════════════════════════════════════════════════════════════
export const BC_Recommendations_Schema = {
  listName: 'BC_Recommendations',
  listNameAr: 'التوصيات ومتابعتها',
  description: 'توصيات التحسين ومتابعة تنفيذها',
  columns: [
    { name: 'Title', type: 'Text', required: true, maxLength: 255, description: 'عنوان التوصية' },
    { name: 'Source', type: 'Choice', required: true, 
      choices: ['تقييم حادث', 'تمرين فرضي', 'مراجعة دورية', 'جهة خارجية'], 
      description: 'مصدر التوصية' },
    { name: 'SourceRef', type: 'Text', required: false, description: 'مرجع المصدر' },
    { name: 'Priority', type: 'Choice', required: true, choices: ['عاجلة', 'عالية', 'متوسطة', 'منخفضة'], description: 'الأولوية' },
    { name: 'Status', type: 'Choice', required: true, 
      choices: ['جديدة', 'قيد التنفيذ', 'مكتملة', 'مؤجلة', 'ملغاة'], 
      description: 'الحالة' },
    { name: 'AssignedTo', type: 'Text', required: false, description: 'المكلف بالتنفيذ' },
    { name: 'DueDate', type: 'DateTime', required: false, description: 'تاريخ الاستحقاق' },
    { name: 'CompletionDate', type: 'DateTime', required: false, description: 'تاريخ الإكمال' },
    { name: 'Notes', type: 'Note', required: false, description: 'ملاحظات' },
  ],
  permissions: {
    admin: 'FullControl',
    supervisors: 'Contribute',
    schools: 'Read'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ملخص جميع القوائم
// ═══════════════════════════════════════════════════════════════════════════
export const allSharePointLists = [
  BC_Master_Plan_Schema,      // المهمة 1
  BC_Plan_Reviews_Schema,     // المهمة 7
  BC_Tasks_Status_Schema,     // متابعة المهام
  BC_Admin_Contacts_Schema,
  BC_Recovery_Targets_Schema,
  BC_Policy_Compliance_Schema,
  BC_Incident_Evaluations_Schema,
  BC_Recommendations_Schema,
]

// القوائم الموجودة مسبقاً
export const existingLists = [
  'SchoolInfo',           // بيانات المدارس
  'BC_Teams_Members',     // فرق الأمن والسلامة
  'SBC_Drills_Log',       // سجل التمارين
  'SBC_Incidents_Log',    // سجل الحوادث
  'School_Training_Log',  // السجل التدريبي
  'Coordination_Programs_Catalog',  // كتالوج البرامج
]

// دالة لإنشاء سكربت PowerShell لإنشاء القوائم
export const generatePowerShellScript = (): string => {
  let script = `# PowerShell Script to Create SharePoint Lists\n`
  script += `# Run with: Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/yoursite"\n\n`
  
  allSharePointLists.forEach(list => {
    script += `# Create ${list.listName}\n`
    script += `New-PnPList -Title "${list.listName}" -Template GenericList\n`
    list.columns.forEach(col => {
      if (col.type === 'Text') {
        script += `Add-PnPField -List "${list.listName}" -DisplayName "${col.name}" -InternalName "${col.name}" -Type Text\n`
      } else if (col.type === 'Note') {
        script += `Add-PnPField -List "${list.listName}" -DisplayName "${col.name}" -InternalName "${col.name}" -Type Note\n`
      } else if (col.type === 'Choice') {
        const choices = (col as any).choices?.join('","') || ''
        script += `Add-PnPField -List "${list.listName}" -DisplayName "${col.name}" -InternalName "${col.name}" -Type Choice -Choices "${choices}"\n`
      } else if (col.type === 'Number') {
        script += `Add-PnPField -List "${list.listName}" -DisplayName "${col.name}" -InternalName "${col.name}" -Type Number\n`
      } else if (col.type === 'DateTime') {
        script += `Add-PnPField -List "${list.listName}" -DisplayName "${col.name}" -InternalName "${col.name}" -Type DateTime\n`
      } else if (col.type === 'Boolean') {
        script += `Add-PnPField -List "${list.listName}" -DisplayName "${col.name}" -InternalName "${col.name}" -Type Boolean\n`
      }
    })
    script += `\n`
  })
  
  return script
}
