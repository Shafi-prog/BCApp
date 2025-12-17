/**
 * معايير خطة استمرارية الأعمال المستخرجة من الوثيقة الرسمية
 * التحديثات على خطة استمرارية العملية التعليمية 2025
 * 
 * النسخة: الثالثة
 * تاريخ النشر: 3/8/2025
 * مالك الوثيقة: الإدارة العامة للحوكمة والمخاطر والالتزام
 */

// ============================================
// أوقات الاسترداد المستهدفة (RTO) و أعلى وقت مقبول للانقطاع (MAO)
// ============================================

export interface ActivityRTO {
  id: string;
  nameAr: string;
  nameEn: string;
  criticality: 'مرتفع جداً' | 'مرتفع' | 'متوسط' | 'منخفض';
  rtoMinutes: number; // بالدقائق
  rtoDisplay: string;
  maoMinutes: number; // أقصى وقت مقبول للانقطاع بالدقائق
  maoDisplay: string;
}

export const criticalActivities: ActivityRTO[] = [
  {
    id: 'building_education',
    nameAr: 'تنفيذ العملية التعليمية في المبنى المدرسي',
    nameEn: 'Educational process in school building',
    criticality: 'مرتفع جداً',
    rtoMinutes: 420, // 0-7 ساعات
    rtoDisplay: '0-7 ساعة',
    maoMinutes: 2880, // 48 ساعة
    maoDisplay: '48 ساعة'
  },
  {
    id: 'remote_platforms',
    nameAr: 'تقديم خدمات التعليم عن بعد عبر المنصات التعليمية (منصة مدرستي، منصة روضتي)',
    nameEn: 'Remote education via platforms (Madrasati, Rawdati)',
    criticality: 'مرتفع جداً',
    rtoMinutes: 420, // 0-7 ساعات
    rtoDisplay: '0-7 ساعة',
    maoMinutes: 1440, // 24 ساعة
    maoDisplay: '24 ساعة'
  },
  {
    id: 'ain_broadcast',
    nameAr: 'تقديم خدمة البث التعليمي عبر قنوات عين',
    nameEn: 'Educational broadcast via Ain channels',
    criticality: 'مرتفع جداً',
    rtoMinutes: 420, // 0-7 ساعات
    rtoDisplay: '0-7 ساعة',
    maoMinutes: 1440, // 24 ساعة
    maoDisplay: '24 ساعة'
  }
];

// ============================================
// أوقات استرداد الأنظمة التقنية (RTO & RPO)
// ============================================

export interface SystemRTO {
  id: string;
  nameAr: string;
  nameEn: string;
  rtoMinutes: number;
  rtoDisplay: string;
  rpoMinutes: number;
  rpoDisplay: string;
}

export const criticalSystems: SystemRTO[] = [
  {
    id: 'madrasati',
    nameAr: 'منصة مدرستي',
    nameEn: 'Madrasati Platform',
    rtoMinutes: 30,
    rtoDisplay: '30 دقيقة',
    rpoMinutes: 5,
    rpoDisplay: '5 دقائق'
  },
  {
    id: 'rawdati',
    nameAr: 'منصة روضتي',
    nameEn: 'Rawdati Platform',
    rtoMinutes: 30,
    rtoDisplay: '30 دقيقة',
    rpoMinutes: 5,
    rpoDisplay: '5 دقائق'
  },
  {
    id: 'noor',
    nameAr: 'نظام نور',
    nameEn: 'Noor System',
    rtoMinutes: 60,
    rtoDisplay: '60 دقيقة',
    rpoMinutes: 30,
    rpoDisplay: '30 دقيقة'
  },
  {
    id: 'faris',
    nameAr: 'نظام فارس',
    nameEn: 'Faris System',
    rtoMinutes: 360, // 6 ساعات
    rtoDisplay: '6 ساعات',
    rpoMinutes: 30,
    rpoDisplay: '30 دقيقة'
  }
];

// ============================================
// فئات المخاطر
// ============================================

export type RiskCategory = 
  | 'فقدان البنية التحتية'
  | 'فقدان الموارد البشرية'
  | 'فقدان الموارد التقنية'
  | 'اضطراب أمني'
  | 'فقدان الاتصالات والانترنت';

export interface RiskCategoryInfo {
  id: string;
  nameAr: RiskCategory;
  nameEn: string;
  description: string;
  examples: string[];
}

export const riskCategories: RiskCategoryInfo[] = [
  {
    id: 'infrastructure',
    nameAr: 'فقدان البنية التحتية',
    nameEn: 'Loss of Infrastructure',
    description: 'حدوث حريق، كوارث طبيعية، انفجار، انقطاع الكهرباء أو الماء',
    examples: ['حريق', 'كوارث طبيعية', 'انفجار', 'انقطاع الكهرباء', 'انقطاع الماء']
  },
  {
    id: 'human_resources',
    nameAr: 'فقدان الموارد البشرية',
    nameEn: 'Loss of Human Resources',
    description: 'عدم توفر معلمين، طلاب، كادر إداري',
    examples: ['غياب المعلمين', 'غياب الطلاب', 'غياب الكادر الإداري', 'انتشار مرض']
  },
  {
    id: 'technology',
    nameAr: 'فقدان الموارد التقنية',
    nameEn: 'Loss of Technology Resources',
    description: 'تعطل المنصات التعليمية',
    examples: ['تعطل منصة مدرستي', 'تعطل منصة روضتي', 'حوادث الأمن السيبراني']
  },
  {
    id: 'security',
    nameAr: 'اضطراب أمني',
    nameEn: 'Security Disruption',
    description: 'سواء كانت داخل المدرسة أو خارجها بما يعطل استخدام المبنى المدرسي',
    examples: ['اضطرابات أمنية داخلية', 'اضطرابات أمنية خارجية', 'تسرب إشعاعي']
  },
  {
    id: 'communications',
    nameAr: 'فقدان الاتصالات والانترنت',
    nameEn: 'Loss of Communications and Internet',
    description: 'عدم توفر الاتصالات أو الانترنت',
    examples: ['انقطاع الاتصالات', 'انقطاع الانترنت', 'تشويش GPS']
  }
];

// ============================================
// مستويات تصنيف الاضطراب
// ============================================

export interface DisruptionLevel {
  level: 1 | 2 | 3 | 4;
  nameAr: string;
  descriptionAr: string;
  thresholds: {
    infrastructure: string;
    humanResources: string;
    technology: string;
    security: string;
    communications: string;
  };
  activationAuthority: string;
}

export const disruptionLevels: DisruptionLevel[] = [
  {
    level: 1,
    nameAr: 'المستوى الأول',
    descriptionAr: 'اضطراب لا يؤثر على استمرار التعليم ولا يؤدي إلى توقفه',
    thresholds: {
      infrastructure: 'تعذر استخدام المبنى المدرسي ليوم واحد',
      humanResources: 'غياب أقل من 30% من المعلمين',
      technology: 'تعطل مؤقت للأنظمة لا يزيد عن 8 ساعات',
      security: 'اضطراب أمني يؤثر على المدرسة ليوم أو أقل',
      communications: 'انقطاع الاتصالات ليومين أو أقل'
    },
    activationAuthority: 'مدير المدرسة'
  },
  {
    level: 2,
    nameAr: 'المستوى الثاني',
    descriptionAr: 'اضطراب يؤثر على استمرار العملية التعليمية ويؤدي إلى توقفها',
    thresholds: {
      infrastructure: 'تعذر استخدام المبنى المدرسي لأكثر من يوم إلى 3 أيام، أو 10% من المدارس',
      humanResources: 'غياب أكثر من 30% من المعلمين',
      technology: 'تعطل للأنظمة أكثر من 8 ساعات إلى 5 أيام',
      security: 'اضطراب أمني لأكثر من يوم إلى 3 أيام',
      communications: 'انقطاع الاتصالات أكثر من يومين إلى 5 أيام'
    },
    activationAuthority: 'إدارة التعليم'
  },
  {
    level: 3,
    nameAr: 'المستوى الثالث',
    descriptionAr: 'اضطراب يؤثر بشكل كبير على العملية التعليمية',
    thresholds: {
      infrastructure: 'تعذر استخدام المبنى لأكثر من 3 أيام إلى شهر، أو 25% من المدارس',
      humanResources: 'غياب أكثر من 60% من المعلمين',
      technology: 'تعطل للأنظمة أكثر من 5 أيام',
      security: 'اضطراب أمني لأكثر من 3 أيام إلى أسبوعين',
      communications: 'انقطاع الاتصالات أكثر من 5 أيام إلى أسبوعين'
    },
    activationAuthority: 'مدير عام التعليم'
  },
  {
    level: 4,
    nameAr: 'المستوى الرابع',
    descriptionAr: 'اضطراب شامل على مستوى إدارة تعليم أو أكثر',
    thresholds: {
      infrastructure: 'تعذر استخدام المباني على مستوى إدارة تعليم لأكثر من شهر',
      humanResources: 'غياب المعلمين بشكل واسع',
      technology: 'تعطل للأنظمة أكثر من أسبوعين',
      security: 'اضطراب أمني لأكثر من أسبوعين',
      communications: 'انقطاع الاتصالات أكثر من أسبوعين'
    },
    activationAuthority: 'الوزارة / فريق إدارة الأزمات'
  }
];

// ============================================
// الفرضيات / السيناريوهات
// ============================================

export interface Scenario {
  id: string;
  number: number;
  nameAr: string;
  nameEn: string;
  description: string;
  alternatives: string[];
  riskCategories: RiskCategory[];
}

export const scenarios: Scenario[] = [
  {
    id: 'building_unavailable',
    number: 1,
    nameAr: 'تعذر تنفيذ العملية التعليمية في المبنى المدرسي',
    nameEn: 'School building unavailable',
    description: 'بسبب حريق، هبوط أرضي، انقطاع كهرباء، تسرب مياه، انتشار مرض معدي، تسرب إشعاعي، اضطرابات أمنية',
    alternatives: ['منصة مدرستي', 'منصة روضتي', 'قنوات عين'],
    riskCategories: ['فقدان البنية التحتية', 'اضطراب أمني']
  },
  {
    id: 'platforms_down',
    number: 2,
    nameAr: 'تعطل المنصات التعليمية (منصة مدرستي، منصة روضتي)',
    nameEn: 'Educational platforms down',
    description: 'بسبب مشكلة تقنية أو حوادث الأمن السيبراني',
    alternatives: ['قنوات عين', 'التعليم الذاتي', 'مناهج سحابية'],
    riskCategories: ['فقدان الموارد التقنية']
  },
  {
    id: 'ain_broadcast_down',
    number: 3,
    nameAr: 'تعذر تقديم خدمة البث التعليمي عبر قنوات عين',
    nameEn: 'Ain broadcast unavailable',
    description: 'بسبب مشكلة في الاستديو التعليمي',
    alternatives: ['منصة مدرستي', 'منصة روضتي', 'التعليم الذاتي', 'مناهج سحابية'],
    riskCategories: ['فقدان الموارد التقنية']
  },
  {
    id: 'all_alternatives_down',
    number: 4,
    nameAr: 'تعطل المنصات التعليمية وقنوات عين والمبنى المدرسي',
    nameEn: 'All alternatives unavailable',
    description: 'تعذر جميع وسائل التعليم',
    alternatives: ['الدراسة في مدرسة مجاورة', 'التعليم الذاتي'],
    riskCategories: ['فقدان البنية التحتية', 'فقدان الموارد التقنية']
  },
  {
    id: 'staff_shortage',
    number: 5,
    nameAr: 'تعذر تقديم النشاط التعليمي نتيجة عدم توافر العدد الكافي من الكادر التعليمي',
    nameEn: 'Staff shortage',
    description: 'عدم توفر العدد الكافي من المعلمين',
    alternatives: ['ندب كادر من مدارس أخرى', 'التعليم عن بعد', 'الدراسة في مدرسة مجاورة'],
    riskCategories: ['فقدان الموارد البشرية']
  }
];

// ============================================
// أوقات التعافي للخدمات
// ============================================

export interface ServiceRecoveryTime {
  id: string;
  serviceAr: string;
  processAr: string;
  dependencies: string[];
  recoveryTimeMinutes: number;
  recoveryTimeDisplay: string;
}

export const serviceRecoveryTimes: ServiceRecoveryTime[] = [
  {
    id: 'classroom_teaching',
    serviceAr: 'تقديم العملية التعليمية',
    processAr: 'تدريس المقررات الدراسية حضورياً في المبنى المدرسي',
    dependencies: ['إدارة التعليم', 'شركة تطوير'],
    recoveryTimeMinutes: 2880, // 48 ساعة
    recoveryTimeDisplay: '48 ساعة'
  },
  {
    id: 'remote_teaching',
    serviceAr: 'تقديم العملية التعليمية',
    processAr: 'تدريس المقررات الدراسية عن بعد من خلال المنصات الإلكترونية',
    dependencies: ['الإدارة العامة للتعليم الإلكتروني والتعليم عن بعد'],
    recoveryTimeMinutes: 4320, // 72 ساعة
    recoveryTimeDisplay: '72 ساعة'
  },
  {
    id: 'broadcast_teaching',
    serviceAr: 'تقديم العملية التعليمية',
    processAr: 'تدريس المقررات الدراسية من خلال البث التعليمي عبر قنوات عين',
    dependencies: ['الإدارة العامة للاتصال المؤسسي'],
    recoveryTimeMinutes: 7200, // 120 ساعة (5 أيام)
    recoveryTimeDisplay: '120 ساعة'
  },
  {
    id: 'noor_system',
    serviceAr: 'نظام الشؤون التعليمية',
    processAr: 'نظام نور',
    dependencies: ['الإدارة العامة للتحول الرقمي', 'وكالة التعليم العام'],
    recoveryTimeMinutes: 1440, // 24 ساعة
    recoveryTimeDisplay: '24 ساعة'
  },
  {
    id: 'faris_system',
    serviceAr: 'نظام الشؤون الإدارية',
    processAr: 'نظام فارس',
    dependencies: ['وكالة الموارد البشرية'],
    recoveryTimeMinutes: 1440, // 24 ساعة
    recoveryTimeDisplay: '24 ساعة'
  }
];

// ============================================
// جهات الاتصال الخارجية
// ============================================

export interface ExternalContact {
  id: string;
  entityAr: string;
  entityEn: string;
  contactPurpose: string;
  contactTiming: string;
  phone?: string;
  email?: string;
}

export const externalContacts: ExternalContact[] = [
  {
    id: 'tatweer',
    entityAr: 'شركة تطوير',
    entityEn: 'Tatweer Company',
    contactPurpose: 'مشاكل المباني والموارد الحيوية',
    contactTiming: 'عند وجود اضطراب بحسب كل فرضية'
  },
  {
    id: 'it_systems',
    entityAr: 'الأنظمة وخدمات تقنية المعلومات',
    entityEn: 'IT Systems and Services',
    contactPurpose: 'مشاكل تقنية المعلومات',
    contactTiming: 'عند وجود اضطراب بحسب كل فرضية'
  },
  {
    id: 'info_security',
    entityAr: 'أمن المعلومات',
    entityEn: 'Information Security',
    contactPurpose: 'حوادث الأمن السيبراني',
    contactTiming: 'عند وجود حوادث سيبرانية'
  },
  {
    id: 'police',
    entityAr: 'الشرطة',
    entityEn: 'Police',
    contactPurpose: 'الاضطرابات الأمنية',
    contactTiming: 'عند الاضطرابات الأمنية',
    phone: '911'
  },
  {
    id: 'civil_defense',
    entityAr: 'الدفاع المدني',
    entityEn: 'Civil Defense',
    contactPurpose: 'الحرائق والكوارث',
    contactTiming: 'عند الحريق',
    phone: '998'
  },
  {
    id: 'ambulance',
    entityAr: 'الإسعاف',
    entityEn: 'Ambulance',
    contactPurpose: 'إصابة منسوبي المدرسة',
    contactTiming: 'عند إصابة أحد منسوبي المدرسة',
    phone: '997'
  }
];

// ============================================
// دوال مساعدة
// ============================================

/**
 * الحصول على RTO بناءً على نوع النشاط
 */
export function getRTOForActivity(activityId: string): number | null {
  const activity = criticalActivities.find(a => a.id === activityId);
  return activity ? activity.rtoMinutes : null;
}

/**
 * الحصول على MAO بناءً على نوع النشاط
 */
export function getMAOForActivity(activityId: string): number | null {
  const activity = criticalActivities.find(a => a.id === activityId);
  return activity ? activity.maoMinutes : null;
}

/**
 * الحصول على مستوى الاضطراب بناءً على نسبة الغياب
 */
export function getDisruptionLevelByAbsence(absencePercentage: number): DisruptionLevel {
  if (absencePercentage >= 60) {
    return disruptionLevels[2]; // المستوى الثالث
  } else if (absencePercentage >= 30) {
    return disruptionLevels[1]; // المستوى الثاني
  }
  return disruptionLevels[0]; // المستوى الأول
}

/**
 * الحصول على مستوى الاضطراب بناءً على مدة الانقطاع بالساعات
 */
export function getDisruptionLevelByDuration(durationHours: number): DisruptionLevel {
  if (durationHours > 336) { // أكثر من أسبوعين
    return disruptionLevels[3]; // المستوى الرابع
  } else if (durationHours > 72) { // أكثر من 3 أيام
    return disruptionLevels[2]; // المستوى الثالث
  } else if (durationHours > 24) { // أكثر من يوم
    return disruptionLevels[1]; // المستوى الثاني
  }
  return disruptionLevels[0]; // المستوى الأول
}

/**
 * تحديد ما إذا كان وقت الاستجابة ضمن RTO
 */
export function isWithinRTO(activityId: string, responseMinutes: number): boolean {
  const rto = getRTOForActivity(activityId);
  return rto !== null && responseMinutes <= rto;
}

/**
 * تحديد ما إذا كان وقت التعافي ضمن MAO
 */
export function isWithinMAO(activityId: string, recoveryMinutes: number): boolean {
  const mao = getMAOForActivity(activityId);
  return mao !== null && recoveryMinutes <= mao;
}

/**
 * تقييم أداء الاستجابة والتعافي
 */
export function evaluateIncidentPerformance(
  activityId: string,
  responseMinutes: number,
  recoveryMinutes: number
): {
  responseRating: 1 | 2 | 3 | 4 | 5;
  recoveryRating: 1 | 2 | 3 | 4 | 5;
  overallRating: 1 | 2 | 3 | 4 | 5;
  isCompliant: boolean;
} {
  const rto = getRTOForActivity(activityId) || 420;
  const mao = getMAOForActivity(activityId) || 2880;

  // تقييم الاستجابة
  let responseRating: 1 | 2 | 3 | 4 | 5;
  if (responseMinutes <= rto * 0.5) {
    responseRating = 5; // ممتاز
  } else if (responseMinutes <= rto) {
    responseRating = 4; // جيد جداً
  } else if (responseMinutes <= rto * 1.5) {
    responseRating = 3; // جيد
  } else if (responseMinutes <= rto * 2) {
    responseRating = 2; // مقبول
  } else {
    responseRating = 1; // ضعيف
  }

  // تقييم التعافي
  let recoveryRating: 1 | 2 | 3 | 4 | 5;
  if (recoveryMinutes <= mao * 0.5) {
    recoveryRating = 5; // ممتاز
  } else if (recoveryMinutes <= mao) {
    recoveryRating = 4; // جيد جداً
  } else if (recoveryMinutes <= mao * 1.5) {
    recoveryRating = 3; // جيد
  } else if (recoveryMinutes <= mao * 2) {
    recoveryRating = 2; // مقبول
  } else {
    recoveryRating = 1; // ضعيف
  }

  // التقييم الإجمالي
  const overallRating = Math.round((responseRating + recoveryRating) / 2) as 1 | 2 | 3 | 4 | 5;

  return {
    responseRating,
    recoveryRating,
    overallRating,
    isCompliant: responseMinutes <= rto && recoveryMinutes <= mao
  };
}

// ============================================
// المصطلحات والتعريفات
// ============================================

export const definitions = {
  RTO: {
    ar: 'زمن الاسترداد المستهدف',
    en: 'Recovery Time Objective',
    description: 'الوقت المستهدف الذي تستغرقه الوزارة لاستعادة العملية التعليمية بعد وقوع اضطراب'
  },
  MAO: {
    ar: 'أعلى وقت مقبول للانقطاع',
    en: 'Maximum Acceptable Outage',
    description: 'مقدار الوقت المسموح به الذي يمكن فيه تحمل انقطاع سير العملية التعليمية'
  },
  RPO: {
    ar: 'النقطة المستهدفة لاسترجاع البيانات',
    en: 'Recovery Point Objective',
    description: 'أقصى مدة مقبولة لفقدان البيانات من آخر نسخة احتياطية'
  },
  BIA: {
    ar: 'تحليل أثر توقف الأعمال',
    en: 'Business Impact Analysis',
    description: 'إجراءات لتحليل أنشطة الوحدات التعليمية وتحديد حساسيتها أثناء الاضطرابات'
  },
  BCM: {
    ar: 'إدارة استمرارية الأعمال',
    en: 'Business Continuity Management',
    description: 'إطار عمل شامل لضمان استمرار العمليات الحيوية أثناء الاضطرابات'
  },
  DR: {
    ar: 'مركز بيانات احتياطي',
    en: 'Disaster Recovery',
    description: 'مرفق مادي أو إلكتروني سحابي لإيواء البرامج والبيانات الحساسة'
  }
};

export default {
  criticalActivities,
  criticalSystems,
  riskCategories,
  disruptionLevels,
  scenarios,
  serviceRecoveryTimes,
  externalContacts,
  definitions,
  getRTOForActivity,
  getMAOForActivity,
  getDisruptionLevelByAbsence,
  getDisruptionLevelByDuration,
  isWithinRTO,
  isWithinMAO,
  evaluateIncidentPerformance
};
