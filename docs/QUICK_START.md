# Quick Start Commands

## After SharePoint Schema Verification

### Step 1: Regenerate Power SDK Schema

```powershell
# Regenerate schema for BC_Test_Plans (new list)
pac code add-data-source -a "shared_sharepointonline" -c "<your-connection-id>" -t "BC_Test_Plans" -d "https://saudimoe.sharepoint.com/sites/em"

# Regenerate for BC_Mutual_Operation if schema changed
pac code add-data-source -a "shared_sharepointonline" -c "<your-connection-id>" -t "BC_Mutual_Operation" -d "https://saudimoe.sharepoint.com/sites/em"

# Regenerate for BC_Plan_Review if schema changed  
pac code add-data-source -a "shared_sharepointonline" -c "<your-connection-id>" -t "BC_Plan_Review" -d "https://saudimoe.sharepoint.com/sites/em"
```

**Replace `<your-connection-id>` with your actual SharePoint connection ID**

---

### Step 2: Build Application

```bash
npm run build
```

---

### Step 3: Deploy to Power Platform

```bash
pac code push
```

---

## After Deployment - Testing

### In Power Apps Studio or Power Platform:

1. **Open BC_Test_Plans**
   - Verify data loads from SharePoint
   - Check all fields visible: Title, Hypothesis, StartDate, EndDate, Status, Responsible

2. **Open BC_Mutual_Operation**
   - Check new fields: ContactPerson, ContactPhone, ContactEmail, AgreementDate, ActivationPriority
   - Verify SourceSchoolName and AlternativeSchoolName load

3. **Open BC_Plan_Review**
   - Verify ApprovalDate and ApprovedBy show
   - Check Task7_1_Complete, Task7_2_Complete, Task7_3_Complete flags
   - Verify ReviewedBy and ReviewerRole fields

4. **Open BC_Incident_Evaluations**
   - Verify 4 effectiveness scores display: ResponseEffectiveness, CommunicationEffectiveness, CoordinationEffectiveness, TimelinessScore
   - Check LessonsLearned and FollowUpDate fields

5. **Open BC_Admin_Contacts**
   - Verify IsActive status visible

6. **Open BC_DR_Checklist**
   - Verify Priority and ResponsiblePerson display

---

## Troubleshooting Commands

### Check for Compilation Errors
```bash
npm run build
```

### Check TypeScript Errors
```bash
npx tsc --noEmit
```

### Clean Build
```bash
rm -r node_modules
npm install
npm run build
```

### View Generated Power SDK Schemas
```powershell
# List generated service files
Get-ChildItem -Path "src/generated" -Recurse

# Check for updated column names in generated services
grep -r "SourceSchoolName\|ReviewedBy\|ContactPerson" src/generated
```

---

## Environment Variables Needed

Make sure you have your connection ID. Get it from:

1. Power Platform Admin Center
2. Navigate to Environments
3. Select your environment
4. Note the **Connection ID** for SharePoint

---

## File Changes Summary

| File | Status | Changes |
|---|---|---|
| `src/services/adminDataService.ts` | ✅ Updated | 7 transformer functions updated |
| `docs/FIELD_MAPPING_FIX_REQUIRED.md` | ✅ Updated | Verified all columns exist |
| `docs/SHAREPOINT_SCHEMA_UPDATE.md` | ✅ Created | Detailed mapping documentation |
| `docs/SHAREPOINT_COLUMNS_REFERENCE.md` | ✅ Updated | Quick reference for all columns |
| `docs/COMPLETION_REPORT.md` | ✅ Created | Full completion report |

---

## Contact Information

For questions about specific column mappings, refer to:
- [SHAREPOINT_COLUMNS_REFERENCE.md](SHAREPOINT_COLUMNS_REFERENCE.md) - Column reference
- [COMPLETION_REPORT.md](COMPLETION_REPORT.md) - Detailed mapping reference

---

**Status:** ✅ Ready for deployment
**Last Updated:** December 20, 2025
