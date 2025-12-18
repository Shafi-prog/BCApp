/**
 * Diagnostic Page - Check SharePoint Dropdown Values
 * This page loads all choice field values from SharePoint and displays them
 * to help identify mismatches between actual SharePoint values and frontend fallbacks
 */

import React, { useState, useEffect } from 'react'
import { Stack, PrimaryButton, Spinner, Text, MessageBar, MessageBarType } from '@fluentui/react'
import { Coordination_Programs_CatalogService, SBC_Incidents_LogService } from '../generated'
import { SharePointService } from '../services/sharepointService'

interface FieldComparison {
  fieldName: string
  fieldNameAr: string
  sharePointValues: string[]
  fallbackValues: string[]
  matches: boolean
  missingInFallback: string[]
  extraInFallback: string[]
}

const DiagnosticDropdownValues: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [comparisons, setComparisons] = useState<FieldComparison[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadAndCompare = async () => {
    setLoading(true)
    setError(null)
    const results: FieldComparison[] = []

    try {
      // 1. Coordination_Programs_Catalog fields
      console.log('🔍 Loading Coordination_Programs_Catalog choices...')
      
      // ProviderEntity
      try {
        const providerResult = await Coordination_Programs_CatalogService.getReferencedEntity('', 'ProviderEntity')
        console.log('📊 ProviderEntity result:', providerResult)
        if (providerResult?.success && providerResult.data) {
          const data: any = providerResult.data
          const values = Array.isArray(data) ? data : (data.value || [])
          const sharePointValues = values.map((v: any) => v.Value || String(v))
          const fallbackValues = [
            'إدارة الأمن والسلامة المدرسية',
            'إدارة التدريب والابتعاث',
            'الدفاع المدني',
            'الهلال الأحمر',
            'جهة خارجية'
          ]
          
          results.push({
            fieldName: 'ProviderEntity',
            fieldNameAr: 'الجهة المقدمة',
            sharePointValues,
            fallbackValues,
            matches: JSON.stringify(sharePointValues.sort()) === JSON.stringify(fallbackValues.sort()),
            missingInFallback: sharePointValues.filter((v: string) => !fallbackValues.includes(v)),
            extraInFallback: fallbackValues.filter((v: string) => !sharePointValues.includes(v))
          })
        }
      } catch (e) {
        console.error('❌ Error loading ProviderEntity:', e)
      }

      // ActivityType
      try {
        const activityResult = await Coordination_Programs_CatalogService.getReferencedEntity('', 'ActivityType')
        console.log('📊 ActivityType result:', activityResult)
        if (activityResult?.success && activityResult.data) {
          const data: any = activityResult.data
          const values = Array.isArray(data) ? data : (data.value || [])
          const sharePointValues = values.map((v: any) => v.Value || String(v))
          const fallbackValues = ['ورشة عمل', 'دورة تدريبية', 'محاضرة', 'ندوة', 'لقاء']
          
          results.push({
            fieldName: 'ActivityType',
            fieldNameAr: 'نوع النشاط',
            sharePointValues,
            fallbackValues,
            matches: JSON.stringify(sharePointValues.sort()) === JSON.stringify(fallbackValues.sort()),
            missingInFallback: sharePointValues.filter((v: string) => !fallbackValues.includes(v)),
            extraInFallback: fallbackValues.filter((v: string) => !sharePointValues.includes(v))
          })
        }
      } catch (e) {
        console.error('❌ Error loading ActivityType:', e)
      }

      // TargetAudience
      try {
        const targetResult = await Coordination_Programs_CatalogService.getReferencedEntity('', 'TargetAudience')
        console.log('📊 TargetAudience result:', targetResult)
        if (targetResult?.success && targetResult.data) {
          const data: any = targetResult.data
          const values = Array.isArray(data) ? data : (data.value || [])
          const sharePointValues = values.map((v: any) => v.Value || String(v))
          const fallbackValues = [
            'منسقي الأمن والسلامة',
            'قادة المدارس',
            'المعلمين',
            'الطلاب',
            'أولياء الأمور',
            'فريق الأمن والسلامة'
          ]
          
          results.push({
            fieldName: 'TargetAudience',
            fieldNameAr: 'الفئة المستهدفة',
            sharePointValues,
            fallbackValues,
            matches: JSON.stringify(sharePointValues.sort()) === JSON.stringify(fallbackValues.sort()),
            missingInFallback: sharePointValues.filter((v: string) => !fallbackValues.includes(v)),
            extraInFallback: fallbackValues.filter((v: string) => !sharePointValues.includes(v))
          })
        }
      } catch (e) {
        console.error('❌ Error loading TargetAudience:', e)
      }

      // ExecutionMode
      try {
        const executionResult = await Coordination_Programs_CatalogService.getReferencedEntity('', 'ExecutionMode')
        console.log('📊 ExecutionMode result:', executionResult)
        if (executionResult?.success && executionResult.data) {
          const data: any = executionResult.data
          const values = Array.isArray(data) ? data : (data.value || [])
          const sharePointValues = values.map((v: any) => v.Value || String(v))
          const fallbackValues = ['حضوري', 'تعليم عن بعد', 'عن بعد', 'تعليم مدمج', 'مدمج']
          
          results.push({
            fieldName: 'ExecutionMode',
            fieldNameAr: 'آلية التنفيذ',
            sharePointValues,
            fallbackValues,
            matches: JSON.stringify(sharePointValues.sort()) === JSON.stringify(fallbackValues.sort()),
            missingInFallback: sharePointValues.filter((v: string) => !fallbackValues.includes(v)),
            extraInFallback: fallbackValues.filter((v: string) => !sharePointValues.includes(v))
          })
        }
      } catch (e) {
        console.error('❌ Error loading ExecutionMode:', e)
      }

      // CoordinationStatus
      try {
        const statusResult = await Coordination_Programs_CatalogService.getReferencedEntity('', 'CoordinationStatus')
        console.log('📊 CoordinationStatus result:', statusResult)
        if (statusResult?.success && statusResult.data) {
          const data: any = statusResult.data
          const values = Array.isArray(data) ? data : (data.value || [])
          const sharePointValues = values.map((v: any) => v.Value || String(v))
          const fallbackValues = ['تم التنفيذ', 'قيد التنفيذ', 'مخطط', 'ملغي', 'مؤجل']
          
          results.push({
            fieldName: 'CoordinationStatus',
            fieldNameAr: 'حالة البرنامج',
            sharePointValues,
            fallbackValues,
            matches: JSON.stringify(sharePointValues.sort()) === JSON.stringify(fallbackValues.sort()),
            missingInFallback: sharePointValues.filter((v: string) => !fallbackValues.includes(v)),
            extraInFallback: fallbackValues.filter((v: string) => !sharePointValues.includes(v))
          })
        }
      } catch (e) {
        console.error('❌ Error loading CoordinationStatus:', e)
      }

      // 2. SBC_Incidents_Log fields
      console.log('🔍 Loading SBC_Incidents_Log choices...')

      // ActionTaken
      try {
        const actionResult = await SBC_Incidents_LogService.getReferencedEntity('', 'ActionTaken')
        console.log('📊 ActionTaken result:', actionResult)
        if (actionResult?.success && actionResult.data) {
          const data: any = actionResult.data
          const values = Array.isArray(data) ? data : (data.value || [])
          const sharePointValues = values.map((v: any) => v.Value || String(v))
          const fallbackValues = ['إخلاء', 'إسعاف', 'إطفاء', 'إبلاغ الجهات', 'أخرى']
          
          results.push({
            fieldName: 'ActionTaken',
            fieldNameAr: 'الإجراء المتخذ',
            sharePointValues,
            fallbackValues,
            matches: JSON.stringify(sharePointValues.sort()) === JSON.stringify(fallbackValues.sort()),
            missingInFallback: sharePointValues.filter((v: string) => !fallbackValues.includes(v)),
            extraInFallback: fallbackValues.filter((v: string) => !sharePointValues.includes(v))
          })
        }
      } catch (e) {
        console.error('❌ Error loading ActionTaken:', e)
      }

      setComparisons(results)
      console.log('✅ Comparison complete:', results)
    } catch (error) {
      console.error('❌ Error in loadAndCompare:', error)
      setError(String(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Stack tokens={{ childrenGap: 16 }}>
        <Text variant="xxLarge" style={{ fontWeight: 600 }}>
          🔍 تشخيص قيم الحقول المنسدلة
        </Text>
        
        <Text>
          هذه الصفحة تساعد في مقارنة القيم الفعلية من SharePoint مع القيم الاحتياطية في الكود
        </Text>

        {error && (
          <MessageBar messageBarType={MessageBarType.error}>
            خطأ: {error}
          </MessageBar>
        )}

        <PrimaryButton
          text="تحميل ومقارنة القيم"
          onClick={loadAndCompare}
          disabled={loading}
          iconProps={{ iconName: 'Sync' }}
        />

        {loading && <Spinner label="جاري التحميل..." />}

        {comparisons.length > 0 && (
          <div>
            <Text variant="xLarge" style={{ fontWeight: 600, marginBottom: 16 }}>
              النتائج:
            </Text>

            {comparisons.map((comp, idx) => (
              <div
                key={idx}
                style={{
                  padding: 16,
                  marginBottom: 16,
                  borderRadius: 8,
                  backgroundColor: comp.matches ? '#dff6dd' : '#fde7e9',
                  border: `2px solid ${comp.matches ? '#107c10' : '#d83b01'}`,
                }}
              >
                <Stack tokens={{ childrenGap: 8 }}>
                  <Text variant="large" style={{ fontWeight: 600 }}>
                    {comp.matches ? '✅' : '❌'} {comp.fieldNameAr} ({comp.fieldName})
                  </Text>

                  <div>
                    <Text variant="medium" style={{ fontWeight: 600 }}>
                      القيم من SharePoint ({comp.sharePointValues.length}):
                    </Text>
                    <ul>
                      {comp.sharePointValues.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <Text variant="medium" style={{ fontWeight: 600 }}>
                      القيم الاحتياطية في الكود ({comp.fallbackValues.length}):
                    </Text>
                    <ul>
                      {comp.fallbackValues.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>

                  {comp.missingInFallback.length > 0 && (
                    <div style={{ padding: 8, backgroundColor: '#fff4ce', borderRadius: 4 }}>
                      <Text variant="medium" style={{ fontWeight: 600, color: '#835c00' }}>
                        ⚠️ قيم موجودة في SharePoint لكن مفقودة في الكود:
                      </Text>
                      <ul>
                        {comp.missingInFallback.map((v, i) => (
                          <li key={i} style={{ color: '#835c00' }}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {comp.extraInFallback.length > 0 && (
                    <div style={{ padding: 8, backgroundColor: '#f0f9ff', borderRadius: 4 }}>
                      <Text variant="medium" style={{ fontWeight: 600, color: '#004578' }}>
                        📋 قيم موجودة في الكود لكن مفقودة في SharePoint:
                      </Text>
                      <ul>
                        {comp.extraInFallback.map((v, i) => (
                          <li key={i} style={{ color: '#004578' }}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Stack>
              </div>
            ))}

            <MessageBar messageBarType={MessageBarType.info}>
              💡 تعليمات: إذا وجدت عدم تطابق، قم بنسخ القيم الصحيحة من SharePoint وأرسلها للمطور لتحديث الكود
            </MessageBar>
          </div>
        )}
      </Stack>
    </div>
  )
}

export default DiagnosticDropdownValues
