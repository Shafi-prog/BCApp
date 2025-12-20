// Notification/Announcement Service for Admin-to-Schools communication
// SharePoint List: BC_Announcements_Schema
// NO localStorage - SharePoint ONLY for security compliance

import { BC_Announcements_SchemaService } from '../generated/services/BC_Announcements_SchemaService';
import type { BC_Announcements_Schema } from '../generated/models/BC_Announcements_SchemaModel';

export interface Announcement {
  id: number;
  Title: string;
  message: string;
  priority: 'normal' | 'urgent' | 'critical';
  targetAudience: 'all' | 'specific';
  targetSchoolIds?: number[]; // School IDs from multi-select lookup
  targetSchoolNames?: string[]; // School names for display
  publishDate: string;
  expiryDate?: string;
  isActive: boolean;
  createdBy: string;
  attachmentUrl?: string;
}

// Extract value from choice field (can be array or single value)
function extractChoiceValue(field: any): string {
  if (!field) return '';
  if (Array.isArray(field)) {
    return field[0]?.Value || '';
  }
  if (typeof field === 'object' && field?.Value) {
    return field.Value;
  }
  return String(field);
}

// Extract multiple values from choice field array
function extractChoiceValues(field: any): string[] {
  if (!field) return [];
  if (Array.isArray(field)) {
    return field.map(f => f?.Value || '').filter(Boolean);
  }
  if (typeof field === 'object' && field?.Value) {
    return [field.Value];
  }
  return [];
}

// Transform SharePoint item to Announcement
function transformFromSharePoint(item: BC_Announcements_Schema): Announcement {
  // Extract createdBy from user field (can be array or object)
  let createdBy = '';
  if (item.field_8) {
    if (Array.isArray(item.field_8)) {
      createdBy = (item.field_8 as any)[0]?.DisplayName || '';
    } else if (typeof item.field_8 === 'object') {
      createdBy = (item.field_8 as any).DisplayName || '';
    }
  }
  
  // Extract target schools from multi-select lookup field (array)
  const targetSchoolIds: number[] = [];
  const targetSchoolNames: string[] = [];
  
  if (Array.isArray(item.TargetSchools)) {
    item.TargetSchools.forEach((school: any) => {
      if (school.Id) targetSchoolIds.push(school.Id);
      if (school.Value) targetSchoolNames.push(school.Value);
    });
  } else if (item.TargetSchools?.Id) {
    // Fallback for single value (backwards compatibility)
    targetSchoolIds.push(item.TargetSchools.Id);
    if (item.TargetSchools.Value) targetSchoolNames.push(item.TargetSchools.Value);
  }
  
  return {
    id: item.ID || 0,
    Title: item.Title || '',
    message: item.field_1 || '', // Message
    priority: (extractChoiceValue(item.field_2) as any) || 'normal', // Priority
    targetAudience: (extractChoiceValue(item.field_3) as any) || 'all', // TargetAudience
    targetSchoolIds: targetSchoolIds, // TargetSchools multi-select lookup IDs
    targetSchoolNames: targetSchoolNames, // TargetSchools multi-select lookup display values
    publishDate: item.field_5 || new Date().toISOString(), // PublishDate
    expiryDate: item.field_6, // ExpiryDate
    isActive: item.field_7 ?? true, // IsActive
    createdBy: createdBy, // CreatedBy
    attachmentUrl: item.field_9 // AttachmentUrl
  };
}

// Transform Announcement to SharePoint item
function transformToSharePoint(announcement: Partial<Announcement>): Partial<Omit<BC_Announcements_Schema, 'ID'>> {
  const data: any = {};
  
  if (announcement.Title !== undefined) data.Title = announcement.Title;
  if (announcement.message !== undefined) data.field_1 = announcement.message;
  
  if (announcement.priority !== undefined) {
    data['field_2@odata.type'] = '#Collection(Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference)';
    data.field_2 = [{
      '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
      Value: announcement.priority
    }];
  }
  
  if (announcement.targetAudience !== undefined) {
    data['field_3@odata.type'] = '#Collection(Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference)';
    data.field_3 = [{
      '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
      Value: announcement.targetAudience
    }];
  }
  
  // TargetSchools is a multi-select lookup field to SchoolInfo list
  if (announcement.targetSchoolIds !== undefined && announcement.targetSchoolIds.length > 0) {
    data['TargetSchools@odata.type'] = '#Collection(Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference)';
    data.TargetSchools = announcement.targetSchoolIds.map(id => ({
      '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
      Id: id
    }));
  }
  
  if (announcement.publishDate !== undefined) data.field_5 = announcement.publishDate;
  if (announcement.expiryDate !== undefined) data.field_6 = announcement.expiryDate;
  if (announcement.isActive !== undefined) data.field_7 = announcement.isActive;
  if (announcement.attachmentUrl !== undefined) data.field_9 = announcement.attachmentUrl;
  
  return data;
}

export const AnnouncementService = {
  // Get announcements for a specific school (or all if admin)
  // SharePoint ONLY - no localStorage fallback for security compliance
  async getAnnouncements(schoolName?: string): Promise<Announcement[]> {
    try {
      console.log('[AnnouncementService] Loading announcements from SharePoint...');
      const result = await BC_Announcements_SchemaService.getAll();
      if (result.success && result.data) {
        let announcements = result.data.map(transformFromSharePoint);
        
        // Filter for school
        if (schoolName) {
          const now = new Date();
          announcements = announcements.filter(a => {
            if (!a.isActive) return false;
            if (a.expiryDate && new Date(a.expiryDate) < now) return false;
            if (a.targetAudience === 'all') return true;
            // For specific targeting, check if this school is in the multi-select list
            if (a.targetAudience === 'specific' && a.targetSchoolNames?.includes(schoolName)) return true;
            return false;
          });
        }
        
        console.log(`[AnnouncementService] Loaded ${announcements.length} announcements`);
        return announcements;
      }
      console.warn('[AnnouncementService] No announcements found or error:', result.error);
      return [];
    } catch (e) {
      console.error('[AnnouncementService] Error loading announcements:', e);
      return [];
    }
  },

  // Create new announcement (Admin only)
  // SharePoint ONLY - no localStorage fallback for security compliance
  async createAnnouncement(announcement: Omit<Announcement, 'id'>): Promise<Announcement> {
    try {
      console.log('[AnnouncementService] Creating announcement in SharePoint...');
      const spItem = transformToSharePoint(announcement as Announcement);
      const result = await BC_Announcements_SchemaService.create(spItem as any);
      if (result.success && result.data) {
        console.log('[AnnouncementService] Announcement created:', result.data.ID);
        return transformFromSharePoint(result.data);
      }
      throw new Error(String(result.error) || 'Failed to create announcement');
    } catch (e) {
      console.error('[AnnouncementService] Error creating announcement:', e);
      throw e;
    }
  },

  // Update announcement (Admin only)
  // SharePoint ONLY - no localStorage fallback for security compliance
  async updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | null> {
    try {
      console.log('[AnnouncementService] Updating announcement in SharePoint:', id);
      const spItem = transformToSharePoint(updates);
      const result = await BC_Announcements_SchemaService.update(id.toString(), spItem as any);
      if (result.success && result.data) {
        console.log('[AnnouncementService] Announcement updated');
        return transformFromSharePoint(result.data);
      }
      throw new Error(String(result.error) || 'Failed to update announcement');
    } catch (e) {
      console.error('[AnnouncementService] Error updating announcement:', e);
      throw e;
    }
  },

  // Delete announcement (Admin only)
  // SharePoint ONLY - no localStorage fallback for security compliance
  async deleteAnnouncement(id: number): Promise<void> {
    try {
      console.log('[AnnouncementService] Deleting announcement from SharePoint:', id);
      await BC_Announcements_SchemaService.delete(id.toString());
      console.log('[AnnouncementService] Announcement deleted');
    } catch (e) {
      console.error('[AnnouncementService] Error deleting announcement:', e);
      throw e;
    }
  },

  // Mark announcement as read (using localStorage for read tracking - non-sensitive data)
  async markAsRead(announcementId: number, schoolName: string): Promise<void> {
    const key = `read_announcements_${schoolName}`;
    try {
      const readIds = JSON.parse(localStorage.getItem(key) || '[]');
      if (!readIds.includes(announcementId)) {
        readIds.push(announcementId);
        localStorage.setItem(key, JSON.stringify(readIds));
      }
      console.log(`[AnnouncementService] Marked announcement ${announcementId} as read by ${schoolName}`);
    } catch (e) {
      console.error('[AnnouncementService] Error marking as read:', e);
    }
  },

  // Get unread count for a school
  async getUnreadCount(schoolName: string): Promise<number> {
    const announcements = await this.getAnnouncements(schoolName);
    const key = `read_announcements_${schoolName}`;
    try {
      const readIds = JSON.parse(localStorage.getItem(key) || '[]');
      // Count announcements that are active and NOT in the read list
      const unreadAnnouncements = announcements.filter(a => 
        a.isActive && !readIds.includes(a.id)
      );
      console.log(`[AnnouncementService] Unread count for ${schoolName}: ${unreadAnnouncements.length}`);
      return unreadAnnouncements.length;
    } catch (e) {
      console.error('[AnnouncementService] Error getting unread count:', e);
      return 0;
    }
  }
};

// Helper function to filter announcements for a specific school
function filterAnnouncementsForSchool(announcements: Announcement[], schoolName?: string): Announcement[] {
  if (!schoolName) return announcements; // Admin sees all
  
  const now = new Date();
  return announcements.filter(a => {
    // Check if active
    if (!a.isActive) return false;
    
    // Check if expired
    if (a.expiryDate && new Date(a.expiryDate) < now) return false;
    
    // Check target audience
    if (a.targetAudience === 'all') return true;
    if (a.targetAudience === 'specific' && a.targetSchoolNames?.includes(schoolName)) return true;
    
    return false;
  });
}
