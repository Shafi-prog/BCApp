// SharePoint Service for Power Platform Code App
// Connects to SharePoint lists via Power SDK when running in Power Apps
// Falls back to embedded/mock data for local development

import schoolsData from '../data/schools';
import {
  isPowerAppsEnvironment,
  BC_Teams_MembersService,
  SBC_Drills_LogService,
  SBC_Incidents_LogService,
  SchoolInfoService,
  School_Training_LogService,
  Coordination_Programs_CatalogService,
  getSharePointItemLink,
} from './powerSDKClient';

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
}

export interface Incident {
  Id?: number;
  Title: string;
  SchoolName_Ref?: string;
  SchoolName_RefId?: number;
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
  SharePointLink?: string;
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
  SchoolName_RefId?: number;
  RegistrationType?: string;
  AttendeesNames?: string;
  TrainingDate?: string;
  Status?: string;
}

export interface ChoiceOption {
  key: string;
  text: string;
}

// ============ MOCK DATA (for local development fallback) ============

const mockTeamMembers: TeamMember[] = [];

const mockDrills: Drill[] = [];

const mockIncidents: Incident[] = [];

const mockTrainingPrograms: TrainingProgram[] = [
  { Id: 1, Title: "برنامج الإخلاء الطارئ", ProviderEntity: "إدارة الأمن والسلامة", ActivityType: "تدريب عملي", TargetAudience: "فريق الأمن والسلامة", Date: "2024-03-01", ExecutionMode: "حضوري", CoordinationStatus: "متاح", Status: "متاح" },
  { Id: 2, Title: "الإسعافات الأولية", ProviderEntity: "الهلال الأحمر", ActivityType: "ورشة عمل", TargetAudience: "جميع المعلمين", Date: "2024-03-15", ExecutionMode: "حضوري", CoordinationStatus: "متاح", Status: "متاح" },
  { Id: 3, Title: "السلامة المهنية", ProviderEntity: "إدارة التعليم", ActivityType: "دورة تدريبية", TargetAudience: "الإداريين", Date: "2024-04-01", ExecutionMode: "عن بعد", CoordinationStatus: "متاح", Status: "متاح" },
];

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
    RiskLevel: typeof raw.RiskLevel === 'object' ? raw.RiskLevel.Value : (raw.RiskLevel || ''),
    AlertModelType: typeof raw.AlertModelType === 'object' ? raw.AlertModelType.Value : (raw.AlertModelType || ''),
    HazardDescription: raw.HazardDescription || '',
    ActivatedAlternative: typeof raw.ActivatedAlternative === 'object' ? raw.ActivatedAlternative.Value : (raw.ActivatedAlternative || ''),
    ActivationTime: raw.ActivationTime || '',
    ClosureTime: raw.ClosureTime || '',
    CoordinatedEntities: typeof raw.CoordinatedEntities === 'object' ? raw.CoordinatedEntities.Value : (raw.CoordinatedEntities || ''),
    ActionTaken: typeof raw.ActionTaken === 'object' ? raw.ActionTaken.Value : (raw.ActionTaken || ''),
    AltLocation: typeof raw.AltLocation === 'object' ? raw.AltLocation.Value : (raw.AltLocation || ''),
    CommunicationDone: raw.CommunicationDone || false,
    Challenges: raw.Challenges || '',
    LessonsLearned: raw.LessonsLearned || '',
    Suggestions: raw.Suggestions || '',
    Status: typeof raw.Status === 'object' ? raw.Status.Value : (raw.Status || ''),
    SharePointLink: raw['{Link}'] || getSharePointItemLink('SBC_Incidents_Log', id),
    Created: raw.Created || '',
  };
};

// Transform TrainingProgram from SharePoint format
const transformTrainingProgram = (raw: any): TrainingProgram => ({
  Id: raw.ID || raw.Id || 0,
  Title: raw.Title || '',
  ProviderEntity: raw.ProviderEntity || '',
  ActivityType: typeof raw.ActivityType === 'object' ? raw.ActivityType.Value : (raw.ActivityType || ''),
  TargetAudience: typeof raw.TargetAudience === 'object' ? raw.TargetAudience.Value : (raw.TargetAudience || ''),
  Date: raw.Date || raw.TrainingDate || '',
  ExecutionMode: typeof raw.ExecutionMode === 'object' ? raw.ExecutionMode.Value : (raw.ExecutionMode || ''),
  CoordinationStatus: typeof raw.CoordinationStatus === 'object' ? raw.CoordinationStatus.Value : (raw.CoordinationStatus || ''),
  Status: typeof raw.Status === 'object' ? raw.Status.Value : (raw.Status || ''),
});

// Transform TrainingLog from SharePoint format
const transformTrainingLog = (raw: any): TrainingLog => {
  let attendeeNames = '';
  if (raw.Attendees) {
    if (Array.isArray(raw.Attendees)) {
      attendeeNames = raw.Attendees.map((a: any) => a.Value || a).join('، ');
    } else if (typeof raw.Attendees === 'string') {
      attendeeNames = raw.Attendees;
    }
  }
  
  return {
    Id: raw.ID || raw.Id || 0,
    Title: raw.Title || '',
    Program_Ref: raw.Program_Ref?.Value || raw.Program_Ref || '',
    Program_RefId: raw['Program_Ref#Id'] || raw.Program_RefId,
    SchoolName_Ref: raw.SchoolName_Ref?.Value || raw.SchoolName_Ref || '',
    SchoolName_RefId: raw['SchoolName_Ref#Id'] || raw.SchoolName_RefId,
    RegistrationType: typeof raw.RegistrationType === 'object' ? raw.RegistrationType.Value : (raw.RegistrationType || ''),
    AttendeesNames: attendeeNames || raw.AttendeesNames || '',
    TrainingDate: raw.TrainingDate || '',
    Status: typeof raw.Status === 'object' ? raw.Status.Value : (raw.Status || ''),
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
        console.log('[SharePoint] Loading schools from Power SDK...');
        const result = await SchoolInfoService.getAll({ top: 5000 });
        if (result.success && result.data) {
          const rawData = Array.isArray(result.data) ? result.data : [result.data];
          const schools: SchoolInfo[] = rawData.map((raw: any, index: number) => ({
            Id: raw.ID || raw.Id || index + 1,
            Title: raw.Title || '',
            SchoolName: raw.field_0 || raw.SchoolName || raw.Title || '',
            SchoolID: raw.field_1?.toString() || raw.SchoolID?.toString() || '',
            Level: raw.field_2?.Value || raw.Level || '',
            SchoolGender: raw.field_3?.Value || raw.SchoolGender || '',
            SchoolType: raw.field_4?.Value || raw.SchoolType || '',
            EducationType: raw.field_5?.Value || raw.EducationType || '',
            StudyTime: raw.field_13?.Value || raw.StudyTime || '',
            BuildingOwnership: raw.field_14?.Value || raw.BuildingOwnership || '',
            SectorDescription: raw.field_15 || raw.SectorDescription || '',
            PrincipalName: raw.field_8 || raw.PrincipalName || '',
            PrincipalID: raw.field_7?.toString() || raw.PrincipalID?.toString() || '',
            principalEmail: raw.field_9 || raw.principalEmail || '',
            PrincipalPhone: raw.field_10?.toString() || raw.PrincipalPhone?.toString() || '',
            SchoolEmail: raw.field_16 || raw.SchoolEmail || '',
            Latitude: raw.field_11?.toString() || raw.Latitude?.toString() || '',
            Longitude: raw.field_12?.toString() || raw.Longitude?.toString() || '',
          }));
          console.log(`[SharePoint] Loaded ${schools.length} schools from SharePoint`);
          return schoolName ? schools.filter(s => s.SchoolName === schoolName) : schools;
        }
        console.error('[SharePoint] Failed to load schools:', result.error);
      } catch (e) {
        console.error('[SharePoint] Error loading schools:', e);
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
        console.log('[SharePoint] Loading team members from Power SDK...');
        const result = await BC_Teams_MembersService.getAll();
        if (result.success && result.data) {
          const members = (Array.isArray(result.data) ? result.data : [result.data]).map(transformTeamMember);
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
        const data: any = {
          Title: member.Title,
          MemberEmail: member.MemberEmail || '',
        };
        
        if (schoolId) {
          data.SchoolName_Ref = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Id: schoolId,
          };
        }
        
        if (member.JobRole) {
          data.JobRole = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: member.JobRole,
          };
        }
        
        if (member.MembershipType) {
          data.MembershipType = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: member.MembershipType,
          };
        }
        
        if (member.MemberMobile) {
          const mobile = parseInt(member.MemberMobile.replace(/\D/g, ''), 10);
          if (!isNaN(mobile)) data.Mobile = mobile;
        }
        
        console.log('[SharePoint] Creating team member:', data);
        const result = await BC_Teams_MembersService.create(data);
        
        if (result.success && result.data) {
          return transformTeamMember(result.data);
        }
        throw new Error(result.error || 'Failed to create team member');
      } catch (e: any) {
        console.error('[SharePoint] Error creating team member:', e);
        throw e;
      }
    }
    
    // Mock implementation
    const newId = Math.max(0, ...mockTeamMembers.map(m => m.Id || 0)) + 1;
    const newMember = { ...member, Id: newId };
    mockTeamMembers.push(newMember);
    return newMember;
  },

  async updateTeamMember(id: number, member: TeamMember): Promise<TeamMember> {
    if (isPowerAppsEnvironment()) {
      try {
        const data: any = { Title: member.Title };
        
        if (member.MemberEmail) data.MemberEmail = member.MemberEmail;
        if (member.JobRole) {
          data.JobRole = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: member.JobRole,
          };
        }
        if (member.MembershipType) {
          data.MembershipType = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: member.MembershipType,
          };
        }
        if (member.MemberMobile) {
          const mobile = parseInt(member.MemberMobile.replace(/\D/g, ''), 10);
          if (!isNaN(mobile)) data.Mobile = mobile;
        }
        
        const result = await BC_Teams_MembersService.update(id, data);
        if (result.success) {
          return { ...member, Id: id };
        }
        throw new Error(result.error || 'Failed to update');
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
        const result = await BC_Teams_MembersService.delete(id);
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete');
        }
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
        console.log('[SharePoint] Loading drills from Power SDK...');
        const result = await SBC_Drills_LogService.getAll();
        if (result.success && result.data) {
          const drills = (Array.isArray(result.data) ? result.data : [result.data]).map(transformDrill);
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
        
        console.log('[SharePoint] Creating drill:', data);
        const result = await SBC_Drills_LogService.create(data);
        
        if (result.success && result.data) {
          return transformDrill(result.data);
        }
        throw new Error(result.error || 'Failed to create drill');
      } catch (e: any) {
        console.error('[SharePoint] Error creating drill:', e);
        throw e;
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
        
        const result = await SBC_Drills_LogService.update(id, data);
        if (result.success) {
          return { ...drill, Id: id };
        }
        throw new Error(result.error || 'Failed to update');
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
        const result = await SBC_Drills_LogService.delete(id);
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete');
        }
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
        console.log('[SharePoint] Loading incidents from Power SDK...');
        const result = await SBC_Incidents_LogService.getAll();
        if (result.success && result.data) {
          const incidents = (Array.isArray(result.data) ? result.data : [result.data]).map(transformIncident);
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
        
        if (schoolId) {
          data.SchoolName_Ref = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Id: schoolId,
          };
        }
        
        const choiceFields = ['IncidentCategory', 'RiskLevel', 'AlertModelType', 'ActivatedAlternative', 'CoordinatedEntities', 'ActionTaken', 'AltLocation', 'Status'];
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
        throw new Error(result.error || 'Failed to create incident');
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
        
        const choiceFields = ['IncidentCategory', 'RiskLevel', 'AlertModelType', 'ActivatedAlternative', 'CoordinatedEntities', 'ActionTaken', 'AltLocation', 'Status'];
        for (const field of choiceFields) {
          if ((incident as any)[field]) {
            data[field] = {
              '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
              Value: (incident as any)[field],
            };
          }
        }
        
        const result = await SBC_Incidents_LogService.update(id, data);
        if (result.success) {
          return { ...incident, Id: id };
        }
        throw new Error(result.error || 'Failed to update');
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
        const result = await SBC_Incidents_LogService.delete(id);
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete');
        }
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
        console.log('[SharePoint] Loading training programs from Power SDK...');
        const result = await Coordination_Programs_CatalogService.getAll();
        if (result.success && result.data) {
          let programs = (Array.isArray(result.data) ? result.data : [result.data]).map(transformTrainingProgram);
          console.log(`[SharePoint] Loaded ${programs.length} training programs`);
          if (availableOnly) {
            programs = programs.filter(p => p.Status === 'متاح');
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

  // ===== TRAINING LOG =====
  async getTrainingLog(schoolName?: string): Promise<TrainingLog[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[SharePoint] Loading training log from Power SDK...');
        const result = await School_Training_LogService.getAll();
        if (result.success && result.data) {
          const logs = (Array.isArray(result.data) ? result.data : [result.data]).map(transformTrainingLog);
          console.log(`[SharePoint] Loaded ${logs.length} training log entries`);
          return schoolName ? logs.filter(l => l.SchoolName_Ref === schoolName) : logs;
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
    trainingDate?: string
  ): Promise<TrainingLog> {
    if (isPowerAppsEnvironment()) {
      try {
        const data: any = {
          Title: `تسجيل تدريب - ${schoolName}`,
          RegistrationType: {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Value: registrationType || 'طلب تسجيل',
          },
          TrainingDate: trainingDate || '',
        };
        
        if (schoolId) {
          data.SchoolName_Ref = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Id: schoolId,
          };
        }
        
        if (programId) {
          data.Program_Ref = {
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Id: programId,
          };
        }
        
        if (attendeeIds.length > 0) {
          data.Attendees = attendeeIds.map(id => ({
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Id: id,
          }));
        }
        
        console.log('[SharePoint] Creating training registration:', data);
        const result = await School_Training_LogService.create(data);
        
        if (result.success && result.data) {
          return transformTrainingLog(result.data);
        }
        throw new Error(result.error || 'Failed to register for training');
      } catch (e: any) {
        console.error('[SharePoint] Error registering for training:', e);
        throw e;
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
          Attendees: updates.attendeeIds.map(attendeeId => ({
            '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
            Id: attendeeId,
          })),
        };
        
        const result = await School_Training_LogService.update(id, data);
        if (result.success) {
          return transformTrainingLog(result.data);
        }
        throw new Error(result.error || 'Failed to update');
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
        const result = await School_Training_LogService.delete(id);
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete');
        }
        return;
      } catch (e: any) {
        console.error('[SharePoint] Error deleting training log:', e);
        throw e;
      }
    }
    
    const idx = mockTrainingLog.findIndex(t => t.Id === id);
    if (idx !== -1) mockTrainingLog.splice(idx, 1);
  },

  // ===== UTILITY =====
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    const inPowerApps = isPowerAppsEnvironment();
    
    if (inPowerApps) {
      try {
        // Try to load a small amount of data
        const result = await SchoolInfoService.getAll({ top: 1 });
        if (result.success) {
          return {
            success: true,
            message: 'متصل بقوائم SharePoint عبر Power SDK',
            details: { environment: 'Power Apps', dataAvailable: !!result.data },
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
  
  getSharePointItemLink,
};
