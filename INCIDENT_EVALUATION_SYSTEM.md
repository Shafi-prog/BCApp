# Incident Evaluation - Dynamic Scoring System
# نظام تقييم الحوادث الديناميكي

## المبدأ
بدلاً من إنشاء قائمة منفصلة للتقييمات، نضيف أعمدة التقييم في نفس قائمة SBC_Incidents_Log
ويتم حساب التقييمات تلقائياً بناءً على البيانات المدخلة من المدرسة.

---

## الأعمدة المطلوب إضافتها في SBC_Incidents_Log

### أعمدة التقييم (Calculated/Manual):

| Column Name | Type | Formula/Description |
|-------------|------|---------------------|
| ResponseTimeMinutes | Number | (ActivationTime - Created) بالدقائق |
| RecoveryTimeHours | Number | (ClosureTime - ActivationTime) بالساعات |
| ResponseRating | Number | تقييم سرعة الاستجابة (1-5) - محسوب |
| CoordinationRating | Number | تقييم التنسيق (1-5) - محسوب |
| CommunicationRating | Number | تقييم التواصل (1-5) - محسوب |
| RecoveryRating | Number | تقييم التعافي (1-5) - محسوب |
| OverallRating | Number | التقييم العام (1-5) - محسوب |
| EvaluationNotes | Note | ملاحظات التقييم (من الإدارة) |
| IsEvaluated | Yes/No | هل تم تقييم الحادثة |

---

## معايير التقييم الآلي

### 1. ResponseRating (تقييم سرعة الاستجابة)
Based on: ResponseTimeMinutes (from Created to ActivationTime)

| Response Time | Rating | Description |
|---------------|--------|-------------|
| ≤ 15 min | 5 | ممتاز - استجابة فورية |
| 16-30 min | 4 | جيد جداً |
| 31-60 min | 3 | جيد |
| 61-120 min | 2 | مقبول |
| > 120 min | 1 | يحتاج تحسين |

### 2. CoordinationRating (تقييم التنسيق)
Based on: CoordinatedEntities (count and type)

| Criteria | Rating |
|----------|--------|
| 3+ entities coordinated | 5 |
| 2 entities | 4 |
| 1 entity | 3 |
| Internal only | 2 |
| No coordination | 1 |

### 3. CommunicationRating (تقييم التواصل)
Based on: CommunicationDone + time to communicate

| Criteria | Rating |
|----------|--------|
| CommunicationDone = Yes within 30 min | 5 |
| CommunicationDone = Yes within 1 hour | 4 |
| CommunicationDone = Yes within 2 hours | 3 |
| CommunicationDone = Yes (late) | 2 |
| CommunicationDone = No | 1 |

### 4. RecoveryRating (تقييم التعافي)
Based on: RecoveryTimeHours + ActionTaken + AltLocation

| Recovery Time | Base Rating | Bonus |
|---------------|-------------|-------|
| ≤ 2 hours | 5 | - |
| 2-4 hours | 4 | +1 if AltLocation used |
| 4-8 hours | 3 | +1 if AltLocation used |
| 8-24 hours | 2 | - |
| > 24 hours | 1 | - |

### 5. OverallRating (التقييم العام)
Formula: (ResponseRating + CoordinationRating + CommunicationRating + RecoveryRating) / 4

---

## Implementation in TypeScript

```typescript
interface IncidentEvaluation {
  ResponseTimeMinutes: number;
  RecoveryTimeHours: number;
  ResponseRating: number;
  CoordinationRating: number;
  CommunicationRating: number;
  RecoveryRating: number;
  OverallRating: number;
}

function calculateIncidentEvaluation(incident: Incident): IncidentEvaluation {
  // 1. Calculate Response Time
  const created = new Date(incident.Created);
  const activated = new Date(incident.ActivationTime);
  const responseMinutes = (activated.getTime() - created.getTime()) / (1000 * 60);
  
  // 2. Calculate Recovery Time
  const closed = new Date(incident.ClosureTime);
  const recoveryHours = (closed.getTime() - activated.getTime()) / (1000 * 60 * 60);
  
  // 3. Response Rating
  let responseRating = 1;
  if (responseMinutes <= 15) responseRating = 5;
  else if (responseMinutes <= 30) responseRating = 4;
  else if (responseMinutes <= 60) responseRating = 3;
  else if (responseMinutes <= 120) responseRating = 2;
  
  // 4. Coordination Rating (based on entities count)
  const entities = incident.CoordinatedEntities?.split(',').length || 0;
  let coordinationRating = Math.min(5, entities + 2);
  
  // 5. Communication Rating
  let communicationRating = incident.CommunicationDone ? 4 : 1;
  
  // 6. Recovery Rating
  let recoveryRating = 1;
  if (recoveryHours <= 2) recoveryRating = 5;
  else if (recoveryHours <= 4) recoveryRating = 4;
  else if (recoveryHours <= 8) recoveryRating = 3;
  else if (recoveryHours <= 24) recoveryRating = 2;
  if (incident.AltLocation && recoveryRating < 5) recoveryRating++;
  
  // 7. Overall Rating
  const overallRating = (responseRating + coordinationRating + communicationRating + recoveryRating) / 4;
  
  return {
    ResponseTimeMinutes: Math.round(responseMinutes),
    RecoveryTimeHours: Math.round(recoveryHours * 10) / 10,
    ResponseRating: responseRating,
    CoordinationRating: coordinationRating,
    CommunicationRating: communicationRating,
    RecoveryRating: recoveryRating,
    OverallRating: Math.round(overallRating * 10) / 10
  };
}
```

---

## CSV Template للأعمدة الجديدة في SBC_Incidents_Log

لا تحتاج قائمة جديدة! فقط أضف هذه الأعمدة في SBC_Incidents_Log:

| Column | Type | Default |
|--------|------|---------|
| ResponseTimeMinutes | Number | null |
| RecoveryTimeHours | Number | null |
| ResponseRating | Number | null |
| CoordinationRating | Number | null |
| CommunicationRating | Number | null |
| RecoveryRating | Number | null |
| OverallRating | Number | null |
| EvaluationNotes | Note | |
| IsEvaluated | Yes/No | No |

---

## Benefits of This Approach

✅ **لا حاجة لقائمة جديدة** - كل شيء في مكان واحد
✅ **تقييم تلقائي** - يحسب تلقائياً عند إدخال البيانات
✅ **شفافية** - المدرسة ترى تقييمها فوراً
✅ **قابل للتعديل** - يمكن للإدارة تعديل التقييم يدوياً
✅ **تقارير سهلة** - يمكن فلترة وتجميع التقييمات
