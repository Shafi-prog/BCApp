/**
 * Deployment Check Component
 * Shows deployment readiness status in the Admin panel
 */

import React, { useState } from 'react'
import {
  PrimaryButton,
  DefaultButton,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  Icon,
  ProgressIndicator,
} from '@fluentui/react'
import { runDeploymentCheck, checkChoiceFieldsOnly, DeploymentReport, CheckResult } from '../utils/deploymentCheck'

export const DeploymentCheckPanel: React.FC = () => {
  const [running, setRunning] = useState(false)
  const [report, setReport] = useState<DeploymentReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runFullCheck = async () => {
    setRunning(true)
    setError(null)
    try {
      const result = await runDeploymentCheck()
      setReport(result)
    } catch (e: any) {
      setError(e?.message || 'خطأ في تنفيذ الفحص')
    } finally {
      setRunning(false)
    }
  }

  const runQuickCheck = async () => {
    setRunning(true)
    setError(null)
    try {
      const results = await checkChoiceFieldsOnly()
      setReport({
        timestamp: new Date().toISOString(),
        totalChecks: results.length,
        passed: results.filter(r => r.status === 'pass').length,
        failed: results.filter(r => r.status === 'fail').length,
        warnings: results.filter(r => r.status === 'warn').length,
        results,
      })
    } catch (e: any) {
      setError(e?.message || 'خطأ في تنفيذ الفحص')
    } finally {
      setRunning(false)
    }
  }

  const columns: IColumn[] = [
    {
      key: 'status',
      name: 'الحالة',
      minWidth: 50,
      maxWidth: 60,
      onRender: (item: CheckResult) => (
        <Icon
          iconName={item.status === 'pass' ? 'CheckMark' : item.status === 'fail' ? 'ErrorBadge' : 'Warning'}
          styles={{
            root: {
              color: item.status === 'pass' ? '#107c10' : item.status === 'fail' ? '#d13438' : '#ffaa44',
              fontSize: 16,
            },
          }}
        />
      ),
    },
    {
      key: 'category',
      name: 'الفئة',
      minWidth: 100,
      maxWidth: 120,
      fieldName: 'category',
    },
    {
      key: 'name',
      name: 'الاسم',
      minWidth: 180,
      maxWidth: 250,
      fieldName: 'name',
    },
    {
      key: 'message',
      name: 'النتيجة',
      minWidth: 200,
      fieldName: 'message',
    },
  ]

  return (
    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { padding: 20 } }}>
      <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
        🔍 فحص جاهزية النشر
      </Text>

      <Stack horizontal tokens={{ childrenGap: 12 }}>
        <PrimaryButton
          text="فحص شامل"
          iconProps={{ iconName: 'Play' }}
          onClick={runFullCheck}
          disabled={running}
        />
        <DefaultButton
          text="فحص سريع (القوائم المنسدلة)"
          iconProps={{ iconName: 'Play' }}
          onClick={runQuickCheck}
          disabled={running}
        />
      </Stack>

      {running && (
        <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
          <Spinner size={SpinnerSize.medium} />
          <Text>جاري تنفيذ الفحوصات...</Text>
        </Stack>
      )}

      {error && (
        <MessageBar messageBarType={MessageBarType.error}>
          {error}
        </MessageBar>
      )}

      {report && !running && (
        <Stack tokens={{ childrenGap: 16 }}>
          {/* Summary */}
          <Stack
            horizontal
            tokens={{ childrenGap: 24 }}
            styles={{
              root: {
                padding: 16,
                backgroundColor: report.failed === 0 ? '#dff6dd' : '#fde7e9',
                borderRadius: 8,
              },
            }}
          >
            <Stack horizontalAlign="center">
              <Text variant="xxLarge" styles={{ root: { fontWeight: 700 } }}>
                {report.totalChecks}
              </Text>
              <Text variant="small">إجمالي الفحوصات</Text>
            </Stack>
            <Stack horizontalAlign="center">
              <Text variant="xxLarge" styles={{ root: { fontWeight: 700, color: '#107c10' } }}>
                {report.passed}
              </Text>
              <Text variant="small">ناجح</Text>
            </Stack>
            <Stack horizontalAlign="center">
              <Text variant="xxLarge" styles={{ root: { fontWeight: 700, color: '#d13438' } }}>
                {report.failed}
              </Text>
              <Text variant="small">فاشل</Text>
            </Stack>
            <Stack horizontalAlign="center">
              <Text variant="xxLarge" styles={{ root: { fontWeight: 700, color: '#ffaa44' } }}>
                {report.warnings}
              </Text>
              <Text variant="small">تحذيرات</Text>
            </Stack>
          </Stack>

          {/* Progress bar */}
          <ProgressIndicator
            label={report.failed === 0 ? '✓ جاهز للنشر' : '✗ يوجد مشاكل تحتاج إصلاح'}
            percentComplete={report.passed / report.totalChecks}
            barHeight={8}
            styles={{
              progressBar: {
                backgroundColor: report.failed === 0 ? '#107c10' : '#d13438',
              },
            }}
          />

          {/* Status message */}
          {report.failed === 0 ? (
            <MessageBar messageBarType={MessageBarType.success}>
              🎉 جميع الفحوصات ناجحة - التطبيق جاهز للنشر!
            </MessageBar>
          ) : (
            <MessageBar messageBarType={MessageBarType.error}>
              ❌ يوجد {report.failed} مشكلة تحتاج إصلاح قبل النشر
            </MessageBar>
          )}

          {/* Failed items first */}
          {report.failed > 0 && (
            <Stack tokens={{ childrenGap: 8 }}>
              <Text variant="large" styles={{ root: { fontWeight: 600, color: '#d13438' } }}>
                ⚠️ المشاكل التي تحتاج إصلاح:
              </Text>
              <Stack tokens={{ childrenGap: 4 }}>
                {report.results
                  .filter(r => r.status === 'fail')
                  .map((r, i) => (
                    <MessageBar key={i} messageBarType={MessageBarType.error}>
                      <strong>{r.name}</strong>: {r.message}
                    </MessageBar>
                  ))}
              </Stack>
            </Stack>
          )}

          {/* Full results table */}
          <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
            📋 تفاصيل الفحوصات:
          </Text>
          <DetailsList
            items={report.results}
            columns={columns}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            isHeaderVisible={true}
          />

          <Text variant="small" styles={{ root: { color: '#666' } }}>
            آخر فحص: {new Date(report.timestamp).toLocaleString('ar-SA')}
          </Text>
        </Stack>
      )}
    </Stack>
  )
}

export default DeploymentCheckPanel
