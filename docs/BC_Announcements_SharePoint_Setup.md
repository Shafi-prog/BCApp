# 📋 SharePoint List Setup Guide: BC_Announcements

## Option 1: Create Manually in SharePoint UI

### Step 1: Create the List
1. Go to your SharePoint site: `https://saudimoe.sharepoint.com/sites/em`
2. Click **Site contents** → **+ New** → **List**
3. Choose **Blank list**
4. Name: `BC_Announcements`
5. Click **Create**

### Step 2: Add Custom Columns

#### Column 1: Message (Already exists as body/description)
- OR Add new column:
  - **Column name:** Message
  - **Type:** Multiple lines of text
  - **Plain text:** Yes
  - **Required:** Yes

#### Column 2: Priority
- **Column name:** Priority
- **Type:** Choice
- **Choices:**
  ```
  normal
  urgent
  critical
  ```
- **Default:** normal
- **Required:** Yes

#### Column 3: TargetAudience
- **Column name:** TargetAudience
- **Type:** Choice
- **Choices:**
  ```
  all
  specific
  ```
- **Required:** Yes

#### Column 4: TargetSchools
- **Column name:** TargetSchools
- **Type:** Multiple lines of text
- **Plain text:** Yes
- **Required:** No

#### Column 5: PublishDate
- **Column name:** PublishDate
- **Type:** Date and Time
- **Include time:** Yes
- **Required:** Yes

#### Column 6: ExpiryDate
- **Column name:** ExpiryDate
- **Type:** Date and Time
- **Include time:** Yes
- **Required:** No

#### Column 7: IsActive
- **Column name:** IsActive
- **Type:** Yes/No
- **Default:** Yes
- **Required:** Yes

#### Column 8: CreatedBy
- **Column name:** CreatedBy
- **Type:** Single line of text
- **Required:** No

#### Column 9: AttachmentUrl
- **Column name:** AttachmentUrl
- **Type:** Hyperlink
- **Required:** No

---

## Option 2: Create Using PnP PowerShell

### Prerequisites
```powershell
# Install PnP PowerShell if not installed
Install-Module -Name PnP.PowerShell -Scope CurrentUser
```

### PowerShell Script

```powershell
# Connect to SharePoint
$siteUrl = "https://saudimoe.sharepoint.com/sites/em"
Connect-PnPOnline -Url $siteUrl -Interactive

# Create the list
$listTitle = "BC_Announcements"
$list = New-PnPList -Title $listTitle -Template GenericList -OnQuickLaunch

Write-Host "✅ List created: $listTitle" -ForegroundColor Green

# Add Message column (Multiple lines of text)
Add-PnPField -List $listTitle -DisplayName "Message" -InternalName "Message" -Type Note -AddToDefaultView -Required

# Add Priority column (Choice)
Add-PnPField -List $listTitle -DisplayName "Priority" -InternalName "Priority" -Type Choice -Choices "normal","urgent","critical" -DefaultValue "normal" -AddToDefaultView -Required

# Add TargetAudience column (Choice)
Add-PnPField -List $listTitle -DisplayName "TargetAudience" -InternalName "TargetAudience" -Type Choice -Choices "all","specific" -AddToDefaultView -Required

# Add TargetSchools column (Multiple lines of text)
Add-PnPField -List $listTitle -DisplayName "TargetSchools" -InternalName "TargetSchools" -Type Note -AddToDefaultView

# Add PublishDate column (DateTime)
Add-PnPField -List $listTitle -DisplayName "PublishDate" -InternalName "PublishDate" -Type DateTime -AddToDefaultView -Required

# Add ExpiryDate column (DateTime)
Add-PnPField -List $listTitle -DisplayName "ExpiryDate" -InternalName "ExpiryDate" -Type DateTime -AddToDefaultView

# Add IsActive column (Yes/No)
Add-PnPField -List $listTitle -DisplayName "IsActive" -InternalName "IsActive" -Type Boolean -AddToDefaultView

# Add CreatedBy column (Text)
Add-PnPField -List $listTitle -DisplayName "CreatedBy" -InternalName "CreatedBy" -Type Text -AddToDefaultView

# Add AttachmentUrl column (Hyperlink)
Add-PnPField -List $listTitle -DisplayName "AttachmentUrl" -InternalName "AttachmentUrl" -Type URL -AddToDefaultView

Write-Host "✅ All columns added successfully!" -ForegroundColor Green

# Optional: Add sample data
$item1 = Add-PnPListItem -List $listTitle -Values @{
    "Title" = "تحديث مهم في خطة الطوارئ"
    "Message" = "يرجى مراجعة التحديثات الجديدة في خطة استمرارية الأعمال والتأكد من تطبيقها"
    "Priority" = "normal"
    "TargetAudience" = "all"
    "TargetSchools" = "[]"
    "PublishDate" = (Get-Date)
    "IsActive" = $true
    "CreatedBy" = "Admin"
}

$item2 = Add-PnPListItem -List $listTitle -Values @{
    "Title" = "تدريب إخلاء يوم الأربعاء"
    "Message" = "سيتم إجراء تدريب إخلاء الساعة 10 صباحاً. يرجى التحضير"
    "Priority" = "urgent"
    "TargetAudience" = "specific"
    "TargetSchools" = '["مدرسة ابن خلدون الابتدائية","مدرسة الفارابي الثانوية"]'
    "PublishDate" = (Get-Date).AddDays(1)
    "IsActive" = $true
    "CreatedBy" = "Admin"
}

Write-Host "✅ Sample data added!" -ForegroundColor Green

# Disconnect
Disconnect-PnPOnline
```

**Save as:** `Create-BC-Announcements-List.ps1`

**Run:**
```powershell
.\Create-BC-Announcements-List.ps1
```

---

## Option 3: Create Using SharePoint REST API

### PowerShell Script (REST API)

```powershell
# Configuration
$siteUrl = "https://saudimoe.sharepoint.com/sites/em"
$listTitle = "BC_Announcements"

# Get credentials
$cred = Get-Credential

# Create list
$listCreationInfo = @{
    "__metadata" = @{ "type" = "SP.List" }
    "BaseTemplate" = 100
    "Title" = $listTitle
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$siteUrl/_api/web/lists" `
    -Method Post `
    -Credential $cred `
    -ContentType "application/json;odata=verbose" `
    -Headers @{"Accept"="application/json;odata=verbose"} `
    -Body $listCreationInfo

Write-Host "✅ List created: $listTitle"

# Add columns (fields) - Similar REST API calls for each field
# ... (complex, use PnP method instead)
```

---

## After Creating the List: Add to Power Apps SDK

### Step 1: Get Connection ID

```powershell
# List all connections
pac connection list
```

Find your SharePoint connection ID (looks like: `aa35d97110f747a49205461cbfcf8558`)

### Step 2: Add Data Source

```powershell
# Navigate to your app folder
cd "c:\Users\Shafi\Desktop\App"

# Add the BC_Announcements list as a data source
pac code add-data-source `
    -a "shared_sharepointonline" `
    -c "<YOUR_CONNECTION_ID>" `
    -t "BC_Announcements" `
    -d "saudimoe.sharepoint.com,/sites/em"
```

**Example:**
```powershell
pac code add-data-source `
    -a "shared_sharepointonline" `
    -c "aa35d97110f747a49205461cbfcf8558" `
    -t "BC_Announcements" `
    -d "saudimoe.sharepoint.com,/sites/em"
```

### Step 3: Verify Generated Service

After running the command, check:
```
src/
  Models/
    BC_Announcements.ts       ✅ Generated model
  Services/
    BC_AnnouncementsService.ts   ✅ Generated service
```

### Step 4: Update announcementService.ts

Open: `src/services/announcementService.ts`

Replace the mock implementation with:

```typescript
import { BC_AnnouncementsService } from '../Services/BC_AnnouncementsService'
import { BC_Announcements } from '../Models/BC_Announcements'

export interface Announcement {
  id: number
  Title: string
  message: string
  priority: 'normal' | 'urgent' | 'critical'
  targetAudience: 'all' | 'specific'
  targetSchools?: string[]
  publishDate: string
  expiryDate?: string
  isActive: boolean
  createdBy?: string
  attachmentUrl?: string
}

class AnnouncementServiceClass {
  async getAnnouncements(schoolName?: string): Promise<Announcement[]> {
    try {
      const items = await BC_AnnouncementsService.getAll()
      
      let filtered = items.filter(item => 
        item.IsActive && 
        new Date(item.PublishDate) <= new Date() &&
        (!item.ExpiryDate || new Date(item.ExpiryDate) >= new Date())
      )

      if (schoolName) {
        filtered = filtered.filter(item =>
          item.TargetAudience === 'all' ||
          (item.TargetSchools && JSON.parse(item.TargetSchools).includes(schoolName))
        )
      }

      return filtered.map(item => ({
        id: item.Id,
        Title: item.Title,
        message: item.Message,
        priority: item.Priority as any,
        targetAudience: item.TargetAudience as any,
        targetSchools: item.TargetSchools ? JSON.parse(item.TargetSchools) : [],
        publishDate: item.PublishDate,
        expiryDate: item.ExpiryDate,
        isActive: item.IsActive,
        createdBy: item.CreatedBy,
        attachmentUrl: item.AttachmentUrl?.Url
      }))
    } catch (error) {
      console.error('Error fetching announcements:', error)
      return []
    }
  }

  async createAnnouncement(announcement: Omit<Announcement, 'id'>): Promise<void> {
    await BC_AnnouncementsService.create({
      Title: announcement.Title,
      Message: announcement.message,
      Priority: announcement.priority,
      TargetAudience: announcement.targetAudience,
      TargetSchools: JSON.stringify(announcement.targetSchools || []),
      PublishDate: announcement.publishDate,
      ExpiryDate: announcement.expiryDate,
      IsActive: announcement.isActive,
      CreatedBy: announcement.createdBy || 'Admin',
      AttachmentUrl: announcement.attachmentUrl ? { Url: announcement.attachmentUrl } : undefined
    })
  }

  async updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<void> {
    const updateData: any = {}
    if (updates.Title) updateData.Title = updates.Title
    if (updates.message) updateData.Message = updates.message
    if (updates.priority) updateData.Priority = updates.priority
    if (updates.targetAudience) updateData.TargetAudience = updates.targetAudience
    if (updates.targetSchools) updateData.TargetSchools = JSON.stringify(updates.targetSchools)
    if (updates.publishDate) updateData.PublishDate = updates.publishDate
    if (updates.expiryDate !== undefined) updateData.ExpiryDate = updates.expiryDate
    if (updates.isActive !== undefined) updateData.IsActive = updates.isActive
    if (updates.attachmentUrl) updateData.AttachmentUrl = { Url: updates.attachmentUrl }
    
    await BC_AnnouncementsService.update(id, updateData)
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await BC_AnnouncementsService.delete(id)
  }

  // ... rest of the methods remain the same
}

export const AnnouncementService = new AnnouncementServiceClass()
```

---

## ✅ Quick Start Checklist

- [ ] Create BC_Announcements list in SharePoint (Option 1 or 2)
- [ ] Verify all 10 columns are created correctly
- [ ] Get SharePoint connection ID: `pac connection list`
- [ ] Run: `pac code add-data-source -a "shared_sharepointonline" -c "<connection-id>" -t "BC_Announcements" -d "saudimoe.sharepoint.com,/sites/em"`
- [ ] Verify generated files in `src/Models/` and `src/Services/`
- [ ] Update `src/services/announcementService.ts` with real implementation
- [ ] Test: Create announcement as Admin
- [ ] Test: View notification bell as School
- [ ] Build and push: `npm run build && pac code push`

---

## 📞 Support

If you encounter errors:
1. Check SharePoint permissions (you need site owner/admin)
2. Verify connection ID is correct
3. Check column names match exactly (case-sensitive)
4. Review generated service files for correct field mappings

**Good luck! 🚀**
