/**
 * Power SDK Client for SharePoint List Operations
 * Connects to SharePoint lists via Power Platform connectors
 */

// SharePoint Site Configuration
const SHAREPOINT_SITE_URL = 'https://saudimoe.sharepoint.com/sites/em';

// Table/List Configuration matching SharePoint lists
export const TABLE_CONFIG = {
  bc_teams_members: {
    tableId: 'BC_Teams_Members',
    primaryKey: 'ID',
    dataSourceType: 'Connector',
  },
  sbc_drills_log: {
    tableId: 'SBC_Drills_Log',
    primaryKey: 'ID',
    dataSourceType: 'Connector',
  },
  sbc_incidents_log: {
    tableId: 'SBC_Incidents_Log',
    primaryKey: 'ID',
    dataSourceType: 'Connector',
  },
  schoolinfo: {
    tableId: 'SchoolInfo',
    primaryKey: 'ID',
    dataSourceType: 'Connector',
  },
  school_training_log: {
    tableId: 'School_Training_Log',
    primaryKey: 'ID',
    dataSourceType: 'Connector',
  },
  coordination_programs_catalog: {
    tableId: 'Coordination_Programs_Catalog',
    primaryKey: 'ID',
    dataSourceType: 'Connector',
  },
};

// Check if running in Power Apps environment
export const isPowerAppsEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for Power Platform host
  if ((window as any).PowerPlatform) return true;
  
  // Check for Xrm context
  if ((window as any).Xrm?.Utility?.getGlobalContext) return true;
  
  // Check URL patterns
  const hostname = window.location.hostname;
  if (
    hostname.includes('powerapps.com') ||
    hostname.includes('azure-apihub.net') ||
    hostname.includes('dynamics.com') ||
    hostname.includes('crm4.dynamics.com')
  ) {
    return true;
  }
  
  // Not localhost = likely Power Apps
  return !hostname.includes('localhost') && !hostname.includes('127.0.0.1');
};

// Power SDK Client Interface
interface PowerSDKClient {
  retrieveMultipleRecordsAsync: (dataSourceName: string, options?: any) => Promise<SDKResponse>;
  retrieveRecordAsync: (dataSourceName: string, id: string, options?: any) => Promise<SDKResponse>;
  createRecordAsync: (dataSourceName: string, data: any) => Promise<SDKResponse>;
  updateRecordAsync: (dataSourceName: string, id: string, data: any) => Promise<SDKResponse>;
  deleteRecordAsync: (dataSourceName: string, id: string) => Promise<SDKResponse>;
  executeAsync: (options: any) => Promise<SDKResponse>;
}

interface SDKResponse {
  success: boolean;
  data?: any;
  error?: string;
  skipToken?: string;
  nextLink?: string;
}

// Get Power SDK Client from Power Platform host
const getPowerSDKClient = (): PowerSDKClient | null => {
  try {
    // Try PowerPlatform.createClient
    if ((window as any).PowerPlatform?.createClient) {
      return (window as any).PowerPlatform.createClient(TABLE_CONFIG);
    }
    
    // Try Xrm.WebApi
    if ((window as any).Xrm?.WebApi) {
      const webApi = (window as any).Xrm.WebApi;
      return {
        retrieveMultipleRecordsAsync: async (ds, opts) => {
          try {
            const result = await webApi.retrieveMultipleRecords(ds, opts?.filter);
            return { success: true, data: result.entities || result };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        },
        retrieveRecordAsync: async (ds, id) => {
          try {
            const result = await webApi.retrieveRecord(ds, id);
            return { success: true, data: result };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        },
        createRecordAsync: async (ds, data) => {
          try {
            const result = await webApi.createRecord(ds, data);
            return { success: true, data: result };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        },
        updateRecordAsync: async (ds, id, data) => {
          try {
            const result = await webApi.updateRecord(ds, id, data);
            return { success: true, data: result };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        },
        deleteRecordAsync: async (ds, id) => {
          try {
            await webApi.deleteRecord(ds, id);
            return { success: true };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        },
        executeAsync: async () => ({ success: false, error: 'Not implemented' }),
      };
    }
    
    // Check for injected SDK client
    if ((window as any).__powerSDKClient) {
      return (window as any).__powerSDKClient;
    }
  } catch (e) {
    console.error('[PowerSDK] Error getting client:', e);
  }
  
  return null;
};

// Create service class for a specific table
export const createTableService = (dataSourceName: string) => {
  // Lazy getter for client - get it when needed, not at module load time
  const getClient = () => getPowerSDKClient();
  
  return {
    async getAll(options?: { top?: number; filter?: string; orderby?: string; skipToken?: string }): Promise<SDKResponse> {
      const client = getClient();
      if (!client) {
        console.warn(`[${dataSourceName}] Power SDK client not available`);
        return { success: false, error: 'Power SDK not available' };
      }
      
      try {
        const result = await client.retrieveMultipleRecordsAsync(dataSourceName, options);
        return result;
      } catch (e: any) {
        console.error(`[${dataSourceName}] getAll error:`, e);
        return { success: false, error: e.message };
      }
    },
    
    async get(id: number | string, options?: any): Promise<SDKResponse> {
      const client = getClient();
      if (!client) {
        return { success: false, error: 'Power SDK not available' };
      }
      
      try {
        const result = await client.retrieveRecordAsync(dataSourceName, id.toString(), options);
        return result;
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    
    async create(data: any): Promise<SDKResponse> {
      const client = getClient();
      if (!client) {
        return { success: false, error: 'Power SDK not available' };
      }
      
      try {
        const result = await client.createRecordAsync(dataSourceName, data);
        return result;
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    
    async update(id: number | string, data: any): Promise<SDKResponse> {
      const client = getClient();
      if (!client) {
        return { success: false, error: 'Power SDK not available' };
      }
      
      try {
        const result = await client.updateRecordAsync(dataSourceName, id.toString(), data);
        return result;
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    
    async delete(id: number | string): Promise<SDKResponse> {
      const client = getClient();
      if (!client) {
        return { success: false, error: 'Power SDK not available' };
      }
      
      try {
        const result = await client.deleteRecordAsync(dataSourceName, id.toString());
        return result;
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    
    async getReferencedEntity(search: string, fieldName: string): Promise<SDKResponse> {
      const client = getClient();
      if (!client) {
        return { success: false, error: 'Power SDK not available' };
      }
      
      try {
        const result = await client.executeAsync({
          connectorOperation: {
            tableName: dataSourceName,
            operationName: 'Get' + fieldName,
            parameters: { search },
          },
        });
        return result;
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  };
};

// Create service instances for each SharePoint list
export const BC_Teams_MembersService = createTableService('bc_teams_members');
export const SBC_Drills_LogService = createTableService('sbc_drills_log');
export const SBC_Incidents_LogService = createTableService('sbc_incidents_log');
export const SchoolInfoService = createTableService('schoolinfo');
export const School_Training_LogService = createTableService('school_training_log');
export const Coordination_Programs_CatalogService = createTableService('coordination_programs_catalog');

// Get SharePoint list link for item
export const getSharePointItemLink = (listName: string, itemId: number): string => {
  return `${SHAREPOINT_SITE_URL}/Lists/${listName}/DispForm.aspx?ID=${itemId}`;
};

// Initialize SDK
export const initializePowerSDK = async (): Promise<void> => {
  console.log('[PowerSDK] Initializing...');
  console.log('[PowerSDK] Environment:', isPowerAppsEnvironment() ? 'Power Apps' : 'Local Development');
  
  // Signal ready to Power Platform host
  if ((window as any).PowerPlatform?.ready) {
    (window as any).PowerPlatform.ready();
    console.log('[PowerSDK] PowerPlatform.ready() called');
  }
  
  // Post ready message to parent frame
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'ready' }, '*');
    window.parent.postMessage({ type: 'AppReady' }, '*');
    console.log('[PowerSDK] Ready messages posted');
  }
};

export default {
  isPowerAppsEnvironment,
  initializePowerSDK,
  BC_Teams_MembersService,
  SBC_Drills_LogService,
  SBC_Incidents_LogService,
  SchoolInfoService,
  School_Training_LogService,
  Coordination_Programs_CatalogService,
  getSharePointItemLink,
};
