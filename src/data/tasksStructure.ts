/**
 * هيكل المهام الـ 25 مع الارتباطات ومصادر البيانات
 * BC Tasks Structure with Dependencies and Data Sources
 */

export interface BCTask {
  taskId: number
  taskNumber: string
  title: string
  description: string
  category: 'plans' | 'drills' | 'monitoring' | 'coordination' | 'training' | 'resources' | 'policies'
  linkedTaskId: number | null  // مرتبط بمهمة أخرى
  isSharedTask: boolean  // مهمة مشتركة
  autoComplete: boolean  // تكتمل تلقائياً عند اكتمال المرتبطة
  dataSource: string  // قائمة SharePoint المصدر
  requiredFields: string[]  // الحقول المطلوبة للاكتمال
  completionCriteria: string  // معايير الاكتمال
  subTasks?: SubTask[]  // الأجزاء الفرعية للمهمة
}

// الأجزاء الفرعية للمهمة
export interface SubTask {
  subTaskId: string  // مثل: "1.1", "1.2", "7.1"
  title: string
  description: string
  requiredFields: RequiredField[]
  isCompleted: boolean
}

// الحقول المطلوبة مع التفاصيل
export interface RequiredField {
  fieldName: string
  fieldType: 'text' | 'file' | 'date' | 'choice' | 'multiline' | 'boolean'
  label: string
  required: boolean
  choices?: string[]  // للحقول من نوع choice
}

export interface TaskStatus {
  taskId: number
  status: 'not_started' | 'in_progress' | 'completed'
  completionPercent: number
  lastUpdated: string
  notes: string
  completedBy?: string
  completedDate?: string
}

// المهام الـ 25
export const bcTasks: BCTask[] = [
  // ═══════════════════════════════════════════════════════════════
  // المهمة 1: إعداد خطط الطوارئ ومراجعتها وتحديثها دورياً
  // ═══════════════════════════════════════════════════════════════
  {
    taskId: 1,
    taskNumber: '1',
    title: 'إعداد خطط الطوارئ على مستوى إدارة التعليم ومراجعتها وتحديثها دورياً',
    description: 'الوحدة تعد الخطة وترفع في النظام ويرسل على ايميل المدارس للعمل وفق الخطة، ويكون فيه أيقونة لتحديث الخطة وإشعار للتحديث',
    category: 'plans',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Master_Plan',
    requiredFields: ['Title', 'Description', 'PlanFile', 'ScenariosJSON', 'IsPublished', 'Version'],
    completionCriteria: 'الخطة منشورة للمدارس مع السيناريوهات وملف الخطة مرفوع',
    subTasks: [
      {
        subTaskId: '1.1',
        title: 'إعداد الخطة الأساسية',
        description: 'رفع ملف الخطة مع العنوان والوصف',
        requiredFields: [
          { fieldName: 'Title', fieldType: 'text', label: 'عنوان الخطة', required: true },
          { fieldName: 'Description', fieldType: 'multiline', label: 'وصف الخطة', required: true },
          { fieldName: 'PlanFile', fieldType: 'file', label: 'ملف الخطة (PDF/Word)', required: true },
          { fieldName: 'FileUploadDate', fieldType: 'date', label: 'تاريخ الرفع', required: false },
        ],
        isCompleted: false
      },
      {
        subTaskId: '1.2',
        title: 'سيناريوهات الاضطراب',
        description: 'تحديد السيناريوهات الخمسة للاضطراب مع الإجراءات',
        requiredFields: [
          { fieldName: 'Scenario1', fieldType: 'boolean', label: 'سيناريو تعذر التعليم في المبنى', required: true },
          { fieldName: 'Scenario2', fieldType: 'boolean', label: 'سيناريو تعطل المنصات التعليمية', required: true },
          { fieldName: 'Scenario3', fieldType: 'boolean', label: 'سيناريو تعطل قنوات عين', required: true },
          { fieldName: 'Scenario4', fieldType: 'boolean', label: 'سيناريو تعطل المنصات والقنوات معاً', required: true },
          { fieldName: 'Scenario5', fieldType: 'boolean', label: 'سيناريو نقص الكادر التعليمي', required: true },
        ],
        isCompleted: false
      },
      {
        subTaskId: '1.3',
        title: 'النشر للمدارس',
        description: 'نشر الخطة للمدارس مع تسجيل تاريخ النشر',
        requiredFields: [
          { fieldName: 'IsPublished', fieldType: 'boolean', label: 'تم النشر للمدارس', required: true },
          { fieldName: 'PublishDate', fieldType: 'date', label: 'تاريخ النشر', required: true },
          { fieldName: 'Version', fieldType: 'text', label: 'رقم الإصدار', required: true },
        ],
        isCompleted: false
      },
      {
        subTaskId: '1.4',
        title: 'التحديث الدوري',
        description: 'إعداد جدول للتحديث الدوري مع الإشعارات',
        requiredFields: [
          { fieldName: 'ReviewPeriodMonths', fieldType: 'choice', label: 'فترة المراجعة', required: true, choices: ['3 أشهر', '6 أشهر', 'سنوياً'] },
          { fieldName: 'NextReviewDate', fieldType: 'date', label: 'تاريخ المراجعة القادمة', required: true },
          { fieldName: 'UpdateHistoryJSON', fieldType: 'multiline', label: 'سجل التحديثات', required: false },
        ],
        isCompleted: false
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // المهمة 7: المشاركة في مراجعة خطط العمل ووضع إجراءات الاستجابة
  // ═══════════════════════════════════════════════════════════════
  {
    taskId: 7,
    taskNumber: '7',
    title: 'المشاركة في مراجعة خطط العمل ووضع إجراءات فعالة للاستجابة للاضطرابات',
    description: 'رفع ملف/تقرير المراجعة + توثيق إجراءات الاستجابة لكل سيناريو من السيناريوهات الخمسة',
    category: 'plans',
    linkedTaskId: 1,  // مرتبطة بالمهمة 1 (تحتاج اكتمال السيناريوهات أولاً)
    isSharedTask: true,
    autoComplete: false,  // ❌ لا تكتمل تلقائياً - تحتاج عمل إضافي
    dataSource: 'BC_Plan_Reviews',
    requiredFields: ['ReviewFile', 'ReviewDate', 'ResponseProcedures'],
    completionCriteria: 'ملف المراجعة مرفوع + إجراءات الاستجابة موثقة لجميع السيناريوهات',
    subTasks: [
      {
        subTaskId: '7.1',
        title: 'مراجعة خطط العمل',
        description: 'رفع تقرير/ملف المراجعة مع الملاحظات والتوصيات',
        requiredFields: [
          { fieldName: 'ReviewFile', fieldType: 'file', label: 'ملف/تقرير المراجعة', required: true },
          { fieldName: 'ReviewDate', fieldType: 'date', label: 'تاريخ المراجعة', required: true },
          { fieldName: 'ReviewNotes', fieldType: 'multiline', label: 'ملاحظات المراجعة', required: false },
          { fieldName: 'ReviewRecommendations', fieldType: 'multiline', label: 'التوصيات الناتجة عن المراجعة', required: true },
        ],
        isCompleted: false
      },
      {
        subTaskId: '7.2',
        title: 'إجراءات الاستجابة للاضطرابات',
        description: 'توثيق إجراءات الاستجابة لكل سيناريو من السيناريوهات الخمسة',
        requiredFields: [
          { fieldName: 'Response_Scenario1', fieldType: 'multiline', label: 'إجراءات الاستجابة - تعطل المبنى', required: true },
          { fieldName: 'Response_Scenario2', fieldType: 'multiline', label: 'إجراءات الاستجابة - تعطل المنصات', required: true },
          { fieldName: 'Response_Scenario3', fieldType: 'multiline', label: 'إجراءات الاستجابة - تعطل القنوات', required: true },
          { fieldName: 'Response_Scenario4', fieldType: 'multiline', label: 'إجراءات الاستجابة - تعطل شامل', required: true },
          { fieldName: 'Response_Scenario5', fieldType: 'multiline', label: 'إجراءات الاستجابة - نقص الكادر', required: true },
        ],
        isCompleted: false
      },
      {
        subTaskId: '7.3',
        title: 'توثيق واعتماد الإجراءات',
        description: 'رفع ملف إجراءات الاستجابة المعتمد',
        requiredFields: [
          { fieldName: 'ProceduresFile', fieldType: 'file', label: 'ملف إجراءات الاستجابة', required: true },
          { fieldName: 'ApprovalDate', fieldType: 'date', label: 'تاريخ الاعتماد', required: true },
          { fieldName: 'ApprovedBy', fieldType: 'text', label: 'الجهة المعتمدة', required: true },
        ],
        isCompleted: false
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // المهمة 2: التنسيق لتنفيذ التمارين الفرضية
  // ═══════════════════════════════════════════════════════════════
  {
    taskId: 2,
    taskNumber: '2',
    title: 'التنسيق مع الجهات ذات العلاقة لتنفيذ التمارين الفرضية والميدانية',
    description: 'تخطيط وتنفيذ 4 تمارين سنوياً لكل مدرسة بالتنسيق مع الدفاع المدني والهلال الأحمر',
    category: 'drills',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'SBC_Drills_Log',
    requiredFields: ['SchoolName_Ref', 'DrillType', 'DrillDate', 'DrillResult'],
    completionCriteria: 'جميع المدارس نفذت 4 تمارين على الأقل'
  },
  {
    taskId: 3,
    taskNumber: '3',
    title: 'إدارة خطة التشغيل المتبادل للمدارس',
    description: 'تحديد المدارس البديلة لكل مدرسة وتوثيق اتفاقيات التشغيل المتبادل',
    category: 'plans',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'MutualOperation',
    requiredFields: ['SchoolName', 'AlternativeSchool', 'Distance'],
    completionCriteria: 'جميع المدارس لديها بديل محدد'
  },
  {
    taskId: 4,
    taskNumber: '4',
    title: 'متابعة تطبيق برامج وحلول معالجة مخاطر الانقطاع',
    description: 'متابعة تنفيذ الحلول للحد من مخاطر انقطاع الخدمات التعليمية',
    category: 'monitoring',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Risk_Programs',
    requiredFields: ['RiskName', 'Solution', 'Status', 'ImplementationDate'],
    completionCriteria: 'جميع المخاطر لها حلول مطبقة'
  },
  {
    taskId: 5,
    taskNumber: '5',
    title: 'مراقبة أوقات التعافي المستهدفة (RTO/RPO)',
    description: 'تحديد ومراقبة أوقات التعافي المستهدفة والحد الأقصى للانقطاع',
    category: 'monitoring',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Recovery_Targets',
    requiredFields: ['ServiceName', 'RTO_Hours', 'RPO_Hours', 'MTPD_Hours'],
    completionCriteria: 'جميع الخدمات الحرجة محددة أوقات التعافي'
  },

  // ═══════════════════════════════════════════════════════════════
  // المهام 6-10: المراقبة والتقييم
  // ═══════════════════════════════════════════════════════════════
  {
    taskId: 6,
    taskNumber: '6',
    title: 'مراقبة وتقييم إجراءات الاستجابة للحالة الطارئة والتعافي منها',
    description: 'تقييم أداء الاستجابة للحوادث وقياس وقت التعافي وعودة الطلاب',
    category: 'monitoring',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'SBC_Incidents_Log',
    requiredFields: ['ResponseTime', 'RecoveryTime', 'StudentsReturnDate', 'EvaluationScore'],
    completionCriteria: 'جميع الحوادث لها تقييم مكتمل'
  },
  // المهمة 7 تم تعريفها أعلاه مع المهمة 1 لأنها مرتبطة بها
  {
    taskId: 8,
    taskNumber: '8',
    title: 'تقييم الموارد والإمكانات والقدرات الحالية للاستعداد',
    description: 'تقييم جاهزية الموارد البشرية والمادية والتقنية',
    category: 'resources',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Resources_Assessment',
    requiredFields: ['ResourceType', 'CurrentStatus', 'Gap', 'ActionRequired'],
    completionCriteria: 'تقييم شامل للموارد'
  },
  {
    taskId: 9,
    taskNumber: '9',
    title: 'متابعة تطبيق السياسات والبرامج والأدلة المعتمدة',
    description: 'متابعة التزام المدارس بتطبيق السياسات والأدلة الإرشادية',
    category: 'policies',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Policy_Compliance',
    requiredFields: ['PolicyName', 'ComplianceStatus', 'ReviewDate'],
    completionCriteria: 'نسبة الالتزام > 90%'
  },
  {
    taskId: 10,
    taskNumber: '10',
    title: 'متابعة تطبيق معايير تفعيل خطط الطوارئ',
    description: 'التأكد من تطبيق معايير تفعيل الخطط في المدارس',
    category: 'policies',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Activation_Standards',
    requiredFields: ['StandardName', 'SchoolCompliance', 'VerificationDate'],
    completionCriteria: 'جميع المدارس ملتزمة بالمعايير'
  },

  // ═══════════════════════════════════════════════════════════════
  // المهام 11-15: المعايير والتقارير
  // ═══════════════════════════════════════════════════════════════
  {
    taskId: 11,
    taskNumber: '11',
    title: 'متابعة تطبيق معايير ومستويات إدارة الحالة الطارئة',
    description: 'التأكد من تطبيق مستويات الطوارئ (أبيض/أصفر/برتقالي/أحمر)',
    category: 'policies',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Emergency_Levels',
    requiredFields: ['EmergencyLevel', 'Criteria', 'Response'],
    completionCriteria: 'توثيق جميع مستويات الطوارئ'
  },
  {
    taskId: 12,
    taskNumber: '12',
    title: 'اقتراح وتصميم الحلول البديلة للعمليات الأساسية',
    description: 'تحديد بدائل للعمليات التعليمية عند الاضطراب',
    category: 'plans',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Alternatives',
    requiredFields: ['ProcessName', 'Alternative', 'ActivationCriteria'],
    completionCriteria: 'جميع العمليات الحرجة لها بدائل'
  },
  {
    taskId: 13,
    taskNumber: '13 ⚡',
    title: 'إعداد تقارير أداء الاستجابة والتعافي',
    description: '⚡ مرتبط جزئياً بالمهمة 6 - تقارير دورية عن أداء الاستجابة',
    category: 'monitoring',
    linkedTaskId: 6,
    isSharedTask: true,
    autoComplete: false,  // يحتاج إعداد التقرير
    dataSource: 'BC_Reports',
    requiredFields: ['ReportType', 'Period', 'GeneratedDate'],
    completionCriteria: 'تقارير ربعية مكتملة'
  },
  {
    taskId: 14,
    taskNumber: '14',
    title: 'تحديد نقاط الضعف في الاستجابة ووضع التوصيات',
    description: 'تحليل الحوادث لتحديد نقاط الضعف ووضع توصيات التحسين',
    category: 'monitoring',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Recommendations',
    requiredFields: ['WeaknessDescription', 'Recommendation', 'Priority'],
    completionCriteria: 'توثيق التوصيات لجميع الحوادث'
  },
  {
    taskId: 15,
    taskNumber: '15',
    title: 'متابعة تنفيذ التوصيات',
    description: 'متابعة تنفيذ التوصيات الصادرة من تقييم الحوادث',
    category: 'monitoring',
    linkedTaskId: 14,
    isSharedTask: true,
    autoComplete: false,
    dataSource: 'BC_Recommendations',
    requiredFields: ['RecommendationStatus', 'ImplementationDate'],
    completionCriteria: 'تنفيذ > 80% من التوصيات'
  },

  // ═══════════════════════════════════════════════════════════════
  // المهام 16-20: الفرق والتدريب
  // ═══════════════════════════════════════════════════════════════
  {
    taskId: 16,
    taskNumber: '16',
    title: 'إدارة فرق استمرارية الأعمال في المدارس',
    description: 'التأكد من تشكيل فرق BC في جميع المدارس مع تحديد الأدوار',
    category: 'coordination',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Teams_Members',
    requiredFields: ['SchoolName_Ref', 'MemberName', 'Role'],
    completionCriteria: 'جميع المدارس لديها فريق مكتمل'
  },
  {
    taskId: 17,
    taskNumber: '17',
    title: 'التدريب والتأهيل على إجراءات الطوارئ',
    description: 'تنفيذ برامج تدريبية لمنسوبي المدارس',
    category: 'training',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'School_Training_Log',
    requiredFields: ['TrainingName', 'TrainingDate', 'ParticipantsCount'],
    completionCriteria: 'تدريب جميع فرق المدارس'
  },
  {
    taskId: 18,
    taskNumber: '18',
    title: 'التوعية بالخطط والإجراءات',
    description: 'نشر الوعي بخطط الطوارئ واستمرارية الأعمال',
    category: 'training',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Awareness',
    requiredFields: ['AwarenessType', 'TargetAudience', 'Date'],
    completionCriteria: 'حملات توعوية منفذة'
  },
  {
    taskId: 19,
    taskNumber: '19',
    title: 'إدارة جهات الاتصال للطوارئ',
    description: 'تحديث قوائم الاتصال للجهات الداخلية والخارجية',
    category: 'coordination',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Admin_Contacts',
    requiredFields: ['Name', 'Role', 'Phone', 'Organization'],
    completionCriteria: 'قوائم اتصال محدثة'
  },
  {
    taskId: 20,
    taskNumber: '20',
    title: 'إدارة سجل الحوادث',
    description: 'توثيق جميع الحوادث والاستجابة لها',
    category: 'monitoring',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'SBC_Incidents_Log',
    requiredFields: ['Title', 'IncidentDate', 'Description', 'Status'],
    completionCriteria: 'جميع الحوادث موثقة'
  },

  // ═══════════════════════════════════════════════════════════════
  // المهام 21-25: التقارير والمتابعة
  // ═══════════════════════════════════════════════════════════════
  {
    taskId: 21,
    taskNumber: '21',
    title: 'إعداد التقارير الدورية للإدارة',
    description: 'تقارير شهرية وربعية عن أداء استمرارية الأعمال',
    category: 'monitoring',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Reports',
    requiredFields: ['ReportTitle', 'Period', 'Status'],
    completionCriteria: 'تقارير دورية مرفوعة'
  },
  {
    taskId: 22,
    taskNumber: '22',
    title: 'متابعة مؤشرات الأداء (KPIs)',
    description: 'قياس ومتابعة مؤشرات الأداء الرئيسية',
    category: 'monitoring',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_KPIs',
    requiredFields: ['KPIName', 'Target', 'Actual', 'Period'],
    completionCriteria: 'جميع KPIs محدثة'
  },
  {
    taskId: 23,
    taskNumber: '23',
    title: 'تقييم الأضرار بعد الحوادث',
    description: 'توثيق وتقييم الأضرار الناتجة عن الحوادث',
    category: 'monitoring',
    linkedTaskId: 6,
    isSharedTask: true,
    autoComplete: false,
    dataSource: 'BC_Damage_Assessment',
    requiredFields: ['IncidentRef', 'DamageType', 'Severity', 'Cost'],
    completionCriteria: 'تقييم أضرار لكل حادث'
  },
  {
    taskId: 24,
    taskNumber: '24',
    title: 'إدارة الدروس المستفادة',
    description: 'توثيق ونشر الدروس المستفادة من الحوادث والتمارين',
    category: 'monitoring',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'BC_Lessons_Learned',
    requiredFields: ['SourceType', 'Lesson', 'ActionTaken'],
    completionCriteria: 'توثيق دروس مستفادة'
  },
  {
    taskId: 25,
    taskNumber: '25',
    title: 'تحديث وصيانة النظام',
    description: 'صيانة وتحديث نظام إدارة استمرارية الأعمال',
    category: 'resources',
    linkedTaskId: null,
    isSharedTask: false,
    autoComplete: false,
    dataSource: 'System',
    requiredFields: [],
    completionCriteria: 'النظام يعمل بكفاءة'
  }
]

// دالة لحساب حالة المهام المشتركة
export const calculateSharedTaskStatus = (tasks: TaskStatus[]): TaskStatus[] => {
  return tasks.map(task => {
    const taskDef = bcTasks.find(t => t.taskId === task.taskId)
    
    // إذا كانت مهمة مشتركة مع autoComplete
    if (taskDef?.isSharedTask && taskDef?.autoComplete && taskDef?.linkedTaskId) {
      const linkedTask = tasks.find(t => t.taskId === taskDef.linkedTaskId)
      if (linkedTask?.status === 'completed') {
        return {
          ...task,
          status: 'completed' as const,
          completionPercent: 100,
          notes: `مكتملة تلقائياً - مرتبطة بالمهمة ${taskDef.linkedTaskId}`
        }
      }
    }
    
    return task
  })
}

// دالة للحصول على المهام حسب التصنيف
export const getTasksByCategory = (category: BCTask['category']): BCTask[] => {
  return bcTasks.filter(task => task.category === category)
}

// دالة للحصول على المهام المرتبطة
export const getLinkedTasks = (taskId: number): BCTask[] => {
  return bcTasks.filter(task => task.linkedTaskId === taskId)
}

// إحصائيات المهام
export const getTasksStats = (statuses: TaskStatus[]) => {
  const total = bcTasks.length
  const completed = statuses.filter(s => s.status === 'completed').length
  const inProgress = statuses.filter(s => s.status === 'in_progress').length
  const notStarted = statuses.filter(s => s.status === 'not_started').length
  const sharedTasks = bcTasks.filter(t => t.isSharedTask).length
  
  return {
    total,
    completed,
    inProgress,
    notStarted,
    sharedTasks,
    completionPercent: Math.round((completed / total) * 100)
  }
}

// تصنيفات المهام
export const taskCategories = {
  plans: { label: 'الخطط', icon: '📋', color: '#008752' },
  drills: { label: 'التمارين', icon: '🎯', color: '#0078d4' },
  monitoring: { label: 'المراقبة والتقييم', icon: '📊', color: '#5c2d91' },
  coordination: { label: 'التنسيق', icon: '🤝', color: '#107c10' },
  training: { label: 'التدريب', icon: '📚', color: '#ffb900' },
  resources: { label: 'الموارد', icon: '💼', color: '#d83b01' },
  policies: { label: 'السياسات', icon: '📜', color: '#0063b1' }
}
