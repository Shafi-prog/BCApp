// SharePoint Service for Power Platform Code App
// Uses embedded schools data (1913 records) 
// Uses mock data for other lists (can be extended for real SharePoint when data sources are added)

import schoolsData from '../data/schools';

// SharePoint List Names (matching your SharePoint site)
const LISTS = {
  SCHOOL_INFO: "SchoolInfo",
  TEAM_MEMBERS: "BC_Teams_Members",
  DRILLS_LOG: "SBC_Drills_Log",
  INCIDENTS_LOG: "SBC_Incidents_Log",
  TRAINING_LOG: "School_Training_Log",
  TRAINING_CATALOG: "Coordination_Programs_Catalog",
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
  MemberEmail?: string;
  MemberMobile?: string;
}

export interface Drill {
  Id?: number;
  Title: string;
  SchoolName_Ref?: string;
  DrillHypothesis?: string;
  SpecificEvent?: string;
  TargetGroup?: string;
  ExecutionDate?: string;
  AttachmentUrl?: string;
  HasAttachments?: boolean;
  SharePointLink?: string;
  Created?: string;
}

export interface Incident {
  Id?: number;
  Title: string;
  SchoolName_Ref?: string;
  IncidentCategory?: string;
  RiskLevel?: string;
  AlertModelType?: string;
  HazardDescription?: string;
  ActivatedAlternative?: string;
  ActivationTime?: string;
  ClosureTime?: string;
  CoordinatedEntities?: string;
  ActionTaken?: string;
  AltLocation?: string;
  CommunicationDone?: boolean;
  Challenges?: string;
  LessonsLearned?: string;
  Suggestions?: string;
  Status?: string;
  Created?: string;
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
  RegistrationType?: string;
  AttendeesNames?: string;
  TrainingDate?: string;
  Status?: string;
}

export interface ChoiceOption {
  key: string;
  text: string;
}

// ============ MOCK DATA ============

const mockTeamMembers: TeamMember[] = [
  { Id: 1, Title: "محمد أحمد العمري", JobRole: "وكيل /ة المدرسة للشؤون المدرسية", MembershipType: "عضو أساسي", SchoolName_Ref: "ابتدائية الفاروق", MemberEmail: "m.amri@edu.sa", MemberMobile: "966501234567" },
  { Id: 2, Title: "خالد سعد الشهري", JobRole: "منسق/ة الأمن والسلامة بالمدرسة", MembershipType: "عضو أساسي", SchoolName_Ref: "ابتدائية الفاروق", MemberEmail: "k.shahri@edu.sa", MemberMobile: "966509876543" },
  { Id: 3, Title: "عبدالله فهد القحطاني", JobRole: "الموجه/ة الطلابي/ة", MembershipType: "عضو أساسي", SchoolName_Ref: "ابتدائية الفاروق", MemberEmail: "a.qahtani@edu.sa", MemberMobile: "966551234567" },
  { Id: 4, Title: "سارة محمد الغامدي", JobRole: "الموجه/ة الصحي/ة", MembershipType: "عضو أساسي", SchoolName_Ref: "متوسطة الأندلس", MemberEmail: "s.ghamdi@edu.sa", MemberMobile: "966551234568" },
];

const mockDrills: Drill[] = [
  { Id: 1, Title: "تمرين إخلاء الفصل الأول", SchoolName_Ref: "ابتدائية الفاروق", DrillHypothesis: "الفرضية الأولى: تعذر استخدام المبنى المدرسي (كلي/جزئي).", SpecificEvent: "حريق في المختبر", TargetGroup: "إخلاء كامل (طلاب ومعلمين).", ExecutionDate: "2024-01-15", Created: "2024-01-15" },
  { Id: 2, Title: "تمرين زلزال", SchoolName_Ref: "ابتدائية الفاروق", DrillHypothesis: "الفرضية الرابعة: انقطاع الخدمات الأساسية (كهرباء/اتصال/مياه).", SpecificEvent: "محاكاة زلزال", TargetGroup: "تمرين مكتبي (فريق الأمن والسلامة فقط).", ExecutionDate: "2024-02-20", Created: "2024-02-20" },
];

const mockIncidents: Incident[] = [
  { Id: 1, Title: "حادث سقوط طالب", SchoolName_Ref: "ابتدائية الفاروق", IncidentCategory: "سلامة", RiskLevel: "متوسط", AlertModelType: "داخلي", HazardDescription: "سقوط طالب في الملعب", ActionTaken: "إسعاف", Status: "مغلق", Created: "2024-01-10" },
];

const mockTrainingPrograms: TrainingProgram[] = [
  { Id: 1, Title: "برنامج الإخلاء الطارئ", ProviderEntity: "إدارة الأمن والسلامة", ActivityType: "تدريب عملي", TargetAudience: "فريق الأمن والسلامة", Date: "2024-03-01", ExecutionMode: "حضوري", CoordinationStatus: "متاح", Status: "متاح" },
  { Id: 2, Title: "الإسعافات الأولية", ProviderEntity: "الهلال الأحمر", ActivityType: "ورشة عمل", TargetAudience: "جميع المعلمين", Date: "2024-03-15", ExecutionMode: "حضوري", CoordinationStatus: "متاح", Status: "متاح" },
  { Id: 3, Title: "السلامة المهنية", ProviderEntity: "إدارة التعليم", ActivityType: "دورة تدريبية", TargetAudience: "الإداريين", Date: "2024-04-01", ExecutionMode: "عن بعد", CoordinationStatus: "متاح", Status: "متاح" },
];

const mockTrainingLog: TrainingLog[] = [
  { Id: 1, Title: "تسجيل تدريب الإخلاء", Program_Ref: "برنامج الإخلاء الطارئ", Program_RefId: 1, SchoolName_Ref: "ابتدائية الفاروق", RegistrationType: "طلب تسجيل", AttendeesNames: "محمد أحمد العمري، خالد سعد الشهري", TrainingDate: "2024-03-01", Status: "مكتمل" },
];

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
  { key: "نعم", text: "نعم" },
  { key: "لا", text: "لا" },
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
    
    if (schoolName) {
      return schools.filter(s => s.SchoolName === schoolName);
    }
    return schools;
  },

  // ===== TEAM MEMBERS =====
  async getTeamMembers(schoolName?: string): Promise<TeamMember[]> {
    if (schoolName) {
      return mockTeamMembers.filter(m => m.SchoolName_Ref === schoolName);
    }
    return [...mockTeamMembers];
  },

  async createTeamMember(member: TeamMember): Promise<TeamMember> {
    const newId = Math.max(0, ...mockTeamMembers.map(m => m.Id || 0)) + 1;
    const newMember = { ...member, Id: newId };
    mockTeamMembers.push(newMember);
    return newMember;
  },

  async updateTeamMember(id: number, member: TeamMember): Promise<TeamMember> {
    const idx = mockTeamMembers.findIndex(m => m.Id === id);
    if (idx !== -1) {
      mockTeamMembers[idx] = { ...member, Id: id };
    }
    return { ...member, Id: id };
  },

  async deleteTeamMember(id: number): Promise<void> {
    const idx = mockTeamMembers.findIndex(m => m.Id === id);
    if (idx !== -1) mockTeamMembers.splice(idx, 1);
  },

  // ===== DRILLS =====
  async getDrills(schoolName?: string): Promise<Drill[]> {
    if (schoolName) {
      return mockDrills.filter(d => d.SchoolName_Ref === schoolName);
    }
    return [...mockDrills];
  },

  async createDrill(drill: Drill): Promise<Drill> {
    const newId = Math.max(0, ...mockDrills.map(d => d.Id || 0)) + 1;
    const newDrill = { ...drill, Id: newId, Created: new Date().toISOString() };
    mockDrills.push(newDrill);
    return newDrill;
  },

  async updateDrill(id: number, drill: Drill): Promise<Drill> {
    const idx = mockDrills.findIndex(d => d.Id === id);
    if (idx !== -1) {
      mockDrills[idx] = { ...drill, Id: id };
    }
    return { ...drill, Id: id };
  },

  async deleteDrill(id: number): Promise<void> {
    const idx = mockDrills.findIndex(d => d.Id === id);
    if (idx !== -1) mockDrills.splice(idx, 1);
  },

  // ===== INCIDENTS =====
  async getIncidents(schoolName?: string): Promise<Incident[]> {
    if (schoolName) {
      return mockIncidents.filter(i => i.SchoolName_Ref === schoolName);
    }
    return [...mockIncidents];
  },

  async createIncident(incident: Incident): Promise<Incident> {
    const newId = Math.max(0, ...mockIncidents.map(i => i.Id || 0)) + 1;
    const newIncident = { ...incident, Id: newId, Created: new Date().toISOString() };
    mockIncidents.push(newIncident);
    return newIncident;
  },

  async updateIncident(id: number, incident: Incident): Promise<Incident> {
    const idx = mockIncidents.findIndex(i => i.Id === id);
    if (idx !== -1) {
      mockIncidents[idx] = { ...incident, Id: id };
    }
    return { ...incident, Id: id };
  },

  async deleteIncident(id: number): Promise<void> {
    const idx = mockIncidents.findIndex(i => i.Id === id);
    if (idx !== -1) mockIncidents.splice(idx, 1);
  },

  // ===== TRAINING PROGRAMS =====
  async getTrainingPrograms(availableOnly?: boolean): Promise<TrainingProgram[]> {
    if (availableOnly) {
      return mockTrainingPrograms.filter(p => p.Status === "متاح");
    }
    return [...mockTrainingPrograms];
  },

  // ===== TRAINING LOG =====
  async getTrainingLog(schoolName?: string): Promise<TrainingLog[]> {
    if (schoolName) {
      return mockTrainingLog.filter(t => t.SchoolName_Ref === schoolName);
    }
    return [...mockTrainingLog];
  },

  async registerForTraining(
    schoolName: string,
    programId: number,
    attendeeIds: number[],
    schoolId?: number,
    registrationType?: string,
    trainingDate?: string
  ): Promise<TrainingLog> {
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
    const idx = mockTrainingLog.findIndex(t => t.Id === id);
    if (idx !== -1 && updates.attendeeIds) {
      const attendees = mockTeamMembers.filter(m => updates.attendeeIds?.includes(m.Id || 0));
      mockTrainingLog[idx].AttendeesNames = attendees.map(a => a.Title).join("، ");
    }
    return mockTrainingLog[idx];
  },

  async deleteTrainingLog(id: number): Promise<void> {
    const idx = mockTrainingLog.findIndex(t => t.Id === id);
    if (idx !== -1) mockTrainingLog.splice(idx, 1);
  },

  // ===== UTILITY =====
  isLocalDevelopment: () => true,
  
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    return {
      success: true,
      message: "Running with embedded/mock data",
      details: { environment: "mock", schoolsCount: schoolsData.length }
    };
  },
  
  async getLists(): Promise<string[]> {
    return Object.values(LISTS);
  }
};
