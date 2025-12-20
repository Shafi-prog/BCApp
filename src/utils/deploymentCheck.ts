/**
 * Deployment Readiness Check Script
 * Run this to verify all SharePoint lists, choice fields, and app functionality
 * before deploying to production.
 */

import { SchoolInfoService } from '../generated/services/SchoolInfoService'
import { SBC_Incidents_LogService } from '../generated/services/SBC_Incidents_LogService'
import { SBC_Drills_LogService } from '../generated/services/SBC_Drills_LogService'
import { Coordination_Programs_CatalogService } from '../generated/services/Coordination_Programs_CatalogService'
import { School_Training_LogService } from '../generated/services/School_Training_LogService'
import { BC_Shared_PlanService } from '../generated/services/BC_Shared_PlanService'
import { BC_Teams_MembersService } from '../generated/services/BC_Teams_MembersService'
import { BC_Plan_ScenariosService } from '../generated/services/BC_Plan_ScenariosService'
import { BC_Plan_DocumentsService } from '../generated/services/BC_Plan_DocumentsService'
import { BC_Plan_ReviewService } from '../generated/services/BC_Plan_ReviewService'
import { BC_Admin_ContactsService } from '../generated/services/BC_Admin_ContactsService'
import { BC_Mutual_OperationService } from '../generated/services/BC_Mutual_OperationService'
import { BC_Damage_ReportsService } from '../generated/services/BC_Damage_ReportsService'
import { BC_DR_ChecklistService } from '../generated/services/BC_DR_ChecklistService'
import { BC_Incident_EvaluationsService } from '../generated/services/BC_Incident_EvaluationsService'
import { BC_Test_PlansService } from '../generated/services/BC_Test_PlansService'
import { BC_Announcements_SchemaService } from '../generated/services/BC_Announcements_SchemaService'

export interface CheckResult {
  category: string
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  details?: any
}

export interface DeploymentReport {
  timestamp: string
  totalChecks: number
  passed: number
  failed: number
  warnings: number
  results: CheckResult[]
}

// Helper to extract choice field values
const getChoiceValues = (result: any): string[] => {
  const values = result?.data?.value
  if (Array.isArray(values)) {
    return values.map((v: any) => v?.Value || v).filter(Boolean)
  }
  return []
}

// Check a single list connectivity
async function checkListAccess(
  name: string,
  service: { getItems: () => Promise<any> }
): Promise<CheckResult> {
  try {
    const result = await service.getItems()
    const count = Array.isArray(result?.data) ? result.data.length : 0
    return {
      category: 'List Access',
      name,
      status: 'pass',
      message: `✓ Accessible (${count} items)`,
      details: { itemCount: count }
    }
  } catch (error: any) {
    return {
      category: 'List Access',
      name,
      status: 'fail',
      message: `✗ Failed: ${error?.message || 'Unknown error'}`,
      details: { error }
    }
  }
}

// Check a choice field has values
async function checkChoiceField(
  listName: string,
  fieldName: string,
  service: { getReferencedEntity: (search: string, field: string) => Promise<any> }
): Promise<CheckResult> {
  try {
    const result = await service.getReferencedEntity('', fieldName)
    const values = getChoiceValues(result)
    
    if (values.length === 0) {
      return {
        category: 'Choice Fields',
        name: `${listName}.${fieldName}`,
        status: 'fail',
        message: `✗ ZERO VALUES - Add choices in SharePoint`,
        details: { values: [] }
      }
    }
    
    return {
      category: 'Choice Fields',
      name: `${listName}.${fieldName}`,
      status: 'pass',
      message: `✓ ${values.length} choices: ${values.slice(0, 3).join(', ')}${values.length > 3 ? '...' : ''}`,
      details: { values, count: values.length }
    }
  } catch (error: any) {
    return {
      category: 'Choice Fields',
      name: `${listName}.${fieldName}`,
      status: 'fail',
      message: `✗ Error: ${error?.message || 'Unknown error'}`,
      details: { error }
    }
  }
}

/**
 * Run full deployment readiness check
 */
export async function runDeploymentCheck(): Promise<DeploymentReport> {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  🔍 DEPLOYMENT READINESS CHECK')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')
  
  const results: CheckResult[] = []
  
  // ═══════════════════════════════════════════════════════════
  // SECTION 1: LIST ACCESS CHECKS
  // ═══════════════════════════════════════════════════════════
  console.log('📋 CHECKING LIST ACCESS...')
  console.log('───────────────────────────────────────────────────────────')
  
  const listChecks = [
    { name: 'SchoolInfo', service: SchoolInfoService },
    { name: 'SBC_Incidents_Log', service: SBC_Incidents_LogService },
    { name: 'SBC_Drills_Log', service: SBC_Drills_LogService },
    { name: 'Coordination_Programs_Catalog', service: Coordination_Programs_CatalogService },
    { name: 'School_Training_Log', service: School_Training_LogService },
    { name: 'BC_Shared_Plan', service: BC_Shared_PlanService },
    { name: 'BC_Teams_Members', service: BC_Teams_MembersService },
    { name: 'BC_Plan_Scenarios', service: BC_Plan_ScenariosService },
    { name: 'BC_Plan_Documents', service: BC_Plan_DocumentsService },
    { name: 'BC_Plan_Review', service: BC_Plan_ReviewService },
    { name: 'BC_Admin_Contacts', service: BC_Admin_ContactsService },
    { name: 'BC_Mutual_Operation', service: BC_Mutual_OperationService },
    { name: 'BC_Damage_Reports', service: BC_Damage_ReportsService },
    { name: 'BC_DR_Checklist', service: BC_DR_ChecklistService },
    { name: 'BC_Incident_Evaluations', service: BC_Incident_EvaluationsService },
    { name: 'BC_Test_Plans', service: BC_Test_PlansService },
    { name: 'BC_Announcements_Schema', service: BC_Announcements_SchemaService },
  ]
  
  for (const { name, service } of listChecks) {
    const result = await checkListAccess(name, service as any)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${name}: ${result.message}`)
  }
  
  console.log('')
  
  // ═══════════════════════════════════════════════════════════
  // SECTION 2: CHOICE FIELD CHECKS
  // ═══════════════════════════════════════════════════════════
  console.log('📝 CHECKING CHOICE FIELDS...')
  console.log('───────────────────────────────────────────────────────────')
  
  // SBC_Incidents_Log choice fields
  const incidentChoiceFields = [
    'IncidentCategory',
    'RiskLevel',
    'AlertModelType',
    'ActivatedAlternative',
    'CoordinatedEntities',
    'ActionTaken',
    'AltLocation',
  ]
  
  for (const field of incidentChoiceFields) {
    const result = await checkChoiceField('SBC_Incidents_Log', field, SBC_Incidents_LogService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // Coordination_Programs_Catalog choice fields
  const trainingChoiceFields = [
    'ProviderEntity',
    'ActivityType',
    'TargetAudience',
    'ExecutionMode',
    'CoordinationStatus',
  ]
  
  for (const field of trainingChoiceFields) {
    const result = await checkChoiceField('Coordination_Programs_Catalog', field, Coordination_Programs_CatalogService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // SBC_Drills_Log choice fields
  const drillsChoiceFields = [
    'DrillHypothesis',
    'TargetGroup',
  ]
  
  for (const field of drillsChoiceFields) {
    const result = await checkChoiceField('SBC_Drills_Log', field, SBC_Drills_LogService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // SchoolInfo choice fields
  const schoolInfoChoiceFields = [
    'SchoolType',
    'SchoolGender',
    'EducationType',
    'StudyTime',
    'BuildingOwnership',
    'Organization',
  ]
  
  for (const field of schoolInfoChoiceFields) {
    const result = await checkChoiceField('SchoolInfo', field, SchoolInfoService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // BC_Shared_Plan choice fields
  const sharedPlanChoiceFields = [
    'OverallStatus',
    'ApprovalStatus',
  ]
  
  for (const field of sharedPlanChoiceFields) {
    const result = await checkChoiceField('BC_Shared_Plan', field, BC_Shared_PlanService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // BC_Teams_Members choice fields
  const teamMembersChoiceFields = [
    'Role',
    'BackupMember',
  ]
  
  for (const field of teamMembersChoiceFields) {
    const result = await checkChoiceField('BC_Teams_Members', field, BC_Teams_MembersService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // BC_Plan_Scenarios choice fields
  const scenariosChoiceFields = [
    'Category',
    'Priority',
    'Status',
  ]
  
  for (const field of scenariosChoiceFields) {
    const result = await checkChoiceField('BC_Plan_Scenarios', field, BC_Plan_ScenariosService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // BC_Plan_Documents choice fields
  const documentsChoiceFields = [
    'DocumentType',
    'Status',
  ]
  
  for (const field of documentsChoiceFields) {
    const result = await checkChoiceField('BC_Plan_Documents', field, BC_Plan_DocumentsService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // BC_Plan_Review choice fields
  const reviewChoiceFields = [
    'ReviewerRole',
    'Status',
  ]
  
  for (const field of reviewChoiceFields) {
    const result = await checkChoiceField('BC_Plan_Review', field, BC_Plan_ReviewService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // BC_Admin_Contacts choice fields
  const contactsChoiceFields = [
    'ContactScope',
    'ContactTiming',
    'JobRole',
  ]
  
  for (const field of contactsChoiceFields) {
    const result = await checkChoiceField('BC_Admin_Contacts', field, BC_Admin_ContactsService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // BC_Mutual_Operation choice fields
  const mutualOpChoiceFields = [
    'AgreementStatus',
    'MembershipType',
  ]
  
  for (const field of mutualOpChoiceFields) {
    const result = await checkChoiceField('BC_Mutual_Operation', field, BC_Mutual_OperationService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // BC_Damage_Reports choice fields
  const damageReportsChoiceFields = [
    'DamageType',
    'BuildingDamage',
    'EquipmentDamage',
    'DataLoss',
  ]
  
  for (const field of damageReportsChoiceFields) {
    const result = await checkChoiceField('BC_Damage_Reports', field, BC_Damage_ReportsService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // BC_DR_Checklist choice fields
  const checklistChoiceFields = [
    'Status',
    'CheckedBy',
  ]
  
  for (const field of checklistChoiceFields) {
    const result = await checkChoiceField('BC_DR_Checklist', field, BC_DR_ChecklistService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // BC_Incident_Evaluations choice fields  
  const evaluationsChoiceFields = [
    'Level',
  ]
  
  for (const field of evaluationsChoiceFields) {
    const result = await checkChoiceField('BC_Incident_Evaluations', field, BC_Incident_EvaluationsService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  // School_Training_Log choice fields
  const trainingLogChoiceFields = [
    'RegistrationType',
  ]
  
  for (const field of trainingLogChoiceFields) {
    const result = await checkChoiceField('School_Training_Log', field, School_Training_LogService)
    results.push(result)
    console.log(`  ${result.status === 'pass' ? '✓' : '✗'} ${field}: ${result.message}`)
  }
  
  console.log('')
  
  // ═══════════════════════════════════════════════════════════
  // GENERATE REPORT
  // ═══════════════════════════════════════════════════════════
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warnings = results.filter(r => r.status === 'warn').length
  
  const report: DeploymentReport = {
    timestamp: new Date().toISOString(),
    totalChecks: results.length,
    passed,
    failed,
    warnings,
    results
  }
  
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  📊 DEPLOYMENT READINESS SUMMARY')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  Total Checks: ${report.totalChecks}`)
  console.log(`  ✓ Passed:     ${passed}`)
  console.log(`  ✗ Failed:     ${failed}`)
  console.log(`  ⚠ Warnings:   ${warnings}`)
  console.log('')
  
  if (failed === 0) {
    console.log('  🎉 ALL CHECKS PASSED - READY FOR DEPLOYMENT!')
  } else {
    console.log('  ❌ DEPLOYMENT BLOCKED - Fix the following issues:')
    console.log('')
    results
      .filter(r => r.status === 'fail')
      .forEach(r => {
        console.log(`     • ${r.name}: ${r.message}`)
      })
  }
  
  console.log('')
  console.log('═══════════════════════════════════════════════════════════')
  
  return report
}

/**
 * Quick check - just choice fields
 */
export async function checkChoiceFieldsOnly(): Promise<CheckResult[]> {
  console.log('🔍 Quick Check: Choice Fields Only')
  console.log('───────────────────────────────────────────────────────────')
  
  const results: CheckResult[] = []
  
  // All choice field checks grouped by importance
  const criticalFields = [
    { list: 'SBC_Incidents_Log', field: 'IncidentCategory', service: SBC_Incidents_LogService },
    { list: 'SBC_Incidents_Log', field: 'RiskLevel', service: SBC_Incidents_LogService },
    { list: 'SBC_Incidents_Log', field: 'ActionTaken', service: SBC_Incidents_LogService },
    { list: 'Coordination_Programs_Catalog', field: 'ActivityType', service: Coordination_Programs_CatalogService },
    { list: 'Coordination_Programs_Catalog', field: 'ProviderEntity', service: Coordination_Programs_CatalogService },
    { list: 'SBC_Drills_Log', field: 'DrillHypothesis', service: SBC_Drills_LogService },
    { list: 'SBC_Drills_Log', field: 'TargetGroup', service: SBC_Drills_LogService },
  ]
  
  for (const { list, field, service } of criticalFields) {
    const result = await checkChoiceField(list, field, service as any)
    results.push(result)
    const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⚠'
    console.log(`  ${icon} ${list}.${field}: ${result.message}`)
  }
  
  const failed = results.filter(r => r.status === 'fail')
  console.log('')
  console.log(`Summary: ${results.length - failed.length}/${results.length} passed`)
  
  if (failed.length > 0) {
    console.log('')
    console.log('⚠️ Fields with ZERO values (need to add choices in SharePoint):')
    failed.forEach(r => console.log(`   - ${r.name}`))
  }
  
  return results
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).runDeploymentCheck = runDeploymentCheck;
  (window as any).checkChoiceFieldsOnly = checkChoiceFieldsOnly;
}
