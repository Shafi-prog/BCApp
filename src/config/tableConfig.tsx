/**
 * Centralized Table Configuration
 * 
 * This file defines standard column properties for all DetailsList tables
 * to ensure consistent width, wrapping, and responsive behavior across the app.
 * 
 * Usage:
 * import { getColumnConfig, ColumnType } from '../config/tableConfig'
 * 
 * const columns: IColumn[] = [
 *   { ...getColumnConfig(ColumnType.TITLE), key: 'title', name: 'العنوان', fieldName: 'title' },
 *   { ...getColumnConfig(ColumnType.DATE), key: 'date', name: 'التاريخ', fieldName: 'date' },
 * ]
 */

import { IColumn } from '@fluentui/react'

/**
 * Standard column types with predefined width/flex properties
 */
export enum ColumnType {
  // Text columns
  TITLE = 'TITLE',                    // Main title/name column (flex)
  SHORT_TEXT = 'SHORT_TEXT',          // Short text like status, category
  MEDIUM_TEXT = 'MEDIUM_TEXT',        // Medium length text
  LONG_TEXT = 'LONG_TEXT',            // Long text like descriptions
  MULTI_VALUE = 'MULTI_VALUE',        // Multiple values (names, tags)
  
  // Fixed width columns
  DATE = 'DATE',                      // Date only
  DATETIME = 'DATETIME',              // Date and time
  NUMBER = 'NUMBER',                  // Numbers, IDs
  PHONE = 'PHONE',                    // Phone numbers
  EMAIL = 'EMAIL',                    // Email addresses
  
  // Special columns
  ACTIONS = 'ACTIONS',                // Edit/Delete buttons
  ATTACHMENT = 'ATTACHMENT',          // Attachment link icon
  CHECKBOX = 'CHECKBOX',              // Yes/No, checkbox
  RATING = 'RATING',                  // Star ratings, scores
  STATUS = 'STATUS',                  // Status badges
}

/**
 * Column configuration presets
 */
interface ColumnConfig {
  minWidth: number
  maxWidth?: number
  flexGrow: number
  isResizable: boolean
  styles?: any
}

const COLUMN_CONFIGS: Record<ColumnType, ColumnConfig> = {
  // Text columns (flexible width)
  [ColumnType.TITLE]: {
    minWidth: 120,
    flexGrow: 2,
    isResizable: true,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '8px 12px'
      }
    }
  },
  
  [ColumnType.SHORT_TEXT]: {
    minWidth: 80,
    flexGrow: 1,
    isResizable: true,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '8px 8px'
      }
    }
  },
  
  [ColumnType.MEDIUM_TEXT]: {
    minWidth: 120,
    flexGrow: 2,
    isResizable: true,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '8px 12px'
      }
    }
  },
  
  [ColumnType.LONG_TEXT]: {
    minWidth: 180,
    flexGrow: 3,
    isResizable: true,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '8px 12px'
      }
    }
  },
  
  [ColumnType.MULTI_VALUE]: {
    minWidth: 150,
    flexGrow: 3,
    isResizable: true,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '8px 12px'
      }
    }
  },
  
  // Fixed width columns (no flex)
  [ColumnType.DATE]: {
    minWidth: 90,
    maxWidth: 110,
    flexGrow: 0,
    isResizable: false,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '8px 8px'
      }
    }
  },
  
  [ColumnType.DATETIME]: {
    minWidth: 120,
    maxWidth: 140,
    flexGrow: 0,
    isResizable: false,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '8px 8px'
      }
    }
  },
  
  [ColumnType.NUMBER]: {
    minWidth: 60,
    maxWidth: 80,
    flexGrow: 0,
    isResizable: false,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '8px 8px'
      }
    }
  },
  
  [ColumnType.PHONE]: {
    minWidth: 100,
    maxWidth: 120,
    flexGrow: 0,
    isResizable: false,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '8px 8px'
      }
    }
  },
  
  [ColumnType.EMAIL]: {
    minWidth: 140,
    flexGrow: 1,
    isResizable: true,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '8px 12px'
      }
    }
  },
  
  // Special columns
  [ColumnType.ACTIONS]: {
    minWidth: 80,
    maxWidth: 100,
    flexGrow: 0,
    isResizable: false,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '4px 8px'
      }
    }
  },
  
  [ColumnType.ATTACHMENT]: {
    minWidth: 60,
    maxWidth: 80,
    flexGrow: 0,
    isResizable: false,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '4px 8px'
      }
    }
  },
  
  [ColumnType.CHECKBOX]: {
    minWidth: 50,
    maxWidth: 70,
    flexGrow: 0,
    isResizable: false,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '4px 8px'
      }
    }
  },
  
  [ColumnType.RATING]: {
    minWidth: 70,
    maxWidth: 90,
    flexGrow: 0,
    isResizable: false,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '4px 8px'
      }
    }
  },
  
  [ColumnType.STATUS]: {
    minWidth: 90,
    maxWidth: 110,
    flexGrow: 0,
    isResizable: false,
    styles: {
      cellTitle: { 
        justifyContent: 'center', 
        textAlign: 'center',
        padding: '8px 8px'
      }
    }
  },
}

/**
 * Get column configuration for a specific column type
 * 
 * @param type - The column type from ColumnType enum
 * @param overrides - Optional overrides for specific properties
 * @returns Column configuration object
 */
export function getColumnConfig(
  type: ColumnType, 
  overrides?: Partial<ColumnConfig>
): ColumnConfig {
  const baseConfig = COLUMN_CONFIGS[type]
  return {
    ...baseConfig,
    ...overrides,
    styles: {
      ...baseConfig.styles,
      ...overrides?.styles
    }
  }
}

/**
 * Standard cell renderer with word wrapping
 * Use this for text columns that need wrapping
 */
export const renderWrappedText = (text: string | undefined | null) => {
  return (
    <div style={{ 
      textAlign: 'center', 
      width: '100%', 
      whiteSpace: 'normal', 
      wordWrap: 'break-word', 
      lineHeight: '1.4',
      padding: '4px 0'
    }}>
      {text || '-'}
    </div>
  )
}

/**
 * Standard cell renderer for dates
 */
export const renderDate = (dateString: string | undefined | null, locale: string = 'ar-SA') => {
  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      {dateString ? new Date(dateString).toLocaleDateString(locale) : '-'}
    </div>
  )
}

/**
 * Standard cell renderer for date-time
 */
export const renderDateTime = (dateString: string | undefined | null, locale: string = 'ar-SA') => {
  return (
    <div style={{ textAlign: 'center', width: '100%', fontSize: '0.9em' }}>
      {dateString ? new Date(dateString).toLocaleString(locale) : '-'}
    </div>
  )
}

/**
 * Standard cell renderer for choice/lookup fields (handles object or string)
 */
export const renderChoice = (value: any) => {
  let displayText = '-'
  if (typeof value === 'object' && value !== null) {
    displayText = value.Value || value.Title || '-'
  } else if (typeof value === 'string') {
    displayText = value
  }
  
  return (
    <div style={{ 
      textAlign: 'center', 
      width: '100%', 
      whiteSpace: 'normal', 
      wordWrap: 'break-word', 
      lineHeight: '1.3' 
    }}>
      {displayText}
    </div>
  )
}

/**
 * Standard cell renderer for multi-value fields (arrays)
 */
export const renderMultiValue = (value: any, separator: string = '، ') => {
  let displayText = '-'
  
  if (Array.isArray(value)) {
    displayText = value
      .map(item => typeof item === 'object' ? (item.Value || item.Title || '') : item)
      .filter(Boolean)
      .join(separator)
  } else if (typeof value === 'object' && value?.results) {
    displayText = value.results
      .map((item: any) => typeof item === 'object' ? (item.Value || item.Title || '') : item)
      .filter(Boolean)
      .join(separator)
  } else if (typeof value === 'string') {
    displayText = value
  }
  
  return (
    <div style={{ 
      textAlign: 'center', 
      width: '100%', 
      whiteSpace: 'normal', 
      wordWrap: 'break-word', 
      lineHeight: '1.4' 
    }}>
      {displayText}
    </div>
  )
}

/**
 * Table container style for consistent responsive behavior
 */
export const TABLE_CONTAINER_STYLE: React.CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  overflowY: 'visible',
  position: 'relative'
}

/**
 * DetailsList common props for RTL support and consistent behavior
 */
export const DETAILS_LIST_COMMON_PROPS = {
  layoutMode: 0, // DetailsListLayoutMode.justified
  selectionMode: 0, // SelectionMode.none
  isHeaderVisible: true,
  styles: {
    root: {
      direction: 'rtl' as const,
      '.ms-DetailsRow': {
        minHeight: '48px'
      },
      '.ms-DetailsRow-cell': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }
  }
}
