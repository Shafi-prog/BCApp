// Admin Data Service for Power Platform Code App
// Connects the 10 new SharePoint lists via Power SDK generated services
// Provides fallback to localStorage for local development

import { isPowerAppsEnvironment } from './powerSDKClient';
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
  Title: string;  // Name - matches SharePoint Title column
  role: string;
  email: string;
  phone: string;
  organization: string;
  category: 'internal' | 'external';
  notes: string;
  contactScope?: string;
  contactTiming?: string;
  backupMember?: string;
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
  Title: string;  // Checklist item description
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

// Extract choice value from SharePoint format
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

// Transform AdminContact from SharePoint format
const transformAdminContact = (raw: any): AdminContact => ({
  id: raw.ID || raw.id || 0,
  Title: raw.Title || '',
  role: extractChoice(raw.field_1) || raw.role || '',
  phone: raw.field_2?.toString() || raw.phone || '',
  email: raw.field_3 || raw.email || '',
  organization: extractChoice(raw.field_4) || raw.organization || '',
  category: extractChoice(raw.field_5) || raw.category || 'internal',
  contactScope: extractChoice(raw.field_6) || raw.contactScope || '',
  contactTiming: extractChoice(raw.field_7) || raw.contactTiming || '',
  backupMember: extractChoice(raw.field_8) || raw.backupMember || '',
  notes: raw.field_9 || raw.notes || '',
});

// Transform BCPlanDocument from SharePoint format
const transformBCPlanDocument = (raw: any): BCPlanDocument => ({
  id: raw.ID || raw.id || 0,
  title: raw.Title || '',
  documentType: extractChoice(raw.field_1) || raw.documentType || '',
  description: raw.field_2 || raw.description || '',
  fileName: raw.field_3 || raw.fileName || '',
  version: raw.field_4 || raw.version || '',
  uploadDate: raw.field_5 || raw.uploadDate || '',
  shareDate: raw.field_6 || raw.shareDate || '',
  isShared: raw.field_7 || raw.isShared || false,
  notes: raw.field_8 || raw.notes || '',
});

// Transform SharedBCPlan from SharePoint format  
const transformSharedBCPlan = (raw: any): SharedBCPlan => ({
  id: raw.ID || raw.id || 0,
  title: raw.Title || '',
  description: raw.field_1 || raw.description || '',
  fileName: raw.field_2 || raw.fileName || '',
  isPublished: raw.field_3 || raw.isPublished || false,
  lastUpdated: raw.Modified || raw.lastUpdated || '',
  reviewPeriodMonths: raw.field_4 || raw.reviewPeriodMonths || 12,
  nextReviewDate: raw.field_5 || raw.nextReviewDate || '',
  notes: raw.field_6 || raw.notes || '',
  fileUploadDate: raw.field_7 || raw.fileUploadDate || '',
  task1_1_complete: raw.field_8 || raw.task1_1_complete || false,
  task1_2_complete: raw.field_9 || raw.task1_2_complete || false,
  task1_3_complete: raw.field_10 || raw.task1_3_complete || false,
  task1_4_complete: raw.field_11 || raw.task1_4_complete || false,
});

// Transform TestPlan from SharePoint format
const transformTestPlan = (raw: any): TestPlan => ({
  id: raw.ID || raw.id || 0,
  title: raw.Title || '',
  hypothesis: extractChoice(raw.field_1) || raw.hypothesis || '',
  specificEvent: raw.field_2 || raw.specificEvent || '',
  targetGroup: extractChoice(raw.field_3) || raw.targetGroup || '',
  startDate: raw.field_4 || raw.startDate || '',
  endDate: raw.field_5 || raw.endDate || '',
  status: extractChoice(raw.field_6) || raw.status || '',
  responsible: raw.field_7 || raw.responsible || '',
  notes: raw.field_8 || raw.notes || '',
});

// Transform DRCheckItem from SharePoint format
const transformDRCheckItem = (raw: any): DRCheckItem => ({
  id: raw.ID || raw.id || 0,
  Title: raw.Title || '',
  category: extractChoice(raw.field_1) || raw.category || '',
  status: extractChoice(raw.field_2) || raw.status || 'not_ready',
  lastChecked: raw.field_3 || raw.lastChecked || '',
  notes: raw.field_4 || raw.notes || '',
});

// Transform IncidentEvaluation from SharePoint format
const transformIncidentEvaluation = (raw: any): IncidentEvaluation => ({
  id: raw.ID || raw.id || 0,
  incidentId: raw.field_1 || raw.incidentId || 0,
  evaluationDate: raw.field_2 || raw.evaluationDate || '',
  evaluatedBy: raw.field_3 || raw.evaluatedBy || '',
  overallScore: raw.field_4 || raw.overallScore || 0,
  strengths: raw.field_5 || raw.strengths || '',
  weaknesses: raw.field_6 || raw.weaknesses || '',
  recommendations: raw.field_7 || raw.recommendations || '',
  responseTimeMinutes: raw.field_8 || raw.responseTimeMinutes,
  recoveryTimeHours: raw.field_9 || raw.recoveryTimeHours,
  studentsReturnedDate: raw.field_10 || raw.studentsReturnedDate || '',
  alternativeUsed: raw.field_11 || raw.alternativeUsed || '',
});

// Transform DamageReport from SharePoint format
const transformDamageReport = (raw: any): DamageReport => ({
  id: raw.ID || raw.id || 0,
  incidentTitle: raw.Title || raw.incidentTitle || '',
  date: raw.field_1 || raw.date || '',
  buildingDamage: extractChoice(raw.field_2) || raw.buildingDamage || '',
  equipmentDamage: extractChoice(raw.field_3) || raw.equipmentDamage || '',
  dataLoss: extractChoice(raw.field_4) || raw.dataLoss || '',
  estimatedCost: raw.field_5 || raw.estimatedCost || '',
  recoveryTime: raw.field_6?.toString() || raw.recoveryTime || '',
  status: extractChoice(raw.field_7) || raw.status || '',
  notes: raw.field_8 || raw.notes || '',
});

// Transform PlanReview from SharePoint format
const transformPlanReview = (raw: any): PlanReview => ({
  id: raw.ID || raw.id || 0,
  reviewDate: raw.field_1 || raw.reviewDate || '',
  approvedBy: raw.field_2 || raw.approvedBy || '',
  approvalDate: raw.field_3 || raw.approvalDate || '',
  reviewNotes: raw.field_4 || raw.reviewNotes || '',
  reviewFileName: raw.field_5 || raw.reviewFileName || '',
  reviewFileUploadDate: raw.field_6 || raw.reviewFileUploadDate || '',
  reviewRecommendations: raw.field_7 || raw.reviewRecommendations || '',
  response_scenario1: raw.field_8 || raw.response_scenario1 || '',
  response_scenario2: raw.field_9 || raw.response_scenario2 || '',
  response_scenario3: raw.field_10 || raw.response_scenario3 || '',
  response_scenario4: raw.field_11 || raw.response_scenario4 || '',
  response_scenario5: raw.field_12 || raw.response_scenario5 || '',
  proceduresFileName: raw.field_13 || raw.proceduresFileName || '',
  proceduresFileUploadDate: raw.field_14 || raw.proceduresFileUploadDate || '',
  task7_1_complete: raw.field_15 || raw.task7_1_complete || false,
  task7_2_complete: raw.field_16 || raw.task7_2_complete || false,
  task7_3_complete: raw.field_17 || raw.task7_3_complete || false,
  lastUpdated: raw.Modified || raw.lastUpdated || '',
});

// Transform PlanScenario from SharePoint format
const transformPlanScenario = (raw: any): PlanScenario => {
  // Actions are stored as newline-separated text in SharePoint
  const actionsText = raw.field_1 || raw.actions || '';
  const actions = typeof actionsText === 'string' 
    ? actionsText.split('\n').filter((a: string) => a.trim())
    : (Array.isArray(actionsText) ? actionsText : []);
  
  return {
    id: raw.ID || raw.id || 0,
    title: raw.Title || '',
    description: raw.field_2 || raw.description || '',
    actions: actions,
  };
};

// Transform MutualOperation from SharePoint format
const transformMutualOperation = (raw: any): MutualOperation => ({
  sourceSchool: raw.field_1 || raw.sourceSchool || '',
  school: raw.field_2 || raw.school || '',
  address: raw.field_3 || raw.address || '',
  distance: raw.field_4 || raw.distance || 0,
  transport: raw.field_5 || raw.transport || '',
});

// ============ ADMIN DATA SERVICE ============

export const AdminDataService = {
  // ===== ADMIN CONTACTS =====
  async getAdminContacts(): Promise<AdminContact[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[AdminData] Loading admin contacts from SharePoint...');
        const result = await BC_Admin_ContactsService.getAll();
        if (result.success && result.data) {
          const contacts = result.data.map(transformAdminContact);
          console.log(`[AdminData] Loaded ${contacts.length} admin contacts`);
          return contacts;
        }
        throw new Error(String(result.error) || 'Failed to load contacts');
      } catch (e: any) {
        console.error('[AdminData] Error loading admin contacts:', e);
      }
    }
    // Fallback to localStorage
    const saved = localStorage.getItem('bc_admin_contacts');
    return saved ? JSON.parse(saved) : [];
  },

  async createAdminContact(contact: Omit<AdminContact, 'id'>): Promise<AdminContact> {
    if (isPowerAppsEnvironment()) {
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
    }
    // Fallback to localStorage
    const contacts = await this.getAdminContacts();
    const newContact: AdminContact = { ...contact, id: Date.now() };
    contacts.push(newContact);
    localStorage.setItem('bc_admin_contacts', JSON.stringify(contacts));
    return newContact;
  },

  async updateAdminContact(id: number, updates: Partial<AdminContact>): Promise<AdminContact | null> {
    if (isPowerAppsEnvironment()) {
      try {
        const data: any = {};
        if (updates.Title !== undefined) data.Title = updates.Title;
        if (updates.role !== undefined) data.field_1 = [{ Value: updates.role }];
        if (updates.phone !== undefined) data.field_2 = parseFloat(updates.phone) || 0;
        if (updates.email !== undefined) data.field_3 = updates.email;
        if (updates.organization !== undefined) data.field_4 = [{ Value: updates.organization }];
        if (updates.category !== undefined) data.field_5 = [{ Value: updates.category }];
        if (updates.notes !== undefined) data.field_9 = updates.notes;

        const result = await BC_Admin_ContactsService.update(id.toString(), data);
        if (result.success && result.data) {
          return transformAdminContact(result.data);
        }
        throw new Error(String(result.error) || 'Failed to update contact');
      } catch (e: any) {
        console.error('[AdminData] Error updating admin contact:', e);
        throw e;
      }
    }
    // Fallback to localStorage
    const contacts = await this.getAdminContacts();
    const idx = contacts.findIndex(c => c.id === id);
    if (idx !== -1) {
      contacts[idx] = { ...contacts[idx], ...updates };
      localStorage.setItem('bc_admin_contacts', JSON.stringify(contacts));
      return contacts[idx];
    }
    return null;
  },

  async deleteAdminContact(id: number): Promise<void> {
    if (isPowerAppsEnvironment()) {
      try {
        await BC_Admin_ContactsService.delete(id.toString());
        return;
      } catch (e: any) {
        console.error('[AdminData] Error deleting admin contact:', e);
        throw e;
      }
    }
    // Fallback to localStorage
    const contacts = await this.getAdminContacts();
    const filtered = contacts.filter(c => c.id !== id);
    localStorage.setItem('bc_admin_contacts', JSON.stringify(filtered));
  },

  // ===== BC PLAN DOCUMENTS =====
  async getBCPlanDocuments(): Promise<BCPlanDocument[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[AdminData] Loading BC plan documents from SharePoint...');
        const result = await BC_Plan_DocumentsService.getAll();
        if (result.success && result.data) {
          const docs = result.data.map(transformBCPlanDocument);
          console.log(`[AdminData] Loaded ${docs.length} BC plan documents`);
          return docs;
        }
        throw new Error(String(result.error) || 'Failed to load documents');
      } catch (e: any) {
        console.error('[AdminData] Error loading BC plan documents:', e);
      }
    }
    const saved = localStorage.getItem('bc_plan_documents');
    return saved ? JSON.parse(saved) : [];
  },

  async createBCPlanDocument(doc: Omit<BCPlanDocument, 'id'>): Promise<BCPlanDocument> {
    if (isPowerAppsEnvironment()) {
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
    }
    const docs = await this.getBCPlanDocuments();
    const newDoc: BCPlanDocument = { ...doc, id: Date.now() };
    docs.push(newDoc);
    localStorage.setItem('bc_plan_documents', JSON.stringify(docs));
    return newDoc;
  },

  async updateBCPlanDocument(id: number, updates: Partial<BCPlanDocument>): Promise<BCPlanDocument | null> {
    if (isPowerAppsEnvironment()) {
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
    }
    const docs = await this.getBCPlanDocuments();
    const idx = docs.findIndex(d => d.id === id);
    if (idx !== -1) {
      docs[idx] = { ...docs[idx], ...updates };
      localStorage.setItem('bc_plan_documents', JSON.stringify(docs));
      return docs[idx];
    }
    return null;
  },

  async deleteBCPlanDocument(id: number): Promise<void> {
    if (isPowerAppsEnvironment()) {
      try {
        await BC_Plan_DocumentsService.delete(id.toString());
        return;
      } catch (e: any) {
        console.error('[AdminData] Error deleting BC plan document:', e);
        throw e;
      }
    }
    const docs = await this.getBCPlanDocuments();
    const filtered = docs.filter(d => d.id !== id);
    localStorage.setItem('bc_plan_documents', JSON.stringify(filtered));
  },

  // ===== SHARED BC PLAN =====
  async getSharedBCPlan(): Promise<SharedBCPlan | null> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[AdminData] Loading shared BC plan from SharePoint...');
        const result = await BC_Shared_PlanService.getAll({ top: 1 });
        if (result.success && result.data && result.data.length > 0) {
          return transformSharedBCPlan(result.data[0]);
        }
      } catch (e: any) {
        console.error('[AdminData] Error loading shared BC plan:', e);
      }
    }
    const saved = localStorage.getItem('bc_shared_plan');
    return saved ? JSON.parse(saved) : null;
  },

  async saveSharedBCPlan(plan: SharedBCPlan): Promise<SharedBCPlan> {
    if (isPowerAppsEnvironment()) {
      try {
        const data: any = {
          Title: plan.title,
          field_1: plan.description,
          field_2: plan.fileName,
          field_3: plan.isPublished,
          field_4: plan.reviewPeriodMonths,
          field_5: plan.nextReviewDate,
          field_6: plan.notes,
          field_7: plan.fileUploadDate,
          field_8: plan.task1_1_complete,
          field_9: plan.task1_2_complete,
          field_10: plan.task1_3_complete,
          field_11: plan.task1_4_complete,
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
    }
    localStorage.setItem('bc_shared_plan', JSON.stringify(plan));
    return plan;
  },

  // ===== TEST PLANS =====
  async getTestPlans(): Promise<TestPlan[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[AdminData] Loading test plans from SharePoint...');
        const result = await BC_Test_PlansService.getAll();
        if (result.success && result.data) {
          const plans = result.data.map(transformTestPlan);
          console.log(`[AdminData] Loaded ${plans.length} test plans`);
          return plans;
        }
        throw new Error(String(result.error) || 'Failed to load test plans');
      } catch (e: any) {
        console.error('[AdminData] Error loading test plans:', e);
      }
    }
    const saved = localStorage.getItem('bc_test_plans');
    return saved ? JSON.parse(saved) : [];
  },

  async createTestPlan(plan: Omit<TestPlan, 'id'>): Promise<TestPlan> {
    if (isPowerAppsEnvironment()) {
      try {
        const data: any = {
          Title: plan.title,
          field_1: [{ Value: plan.hypothesis }],
          field_2: plan.specificEvent,
          field_3: [{ Value: plan.targetGroup }],
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
    }
    const plans = await this.getTestPlans();
    const newPlan: TestPlan = { ...plan, id: Date.now() };
    plans.push(newPlan);
    localStorage.setItem('bc_test_plans', JSON.stringify(plans));
    return newPlan;
  },

  async updateTestPlan(id: number, updates: Partial<TestPlan>): Promise<TestPlan | null> {
    if (isPowerAppsEnvironment()) {
      try {
        const data: any = {};
        if (updates.title !== undefined) data.Title = updates.title;
        if (updates.hypothesis !== undefined) data.field_1 = [{ Value: updates.hypothesis }];
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
    }
    const plans = await this.getTestPlans();
    const idx = plans.findIndex(p => p.id === id);
    if (idx !== -1) {
      plans[idx] = { ...plans[idx], ...updates };
      localStorage.setItem('bc_test_plans', JSON.stringify(plans));
      return plans[idx];
    }
    return null;
  },

  async deleteTestPlan(id: number): Promise<void> {
    if (isPowerAppsEnvironment()) {
      try {
        await BC_Test_PlansService.delete(id.toString());
        return;
      } catch (e: any) {
        console.error('[AdminData] Error deleting test plan:', e);
        throw e;
      }
    }
    const plans = await this.getTestPlans();
    const filtered = plans.filter(p => p.id !== id);
    localStorage.setItem('bc_test_plans', JSON.stringify(filtered));
  },

  // ===== DR CHECKLIST =====
  async getDRChecklist(): Promise<DRCheckItem[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[AdminData] Loading DR checklist from SharePoint...');
        const result = await BC_DR_ChecklistService.getAll();
        if (result.success && result.data) {
          const items = result.data.map(transformDRCheckItem);
          console.log(`[AdminData] Loaded ${items.length} DR checklist items`);
          return items;
        }
        throw new Error(String(result.error) || 'Failed to load DR checklist');
      } catch (e: any) {
        console.error('[AdminData] Error loading DR checklist:', e);
      }
    }
    const saved = localStorage.getItem('bc_dr_checklist');
    return saved ? JSON.parse(saved) : [];
  },

  async createDRCheckItem(item: Omit<DRCheckItem, 'id'>): Promise<DRCheckItem> {
    if (isPowerAppsEnvironment()) {
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
    }
    const items = await this.getDRChecklist();
    const newItem: DRCheckItem = { ...item, id: Date.now() };
    items.push(newItem);
    localStorage.setItem('bc_dr_checklist', JSON.stringify(items));
    return newItem;
  },

  async updateDRCheckItem(id: number, updates: Partial<DRCheckItem>): Promise<DRCheckItem | null> {
    if (isPowerAppsEnvironment()) {
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
    }
    const items = await this.getDRChecklist();
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      localStorage.setItem('bc_dr_checklist', JSON.stringify(items));
      return items[idx];
    }
    return null;
  },

  async deleteDRCheckItem(id: number): Promise<void> {
    if (isPowerAppsEnvironment()) {
      try {
        await BC_DR_ChecklistService.delete(id.toString());
        return;
      } catch (e: any) {
        console.error('[AdminData] Error deleting DR check item:', e);
        throw e;
      }
    }
    const items = await this.getDRChecklist();
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem('bc_dr_checklist', JSON.stringify(filtered));
  },

  // ===== INCIDENT EVALUATIONS =====
  async getIncidentEvaluations(): Promise<IncidentEvaluation[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[AdminData] Loading incident evaluations from SharePoint...');
        const result = await BC_Incident_EvaluationsService.getAll();
        if (result.success && result.data) {
          const evals = result.data.map(transformIncidentEvaluation);
          console.log(`[AdminData] Loaded ${evals.length} incident evaluations`);
          return evals;
        }
        throw new Error(String(result.error) || 'Failed to load evaluations');
      } catch (e: any) {
        console.error('[AdminData] Error loading incident evaluations:', e);
      }
    }
    const saved = localStorage.getItem('bc_incident_evaluations');
    return saved ? JSON.parse(saved) : [];
  },

  async createIncidentEvaluation(evaluation: Omit<IncidentEvaluation, 'id'>): Promise<IncidentEvaluation> {
    if (isPowerAppsEnvironment()) {
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
    }
    const evals = await this.getIncidentEvaluations();
    const newEval: IncidentEvaluation = { ...evaluation, id: Date.now() };
    evals.push(newEval);
    localStorage.setItem('bc_incident_evaluations', JSON.stringify(evals));
    return newEval;
  },

  async updateIncidentEvaluation(id: number, updates: Partial<IncidentEvaluation>): Promise<IncidentEvaluation | null> {
    if (isPowerAppsEnvironment()) {
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
    }
    const evals = await this.getIncidentEvaluations();
    const idx = evals.findIndex(e => e.id === id);
    if (idx !== -1) {
      evals[idx] = { ...evals[idx], ...updates };
      localStorage.setItem('bc_incident_evaluations', JSON.stringify(evals));
      return evals[idx];
    }
    return null;
  },

  async deleteIncidentEvaluation(id: number): Promise<void> {
    if (isPowerAppsEnvironment()) {
      try {
        await BC_Incident_EvaluationsService.delete(id.toString());
        return;
      } catch (e: any) {
        console.error('[AdminData] Error deleting incident evaluation:', e);
        throw e;
      }
    }
    const evals = await this.getIncidentEvaluations();
    const filtered = evals.filter(e => e.id !== id);
    localStorage.setItem('bc_incident_evaluations', JSON.stringify(filtered));
  },

  // ===== DAMAGE REPORTS =====
  async getDamageReports(): Promise<DamageReport[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[AdminData] Loading damage reports from SharePoint...');
        const result = await BC_Damage_ReportsService.getAll();
        if (result.success && result.data) {
          const reports = result.data.map(transformDamageReport);
          console.log(`[AdminData] Loaded ${reports.length} damage reports`);
          return reports;
        }
        throw new Error(String(result.error) || 'Failed to load damage reports');
      } catch (e: any) {
        console.error('[AdminData] Error loading damage reports:', e);
      }
    }
    const saved = localStorage.getItem('bc_damage_reports');
    return saved ? JSON.parse(saved) : [];
  },

  async createDamageReport(report: Omit<DamageReport, 'id'>): Promise<DamageReport> {
    if (isPowerAppsEnvironment()) {
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
    }
    const reports = await this.getDamageReports();
    const newReport: DamageReport = { ...report, id: Date.now() };
    reports.push(newReport);
    localStorage.setItem('bc_damage_reports', JSON.stringify(reports));
    return newReport;
  },

  async updateDamageReport(id: number, updates: Partial<DamageReport>): Promise<DamageReport | null> {
    if (isPowerAppsEnvironment()) {
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
    }
    const reports = await this.getDamageReports();
    const idx = reports.findIndex(r => r.id === id);
    if (idx !== -1) {
      reports[idx] = { ...reports[idx], ...updates };
      localStorage.setItem('bc_damage_reports', JSON.stringify(reports));
      return reports[idx];
    }
    return null;
  },

  async deleteDamageReport(id: number): Promise<void> {
    if (isPowerAppsEnvironment()) {
      try {
        await BC_Damage_ReportsService.delete(id.toString());
        return;
      } catch (e: any) {
        console.error('[AdminData] Error deleting damage report:', e);
        throw e;
      }
    }
    const reports = await this.getDamageReports();
    const filtered = reports.filter(r => r.id !== id);
    localStorage.setItem('bc_damage_reports', JSON.stringify(filtered));
  },

  // ===== PLAN REVIEW =====
  async getPlanReview(): Promise<PlanReview | null> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[AdminData] Loading plan review from SharePoint...');
        const result = await BC_Plan_ReviewService.getAll({ top: 1 });
        if (result.success && result.data && result.data.length > 0) {
          return transformPlanReview(result.data[0]);
        }
      } catch (e: any) {
        console.error('[AdminData] Error loading plan review:', e);
      }
    }
    const saved = localStorage.getItem('bc_plan_review');
    return saved ? JSON.parse(saved) : null;
  },

  async savePlanReview(review: PlanReview): Promise<PlanReview> {
    if (isPowerAppsEnvironment()) {
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
    }
    localStorage.setItem('bc_plan_review', JSON.stringify(review));
    return review;
  },

  // ===== PLAN SCENARIOS =====
  async getPlanScenarios(): Promise<PlanScenario[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[AdminData] Loading plan scenarios from SharePoint...');
        const result = await BC_Plan_ScenariosService.getAll();
        if (result.success && result.data) {
          const scenarios = result.data.map(transformPlanScenario);
          console.log(`[AdminData] Loaded ${scenarios.length} plan scenarios`);
          return scenarios;
        }
        throw new Error(String(result.error) || 'Failed to load scenarios');
      } catch (e: any) {
        console.error('[AdminData] Error loading plan scenarios:', e);
      }
    }
    // Return default scenarios from shared BC plan if no SharePoint data
    const sharedPlan = await this.getSharedBCPlan();
    return [];
  },

  async createPlanScenario(scenario: Omit<PlanScenario, 'id'>): Promise<PlanScenario> {
    if (isPowerAppsEnvironment()) {
      try {
        const data: any = {
          Title: scenario.title,
          field_1: scenario.actions.join('\n'),  // Convert array to newline-separated text
          field_2: scenario.description,
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
    }
    // Fallback - scenarios are embedded in shared plan
    return { ...scenario, id: Date.now() };
  },

  async updatePlanScenario(id: number, updates: Partial<PlanScenario>): Promise<PlanScenario | null> {
    if (isPowerAppsEnvironment()) {
      try {
        const data: any = {};
        if (updates.title !== undefined) data.Title = updates.title;
        if (updates.description !== undefined) data.field_2 = updates.description;
        if (updates.actions !== undefined) data.field_1 = updates.actions.join('\n');

        const result = await BC_Plan_ScenariosService.update(id.toString(), data);
        if (result.success && result.data) {
          return transformPlanScenario(result.data);
        }
        throw new Error(String(result.error) || 'Failed to update scenario');
      } catch (e: any) {
        console.error('[AdminData] Error updating plan scenario:', e);
        throw e;
      }
    }
    return null;
  },

  async deletePlanScenario(id: number): Promise<void> {
    if (isPowerAppsEnvironment()) {
      try {
        await BC_Plan_ScenariosService.delete(id.toString());
        return;
      } catch (e: any) {
        console.error('[AdminData] Error deleting plan scenario:', e);
        throw e;
      }
    }
  },

  // ===== MUTUAL OPERATION =====
  async getMutualOperations(): Promise<MutualOperation[]> {
    if (isPowerAppsEnvironment()) {
      try {
        console.log('[AdminData] Loading mutual operations from SharePoint...');
        const result = await BC_Mutual_OperationService.getAll();
        if (result.success && result.data) {
          const ops = result.data.map(transformMutualOperation);
          console.log(`[AdminData] Loaded ${ops.length} mutual operations`);
          return ops;
        }
        throw new Error(String(result.error) || 'Failed to load mutual operations');
      } catch (e: any) {
        console.error('[AdminData] Error loading mutual operations:', e);
      }
    }
    // Fallback to static data
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
  },

  async createMutualOperation(op: MutualOperation): Promise<MutualOperation> {
    if (isPowerAppsEnvironment()) {
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
    }
    return op;
  },
};

export default AdminDataService;
