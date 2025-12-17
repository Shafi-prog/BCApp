# دليل إنشاء قوائم SharePoint يدوياً

## المتطلبات
- الوصول إلى موقع SharePoint: https://saudimoe.sharepoint.com/sites/em
- صلاحيات إنشاء قوائم (Site Owner أو Site Collection Admin)

---

## القوائم المطلوب إنشاؤها (7 قوائم جديدة)

### 1. BC_Shared_Plan (خطة الاستمرارية المشتركة)

**الغرض:** تخزين خطة استمرارية العمل المشتركة بين المدارس

**الأعمدة:**
| اسم العمود | النوع | ملاحظات |
|------------|------|---------|
| Title | Single line of text | (موجود افتراضياً) - اسم الخطة |
| PlanDescription | Multiple lines of text | وصف الخطة |
| ScenariosJSON | Multiple lines of text | سيناريوهات الطوارئ (JSON) |
| ContactsJSON | Multiple lines of text | جهات الاتصال (JSON) |
| AlternativeSchoolsJSON | Multiple lines of text | المدارس البديلة (JSON) |
| DrillPlanJSON | Multiple lines of text | خطة التمارين (JSON) |
| IsPublished | Yes/No | هل تم نشر الخطة |
| LastUpdated | Date and Time | تاريخ آخر تحديث |
| PublishedBy | Single line of text | من قام بالنشر |
| Version | Number | رقم الإصدار |

---

### 2. BC_Plan_Review (مراجعة الخطة - المهمة 7)

**الغرض:** تتبع مراجعة واختبار الخطة (المهام الفرعية للمهمة 7)

**الأعمدة:**
| اسم العمود | النوع | ملاحظات |
|------------|------|---------|
| Title | Single line of text | (موجود افتراضياً) |
| SchoolName_Ref | Lookup | مرجع إلى قائمة SBC_Schools |
| Task7_1_Complete | Yes/No | مراجعة الخطة مكتملة |
| Task7_2_Complete | Yes/No | اختبار الخطة مكتمل |
| Task7_3_Complete | Yes/No | تحديث الخطة مكتمل |
| ReviewNotes | Multiple lines of text | ملاحظات المراجعة |
| LastUpdated | Date and Time | تاريخ آخر تحديث |
| ReviewedBy | Single line of text | من قام بالمراجعة |

---

### 3. BC_DR_Checklist (قائمة التحقق من الكوارث)

**الغرض:** قائمة تحقق للتعافي من الكوارث

**الأعمدة:**
| اسم العمود | النوع | ملاحظات |
|------------|------|---------|
| Title | Single line of text | (موجود افتراضياً) - عنصر القائمة |
| Category | Choice | الفئة: Emergency,Recovery,Communication,IT,Facilities |
| ItemDescription | Single line of text | وصف العنصر |
| Status | Choice | الحالة: NotStarted,InProgress,Completed,NA |
| LastChecked | Date and Time | تاريخ آخر فحص |
| Notes | Multiple lines of text | ملاحظات |
| CheckedBy | Single line of text | من قام بالفحص |
| Priority | Choice | الأولوية: High,Medium,Low |

---

### 4. BC_Admin_Contacts (جهات اتصال الإدارة)

**الغرض:** جهات اتصال الإدارة للطوارئ

**الأعمدة:**
| اسم العمود | النوع | ملاحظات |
|------------|------|---------|
| Title | Single line of text | (موجود افتراضياً) |
| ContactName | Single line of text | اسم جهة الاتصال |
| ContactRole | Single line of text | الدور/المنصب |
| ContactPhone | Single line of text | رقم الهاتف |
| ContactEmail | Single line of text | البريد الإلكتروني |
| ContactEntity | Choice | الجهة: Ministry,Hospital,Police,CivilDefense,Other |
| IsActive | Yes/No | نشط |
| Notes | Multiple lines of text | ملاحظات |

---

### 5. BC_Plan_Documents (وثائق الخطة)

**الغرض:** الوثائق والمرفقات المتعلقة بالخطة

**الأعمدة:**
| اسم العمود | النوع | ملاحظات |
|------------|------|---------|
| Title | Single line of text | (موجود افتراضياً) - اسم الوثيقة |
| DocumentType | Choice | النوع: Plan,Procedure,Form,Report,Other |
| DocumentDescription | Multiple lines of text | وصف الوثيقة |
| DocumentURL | Hyperlink | رابط الوثيقة |
| UploadDate | Date and Time | تاريخ الرفع |
| UploadedBy | Single line of text | من قام بالرفع |
| DocVersion | Single line of text | إصدار الوثيقة |
| IsActive | Yes/No | نشط |

---

### 6. BC_Incident_Evaluations (تقييم الحوادث)

**الغرض:** تقييم الاستجابة للحوادث

**الأعمدة:**
| اسم العمود | النوع | ملاحظات |
|------------|------|---------|
| Title | Single line of text | (موجود افتراضياً) - عنوان التقييم |
| IncidentRef | Lookup | مرجع إلى قائمة SBC_Incidents |
| SchoolName_Ref | Lookup | مرجع إلى قائمة SBC_Schools |
| ResponseRating | Number | تقييم الاستجابة (1-5) |
| CommunicationRating | Number | تقييم التواصل (1-5) |
| RecoveryRating | Number | تقييم التعافي (1-5) |
| OverallRating | Number | التقييم العام (1-5) |
| LessonsLearned | Multiple lines of text | الدروس المستفادة |
| Recommendations | Multiple lines of text | التوصيات |
| EvaluatedBy | Single line of text | من قام بالتقييم |
| EvaluationDate | Date and Time | تاريخ التقييم |

---

### 7. BC_Damage_Reports (تقارير الأضرار)

**الغرض:** توثيق الأضرار الناتجة عن الحوادث

**الأعمدة:**
| اسم العمود | النوع | ملاحظات |
|------------|------|---------|
| Title | Single line of text | (موجود افتراضياً) - عنوان التقرير |
| SchoolName_Ref | Lookup | مرجع إلى قائمة SBC_Schools |
| IncidentRef | Lookup | مرجع إلى قائمة SBC_Incidents |
| DamageType | Choice | نوع الضرر: Building,Equipment,Vehicles,Documents,Other |
| DamageDescription | Multiple lines of text | وصف الضرر |
| DamageSeverity | Choice | شدة الضرر: Minor,Moderate,Major,Critical |
| EstimatedCost | Number | التكلفة التقديرية |
| RepairStatus | Choice | حالة الإصلاح: Pending,InProgress,Completed,CannotRepair |
| ReportDate | Date and Time | تاريخ التقرير |
| ReportedBy | Single line of text | من قام بالإبلاغ |
| AttachmentURL | Hyperlink | رابط المرفقات |

---

## تحديث قائمة موجودة

### SBC_Drills_Log (إضافة حقول التقييم)

**الأعمدة الجديدة المطلوب إضافتها:**
| اسم العمود | النوع | ملاحظات |
|------------|------|---------|
| SafetyProceduresRating | Number | تقييم إجراءات السلامة (1-5) |
| EvacuationTimeRating | Number | تقييم وقت الإخلاء (1-5) |
| CommunicationRating | Number | تقييم التواصل (1-5) |
| TeamCoordinationRating | Number | تقييم تنسيق الفريق (1-5) |
| OverallRating | Number | التقييم العام (1-5) |
| RatingNotes | Multiple lines of text | ملاحظات التقييم |

---

## خطوات إنشاء قائمة في SharePoint

1. اذهب إلى موقع SharePoint: https://saudimoe.sharepoint.com/sites/em
2. انقر على **⚙️ Settings** (الإعدادات) → **Site Contents** (محتويات الموقع)
3. انقر على **+ New** → **List**
4. اختر **Blank list**
5. أدخل اسم القائمة (مثل: BC_Shared_Plan)
6. انقر **Create**

### إضافة الأعمدة:
1. افتح القائمة
2. انقر **+ Add column**
3. اختر نوع العمود المناسب
4. أدخل اسم العمود
5. اضبط الخيارات المطلوبة
6. انقر **Save**

### لأعمدة Choice (الاختيار):
1. اختر **Choice** عند إضافة العمود
2. أدخل الخيارات كل خيار في سطر جديد
3. اختر إذا كان يمكن تحديد خيار واحد أو عدة خيارات

### لأعمدة Lookup (المرجع):
1. اختر **Lookup**
2. حدد القائمة المصدر (مثل: SBC_Schools)
3. حدد العمود الذي سيظهر (عادة Title)

---

## ملاحظات هامة

⚠️ **تأكد من:**
- استخدام أسماء الأعمدة بالإنجليزية بالضبط كما هي مكتوبة
- تفعيل الإصدارات (Versioning) للقوائم المهمة
- ضبط الصلاحيات المناسبة لكل قائمة

📋 **بعد إنشاء القوائم:**
- قم بتحديث ملف `sharepointService.ts` ليستخدم القوائم الجديدة
- احذف استخدام localStorage للبيانات المنقولة
