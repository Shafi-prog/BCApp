# 🎯 Feature Verification Checklist

**Status:** Ready to Verify  
**Date:** December 20, 2025  
**App URL:** http://localhost:5173  
**Focus:** End-to-end functionality verification  

---

## 📋 Overview

This checklist verifies all core features work end-to-end:
- ✅ Data is stored in SharePoint
- ✅ Data is restored from SharePoint
- ✅ Schools can add/edit data
- ✅ Admin can manage everything
- ✅ Notifications and visibility controls work

---

## 1️⃣ BC Team Members Management

### School User: Add BC Team Member

**Test URL:** `http://localhost:5173/` (Navigate to BC Team tab)

**Steps:**
```
1. Login as school user
2. Navigate to "فريق BC" (BC Team) tab
3. Click "إضافة عضو جديد" (Add New Member)
4. Fill in:
   - Name: "أحمد محمد" (Test Name)
   - Role: "منسق الأمن والسلامة" (from dropdown)
   - Phone: "0501234567"
   - Email: "ahmed@school.com"
   - Responsibilities: "تنسيق الخطط وتقييم الأضرار"
5. Click "حفظ" (Save)
6. Verify member appears in list
7. Open SharePoint → SBC_BC_Team_Members list
8. Search for "أحمد محمد"
9. Verify all fields match
```

**Expected Results:**
- ✅ Member appears in frontend list immediately
- ✅ Phone, Email, Role visible
- ✅ Record appears in SharePoint within 5 seconds
- ✅ All fields match exactly

**Verify:**
```
Frontend List:     [✓] Name  [✓] Role  [✓] Phone
SharePoint List:   [✓] Title [✓] Role  [✓] Phone [✓] Email
Data Match:        [✓] All fields match exactly
```

**If Fails:**
- Check browser console (F12) for errors
- Verify SharePoint list exists: SBC_BC_Team_Members
- Check you have edit permissions
- Try hard refresh (Ctrl+F5)

---

## 2️⃣ Training Catalog (Admin Adds, School Selects Team Member)

### Admin: Add Training to Catalog

**Test URL:** `http://localhost:5173/admin?tab=training`

**Steps:**
```
1. Login as admin user
2. Go to Admin → Training tab
3. Click "إضافة برنامج تدريبي جديد" (Add New Training)
4. Fill in:
   - Title: "تدريب على خطط الطوارئ" (Emergency Planning)
   - Provider: "إدارة التدريب" (from dropdown)
   - Activity Type: "دورة تدريبية" (Course)
   - Target Audience: "قادة المدارس" (School Leaders)
   - Execution Mode: "حضوري" (In-person)
   - Description: "برنامج تدريبي على خطط الطوارئ"
   - Date: (select today's date)
5. Click "حفظ" (Save)
6. Verify training appears in admin list
7. Go to SharePoint → Coordination_Programs_Catalog list
8. Search for training title
9. Verify all fields saved
```

**Expected Results:**
- ✅ Training appears in admin list
- ✅ Training appears in SharePoint within 5 seconds
- ✅ All fields saved correctly

---

### School User: Select Team Member for Training

**Test URL:** `http://localhost:5173/training`

**Steps:**
```
1. Login as school user
2. Navigate to "التدريب" (Training) tab
3. Find the training you just created in admin: "تدريب على خطط الطوارئ"
4. Click on training to open details or registration form
5. Look for "Select BC Team Member" or similar field
6. Click dropdown
7. Should see "أحمد محمد" (the team member you added)
8. Select "أحمد محمد"
9. Fill any other required fields
10. Click "تسجيل" (Register) or "حفظ" (Save)
11. Verify registration appears
12. Go to SharePoint → School_Training_Log or similar
13. Search for your school name
14. Verify team member is saved: "أحمد محمد"
```

**Expected Results:**
- ✅ BC Team Member dropdown populates with "أحمد محمد"
- ✅ Team member can be selected
- ✅ Registration saves to SharePoint
- ✅ Team member name appears in SharePoint record

**Verify:**
```
Frontend:     [✓] Team member dropdown loads
              [✓] Can select team member
              [✓] Saved to SharePoint
SharePoint:   [✓] Team member name appears in record
```

**If Fails:**
- Check that BC Team Member was saved in Step 1
- Verify dropdown formula/binding includes team members
- Check SharePoint permissions on School_Training_Log

---

## 3️⃣ Drills - Execute Date & Evaluation Comments

### Admin: Add Drill

**Test URL:** `http://localhost:5173/admin?tab=drills`

**Steps:**
```
1. Login as admin
2. Go to Admin → Drills tab
3. Click "إضافة تمرين جديد" (Add New Drill)
4. Fill in:
   - Name: "تمرين إخلاء المبنى" (Building Evacuation)
   - Drill Hypothesis: "الفرضية الأولى: تعذر استخدام المبنى" (from dropdown)
   - Target Group: "إخلاء جزئي" (Partial Evacuation, from dropdown)
   - Duration: "60"
   - Description: "تمرين على إجراءات الإخلاء"
5. Click "حفظ" (Save)
6. Verify drill appears in admin list
7. Check SharePoint → SBC_Drills_Log
8. Verify drill saved
```

**Expected Results:**
- ✅ Drill appears in admin list
- ✅ Drill appears in SharePoint within 5 seconds

---

### School User: Execute Drill & Enter Evaluation

**Test URL:** `http://localhost:5173/drills`

**Steps:**
```
1. Login as school user
2. Navigate to "التمارين" (Drills) tab
3. Find the drill you just created: "تمرين إخلاء المبنى"
4. Click drill to open it
5. Should see form with:
   - Drill Name (read-only): "تمرين إخلاء المبنى"
   - Execution Date: empty date picker
   - Evaluation: text area
   - Comments: text area
6. Fill in:
   - Execution Date: (select today's date)
   - Evaluation: "تم تنفيذ التمرين بنجاح في 45 دقيقة"
   - Comments: "جميع الموظفين التزموا بالإجراءات"
7. Click "تسجيل" (Register) or "حفظ" (Save)
8. Verify drill execution appears in list
9. Go to SharePoint → SBC_Drills_Log
10. Find the drill record
11. Verify:
    - ExecutionDate field has today's date
    - Evaluation field has your evaluation text
    - Comments field has your comments
```

**Expected Results:**
- ✅ Drill execution date can be selected
- ✅ Evaluation text area available
- ✅ Comments text area available
- ✅ All data saves to SharePoint
- ✅ Fields appear in SharePoint record within 5 seconds

**Verify:**
```
Frontend Form:    [✓] Date picker works
                  [✓] Evaluation text area editable
                  [✓] Comments text area editable
                  [✓] Save button works

SharePoint:       [✓] ExecutionDate has value
                  [✓] Evaluation text appears
                  [✓] Comments text appears
                  [✓] School name matches
```

**If Fails:**
- Check form fields are visible in Drills.tsx
- Check SharePoint columns exist: ExecutionDate, Evaluation, Comments
- Verify school has edit permissions
- Check SBC_Drills_Log list

---

## 4️⃣ Incident Creation - Schools Add Incidents

### School User: Add Incident

**Test URL:** `http://localhost:5173/incidents`

**Steps:**
```
1. Login as school user
2. Navigate to "الحوادث" (Incidents) tab
3. Click "إضافة حادثة جديدة" (Add New Incident)
4. Fill in:
   - Title: "انقطاع الكهرباء عن الخادم الرئيسي" (Power outage)
   - Category: Click dropdown, select "فقدان الاتصالات/الإنترنت" (Communication Loss)
   - Risk Level: Dropdown should filter to show levels for that category
   - Select: "3. أحمر - مستوى حرج" (Red - Critical) [risk level should auto-map to alert type]
   - Alert Type: Should show "3. أحمر (نموذج إنذار)" (Red Alert)
   - Description: "انقطع التيار الكهربائي بسبب عطل في المولد الاحتياطي"
   - AffectedArea: "مركز الحاسب الآلي" (Computer Center)
   - TimeStamp: (select current time)
5. Verify fields populate correctly
6. Click "تسجيل" (Submit) or "حفظ" (Save)
7. Verify incident appears in list
8. Go to SharePoint → SBC_Incidents_Log
9. Search for your incident title
10. Verify all fields saved:
    - Title
    - Category
    - RiskLevel
    - AlertType (auto-assigned)
    - Description
    - AffectedArea
    - CreatedDate (should be today)
```

**Expected Results:**
- ✅ Category dropdown shows 6 categories
- ✅ Risk Level changes when category changes
- ✅ Alert Type auto-assigns based on risk level
- ✅ All fields fill correctly
- ✅ Incident saves to SharePoint
- ✅ Fields visible in SharePoint record

**Verify:**
```
Category Dropdown:    [✓] Shows 6 categories
                      [✓] Selecting changes risk levels

Risk Level:           [✓] Filters by category
                      [✓] Shows appropriate options
                      [✓] Can be selected

Alert Type:           [✓] Auto-assigns based on level
                      [✓] Shows in form
                      [✓] Saves to SharePoint

Data:                 [✓] All fields save
                      [✓] Appears in SharePoint
                      [✓] School name matches
```

**If Fails:**
- Check Incidents.tsx component loads properly
- Verify SBC_Incidents_Log list exists
- Check that IncidentCategory list has 6 categories
- Verify risk level mapping is correct (categoryToRiskLevelMapping)
- Check SharePoint column names match: Title, Category, RiskLevel, AlertType, Description, AffectedArea

---

## 5️⃣ Notifications - Admin Sends, Schools Receive

### Admin: Send Notification

**Test URL:** `http://localhost:5173/admin?tab=notifications`

**Steps:**
```
1. Login as admin
2. Go to Admin → Notifications tab
3. Look for "إرسال إشعار جديد" (Send New Notification)
4. Fill in:
   - Title: "تحديث هام حول خطط الطوارئ" (Important Update)
   - Message: "تم تحديث خطط الطوارئ - يرجى المراجعة" (Plans updated)
   - Priority: "مهم" (Important) or similar
   - Send To: "كل المدارس" (All Schools) or "المدارس المحددة" (Selected Schools)
   - Schools: Select specific school(s)
5. Click "إرسال" (Send)
6. Verify notification appears in admin list
7. Check SharePoint → Notifications or similar list
8. Verify notification saved
```

**Expected Results:**
- ✅ Notification form available in admin
- ✅ Can fill in notification details
- ✅ Saves to SharePoint
- ✅ Marked as sent

---

### School User: See Notification

**Test URL:** `http://localhost:5173/` (Dashboard/Home)

**Steps:**
```
1. Login as school user (same school you sent notification to)
2. Go to home/dashboard or look for Notifications section
3. Should see the notification:
   Title: "تحديث هام حول خطط الطوارئ"
   Message: "تم تحديث خطط الطوارئ - يرجى المراجعة"
4. Click notification to view full details
5. Verify timestamp, sender, and message correct
```

**Expected Results:**
- ✅ Notification appears on school dashboard
- ✅ Only appears for schools that were sent to
- ✅ Title and message display correctly
- ✅ Can click to view full notification
- ✅ Timestamp shows correctly

**Verify:**
```
Admin Side:       [✓] Can send notification
                  [✓] Saves to SharePoint
                  [✓] Shows in admin list

School Side:      [✓] Notification appears
                  [✓] Correct title/message
                  [✓] Only for selected school(s)
                  [✓] Timestamp correct

Data:             [✓] Matches between admin and school
```

**If Fails:**
- Check Notifications component exists
- Verify Notifications table/list in SharePoint
- Check school filtering logic
- Verify data loads on school dashboard
- Check for any filtering that hides notifications

---

## 6️⃣ Contacts - Admin Toggles Visibility, Schools See

### Admin: Add & Toggle Contact Visibility

**Test URL:** `http://localhost:5173/admin?tab=contacts`

**Steps:**
```
1. Login as admin
2. Go to Admin → Contacts tab
3. Click "إضافة جهة اتصال جديدة" (Add New Contact)
4. Fill in:
   - Name: "د. محمد علي الأحمري" (Contact Name)
   - Role: "مدير إدارة الأزمات" (Crisis Manager)
   - Phone: "0509876543"
   - Email: "manager@edu.sa"
   - Organization: "الإدارة العامة للأمن والسلامة" (General Security Directorate)
   - Category: "جهات حكومية" (Government) or "جهات خارجية" (External)
   - IsVisible: Toggle to ON/TRUE (to make visible to schools)
5. Click "حفظ" (Save)
6. Verify contact appears in admin list
7. Check SharePoint → BC_Admin_Contacts
8. Verify contact saved with IsVisible/IsActive = TRUE
```

**Expected Results:**
- ✅ Contact form available
- ✅ Can toggle visibility
- ✅ Saves to SharePoint
- ✅ IsVisible field set correctly

---

### School User: See Toggled Contacts

**Test URL:** `http://localhost:5173/` (Navigate to Contacts)

**Steps:**
```
1. Login as school user
2. Look for "جهات الاتصال" (Contacts) section/tab
3. Should only see contacts where IsVisible = TRUE
4. Should see:
   - Contact name: "د. محمد علي الأحمري"
   - Role: "مدير إدارة الأزمات"
   - Phone: "0509876543"
   - Email: "manager@edu.sa" (if displayed)
5. Verify contact details are correct
6. Try to click/call phone number if available
```

**Expected Results:**
- ✅ Only visible contacts appear
- ✅ Contact info displays correctly
- ✅ Only appears if admin toggled visibility ON
- ✅ Hidden contacts don't appear even if added

**Verify:**
```
Admin Side:       [✓] Can add contact
                  [✓] Can toggle visibility
                  [✓] Saves to SharePoint

School Side:      [✓] Visible contacts appear
                  [✓] Contact info correct
                  [✓] Hidden contacts don't show
                  [✓] Only shows their school contacts (if applicable)

Data:             [✓] Matches between admin and school
                  [✓] IsVisible flag respected
```

**If Fails:**
- Check Contacts component in schools view
- Verify IsVisible/IsActive field filtering
- Check SharePoint IsVisible column
- Verify school has read access to contacts list
- Check for any permissions that hide contacts

---

## 7️⃣ BC Plans - See from Sidebar Navigation

### School User: View BC Plans

**Test URL:** `http://localhost:5173/` (Check sidebar)

**Steps:**
```
1. Login as school user
2. Look at left sidebar navigation
3. Should see "خطط BC" (BC Plans) or similar section
4. Expand section (if collapsible)
5. Should show options like:
   - "الخطة الشاملة" (Comprehensive Plan)
   - "خطة الاستجابة" (Response Plan)
   - "خطة التعافي" (Recovery Plan)
   - or similar
6. Click on "الخطة الشاملة" (Main Plan)
7. Should load plan details page
8. Verify plan content displays:
   - Plan title
   - Plan sections
   - Objectives
   - Responsibilities
   - Timelines
9. Check you can scroll and view all content
10. Go back and try other BC plan options
11. Verify each loads correctly
```

**Expected Results:**
- ✅ BC Plans section visible in sidebar
- ✅ Shows plan options
- ✅ Can click to view plans
- ✅ Plan content loads
- ✅ All sections visible
- ✅ Can navigate between plans

**Verify:**
```
Sidebar:          [✓] BC Plans section exists
                  [✓] Section accessible
                  [✓] Shows plan options

Plan Page:        [✓] Plan loads
                  [✓] Content visible
                  [✓] All sections display
                  [✓] Navigation works

Content:          [✓] Plan title correct
                  [✓] Sections organized
                  [✓] Text readable
```

**If Fails:**
- Check sidebar Navigation.tsx for BC Plans section
- Verify plan pages/routes exist
- Check that plan data loads from SharePoint/JSON
- Verify plan content displays correctly
- Check styling doesn't hide content

---

## 8️⃣ Leaderboard - Schools See 200 Leaderboard

### School User: View 200 Leaderboard

**Test URL:** `http://localhost:5173/leaderboard` or similar

**Steps:**
```
1. Login as school user
2. Navigate to "لوحة المتصدرين 200" (200 Leaderboard) or similar
3. Or look for Leaderboard in sidebar/main menu
4. Should see leaderboard showing:
   - Ranking (1st, 2nd, 3rd, etc.)
   - School Names
   - Scores (out of 200)
   - Progress bars or score indicators
5. Verify your school appears in leaderboard
6. Check ranking makes sense
7. Verify top schools are at top
8. Check score calculation (should be out of 200)
9. Try sorting if available (by score, by name, etc.)
10. Check if your school is highlighted/emphasized
```

**Expected Results:**
- ✅ Leaderboard page accessible
- ✅ Shows all schools with scores
- ✅ Scores out of 200
- ✅ Ranking correct
- ✅ Your school visible with correct score
- ✅ Sortable/searchable if available

**Verify:**
```
Leaderboard:      [✓] Page loads
                  [✓] All schools visible
                  [✓] Scores display
                  [✓] Rankings correct
                  [✓] Out of 200 total

Your School:      [✓] Appears in list
                  [✓] Score correct
                  [✓] Ranking accurate
                  [✓] Highlighted if applicable

Functionality:    [✓] Sortable if available
                  [✓] Searchable if available
                  [✓] Updates automatically
```

**If Fails:**
- Check Leaderboard component exists
- Verify data loads from SharePoint
- Check score calculation (sum of all achievements)
- Verify school filtering works
- Check rendering of 200+ schools if applicable

---

## 9️⃣ Admin Operations - Edit & Delete

### Admin: Edit Records

**Test URL:** `http://localhost:5173/admin?tab=training` (or other tabs)

**Steps:**
```
1. Login as admin
2. Go to Admin → Training tab (or BC_Damage_Reports, Contacts, etc.)
3. Find a record you created earlier
4. Look for "تعديل" (Edit) button or click row to edit
5. Edit a field:
   - Change title slightly: "تدريب على خطط الطوارئ (محدث)" (Updated)
   - Or change date
   - Or change description
6. Click "حفظ" (Save)
7. Verify changes appear immediately in list
8. Go to SharePoint list
9. Find the record
10. Verify changes saved in SharePoint
```

**Expected Results:**
- ✅ Edit button available
- ✅ Form opens in edit mode
- ✅ Can modify fields
- ✅ Changes save to SharePoint
- ✅ Changes appear immediately in list

---

### Admin: Delete Records

**Test URL:** `http://localhost:5173/admin?tab=training` (or other tabs)

**Steps:**
```
1. Login as admin
2. Go to Admin → Training tab
3. Find a record to delete
4. Look for "حذف" (Delete) button
5. Click delete
6. Confirm deletion if prompted: "هل أنت متأكد؟" (Are you sure?)
7. Click "نعم" (Yes)
8. Verify record removed from list
9. Go to SharePoint
10. Search for deleted record
11. Verify it's gone (or marked as deleted)
```

**Expected Results:**
- ✅ Delete button available
- ✅ Confirmation dialog shown
- ✅ Record removed immediately
- ✅ Record removed from SharePoint
- ✅ No errors in console

**Verify:**
```
Frontend:         [✓] Edit works
                  [✓] Changes appear
                  [✓] Delete button works
                  [✓] Confirmation shown
                  [✓] Records removed

SharePoint:       [✓] Changes saved
                  [✓] Deletions reflected
                  [✓] Data consistent

Console:          [✓] No errors
                  [✓] No warnings
```

**If Fails:**
- Check update/delete service methods exist
- Verify SharePoint permissions (edit/delete)
- Check error handling
- Review browser console for errors
- Verify list filtering doesn't hide updated records

---

## 🔍 General Verification

### Browser Console (F12)

```
Check for:
  ❌ NO RED ERRORS
  ❌ NO CRITICAL WARNINGS
  ✅ OK: Info/debug messages
  ✅ OK: Occasional warnings
```

**Steps:**
```
1. Open browser DevTools (F12)
2. Go to Console tab
3. Refresh page (F5)
4. Perform actions
5. Look for red error messages
6. Take screenshot if errors appear
```

### SharePoint List Verification

```
For Each Feature:
  ✅ Record appears in SharePoint
  ✅ Fields match frontend
  ✅ Timestamps correct
  ✅ School/User attribution correct
  ✅ No duplicate records
  ✅ Permissions allow view/edit
```

### Data Integrity

```
Check:
  ✅ No orphaned records (incidents without schools)
  ✅ No duplicate entries
  ✅ Timestamps logical (not in future)
  ✅ School names match
  ✅ Required fields always filled
  ✅ Choice fields have valid options
```

---

## 📊 Summary Table

| Feature | School User | Admin User | SharePoint | Pass/Fail |
|---------|-------------|-----------|------------|-----------|
| BC Team Members | Add ✓ | Manage ✓ | Saves ✓ | ❓ |
| Training Catalog | Select Member ✓ | Add/Edit/Delete ✓ | Syncs ✓ | ❓ |
| Drills | Execute/Evaluate ✓ | Add/Edit/Delete ✓ | Syncs ✓ | ❓ |
| Incidents | Add/Report ✓ | View/Manage ✓ | Syncs ✓ | ❓ |
| Notifications | Receive ✓ | Send/Manage ✓ | Syncs ✓ | ❓ |
| Contacts | View Visible ✓ | Add/Toggle ✓ | Syncs ✓ | ❓ |
| BC Plans | View Plans ✓ | Manage Plans ✓ | Loads ✓ | ❓ |
| Leaderboard | View Scores ✓ | View All ✓ | Calculates ✓ | ❓ |
| Edit/Delete | N/A | Works ✓ | Syncs ✓ | ❓ |

---

## ✅ Test Completion

### Before Starting
- [ ] App running at http://localhost:5173
- [ ] Logged in as school user
- [ ] Browser console open (F12)
- [ ] SharePoint accessible
- [ ] Time available: 2-3 hours

### Test Sequence
- [ ] 1. BC Team Members (10 min)
- [ ] 2. Training Catalog (15 min)
- [ ] 3. Drills (15 min)
- [ ] 4. Incidents (15 min)
- [ ] 5. Notifications (10 min)
- [ ] 6. Contacts (10 min)
- [ ] 7. BC Plans (10 min)
- [ ] 8. Leaderboard (10 min)
- [ ] 9. Admin Operations (20 min)
- [ ] 10. General Verification (15 min)

### After Testing
- [ ] All features verified
- [ ] Issues documented
- [ ] Screenshots taken
- [ ] Console errors logged
- [ ] Report created

---

## 📝 Issue Log Template

```
Issue #1
--------
Feature: [Feature Name]
Test: [Test Step]
Expected: [What should happen]
Actual: [What happened]
Steps to Reproduce:
  1. 
  2.
  3.
Error Message: [If applicable]
Screenshot: [If applicable]
Severity: [Critical/High/Medium/Low]
```

---

## 🎯 Success Criteria

### All Tests Must Pass
- ✅ School can add BC team members → SharePoint syncs
- ✅ Admin can add training → School selects team member → SharePoint syncs
- ✅ Admin adds drills → School executes & evaluates → SharePoint syncs
- ✅ School adds incidents → Fields fill correctly → SharePoint syncs
- ✅ Admin sends notifications → School receives
- ✅ Admin toggles contacts visible → School sees visible ones only
- ✅ School sees BC plans in sidebar
- ✅ School sees 200 leaderboard with scores
- ✅ Admin can edit and delete records
- ✅ No red errors in console
- ✅ No missing data in SharePoint

### Phase 2 Complete If
- ✅ 90%+ tests pass
- ✅ All critical features (team members, drills, incidents) work
- ✅ Data syncs bidirectionally with SharePoint
- ✅ Admin controls work (edit, delete, toggle)

---

## 🚀 Start Testing Now!

**App URL:** http://localhost:5173  
**Test Order:** Follow sections 1-9 in sequence  
**Time Expected:** 2-3 hours total  
**Status:** Ready to verify  

Begin with **Section 1: BC Team Members** ➜

