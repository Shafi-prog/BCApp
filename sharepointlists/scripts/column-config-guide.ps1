# SharePoint Column Configuration for 10 New Lists
# Run this to see exact column types needed for each list
# After creating lists with correct columns, run the pac commands below

Write-Host @"
╔═══════════════════════════════════════════════════════════════════════════╗
║        SHAREPOINT LIST COLUMN CONFIGURATION GUIDE                         ║
║        All 10 New Lists - Required Column Types                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "`n"

# List 1: BC_Admin_Contacts
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  📋 LIST 1: BC_Admin_Contacts" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host @"
  Column Name        | Type                | Notes
  ───────────────────┼─────────────────────┼─────────────────────────────
  Title              | Single line text    | Contact name (required)
  Role               | Single line text    | Job role/position
  Phone              | Single line text    | Phone number (NOT Number type!)
  Email              | Single line text    | Email address
  Organization       | Choice              | See choices below
  Category           | Choice              | internal, external
  ContactScope       | Single line text    | Contact scope
  ContactTiming      | Single line text    | When to contact
  BackupMember       | Single line text    | Backup contact name
  Notes              | Multiple lines text | Additional notes
  IsActive           | Yes/No              | Is contact active

  ⚠️  Organization Choice Values:
      operations, bc_team, bc_team_backup, civil_defense, red_crescent,
      police, ambulance, tatweer, it_systems, infosec, external, ministry
"@

# List 2: BC_Plan_Documents
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  📋 LIST 2: BC_Plan_Documents" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host @"
  Column Name        | Type                | Notes
  ───────────────────┼─────────────────────┼─────────────────────────────
  Title              | Single line text    | Document title
  DocumentType       | Choice              | policy, plan, procedure, template, report, other
  Description        | Multiple lines text | Document description
  FileName           | Single line text    | File name
  Version            | Single line text    | Version number (e.g., 3.0)
  UploadDate         | Date only           | When uploaded
  ShareDate          | Date only           | When shared
  IsShared           | Yes/No              | Has been shared
  Notes              | Multiple lines text | Additional notes
"@

# List 3: BC_Shared_Plan
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  📋 LIST 3: BC_Shared_Plan" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host @"
  Column Name        | Type                | Notes
  ───────────────────┼─────────────────────┼─────────────────────────────
  Title              | Single line text    | Plan title
  Description        | Multiple lines text | Plan description
  PlanFileName       | Single line text    | Uploaded file name
  IsPublished        | Yes/No              | Is plan published
  PublishDate        | Date only           | When published
  LastUpdated        | Date and Time       | Last update timestamp
  ReviewPeriodMonths | Number              | Review period in months
  NextReviewDate     | Date only           | Next scheduled review
  AdminNotes         | Multiple lines text | Admin notes
  Version            | Single line text    | Plan version
  FileUploadDate     | Date only           | ⚠️ ADD THIS COLUMN
  Task1_1_Complete   | Yes/No              | ⚠️ ADD THIS COLUMN
  Task1_2_Complete   | Yes/No              | ⚠️ ADD THIS COLUMN
  Task1_3_Complete   | Yes/No              | ⚠️ ADD THIS COLUMN
  Task1_4_Complete   | Yes/No              | ⚠️ ADD THIS COLUMN
"@

# List 4: BC_Test_Plans
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  📋 LIST 4: BC_Test_Plans" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host @"
  Column Name        | Type                | Notes
  ───────────────────┼─────────────────────┼─────────────────────────────
  Title              | Single line text    | Test plan title
  Hypothesis         | Choice              | scenario1, scenario2, scenario3, scenario4, scenario5
  SpecificEvent      | Multiple lines text | Event description
  TargetGroup        | Choice              | See choices below
  StartDate          | Date only           | Start date
  EndDate            | Date only           | End date
  Status             | Choice              | مخطط, جاري, مكتمل, ملغى
  ResponsiblePerson  | Single line text    | Person responsible
  Notes              | Multiple lines text | Additional notes
  Year               | Number              | Year (e.g., 1446)
  Quarter            | Choice              | Q1, Q2, Q3, Q4

  ⚠️  TargetGroup Choice Values:
      جميع المدارس, المدارس الابتدائية, المدارس المتوسطة, 
      المدارس الثانوية, مدارس مختارة
"@

# List 5: BC_DR_Checklist
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  📋 LIST 5: BC_DR_Checklist" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host @"
  Column Name        | Type                | Notes
  ───────────────────┼─────────────────────┼─────────────────────────────
  Title              | Single line text    | Checklist item (⚠️ Frontend calls this 'item')
  Category           | Choice              | data, systems, communications, personnel, facilities
  Status             | Choice              | ready, partial, not_ready
  LastChecked        | Date only           | Last check date
  CheckedBy          | Single line text    | Who checked
  Notes              | Multiple lines text | Notes
  SortOrder          | Number              | Display order
"@

# List 6: BC_Incident_Evaluations
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  📋 LIST 6: BC_Incident_Evaluations" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host @"
  Column Name             | Type                | Notes
  ────────────────────────┼─────────────────────┼─────────────────────────────
  Title                   | Single line text    | Evaluation title
  IncidentNumber          | Single line text    | Reference to incident (e.g., INC-001)
  EvaluationDate          | Date only           | Evaluation date
  EvaluatedBy             | Single line text    | Evaluator name
  ResponseEffectiveness   | Number              | Score 1-5
  CommunicationEffectiveness | Number           | Score 1-5
  CoordinationEffectiveness | Number            | Score 1-5
  TimelinessScore         | Number              | Score 1-5
  OverallScore            | Number              | Average score
  StrengthPoints          | Multiple lines text | Strengths (⚠️ Frontend: 'strengths')
  ImprovementAreas        | Multiple lines text | Weaknesses (⚠️ Frontend: 'weaknesses')
  RecommendedActions      | Multiple lines text | Recommendations
  LessonsLearned          | Multiple lines text | Lessons learned
  FollowUpRequired        | Yes/No              | Needs follow-up
  FollowUpDate            | Date only           | Follow-up date
  Notes                   | Multiple lines text | Notes
  ResponseTimeMinutes     | Number              | ⚠️ ADD THIS COLUMN (Frontend needs)
  RecoveryTimeHours       | Number              | ⚠️ ADD THIS COLUMN
  StudentsReturnedDate    | Date only           | ⚠️ ADD THIS COLUMN
  AlternativeUsed         | Single line text    | ⚠️ ADD THIS COLUMN
"@

# List 7: BC_Damage_Reports
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  📋 LIST 7: BC_Damage_Reports" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host @"
  Column Name             | Type                | Notes
  ────────────────────────┼─────────────────────┼─────────────────────────────
  Title                   | Single line text    | Report title (⚠️ Frontend: 'incidentTitle')
  IncidentNumber          | Single line text    | Reference to incident
  ReportDate              | Date only           | Report date (⚠️ Frontend: 'date')
  ReportedBy              | Single line text    | Reporter name
  DamageType              | Choice              | water_damage, fire_damage, structural, etc.
  AffectedArea            | Single line text    | Area affected
  AffectedAssets          | Multiple lines text | Equipment affected
  EstimatedCost           | Currency            | Cost estimate
  InsuranceClaim          | Yes/No              | Filed insurance claim
  ClaimNumber             | Single line text    | Insurance claim number
  RepairStatus            | Choice              | قيد التقييم, تم التقييم, قيد الإصلاح, تم الإصلاح
  RepairStartDate         | Date only           | Repair start
  RepairEndDate           | Date only           | Repair end
  ContractorName          | Single line text    | Repair contractor
  AffectsOperations       | Yes/No              | Affects school operations
  OperationalImpact       | Multiple lines text | Impact description
  PhotosAttached          | Yes/No              | Has photos
  Notes                   | Multiple lines text | Notes
  BuildingDamage          | Choice              | ⚠️ ADD: لا يوجد, طفيف, متوسط, كبير, كلي
  EquipmentDamage         | Choice              | ⚠️ ADD: Same choices
  DataLoss                | Choice              | ⚠️ ADD: Same choices
  RecoveryTime            | Single line text    | ⚠️ ADD: Recovery time estimate
"@

# List 8: BC_Plan_Review
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  📋 LIST 8: BC_Plan_Review" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host @"
  Column Name             | Type                | Notes
  ────────────────────────┼─────────────────────┼─────────────────────────────
  Title                   | Single line text    | Review title
  ReviewDate              | Date only           | Review date
  ReviewedBy              | Single line text    | Reviewer name
  ReviewerRole            | Single line text    | Reviewer role
  PlanVersion             | Single line text    | Version reviewed
  OverallStatus           | Choice              | approved, needs_update, rejected
  CompletionPercentage    | Number              | 0-100
  ScenariosReviewed       | Yes/No              | Scenarios checked
  ProceduresReviewed      | Yes/No              | Procedures checked
  ContactsReviewed        | Yes/No              | Contacts checked
  ResourcesReviewed       | Yes/No              | Resources checked
  TrainingReviewed        | Yes/No              | Training checked
  FindingsCount           | Number              | Number of findings
  CriticalFindings        | Number              | Critical findings count
  RecommendationsCount    | Number              | Recommendations count
  NextReviewDate          | Date only           | Next review
  ApprovalStatus          | Choice              | approved, conditionally_approved, pending
  ApprovedBy              | Single line text    | Approver name
  ApprovalDate            | Date only           | Approval date
  Notes                   | Multiple lines text | Notes
  ReviewFileName          | Single line text    | ⚠️ ADD THIS COLUMN (Frontend needs)
  ReviewFileUploadDate    | Date only           | ⚠️ ADD THIS COLUMN
  ReviewRecommendations   | Multiple lines text | ⚠️ ADD THIS COLUMN
  ResponseScenario1       | Multiple lines text | ⚠️ ADD THIS COLUMN
  ResponseScenario2       | Multiple lines text | ⚠️ ADD THIS COLUMN
  ResponseScenario3       | Multiple lines text | ⚠️ ADD THIS COLUMN
  ResponseScenario4       | Multiple lines text | ⚠️ ADD THIS COLUMN
  ResponseScenario5       | Multiple lines text | ⚠️ ADD THIS COLUMN
  ProceduresFileName      | Single line text    | ⚠️ ADD THIS COLUMN
  ProceduresFileUploadDate| Date only           | ⚠️ ADD THIS COLUMN
  Task7_1_Complete        | Yes/No              | ⚠️ ADD THIS COLUMN
  Task7_2_Complete        | Yes/No              | ⚠️ ADD THIS COLUMN
  Task7_3_Complete        | Yes/No              | ⚠️ ADD THIS COLUMN
  LastUpdated             | Date and Time       | ⚠️ ADD THIS COLUMN
"@

# List 9: BC_Plan_Scenarios
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  📋 LIST 9: BC_Plan_Scenarios ✅ Good Match!" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host @"
  Column Name        | Type                | Notes
  ───────────────────┼─────────────────────┼─────────────────────────────
  Title              | Single line text    | Scenario title
  ScenarioNumber     | Number              | 1-5
  Description        | Multiple lines text | Scenario description
  ResponseActions    | Multiple lines text | Actions (one per line)
  SortOrder          | Number              | Display order
"@

# List 10: BC_Mutual_Operation
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  📋 LIST 10: BC_Mutual_Operation ✅ Good Match!" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host @"
  Column Name             | Type                | Notes
  ────────────────────────┼─────────────────────┼─────────────────────────────
  Title                   | Single line text    | Agreement title
  SourceSchoolID          | Single line text    | Source school ID
  SourceSchoolName        | Single line text    | Source school name
  AlternativeSchoolID     | Single line text    | Alternative school ID
  AlternativeSchoolName   | Single line text    | Alternative school name
  AlternativeAddress      | Single line text    | Address
  Distance                | Number              | Distance in km
  TransportationArrangement | Single line text  | Transport details
  Capacity                | Number              | Student capacity
  SupportingGrades        | Single line text    | Grades supported
  ActivationPriority      | Number              | Priority (1=highest)
  ContactPerson           | Single line text    | Contact name
  ContactPhone            | Single line text    | Contact phone
  ContactEmail            | Single line text    | Contact email
  AgreementStatus         | Choice              | active, pending, expired
  AgreementDate           | Date only           | Agreement date
  LastVerified            | Date only           | Last verification
  Notes                   | Multiple lines text | Notes
  IsActive                | Yes/No              | Is active
"@

Write-Host "`n"
Write-Host "╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║        PAC COMMANDS TO CONNECT LISTS                                      ║" -ForegroundColor Green  
Write-Host "╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host @"

After creating/verifying all lists in SharePoint, run these commands:

# Get your SharePoint connection ID first:
pac connection list

# Then for each list (replace <connectionId> with your actual connection ID):

pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "BC_Admin_Contacts" -d "https://saudimoe.sharepoint.com/sites/em"

pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "BC_Plan_Documents" -d "https://saudimoe.sharepoint.com/sites/em"

pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "BC_Shared_Plan" -d "https://saudimoe.sharepoint.com/sites/em"

pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "BC_Test_Plans" -d "https://saudimoe.sharepoint.com/sites/em"

pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "BC_DR_Checklist" -d "https://saudimoe.sharepoint.com/sites/em"

pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "BC_Incident_Evaluations" -d "https://saudimoe.sharepoint.com/sites/em"

pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "BC_Damage_Reports" -d "https://saudimoe.sharepoint.com/sites/em"

pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "BC_Plan_Review" -d "https://saudimoe.sharepoint.com/sites/em"

pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "BC_Plan_Scenarios" -d "https://saudimoe.sharepoint.com/sites/em"

pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "BC_Mutual_Operation" -d "https://saudimoe.sharepoint.com/sites/em"

"@ -ForegroundColor White

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
