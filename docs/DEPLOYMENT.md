# School Business Continuity App - Deployment Guide
# تطبيق استمرارية الأعمال المدرسية - دليل النشر

## Overview | نظرة عامة

This application is a Power Apps Code Component for managing school business continuity operations for Saudi Ministry of Education (MOE) schools in المدينة المنورة.

هذا التطبيق هو مكون كود Power Apps لإدارة عمليات استمرارية الأعمال المدرسية لمدارس وزارة التعليم السعودية في المدينة المنورة.

---

## Project Structure | هيكل المشروع

```
App/
├── src/                          # React source code
│   ├── App.tsx                   # Main application entry
│   ├── main.tsx                  # React DOM rendering
│   ├── styles.css                # Global styles
│   ├── components/               # React components
│   │   ├── Home.tsx              # Dashboard page
│   │   ├── Navigation.tsx        # Navigation component
│   │   ├── Team.tsx              # BC Team management
│   │   ├── Drills.tsx            # Drills logging
│   │   ├── Incidents.tsx         # Incident management
│   │   └── Training.tsx          # Training programs
│   └── services/
│       └── sharepointService.ts  # SharePoint REST API service
├── pcf/                          # Power Platform component
│   ├── SchoolBCCodeApp/          # PCF component
│   │   ├── ControlManifest.Input.xml
│   │   ├── index.ts              # PCF entry point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── css/
│   │       └── SchoolBCCodeApp.css
│   └── Solution/                 # Dataverse solution
│       ├── Solution.cdsproj
│       └── src/Other/Solution.xml
├── dist/                         # Production build output
├── package.json
└── vite.config.ts
```

---

## Prerequisites | المتطلبات

### Development Environment
- Node.js v18+ 
- Visual Studio Code
- Power Platform CLI (`pac`)

### Installation
```powershell
# Install Power Platform CLI
dotnet tool install --global Microsoft.PowerApps.CLI.Tool

# Or using npm
npm install -g @pnp/cli-microsoft365
```

---

## SharePoint Lists Configuration | إعداد قوائم SharePoint

The app requires these SharePoint lists on your site:

| List Name | Arabic | Purpose |
|-----------|--------|---------|
| `SchoolInfo` | معلومات المدرسة | School details and contact info |
| `BC_Teams_Members` | أعضاء فريق BC | BC team membership |
| `SBC_Drills_Log` | سجل التمارين | Evacuation drill records |
| `SBC_Incidents_Log` | سجل الحوادث | Incident reports |
| `School_Training_Log` | سجل التدريب | Training registration log |
| `Coordination_Programs_Catalog` | كتالوج البرامج | Training programs catalog |

### Required Columns per List

#### SchoolInfo
- Title, SchoolName, SchoolID, Level, SchoolGender, SchoolType
- EducationType, StudyTime, BuildingOwnership, SectorDescription
- PrincipalName, PrincipalID, principalEmail, PrincipalPhone, SchoolEmail
- Latitude, Longitude

#### BC_Teams_Members
- Title (Member Name), JobRole, MembershipType, SchoolName_Ref
- MemberEmail, MemberMobile

#### SBC_Drills_Log
- Title, SchoolName_Ref, DrillHypothesis, SpecificEvent
- TargetGroup, ExecutionDate, AttachmentUrl

#### SBC_Incidents_Log
- Title, SchoolName_Ref, IncidentCategory, RiskLevel, AlertModelType
- HazardDescription, ActivatedAlternative, ActivationTime, ClosureTime
- CoordinatedEntities, ActionTaken, AltLocation, CommunicationDone
- Challenges, LessonsLearned, Suggestions, Status

#### Coordination_Programs_Catalog
- Title, ProviderEntity, ActivityType, TargetAudience
- Date, ExecutionMode, CoordinationStatus, Status

#### School_Training_Log
- Title, Program_Ref, Program_RefId, SchoolName_Ref
- RegistrationType, AttendeesNames, TrainingDate, Status

---

## Development | التطوير

### Local Development (Mock Data)
```powershell
# Install dependencies
npm install

# Run development server
npm run dev
```
The app runs with mock data at `http://localhost:5173`

### Building for Production
```powershell
npm run build
```
Output is in the `dist/` folder.

---

## PCF Deployment | نشر PCF

### Step 1: Install PCF Dependencies
```powershell
cd pcf/SchoolBCCodeApp
npm install
```

### Step 2: Build PCF Component
```powershell
npm run build
```

### Step 3: Create Solution Package
```powershell
cd ../Solution
msbuild /t:restore
msbuild
```
The solution package will be in `bin/Debug/`.

### Step 4: Import to Power Platform
1. Go to https://make.powerapps.com
2. Select your environment
3. Solutions → Import → Upload the `.zip` file
4. Follow the import wizard

### Alternative: Using pac CLI
```powershell
# Authenticate
pac auth create --url https://yourorg.crm.dynamics.com

# Push the component
pac pcf push --publisher-prefix sbc

# Create and push solution
pac solution init --publisher-name SchoolBC --publisher-prefix sbc
pac solution add-reference --path ../SchoolBCCodeApp
pac solution pack --zipfile SchoolBCSolution.zip
pac solution import --path SchoolBCSolution.zip
```

---

## Using the Component in Power Apps | استخدام المكون في Power Apps

### In Canvas App
1. Open your canvas app in edit mode
2. Insert → Get more components → Code → SchoolBCCodeApp
3. Configure properties:
   - `siteUrl`: Your SharePoint site URL
   - `schoolName`: Filter by school name (optional)

### In Model-Driven App
1. Open form editor
2. Add custom control
3. Select SchoolBCCodeApp
4. Bind to appropriate field

---

## Updating SharePoint Site URL | تحديث عنوان موقع SharePoint

Edit `src/services/sharepointService.ts`:

```typescript
const getSharePointSiteUrl = (): string => {
  const context = getPowerAppsContext();
  if (context?.parameters?.siteUrl?.raw) {
    return context.parameters.siteUrl.raw;
  }
  // Update this URL for your environment
  return "https://yourtenant.sharepoint.com/sites/SchoolBC";
};
```

---

## Testing SharePoint Connection | اختبار اتصال SharePoint

The service includes a test method:

```typescript
import SharePointService from './services/sharepointService';

// Test connection
const result = await SharePointService.testConnection();
console.log(result);
// { success: true, message: "Connected to SharePoint site: ...", details: {...} }

// List available lists
const lists = await SharePointService.getLists();
console.log(lists);
```

---

## Troubleshooting | استكشاف الأخطاء

### CORS Issues
When testing locally against SharePoint:
- Use the mock data mode (default for localhost)
- Or configure a proxy in `vite.config.ts`

### Authentication Errors
- Ensure user has access to SharePoint site
- Check that the siteUrl parameter is correct
- In Power Apps, ensure proper connections are configured

### Missing Data
- Verify SharePoint list names match exactly
- Check column internal names vs display names
- Ensure user has read permissions on lists

---

## Support | الدعم

For issues or questions:
- Check browser console for errors
- Review SharePoint list permissions
- Verify network requests in browser DevTools

---

## Version History | سجل الإصدارات

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial release |

