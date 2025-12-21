// SharePoint Service for Power Platform Code App
// Connects to SharePoint lists via Power SDK when running in Power Apps
// Falls back to embedded/mock data for local development

import schoolsData from '../data/schools';
import { 
  SchoolInfoService,
  BC_Teams_MembersService,
  SBC_Drills_LogService,
  SBC_Incidents_LogService,
  School_Training_LogService,
  Coordination_Programs_CatalogService
} from '../generated';
import { isPowerAppsEnvironment, getSharePointItemLink } from './powerSDKClient';

// SharePoint Site and List Configuration
const SHAREPOINT_SITE = 'https://saudimoe.sharepoint.com/sites/em';

// SharePoint List Names (matching your SharePoint site)
const LISTS = {
  SCHOOL_INFO: "SchoolInfo",
  TEAM_MEMBERS: "BC_Teams_Members",
  DRILLS_LOG: "SBC_Drills_Log",  // Also used for admin drill plans with IsAdminPlan=true
  INCIDENTS_LOG: "SBC_Incidents_Log",
  TRAINING_LOG: "School_Training_Log",
  TRAINING_CATALOG: "Coordination_Programs_Catalog",
};

// Helper function to extract value from SharePoint choice fields
// SharePoint can return choice fields as: {Value: "..."}, {@odata.type: "...", Id: ..., Value: "..."}, or plain string
const extractChoiceValue = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object') {
    // Handle {Value: "..."} or {@odata.type, Id, Value} format
    if (field.Value !== undefined) return String(field.Value);
    if (field.Title !== undefined) return String(field.Title);
  }
  return String(field);
};

// Helper to extract array of choice values (for multi-select fields)
const extractMultiChoiceValues = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) {
    return field.map(item => extractChoiceValue(item)).filter(v => v).join('، ');
  }
  return extractChoiceValue(field);
};

// ============ INTERFACES ============

export interface SchoolInfo {
  Id: number;
  Title: string;
  SchoolName: string;
  SchoolID: string;
  Level: string;
  SchoolGender: string;
  SchoolType: string;
  EducationType: string;
  StudyTime: string;
  BuildingOwnership: string;
  SectorDescription: string;
  PrincipalName: string;
  PrincipalID: string;
  principalEmail: string;
  PrincipalPhone: string;
  SchoolEmail: string;
  Latitude: string;
  Longitude: string;
}

export interface TeamMember {
  Id?: number;
  Title: string;
  JobRole: string;
  MembershipType: string;
  SchoolName_Ref?: string;
  SchoolName_RefId?: number;
  MemberEmail?: string;
  MemberMobile?: string;
  SharePointLink?: string;
  HasAttachments?: boolean;
}

export interface Drill {
  Id?: number;
  Title: string;
  SchoolName_Ref?: string;
  SchoolName_RefId?: number;
  DrillHypothesis?: string;
  SpecificEvent?: string;
  TargetGroup?: string;
  ExecutionDate?: string;
  AttachmentUrl?: string;
  DrillAttachments?: string;
  HasAttachments?: boolean;
  SharePointLink?: string;
  Created?: string;
  // New fields for Admin Drill Plans
  IsAdminPlan?: boolean;       // true = admin template, false/undefined = school execution
  StartDate?: string;          // تاريخ بداية التنفيذ (for admin plans)
  EndDate?: string;            // تاريخ نهاية التنفيذ (for admin plans)
  PlanStatus?: string;         // حالة الخطة (مخطط/متاح/مكتمل/مؤجل)
  Quarter?: number;            // الربع (1-4)
  Responsible?: string;        // المسؤول عن المتابعة
  Notes?: string;              // ملاحظات
  AcademicYear?: string;       // السنة الدراسية
  // تقييم المدرسة لفعالية الخطة والإجراءات
  PlanEffectivenessRating?: number;       // Number field in SharePoint
  ProceduresEffectivenessRating?: number; // Number field in SharePoint
  SchoolFeedback?: string;                // Multi-line text in SharePoint
  ImprovementSuggestions?: string;        // Multi-line text in SharePoint
}

export interface Incident {
  Id?: number;
  Title: string;
  SchoolName_Ref?: string;
  SchoolName_RefId?: number;
  IncidentCategory?: string;
  ActivatedAlternative?: string;
  RiskLevel?: string;
  ActivationTime?: string;
  AlertModelType?: string;
  HazardDescription?: string;
  CoordinatedEntities?: string;
  ActionTaken?: string;
  AltLocation?: string;
  CommunicationDone?: boolean;
  ClosureTime?: string;
  Challenges?: string;
  LessonsLearned?: string;
  Suggestions?: string;
  IncidentNumber?: number; // رقم بلاغ الدعم الموحد
  SharePointLink?: string;
  Created?: string;
  // Dynamic Evaluation Fields (calculated automatically)
  ResponseTimeMinutes?: number;    // Time from Created to ActivationTime
  RecoveryTimeHours?: number;      // Time from ActivationTime to ClosureTime
  ResponseRating?: number;         // 1-5 rating for response speed
  CoordinationRating?: number;     // 1-5 rating for coordination
  CommunicationRating?: number;    // 1-5 rating for communication
  RecoveryRating?: number;         // 1-5 rating for recovery
  OverallRating?: number;          // Average of all ratings
  EvaluationNotes?: string;        // Admin notes on evaluation
  IsEvaluated?: boolean;           // Has been evaluated
}

export interface TrainingProgram {
  Id?: number;
  Title: string;
  ProviderEntity?: string;
  ActivityType?: string;
  TargetAudience?: string;
  Date?: string;
  ExecutionMode?: string;
  CoordinationStatus?: string;
  Status?: string;
}

export interface TrainingLog {
  Id?: number;
  Title: string;
  Program_Ref?: string;
  Program_RefId?: number;
  SchoolName_Ref?: string;
  SchoolName_RefId?: number;
  RegistrationType?: string;
  AttendeesNames?: string;
  TrainingDate?: string;
  Status?: string;
  Created?: string;  // Date when school clicked registration button
  GeneralNotes?: string;  // From SharePoint if exists, else computed from Program_Ref + Created
}

// AdminDrillPlan is now merged into Drill interface with IsAdminPlan=true
// This avoids creating a new SharePoint list - we use SBC_Drills_Log with IsAdminPlan column
export type AdminDrillPlan = Drill;

export interface ChoiceOption {
  key: string;
  text: string;
}

// ============ BC_DR_CHECKLIST ============
export interface BCDRChecklist {
  Id?: number;
  Title: string;  // Item name
  Category: string;  // Category (e.g., Hardware, Software, Network, etc.)
  Status: string;  // Status (e.g., جاهز, يحتاج صيانة, غير جاهز)
  LastChecked?: string;  // Last check date
  CheckedBy?: string;  // Person who checked
  Notes?: string;  // Additional notes
  SortOrder?: number;  // For custom ordering
}

// ============ INCIDENT EVALUATION CALCULATOR ============
// Calculates evaluation ratings automatically based on incident data

export interface IncidentEvaluation {
  ResponseTimeMinutes: number;
  RecoveryTimeHours: number;
  ResponseRating: number;
  CoordinationRating: number;
  CommunicationRating: number;
  RecoveryRating: number;
  OverallRating: number;
}

export function calculateIncidentEvaluation(incident: Incident): IncidentEvaluation {
  // Default values if dates are missing
  let responseMinutes = 0;
  let recoveryHours = 0;
  
  // 1. Calculate Response Time (Created to ActivationTime)
  if (incident.Created && incident.ActivationTime) {
    const created = new Date(incident.Created);
    const activated = new Date(incident.ActivationTime);
    responseMinutes = Math.max(0, (activated.getTime() - created.getTime()) / (1000 * 60));
  }
  
  // 2. Calculate Recovery Time (ActivationTime to ClosureTime)
  if (incident.ActivationTime && incident.ClosureTime) {
    const activated = new Date(incident.ActivationTime);
    const closed = new Date(incident.ClosureTime);
    recoveryHours = Math.max(0, (closed.getTime() - activated.getTime()) / (1000 * 60 * 60));
  }
  
  // 3. Response Rating (based on response time in minutes)
  let responseRating = 1;
  if (responseMinutes <= 15) responseRating = 5;
  else if (responseMinutes <= 30) responseRating = 4;
  else if (responseMinutes <= 60) responseRating = 3;
  else if (responseMinutes <= 120) responseRating = 2;
  
  // 4. Coordination Rating (based on coordinated entities)
  let coordinationRating = 2; // Default: internal only
  if (incident.CoordinatedEntities) {
    const entities = incident.CoordinatedEntities.split(/[,،]/).filter(e => e.trim()).length;
    if (entities >= 3) coordinationRating = 5;
    else if (entities >= 2) coordinationRating = 4;
    else if (entities >= 1) coordinationRating = 3;
  }
  
  // 5. Communication Rating (based on CommunicationDone)
  let communicationRating = incident.CommunicationDone ? 4 : 1;
  // Bonus if communication was quick (within first hour of recovery)
  if (incident.CommunicationDone && recoveryHours > 0 && recoveryHours <= 1) {
    communicationRating = 5;
  }
  
  // 6. Recovery Rating (based on recovery time in hours)
  let recoveryRating = 1;
  if (recoveryHours > 0) {
    if (recoveryHours <= 2) recoveryRating = 5;
    else if (recoveryHours <= 4) recoveryRating = 4;
    else if (recoveryHours <= 8) recoveryRating = 3;
    else if (recoveryHours <= 24) recoveryRating = 2;
    // Bonus for using alternative location
    if (incident.AltLocation && recoveryRating < 5) {
      recoveryRating = Math.min(5, recoveryRating + 1);
    }
  }
  
  // 7. Overall Rating (average)
  const overallRating = (responseRating + coordinationRating + communicationRating + recoveryRating) / 4;
  
  return {
    ResponseTimeMinutes: Math.round(responseMinutes),
    RecoveryTimeHours: Math.round(recoveryHours * 10) / 10,
    ResponseRating: responseRating,
    CoordinationRating: coordinationRating,
    CommunicationRating: communicationRating,
    RecoveryRating: recoveryRating,
    OverallRating: Math.round(overallRating * 10) / 10
  };
}

// Get rating label in Arabic
export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return 'ممتاز';
  if (rating >= 3.5) return 'جيد جداً';
  if (rating >= 2.5) return 'جيد';
  if (rating >= 1.5) return 'مقبول';
  return 'يحتاج تحسين';
}

// Get rating color for UI
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return '#107c10'; // Green
  if (rating >= 3.5) return '#0078d4'; // Blue
  if (rating >= 2.5) return '#ffaa00'; // Orange
  if (rating >= 1.5) return '#d83b01'; // Dark Orange
  return '#a80000'; // Red
}

// ============ MOCK DATA (for local development fallback) ============

const mockTeamMembers: TeamMember[] = [];

const mockDrills: Drill[] = [];

const mockIncidents: Incident[] = [];

const mockTrainingPrograms: TrainingProgram[] = [];

const mockTrainingLog: TrainingLog[] = [];

// ============ DATA TRANSFORMERS ============

// Transform TeamMember from SharePoint format
const transformTeamMember = (raw: any): TeamMember => {
  const id = raw.ID || raw.Id || 0;
  return {
    Id: id,
    Title: raw.Title || '',
    SchoolName_Ref: raw.SchoolName_Ref?.Value || raw.SchoolName_Ref || '',
    SchoolName_RefId: raw['SchoolName_Ref#Id'] || raw.SchoolName_RefId,
    JobRole: typeof raw.JobRole === 'object' ? raw.JobRole.Value : (raw.JobRole || ''),
    MembershipType: typeof raw.MembershipType === 'object' ? raw.MembershipType.Value : (raw.MembershipType || ''),
    MemberEmail: raw.MemberEmail || '',
    MemberMobile: raw.Mobile?.toString() || raw.MemberMobile || '',
    SharePointLink: raw['{Link}'] || getSharePointItemLink('BC_Teams_Members', id),
    HasAttachments: raw['{HasAttachments}'] || false,
  };
};

// Transform Drill from SharePoint format
const transformDrill = (raw: any): Drill => {
  const id = raw.ID || raw.Id || 0;
  return {
    Id: id,
    Title: raw.Title || '',
    SchoolName_Ref: raw.SchoolName_Ref?.Value || raw.SchoolName_Ref || '',
    SchoolName_RefId: raw['SchoolName_Ref#Id'] || raw.SchoolName_RefId,
    DrillHypothesis: typeof raw.DrillHypothesis === 'object' ? raw.DrillHypothesis.Value : (raw.DrillHypothesis || ''),
    SpecificEvent: raw.SpecificEvent || '',
    TargetGroup: typeof raw.TargetGroup === 'object' ? raw.TargetGroup.Value : (raw.TargetGroup || ''),
    ExecutionDate: raw.ExecutionDate || '',
    DrillAttachments: raw.DrillAttachments || '',
    AttachmentUrl: raw.DrillAttachments || raw.AttachmentUrl || '',
    HasAttachments: raw['{HasAttachments}'] || !!raw.DrillAttachments,
    SharePointLink: raw['{Link}'] || getSharePointItemLink('SBC_Drills_Log', id),
    Created: raw.Created || '',
    // New admin plan fields
    IsAdminPlan: raw.IsAdminPlan === true || raw.IsAdminPlan === 'Yes' || raw.IsAdminPlan === 1,
    StartDate: raw.StartDate || '',
    EndDate: raw.EndDate || '',
    PlanStatus: typeof raw.PlanStatus === 'object' ? raw.PlanStatus.Value : (raw.PlanStatus || ''),
    Quarter: raw.Quarter || 0,
    Responsible: raw.Responsible || '',
    Notes: raw.Notes || '',
    AcademicYear: raw.AcademicYear || '',
    // Evaluation fields - exact SharePoint column names
    PlanEffectivenessRating: raw.PlanEffectivenessRating || undefined,
    ProceduresEffectivenessRating: raw.ProceduresEffectivenessRating || undefined,
    SchoolFeedback: raw.SchoolFeedback || '',
    ImprovementSuggestions: raw.ImprovementSuggestions || '',
  };
};

// Transform Incident from SharePoint format
const transformIncident = (raw: any): Incident => {
  const id = raw.ID || raw.Id || 0;
  return {
    Id: id,
    Title: raw.Title || '',
    SchoolName_Ref: raw.SchoolName_Ref?.Value || raw.SchoolName_Ref || '',
    SchoolName_RefId: raw['SchoolName_Ref#Id'] || raw.SchoolName_RefId,
    IncidentCategory: typeof raw.IncidentCategory === 'object' ? raw.IncidentCategory.Value : (raw.IncidentCategory || ''),
    ActivatedAlternative: typeof raw.ActivatedAlternative === 'object' ? raw.ActivatedAlternative.Value : (raw.ActivatedAlternative || ''),
    RiskLevel: typeof raw.RiskLevel === 'object' ? raw.RiskLevel.Value : (raw.RiskLevel || ''),
    ActivationTime: raw.ActivationTime || '',
    AlertModelType: typeof raw.AlertModelType === 'object' ? raw.AlertModelType.Value : (raw.AlertModelType || ''),
    HazardDescription: raw.HazardDescription || '',
    CoordinatedEntities: typeof raw.CoordinatedEntities === 'object' ? raw.CoordinatedEntities.Value : (raw.CoordinatedEntities || ''),
    IncidentNumber: raw.IncidentNumber ? String(raw.IncidentNumber) : '',
    ActionTaken: typeof raw.ActionTaken === 'object' ? raw.ActionTaken.Value : (raw.ActionTaken || ''),
    AltLocation: typeof raw.AltLocation === 'object' ? raw.AltLocation.Value : (raw.AltLocation || ''),
    CommunicationDone: raw.CommunicationDone || false,
    ClosureTime: raw.ClosureTime || '',
    Challenges: raw.Challenges || '',
    LessonsLearned: raw.LessonsLearned || '',
    Suggestions: raw.Suggestions || '',
    SharePointLink: raw['{Link}'] || getSharePointItemLink('SBC_Incidents_Log', id),
    Created: raw.Created || '',
  };
};

// Transform TrainingProgram from SharePoint format
const transformTrainingProgram = (raw: any): TrainingProgram => {
  console.log('[Transform] Raw training program data:', JSON.stringify(raw, null, 2));
  
  // Get status from CoordinationStatus field (SharePoint uses this name)
  // Handle both object format {Value: "..."} and direct string format
  let status = '';
  if (raw.CoordinationStatus) {
    if (typeof raw.CoordinationStatus === 'object' && raw.CoordinationStatus.Value) {
      status = raw.CoordinationStatus.Value;
    } else if (typeof raw.CoordinationStatus === 'string') {
      status = raw.CoordinationStatus;
    }
  }
  if (!status && raw.Status) {
    status = typeof raw.Status === 'object' ? raw.Status.Value : raw.Status;
  }
  
  // Handle ExecutionMode - can be object or string
  let executionMode = '';
  if (raw.ExecutionMode) {
    if (typeof raw.ExecutionMode === 'object' && raw.ExecutionMode.Value) {
      executionMode = raw.ExecutionMode.Value;
    } else if (typeof raw.ExecutionMode === 'string') {
      executionMode = raw.ExecutionMode;
    }
  }
  
  // Handle TargetAudience which can be an array of objects, single object, or string
  let targetAudience = '';
  if (raw.TargetAudience) {
    if (Array.isArray(raw.TargetAudience)) {
      targetAudience = raw.TargetAudience.map((t: any) => 
        typeof t === 'object' ? (t.Value || t.Title || '') : t
      ).filter((t: string) => t).join('، ');
    } else if (typeof raw.TargetAudience === 'object' && raw.TargetAudience.Value) {
      targetAudience = raw.TargetAudience.Value;
    } else if (typeof raw.TargetAudience === 'string') {
      targetAudience = raw.TargetAudience;
    }
  }
  
  // Handle ProviderEntity
  let providerEntity = '';
  if (raw.ProviderEntity) {
    if (typeof raw.ProviderEntity === 'object' && raw.ProviderEntity.Value) {
      providerEntity = raw.ProviderEntity.Value;
    } else if (typeof raw.ProviderEntity === 'string') {
      providerEntity = raw.ProviderEntity;
    }
  }
  
  // Handle ActivityType
  let activityType = '';
  if (raw.ActivityType) {
    if (typeof raw.ActivityType === 'object' && raw.ActivityType.Value) {
      activityType = raw.ActivityType.Value;
    } else if (typeof raw.ActivityType === 'string') {
      activityType = raw.ActivityType;
    }
  }
  
  const result = {
    Id: raw.ID || raw.Id || 0,
    Title: raw.Title || '',
    ProviderEntity: providerEntity,
    ActivityType: activityType,
    TargetAudience: targetAudience,
    Date: raw.Date || raw.TrainingDate || '',
    ExecutionMode: executionMode,
    CoordinationStatus: status,
    Status: status,
  };
  
  console.log('[Transform] Transformed program:', result);
  return result;
};

// Transform TrainingLog from SharePoint format
const transformTrainingLog = (raw: any): TrainingLog => {
  // Handle Attendees field - can be array of objects or string
  let attendeeNames = '';
  
  // Try AttendeesNames first (multi-select lookup field)
  if (raw.AttendeesNames) {
    if (Array.isArray(raw.AttendeesNames)) {
      // Array of lookup objects: [{Id: 1, Value: "Name1"}, {Id: 2, Value: "Name2"}]
      attendeeNames = raw.AttendeesNames
        .map((item: any) => {
          if (typeof item === 'object') {
            return item.Value || item.Title || item.text || '';
          }
          return String(item);
        })
        .filter((name: string) => name)
        .join('، ');
    } else if (typeof raw.AttendeesNames === 'object') {
      // Single object or results array
      if (raw.AttendeesNames.results && Array.isArray(raw.AttendeesNames.results)) {
        attendeeNames = raw.AttendeesNames.results
          .map((item: any) => extractChoiceValue(item))
          .filter((v: string) => v)
          .join('، ');
      } else {
        attendeeNames = extractChoiceValue(raw.AttendeesNames);
      }
    } else {
      // Plain string
      attendeeNames = String(raw.AttendeesNames);
    }
  }
  
  // Fallback to Attendees field
  if (!attendeeNames && raw.Attendees) {
    attendeeNames = extractMultiChoiceValues(raw.Attendees);
  }
  
  // GeneralNotes is stored in Title field
  const title = extractChoiceValue(raw.Title) || '';
  const programName = extractChoiceValue(raw.Program_Ref) || '';
  
  return {
    Id: raw.ID || raw.Id || 0,
    Title: title,
    Program_Ref: programName,
    Program_RefId: raw['Program_Ref#Id'] || raw.Program_RefId,
    SchoolName_Ref: extractChoiceValue(raw.SchoolName_Ref) || '',
    SchoolName_RefId: raw['SchoolName_Ref#Id'] || raw.SchoolName_RefId,
    RegistrationType: extractChoiceValue(raw.RegistrationType) || '',
    AttendeesNames: attendeeNames || '',
    TrainingDate: extractChoiceValue(raw.TrainingDate) || '',
    Status: extractChoiceValue(raw.Status) || '',
    Created: raw.Created || '',
    GeneralNotes: title,  // GeneralNotes is stored in Title field
  };
};

// ============ DROPDOWN OPTIONS ============

const incidentCategoryOptions: ChoiceOption[] = [
  { key: "أمني", text: "أمني" },
  { key: "صحي", text: "صحي" },
  { key: "سلامة", text: "سلامة" },
  { key: "بيئي", text: "بيئي" },
  { key: "تقني", text: "تقني" },
  { key: "أخرى", text: "أخرى" },
];

const riskLevelOptions: ChoiceOption[] = [
  { key: "منخفض", text: "منخفض" },
  { key: "متوسط", text: "متوسط" },
  { key: "مرتفع", text: "مرتفع" },
  { key: "حرج", text: "حرج" },
];

const alertModelTypeOptions: ChoiceOption[] = [
  { key: "داخلي", text: "تنبيه داخلي" },
  { key: "خارجي", text: "تنبيه خارجي" },
  { key: "طوارئ", text: "حالة طوارئ" },
];

const activatedAlternativeOptions: ChoiceOption[] = [
  { key: "لا يوجد", text: "لا يوجد بديل" },
  { key: "مدرسة بديلة", text: "مدرسة بديلة (من التشغيل المتبادل)" },
  { key: "تعليم عن بعد", text: "التحول للتعليم عن بعد" },
  { key: "نقل مؤقت", text: "نقل مؤقت لمبنى آخر" },
  { key: "دمج فصول", text: "دمج الفصول" },
];

const coordinatedEntitiesOptions: ChoiceOption[] = [
  { key: "الدفاع المدني", text: "الدفاع المدني" },
  { key: "الهلال الأحمر", text: "الهلال الأحمر" },
  { key: "الشرطة", text: "الشرطة" },
  { key: "البلدية", text: "البلدية" },
  { key: "لا يوجد", text: "لا يوجد" },
];

const actionTakenOptions: ChoiceOption[] = [
  { key: "إخلاء", text: "إخلاء" },
  { key: "إسعاف", text: "إسعاف" },
  { key: "إطفاء", text: "إطفاء" },
  { key: "إبلاغ الجهات", text: "إبلاغ الجهات المختصة" },
  { key: "التشغيل المتبادل", text: "التشغيل المتبادل" },
  { key: "أخرى", text: "أخرى" },
];

const altLocationOptions: ChoiceOption[] = [
  { key: "مدرسة مجاورة", text: "مدرسة مجاورة" },
  { key: "مركز إيواء", text: "مركز إيواء" },
  { key: "لا يوجد", text: "لا يوجد" },
];

const drillHypothesisOptions: ChoiceOption[] = [
  { key: "الفرضية الأولى: تعذر استخدام المبنى المدرسي (كلي/جزئي).", text: "الفرضية الأولى: تعذر استخدام المبنى المدرسي (كلي/جزئي)." },
  { key: "الفرضية الثانية: تعطل الأنظمة والمنصات التعليمية (مدرستي/تيمز).", text: "الفرضية الثانية: تعطل الأنظمة والمنصات التعليمية (مدرستي/تيمز)." },
  { key: "الفرضية الثالثة: تعطل خدمة البث التعليمي (قنوات عين).", text: "الفرضية الثالثة: تعطل خدمة البث التعليمي (قنوات عين)." },
  { key: "الفرضية الرابعة: انقطاع الخدمات الأساسية (كهرباء/اتصال/مياه).", text: "الفرضية الرابعة: انقطاع الخدمات الأساسية (كهرباء/اتصال/مياه)." },
  { key: "الفرضية الخامسة: نقص الكوادر البشرية (جوائح/أوبئة).", text: "الفرضية الخامسة: نقص الكوادر البشرية (جوائح/أوبئة)." },
];

const targetGroupOptions: ChoiceOption[] = [
  { key: "إخلاء كامل (طلاب ومعلمين).", text: "إخلاء كامل (طلاب ومعلمين)." },
  { key: "تمرين مكتبي (فريق الأمن والسلامة فقط).", text: "تمرين مكتبي (فريق الأمن والسلامة فقط)." },
  { key: "محاكاة تقنية (عن بعد).", text: "محاكاة تقنية (عن بعد)." },
  { key: "إخلاء جزئي", text: "إخلاء جزئي" },
];

// ============ SERVICE IMPLEMENTATION ============

export const SharePointService = {
  // Check if running in Power Apps environment
  isLocalDevelopment: () => !isPowerAppsEnvironment(),
  
  // ===== OPTIONS =====
  getIncidentCategoryOptions: (): ChoiceOption[] => incidentCategoryOptions,
  getRiskLevelOptions: (): ChoiceOption[] => riskLevelOptions,
  getAlertModelTypeOptions: (): ChoiceOption[] => alertModelTypeOptions,
  getActivatedAlternativeOptions: (): ChoiceOption[] => activatedAlternativeOptions,
  getCoordinatedEntitiesOptions: (): ChoiceOption[] => coordinatedEntitiesOptions,
  getActionTakenOptions: (): ChoiceOption[] => actionTakenOptions,
  getAltLocationOptions: (): ChoiceOption[] => altLocationOptions,
  getDrillHypothesisOptions: (): ChoiceOption[] => drillHypothesisOptions,
  getTargetGroupOptions: (): ChoiceOption[] => targetGroupOptions,

  // ===== SCHOOL INFO =====
  async getSchoolInfo(schoolName?: string): Promise<SchoolInfo[]> {
    // Try Power SDK first when in Power Apps environment
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Loading schools using SchoolInfoService.getAll()...');
        // Use the generated SchoolInfoService which correctly maps to the schoolinfo data source
        // Pass top: 5000 to get all schools (default limit is 100)
        const result = await SchoolInfoService.getAll({ top: 5000 });
        console.log('[SharePoint] SchoolInfoService.getAll() result:', JSON.stringify(result, null, 2));
        if (result.success && result.data) {
          const rawData = result.data || [];
          // Field mapping based on actual SharePoint list structure:
          // Title = Education Department (الإدارة)
          // field_1 = School Name (اسم المدرسة)
          // field_2 = School ID (رقم المدرسة)
          // field_3 = Level (المرحلة) - Choice field
          // field_4 = Gender (النوع) - Choice field
          // field_5 = School Type (نمط المدرسة - نهاري/ليلي) - Choice field
          // field_6 = Education Type (نوع التعليم - تعليم عام بنين/بنات) - Choice field
          // field_7 = Principal ID
          // field_8 = Principal Name
          // field_9 = Principal Email
          // field_10 = Principal Phone
          // field_11 = Latitude
          // field_12 = Longitude
          // field_13 = Study Time (صباحي/مسائي) - Choice field
          // field_14 = Building Ownership - Choice field
          // field_15 = Sector Description
          // field_16 = School Email
          const schools: SchoolInfo[] = (Array.isArray(rawData) ? rawData : [rawData]).map((raw: any, index: number) => {
            console.log('[SharePoint] Raw school data:', JSON.stringify(raw, null, 2));
            return {
              Id: raw.ID || raw.Id || index + 1,
              Title: extractChoiceValue(raw.Title) || '',
              SchoolName: extractChoiceValue(raw.field_1) || extractChoiceValue(raw.SchoolName) || extractChoiceValue(raw.Title) || '',
              SchoolID: String(raw.field_2 || raw.SchoolID || ''),
              Level: extractChoiceValue(raw.field_3) || extractChoiceValue(raw.Level) || '',
              SchoolGender: extractChoiceValue(raw.field_4) || extractChoiceValue(raw.SchoolGender) || '',
              SchoolType: extractChoiceValue(raw.field_5) || extractChoiceValue(raw.SchoolType) || '',
              EducationType: extractChoiceValue(raw.field_6) || extractChoiceValue(raw.EducationType) || '',
              StudyTime: extractChoiceValue(raw.field_13) || extractChoiceValue(raw.StudyTime) || '',
              BuildingOwnership: extractChoiceValue(raw.field_14) || extractChoiceValue(raw.BuildingOwnership) || '',
              SectorDescription: extractChoiceValue(raw.field_15) || extractChoiceValue(raw.SectorDescription) || '',
              PrincipalName: extractChoiceValue(raw.field_8) || extractChoiceValue(raw.PrincipalName) || '',
              PrincipalID: String(raw.field_7 || raw.PrincipalID || ''),
              principalEmail: extractChoiceValue(raw.field_9) || extractChoiceValue(raw.principalEmail) || '',
              PrincipalPhone: String(raw.field_10 || raw.PrincipalPhone || ''),
              SchoolEmail: extractChoiceValue(raw.field_16) || extractChoiceValue(raw.SchoolEmail) || '',
              Latitude: String(raw.field_11 || raw.Latitude || ''),
              Longitude: String(raw.field_12 || raw.Longitude || ''),
            };
          });
          console.log(`[SharePoint] Loaded ${schools.length} schools from SchoolInfoService`);
          return schoolName ? schools.filter(s => s.SchoolName === schoolName) : schools;
        }
        console.error('[SharePoint] SchoolInfoService.getAll() failed. Success:', result.success);
        console.error('[SharePoint] Error details:', result.error);
      } catch (e: any) {
        console.error('[SharePoint] Error loading schools:', e);
        console.error('[SharePoint] Error message:', e?.message);
        console.error('[SharePoint] Error stack:', e?.stack);
      }
    }
    
    // Fallback to embedded schools data
    console.log('[SharePoint] Using embedded schools data...');
    const schools: SchoolInfo[] = schoolsData.map((s, index) => ({
      Id: index + 1,
      Title: s.Title,
      SchoolName: s.SchoolName,
      SchoolID: s.SchoolID,
      Level: s.Level,
      SchoolGender: s.SchoolGender,
      SchoolType: s.SchoolType,
      EducationType: s.EducationType,
      StudyTime: s.StudyTime,
      BuildingOwnership: s.BuildingOwnership,
      SectorDescription: s.SectorDescription,
      PrincipalName: s.PrincipalName,
      PrincipalID: s.PrincipalID,
      principalEmail: s.principalEmail,
      PrincipalPhone: s.PrincipalPhone,
      SchoolEmail: s.SchoolEmail,
      Latitude: s.Latitude,
      Longitude: s.Longitude,
    }));
    
    return schoolName ? schools.filter(s => s.SchoolName === schoolName) : schools;
  },

  async getSchoolIdByName(schoolName: string): Promise<number | null> {
    const schools = await this.getSchoolInfo(schoolName);
    return schools.length > 0 && schools[0].Id || null;
  },

  // ===== TEAM MEMBERS =====
  async getTeamMembers(schoolName?: string): Promise<TeamMember[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Loading team members using BC_Teams_MembersService.getAll()...');
        const result = await BC_Teams_MembersService.getAll();
        if (result.success && result.data) {
          const rawData = result.data || [];
          const members = (Array.isArray(rawData) ? rawData : [rawData]).map(transformTeamMember);
          console.log(`[SharePoint] Loaded ${members.length} team members`);
          return schoolName ? members.filter(m => m.SchoolName_Ref === schoolName) : members;
        }
        console.error('[SharePoint] Failed to load team members:', result.error);
      } catch (e) {
        console.error('[SharePoint] Error loading team members:', e);
      }
    }
    
    // Return mock data for local development
    return schoolName ? mockTeamMembers.filter(m => m.SchoolName_Ref === schoolName) : [...mockTeamMembers];
  },

  async createTeamMember(member: TeamMember, schoolId?: number): Promise<TeamMember> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Creating team member:', member);
        const item: any = {
          Title: member.Title,
        };
        
        // Set school reference using lookup object format
        if (schoolId) {
          item.SchoolName_Ref = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Id: schoolId,
            Value: member.SchoolName_Ref || '',
          };
        }
        
        // JobRole needs to be sent as an object for choice fields
        if (member.JobRole) {
          item.JobRole = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: member.JobRole,
          };
        }
        
        // MembershipType needs to be sent as an object for choice fields
        if (member.MembershipType) {
          item.MembershipType = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: member.MembershipType,
          };
        }
        
        if (member.MemberMobile) {
          item.Mobile = parseInt(member.MemberMobile.replace(/\D/g, ''), 10) || 0;
        }
        
        if (member.MemberEmail) {
          item.MemberEmail = member.MemberEmail;
        }
        
        console.log('[SharePoint] Sending item to create:', JSON.stringify(item, null, 2));
        const result = await BC_Teams_MembersService.create(item);
        if (result.success && result.data) {
          console.log('[SharePoint] Team member created successfully');
          return transformTeamMember(result.data);
        }
        console.error('[SharePoint] Failed to create team member:', result.error);
        throw new Error(JSON.stringify(result.error) || 'Failed to create team member');
      } catch (e) {
        console.error('[SharePoint] Error creating team member:', e);
        throw e;
      }
    }
    
    // Local development fallback
    const newMember = {
      ...member,
      Id: mockTeamMembers.length + 1,
    };
    mockTeamMembers.push(newMember);
    return newMember;
  },

  async updateTeamMember(id: number, member: TeamMember): Promise<TeamMember> {
    if (isPowerAppsEnvironment()) {
      try {
        const data: any = { Title: member.Title };
        
        if (member.MemberEmail) data.MemberEmail = member.MemberEmail;
        
        // JobRole needs to be sent as an object for choice fields
        if (member.JobRole) {
          data.JobRole = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: member.JobRole,
          };
        }
        
        // MembershipType needs to be sent as an object for choice fields
        if (member.MembershipType) {
          data.MembershipType = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: member.MembershipType,
          };
        }
        
        if (member.MemberMobile) {
          data.Mobile = parseInt(member.MemberMobile.replace(/\D/g, ''), 10) || 0;
        }
        
        console.log('[SharePoint] Updating team member:', id, JSON.stringify(data, null, 2));
        const result = await BC_Teams_MembersService.update(id.toString(), data);
        if (result.success) {
          return { ...member, Id: id };
        }
        throw new Error(String(result.error) || 'Failed to update');
      } catch (e: any) {
        console.error('[SharePoint] Error updating team member:', e);
        throw e;
      }
    }
    
    const idx = mockTeamMembers.findIndex(m => m.Id === id);
    if (idx !== -1) {
      mockTeamMembers[idx] = { ...member, Id: id };
    }
    return { ...member, Id: id };
  },

  async deleteTeamMember(id: number): Promise<void> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Deleting team member:', id);
        await BC_Teams_MembersService.delete(id.toString());
        return;
      } catch (e: any) {
        console.error('[SharePoint] Error deleting team member:', e);
        throw e;
      }
    }
    
    const idx = mockTeamMembers.findIndex(m => m.Id === id);
    if (idx !== -1) mockTeamMembers.splice(idx, 1);
  },

  // ===== DRILLS =====
  async getDrills(schoolName?: string): Promise<Drill[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Loading drills using SBC_Drills_LogService.getAll()...');
        const result = await SBC_Drills_LogService.getAll();
        if (result.success && result.data) {
          const rawData = result.data || [];
          const drills = (Array.isArray(rawData) ? rawData : [rawData]).map(transformDrill);
          console.log(`[SharePoint] Loaded ${drills.length} drills`);
          return schoolName ? drills.filter(d => d.SchoolName_Ref === schoolName) : drills;
        }
        console.error('[SharePoint] Failed to load drills:', result.error);
      } catch (e) {
        console.error('[SharePoint] Error loading drills:', e);
      }
    }
    
    return schoolName ? mockDrills.filter(d => d.SchoolName_Ref === schoolName) : [...mockDrills];
  },

  async createDrill(drill: Drill, schoolId?: number): Promise<Drill> {
    if (isPowerAppsEnvironment()) {
      try {
        const data: any = {
          Title: drill.Title,
          SpecificEvent: drill.SpecificEvent || '',
          ExecutionDate: drill.ExecutionDate || '',
        };
        
        if (schoolId) {
          data.SchoolName_Ref = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Id: schoolId,
          };
        }
        
        if (drill.DrillHypothesis) {
          data.DrillHypothesis = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: drill.DrillHypothesis,
          };
        }
        
        if (drill.TargetGroup) {
          data.TargetGroup = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: drill.TargetGroup,
          };
        }

        // Admin plan fields
        if (drill.IsAdminPlan) {
          data.IsAdminPlan = true;
        }
        if (drill.StartDate) {
          data.StartDate = drill.StartDate;
        }
        if (drill.EndDate) {
          data.EndDate = drill.EndDate;
        }
        if (drill.PlanStatus) {
          data.PlanStatus = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: drill.PlanStatus,
          };
        }
        if (drill.Quarter !== undefined) {
          data.Quarter = drill.Quarter;
        }
        if (drill.Responsible) {
          data.Responsible = drill.Responsible;
        }
        if (drill.Notes) {
          data.Notes = drill.Notes;
        }
        if (drill.AcademicYear) {
          data.AcademicYear = drill.AcademicYear;
        }
        
        // Evaluation fields - using exact SharePoint column names
        if (drill.PlanEffectivenessRating !== undefined) {
          data.PlanEffectivenessRating = drill.PlanEffectivenessRating;
        }
        if (drill.ProceduresEffectivenessRating !== undefined) {
          data.ProceduresEffectivenessRating = drill.ProceduresEffectivenessRating;
        }
        if (drill.SchoolFeedback) {
          data.SchoolFeedback = drill.SchoolFeedback;
        }
        if (drill.ImprovementSuggestions) {
          data.ImprovementSuggestions = drill.ImprovementSuggestions;
        }
        
        console.log('[SharePoint] Creating drill:', data);
        const result = await SBC_Drills_LogService.create(data);
        
        if (result.success && result.data) {
          return transformDrill(result.data);
        }
        // Handle error properly - extract message from error object
        const errorMsg = result.error 
          ? (typeof result.error === 'string' ? result.error : 
             (result.error as any)?.message || JSON.stringify(result.error))
          : 'فشل في إنشاء التمرين الفرضي';
        throw new Error(errorMsg);
      } catch (e: any) {
        console.error('[SharePoint] Error creating drill:', e);
        // Re-throw with proper error message
        const message = e?.message || (typeof e === 'string' ? e : JSON.stringify(e));
        throw new Error(message);
      }
    }
    
    const newId = Math.max(0, ...mockDrills.map(d => d.Id || 0)) + 1;
    const newDrill = { ...drill, Id: newId, Created: new Date().toISOString() };
    mockDrills.push(newDrill);
    return newDrill;
  },

  async updateDrill(id: number, drill: Drill): Promise<Drill> {
    if (isPowerAppsEnvironment()) {
      try {
        const data: any = {
          Title: drill.Title,
          SpecificEvent: drill.SpecificEvent || '',
          ExecutionDate: drill.ExecutionDate || '',
        };
        
        if (drill.DrillHypothesis) {
          data.DrillHypothesis = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: drill.DrillHypothesis,
          };
        }
        
        if (drill.TargetGroup) {
          data.TargetGroup = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: drill.TargetGroup,
          };
        }

        // Admin plan fields
        if (drill.IsAdminPlan !== undefined) {
          data.IsAdminPlan = drill.IsAdminPlan === true;
        }
        if (drill.StartDate) {
          data.StartDate = drill.StartDate;
        }
        if (drill.EndDate) {
          data.EndDate = drill.EndDate;
        }
        if (drill.PlanStatus) {
          data.PlanStatus = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: drill.PlanStatus,
          };
        }
        if (drill.Quarter !== undefined) {
          data.Quarter = drill.Quarter;
        }
        if (drill.Responsible !== undefined) {
          data.Responsible = drill.Responsible;
        }
        if (drill.Notes !== undefined) {
          data.Notes = drill.Notes;
        }
        if (drill.AcademicYear !== undefined) {
          data.AcademicYear = drill.AcademicYear;
        }
        
        // Evaluation fields - using exact SharePoint column names
        if (drill.PlanEffectivenessRating !== undefined) {
          data.PlanEffectivenessRating = drill.PlanEffectivenessRating;
        }
        if (drill.ProceduresEffectivenessRating !== undefined) {
          data.ProceduresEffectivenessRating = drill.ProceduresEffectivenessRating;
        }
        if (drill.SchoolFeedback !== undefined) {
          data.SchoolFeedback = drill.SchoolFeedback;
        }
        if (drill.ImprovementSuggestions !== undefined) {
          data.ImprovementSuggestions = drill.ImprovementSuggestions;
        }
        
        console.log('[SharePoint] Updating drill:', id, data);
        const result = await SBC_Drills_LogService.update(id.toString(), data);
        if (result.success) {
          return { ...drill, Id: id };
        }
        throw new Error(String(result.error) || 'Failed to update');
      } catch (e: any) {
        console.error('[SharePoint] Error updating drill:', e);
        throw e;
      }
    }
    
    const idx = mockDrills.findIndex(d => d.Id === id);
    if (idx !== -1) {
      mockDrills[idx] = { ...drill, Id: id };
    }
    return { ...drill, Id: id };
  },

  async deleteDrill(id: number): Promise<void> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Deleting drill:', id);
        await SBC_Drills_LogService.delete(id.toString());
        return;
      } catch (e: any) {
        console.error('[SharePoint] Error deleting drill:', e);
        throw e;
      }
    }
    
    const idx = mockDrills.findIndex(d => d.Id === id);
    if (idx !== -1) mockDrills.splice(idx, 1);
  },

  // ===== INCIDENTS =====
  async getIncidents(schoolName?: string): Promise<Incident[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Loading incidents using SBC_Incidents_LogService.getAll()...');
        const result = await SBC_Incidents_LogService.getAll();
        if (result.success && result.data) {
          const rawData = result.data || [];
          const incidents = (Array.isArray(rawData) ? rawData : [rawData]).map(transformIncident);
          console.log(`[SharePoint] Loaded ${incidents.length} incidents`);
          return schoolName ? incidents.filter(i => i.SchoolName_Ref === schoolName) : incidents;
        }
        console.error('[SharePoint] Failed to load incidents:', result.error);
      } catch (e) {
        console.error('[SharePoint] Error loading incidents:', e);
      }
    }
    
    return schoolName ? mockIncidents.filter(i => i.SchoolName_Ref === schoolName) : [...mockIncidents];
  },

  async createIncident(incident: Incident, schoolId?: number): Promise<Incident> {
    if (isPowerAppsEnvironment()) {
      try {
        const data: any = {
          Title: incident.Title,
          HazardDescription: incident.HazardDescription || '',
          ActivationTime: incident.ActivationTime || '',
          ClosureTime: incident.ClosureTime || '',
          CommunicationDone: incident.CommunicationDone || false,
          Challenges: incident.Challenges || '',
          LessonsLearned: incident.LessonsLearned || '',
          Suggestions: incident.Suggestions || '',
        };
        
        // Add UnifiedSupportTicketNumber if provided (number field)
        if (incident.UnifiedSupportTicketNumber) {
          data.UnifiedSupportTicketNumber = incident.UnifiedSupportTicketNumber;
        }
        
        if (schoolId) {
          data.SchoolName_Ref = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Id: schoolId,
          };
        }
        
        const choiceFields = ['IncidentCategory', 'RiskLevel', 'AlertModelType', 'ActivatedAlternative', 'CoordinatedEntities', 'ActionTaken', 'AltLocation'];
        for (const field of choiceFields) {
          if ((incident as any)[field]) {
            data[field] = {
              '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
              Value: (incident as any)[field],
            };
          }
        }
        
        console.log('[SharePoint] Creating incident:', data);
        const result = await SBC_Incidents_LogService.create(data);
        
        if (result.success && result.data) {
          return transformIncident(result.data);
        }
        throw new Error(String(result.error) || 'Failed to create incident');
      } catch (e: any) {
        console.error('[SharePoint] Error creating incident:', e);
        throw e;
      }
    }
    
    const newId = Math.max(0, ...mockIncidents.map(i => i.Id || 0)) + 1;
    const newIncident = { ...incident, Id: newId, Created: new Date().toISOString() };
    mockIncidents.push(newIncident);
    return newIncident;
  },

  async updateIncident(id: number, incident: Incident): Promise<Incident> {
    if (isPowerAppsEnvironment()) {
      try {
        const data: any = {
          Title: incident.Title,
          HazardDescription: incident.HazardDescription || '',
          CommunicationDone: incident.CommunicationDone || false,
          Challenges: incident.Challenges || '',
          LessonsLearned: incident.LessonsLearned || '',
          Suggestions: incident.Suggestions || '',
        };
        
        // Add IncidentNumber if provided (number field - رقم بلاغ الدعم الموحد)
        if (incident.IncidentNumber) {
          data.IncidentNumber = incident.IncidentNumber;
        }
        
        // Add date fields
        if (incident.ActivationTime) {
          data.ActivationTime = incident.ActivationTime;
        }
        if (incident.ClosureTime) {
          data.ClosureTime = incident.ClosureTime;
        }
        
        const choiceFields = ['IncidentCategory', 'RiskLevel', 'AlertModelType', 'ActivatedAlternative', 'CoordinatedEntities', 'ActionTaken', 'AltLocation'];
        for (const field of choiceFields) {
          if ((incident as any)[field]) {
            data[field] = {
              '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
              Value: (incident as any)[field],
            };
          }
        }
        
        console.log('[SharePoint] Updating incident:', id, data);
        const result = await SBC_Incidents_LogService.update(id.toString(), data);
        if (result.success) {
          return { ...incident, Id: id };
        }
        throw new Error(String(result.error) || 'Failed to update');
      } catch (e: any) {
        console.error('[SharePoint] Error updating incident:', e);
        throw e;
      }
    }
    
    const idx = mockIncidents.findIndex(i => i.Id === id);
    if (idx !== -1) {
      mockIncidents[idx] = { ...incident, Id: id };
    }
    return { ...incident, Id: id };
  },

  async deleteIncident(id: number): Promise<void> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Deleting incident:', id);
        await SBC_Incidents_LogService.delete(id.toString());
        return;
      } catch (e: any) {
        console.error('[SharePoint] Error deleting incident:', e);
        throw e;
      }
    }
    
    const idx = mockIncidents.findIndex(i => i.Id === id);
    if (idx !== -1) mockIncidents.splice(idx, 1);
  },

  // ===== TRAINING PROGRAMS =====
  async getTrainingPrograms(availableOnly?: boolean): Promise<TrainingProgram[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Loading training programs using Coordination_Programs_CatalogService.getAll()...');
        const result = await Coordination_Programs_CatalogService.getAll();
        console.log('[SharePoint] Training programs raw result:', JSON.stringify(result, null, 2));
        if (result.success && result.data) {
          const rawData = result.data || [];
          let programs: TrainingProgram[] = (Array.isArray(rawData) ? rawData : [rawData]).map(transformTrainingProgram);
          console.log(`[SharePoint] Loaded ${programs.length} training programs`);
          console.log('[SharePoint] Programs after transform:', JSON.stringify(programs, null, 2));
          if (availableOnly) {
            console.log('[SharePoint] Filtering for available programs (Status === متاح)');
            console.log('[SharePoint] Program statuses:', programs.map(p => ({ Title: p.Title, Status: p.Status, CoordinationStatus: p.CoordinationStatus })));
            // Show all programs - remove strict filter to allow display
            // Users can see all training programs in the catalog
            console.log(`[SharePoint] Returning all ${programs.length} programs (no filter applied)`);
          }
          return programs;
        }
        console.error('[SharePoint] Failed to load training programs:', result.error);
      } catch (e) {
        console.error('[SharePoint] Error loading training programs:', e);
      }
    }
    
    if (availableOnly) {
      return mockTrainingPrograms.filter(p => p.Status === "متاح");
    }
    return [...mockTrainingPrograms];
  },

  // Create a new training program (admin only)
  async createTrainingProgram(program: TrainingProgram): Promise<TrainingProgram> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Creating training program:', program);
        const data: any = {
          Title: program.Title,
        };

        if (program.ProviderEntity) {
          data.ProviderEntity = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: program.ProviderEntity,
          };
        }

        if (program.ActivityType) {
          data.ActivityType = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: program.ActivityType,
          };
        }

        if (program.TargetAudience) {
          // TargetAudience is a multi-choice field, handle as array
          const audiences = program.TargetAudience.split('، ').filter(a => a.trim());
          data['TargetAudience@odata.type'] = '#Collection(Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference)';
          data.TargetAudience = audiences.map(a => ({
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: a.trim(),
          }));
        }

        if (program.Date) {
          data.Date = program.Date;
        }

        if (program.ExecutionMode) {
          data.ExecutionMode = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: program.ExecutionMode,
          };
        }

        if (program.CoordinationStatus) {
          data.CoordinationStatus = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: program.CoordinationStatus,
          };
        }

        console.log('[SharePoint] Sending program data:', JSON.stringify(data, null, 2));
        const result = await Coordination_Programs_CatalogService.create(data);
        
        if (result.success && result.data) {
          console.log('[SharePoint] Training program created successfully');
          return transformTrainingProgram(result.data);
        }
        console.error('[SharePoint] Failed to create training program:', result.error);
        throw new Error(JSON.stringify(result.error) || 'Failed to create training program');
      } catch (e) {
        console.error('[SharePoint] Error creating training program:', e);
        throw e;
      }
    }

    // Mock implementation
    const newProgram = { ...program, Id: mockTrainingPrograms.length + 1 };
    mockTrainingPrograms.push(newProgram);
    return newProgram;
  },

  // Update an existing training program (admin only)
  async updateTrainingProgram(id: number, program: Partial<TrainingProgram>): Promise<TrainingProgram> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Updating training program:', id, program);
        const data: any = {};

        if (program.Title !== undefined) {
          data.Title = program.Title;
        }

        if (program.ProviderEntity !== undefined) {
          data.ProviderEntity = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: program.ProviderEntity,
          };
        }

        if (program.ActivityType !== undefined) {
          data.ActivityType = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: program.ActivityType,
          };
        }

        if (program.TargetAudience !== undefined) {
          const audiences = program.TargetAudience.split('، ').filter(a => a.trim());
          data['TargetAudience@odata.type'] = '#Collection(Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference)';
          data.TargetAudience = audiences.map(a => ({
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: a.trim(),
          }));
        }

        if (program.Date !== undefined) {
          data.Date = program.Date;
        }

        if (program.ExecutionMode !== undefined) {
          data.ExecutionMode = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: program.ExecutionMode,
          };
        }

        if (program.CoordinationStatus !== undefined) {
          data.CoordinationStatus = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: program.CoordinationStatus,
          };
        }

        console.log('[SharePoint] Sending update data:', JSON.stringify(data, null, 2));
        const result = await Coordination_Programs_CatalogService.update(id.toString(), data);
        
        if (result.success && result.data) {
          console.log('[SharePoint] Training program updated successfully');
          return transformTrainingProgram(result.data);
        }
        console.error('[SharePoint] Failed to update training program:', result.error);
        throw new Error(JSON.stringify(result.error) || 'Failed to update training program');
      } catch (e) {
        console.error('[SharePoint] Error updating training program:', e);
        throw e;
      }
    }

    // Mock implementation
    const idx = mockTrainingPrograms.findIndex(p => p.Id === id);
    if (idx !== -1) {
      mockTrainingPrograms[idx] = { ...mockTrainingPrograms[idx], ...program };
      return mockTrainingPrograms[idx];
    }
    throw new Error('Training program not found');
  },

  // Delete a training program (admin only)
  async deleteTrainingProgram(id: number): Promise<void> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Deleting training program:', id);
        await Coordination_Programs_CatalogService.delete(id.toString());
        return;
      } catch (e) {
        console.error('[SharePoint] Error deleting training program:', e);
        throw e;
      }
    }

    // Mock implementation
    const idx = mockTrainingPrograms.findIndex(p => p.Id === id);
    if (idx !== -1) mockTrainingPrograms.splice(idx, 1);
  },

  // ===== TRAINING LOG =====
  async getTrainingLog(schoolName?: string): Promise<TrainingLog[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Loading training log using School_Training_LogService.getAll()...');
        const result = await School_Training_LogService.getAll();
        if (result.success && result.data) {
          const rawData = result.data || [];
          const logs: TrainingLog[] = (Array.isArray(rawData) ? rawData : [rawData]).map(transformTrainingLog);
          console.log(`[SharePoint] Loaded ${logs.length} training log entries`);
          return schoolName ? logs.filter((l: TrainingLog) => l.SchoolName_Ref === schoolName) : logs;
        }
        console.error('[SharePoint] Failed to load training log:', result.error);
      } catch (e) {
        console.error('[SharePoint] Error loading training log:', e);
      }
    }
    
    return schoolName ? mockTrainingLog.filter(t => t.SchoolName_Ref === schoolName) : [...mockTrainingLog];
  },

  async registerForTraining(
    schoolName: string,
    programId: number,
    attendeeIds: number[],
    schoolId?: number,
    registrationType?: string,
    trainingDate?: string,
    programName?: string
  ): Promise<TrainingLog> {
    if (isPowerAppsEnvironment()) {
      try {
        // Title field stores the GeneralNotes content (program name + date)
        const generalNotes = programName 
          ? `${programName} - ${new Date().toLocaleDateString('ar-SA')}`
          : `تسجيل تدريب - ${schoolName}`;
        
        const data: any = {
          Title: generalNotes,
        };
        
        // Add TrainingDate if provided
        if (trainingDate) {
          data.TrainingDate = trainingDate;
        }
        
        // RegistrationType is a choice field
        if (registrationType) {
          data.RegistrationType = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: registrationType,
          };
        }
        
        // SchoolName_Ref is a lookup field
        if (schoolId) {
          data.SchoolName_Ref = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Id: schoolId,
          };
        }
        
        // Program_Ref is a lookup field
        if (programId) {
          data.Program_Ref = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Id: programId,
          };
        }
        
        // AttendeesNames is a multi-select lookup field
        if (attendeeIds && attendeeIds.length > 0) {
          data['AttendeesNames@odata.type'] = '#Collection(Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference)';
          data.AttendeesNames = attendeeIds.map(id => ({
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Id: id,
          }));
        }
        
        // NOTE: GeneralNotes is NOT in the Power SDK schema.
        // The app computes it from Program_Ref + Created date on read.
        // If you added the column to SharePoint, run pac code add-data-source to refresh schema.
        
        console.log('[SharePoint] Creating training registration:', data);
        const result = await School_Training_LogService.create(data);
        
        if (result.success && result.data) {
          return transformTrainingLog(result.data);
        }
        // Handle error properly - extract message from error object
        const errorMsg = result.error 
          ? (typeof result.error === 'string' ? result.error : 
             (result.error as any)?.message || JSON.stringify(result.error))
          : 'Failed to register for training';
        throw new Error(errorMsg);
      } catch (e: any) {
        console.error('[SharePoint] Error registering for training:', e);
        // Re-throw with proper error message
        const message = e?.message || (typeof e === 'string' ? e : JSON.stringify(e));
        throw new Error(message);
      }
    }
    
    // Mock implementation
    const program = mockTrainingPrograms.find(p => p.Id === programId);
    const attendees = mockTeamMembers.filter(m => attendeeIds.includes(m.Id || 0));
    const newId = Math.max(0, ...mockTrainingLog.map(t => t.Id || 0)) + 1;
    const newLog: TrainingLog = {
      Id: newId,
      Title: `تسجيل - ${program?.Title || ''}`,
      Program_Ref: program?.Title,
      Program_RefId: programId,
      SchoolName_Ref: schoolName,
      RegistrationType: registrationType || "طلب تسجيل",
      AttendeesNames: attendees.map(a => a.Title).join("، "),
      TrainingDate: trainingDate || program?.Date,
      Status: "مسجل"
    };
    mockTrainingLog.push(newLog);
    return newLog;
  },

  async updateTrainingLog(id: number, updates: { attendeeIds?: number[] }): Promise<TrainingLog | undefined> {
    if (isPowerAppsEnvironment() && updates.attendeeIds) {
      try {
        const data: any = {
          'AttendeesNames@odata.type': '#Collection(Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference)',
          AttendeesNames: updates.attendeeIds.map(attendeeId => ({
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Id: attendeeId,
          })),
        };
        
        console.log('[SharePoint] Updating training log:', id, data);
        const result = await School_Training_LogService.update(id.toString(), data);
        if (result.success) {
          return transformTrainingLog(result.data);
        }
        throw new Error(String(result.error) || 'Failed to update');
      } catch (e: any) {
        console.error('[SharePoint] Error updating training log:', e);
        throw e;
      }
    }
    
    const idx = mockTrainingLog.findIndex(t => t.Id === id);
    if (idx !== -1 && updates.attendeeIds) {
      const attendees = mockTeamMembers.filter(m => updates.attendeeIds?.includes(m.Id || 0));
      mockTrainingLog[idx].AttendeesNames = attendees.map(a => a.Title).join("، ");
    }
    return mockTrainingLog[idx];
  },

  async deleteTrainingLog(id: number): Promise<void> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Deleting training log:', id);
        await School_Training_LogService.delete(id.toString());
        return;
      } catch (e: any) {
        console.error('[SharePoint] Error deleting training log:', e);
        throw e;
      }
    }
    
    const idx = mockTrainingLog.findIndex(t => t.Id === id);
    if (idx !== -1) mockTrainingLog.splice(idx, 1);
  },

  // ===== ADMIN DRILL PLANS (uses SBC_Drills_Log with IsAdminPlan=true) =====
  // Admin plans are stored in the same list as school executions but with IsAdminPlan=true
  // This avoids creating a new SharePoint list and keeps everything in one place
  
  async getAdminDrillPlans(): Promise<Drill[]> {
    try {
      console.log('[SharePoint] Loading admin drill plans from SBC_Drills_Log...');
      // Get all drills and filter for admin plans (IsAdminPlan=true, no SchoolName_Ref)
      const allDrills = await this.getDrills();
      const adminPlans = allDrills.filter(d => d.IsAdminPlan === true || (!d.SchoolName_Ref && d.StartDate && d.EndDate));
      console.log(`[SharePoint] Found ${adminPlans.length} admin drill plans`);
      return adminPlans;
    } catch (e: any) {
      console.error('[SharePoint] Error loading admin drill plans:', e);
      // No localStorage fallback - return empty array for security compliance
      return [];
    }
  },
  
  async createAdminDrillPlan(plan: Partial<Drill>): Promise<Drill> {
    const adminPlan: Drill = {
      ...plan,
      Title: plan.Title || '',
      IsAdminPlan: true,  // Mark as admin plan
      SchoolName_Ref: undefined,  // No school reference for admin plans
    };
    
    try {
      console.log('[SharePoint] Creating admin drill plan in SBC_Drills_Log...');
      const created = await this.createDrill(adminPlan);
      console.log('[SharePoint] Admin drill plan created:', created.Id);
      return created;
    } catch (e: any) {
      console.error('[SharePoint] Error creating admin drill plan:', e);
      throw e;
    }
  },
  
  async updateAdminDrillPlan(id: number, updates: Partial<Drill>): Promise<Drill | null> {
    try {
      console.log('[SharePoint] Updating admin drill plan:', id);
      const updated = await this.updateDrill(id, { ...updates, IsAdminPlan: true });
      return updated;
    } catch (e: any) {
      console.error('[SharePoint] Error updating admin drill plan:', e);
      throw e;
    }
  },
  
  async deleteAdminDrillPlan(id: number): Promise<void> {
    try {
      console.log('[SharePoint] Deleting admin drill plan:', id);
      await this.deleteDrill(id);
    } catch (e: any) {
      console.error('[SharePoint] Error deleting admin drill plan:', e);
      throw e;
    }
  },

  // ===== UTILITY =====
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    const inPowerApps = isPowerAppsEnvironment();
    
    if (inPowerApps) {
      try {
        // Try to load a small amount of data using SchoolInfoService
        const result = await SchoolInfoService.getAll();
        if (result.success) {
          return {
            success: true,
            message: 'متصل بقوائم SharePoint عبر Power SDK',
            details: { environment: 'Power Apps', dataAvailable: !!result.data, recordCount: Array.isArray(result.data) ? result.data.length : 0 },
          };
        }
        return {
          success: false,
          message: 'Power SDK متاح لكن البيانات غير متوفرة',
          details: { environment: 'Power Apps', error: result.error },
        };
      } catch (e: any) {
        return {
          success: false,
          message: 'خطأ في Power SDK',
          details: { environment: 'Power Apps', error: e.message },
        };
      }
    }
    
    return {
      success: true,
      message: "تشغيل مع البيانات المضمنة (وضع التطوير)",
      details: { environment: "Local Development", schoolsCount: schoolsData.length }
    };
  },
  
  async getLists(): Promise<string[]> {
    return Object.values(LISTS);
  },

  // ============ BC_DR_CHECKLIST CRUD Operations ============
  async getBCDRChecklist(): Promise<BCDRChecklist[]> {
    if (isPowerAppsEnvironment()) {
      try {
        const response = await fetch(`${SHAREPOINT_SITE}/_api/web/lists/getbytitle('BC_DR_Checklist')/items?$select=Id,Title,Category,Status,LastChecked,CheckedBy,Notes,SortOrder&$orderby=SortOrder,Id`);
        if (!response.ok) throw new Error('Failed to fetch checklist');
        const data = await response.json();
        return data.value.map((item: any) => ({
          Id: item.Id,
          Title: item.Title || '',
          Category: extractChoiceValue(item.Category),
          Status: extractChoiceValue(item.Status),
          LastChecked: item.LastChecked || '',
          CheckedBy: extractChoiceValue(item.CheckedBy),
          Notes: item.Notes || '',
          SortOrder: item.SortOrder || 0,
        }));
      } catch (error) {
        console.error('Error fetching BC DR Checklist:', error);
        return [];
      }
    }
    // Mock data for local development
    return [];
  },

  async createBCDRChecklistItem(item: Partial<BCDRChecklist>): Promise<BCDRChecklist> {
    if (isPowerAppsEnvironment()) {
      const response = await fetch(`${SHAREPOINT_SITE}/_api/web/lists/getbytitle('BC_DR_Checklist')/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;odata=verbose',
          'Accept': 'application/json;odata=verbose',
        },
        body: JSON.stringify({
          __metadata: { type: 'SP.Data.BC_DR_ChecklistListItem' },
          Title: item.Title,
          Category: item.Category,
          Status: item.Status,
          LastChecked: item.LastChecked,
          CheckedBy: item.CheckedBy,
          Notes: item.Notes,
          SortOrder: item.SortOrder || 0,
        }),
      });
      if (!response.ok) throw new Error('Failed to create item');
      const data = await response.json();
      return {
        Id: data.d.Id,
        Title: data.d.Title,
        Category: data.d.Category,
        Status: data.d.Status,
        LastChecked: data.d.LastChecked,
        CheckedBy: data.d.CheckedBy,
        Notes: data.d.Notes,
        SortOrder: data.d.SortOrder,
      };
    }
    return item as BCDRChecklist;
  },

  async updateBCDRChecklistItem(id: number, item: Partial<BCDRChecklist>): Promise<void> {
    if (isPowerAppsEnvironment()) {
      const response = await fetch(`${SHAREPOINT_SITE}/_api/web/lists/getbytitle('BC_DR_Checklist')/items(${id})`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;odata=verbose',
          'Accept': 'application/json;odata=verbose',
          'IF-MATCH': '*',
          'X-HTTP-Method': 'MERGE',
        },
        body: JSON.stringify({
          __metadata: { type: 'SP.Data.BC_DR_ChecklistListItem' },
          Title: item.Title,
          Category: item.Category,
          Status: item.Status,
          LastChecked: item.LastChecked,
          CheckedBy: item.CheckedBy,
          Notes: item.Notes,
          SortOrder: item.SortOrder,
        }),
      });
      if (!response.ok) throw new Error('Failed to update item');
    }
  },

  async deleteBCDRChecklistItem(id: number): Promise<void> {
    if (isPowerAppsEnvironment()) {
      const response = await fetch(`${SHAREPOINT_SITE}/_api/web/lists/getbytitle('BC_DR_Checklist')/items(${id})`, {
        method: 'POST',
        headers: {
          'IF-MATCH': '*',
          'X-HTTP-Method': 'DELETE',
        },
      });
      if (!response.ok) throw new Error('Failed to delete item');
    }
  },
  
  getSharePointItemLink,
};
