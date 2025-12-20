/**
 * Incident Configuration
 * 
 * This file contains the risk level mappings and alert type calculation logic
 * for the Incidents component.
 * 
 * Risk Levels are mapped to Incident Categories based on SharePoint schema.
 * Values match exactly with SBC_Incidents_Log SharePoint list.
 */

/**
 * All Incident Categories from SharePoint
 */
export const incidentCategories = [
  'تعطل البنية التحتية',
  'نقص الموارد البشرية',
  'تعطل الأنظمة/المنصات التعليمية',
  'اضطراب أمني',
  'فقدان الاتصالات/الإنترنت',
]

/**
 * All risk levels in order, organized by category
 * These correspond to the RiskLevel choice field in SBC_Incidents_Log
 */
export const allRiskLevels = [
  // Category: تعطل البنية التحتية (0-2) - 3 levels
  'تعذر استخدام المبنى المدرسي ليوم واحد',
  'تعذر استخدام المبنى المدرسي لأكثر من يوم واحد إلى 3 أيام',
  'تعذر استخدام المبنى المدرسي لأكثر من ثلاثة أيام إلى شهر',
  
  // Category: نقص الموارد البشرية (3-6) - 4 levels
  'غياب أقل من 30% من المعلمين',
  'غياب أكثر من 30% من المعلمين',
  'غياب أكثر من 60% من المعلمين',
  'غياب كافة المعلمين',
  
  // Category: تعطل الأنظمة/المنصات التعليمية (7-10) - 4 levels
  'تعطل الأنظمة لا يزيد عن 8 ساعات',
  'تعطل الأنظمة أكثر من 8 ساعات إلى خمسة أيام',
  'تعطل الأنظمة أكثر من خمسة أيام',
  'تعطل الأنظمة أكثر من أسبوعين',
  
  // Category: اضطراب أمني (11-14) - 4 levels
  'اضطراب أمني خارج حدود المدرسة يؤثر على استمرار التعليم بالمدرسة ليوم أو أقل',
  'اضطراب أمني يؤثر على استمرار التعليم بالمدرسة لأكثر من يوم إلى 3 أيام',
  'اضطراب أمني يؤثر على استمرار التعليم بالمدرسة لأكثر من ثلاثة أيام إلى أسبوعين',
  'اضطراب أمني يؤثر على استمرار التعليم بالمدرسة لأكثر من أسبوعين',
  
  // Category: فقدان الاتصالات/الإنترنت (15-18) - 4 levels
  'انقطاع الاتصالات ليومين أو أقل',
  'انقطاع الاتصالات أكثر من يومين إلى خمسة أيام',
  'انقطاع الاتصالات أكثر من خمسة أيام إلى أسبوعين',
  'انقطاع الاتصالات أكثر من أسبوعين',
]

/**
 * Maps each incident category to its corresponding risk levels
 * start: index in allRiskLevels where this category's risks begin
 * count: number of risk levels for this category
 */
export const categoryToRiskLevelMapping: Record<string, { start: number; count: number }> = {
  'تعطل البنية التحتية': { start: 0, count: 3 },
  'نقص الموارد البشرية': { start: 3, count: 4 },
  'تعطل الأنظمة/المنصات التعليمية': { start: 7, count: 4 },
  'اضطراب أمني': { start: 11, count: 4 },
  'فقدان الاتصالات/الإنترنت': { start: 15, count: 4 },
}

/**
 * AlertModelType values from SharePoint
 * أخضر (نموذج رصد ومراقبة) - Green - Monitoring - Least severe
 * أصفر (نموذج تحذير) - Yellow - Warning - Medium severity
 * أحمر (نموذج إنذار) - Red - Alert - Most severe
 */
export const alertModelTypes = {
  green: 'أخضر (نموذج رصد ومراقبة)',
  yellow: 'أصفر (نموذج تحذير)',
  red: 'أحمر (نموذج إنذار)',
}

/**
 * Determines the alert model type based on risk level and category
 * Logic:
 * - First risk level (least severe, index 0) → أخضر (نموذج رصد ومراقبة)
 * - Second risk level (index 1) → أصفر (نموذج تحذير)
 * - Third+ risk levels (most severe, index 2+) → أحمر (نموذج إنذار)
 */
export const getAlertTypeForRiskLevel = (riskLevel: string, category: string): string => {
  // Get the mapping for this category
  const mapping = categoryToRiskLevelMapping[category]
  if (!mapping) return alertModelTypes.green
  
  // Find the index of this risk level within allRiskLevels
  const riskIndex = allRiskLevels.indexOf(riskLevel)
  if (riskIndex === -1) return alertModelTypes.green
  
  // Calculate relative position within the category's risks
  const relativeIndex = riskIndex - mapping.start
  
  // Determine alert type based on severity level
  // Index 0 = least severe (Green), Index 1 = medium (Yellow), Index 2+ = most severe (Red)
  if (relativeIndex === 0) {
    return alertModelTypes.green  // أخضر (نموذج رصد ومراقبة)
  } else if (relativeIndex === 1) {
    return alertModelTypes.yellow  // أصفر (نموذج تحذير)
  } else {
    return alertModelTypes.red  // أحمر (نموذج إنذار)
  }
}
