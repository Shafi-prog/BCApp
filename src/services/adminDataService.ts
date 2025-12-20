// Admin Data Service for Power Platform Code App
// Connects SharePoint lists via Power SDK generated services
// NO localStorage - SharePoint ONLY for security compliance

import {
  BC_Admin_ContactsService,
  BC_Plan_DocumentsService,
  BC_Shared_PlanService,
  BC_Test_PlansService,
  BC_DR_ChecklistService,
  BC_Incident_EvaluationsService,
  BC_Damage_ReportsService,
  BC_Plan_ReviewService,
  BC_Plan_ScenariosService,
  BC_Mutual_OperationService
} from '../generated';

// ============ INTERFACES ============

export interface AdminContact {
  id: number;
  Title: string;
  role: string;
  email: string;
  phone: string;
  organization: string;
  category: 'internal' | 'external';
  notes: string;
  contactScope?: string;
  contactTiming?: string;
  backupMember?: string;
  isVisibleToSchools?: boolean;
}

export interface BCPlanDocument {
  id: number;
  title: string;
  documentType: string;
  version: string;
  uploadDate: string;
  shareDate: string;
  isShared: boolean;
  fileName: string;
  description: string;
  notes: string;
}

export interface SharedBCPlan {
  id?: number;
  title: string;
  description: string;
  lastUpdated: string;
  isPublished: boolean;
  fileName?: string;
  fileUploadDate?: string;
  notes?: string;
  reviewPeriodMonths?: number;
  nextReviewDate?: string;
  task1_1_complete?: boolean;
  task1_2_complete?: boolean;
  task1_3_complete?: boolean;
  task1_4_complete?: boolean;
}

export interface TestPlan {
  id: number;
  title: string;
  hypothesis: string;
  specificEvent: string;
  targetGroup: string;
  startDate: string;
  endDate: string;
  status: string;
  responsible: string;
  notes: string;
}

export interface DRCheckItem {
  id: number;
  category: string;
  Title: string;
  status: 'ready' | 'partial' | 'not_ready';
  lastChecked: string;
  notes: string;
}

export interface IncidentEvaluation {
  id: number;
  incidentId: number;
  evaluationDate: string;
  responseTimeMinutes: number | undefined;
  recoveryTimeHours: number | undefined;
  studentsReturnedDate: string;
  alternativeUsed: string;
  overallScore: number;
  strengths: string;
  weaknesses: string;
  recommendations: string;
  evaluatedBy: string;
}

export interface DamageReport {
  id: number;
  incidentTitle: string;
  date: string;
  buildingDamage: string;
  equipmentDamage: string;
  dataLoss: string;
  estimatedCost: string;
  recoveryTime: string;
  status: string;
  notes: string;
}

export interface PlanReview {
  id: number;
  reviewFileName?: string;
  reviewFileUploadDate?: string;
  reviewDate?: string;
  reviewNotes?: string;
  reviewRecommendations?: string;
  response_scenario1?: string;
  response_scenario2?: string;
  response_scenario3?: string;
  response_scenario4?: string;
  response_scenario5?: string;
  proceduresFileName?: string;
  proceduresFileUploadDate?: string;
  approvalDate?: string;
  approvedBy?: string;
  task7_1_complete?: boolean;
  task7_2_complete?: boolean;
  task7_3_complete?: boolean;
  lastUpdated?: string;
}

export interface PlanScenario {
  id: number;
  title: string;
  description: string;
  actions: string[];
}

export interface MutualOperation {
  sourceSchool: string;
  school: string;
  address: string;
  distance: number;
  transport: string;
}

// ============ HELPER FUNCTIONS ============

const extractChoice = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (Array.isArray(field) && field.length > 0) {
    return field[0]?.Value || '';
  }
  if (typeof field === 'object') {
    return field.Value || field.Title || '';
  }
  return String(field);
};

// ============ TRANSFORMERS ============

const transformAdminContact = (raw: any): AdminContact => ({
  id: raw.ID || raw.id || 0,
  Title: raw.Title || '',
  role: extractChoice(raw.field_1) || '',
  phone: raw.field_2?.toString() || '',
  email: raw.field_3 || '',
  organization: extractChoice(raw.field_4) || '',
  category: extractChoice(raw.field_5) || 'internal',
  contactScope: extractChoice(raw.field_6) || '',
  contactTiming: extractChoice(raw.field_7) || '',
  backupMember: extractChoice(raw.field_8) || '',
  notes: raw.field_9 || '',
  isVisibleToSchools: raw.field_10 === true || raw.field_10 === 'true' || false,
});

const transformBCPlanDocument = (raw: any): BCPlanDocument => ({
  id: raw.ID || raw.id || 0,
  title: raw.Title || '',
  documentType: extractChoice(raw.field_1) || '',
  description: raw.field_2 || '',
  fileName: raw.field_3 || '',
  version: raw.field_4 || '',
  uploadDate: raw.field_5 || '',
  shareDate: raw.field_6 || '',
  isShared: raw.field_7 || false,
  notes: raw.field_8 || '',
});

const transformSharedBCPlan = (raw: any): SharedBCPlan => ({
  id: raw.ID || raw.id || 0,
  title: raw.Title || '',
  description: raw.field_1 || '',
  fileName: raw.field_2 || '',
  isPublished: raw.field_3 || false,
  lastUpdated: raw.field_5 || raw.Modified || '',
  reviewPeriodMonths: raw.field_6 || 12,
  nextReviewDate: raw.field_7 || '',
  notes: raw.field_8 || '',
  fileUploadDate: raw.FileUploadDate || '',
  task1_1_complete: raw.Task1_1_Complete || false,
  task1_2_complete: raw.Task1_2_Complete || false,
  task1_3_complete: raw.Task1_3_Complete || false,
  task1_4_complete: raw.Task1_4_Complete || false,
});

const transformTestPlan = (raw: any): TestPlan => ({
  id: raw.ID || raw.id || 0,
  title: raw.Title || '',
  hypothesis: raw.field_1 || '',
  specificEvent: raw.field_2 || '',
  targetGroup: raw.field_3 || '',
  startDate: raw.field_4 || '',
  endDate: raw.field_5 || '',
  status: extractChoice(raw.field_6) || '',
  responsible: raw.field_7 || '',
  notes: raw.field_8 || '',
});

const transformDRCheckItem = (raw: any): DRCheckItem => ({
  id: raw.ID || raw.id || 0,
  Title: raw.Title || '',
  category: extractChoice(raw.field_1) || '',
  status: extractChoice(raw.field_2) || 'not_ready',
  lastChecked: raw.field_3 || '',
  notes: raw.field_4 || '',
});

const transformIncidentEvaluation = (raw: any): IncidentEvaluation => ({
  id: raw.ID || raw.id || 0,
  incidentId: raw.field_1 || 0,
  evaluationDate: raw.field_2 || '',
  evaluatedBy: raw.field_3 || '',
  overallScore: raw.field_4 || 0,
  strengths: raw.field_5 || '',
  weaknesses: raw.field_6 || '',
  recommendations: raw.field_7 || '',
  responseTimeMinutes: raw.field_8,
  recoveryTimeHours: raw.field_9,
  studentsReturnedDate: raw.field_10 || '',
  alternativeUsed: raw.field_11 || '',
});

const transformDamageReport = (raw: any): DamageReport => ({
  id: raw.ID || raw.id || 0,
  incidentTitle: raw.Title || '',
  date: raw.field_1 || '',
  buildingDamage: extractChoice(raw.field_2) || '',
  equipmentDamage: extractChoice(raw.field_3) || '',
  dataLoss: extractChoice(raw.field_4) || '',
  estimatedCost: raw.field_5 || '',
  recoveryTime: raw.field_6?.toString() || '',
  status: extractChoice(raw.field_7) || '',
  notes: raw.field_8 || '',
});

const transformPlanReview = (raw: any): PlanReview => ({
  id: raw.ID || raw.id || 0,
  reviewDate: raw.field_1 || '',
  approvedBy: raw.field_2 || '',
  approvalDate: raw.field_3 || '',
  reviewNotes: raw.field_4 || '',
  reviewFileName: raw.field_5 || '',
  reviewFileUploadDate: raw.field_6 || '',
  reviewRecommendations: raw.field_7 || '',
  response_scenario1: raw.field_8 || '',
  response_scenario2: raw.field_9 || '',
  response_scenario3: raw.field_10 || '',
  response_scenario4: raw.field_11 || '',
  response_scenario5: raw.field_12 || '',
  proceduresFileName: raw.field_13 || '',
  proceduresFileUploadDate: raw.field_14 || '',
  task7_1_complete: raw.field_15 || false,
  task7_2_complete: raw.field_16 || false,
  task7_3_complete: raw.field_17 || false,
  lastUpdated: raw.Modified || '',
});

const transformPlanScenario = (raw: any): PlanScenario => {
  const actionsText = raw.field_3 || '';
  const actions = typeof actionsText === 'string' 
    ? actionsText.split('\n').filter((a: string) => a.trim())
    : (Array.isArray(actionsText) ? actionsText : []);
  
  return {
    id: raw.ID || raw.id || 0,
    title: raw.Title || '',
    description: raw.field_2 || '',
    actions: actions,
  };
};

const transformMutualOperation = (raw: any): MutualOperation => ({
  sourceSchool: raw.field_1 || '',
  school: raw.field_2 || '',
  address: raw.field_3 || '',
  distance: raw.field_4 || 0,
  transport: raw.field_5 || '',
});

// ============ ADMIN DATA SERVICE - SHAREPOINT ONLY ============

export const AdminDataService = {
  // ===== ADMIN CONTACTS =====
  async getAdminContacts(): Promise<AdminContact[]> {
    try {
      console.log('[AdminData] Loading admin contacts from SharePoint...');
      const result = await BC_Admin_ContactsService.getAll();
      if (result.success && result.data) {
        const contacts = result.data.map(transformAdminContact);
        console.log(`[AdminData] Loaded ${contacts.length} admin contacts`);
        return contacts;
      }
      console.warn('[AdminData] No contacts found or error:', result.error);
      return [];
    } catch (e: any) {
      console.error('[AdminData] Error loading admin contacts:', e);
      return [];
    }
  },

  async createAdminContact(contact: Omit<AdminContact, 'id'>): Promise<AdminContact> {
    try {
      const data: any = {
        Title: contact.Title,
        field_1: [{ Value: contact.role }],
        field_2: parseFloat(contact.phone) || 0,
        field_3: contact.email,
        field_4: [{ Value: contact.organization }],
        field_5: [{ Value: contact.category }],
        field_6: [{ Value: contact.contactScope || '' }],
        field_7: [{ Value: contact.contactTiming || '' }],
        field_8: [{ Value: contact.backupMember || '' }],
        field_9: contact.notes,
        field_10: contact.isVisibleToSchools || false,
      };
      const result = await BC_Admin_ContactsService.create(data);
      if (result.success && result.data) {
        return transformAdminContact(result.data);
      }
      throw new Error(String(result.error) || 'Failed to create contact');
    } catch (e: any) {
      console.error('[AdminData] Error creating admin contact:', e);
      throw e;
    }
  },

  async updateAdminContact(id: number, updates: Partial<AdminContact>): Promise<AdminContact | null> {
    try {
      const data: any = {};
      if (updates.Title !== undefined) data.Title = updates.Title;
      if (updates.role !== undefined) data.field_1 = [{ Value: updates.role }];
      if (updates.phone !== undefined) data.field_2 = parseFloat(updates.phone) || 0;
      if (updates.email !== undefined) data.field_3 = updates.email;
      if (updates.organization !== undefined) data.field_4 = [{ Value: updates.organization }];
      if (updates.category !== undefined) data.field_5 = [{ Value: updates.category }];
      if (updates.contactScope !== undefined) data.field_6 = [{ Value: updates.contactScope }];
      if (updates.contactTiming !== undefined) data.field_7 = [{ Value: updates.contactTiming }];
      if (updates.backupMember !== undefined) data.field_8 = [{ Value: updates.backupMember }];
      if (updates.notes !== undefined) data.field_9 = updates.notes;
      if (updates.isVisibleToSchools !== undefined) data.field_10 = updates.isVisibleToSchools;

      const result = await BC_Admin_ContactsService.update(id.toString(), data);
      if (result.success && result.data) {
        return transformAdminContact(result.data);
      }
      throw new Error(String(result.error) || 'Failed to update contact');
    } catch (e: any) {
      console.error('[AdminData] Error updating admin contact:', e);
      throw e;
    }
  },

  async deleteAdminContact(id: number): Promise<void> {
    try {
      await BC_Admin_ContactsService.delete(id.toString());
    } catch (e: any) {
      console.error('[AdminData] Error deleting admin contact:', e);
      throw e;
    }
  },

  // ===== BC PLAN DOCUMENTS =====
  async getBCPlanDocuments(): Promise<BCPlanDocument[]> {
    try {
      console.log('[AdminData] Loading BC plan documents from SharePoint...');
      const result = await BC_Plan_DocumentsService.getAll();
      if (result.success && result.data) {
        const docs = result.data.map(transformBCPlanDocument);
        console.log(`[AdminData] Loaded ${docs.length} BC plan documents`);
        return docs;
      }
      return [];
    } catch (e: any) {
      console.error('[AdminData] Error loading BC plan documents:', e);
      return [];
    }
  },

  async createBCPlanDocument(doc: Omit<BCPlanDocument, 'id'>): Promise<BCPlanDocument> {
    try {
      const data: any = {
        Title: doc.title,
        field_1: [{ Value: doc.documentType }],
        field_2: doc.description,
        field_3: doc.fileName,
        field_4: doc.version,
        field_5: doc.uploadDate,
        field_6: doc.shareDate,
        field_7: doc.isShared,
        field_8: doc.notes,
      };
      const result = await BC_Plan_DocumentsService.create(data);
      if (result.success && result.data) {
        return transformBCPlanDocument(result.data);
      }
      throw new Error(String(result.error) || 'Failed to create document');
    } catch (e: any) {
      console.error('[AdminData] Error creating BC plan document:', e);
      throw e;
    }
  },

  async updateBCPlanDocument(id: number, updates: Partial<BCPlanDocument>): Promise<BCPlanDocument | null> {
    try {
      const data: any = {};
      if (updates.title !== undefined) data.Title = updates.title;
      if (updates.documentType !== undefined) data.field_1 = [{ Value: updates.documentType }];
      if (updates.description !== undefined) data.field_2 = updates.description;
      if (updates.fileName !== undefined) data.field_3 = updates.fileName;
      if (updates.isShared !== undefined) data.field_7 = updates.isShared;
      if (updates.notes !== undefined) data.field_8 = updates.notes;

      const result = await BC_Plan_DocumentsService.update(id.toString(), data);
      if (result.success && result.data) {
        return transformBCPlanDocument(result.data);
      }
      throw new Error(String(result.error) || 'Failed to update document');
    } catch (e: any) {
      console.error('[AdminData] Error updating BC plan document:', e);
      throw e;
    }
  },

  async deleteBCPlanDocument(id: number): Promise<void> {
    try {
      await BC_Plan_DocumentsService.delete(id.toString());
    } catch (e: any) {
      console.error('[AdminData] Error deleting BC plan document:', e);
      throw e;
    }
  },

  // ===== SHARED BC PLAN =====
  async getSharedBCPlan(): Promise<SharedBCPlan | null> {
    try {
      console.log('[AdminData] Loading shared BC plan from SharePoint...');
      const result = await BC_Shared_PlanService.getAll({ top: 1 });
      if (result.success && result.data && result.data.length > 0) {
        const plan = transformSharedBCPlan(result.data[0]);
        console.log('[AdminData] Loaded BC Plan, isPublished:', plan.isPublished);
        return plan;
      }
      console.log('[AdminData] No shared BC plan found');
      return null;
    } catch (e: any) {
      console.error('[AdminData] Error loading shared BC plan:', e);
      return null;
    }
  },

  async saveSharedBCPlan(plan: SharedBCPlan): Promise<SharedBCPlan> {
    try {
      const data: any = {
        Title: plan.title,
        field_1: plan.description,
        field_2: plan.fileName,
        field_3: plan.isPublished,
        field_5: plan.lastUpdated || new Date().toISOString(),
        field_6: plan.reviewPeriodMonths,
        field_7: plan.nextReviewDate,
        field_8: plan.notes,
        FileUploadDate: plan.fileUploadDate,
        Task1_1_Complete: plan.task1_1_complete,
        Task1_2_Complete: plan.task1_2_complete,
        Task1_3_Complete: plan.task1_3_complete,
        Task1_4_Complete: plan.task1_4_complete,
      };

      if (plan.id) {
        const result = await BC_Shared_PlanService.update(plan.id.toString(), data);
        if (result.success && result.data) {
          return transformSharedBCPlan(result.data);
        }
      } else {
        const result = await BC_Shared_PlanService.create(data);
        if (result.success && result.data) {
          return transformSharedBCPlan(result.data);
        }
      }
      throw new Error('Failed to save shared BC plan');
    } catch (e: any) {
      console.error('[AdminData] Error saving shared BC plan:', e);
      throw e;
    }
  },

  // ===== TEST PLANS =====
  async getTestPlans(): Promise<TestPlan[]> {
    try {
      console.log('[AdminData] Loading test plans from SharePoint...');
      const result = await BC_Test_PlansService.getAll();
      if (result.success && result.data) {
        const plans = result.data.map(transformTestPlan);
        console.log(`[AdminData] Loaded ${plans.length} test plans`);
        return plans;
      }
      return [];
    } catch (e: any) {
      console.error('[AdminData] Error loading test plans:', e);
      return [];
    }
  },

  async createTestPlan(plan: Omit<TestPlan, 'id'>): Promise<TestPlan> {
    try {
      const data: any = {
        Title: plan.title,
        field_1: plan.hypothesis,
        field_2: plan.specificEvent,
        field_3: plan.targetGroup,
        field_4: plan.startDate,
        field_5: plan.endDate,
        field_6: [{ Value: plan.status }],
        field_7: plan.responsible,
        field_8: plan.notes,
      };
      const result = await BC_Test_PlansService.create(data);
      if (result.success && result.data) {
        return transformTestPlan(result.data);
      }
      throw new Error(String(result.error) || 'Failed to create test plan');
    } catch (e: any) {
      console.error('[AdminData] Error creating test plan:', e);
      throw e;
    }
  },

  async updateTestPlan(id: number, updates: Partial<TestPlan>): Promise<TestPlan | null> {
    try {
      const data: any = {};
      if (updates.title !== undefined) data.Title = updates.title;
      if (updates.hypothesis !== undefined) data.field_1 = updates.hypothesis;
      if (updates.specificEvent !== undefined) data.field_2 = updates.specificEvent;
      if (updates.status !== undefined) data.field_6 = [{ Value: updates.status }];
      if (updates.responsible !== undefined) data.field_7 = updates.responsible;
      if (updates.notes !== undefined) data.field_8 = updates.notes;

      const result = await BC_Test_PlansService.update(id.toString(), data);
      if (result.success && result.data) {
        return transformTestPlan(result.data);
      }
      throw new Error(String(result.error) || 'Failed to update test plan');
    } catch (e: any) {
      console.error('[AdminData] Error updating test plan:', e);
      throw e;
    }
  },

  async deleteTestPlan(id: number): Promise<void> {
    try {
      await BC_Test_PlansService.delete(id.toString());
    } catch (e: any) {
      console.error('[AdminData] Error deleting test plan:', e);
      throw e;
    }
  },

  // ===== DR CHECKLIST =====
  async getDRChecklist(): Promise<DRCheckItem[]> {
    try {
      console.log('[AdminData] Loading DR checklist from SharePoint...');
      const result = await BC_DR_ChecklistService.getAll();
      if (result.success && result.data) {
        const items = result.data.map(transformDRCheckItem);
        console.log(`[AdminData] Loaded ${items.length} DR checklist items`);
        return items;
      }
      return [];
    } catch (e: any) {
      console.error('[AdminData] Error loading DR checklist:', e);
      return [];
    }
  },

  async createDRCheckItem(item: Omit<DRCheckItem, 'id'>): Promise<DRCheckItem> {
    try {
      const data: any = {
        Title: item.Title,
        field_1: [{ Value: item.category }],
        field_2: [{ Value: item.status }],
        field_3: item.lastChecked,
        field_4: item.notes,
      };
      const result = await BC_DR_ChecklistService.create(data);
      if (result.success && result.data) {
        return transformDRCheckItem(result.data);
      }
      throw new Error(String(result.error) || 'Failed to create DR check item');
    } catch (e: any) {
      console.error('[AdminData] Error creating DR check item:', e);
      throw e;
    }
  },

  async updateDRCheckItem(id: number, updates: Partial<DRCheckItem>): Promise<DRCheckItem | null> {
    try {
      const data: any = {};
      if (updates.Title !== undefined) data.Title = updates.Title;
      if (updates.category !== undefined) data.field_1 = [{ Value: updates.category }];
      if (updates.status !== undefined) data.field_2 = [{ Value: updates.status }];
      if (updates.lastChecked !== undefined) data.field_3 = updates.lastChecked;
      if (updates.notes !== undefined) data.field_4 = updates.notes;

      const result = await BC_DR_ChecklistService.update(id.toString(), data);
      if (result.success && result.data) {
        return transformDRCheckItem(result.data);
      }
      throw new Error(String(result.error) || 'Failed to update DR check item');
    } catch (e: any) {
      console.error('[AdminData] Error updating DR check item:', e);
      throw e;
    }
  },

  async deleteDRCheckItem(id: number): Promise<void> {
    try {
      await BC_DR_ChecklistService.delete(id.toString());
    } catch (e: any) {
      console.error('[AdminData] Error deleting DR check item:', e);
      throw e;
    }
  },

  // ===== INCIDENT EVALUATIONS =====
  async getIncidentEvaluations(): Promise<IncidentEvaluation[]> {
    try {
      console.log('[AdminData] Loading incident evaluations from SharePoint...');
      const result = await BC_Incident_EvaluationsService.getAll();
      if (result.success && result.data) {
        const evals = result.data.map(transformIncidentEvaluation);
        console.log(`[AdminData] Loaded ${evals.length} incident evaluations`);
        return evals;
      }
      return [];
    } catch (e: any) {
      console.error('[AdminData] Error loading incident evaluations:', e);
      return [];
    }
  },

  async createIncidentEvaluation(evaluation: Omit<IncidentEvaluation, 'id'>): Promise<IncidentEvaluation> {
    try {
      const data: any = {
        field_1: evaluation.incidentId,
        field_2: evaluation.evaluationDate,
        field_3: evaluation.evaluatedBy,
        field_4: evaluation.overallScore,
        field_5: evaluation.strengths,
        field_6: evaluation.weaknesses,
        field_7: evaluation.recommendations,
        field_8: evaluation.responseTimeMinutes,
        field_9: evaluation.recoveryTimeHours,
        field_10: evaluation.studentsReturnedDate,
        field_11: evaluation.alternativeUsed,
      };
      const result = await BC_Incident_EvaluationsService.create(data);
      if (result.success && result.data) {
        return transformIncidentEvaluation(result.data);
      }
      throw new Error(String(result.error) || 'Failed to create evaluation');
    } catch (e: any) {
      console.error('[AdminData] Error creating incident evaluation:', e);
      throw e;
    }
  },

  async updateIncidentEvaluation(id: number, updates: Partial<IncidentEvaluation>): Promise<IncidentEvaluation | null> {
    try {
      const data: any = {};
      if (updates.overallScore !== undefined) data.field_4 = updates.overallScore;
      if (updates.strengths !== undefined) data.field_5 = updates.strengths;
      if (updates.weaknesses !== undefined) data.field_6 = updates.weaknesses;
      if (updates.recommendations !== undefined) data.field_7 = updates.recommendations;

      const result = await BC_Incident_EvaluationsService.update(id.toString(), data);
      if (result.success && result.data) {
        return transformIncidentEvaluation(result.data);
      }
      throw new Error(String(result.error) || 'Failed to update evaluation');
    } catch (e: any) {
      console.error('[AdminData] Error updating incident evaluation:', e);
      throw e;
    }
  },

  async deleteIncidentEvaluation(id: number): Promise<void> {
    try {
      await BC_Incident_EvaluationsService.delete(id.toString());
    } catch (e: any) {
      console.error('[AdminData] Error deleting incident evaluation:', e);
      throw e;
    }
  },

  // ===== DAMAGE REPORTS =====
  async getDamageReports(): Promise<DamageReport[]> {
    try {
      console.log('[AdminData] Loading damage reports from SharePoint...');
      const result = await BC_Damage_ReportsService.getAll();
      if (result.success && result.data) {
        const reports = result.data.map(transformDamageReport);
        console.log(`[AdminData] Loaded ${reports.length} damage reports`);
        return reports;
      }
      return [];
    } catch (e: any) {
      console.error('[AdminData] Error loading damage reports:', e);
      return [];
    }
  },

  async createDamageReport(report: Omit<DamageReport, 'id'>): Promise<DamageReport> {
    try {
      const data: any = {
        Title: report.incidentTitle,
        field_1: report.date,
        field_2: [{ Value: report.buildingDamage }],
        field_3: [{ Value: report.equipmentDamage }],
        field_4: [{ Value: report.dataLoss }],
        field_5: report.estimatedCost,
        field_6: parseFloat(report.recoveryTime) || 0,
        field_7: [{ Value: report.status }],
        field_8: report.notes,
      };
      const result = await BC_Damage_ReportsService.create(data);
      if (result.success && result.data) {
        return transformDamageReport(result.data);
      }
      throw new Error(String(result.error) || 'Failed to create damage report');
    } catch (e: any) {
      console.error('[AdminData] Error creating damage report:', e);
      throw e;
    }
  },

  async updateDamageReport(id: number, updates: Partial<DamageReport>): Promise<DamageReport | null> {
    try {
      const data: any = {};
      if (updates.incidentTitle !== undefined) data.Title = updates.incidentTitle;
      if (updates.status !== undefined) data.field_7 = [{ Value: updates.status }];
      if (updates.notes !== undefined) data.field_8 = updates.notes;

      const result = await BC_Damage_ReportsService.update(id.toString(), data);
      if (result.success && result.data) {
        return transformDamageReport(result.data);
      }
      throw new Error(String(result.error) || 'Failed to update damage report');
    } catch (e: any) {
      console.error('[AdminData] Error updating damage report:', e);
      throw e;
    }
  },

  async deleteDamageReport(id: number): Promise<void> {
    try {
      await BC_Damage_ReportsService.delete(id.toString());
    } catch (e: any) {
      console.error('[AdminData] Error deleting damage report:', e);
      throw e;
    }
  },

  // ===== PLAN REVIEW =====
  async getPlanReview(): Promise<PlanReview | null> {
    try {
      console.log('[AdminData] Loading plan review from SharePoint...');
      const result = await BC_Plan_ReviewService.getAll({ top: 1 });
      if (result.success && result.data && result.data.length > 0) {
        return transformPlanReview(result.data[0]);
      }
      return null;
    } catch (e: any) {
      console.error('[AdminData] Error loading plan review:', e);
      return null;
    }
  },

  async savePlanReview(review: PlanReview): Promise<PlanReview> {
    try {
      const data: any = {
        field_1: review.reviewDate,
        field_2: review.approvedBy,
        field_3: review.approvalDate,
        field_4: review.reviewNotes,
        field_5: review.reviewFileName,
        field_6: review.reviewFileUploadDate,
        field_7: review.reviewRecommendations,
        field_8: review.response_scenario1,
        field_9: review.response_scenario2,
        field_10: review.response_scenario3,
        field_11: review.response_scenario4,
        field_12: review.response_scenario5,
        field_13: review.proceduresFileName,
        field_14: review.proceduresFileUploadDate,
        field_15: review.task7_1_complete,
        field_16: review.task7_2_complete,
        field_17: review.task7_3_complete,
      };

      if (review.id) {
        const result = await BC_Plan_ReviewService.update(review.id.toString(), data);
        if (result.success && result.data) {
          return transformPlanReview(result.data);
        }
      } else {
        const result = await BC_Plan_ReviewService.create(data);
        if (result.success && result.data) {
          return transformPlanReview(result.data);
        }
      }
      throw new Error('Failed to save plan review');
    } catch (e: any) {
      console.error('[AdminData] Error saving plan review:', e);
      throw e;
    }
  },

  // ===== PLAN SCENARIOS =====
  async getPlanScenarios(): Promise<PlanScenario[]> {
    try {
      console.log('[AdminData] Loading plan scenarios from SharePoint...');
      const result = await BC_Plan_ScenariosService.getAll();
      if (result.success && result.data) {
        const scenarios = result.data.map(transformPlanScenario);
        console.log(`[AdminData] Loaded ${scenarios.length} plan scenarios`);
        return scenarios;
      }
      return [];
    } catch (e: any) {
      console.error('[AdminData] Error loading plan scenarios:', e);
      return [];
    }
  },

  async createPlanScenario(scenario: Omit<PlanScenario, 'id'>): Promise<PlanScenario> {
    try {
      const data: any = {
        Title: scenario.title,
        field_2: scenario.description,
        field_3: scenario.actions.join('\n'),
      };
      const result = await BC_Plan_ScenariosService.create(data);
      if (result.success && result.data) {
        return transformPlanScenario(result.data);
      }
      throw new Error(String(result.error) || 'Failed to create scenario');
    } catch (e: any) {
      console.error('[AdminData] Error creating plan scenario:', e);
      throw e;
    }
  },

  async updatePlanScenario(id: number, updates: Partial<PlanScenario>): Promise<PlanScenario | null> {
    try {
      const data: any = {};
      if (updates.title !== undefined) data.Title = updates.title;
      if (updates.description !== undefined) data.field_2 = updates.description;
      if (updates.actions !== undefined) data.field_3 = updates.actions.join('\n');

      const result = await BC_Plan_ScenariosService.update(id.toString(), data);
      if (result.success && result.data) {
        return transformPlanScenario(result.data);
      }
      throw new Error(String(result.error) || 'Failed to update scenario');
    } catch (e: any) {
      console.error('[AdminData] Error updating plan scenario:', e);
      throw e;
    }
  },

  async deletePlanScenario(id: number): Promise<void> {
    try {
      await BC_Plan_ScenariosService.delete(id.toString());
    } catch (e: any) {
      console.error('[AdminData] Error deleting plan scenario:', e);
      throw e;
    }
  },

  // ===== MUTUAL OPERATION =====
  async getMutualOperations(): Promise<MutualOperation[]> {
    try {
      console.log('[AdminData] Loading mutual operations from SharePoint...');
      const result = await BC_Mutual_OperationService.getAll();
      if (result.success && result.data) {
        const ops = result.data.map(transformMutualOperation);
        console.log(`[AdminData] Loaded ${ops.length} mutual operations`);
        return ops;
      }
      // Fallback to static data file (not localStorage)
      const { mutualOperationPlan } = await import('../data/mutualOperation');
      return mutualOperationPlan.flatMap(school => 
        school.alternatives.map(alt => ({
          sourceSchool: school.sourceSchool,
          school: alt.school,
          address: alt.address,
          distance: alt.distance,
          transport: alt.transport,
        }))
      );
    } catch (e: any) {
      console.error('[AdminData] Error loading mutual operations:', e);
      return [];
    }
  },

  async createMutualOperation(op: MutualOperation): Promise<MutualOperation> {
    try {
      const data: any = {
        field_1: op.sourceSchool,
        field_2: op.school,
        field_3: op.address,
        field_4: op.distance,
        field_5: op.transport,
      };
      const result = await BC_Mutual_OperationService.create(data);
      if (result.success && result.data) {
        return transformMutualOperation(result.data);
      }
      throw new Error(String(result.error) || 'Failed to create mutual operation');
    } catch (e: any) {
      console.error('[AdminData] Error creating mutual operation:', e);
      throw e;
    }
  },
};

export default AdminDataService;
