/**
 * Supporting Documents Sidebar - المستندات المساندة
 * Shows supporting documents uploaded by admin for schools to view/download
 */

import React, { useState, useEffect } from 'react'
import { Panel, PanelType, Stack, Text, Icon, DefaultButton, MessageBar, MessageBarType, Spinner } from '@fluentui/react'
import { AdminDataService, BCPlanDocument } from '../services/adminDataService'

interface SupportingDocsSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const SupportingDocsSidebar: React.FC<SupportingDocsSidebarProps> = ({ isOpen, onClose }) => {
  const [documents, setDocuments] = useState<BCPlanDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadDocuments()
    }
  }, [isOpen])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const docs = await AdminDataService.getBCPlanDocuments()
      // Only show shared documents that have been uploaded (have fileName)
      const uploadedSharedDocs = docs.filter(d => d.isShared && d.fileName && d.fileName.trim() !== '')
      setDocuments(uploadedSharedDocs)
    } catch (e: any) {
      console.error('Error loading supporting documents:', e)
      setError('فشل تحميل المستندات')
    } finally {
      setLoading(false)
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      policy: 'سياسة',
      plan: 'خطة',
      procedure: 'إجراء',
      template: 'نموذج',
      report: 'تقرير',
      other: 'أخرى'
    }
    return labels[type] || type
  }

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      policy: '#0078d4',
      plan: '#107c10',
      procedure: '#ff8c00',
      template: '#8764b8',
      report: '#d13438',
      other: '#605e5c'
    }
    return colors[type] || '#605e5c'
  }

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onClose}
      type={PanelType.medium}
      headerText="📚 المستندات المساندة"
      closeButtonAriaLabel="إغلاق"
      styles={{
        header: {
          backgroundColor: '#008752',
          color: '#fff',
        },
        headerText: {
          color: '#fff',
          fontSize: '1.1rem',
          fontWeight: 600,
        },
        content: {
          padding: 0,
        },
      }}
    >
      <div style={{ padding: 20 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spinner label="جاري تحميل المستندات..." />
          </div>
        )}

        {error && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
            {error}
          </MessageBar>
        )}

        {!loading && !error && documents.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 40,
            backgroundColor: '#f3f2f1',
            borderRadius: 8,
          }}>
            <Icon iconName="DocumentSet" style={{ fontSize: 48, color: '#a19f9d', marginBottom: 12 }} />
            <Text variant="large" block style={{ color: '#605e5c', marginBottom: 8 }}>
              لا توجد مستندات متاحة حالياً
            </Text>
            <Text variant="small" block style={{ color: '#a19f9d' }}>
              سيتم نشر المستندات المساندة من قبل إدارة التعليم
            </Text>
          </div>
        )}

        {!loading && !error && documents.length > 0 && (
          <>
            <MessageBar messageBarType={MessageBarType.info} styles={{ root: { marginBottom: 16 } }}>
              <strong>المستندات المساندة لاستمرارية الأعمال</strong>
              <br />
              السياسات، الإجراءات، النماذج، والتقارير المشتركة من إدارة التعليم
            </MessageBar>

            <Stack tokens={{ childrenGap: 12 }}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    padding: 16,
                    border: '1px solid #edebe9',
                    borderRadius: 8,
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <Icon
                      iconName="DocumentPDF"
                      style={{
                        fontSize: 32,
                        color: getDocumentTypeColor(doc.documentType),
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text variant="medium" style={{ fontWeight: 600, color: '#323130' }}>
                          {doc.title}
                        </Text>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            backgroundColor: getDocumentTypeColor(doc.documentType) + '20',
                            color: getDocumentTypeColor(doc.documentType),
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {getDocumentTypeLabel(doc.documentType)}
                        </span>
                      </div>

                      {doc.description && (
                        <Text variant="small" block style={{ color: '#605e5c', marginBottom: 8 }}>
                          {doc.description}
                        </Text>
                      )}

                      <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                        {doc.version && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Icon iconName="Version" style={{ fontSize: 12, color: '#8a8886' }} />
                            <Text variant="tiny" style={{ color: '#8a8886' }}>
                              الإصدار: {doc.version}
                            </Text>
                          </div>
                        )}
                        {doc.shareDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Icon iconName="Calendar" style={{ fontSize: 12, color: '#8a8886' }} />
                            <Text variant="tiny" style={{ color: '#8a8886' }}>
                              تاريخ النشر: {new Date(doc.shareDate).toLocaleDateString('ar-SA')}
                            </Text>
                          </div>
                        )}
                      </div>

                      {doc.fileName && (
                        <DefaultButton
                          text="تحميل المستند"
                          iconProps={{ iconName: 'Download' }}
                          onClick={() => {
                            // In a real implementation, this would download from SharePoint
                            alert(`تحميل المستند: ${doc.fileName}\n\nملاحظة: يتطلب التكامل مع SharePoint Document Library`)
                          }}
                          styles={{
                            root: {
                              marginTop: 8,
                              backgroundColor: '#0078d4',
                              borderColor: '#0078d4',
                            },
                            rootHovered: {
                              backgroundColor: '#106ebe',
                              borderColor: '#106ebe',
                            },
                            label: {
                              color: '#fff',
                              fontWeight: 600,
                            },
                            icon: {
                              color: '#fff',
                            },
                          }}
                        />
                      )}

                      {doc.notes && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: 8,
                            backgroundColor: '#fff4ce',
                            borderRadius: 4,
                            borderRight: '3px solid #ffb900',
                          }}
                        >
                          <Text variant="tiny" style={{ color: '#605e5c' }}>
                            <strong>ملاحظة:</strong> {doc.notes}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </Stack>
          </>
        )}
      </div>
    </Panel>
  )
}

export default SupportingDocsSidebar
