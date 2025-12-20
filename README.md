# 🏫 School Business Continuity App

**Ministry of Education - Saudi Arabia**  
Business Continuity Planning and Emergency Management System

---

## 📁 Project Structure

```
App/
├── 📂 src/                    # Application source code
│   ├── components/            # React components
│   ├── services/              # Business logic & API services
│   ├── context/               # React context (Auth, etc.)
│   ├── data/                  # Static data & configurations
│   ├── config/                # App configuration
│   ├── generated/             # Power SDK generated files
│   └── styles/                # CSS styles
│
├── 📂 docs/                   # Documentation (30 files)
│   ├── FINAL_DEPLOYMENT_AUDIT.md
│   ├── NEW_FEATURES.md
│   ├── SECURITY_AUDIT_REPORT.md
│   ├── FIELD_MAPPING_AUDIT.md
│   └── ... (guides & references)
│
├── 📂 scripts/                # Utility scripts (10 files)
│   ├── *.ps1                  # PowerShell automation
│   ├── *.py                   # Python utilities
│   └── *.js                   # JavaScript tools
│
├── 📂 exports/                # Data exports & templates
│   ├── *.csv                  # SharePoint list templates
│   └── *.json                 # Configuration exports
│
├── 📂 backup/                 # Old versions & archives
│   ├── *.zip                  # Previous builds
│   ├── *.msapp                # Power Apps packages
│   └── */                     # Old solution folders
│
├── 📂 .power/                 # Power Apps SDK files
│   ├── schemas/               # SharePoint schemas
│   └── appschemas/            # Generated schemas
│
├── 📂 dist/                   # Build output
├── 📂 templates/              # SharePoint templates
├── 📂 sharepointlists/        # List configurations
│
└── ⚙️ Configuration Files
    ├── package.json           # Node dependencies
    ├── tsconfig.json          # TypeScript config
    ├── vite.config.ts         # Build configuration
    └── power.config.json      # Power Apps config
```

---

## 🚀 Quick Start

### Development
```powershell
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

### Deployment
```powershell
# Build the app
npm run build

# Push to Power Apps
pac code push
```

---

## 📖 Key Documentation

| Document | Description |
|----------|-------------|
| [FINAL_DEPLOYMENT_AUDIT.md](docs/FINAL_DEPLOYMENT_AUDIT.md) | Complete deployment readiness audit |
| [NEW_FEATURES.md](docs/NEW_FEATURES.md) | Latest features & implementation guide |
| [SECURITY_AUDIT_REPORT.md](docs/SECURITY_AUDIT_REPORT.md) | Security hardening & XSS prevention |
| [FIELD_MAPPING_AUDIT.md](docs/FIELD_MAPPING_AUDIT.md) | SharePoint field mappings |
| [EXPORT_TO_SOLUTION.md](docs/EXPORT_TO_SOLUTION.md) | How to export as Power Apps solution |

---

## 🔧 Technology Stack

- **Frontend:** React 18.2 + TypeScript
- **UI Library:** Fluent UI v8
- **Build Tool:** Vite 4.4
- **Platform:** Power Apps Code Components
- **Backend:** SharePoint Online Lists
- **Authentication:** Custom (SchoolInfo list)

---

## 📊 Features

### For Schools:
- ✅ Dashboard with readiness score
- ✅ Team management (BC teams)
- ✅ Training registration & log
- ✅ Drill exercises & evaluation
- ✅ Incident reporting & tracking
- ✅ Quick Reference guide
- ✅ Notification system
- ✅ School information display

### For Admin:
- ✅ All schools overview
- ✅ BC plan management
- ✅ Contact management
- ✅ Scenario planning
- ✅ Training catalog
- ✅ Drill planning
- ✅ Statistics & leaderboard
- ✅ Announcement broadcasting

---

## 🗄️ SharePoint Lists (16 total)

1. **SchoolInfo** - School master data (1932 schools)
2. **BC_Teams_Members** - Safety team members
3. **School_Training_Log** - Training attendance
4. **SBC_Drills_Log** - Drill exercises
5. **SBC_Incidents_Log** - Incident reports
6. **BC_Admin_Contacts** - Emergency contacts
7. **BC_Scenarios** - Response scenarios
8. **BC_Damage_Reports** - Damage assessments
9. **BC_DR_Checklist** - Disaster recovery checklist
10. **Coordination_Programs_Catalog** - Training programs
11. **BC_Incident_Evaluations** - Incident evaluations
12. **Mutual_Operation** - School partnerships
13. **BC_Supporting_Documents** - Document library
14. **BC_Shared_Plan** - Published BC plans
15. **SBC_Admin_DrillPlan** - Drill schedules
16. **BC_Announcements_Schema** - Notifications (optional)

---

## 🔐 Environment Setup

### Required:
- Node.js 18+
- Power Platform CLI (`pac`)
- SharePoint connection to: `https://saudimoe.sharepoint.com/sites/em`
- Environment ID: `0aa4969d-c8e7-e0a7-9bf8-6925c5922de3`

### Optional:
- Power Automate Flow (forgot password)
- SharePoint permissions (Read/Write)

---

## ✅ Build Status

**Last Build:** December 19, 2025  
**Status:** ✅ PRODUCTION READY  
**Bundle Size:** 3.14 MB (550 KB gzipped)  
**Errors:** 0  
**Warnings:** 2 (non-critical)

---

## 📞 Support

For issues or questions:
1. Check [FINAL_DEPLOYMENT_AUDIT.md](docs/FINAL_DEPLOYMENT_AUDIT.md)
2. Review [NEW_FEATURES.md](docs/NEW_FEATURES.md)
3. See SharePoint setup in [docs/](docs/)

---

**Ministry of Education** | **Medina Region** | **December 2025**
