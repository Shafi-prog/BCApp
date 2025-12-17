# SharePoint Lists Specification for BC Management System
# مواصفات قوائم SharePoint لنظام إدارة استمرارية الأعمال

## Overview
This document defines all SharePoint lists required for the BC Management System.
All data currently in localStorage will be migrated to these lists for security compliance.

**SharePoint Site:** https://saudimoe.sharepoint.com/sites/em

---

## 📋 EXISTING LISTS (6 Lists)

### 1. SchoolInfo
> Already exists - Contains school master data

| Column (Internal) | Column (Arabic) | Type | Notes |
|---|---|---|---|
| Title | اسم المدرسة | Single line of text | Primary key |
| SchoolCode | رقم المدرسة | Single line of text | Unique identifier |
| Level | المرحلة | Choice | المرحلة الإبتدائية, المرحلة المتوسطة, المرحلة الثانوية |
| Gender | النوع | Choice | بنين, بنات |
| Sector | القطاع | Single line of text | e.g., وادي الفرع |
| PrincipalName | اسم المدير | Single line of text | |
| PrincipalPhone | هاتف المدير | Single line of text | |
| PrincipalEmail | بريد المدير | Single line of text | |
| Address | العنوان | Multiple lines of text | |
| Latitude | خط العرض | Number | For mapping |
| Longitude | خط الطول | Number | For mapping |

### 2. BC_Teams_Members
> Already exists - School safety team members

| Column (Internal) | Column (Arabic) | Type | Notes |
|---|---|---|---|
| Title | الاسم | Single line of text | Member name |
| SchoolName_Ref | المدرسة | Lookup → SchoolInfo | |
| MembershipType | نوع العضوية | Choice | رئيس الفريق, عضو أساسي, عضو احتياطي |
| Role | الدور | Single line of text | e.g., وكيل المدرسة |
| Phone | الهاتف | Single line of text | |
| Email | البريد الإلكتروني | Single line of text | |
| JoinDate | تاريخ الانضمام | Date | |
| IsActive | نشط | Yes/No | Default: Yes |

### 3. SBC_Drills_Log
> Already exists - Drill execution records

| Column (Internal) | Column (Arabic) | Type | Notes |
|---|---|---|---|
| Title | عنوان التمرين | Single line of text | |
| SchoolName_Ref | المدرسة | Lookup → SchoolInfo | |
| DrillDate | تاريخ التمرين | Date | |
| DrillHypothesis | الفرضية | Choice | See scenarios list |
| ParticipantsCount | عدد المشاركين | Number | |
| Duration | المدة (دقائق) | Number | |
| EvacuationTime | وقت الإخلاء (دقائق) | Number | |
| Outcome | النتيجة | Choice | ناجح, ناجح جزئياً, يحتاج تحسين |
| Notes | ملاحظات | Multiple lines of text | |
| Attachments | المرفقات | Attachments | Photos/documents |
| IsAdminPlan | خطة إدارة | Yes/No | Admin-created plan vs school drill |

### 4. SBC_Incidents_Log
> Already exists - Incident reports

| Column (Internal) | Column (Arabic) | Type | Notes |
|---|---|---|---|
| Title | عنوان الحادث | Single line of text | |
| SchoolName_Ref | المدرسة | Lookup → SchoolInfo | |
| IncidentDate | تاريخ الحادث | Date and Time | |
| IncidentType | نوع الحادث | Choice | حريق, كارثة طبيعية, أمني, صحي, تقني, أخرى |
| Severity | الخطورة | Choice | منخفض, متوسط, مرتفع, حرج |
| Description | الوصف | Multiple lines of text | |
| ImpactedStudents | الطلاب المتأثرين | Number | |
| ImpactedStaff | الموظفين المتأثرين | Number | |
| ResponseActions | إجراءات الاستجابة | Multiple lines of text | |
| AlternativeUsed | البديل المستخدم | Choice | التعليم عن بعد, مدرسة بديلة, تعليق مؤقت |
| Status | الحالة | Choice | نشط, قيد المعالجة, مغلق |
| LessonsLearned | الدروس المستفادة | Multiple lines of text | |
| Challenges | التحديات | Multiple lines of text | |
| Recommendations | التوصيات | Multiple lines of text | |
| ResolvedDate | تاريخ الإغلاق | Date | |

### 5. School_Training_Log
> Already exists - Training records

| Column (Internal) | Column (Arabic) | Type | Notes |
|---|---|---|---|
| Title | عنوان التدريب | Single line of text | |
| SchoolName_Ref | المدرسة | Lookup → SchoolInfo | |
| TrainingDate | تاريخ التدريب | Date | |
| TrainingType | نوع التدريب | Choice | ورشة عمل, دورة, محاضرة, تدريب عملي |
| TraineeCount | عدد المتدربين | Number | |
| TrainerName | اسم المدرب | Single line of text | |
| DurationHours | المدة (ساعات) | Number | |
| Topics | المواضيع | Multiple lines of text | |
| CertificateIssued | شهادة صادرة | Yes/No | |

### 6. Coordination_Programs_Catalog
> Already exists - Training catalog

| Column (Internal) | Column (Arabic) | Type | Notes |
|---|---|---|---|
| Title | اسم البرنامج | Single line of text | |
| ProgramType | نوع البرنامج | Choice | دورة, ورشة, محاضرة |
| Description | الوصف | Multiple lines of text | |
| Duration | المدة | Single line of text | |
| TargetAudience | الفئة المستهدفة | Choice | مدراء, معلمين, طلاب, الجميع |
| IsActive | نشط | Yes/No | |

---

## 📋 NEW LISTS TO CREATE (9 Lists)

### 7. BC_Admin_Contacts ⭐ NEW
> جهات الاتصال الداخلية والخارجية (Admin contacts for operations room & external entities)

| Column (Internal) | Column (Arabic) | Type | Required | Notes |
|---|---|---|---|---|
| Title | الاسم | Single line of text | Yes | Contact name |
| Role | المنصب/الوظيفة | Single line of text | No | e.g., رئيس وحدة عمليات الطوارئ |
| Phone | رقم الجوال | Single line of text | No | e.g., 0590006072 |
| Email | البريد الإلكتروني | Single line of text | No | e.g., email@moe.gov.sa |
| Organization | الجهة | Choice | Yes | See choices below |
| Category | التصنيف | Choice | Yes | internal, external |
| ContactScope | نطاق التواصل | Single line of text | No | For external: مشاكل المبنى |
| ContactTiming | توقيت التواصل | Choice | No | See choices below |
| BackupMember | العضو البديل | Single line of text | No | Backup contact name & phone |
| Notes | ملاحظات | Multiple lines of text | No | |
| IsActive | نشط | Yes/No | Yes | Default: Yes |

**Organization Choices:**
- operations (فريق غرفة العمليات)
- bc_team (فريق استمرارية الأعمال)
- bc_team_backup (الأعضاء الاحتياطيون)
- ministry (الوزارة)
- tatweer (شركة تطوير)
- it_systems (الأنظمة والتطبيقات)
- infosec (أمن المعلومات)
- police (الشرطة)
- civil_defense (الدفاع المدني)
- ambulance (الإسعاف)
- red_crescent (الهلال الأحمر)
- external (جهة خارجية أخرى)

**ContactTiming Choices:**
- disruption (عند وجود اضطراب بحسب كل فرضية)
- fire (عند الحريق)
- security (عند الاضطرابات الأمنية)
- cyber (عند وجود حوادث سيبرانية)
- injury (عند إصابة أحد منسوبي المدرسة)
- evacuation (عند الحريق أو الكوارث الطبيعية والأمنية)
- other (حسب الحاجة)

**Example Rows:**
| Title | Role | Phone | Email | Organization | Category |
|---|---|---|---|---|---|
| فيصل بن صالح الجهني | رئيس وحدة عمليات الطوارئ والأزمات | 0590006072 | fjuhani5709@moe.gov.sa | operations | internal |
| ماهر بن حامد الحربي | رئيس فريق السلامة المدرسية | 0542079282 | mhaharbi7309@moe.gov.sa | bc_team | internal |
| الدفاع المدني | ضابط اتصال | 998 | | civil_defense | external |
| شركة تطوير | مسؤول المباني | | | tatweer | external |

---

### 8. BC_Plan_Documents ⭐ NEW
> المستندات المساندة (Supporting BC documents - policies, procedures, templates)

| Column (Internal) | Column (Arabic) | Type | Required | Notes |
|---|---|---|---|---|
| Title | عنوان المستند | Single line of text | Yes | |
| DocumentType | نوع المستند | Choice | Yes | policy, plan, procedure, template, report, other |
| Description | الوصف | Multiple lines of text | No | |
| FileName | اسم الملف | Single line of text | No | Or SharePoint link |
| FileAttachment | الملف المرفق | Attachments | No | Actual file |
| Version | الإصدار | Single line of text | No | e.g., 1.0 |
| UploadDate | تاريخ الرفع | Date | Yes | |
| ShareDate | تاريخ المشاركة | Date | No | When shared with schools |
| IsShared | تمت المشاركة | Yes/No | Yes | Default: No |
| Notes | ملاحظات | Multiple lines of text | No | |

**DocumentType Choices (Arabic display):**
- policy (سياسة)
- plan (خطة)
- procedure (إجراء)
- template (نموذج)
- report (تقرير)
- other (أخرى)

**Example Rows:**
| Title | DocumentType | Version | UploadDate | IsShared |
|---|---|---|---|---|
| سياسة استمرارية الأعمال | policy | 3.0 | 2025-01-15 | Yes |
| إجراءات الإخلاء | procedure | 2.1 | 2025-02-01 | Yes |
| نموذج تقييم الأضرار | template | 1.0 | 2025-01-20 | Yes |

---

### 9. BC_Shared_Plan ⭐ NEW
> الخطة المشتركة المنشورة للمدارس (Main BC Plan published to schools)

| Column (Internal) | Column (Arabic) | Type | Required | Notes |
|---|---|---|---|---|
| Title | عنوان الخطة | Single line of text | Yes | Main plan title |
| Description | وصف الخطة | Multiple lines of text | No | |
| PlanFileName | اسم ملف الخطة | Single line of text | No | Uploaded Word/PDF name |
| PlanFileAttachment | ملف الخطة | Attachments | No | Actual plan file |
| FileUploadDate | تاريخ رفع الملف | Date | No | |
| IsPublished | منشورة للمدارس | Yes/No | Yes | Default: No |
| PublishDate | تاريخ النشر | Date | No | When published |
| LastUpdated | آخر تحديث | Date and Time | Yes | Auto-updated |
| ReviewPeriodMonths | فترة المراجعة (شهور) | Number | No | Default: 6 |
| NextReviewDate | تاريخ المراجعة القادمة | Date | No | |
| AdminNotes | ملاحظات الأدمن | Multiple lines of text | No | Internal notes |
| Version | الإصدار | Single line of text | No | e.g., 3.0 |

**Note:** Only ONE active plan should have IsPublished=Yes at a time.

**Example Row:**
| Title | Description | IsPublished | PublishDate | Version |
|---|---|---|---|---|
| خطة استمرارية العملية التعليمية 1446 | خطة استمرارية الأعمال للتعامل مع حالات الاضطراب | Yes | 2025-01-15 | 3.0 |

---

### 10. BC_Plan_Scenarios ⭐ NEW
> سيناريوهات الخطة (Scenarios linked to the shared plan)

| Column (Internal) | Column (Arabic) | Type | Required | Notes |
|---|---|---|---|---|
| Title | عنوان السيناريو | Single line of text | Yes | |
| Plan_Ref | الخطة | Lookup → BC_Shared_Plan | Yes | Link to parent plan |
| ScenarioNumber | رقم السيناريو | Number | Yes | 1, 2, 3, 4, 5 |
| Description | وصف السيناريو | Multiple lines of text | Yes | |
| ResponseActions | إجراءات الاستجابة | Multiple lines of text | Yes | Each action on new line |
| SortOrder | الترتيب | Number | No | For display order |

**Example Rows:**
| Title | ScenarioNumber | Description |
|---|---|---|
| تعذر تنفيذ العملية التعليمية في المبنى المدرسي | 1 | تعذر تقديم النشاط التعليمي بسبب تعذر استخدام المبنى |
| عدم توافر خدمات التعليم الإلكتروني | 2 | انقطاع خدمات منصة مدرستي أو روضتي |
| تعذر نقل الطلاب بالحافلات المدرسية | 3 | تعطل نظام GPS أو مشاكل النقل |
| عدم توافر الكادر التعليمي | 4 | عدم توفر العدد الكافي من المعلمين |
| حدوث حادث أمني أو سيبراني | 5 | اضطرابات أمنية أو هجمات سيبرانية |

---

### 11. BC_Test_Plans ⭐ NEW
> خطط اختبار التمارين (Admin drill plans - yearly schedule)

| Column (Internal) | Column (Arabic) | Type | Required | Notes |
|---|---|---|---|---|
| Title | عنوان الخطة | Single line of text | Yes | |
| Hypothesis | الفرضية | Choice | Yes | Scenario type |
| SpecificEvent | الحدث المحدد | Single line of text | No | Specific event description |
| TargetGroup | الفئة المستهدفة | Single line of text | No | e.g., جميع المدارس |
| StartDate | تاريخ البداية | Date | Yes | |
| EndDate | تاريخ النهاية | Date | Yes | |
| Status | الحالة | Choice | Yes | مخطط, جاري, مكتمل, ملغي |
| ResponsiblePerson | المسؤول | Single line of text | No | |
| Notes | ملاحظات | Multiple lines of text | No | |
| Year | السنة | Number | Yes | e.g., 1446 |
| Quarter | الربع | Choice | No | Q1, Q2, Q3, Q4 |

**Hypothesis Choices:**
- scenario1 (تعذر استخدام المبنى المدرسي)
- scenario2 (عدم توافر التعليم الإلكتروني)
- scenario3 (تعذر نقل الطلاب)
- scenario4 (عدم توافر الكادر التعليمي)
- scenario5 (حادث أمني أو سيبراني)

**Example Rows:**
| Title | Hypothesis | StartDate | EndDate | Status | Quarter |
|---|---|---|---|---|---|
| تمرين الإخلاء - الربع الأول | scenario1 | 2025-01-15 | 2025-03-15 | مكتمل | Q1 |
| تمرين التعليم عن بعد - الربع الثاني | scenario2 | 2025-04-01 | 2025-06-30 | جاري | Q2 |

---

### 12. BC_DR_Checklist ⭐ NEW
> قائمة جاهزية مركز البيانات الاحتياطي (DR readiness checklist)

| Column (Internal) | Column (Arabic) | Type | Required | Notes |
|---|---|---|---|---|
| Title | العنصر | Single line of text | Yes | Checklist item |
| Category | التصنيف | Choice | Yes | See choices below |
| Status | الحالة | Choice | Yes | ready, partial, not_ready |
| LastChecked | آخر فحص | Date | No | |
| CheckedBy | تم الفحص بواسطة | Single line of text | No | |
| Notes | ملاحظات | Multiple lines of text | No | |
| SortOrder | الترتيب | Number | No | For display order |

**Category Choices:**
- data (البيانات)
- systems (الأنظمة)
- communications (الاتصالات)
- alternative_sites (المواقع البديلة)
- teams (الفرق)

**Status Choices:**
- ready (جاهز ✅)
- partial (جزئي ⚠️)
- not_ready (غير جاهز ❌)

**Example Rows:**
| Title | Category | Status | LastChecked |
|---|---|---|---|
| النسخ الاحتياطي للبيانات | data | ready | 2025-01-10 |
| اختبار استعادة البيانات | data | partial | 2025-01-10 |
| نظام نور متاح من DR | systems | ready | 2025-01-10 |
| خطوط الاتصال البديلة | communications | not_ready | 2025-01-10 |
| تدريب الفريق على DR | teams | partial | 2025-01-10 |

---

### 13. BC_Incident_Evaluations ⭐ NEW
> تقييمات الحوادث (Post-incident evaluations)

| Column (Internal) | Column (Arabic) | Type | Required | Notes |
|---|---|---|---|---|
| Title | عنوان التقييم | Single line of text | Yes | |
| Incident_Ref | الحادث | Lookup → SBC_Incidents_Log | Yes | Link to incident |
| EvaluationDate | تاريخ التقييم | Date | Yes | |
| ResponseTimeMinutes | وقت الاستجابة (دقائق) | Number | No | |
| RecoveryTimeHours | وقت التعافي (ساعات) | Number | No | |
| StudentsReturnedDate | تاريخ عودة الطلاب | Date | No | |
| AlternativeUsed | البديل المستخدم | Choice | No | remote, alternative_school, suspended |
| OverallScore | التقييم العام | Number | No | 1-5 scale |
| Strengths | نقاط القوة | Multiple lines of text | No | |
| Weaknesses | نقاط الضعف | Multiple lines of text | No | |
| Recommendations | التوصيات | Multiple lines of text | No | |
| EvaluatedBy | تم التقييم بواسطة | Single line of text | No | |

**Example Row:**
| Title | Incident_Ref | EvaluationDate | ResponseTimeMinutes | OverallScore |
|---|---|---|---|---|
| تقييم حادث حريق مدرسة الأمل | (Lookup to incident) | 2025-01-20 | 15 | 4 |

---

### 14. BC_Damage_Reports ⭐ NEW
> تقارير تقييم الأضرار (Damage assessment reports)

| Column (Internal) | Column (Arabic) | Type | Required | Notes |
|---|---|---|---|---|
| Title | عنوان التقرير | Single line of text | Yes | |
| Incident_Ref | الحادث | Lookup → SBC_Incidents_Log | Yes | Link to incident |
| School_Ref | المدرسة | Lookup → SchoolInfo | Yes | |
| ReportDate | تاريخ التقرير | Date | Yes | |
| DamageType | نوع الضرر | Choice | Yes | See choices below |
| DamageSeverity | شدة الضرر | Choice | Yes | minor, moderate, severe, total |
| AffectedArea | المنطقة المتأثرة | Single line of text | No | e.g., الفصول، المختبر |
| EstimatedCost | التكلفة التقديرية | Number | No | In SAR |
| RepairTimeEstimate | الوقت التقديري للإصلاح | Single line of text | No | e.g., أسبوعين |
| Description | وصف الأضرار | Multiple lines of text | Yes | |
| ImmediateActions | الإجراءات الفورية | Multiple lines of text | No | |
| RequiredResources | الموارد المطلوبة | Multiple lines of text | No | |
| Status | الحالة | Choice | Yes | pending, in_progress, completed |
| Attachments | الصور والمرفقات | Attachments | No | |
| PreparedBy | أُعد بواسطة | Single line of text | No | |
| ApprovedBy | اعتُمد بواسطة | Single line of text | No | |

**DamageType Choices:**
- structural (هيكلي)
- electrical (كهربائي)
- plumbing (سباكة)
- equipment (معدات)
- furniture (أثاث)
- it_infrastructure (بنية تقنية)
- other (أخرى)

**Example Row:**
| Title | School_Ref | DamageType | DamageSeverity | EstimatedCost |
|---|---|---|---|---|
| تقرير أضرار حريق | (Lookup) | electrical | moderate | 50000 |

---

### 15. BC_Mutual_Operation ⭐ NEW (CRITICAL)
> التشغيل المتبادل للمدارس (School alternatives - replaces mutualOperation.ts)

| Column (Internal) | Column (Arabic) | Type | Required | Notes |
|---|---|---|---|---|
| Title | معرف السجل | Single line of text | Yes | Auto: SchoolCode_Priority |
| School_Ref | المدرسة الأصلية | Lookup → SchoolInfo | Yes | Source school |
| AlternativeSchool_Ref | المدرسة البديلة | Lookup → SchoolInfo | Yes | Alternative school |
| Priority | الأولوية | Number | Yes | 1, 2, 3 (lower = higher priority) |
| DistanceKm | المسافة (كم) | Number | No | Distance between schools |
| Notes | ملاحظات | Multiple lines of text | No | |
| IsActive | نشط | Yes/No | Yes | Default: Yes |
| LastUpdated | آخر تحديث | Date | No | |

**Example Rows:**
| Title | School_Ref | AlternativeSchool_Ref | Priority | DistanceKm |
|---|---|---|---|---|
| 40104_1 | ابتدائية فضالة بن عمير | ابتدائية أم العيال | 1 | 7.49 |
| 40104_2 | ابتدائية فضالة بن عمير | ابتدائية الحسن البصري | 2 | 12.3 |
| 40106_1 | ابتدائية أم العيال | ابتدائية فضالة بن عمير | 1 | 7.49 |

**Important:** This list should be auto-generated from SchoolInfo whenever school data changes.

---

### 16. BC_Plan_Review ⭐ NEW
> مراجعة الخطة (Plan review tracking for Task 7)

| Column (Internal) | Column (Arabic) | Type | Required | Notes |
|---|---|---|---|---|
| Title | عنوان المراجعة | Single line of text | Yes | |
| Plan_Ref | الخطة | Lookup → BC_Shared_Plan | Yes | |
| ReviewDate | تاريخ المراجعة | Date | Yes | |
| ReviewedBy | تمت المراجعة بواسطة | Single line of text | No | |
| Task7_1_Complete | 7.1 المراجعة | Yes/No | No | |
| Task7_2_Complete | 7.2 الإجراءات | Yes/No | No | |
| Task7_3_Complete | 7.3 التوثيق | Yes/No | No | |
| Findings | نتائج المراجعة | Multiple lines of text | No | |
| ActionItems | الإجراءات المطلوبة | Multiple lines of text | No | |
| NextReviewDate | تاريخ المراجعة القادمة | Date | No | |

---

## 📊 LIST RELATIONSHIPS DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SHAREPOINT LISTS RELATIONSHIPS                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌──────────────┐                                                           │
│   │  SchoolInfo  │◄─────────────────────────────────────────────────────┐   │
│   │  (Master)    │                                                       │   │
│   └──────┬───────┘                                                       │   │
│          │                                                               │   │
│          │ Lookup                                                        │   │
│          ▼                                                               │   │
│   ┌──────────────────┐    ┌────────────────────┐                        │   │
│   │ BC_Teams_Members │    │ BC_Mutual_Operation│◄────────────────────────┤   │
│   │ (Team members)   │    │ (School→Alternative)│                        │   │
│   └──────────────────┘    └────────────────────┘                        │   │
│          │                                                               │   │
│          │                                                               │   │
│   ┌──────────────────┐    ┌────────────────────┐                        │   │
│   │  SBC_Drills_Log  │    │ School_Training_Log│                        │   │
│   │ (Drill records)  │    │ (Training records) │                        │   │
│   └──────────────────┘    └────────────────────┘                        │   │
│          │                                                               │   │
│          │                                                               │   │
│   ┌──────────────────┐    ┌────────────────────┐                        │   │
│   │SBC_Incidents_Log │◄───│BC_Incident_Evaluations│                      │   │
│   │ (Incidents)      │    │ (Post evaluations) │                        │   │
│   └────────┬─────────┘    └────────────────────┘                        │   │
│            │                                                             │   │
│            │ Lookup                                                      │   │
│            ▼                                                             │   │
│   ┌──────────────────┐                                                  │   │
│   │BC_Damage_Reports │                                                  │   │
│   │ (Damage assess)  │                                                  │   │
│   └──────────────────┘                                                  │   │
│                                                                          │   │
│                                                                          │   │
│   ┌──────────────────┐    ┌────────────────────┐                        │   │
│   │  BC_Shared_Plan  │◄───│  BC_Plan_Scenarios │                        │   │
│   │ (Main BC Plan)   │    │ (Plan scenarios)   │                        │   │
│   └────────┬─────────┘    └────────────────────┘                        │   │
│            │                                                             │   │
│            │ Lookup                                                      │   │
│            ▼                                                             │   │
│   ┌──────────────────┐                                                  │   │
│   │  BC_Plan_Review  │                                                  │   │
│   │ (Review tracking)│                                                  │   │
│   └──────────────────┘                                                  │   │
│                                                                          │   │
│                                                                          │   │
│   ┌──────────────────┐    ┌────────────────────┐    ┌─────────────────┐ │   │
│   │BC_Admin_Contacts │    │ BC_Plan_Documents  │    │ BC_Test_Plans   │ │   │
│   │ (No lookup)      │    │ (No lookup)        │    │ (No lookup)     │ │   │
│   └──────────────────┘    └────────────────────┘    └─────────────────┘ │   │
│                                                                          │   │
│   ┌──────────────────┐    ┌────────────────────┐                        │   │
│   │  BC_DR_Checklist │    │Coord_Programs_Cat  │                        │   │
│   │ (No lookup)      │    │ (No lookup)        │                        │   │
│   └──────────────────┘    └────────────────────┘                        │   │
│                                                                          │   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 LOOKUP COLUMNS SUMMARY

| List | Lookup Column | Target List | Target Column |
|---|---|---|---|
| BC_Teams_Members | SchoolName_Ref | SchoolInfo | Title |
| SBC_Drills_Log | SchoolName_Ref | SchoolInfo | Title |
| SBC_Incidents_Log | SchoolName_Ref | SchoolInfo | Title |
| School_Training_Log | SchoolName_Ref | SchoolInfo | Title |
| BC_Mutual_Operation | School_Ref | SchoolInfo | Title |
| BC_Mutual_Operation | AlternativeSchool_Ref | SchoolInfo | Title |
| BC_Damage_Reports | School_Ref | SchoolInfo | Title |
| BC_Damage_Reports | Incident_Ref | SBC_Incidents_Log | Title |
| BC_Incident_Evaluations | Incident_Ref | SBC_Incidents_Log | Title |
| BC_Plan_Scenarios | Plan_Ref | BC_Shared_Plan | Title |
| BC_Plan_Review | Plan_Ref | BC_Shared_Plan | Title |

---

## 📝 CREATION ORDER (Due to Dependencies)

Create lists in this order to handle lookup dependencies:

1. **SchoolInfo** (already exists - master data)
2. **SBC_Incidents_Log** (already exists)
3. **BC_Shared_Plan** (no lookups)
4. **BC_Admin_Contacts** (no lookups)
5. **BC_Plan_Documents** (no lookups)
6. **BC_Test_Plans** (no lookups)
7. **BC_DR_Checklist** (no lookups)
8. **Coordination_Programs_Catalog** (already exists)
9. **BC_Teams_Members** (already exists - lookup to SchoolInfo)
10. **SBC_Drills_Log** (already exists - lookup to SchoolInfo)
11. **School_Training_Log** (already exists - lookup to SchoolInfo)
12. **BC_Mutual_Operation** (lookup to SchoolInfo x2)
13. **BC_Plan_Scenarios** (lookup to BC_Shared_Plan)
14. **BC_Plan_Review** (lookup to BC_Shared_Plan)
15. **BC_Incident_Evaluations** (lookup to SBC_Incidents_Log)
16. **BC_Damage_Reports** (lookup to SchoolInfo + SBC_Incidents_Log)

---

## 🔐 SECURITY PERMISSIONS

| List | Admin | School Users |
|---|---|---|
| SchoolInfo | Full Control | Read |
| BC_Teams_Members | Full Control | Contribute (own school) |
| SBC_Drills_Log | Full Control | Contribute (own school) |
| SBC_Incidents_Log | Full Control | Contribute (own school) |
| School_Training_Log | Full Control | Contribute (own school) |
| BC_Admin_Contacts | Full Control | Read |
| BC_Plan_Documents | Full Control | Read |
| BC_Shared_Plan | Full Control | Read |
| BC_Plan_Scenarios | Full Control | Read |
| BC_Test_Plans | Full Control | Read |
| BC_Plan_Review | Full Control | Read |
| BC_DR_Checklist | Full Control | No Access |
| BC_Incident_Evaluations | Full Control | Read |
| BC_Damage_Reports | Full Control | Contribute (own school) |
| BC_Mutual_Operation | Full Control | Read |
| Coordination_Programs_Catalog | Full Control | Read |

---

## 📦 DATA MIGRATION PLAN

### From localStorage to SharePoint:

| localStorage Key | Target SharePoint List |
|---|---|
| bc_admin_contacts | BC_Admin_Contacts |
| bc_plan_documents | BC_Plan_Documents |
| bc_shared_plan | BC_Shared_Plan + BC_Plan_Scenarios |
| bc_plan_review | BC_Plan_Review |
| bc_test_plans | BC_Test_Plans |
| bc_dr_checklist | BC_DR_Checklist |
| bc_incident_evaluations | BC_Incident_Evaluations |
| bc_damage_reports | BC_Damage_Reports |

### From TypeScript to SharePoint:

| TypeScript File | Target SharePoint List |
|---|---|
| mutualOperation.ts | BC_Mutual_Operation |

---

## ✅ NEXT STEPS

1. **Create the 9 new SharePoint lists** using the specifications above
2. **Add lookup columns** after creating dependent lists
3. **Set permissions** for each list
4. **Add example data** to test
5. **Update sharepointService.ts** to add CRUD operations for new lists
6. **Migrate existing localStorage data** to SharePoint
7. **Generate BC_Mutual_Operation data** from SchoolInfo

---

*Document Version: 1.0*
*Created: December 17, 2025*
*For: BC Management System - إدارة التعليم بمنطقة المدينة المنورة*
