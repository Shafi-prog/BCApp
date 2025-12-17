/**
 * Centralized Table Styles Configuration
 * All table styling in one place for easy customization
 */

import { IColumn, IDetailsListStyles } from '@fluentui/react'

// ============================================
// Column Width Configuration
// ============================================

export const columnWidths = {
  // Fixed width columns
  actions: { minWidth: 80, maxWidth: 100 },
  attachment: { minWidth: 65, maxWidth: 80 },
  date: { minWidth: 80, maxWidth: 100 },
  rating: { minWidth: 70, maxWidth: 80 },
  status: { minWidth: 80, maxWidth: 100 },
  phone: { minWidth: 100, maxWidth: 120 },
  email: { minWidth: 120, maxWidth: 150 },
  
  // First column (school name, etc.) - MAX 80px as requested
  firstColumn: { minWidth: 60, maxWidth: 80 },
  
  // Flexible columns
  title: { minWidth: 100, flexGrow: 2 },
  description: { minWidth: 150, flexGrow: 3 },
  name: { minWidth: 80, flexGrow: 1 },
  role: { minWidth: 80, flexGrow: 1 },
  medium: { minWidth: 100, flexGrow: 1 },
  large: { minWidth: 150, flexGrow: 2 },
}

// ============================================
// Common Column Styles
// ============================================

export const centeredCellStyle = {
  cellTitle: { justifyContent: 'center', textAlign: 'center' as const }
}

export const rightAlignedCellStyle = {
  cellTitle: { justifyContent: 'flex-start', textAlign: 'right' as const }
}

// ============================================
// Cell Render Helpers
// ============================================

export const cellStyles = {
  centered: {
    textAlign: 'center' as const,
    width: '100%',
    whiteSpace: 'normal' as const,
    wordWrap: 'break-word' as const,
    fontSize: '0.85rem',
    lineHeight: '1.4',
  },
  rightAligned: {
    textAlign: 'right' as const,
    width: '100%',
    whiteSpace: 'pre-wrap' as const,
    wordWrap: 'break-word' as const,
    fontSize: '0.85rem',
    color: '#333',
    lineHeight: '1.5',
    padding: '4px 0',
  },
  // First column specific - compact
  firstColumn: {
    textAlign: 'center' as const,
    width: '100%',
    whiteSpace: 'normal' as const,
    wordWrap: 'break-word' as const,
    fontSize: '0.8rem',
    lineHeight: '1.3',
    overflow: 'hidden' as const,
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    textAlign: 'center' as const,
  }
}

// ============================================
// Rating Colors
// ============================================

export const ratingColors = ['#d83b01', '#ff8c00', '#ffb900', '#107c10', '#0078d4']

export const getRatingColor = (rating: number): string => {
  if (rating < 1 || rating > 5) return '#999'
  return ratingColors[rating - 1]
}

export const getRatingLabel = (rating: number): string => {
  const labels = ['ضعيف', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز']
  if (rating < 1 || rating > 5) return '-'
  return labels[rating - 1]
}

// ============================================
// Status Colors
// ============================================

export const statusColors: Record<string, { bg: string; text: string }> = {
  // Incident status
  'جديد': { bg: '#fff4ce', text: '#997a00' },
  'قيد المعالجة': { bg: '#deecf9', text: '#004578' },
  'تم الحل': { bg: '#dff6dd', text: '#107c10' },
  'مغلق': { bg: '#f3f2f1', text: '#605e5c' },
  
  // Task status
  'not_started': { bg: '#f3f2f1', text: '#605e5c' },
  'in_progress': { bg: '#deecf9', text: '#004578' },
  'completed': { bg: '#dff6dd', text: '#107c10' },
  
  // Plan status
  'مخطط': { bg: '#deecf9', text: '#004578' },
  'جاري التنفيذ': { bg: '#fff4ce', text: '#997a00' },
  'منفذ': { bg: '#dff6dd', text: '#107c10' },
  'ملغي': { bg: '#fed9cc', text: '#a4262c' },
  
  // Readiness status
  'ready': { bg: '#dff6dd', text: '#107c10' },
  'partial': { bg: '#fff4ce', text: '#997a00' },
  'not_ready': { bg: '#fed9cc', text: '#a4262c' },
  
  // Default
  'default': { bg: '#f3f2f1', text: '#605e5c' },
}

export const getStatusStyle = (status: string) => {
  const colors = statusColors[status] || statusColors['default']
  return {
    ...cellStyles.badge,
    backgroundColor: colors.bg,
    color: colors.text,
  }
}

// ============================================
// DetailsList Styles
// ============================================

export const detailsListStyles: Partial<IDetailsListStyles> = {
  root: {
    width: '100%',
    overflowX: 'auto',
  },
  headerWrapper: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
}

// ============================================
// Column Builder Helpers
// ============================================

export interface ColumnConfig {
  key: string
  name: string
  fieldName: string
  type: 'firstColumn' | 'text' | 'date' | 'status' | 'rating' | 'actions' | 'attachment' | 'description' | 'custom'
  onRender?: (item: any) => React.ReactNode
  isAdminOnly?: boolean
}

export const buildColumn = (config: ColumnConfig): IColumn => {
  const widthConfig = getWidthConfig(config.type)
  
  return {
    key: config.key,
    name: config.name,
    fieldName: config.fieldName,
    minWidth: widthConfig.minWidth,
    maxWidth: widthConfig.maxWidth,
    flexGrow: widthConfig.flexGrow,
    isResizable: true,
    styles: centeredCellStyle,
    onRender: config.onRender,
  }
}

const getWidthConfig = (type: string): { minWidth: number; maxWidth?: number; flexGrow?: number } => {
  switch (type) {
    case 'firstColumn':
      return { minWidth: columnWidths.firstColumn.minWidth, maxWidth: columnWidths.firstColumn.maxWidth, flexGrow: 0 }
    case 'date':
      return { minWidth: columnWidths.date.minWidth, maxWidth: columnWidths.date.maxWidth, flexGrow: 0 }
    case 'status':
      return { minWidth: columnWidths.status.minWidth, maxWidth: columnWidths.status.maxWidth, flexGrow: 0 }
    case 'rating':
      return { minWidth: columnWidths.rating.minWidth, maxWidth: columnWidths.rating.maxWidth, flexGrow: 0 }
    case 'actions':
      return { minWidth: columnWidths.actions.minWidth, maxWidth: columnWidths.actions.maxWidth, flexGrow: 0 }
    case 'attachment':
      return { minWidth: columnWidths.attachment.minWidth, maxWidth: columnWidths.attachment.maxWidth, flexGrow: 0 }
    case 'description':
      return { minWidth: columnWidths.description.minWidth, flexGrow: columnWidths.description.flexGrow }
    case 'text':
    default:
      return { minWidth: columnWidths.medium.minWidth, flexGrow: columnWidths.medium.flexGrow }
  }
}

// ============================================
// Common Column Renderers
// ============================================

export const renderCenteredText = (text: string | undefined) => (
  <div style={cellStyles.centered}>{text || '-'}</div>
)

export const renderFirstColumnText = (text: string | undefined) => (
  <div style={cellStyles.firstColumn}>{text || '-'}</div>
)

export const renderDate = (dateString: string | undefined) => {
  if (!dateString) return <div style={cellStyles.centered}>-</div>
  const date = new Date(dateString)
  return <div style={cellStyles.centered}>{date.toLocaleDateString('ar-SA')}</div>
}

export const renderStatus = (status: string | undefined) => {
  if (!status) return <div style={cellStyles.centered}>-</div>
  const style = getStatusStyle(status)
  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <span style={style}>{status}</span>
    </div>
  )
}

export const renderRating = (rating: number | undefined) => {
  if (!rating) return <div style={{ textAlign: 'center', color: '#999' }}>-</div>
  return (
    <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
      <span style={{
        backgroundColor: getRatingColor(rating),
        color: '#fff',
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: '0.8rem',
        fontWeight: 600
      }}>
        {rating}/5
      </span>
    </div>
  )
}

export const renderDescription = (text: string | undefined) => (
  <div style={cellStyles.rightAligned}>{text || '-'}</div>
)

// ============================================
// Export All
// ============================================

export default {
  columnWidths,
  cellStyles,
  centeredCellStyle,
  rightAlignedCellStyle,
  ratingColors,
  statusColors,
  detailsListStyles,
  getRatingColor,
  getRatingLabel,
  getStatusStyle,
  buildColumn,
  renderCenteredText,
  renderFirstColumnText,
  renderDate,
  renderStatus,
  renderRating,
  renderDescription,
}
