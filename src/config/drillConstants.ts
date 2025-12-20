/**
 * Shared Drill Options Constants
 * 
 * CYBER COMPLIANCE NOTE:
 * These constants serve ONLY as fallback defaults when SharePoint list connections fail.
 * All primary data is loaded from BC_Test_Plans SharePoint list choice fields.
 * This ensures compliance with cyber regulations requiring all data to be restored from SharePoint.
 * 
 * Used across Drills.tsx and DrilsManagement.tsx
 */

import { IDropdownOption } from '@fluentui/react'

/**
 * Default hypothesis/scenario options for BC_Test_Plans drills
 * These represent the 5 primary scenarios in the BC plan
 */
export const DEFAULT_HYPOTHESIS_OPTIONS: IDropdownOption[] = [
  {
    key: "الفرضية الأولى: تعذر استخدام المبنى المدرسي",
    text: "الفرضية الأولى: تعذر استخدام المبنى المدرسي (كلي/جزئي)"
  },
  {
    key: "الفرضية الثانية: تعطل الأنظمة والمنصات",
    text: "الفرضية الثانية: تعطل الأنظمة والمنصات التعليمية (مدرستي/تيمز)"
  },
  {
    key: "الفرضية الثالثة: تعطل خدمة البث",
    text: "الفرضية الثالثة: تعطل خدمة البث التعليمي (قنوات عين)"
  },
  {
    key: "الفرضية الرابعة: انقطاع الخدمات",
    text: "الفرضية الرابعة: انقطاع الخدمات الأساسية (كهرباء/اتصال/مياه)"
  },
  {
    key: "الفرضية الخامسة: نقص الكوادر",
    text: "الفرضية الخامسة: نقص الكوادر البشرية (جوائح/أوبئة)"
  },
]

/**
 * Default status options for drill execution
 * These represent the three states a drill can be in
 */
export const DEFAULT_STATUS_OPTIONS: IDropdownOption[] = [
  { key: "مخطط", text: "مخطط" },
  { key: "قيد التنفيذ", text: "قيد التنفيذ" },
  { key: "مكتمل", text: "مكتمل" },
  { key: "انتهى", text: "انتهى" },
]

/**
 * Default quarter options for the academic year
 * Representing four quarters of the school year
 */
export const DEFAULT_QUARTER_OPTIONS: IDropdownOption[] = [
  { key: "Q1", text: "الربع الأول" },
  { key: "Q2", text: "الربع الثاني" },
  { key: "Q3", text: "الربع الثالث" },
  { key: "Q4", text: "الربع الرابع" },
]

/**
 * Status badge color configuration
 * Maps each status to its visual representation
 */
export const STATUS_COLORS: Record<string, { background: string; color: string; textColor: string }> = {
  "مكتمل": {
    background: "#e7f5e1",
    color: "#107c10",
    textColor: "white"
  },
  "قيد التنفيذ": {
    background: "#e3f2fd",
    color: "#0078d4",
    textColor: "white"
  },
  "مخطط": {
    background: "#fff3e0",
    color: "#d97300",
    textColor: "white"
  },
  "انتهى": {
    background: "#fce8e6",
    color: "#d83b01",
    textColor: "white"
  },
  "default": {
    background: "#fff3e0",
    color: "#d97300",
    textColor: "white"
  }
}

/**
 * Get the color configuration for a given status
 */
export const getStatusColor = (status: string): typeof STATUS_COLORS["default"] => {
  return STATUS_COLORS[status] || STATUS_COLORS["default"]
}

/**
 * Helper to convert choice values from SharePoint to dropdown options
 * Used when loading options from SharePoint's choice fields
 */
export const toDropdownOptions = (values: any[]): IDropdownOption[] => {
  if (!Array.isArray(values)) return []
  return values
    .map((v: any) => {
      const text = typeof v === 'string' ? v : (v.Value || v.text || String(v))
      return { key: text, text }
    })
    .filter(opt => opt.text && opt.text.trim().length > 0)
}
