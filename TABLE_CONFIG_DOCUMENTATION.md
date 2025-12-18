# Table Configuration System Documentation

## Overview

The centralized table configuration system (`src/config/tableConfig.ts`) provides consistent column widths, styling, and rendering across all DetailsList tables in the application.

## Benefits

✅ **Consistency**: All tables use the same width standards  
✅ **Maintainability**: Change one file to update all tables  
✅ **Responsive**: Automatic flex-grow for content-heavy columns  
✅ **RTL Support**: Built-in right-to-left text direction  
✅ **Type Safety**: TypeScript enums prevent errors  

## Usage

### Basic Example

```typescript
import { getColumnConfig, ColumnType, renderWrappedText, renderDate } from '../config/tableConfig'
import { IColumn } from '@fluentui/react'

const columns: IColumn[] = [
  {
    ...getColumnConfig(ColumnType.TITLE),
    key: 'title',
    name: 'العنوان',
    fieldName: 'title',
    onRender: (item) => renderWrappedText(item.title)
  },
  {
    ...getColumnConfig(ColumnType.DATE),
    key: 'date',
    name: 'التاريخ',
    fieldName: 'date',
    onRender: (item) => renderDate(item.date)
  },
  {
    ...getColumnConfig(ColumnType.ACTIONS),
    key: 'actions',
    name: 'الإجراءات',
    onRender: (item) => (
      <IconButton iconProps={{ iconName: 'Edit' }} onClick={() => edit(item)} />
    )
  }
]
```

### Column Types Reference

| Column Type | Min Width | Flex Grow | Use Case | Example |
|-------------|-----------|-----------|----------|---------|
| `TITLE` | 120px | 2 | Main title/name column | Program title, incident name |
| `SHORT_TEXT` | 80px | 1 | Short labels, categories | Status, type, category |
| `MEDIUM_TEXT` | 120px | 2 | Medium-length text | Role, organization, location |
| `LONG_TEXT` | 180px | 3 | Descriptions, notes | Event description, recommendations |
| `MULTI_VALUE` | 150px | 3 | Multiple names/tags | Attendees, team members |
| `DATE` | 90px | 0 (fixed) | Date only | 2025-12-18 |
| `DATETIME` | 120px | 0 (fixed) | Date + time | 2025-12-18 10:30 |
| `NUMBER` | 60px | 0 (fixed) | IDs, counts | 1, 42, 100 |
| `PHONE` | 100px | 0 (fixed) | Phone numbers | 0501234567 |
| `EMAIL` | 140px | 1 | Email addresses | user@example.com |
| `ACTIONS` | 80px | 0 (fixed) | Edit/Delete buttons | ✏️ 🗑️ |
| `ATTACHMENT` | 60px | 0 (fixed) | Attachment icon | 📎 |
| `CHECKBOX` | 50px | 0 (fixed) | Yes/No indicators | ✅ ❌ |
| `RATING` | 70px | 0 (fixed) | Star ratings, scores | ⭐⭐⭐⭐ |
| `STATUS` | 90px | 0 (fixed) | Status badges | مكتمل، قيد التنفيذ |

### Flex Grow Behavior

- **flexGrow: 0** = Fixed width (doesn't expand)
- **flexGrow: 1** = Small expansion (for short text)
- **flexGrow: 2** = Medium expansion (default for titles)
- **flexGrow: 3** = Large expansion (for content-heavy columns)

### Standard Renderers

#### Text with Wrapping
```typescript
onRender: (item) => renderWrappedText(item.description)
```

#### Date
```typescript
onRender: (item) => renderDate(item.date) // Uses 'ar-SA' locale
onRender: (item) => renderDate(item.date, 'en-US') // English format
```

#### Date-Time
```typescript
onRender: (item) => renderDateTime(item.created)
```

#### Choice/Lookup Field
```typescript
// Handles both {Value: "text"} objects and plain strings
onRender: (item) => renderChoice(item.category)
```

#### Multi-Value Field
```typescript
// Handles arrays, {results: []} objects, and strings
onRender: (item) => renderMultiValue(item.attendees)
onRender: (item) => renderMultiValue(item.tags, ' | ') // Custom separator
```

### Custom Overrides

You can override any property:

```typescript
{
  ...getColumnConfig(ColumnType.TITLE, {
    minWidth: 150,  // Override min width
    flexGrow: 3,    // Override flex grow
    styles: {       // Override styles
      cellTitle: {
        backgroundColor: '#f5f5f5'
      }
    }
  }),
  key: 'specialTitle',
  name: 'عنوان خاص'
}
```

## Complete Example: TrainingLog.tsx

### Before (Manual Configuration)
```typescript
const columns: IColumn[] = [
  { 
    key: 'Program_Ref', 
    name: 'البرنامج', 
    fieldName: 'Program_Ref', 
    minWidth: 120, 
    flexGrow: 2,
    isResizable: true,
    styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
    onRender: (item: TrainingLogType) => (
      <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: '1.4' }}>
        {typeof item.Program_Ref === 'object' ? (item.Program_Ref as any)?.Value || '-' : (item.Program_Ref || '-')}
      </div>
    )
  },
  // ... more columns with repetitive code
]
```

### After (Using tableConfig)
```typescript
import { getColumnConfig, ColumnType, renderChoice, renderDate, renderMultiValue } from '../config/tableConfig'

const columns: IColumn[] = [
  {
    ...getColumnConfig(ColumnType.MEDIUM_TEXT),
    key: 'Program_Ref',
    name: 'البرنامج',
    fieldName: 'Program_Ref',
    onRender: (item: TrainingLogType) => renderChoice(item.Program_Ref)
  },
  {
    ...getColumnConfig(ColumnType.SHORT_TEXT),
    key: 'RegistrationType',
    name: 'نوع التسجيل',
    fieldName: 'RegistrationType',
    onRender: (item: TrainingLogType) => renderChoice(item.RegistrationType)
  },
  {
    ...getColumnConfig(ColumnType.MULTI_VALUE),
    key: 'AttendeesNames',
    name: 'أسماء الحضور',
    fieldName: 'AttendeesNames',
    onRender: (item: TrainingLogType) => renderMultiValue(item.AttendeesNames)
  },
  {
    ...getColumnConfig(ColumnType.DATE),
    key: 'TrainingDate',
    name: 'تاريخ التدريب',
    fieldName: 'TrainingDate',
    onRender: (item: TrainingLogType) => renderDate(item.TrainingDate)
  }
]
```

**Result**: 
- ✅ 50% less code
- ✅ Consistent styling
- ✅ Automatic wrapping and centering
- ✅ Handles object/string variations automatically

## Migration Guide

### Step 1: Import the utilities
```typescript
import { 
  getColumnConfig, 
  ColumnType, 
  renderWrappedText,
  renderDate,
  renderChoice,
  renderMultiValue,
  TABLE_CONTAINER_STYLE,
  DETAILS_LIST_COMMON_PROPS
} from '../config/tableConfig'
```

### Step 2: Replace column definitions
For each column, determine its type:
- **Title/Name columns** → `ColumnType.TITLE` or `ColumnType.MEDIUM_TEXT`
- **Dates** → `ColumnType.DATE`
- **Status/Category (short)** → `ColumnType.SHORT_TEXT`
- **Descriptions (long)** → `ColumnType.LONG_TEXT`
- **Multiple values** → `ColumnType.MULTI_VALUE`
- **Edit/Delete buttons** → `ColumnType.ACTIONS`

### Step 3: Use standard renderers
- Plain text → `renderWrappedText(item.field)`
- Dates → `renderDate(item.date)`
- Choice fields → `renderChoice(item.choice)`
- Multi-value → `renderMultiValue(item.array)`

### Step 4: Apply common props to DetailsList
```typescript
<DetailsList
  {...DETAILS_LIST_COMMON_PROPS}
  items={items}
  columns={columns}
/>
```

## Testing Checklist

After migrating a table:
- [ ] Column widths look consistent
- [ ] Text wraps properly in narrow columns
- [ ] Dates format correctly
- [ ] Choice fields display "Value" not objects
- [ ] Multi-value fields show comma-separated list
- [ ] RTL text direction works
- [ ] Mobile responsive (columns don't overflow)
- [ ] Actions column stays fixed width

## Files to Migrate

Priority order for refactoring:

1. ✅ `src/config/tableConfig.ts` - Created
2. 🔲 `src/components/TrainingLog.tsx` - Example migration
3. 🔲 `src/components/Training.tsx`
4. 🔲 `src/components/Team.tsx`
5. 🔲 `src/components/Incidents.tsx`
6. 🔲 `src/components/Drills.tsx`
7. 🔲 `src/components/BCPlan.tsx` (drill plan table)
8. 🔲 `src/components/AdminPanel.tsx` (10+ tables)

## Support

For questions or issues with the table configuration system, check:
- Column not wrapping? Use `ColumnType.LONG_TEXT` or `MULTI_VALUE`
- Column too wide? Use `ColumnType.SHORT_TEXT` or fixed-width types
- Custom rendering needed? Use `onRender` with standard renderers as base
- Need different flex behavior? Use `getColumnConfig()` overrides
