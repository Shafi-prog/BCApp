# معمارية قوائم SharePoint لنظام استمرارية الأعمال
# SharePoint Lists Architecture for BC System

## المبدأ: كل كيان في قائمة منفصلة (Normalized Design)

---

## 📊 القوائم الموجودة (6 قوائم)

| # | List Name | الغرض | الحالة |
|---|-----------|--------|--------|
| 1 | SchoolInfo | بيانات المدارس | ✅ موجودة |
| 2 | SBC_Team_Members | أعضاء فريق BC | ✅ موجودة |
| 3 | SBC_Drills_Log | تمارين الطوارئ + خطط الإدارة | ✅ موجودة |
| 4 | SBC_Incidents_Log | سجل الحوادث | ✅ موجودة |
| 5 | SBC_Training_Log | سجل التدريب | ✅ موجودة |
| 6 | SBC_Tasks | المهام | ✅ موجودة |

---

## 📋 القوائم المطلوب إنشاؤها (4 قوائم فقط)

### 1️⃣ BC_Admin_Settings (إعدادات الإدارة - قائمة واحدة للإعدادات)

**الغرض:** تخزين إعدادات النظام والخطة المشتركة (سجل واحد فقط)

| Column | Type | Description |
|--------|------|-------------|
| Title | Text | "BC_Settings" (ثابت) |
| PlanTitle | Text | عنوان خطة BC |
| PlanDescription | Note | وصف الخطة |
| ScenariosJSON | Note | السيناريوهات (JSON) |
| EmergencyContactsJSON | Note | جهات الاتصال الطارئة (JSON) |
| AlternativeSchoolsJSON | Note | المدارس البديلة (JSON) |
| DrillPlanJSON | Note | خطة التمارين الفصلية (JSON) |
| IsPublished | Yes/No | هل تم نشر الخطة |
| PublishDate | DateTime | تاريخ النشر |
| ReviewPeriodMonths | Number | فترة المراجعة (بالأشهر) |
| NextReviewDate | DateTime | تاريخ المراجعة القادمة |
| Task1_1_Complete | Yes/No | إعداد الخطة |
| Task1_2_Complete | Yes/No | السيناريوهات |
| Task1_3_Complete | Yes/No | النشر |
| Task1_4_Complete | Yes/No | التحديث الدوري |
| Task7_1_Complete | Yes/No | مراجعة الخطط |
| Task7_2_Complete | Yes/No | إجراءات الاستجابة |
| Task7_3_Complete | Yes/No | التوثيق والاعتماد |
| ReviewNotes | Note | ملاحظات المراجعة |
| ResponseProceduresJSON | Note | إجراءات الاستجابة (JSON) |
| LastUpdated | DateTime | آخر تحديث |
| UpdatedBy | Text | من قام بالتحديث |

---

### 2️⃣ BC_DR_Checklist (قائمة فحص التعافي من الكوارث)

**الغرض:** عناصر فحص جاهزية التعافي من الكوارث

| Column | Type | Choices |
|--------|------|---------|
| Title | Text | عنوان العنصر |
| Category | Choice | البيانات، الأنظمة، الاتصالات، المواقع البديلة، الفرق |
| ItemDescription | Text | وصف تفصيلي |
| Status | Choice | ready, partial, not_ready |
| Priority | Choice | High, Medium, Low |
| LastChecked | DateTime | تاريخ آخر فحص |
| CheckedBy | Text | من قام بالفحص |
| Notes | Note | ملاحظات |

---

### 3️⃣ BC_External_Contacts (جهات الاتصال الخارجية)

**الغرض:** جهات اتصال الطوارئ الخارجية (دفاع مدني، صحة، شرطة، إلخ)

| Column | Type | Choices |
|--------|------|---------|
| Title | Text | اسم الجهة |
| ContactPerson | Text | اسم الشخص |
| Department | Text | القسم/الإدارة |
| Phone1 | Text | الهاتف الأساسي |
| Phone2 | Text | الهاتف البديل |
| Email | Text | البريد الإلكتروني |
| EntityType | Choice | Ministry, CivilDefense, Health, Police, RedCrescent, Other |
| IsEmergency | Yes/No | للطوارئ |
| IsActive | Yes/No | نشط |
| Notes | Note | ملاحظات |

---

### 4️⃣ BC_Incident_Evaluations (تقييمات الحوادث)

**الغرض:** تقييم الاستجابة للحوادث بعد وقوعها

| Column | Type | Description |
|--------|------|-------------|
| Title | Text | عنوان التقييم |
| IncidentRef | Lookup | مرجع للحادثة (SBC_Incidents_Log) |
| SchoolRef | Lookup | مرجع للمدرسة (SchoolInfo) |
| ResponseTimeMinutes | Number | زمن الاستجابة (دقائق) |
| EvacuationRating | Number | تقييم الإخلاء (1-5) |
| CommunicationRating | Number | تقييم التواصل (1-5) |
| CoordinationRating | Number | تقييم التنسيق (1-5) |
| OverallRating | Number | التقييم العام (1-5) |
| StrengthPoints | Note | نقاط القوة |
| ImprovementAreas | Note | مجالات التحسين |
| Recommendations | Note | التوصيات |
| EvaluatedBy | Text | المُقيّم |
| EvaluationDate | DateTime | تاريخ التقييم |

---

## 🔗 العلاقات بين القوائم

```
SchoolInfo (المدارس)
    ├── SBC_Team_Members (أعضاء الفريق) - SchoolName_Ref
    ├── SBC_Drills_Log (التمارين) - SchoolName_Ref
    ├── SBC_Incidents_Log (الحوادث) - SchoolName_Ref
    ├── SBC_Training_Log (التدريب) - SchoolName_Ref
    └── BC_Incident_Evaluations (التقييمات) - SchoolRef

SBC_Incidents_Log (الحوادث)
    └── BC_Incident_Evaluations (التقييمات) - IncidentRef

BC_Admin_Settings (إعدادات الإدارة)
    └── سجل واحد فقط يحتوي كل إعدادات النظام
```

---

## 📁 بديل: مكتبة مستندات للوثائق

إذا كنت تحتاج رفع ملفات (PDF, Word, etc.):

### BC_Documents (Document Library)

| Column | Type |
|--------|------|
| Title | Text |
| DocumentType | Choice (Plan, Procedure, Report, Form) |
| Version | Text |
| ApprovedBy | Text |
| ApprovalDate | DateTime |
| RelatedTask | Choice (Task1-Task25) |

---

## ✅ لماذا هذه المعمارية مثالية؟

1. **فصل واضح للمسؤوليات** - كل قائمة لغرض واحد
2. **سهولة الاستعلام** - فلترة سريعة لكل نوع بيانات
3. **صلاحيات مرنة** - يمكن تحديد صلاحيات مختلفة لكل قائمة
4. **أداء عالي** - لا أعمدة فارغة غير مستخدمة
5. **قابلة للتوسع** - سهل إضافة أعمدة جديدة
6. **تتبع التغييرات** - كل قائمة لها سجل إصدارات منفصل

---

## 🚀 خطة التنفيذ

### المرحلة 1: إنشاء القوائم (يدوياً من SharePoint)
1. BC_Admin_Settings ← أولوية عالية
2. BC_DR_Checklist
3. BC_External_Contacts
4. BC_Incident_Evaluations

### المرحلة 2: تحديث الكود
- إضافة services لكل قائمة جديدة
- استبدال localStorage بـ SharePoint

### المرحلة 3: نقل البيانات
- نقل البيانات من localStorage إلى SharePoint
