# دليل إنشاء قوائم SharePoint يدوياً

## الرابط المباشر
https://saudimoe.sharepoint.com/sites/em/_layouts/15/viewlsts.aspx

---

## القائمة 1: BC_Shared_Plan (خطة BC المشتركة)

### الخطوات:
1. افتح Site Contents
2. اضغط "+ New" → "List"
3. اسم القائمة: `BC_Shared_Plan`

### الأعمدة المطلوبة:
| Column Name | Type | Required |
|-------------|------|----------|
| Title | Single line of text | ✅ |
| Description | Multiple lines of text | ❌ |
| LastUpdated | Date and Time | ❌ |
| IsPublished | Yes/No | ❌ |
| Scenarios | Multiple lines of text | ❌ |
| Contacts | Multiple lines of text | ❌ |
| AlternativeSchools | Multiple lines of text | ❌ |
| DrillPlan | Multiple lines of text | ❌ |

---

## القائمة 2: BC_Plan_Review (مراجعة الخطة - المهمة 7)

### الخطوات:
1. "+ New" → "List"
2. اسم القائمة: `BC_Plan_Review`

### الأعمدة المطلوبة:
| Column Name | Type | Required |
|-------------|------|----------|
| Title | Single line of text | ✅ |
| SchoolName_Ref | Lookup (to SchoolInfo → Title) | ✅ |
| Task7_1_Complete | Yes/No | ❌ |
| Task7_2_Complete | Yes/No | ❌ |
| Task7_3_Complete | Yes/No | ❌ |
| LastUpdated | Date and Time | ❌ |
| Notes | Multiple lines of text | ❌ |

---

## القائمة 3: DR_Checklist (قائمة فحص DR)

### الخطوات:
1. "+ New" → "List"
2. اسم القائمة: `DR_Checklist`

### الأعمدة المطلوبة:
| Column Name | Type | Required |
|-------------|------|----------|
| Title | Single line of text | ✅ |
| Category | Choice (البيانات، الأنظمة، الاتصالات، المواقع البديلة، الفرق) | ✅ |
| Item | Single line of text | ✅ |
| Status | Choice (not_ready، in_progress، ready) | ✅ |
| LastChecked | Date and Time | ❌ |
| Notes | Multiple lines of text | ❌ |

---

## القائمة 4: Admin_Contacts (جهات اتصال الإدارة)

### الخطوات:
1. "+ New" → "List"
2. اسم القائمة: `Admin_Contacts`

### الأعمدة المطلوبة:
| Column Name | Type | Required |
|-------------|------|----------|
| Title | Single line of text | ✅ (الاسم) |
| Department | Single line of text | ❌ |
| Phone | Single line of text | ❌ |
| Email | Single line of text | ❌ |
| Role | Single line of text | ❌ |
| IsEmergency | Yes/No | ❌ |

---

## القائمة 5: BC_Plan_Documents (وثائق خطة BC)

### الخطوات:
1. "+ New" → "Document Library" (مكتبة مستندات)
2. اسم المكتبة: `BC_Plan_Documents`

### الأعمدة المطلوبة:
| Column Name | Type | Required |
|-------------|------|----------|
| Title | Single line of text | ✅ |
| DocumentType | Choice (خطة، دليل، نموذج، تقرير) | ❌ |
| Version | Single line of text | ❌ |
| ApprovedBy | Single line of text | ❌ |
| ApprovalDate | Date and Time | ❌ |

---

## القائمة 6: Incident_Evaluations (تقييمات الحوادث)

### الخطوات:
1. "+ New" → "List"
2. اسم القائمة: `Incident_Evaluations`

### الأعمدة المطلوبة:
| Column Name | Type | Required |
|-------------|------|----------|
| Title | Single line of text | ✅ |
| Incident_Ref | Lookup (to SBC_Incidents_Log → Title) | ✅ |
| SchoolName_Ref | Lookup (to SchoolInfo → Title) | ✅ |
| ResponseTime | Number | ❌ |
| EffectivenessRating | Number (1-5) | ❌ |
| LessonsLearned | Multiple lines of text | ❌ |
| Recommendations | Multiple lines of text | ❌ |
| EvaluationDate | Date and Time | ❌ |
| EvaluatedBy | Single line of text | ❌ |

---

## القائمة 7: Damage_Reports (تقارير الأضرار)

### الخطوات:
1. "+ New" → "List"
2. اسم القائمة: `Damage_Reports`

### الأعمدة المطلوبة:
| Column Name | Type | Required |
|-------------|------|----------|
| Title | Single line of text | ✅ |
| SchoolName_Ref | Lookup (to SchoolInfo → Title) | ✅ |
| Incident_Ref | Lookup (to SBC_Incidents_Log → Title) | ❌ |
| DamageType | Choice (مبنى، معدات، بنية تحتية، أخرى) | ✅ |
| DamageLevel | Choice (خفيف، متوسط، شديد، كلي) | ✅ |
| Description | Multiple lines of text | ❌ |
| EstimatedCost | Number | ❌ |
| RepairStatus | Choice (قيد التقييم، معتمد، قيد الإصلاح، مكتمل) | ❌ |
| ReportDate | Date and Time | ❌ |
| Photos | Hyperlink or Picture | ❌ |

---

## كيفية إضافة عمود Lookup

1. افتح القائمة
2. اضغط "+ Add column" → "Show/hide columns"
3. اضغط "+ Add column" → "More..."
4. اختر "Lookup"
5. في "Get information from": اختر القائمة المصدر
6. في "In this column": اختر العمود (عادة Title)
7. اضغط OK

---

## بعد إنشاء القوائم

أخبرني بعد إنشائها لأقوم بتحديث الكود لاستخدام SharePoint بدلاً من localStorage.
