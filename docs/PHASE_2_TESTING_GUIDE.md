# 🧪 PHASE 2 TESTING GUIDE

**Status:** Ready to Execute  
**Estimated Time:** 2-3 hours  
**Scope:** 5 test areas, 20+ individual tests  

---

## Before You Start

✅ Build successfully compiled  
✅ App is running  
✅ Logged in as Admin user  
✅ Browser console ready (F12)  
✅ SharePoint lists accessible  

---

## Test Suite 1: BC_Damage_Reports (30 minutes)

### Prerequisites
- Admin user with access to /admin page
- At least one incident in SBC_Incidents_Log
- BC_Damage_Reports list in SharePoint

### Test 1.1: Load Damage Reports Tab

**Steps:**
1. Navigate to: `/admin?tab=damage`
2. Wait for page to load
3. Check what appears

**Expected Results:**
- ✅ "تقييم الأضرار" tab is selected
- ✅ Empty list shows "لا توجد تقارير تقييم أضرار"
- ✅ "إضافة تقرير تقييم" button is visible
- ✅ No console errors (F12 → Console)

**If It Fails:**
- Check browser console for error details
- Verify AdminDataService.getDamageReports() is callable
- Check if BC_Damage_Reports list exists in SharePoint
- Try hard refresh (Ctrl+F5)

---

### Test 1.2: Add Damage Report

**Steps:**
1. Click "إضافة تقرير تقييم" button
2. Panel should open on right side
3. Fill in the form:
   - **Incident (الحادث):** Select from dropdown (or type manually)
   - **Date (التاريخ):** Use today's date
   - **Building Damage (أضرار المبنى):** Select "متوسط"
   - **Equipment Damage (أضرار المعدات):** Select "طفيف"
   - **Data Loss (فقدان البيانات):** Select "لا يوجد"
   - **Estimated Cost (التكلفة التقديرية):** "50000 ريال"
   - **Recovery Time (الوقت المتوقع للاستعادة):** "48 ساعة"
   - **Status (حالة التقييم):** Select "تم التقييم"
   - **Notes (ملاحظات):** "تقرير اختبار"

4. Click "حفظ" button

**Expected Results:**
- ✅ Green success message: "تم إضافة تقرير الأضرار بنجاح"
- ✅ Panel closes automatically
- ✅ New report appears in the list
- ✅ Report shows all filled data
- ✅ No console errors

**Verification in SharePoint:**
- Go to SharePoint → BC_Damage_Reports list
- Should see new record with your data
- All fields populated correctly

**If It Fails:**
- Check error message in red bar
- Verify all required fields filled (Incident is required)
- Check SharePoint connection working
- Look for error in browser console (F12)

---

### Test 1.3: Edit Damage Report

**Steps:**
1. Click the Edit button (pencil icon) on the report you just added
2. Panel opens with pre-filled data
3. Change some fields:
   - Building Damage: Change to "كبير"
   - Notes: Add " - تم التحديث"
4. Click "حفظ" button

**Expected Results:**
- ✅ Green success message: "تم تحديث تقرير الأضرار بنجاح"
- ✅ Panel closes
- ✅ Report updates in list
- ✅ Building Damage now shows "كبير"
- ✅ Notes show updated text

**Verification in SharePoint:**
- Refresh BC_Damage_Reports in SharePoint
- Changes should be visible

**If It Fails:**
- Check error message
- Verify SharePoint list permissions
- Check browser console for errors

---

### Test 1.4: Delete Damage Report

**Steps:**
1. Click Delete button (trash icon) on the report
2. Report should be removed from list
3. Page might refresh

**Expected Results:**
- ✅ Green success message: "تم حذف تقرير الأضرار بنجاح"
- ✅ Report removed from list
- ✅ List shows empty or other reports if they exist

**Verification in SharePoint:**
- Check BC_Damage_Reports in SharePoint
- Record should be gone

**If It Fails:**
- Check error message
- Verify delete permissions in SharePoint
- Try again after page refresh

---

### Test 1.5: Error Handling

**Steps:**
1. Try to save without incident (incident is required)
2. Click "حفظ" without filling "الحادث" field

**Expected Results:**
- ✅ "حفظ" button is disabled (grayed out)
- ✅ No error message (expected - can't submit)
- OR if button is enabled and clicked:
- ✅ Error message appears in red
- ✅ Details what's missing

**If It Fails:**
- Check that validation is working
- Incident field should be required

---

## Test Suite 2: Drills Choice Fields (20 minutes)

### Prerequisites
- Access to /drills page
- Admin or school user role

### Test 2.1: Verify Drill Hypothesis Dropdown

**Steps:**
1. Go to `/drills` page
2. Click "إضافة تمرين جديد" button
3. Look at "فرضية الاضطراب" dropdown
4. Click to open dropdown
5. List all options

**Expected Results:**
- ✅ Dropdown shows 5+ options
- ✅ Options include:
  - الفرضية الأولى: تعذر استخدام المبنى المدرسي...
  - الفرضية الثانية: تعطل الأنظمة...
  - الفرضية الثالثة: تعطل خدمة البث...
  - الفرضية الرابعة: انقطاع الخدمات الأساسية...
  - الفرضية الخامسة: نقص الكوادر البشرية...

**What This Tests:**
- ✅ Hardcoded fallback values are working
- ✅ Dynamic loading from SharePoint attempted

**If Options Are Different:**
- SharePoint choice field might have custom values
- That's OK - means SharePoint values are loading
- Just verify options are reasonable

**If Options Missing:**
- Check browser console for errors loading choice field
- Fallback to hardcoded should still show something

---

### Test 2.2: Verify Target Group Dropdown

**Steps:**
1. Same page, scroll to "الفئة المستهدفة" dropdown
2. Click to open
3. List all options

**Expected Results:**
- ✅ Shows 4+ options including:
  - إخلاء كامل (طلاب ومعلمين)
  - تمرين مكتبي (فريق الأمن والسلامة فقط)
  - محاكاة تقنية (عن بعد)
  - إخلاء جزئي

**If It Fails:**
- Check browser console (F12)
- Look for errors loading choice fields

---

### Test 2.3: Create Drill with Choice Fields

**Steps:**
1. Fill in drill form:
   - فرضية الاضطراب: Select any option
   - الفئة المستهدفة: Select any option
   - تاريخ التمرين: Today's date
   - ملاحظات: "اختبار الحقول"

2. Click Save

**Expected Results:**
- ✅ Green success message
- ✅ Drill appears in list
- ✅ Choice field values saved

**Verification in SharePoint:**
- Check SBC_Drills_Log
- Drill should exist with correct hypothesis and target group

**If It Fails:**
- Check form validation
- Verify all required fields filled
- Check console for save errors

---

## Test Suite 3: Training Choice Fields (20 minutes)

### Prerequisites
- Access to /training page
- Admin or school user role

### Test 3.1: Verify Training Provider Options

**Steps:**
1. Go to `/training` page
2. Click "إضافة تدريب جديد" button (if available)
3. Look for "جهة التدريب" or "مزود البرنامج" field
4. Click dropdown

**Expected Results:**
- ✅ Shows options like:
  - إدارة الأمن والسلامة المدرسية
  - إدارة التدريب والابتعاث
  - الدفاع المدني
  - الهلال الأحمر
  - جهة خارجية

**What This Tests:**
- Hardcoded fallback for provider entity options

---

### Test 3.2: Verify Activity Type Options

**Steps:**
1. Look for "نوع النشاط" field
2. Click dropdown

**Expected Results:**
- ✅ Shows options like:
  - ورشة عمل
  - دورة تدريبية
  - محاضرة
  - ندوة
  - لقاء

---

### Test 3.3: Verify Execution Mode

**Steps:**
1. Look for "طريقة التنفيذ" or similar field
2. Click dropdown

**Expected Results:**
- ✅ Shows options:
  - حضوري (in-person)
  - عن بعد (remote)
  - مدمج (hybrid)

---

### Test 3.4: Test Registration Process

**Steps:**
1. If on training page as school user
2. Select a training program
3. Try to register
4. Fill in registration form
5. Submit

**Expected Results:**
- ✅ Registration saves to School_Training_Log
- ✅ Status shows "تم التسجيل" or similar
- ✅ Attendee list updates

**Verification in SharePoint:**
- Check School_Training_Log
- Should see new registration record

---

## Test Suite 4: Incidents Choice Fields (20 minutes)

### Prerequisites
- Access to /incidents page
- Admin or school user role

### Test 4.1: Verify Incident Category Dropdown

**Steps:**
1. Go to `/incidents` page
2. Click "تسجيل اضطراب جديد" button
3. Look for "نوع الاضطراب" or "فئة الحادث" dropdown
4. Click to open

**Expected Results:**
- ✅ Shows 6 incident categories:
  - تعطل البنية التحتية
  - نقص الموارد البشرية
  - تعطل الأنظمة/المنصات التعليمية
  - تعطل البث التلفزيوني
  - اضطراب أمني
  - فقدان الاتصالات/الإنترنت

**What This Tests:**
- Choice field loading from SBC_Incidents_Log

---

### Test 4.2: Verify Risk Level Updates

**Steps:**
1. Select "تعطل البنية التحتية" from incident category
2. Look for "درجة التأثير" or "Risk Level" dropdown
3. Click to open

**Expected Results:**
- ✅ Shows 3 options (for this category):
  - تعذر استخدام المبنى المدرسي ليوم واحد
  - تعذر استخدام المبنى المدرسي لأكثر من يوم واحد إلى 3 أيام
  - تعذر استخدام المبنى المدرسي لأكثر من ثلاثة أيام إلى شهر

4. Change category to "نقص الموارد البشرية"
5. Check risk level dropdown again

**Expected Results:**
- ✅ Risk level options change to 4 items:
  - غياب أقل من 30% من المعلمين
  - غياب أكثر من 30% من المعلمين
  - غياب أكثر من 60% من المعلمين
  - غياب كافة المعلمين

**What This Tests:**
- Risk levels are dynamically filtered based on category
- Mapping is working correctly

---

### Test 4.3: Verify Alert Type Assignment

**Steps:**
1. Select "تعطل البنية التحتية"
2. Select "تعذر استخدام المبنى المدرسي ليوم واحد" (first option)
3. Check if alert type shows: "1. أخضر (نموذج رصد ومراقبة)"

4. Select "تعذر استخدام المبنى المدرسي لأكثر من يوم واحد إلى 3 أيام" (second option)
5. Check if alert type shows: "2. أصفر (نموذج تحذير)"

6. Select "تعذر استخدام المبنى المدرسي لأكثر من ثلاثة أيام إلى شهر" (third option)
7. Check if alert type shows: "3. أحمر (نموذج إنذار)"

**Expected Results:**
- ✅ Alert type changes based on risk level position
- ✅ Position 1 in group → Green
- ✅ Position 2 in group → Yellow
- ✅ Position 3+ in group → Red

**What This Tests:**
- Automatic alert level assignment working
- getAlertTypeForRiskLevel() function working

---

### Test 4.4: Test Incident Report Submission

**Steps:**
1. Fill in complete incident form:
   - Title: "اختبار الاضطراب"
   - Category: "تعطل البنية التحتية"
   - Risk Level: First option
   - Date: Today
   - Affected Students: "100"

2. Click Save

**Expected Results:**
- ✅ Green success message
- ✅ Incident appears in list
- ✅ Alert type shows correctly

**Verification in SharePoint:**
- Check SBC_Incidents_Log
- Should see new incident with category and alert type

---

## Test Suite 5: BC_Admin_Contacts Sync (30 minutes)

### Prerequisites
- Admin user logged in
- Access to /admin page
- BC_Admin_Contacts list in SharePoint

### Test 5.1: Load Contacts Tab

**Steps:**
1. Navigate to `/admin?tab=contacts`
2. Wait for load

**Expected Results:**
- ✅ Contacts tab selected
- ✅ Shows list of existing contacts (or empty if none)
- ✅ "إضافة جهة اتصال" button visible
- ✅ No console errors

---

### Test 5.2: Add Contact with All Fields

**Steps:**
1. Click "إضافة جهة اتصال" button
2. Fill in form:
   - **Name (الاسم):** "محمد السلمي"
   - **Role (المنصب):** "منسق الأمن والسلامة"
   - **Organization:** "الأمن والسلامة"
   - **Phone (الهاتف):** "0501234567"
   - **Email:** "mohammed@example.com"
   - **Category:** "internal"
   - **Contact Scope:** "إدارة التعليم"
   - **Contact Timing:** "عند وجود اضطراب"
   - **Backup Member:** "أحمد علي"
   - **Notes:** "جهة اتصال اختبار"

3. Click Save

**Expected Results:**
- ✅ Green success message: "تم إضافة جهة اتصال بنجاح"
- ✅ Panel closes
- ✅ Contact appears in list with all data

**Verification in SharePoint:**
1. Go to SharePoint → BC_Admin_Contacts
2. Should see new contact record
3. All fields should be populated

**If Missing Fields in SharePoint:**
- Some fields might not have corresponding SharePoint columns
- That's OK - check which fields are missing
- Update adminDataService.transformAdminContact() if needed

---

### Test 5.3: Verify Contact Appears in Dropdown

**Steps:**
1. Go to another page that references admin contacts
2. Look for a dropdown with contact list
3. Check if your new contact is there

**Expected Results:**
- ✅ New contact appears in dropdown lists
- ✅ Can select the contact

---

### Test 5.4: Edit Contact

**Steps:**
1. Back in Contacts tab
2. Click Edit button (pencil icon) on your contact
3. Change fields:
   - Name: "محمد السلمي - محدث"
   - Phone: "0505555555"

4. Click Save

**Expected Results:**
- ✅ Green success message: "تم تحديث جهة اتصال بنجاح"
- ✅ List updates with new data
- ✅ Name now shows "محمد السلمي - محدث"
- ✅ Phone now shows "0505555555"

**Verification in SharePoint:**
- Refresh BC_Admin_Contacts
- Should see changes reflected

---

### Test 5.5: Delete Contact

**Steps:**
1. Click Delete button (trash icon) on the contact
2. Confirm deletion

**Expected Results:**
- ✅ Green success message: "تم حذف جهة اتصال بنجاح"
- ✅ Contact removed from list
- ✅ No longer appears in dropdowns

**Verification in SharePoint:**
- Check BC_Admin_Contacts
- Record should be deleted

---

## Summary: Pass/Fail Checklist

Print and check off as you complete:

```
DAMAGE REPORTS
□ Load tab
□ Add report
□ Edit report
□ Delete report
□ SharePoint verified

DRILLS
□ Hypothesis dropdown loads
□ Target group dropdown loads
□ Create drill with choices
□ SharePoint verified

TRAINING
□ Provider options load
□ Activity type options load
□ Execution mode options load
□ Registration process works
□ SharePoint verified

INCIDENTS
□ Category dropdown loads
□ Risk level changes by category
□ Alert type assigned correctly
□ Create incident
□ SharePoint verified

ADMIN CONTACTS
□ Load contacts tab
□ Add contact with all fields
□ Verify in SharePoint
□ Edit contact
□ Verify edit in SharePoint
□ Delete contact
□ Verify deletion in SharePoint
```

**All Passed?** ✅ Phase 2 Complete!

---

## Troubleshooting

### Issue: Dropdown doesn't load options
**Solution:**
1. Check browser console (F12) for errors
2. Try hard refresh (Ctrl+F5)
3. Check SharePoint lists exist and have choice fields
4. Verify fallback values at least appear

### Issue: Save fails
**Solution:**
1. Check error message in red bar
2. Verify all required fields filled
3. Check SharePoint permissions
4. Try from incognito/private window

### Issue: Changes don't appear in SharePoint
**Solution:**
1. Wait 5-10 seconds and refresh
2. Check SharePoint list directly
3. Verify you're looking at correct list
4. Check list filters (might be filtering out your record)

### Issue: Console shows errors
**Solution:**
1. Note the exact error message
2. Check if it's a SharePoint connection error
3. Try again after page refresh
4. Document error for later review

---

## After Testing

If all tests pass:
1. ✅ Mark Phase 2 as Complete
2. ✅ Document any issues found
3. ✅ Plan Phase 3 work
4. ✅ Create deployment checklist

If issues found:
1. ⚠️ Document issue details
2. ⚠️ Note which test failed
3. ⚠️ Check if related to code or SharePoint
4. ⚠️ Plan fix

