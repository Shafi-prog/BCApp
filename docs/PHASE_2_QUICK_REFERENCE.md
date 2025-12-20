# ⚡ PHASE 2 QUICK REFERENCE

**Print This Page** - Quick lookup during testing

---

## Test Links

| Test | URL | Expected Tab |
|------|-----|--------------|
| Damage Reports | `/admin?tab=damage` | تقييم الأضرار |
| Admin Contacts | `/admin?tab=contacts` | جهات الاتصال |
| Drills | `/drills` | Main page |
| Training | `/training` | Main page |
| Incidents | `/incidents` | Main page |

---

## SharePoint Lists to Verify

| List Name | Test | Records Should Have |
|-----------|------|-------------------|
| BC_Damage_Reports | Add, Edit, Delete | Building Damage, Equipment Damage, Cost |
| BC_Admin_Contacts | Add, Edit, Delete | Name, Role, Phone, Email |
| SBC_Drills_Log | Create drill | DrillHypothesis, TargetGroup |
| SBC_Incidents_Log | Report incident | IncidentCategory, RiskLevel |
| School_Training_Log | Register | AttendanceMode, Provider |

---

## Choice Field Values to Verify

### Drills
```
DrillHypothesis (5 options):
□ الفرضية الأولى: تعذر استخدام المبنى...
□ الفرضية الثانية: تعطل الأنظمة...
□ الفرضية الثالثة: تعطل خدمة البث...
□ الفرضية الرابعة: انقطاع الخدمات...
□ الفرضية الخامسة: نقص الكوادر...

TargetGroup (4 options):
□ إخلاء كامل
□ تمرين مكتبي
□ محاكاة تقنية
□ إخلاء جزئي
```

### Training
```
Provider (5+ options):
□ إدارة الأمن والسلامة
□ إدارة التدريب
□ الدفاع المدني
□ الهلال الأحمر
□ جهة خارجية

ExecutionMode (3 options):
□ حضوري
□ عن بعد
□ مدمج
```

### Incidents
```
IncidentCategory (6 options):
□ تعطل البنية التحتية
□ نقص الموارد البشرية
□ تعطل الأنظمة/المنصات
□ تعطل البث التلفزيوني
□ اضطراب أمني
□ فقدان الاتصالات

RiskLevel (varies by category):
For تعطل البنية التحتية:
  □ ليوم واحد
  □ 1-3 أيام
  □ 3+ أيام
```

---

## Test Checklist (Quick Version)

### Damage Reports
- [ ] Load /admin?tab=damage
- [ ] Add report
- [ ] Edit report
- [ ] Delete report
- [ ] Verify in SharePoint

### Choice Fields
- [ ] Drills: Hypothesis dropdown loads
- [ ] Drills: Target Group dropdown loads
- [ ] Training: Provider dropdown loads
- [ ] Training: Execution Mode loads
- [ ] Incidents: Category dropdown loads
- [ ] Incidents: Risk level changes by category
- [ ] Incidents: Alert type auto-assigned

### Admin Contacts
- [ ] Load /admin?tab=contacts
- [ ] Add contact
- [ ] Edit contact
- [ ] Delete contact
- [ ] Verify in SharePoint

---

## Common Issues & Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Dropdown empty | Hard refresh (Ctrl+F5), check console |
| Save fails | Check all required fields filled |
| Data not in SharePoint | Wait 5-10 sec, refresh SharePoint |
| Console error | Read error message, check SharePoint connection |
| Slowness | Normal - first load slower, check network tab |

---

## Error Messages & Meanings

```
"فشل تحميل البيانات"
→ SharePoint connection problem
→ Fix: Check internet, refresh, try again

"حقل مطلوب"
→ Required field not filled
→ Fix: Fill the marked field, try again

"فشل حفظ..."
→ SaveToSharePoint failed
→ Fix: Check permissions, try again, check SharePoint

"لا توجد بيانات"
→ No records in list
→ Fix: Normal - list is empty, add records
```

---

## Browser Console (F12) Checklist

**Check For:**
```
❌ Red errors (X errors)
⚠️ Yellow warnings (might be OK)
ℹ️ Blue info messages (ignore)

Network Tab:
✅ All requests 200-399 status
❌ Red 404, 500 errors = problem
⏱️ Slow requests (>3 sec) = investigate
```

---

## Test Data Templates

### Damage Report
```
Incident: [Select from list or type]
Date: [Today]
Building Damage: متوسط
Equipment Damage: طفيف
Data Loss: لا يوجد
Cost: 50000 ريال
Recovery: 48 ساعة
Status: تم التقييم
Notes: تقرير اختبار
```

### Admin Contact
```
Name: محمد السلمي
Role: منسق الأمن والسلامة
Organization: الأمن والسلامة
Phone: 0501234567
Email: test@example.com
Category: internal
```

### Drill
```
Hypothesis: [Pick any]
TargetGroup: [Pick any]
Date: [Today]
Notes: اختبار الحقول
```

### Incident
```
Title: اضطراب اختبار
Category: تعطل البنية التحتية
RiskLevel: [Will update based on category]
Date: [Today]
AffectedStudents: 100
```

---

## Test Execution Timeline

```
Monday AM:    BC_Damage_Reports (1 hr)
Monday AM:    Choice Fields (2 hrs)
Monday PM:    Admin Contacts (1 hr)
Monday PM:    Issue Investigation (2 hrs)
Tuesday:      Fix Issues (4-8 hrs)
Wednesday AM: Documentation (2 hrs)
Wednesday PM: Phase 3 Planning
```

**Total: 2-3 Days**

---

## Success Definition

| Component | Success = |
|-----------|-----------|
| Damage Reports | Add/Edit/Delete works, saves to SharePoint |
| Drills | Dropdowns load, options correct, save works |
| Training | Dropdowns load, options correct, save works |
| Incidents | Category changes trigger risk level options, alert auto-assigned |
| Contacts | Add/Edit/Delete works, bidirectional sync |

---

## Key Contacts

| Role | Name/Team | Contact |
|------|-----------|---------|
| SharePoint Admin | [Your team] | [Contact info] |
| App Owner | [Name] | [Contact info] |
| QA Lead | [Your name] | [Contact info] |
| Dev Support | [Team] | [Contact info] |

---

## Resources

| What | Where |
|------|-------|
| Phase 2 Testing Guide | PHASE_2_TESTING_GUIDE.md |
| Phase 2 Execution Plan | PHASE_2_EXECUTION_PLAN.md |
| Phase 2 Start Info | PHASE_2_START.md |
| Phase 1 Completion Report | PHASE_1_COMPLETION_REPORT.md |
| Complete System Audit | COMPLETE_AUDIT_REPORT.md |

---

## Status Tracking

```
Day 1:
Morning:  □ Damage Reports
Morning:  □ Choice Fields (Drills, Training)
Afternoon:□ Choice Fields (Incidents)
Evening:  □ Admin Contacts

Day 2:
All Day:  □ Fix Issues (if any)

Day 3:
Morning:  □ Documentation
Afternoon:□ Phase 3 Planning
```

---

**Print & Keep Handy During Testing!**

Last Updated: December 20, 2025

