# 📋 SharePoint Setup Instructions - BC_Announcements

## ⚠️ Important Note

The SharePoint list **BC_Announcements** does not exist yet. You need to create it first before running `pac code add-data-source`.

---

## 🚀 Step 1: Create the SharePoint List

### Option A: Manual Creation (Easiest)

1. Go to: https://saudimoe.sharepoint.com/sites/em
2. Click **Settings** ⚙️ → **Site contents**
3. Click **+ New** → **List**
4. Name: **BC_Announcements**
5. Description: "قائمة الإشعارات والتنبيهات للمدارس"
6. Click **Create**

### Option B: Using PnP PowerShell (Automated)

```powershell
# Install PnP PowerShell if not installed
Install-Module -Name PnP.PowerShell -Force -AllowClobber

# Connect to SharePoint
Connect-PnPOnline -Url "https://saudimoe.sharepoint.com/sites/em" -Interactive

# Create the list
New-PnPList -Title "BC_Announcements" -Template GenericList

Write-Host "✅ List BC_Announcements created successfully!" -ForegroundColor Green
```

---

## 📊 Step 2: Add Columns to the List

After creating the list, add these columns:

| # | Column Name | Type | Required | Default | Choices |
|---|-------------|------|----------|---------|---------|
| 1 | **Title** | Single line of text | ✅ Yes | - | - |
| 2 | **Message** | Multiple lines of text (Plain text) | ✅ Yes | - | - |
| 3 | **Priority** | Choice | ✅ Yes | normal | normal, urgent, critical |
| 4 | **TargetAudience** | Choice | ✅ Yes | all | all, specific |
| 5 | **TargetSchools** | Multiple lines of text (Plain text) | No | - | - |
| 6 | **PublishDate** | Date and Time | ✅ Yes | Today | - |
| 7 | **ExpiryDate** | Date and Time | No | - | - |
| 8 | **IsActive** | Yes/No | ✅ Yes | Yes | - |
| 9 | **CreatedBy** | Single line of text | No | - | - |
| 10 | **AttachmentUrl** | Hyperlink | No | - | - |

### Manual Column Creation:

1. Open the BC_Announcements list
2. Click **+ Add column**
3. For each column above:
   - Select the type
   - Enter the name
   - Set required/optional
   - Set default value
   - Add choices (for Choice columns)

### Automated Column Creation (PowerShell):

```powershell
Connect-PnPOnline -Url "https://saudimoe.sharepoint.com/sites/em" -Interactive

# Message
Add-PnPField -List "BC_Announcements" -DisplayName "Message" -InternalName "Message" -Type Note -Required

# Priority
Add-PnPFieldFromXml -List "BC_Announcements" -FieldXml '<Field Type="Choice" DisplayName="Priority" Required="TRUE" Format="Dropdown" FillInChoice="FALSE"><Default>normal</Default><CHOICES><CHOICE>normal</CHOICE><CHOICE>urgent</CHOICE><CHOICE>critical</CHOICE></CHOICES></Field>'

# TargetAudience  
Add-PnPFieldFromXml -List "BC_Announcements" -FieldXml '<Field Type="Choice" DisplayName="TargetAudience" Required="TRUE" Format="Dropdown" FillInChoice="FALSE"><Default>all</Default><CHOICES><CHOICE>all</CHOICE><CHOICE>specific</CHOICE></CHOICES></Field>'

# TargetSchools
Add-PnPField -List "BC_Announcements" -DisplayName "TargetSchools" -InternalName "TargetSchools" -Type Note -Required:$false

# PublishDate
Add-PnPField -List "BC_Announcements" -DisplayName "PublishDate" -InternalName "PublishDate" -Type DateTime -Required

# ExpiryDate
Add-PnPField -List "BC_Announcements" -DisplayName "ExpiryDate" -InternalName "ExpiryDate" -Type DateTime -Required:$false

# IsActive
Add-PnPField -List "BC_Announcements" -DisplayName "IsActive" -InternalName "IsActive" -Type Boolean -Required
Set-PnPDefaultColumnValues -List "BC_Announcements" -Field "IsActive" -Value "Yes"

# CreatedBy
Add-PnPField -List "BC_Announcements" -DisplayName "CreatedBy" -InternalName "CreatedBy" -Type Text -Required:$false

# AttachmentUrl
Add-PnPField -List "BC_Announcements" -DisplayName "AttachmentUrl" -InternalName "AttachmentUrl" -Type URL -Required:$false

Write-Host "✅ All columns added successfully!" -ForegroundColor Green
```

---

## 🔌 Step 3: Add Data Source to Power Apps SDK

After creating the list and columns, run:

```powershell
cd "C:\Users\Shafi\Desktop\App"

# Get connection ID (should be: shared-sharepointonl-39e1847b-a9a5-4c10-93f5-b982c323940d)
pac connection list

# Add data source
pac code add-data-source `
    -a "shared_sharepointonline" `
    -c "shared-sharepointonl-39e1847b-a9a5-4c10-93f5-b982c323940d" `
    -t "BC_Announcements" `
    -d "saudimoe.sharepoint.com,/sites/em"
```

Expected output:
```
Connected as smutiry9983@moe.gov.sa
✅ Data source added successfully
Generating models and services...
✅ Generated: src/generated/models/BC_AnnouncementsModel.ts
✅ Generated: src/generated/services/BC_AnnouncementsService.ts
✅ Updated: src/generated/index.ts
```

---

## 🔧 Step 4: Update announcementService.ts

After successfully adding the data source, the code is already prepared. You just need to **uncomment** the lines:

### File: `src/services/announcementService.ts`

**Line 7 - Uncomment the import:**
```typescript
// TODO: Uncomment after creating BC_Announcements list and running pac code add-data-source
import { BC_AnnouncementsService } from '../generated';
```

**Lines 81-104 - Uncomment the getAnnouncements implementation:**
```typescript
// TODO: Uncomment after creating BC_Announcements list
const result = await BC_AnnouncementsService.getAll();
if (result.success && result.data) {
  let announcements = result.data.map(transformFromSharePoint);
  
  // Filter by school
  if (schoolName) {
    const now = new Date();
    announcements = announcements.filter(a => {
      // Check if active
      if (!a.isActive) return false;
      
      // Check expiry
      if (a.expiryDate && new Date(a.expiryDate) < now) return false;
      
      // Check target audience
      if (a.targetAudience === 'all') return true;
      if (a.targetAudience === 'specific' && a.targetSchools?.includes(schoolName)) return true;
      
      return false;
    });
  }
  
  return announcements;
}
```

**Lines 130-137 - Uncomment createAnnouncement:**
```typescript
// TODO: Uncomment after creating BC_Announcements list
const spItem = transformToSharePoint(announcement as Announcement);
const result = await BC_AnnouncementsService.create(spItem);
if (result.success && result.data) {
  return transformFromSharePoint(result.data);
}
throw new Error('Failed to create announcement');
```

**Lines 152-160 - Uncomment updateAnnouncement:**
```typescript
// TODO: Uncomment after creating BC_Announcements list
const spItem = transformToSharePoint(updates);
const result = await BC_AnnouncementsService.update(id, spItem);
if (result.success && result.data) {
  return transformFromSharePoint(result.data);
}
throw new Error('Failed to update announcement');
```

**Lines 182-184 - Uncomment deleteAnnouncement:**
```typescript
// TODO: Uncomment after creating BC_Announcements list
await BC_AnnouncementsService.delete(id);
return;
```

---

## ✅ Step 5: Test the Integration

1. **Build the app:**
   ```powershell
   npm run build
   ```

2. **Push to Power Apps:**
   ```powershell
   pac code push
   ```

3. **Test in the app:**
   - Login as **Admin**
   - Go to **لوحة تحكم الإدارة** (Admin Panel)
   - Open tab **"🔔 الإشعارات والتنبيهات"**
   - Click **"إشعار جديد"**
   - Fill the form and save
   - Logout and login as a **School**
   - Check the bell icon 🔔 in the header
   - You should see the notification!

---

## 📱 Mobile Number Formatting

All mobile numbers are now automatically formatted to start with **9665** when saved.

### What was updated:

1. **Added `formatSaudiPhone()` function** in `src/utils/security.ts`
   - Converts any format (05XXXXXXXX, 5XXXXXXXX, +9665XXXXXXXX) to **9665XXXXXXXX**

2. **Updated AdminPanel.tsx** to use the formatter when saving contacts:
   ```typescript
   phone: form.phone && isValidSaudiPhone(form.phone) ? formatSaudiPhone(form.phone) : form.phone
   ```

3. **Phone number display:**
   - In tables: Shows as-is (9665XXXXXXXX)
   - When clicked in BCQuickReference: Opens phone dialer with the full number

---

## 📊 Summary of Changes

| File | Change | Status |
|------|--------|--------|
| `src/utils/security.ts` | Added `formatSaudiPhone()` function | ✅ Done |
| `src/components/AdminPanel.tsx` | Import and use `formatSaudiPhone` | ✅ Done |
| `src/services/announcementService.ts` | Prepared with TODO comments for SharePoint | ✅ Done |
| **SharePoint List** | **BC_Announcements** | ⏳ **Needs creation** |
| **Power Apps SDK** | **Add data source** | ⏳ **Pending list creation** |

---

## 🚨 Current Status

### ✅ Ready:
- Phone formatting utility
- AnnouncementService with SharePoint integration code (commented)
- Admin panel with notifications management UI
- NotificationBell component for schools
- All imports and types ready

### ⏳ Waiting for:
1. Create SharePoint list BC_Announcements
2. Add columns to the list
3. Run `pac code add-data-source`
4. Uncomment the SharePoint integration code
5. Build and push

---

## 🆘 Troubleshooting

### Error: "HTTP error status: 400" or "404" when adding data source

**Problem:** The list doesn't exist yet.

**Solution:** Create the list first using Option A or B above.

---

### Error: Generated service missing methods

**Problem:** Column names don't match exactly.

**Solution:** Make sure column internal names match:
- Title (default)
- Message
- Priority
- TargetAudience
- TargetSchools
- PublishDate
- ExpiryDate
- IsActive
- CreatedBy
- AttachmentUrl

---

### Phone numbers showing as scientific notation (9.66567E+11)

**Problem:** Excel export saved numbers in scientific notation.

**Solution:** The `formatSaudiPhone()` function handles this automatically. When users enter new numbers, they'll be formatted correctly.

---

## 📞 Next Steps

1. **Create the SharePoint list** (Step 1 & 2)
2. **Run `pac code add-data-source`** (Step 3)
3. **Uncomment the code** (Step 4)
4. **Build and test** (Step 5)

Once completed, the notification system will be fully functional! 🎉
