# How to Export App via Solution

## Step 1: Create a Solution (If you don't have one)

1. Go to [Power Apps](https://make.powerapps.com/)
2. Select your environment (the one with environmentId: `0aa4969d-c8e7-e0a7-9bf8-6925c5922de3`)
3. Click **Solutions** in the left navigation
4. Click **+ New solution**
5. Fill in the details:
   - **Display name:** BC School App Solution (or any name)
   - **Name:** BCSchoolAppSolution
   - **Publisher:** Select existing or create new
   - **Version:** 1.0.0.0
6. Click **Create**

## Step 2: Add Your App to the Solution

### Option A: Via Power Apps Portal

1. Open your solution (created above)
2. Click **+ Add existing**
3. Select **App** → **Code component (preview)** or **Canvas app**
4. Find your app by name (search for "Asset Tracker" or your app name)
5. Select it and click **Add**

### Option B: Via pac CLI (Faster)

```powershell
# List your apps to find the app ID
pac canvas list

# Add app to solution
pac solution add-reference --path "YOUR_APP_NAME"
```

## Step 3: Export the Solution

### Via Power Apps Portal:

1. Go to **Solutions**
2. Select your solution
3. Click **Export**
4. Choose export type:
   - **Unmanaged** (for development/editing)
   - **Managed** (for production/deployment)
5. Click **Next**
6. Wait for export to prepare
7. Click **Download** when ready

### Via pac CLI:

```powershell
# Export as unmanaged
pac solution export --path "C:\exports\BCSchoolApp_unmanaged.zip" --name "BCSchoolAppSolution" --managed false

# Export as managed
pac solution export --path "C:\exports\BCSchoolApp_managed.zip" --name "BCSchoolAppSolution" --managed true
```

## Step 4: Import to Another Environment

1. Go to target environment in Power Apps
2. Click **Solutions**
3. Click **Import**
4. Click **Browse** and select your .zip file
5. Click **Next**
6. Review connections (may need to create/update)
7. Click **Import**
8. Wait for import to complete

---

## Alternative: Export Code Component Package

If you want to export just the code app package (not as a solution):

```powershell
# Build the package
npm run build

# The package is created in:
# YourAppName/CanvasApps/cr6eb_schoolbccodeapp_56e8a_CodeAppPackages/

# This creates a .msapp file that can be imported directly
```

---

## Important Notes

### Connections to Include:
Your app uses these connections (include them in solution):
- **SharePoint Online** (shared-sharepointonl-39e1847b-a9a5-4c10-93f5-b982c323940d)
- **Office 365 Users** (if used)

### SharePoint Lists Required:
When importing to new environment, ensure these lists exist:
- SchoolInfo
- BC_Teams_Members
- BC_Drills_Log
- BC_Incidents_Log
- School_Training_Log
- BC_Admin_Contacts
- BC_Scenarios
- BC_Damage_Reports
- BC_DR_Checklist
- BC_Announcements (if created)
- All other lists in your .power/schemas folder

### Environment Variables:
If using environment-specific URLs or IDs, create environment variables in your solution.

---

## Troubleshooting

### "App not found" when adding to solution
- Make sure you've run `pac code push` at least once
- The app must be published to the environment first

### "Missing dependencies" during export
- Add all connections used by the app to the solution
- Add all SharePoint lists if you want them included

### "Connection not found" during import
- Create connections in target environment first
- Or update connection references during import

---

## Quick Command Reference

```powershell
# Authenticate
pac auth create --environment 0aa4969d-c8e7-e0a7-9bf8-6925c5922de3

# List solutions
pac solution list

# Create new solution
pac solution init --publisher-name "MOE" --publisher-prefix "moe"

# Add app to solution
pac solution add-reference --path "."

# Export solution
pac solution export --name "YourSolutionName" --path "export.zip" --managed false

# Clone solution (for source control)
pac solution clone --name "YourSolutionName" --outputDirectory "C:\solutions"
```

---

## Best Practices

1. **Always use Solutions** for:
   - Production deployments
   - Moving between environments
   - Version control
   - ALM processes

2. **Version your solutions:**
   - Increment version number for each release
   - Use semantic versioning (1.0.0 → 1.1.0 → 2.0.0)

3. **Export both Managed and Unmanaged:**
   - Unmanaged: For development/backup
   - Managed: For production deployment

4. **Document dependencies:**
   - List all connections needed
   - List all SharePoint lists/tables
   - Note any environment-specific configuration

---

**Created:** December 19, 2025  
**Environment ID:** 0aa4969d-c8e7-e0a7-9bf8-6925c5922de3
