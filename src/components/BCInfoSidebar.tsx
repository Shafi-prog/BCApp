/**
 * BC Info Sidebar - معلومات هامة للمدارس
 * Important BC information sidebar for schools
 * Contains: RTO/MAO targets, Emergency contacts, Scenarios, Guidelines
 */

import React, { useState, useEffect } from 'react'
import { Stack, Text, Icon, DefaultButton, IconButton, Link, PrimaryButton, TextField, Dropdown, IDropdownOption, MessageBar, MessageBarType } from '@fluentui/react'
import { criticalActivities, criticalSystems, scenarios, disruptionLevels, definitions } from '../data/bcPlanParameters'
import { AdminDataService, AdminContact } from '../services/adminDataService'
import { useAuth } from '../context/AuthContext'

interface BCInfoSidebarProps {
  isOpen: boolean
  onClose: () => void
}

type InfoTab = 'rto' | 'contacts' | 'scenarios' | 'levels' | 'definitions'

const BCInfoSidebar: React.FC<BCInfoSidebarProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<InfoTab>('rto')
  const [allContacts, setAllContacts] = useState<AdminContact[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingContact, setEditingContact] = useState<AdminContact | null>(null)
  const { user } = useAuth()
  const isAdmin = user?.type === 'admin'

  // Load all contacts (both internal and external) from AdminDataService
  useEffect(() => {
    if (isOpen) {
      loadAllContacts()
    }
  }, [isOpen])

  const loadAllContacts = async () => {
    try {
      const adminService = AdminDataService.getInstance()
      const contacts = await adminService.getAdminContacts()
      // Show only contacts marked as visible to schools (unless admin is viewing)
      setAllContacts(isAdmin ? contacts : contacts.filter(c => c.isVisibleToSchools))
    } catch (error) {
      console.error('Failed to load contacts:', error)
    }
  }

  const handleSaveContact = async (contact: Partial<AdminContact>) => {
    try {
      const adminService = AdminDataService.getInstance()
      if (editingContact?.id) {
        await adminService.updateAdminContact(editingContact.id, contact)
      } else {
        // Determine category based on user selection or default to external
        await adminService.createAdminContact({ 
          ...contact, 
          category: contact.category || 'external'
        } as Omit<AdminContact, 'id'>)
      }
      await loadAllContacts()
      setEditingContact(null)
      setIsEditMode(false)
    } catch (error) {
      console.error('Failed to save contact:', error)
    }
  }

  const handleDeleteContact = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف جهة الاتصال هذه؟')) return
    try {
      const adminService = AdminDataService.getInstance()
      await adminService.deleteAdminContact(id)
      await loadAllContacts()
    } catch (error) {
      console.error('Failed to delete contact:', error)
    }
  }

  if (!isOpen) return null

  const tabs: { key: InfoTab; label: string; icon: string }[] = [
    { key: 'rto', label: 'أوقات التعافي', icon: 'Timer' },
    { key: 'contacts', label: 'جهات الاتصال', icon: 'Phone' },
    { key: 'scenarios', label: 'السيناريوهات', icon: 'BulletedList' },
    { key: 'levels', label: 'مستويات الاضطراب', icon: 'Warning' },
    { key: 'definitions', label: 'المصطلحات', icon: 'Dictionary' },
  ]

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 260,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 998,
        }}
      />
      
      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 380,
        height: '100vh',
        backgroundColor: '#fff',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #0078d4, #004578)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon iconName="BookAnswers" style={{ fontSize: 24 }} />
            <div>
              <Text variant="large" style={{ color: '#fff', fontWeight: 600, display: 'block' }}>
                المرجع السريع
              </Text>
              <Text variant="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
                أوقات التعافي، جهات الاتصال، المصطلحات
              </Text>
            </div>
          </div>
          <IconButton
            iconProps={{ iconName: 'Cancel' }}
            onClick={onClose}
            styles={{ root: { color: '#fff' }, rootHovered: { color: '#fff', background: 'rgba(255,255,255,0.2)' } }}
          />
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e8e8e8',
          backgroundColor: '#f8f9fa',
          overflowX: 'auto',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '12px 8px',
                border: 'none',
                background: activeTab === tab.key ? '#fff' : 'transparent',
                borderBottom: activeTab === tab.key ? '3px solid #0078d4' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                color: activeTab === tab.key ? '#0078d4' : '#666',
                fontSize: '0.75rem',
                fontWeight: activeTab === tab.key ? 600 : 400,
                transition: 'all 0.2s',
                minWidth: 70,
              }}
            >
              <Icon iconName={tab.icon} style={{ fontSize: 16 }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {activeTab === 'rto' && <RTOContent />}
          {activeTab === 'contacts' && (
            <ContactsContent 
              contacts={allContacts}
              isAdmin={isAdmin}
              isEditMode={isEditMode}
              onToggleEditMode={() => setIsEditMode(!isEditMode)}
              onAddContact={() => setEditingContact({ id: 0, Title: '', role: '', email: '', phone: '', organization: '', category: 'external', notes: '' })}
              onEditContact={setEditingContact}
              onDeleteContact={handleDeleteContact}
            />
          )}
          {activeTab === 'scenarios' && <ScenariosContent />}
          {activeTab === 'levels' && <LevelsContent />}
          {activeTab === 'definitions' && <DefinitionsContent />}
        </div>
        
        {/* Edit Contact Panel */}
        {editingContact && (
          <EditContactPanel
            contact={editingContact}
            onSave={handleSaveContact}
            onClose={() => setEditingContact(null)}
          />
        )}

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e8e8e8',
          backgroundColor: '#f8f9fa',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#666',
        }}>
          <div>📚 المصدر: خطة استمرارية العملية التعليمية - النسخة الثالثة (2025)</div>
          <div style={{ marginTop: 4, color: '#999', fontSize: '0.65rem' }}>
            للاطلاع على خطة المدرسة المعتمدة → اذهب إلى "خطة استمرارية التعليم" من القائمة
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================
// RTO Content
// ============================================
const RTOContent: React.FC = () => (
  <Stack tokens={{ childrenGap: 16 }}>
    {/* Activities RTO */}
    <div className="card" style={{ padding: 12 }}>
      <Text variant="mediumPlus" style={{ fontWeight: 600, color: '#0078d4', marginBottom: 12, display: 'block' }}>
        ⏱️ أوقات التعافي المستهدفة (RTO/MAO)
      </Text>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ padding: 8, border: '1px solid #e0e0e0', textAlign: 'right' }}>النشاط</th>
            <th style={{ padding: 8, border: '1px solid #e0e0e0', textAlign: 'center' }}>RTO</th>
            <th style={{ padding: 8, border: '1px solid #e0e0e0', textAlign: 'center' }}>MAO</th>
          </tr>
        </thead>
        <tbody>
          {criticalActivities.map(activity => (
            <tr key={activity.id}>
              <td style={{ padding: 8, border: '1px solid #e0e0e0', textAlign: 'right', fontSize: '0.75rem' }}>
                {activity.nameAr.substring(0, 40)}...
              </td>
              <td style={{ padding: 8, border: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 600, color: '#0078d4' }}>
                {activity.rtoDisplay}
              </td>
              <td style={{ padding: 8, border: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 600, color: '#d83b01' }}>
                {activity.maoDisplay}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Systems RTO */}
    <div className="card" style={{ padding: 12 }}>
      <Text variant="mediumPlus" style={{ fontWeight: 600, color: '#5c2d91', marginBottom: 12, display: 'block' }}>
        💻 الأنظمة التقنية الحرجة
      </Text>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ padding: 8, border: '1px solid #e0e0e0', textAlign: 'right' }}>النظام</th>
            <th style={{ padding: 8, border: '1px solid #e0e0e0', textAlign: 'center' }}>RTO</th>
            <th style={{ padding: 8, border: '1px solid #e0e0e0', textAlign: 'center' }}>RPO</th>
          </tr>
        </thead>
        <tbody>
          {criticalSystems.map(system => (
            <tr key={system.id}>
              <td style={{ padding: 8, border: '1px solid #e0e0e0', textAlign: 'right' }}>{system.nameAr}</td>
              <td style={{ padding: 8, border: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 600 }}>
                {system.rtoDisplay}
              </td>
              <td style={{ padding: 8, border: '1px solid #e0e0e0', textAlign: 'center' }}>
                {system.rpoDisplay}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Legend */}
    <div style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8, fontSize: '0.75rem' }}>
      <strong>المصطلحات:</strong>
      <ul style={{ margin: '8px 0 0', paddingRight: 20 }}>
        <li><strong>RTO</strong>: وقت الاسترداد المستهدف - أقصى وقت لاستعادة الخدمة</li>
        <li><strong>MAO</strong>: أعلى وقت مقبول للانقطاع - الحد الأقصى المسموح</li>
        <li><strong>RPO</strong>: نقطة استرجاع البيانات - أقصى فقدان مقبول للبيانات</li>
      </ul>
    </div>
  </Stack>
)

// ============================================
// Contacts Content
// ============================================
// ============================================
// Contact Item Component
// ============================================
interface ContactItemProps {
  contact: AdminContact
  isEditMode: boolean
  isAdmin: boolean
  onEditContact: (contact: AdminContact) => void
  onDeleteContact: (id: number) => void
  bgColor: string
  borderColor: string
  isEmergency?: boolean
}

const ContactItem: React.FC<ContactItemProps> = ({
  contact,
  isEditMode,
  isAdmin,
  onEditContact,
  onDeleteContact,
  bgColor,
  borderColor,
  isEmergency = false
}) => (
  <div 
    style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: 12,
      backgroundColor: bgColor,
      borderRadius: 8,
      border: `1px solid ${borderColor}`,
    }}
  >
    <div style={{ flex: 1 }}>
      <Text variant="medium" style={{ fontWeight: 600, display: 'block' }}>{contact.Title}</Text>
      {contact.role && <Text variant="small" style={{ color: '#666' }}>{contact.role}</Text>}
      {contact.contactScope && <Text variant="small" style={{ color: '#666' }}>{contact.contactScope}</Text>}
      {contact.email && <Text variant="tiny" style={{ color: '#999' }}>📧 {contact.email}</Text>}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {isEmergency && contact.phone && (
        <a 
          href={`tel:${contact.phone}`}
          style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#d83b01',
            textDecoration: 'none',
            backgroundColor: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            border: '2px solid #d83b01',
          }}
        >
          📞 {contact.phone}
        </a>
      )}
      {!isEmergency && contact.phone && (
        <Text style={{ fontWeight: 600, color: '#0078d4' }}>📞 {contact.phone}</Text>
      )}
      {isEditMode && isAdmin && (
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton
            iconProps={{ iconName: 'Edit' }}
            title="تعديل"
            onClick={() => onEditContact(contact)}
            styles={{ root: { color: '#0078d4' } }}
          />
          <IconButton
            iconProps={{ iconName: 'Delete' }}
            title="حذف"
            onClick={() => onDeleteContact(contact.id)}
            styles={{ root: { color: '#d32f2f' } }}
          />
        </div>
      )}
    </div>
  </div>
)

// ============================================
// Contacts Content
// ============================================
interface ContactsContentProps {
  contacts: AdminContact[]
  isAdmin: boolean
  isEditMode: boolean
  onToggleEditMode: () => void
  onAddContact: () => void
  onEditContact: (contact: AdminContact) => void
  onDeleteContact: (id: number) => void
}

const ContactsContent: React.FC<ContactsContentProps> = ({ 
  contacts, 
  isAdmin, 
  isEditMode, 
  onToggleEditMode, 
  onAddContact, 
  onEditContact, 
  onDeleteContact 
}) => {
  const internalContacts = contacts.filter(c => c.category === 'internal')
  const externalContacts = contacts.filter(c => c.category === 'external')
  
  return (
    <Stack tokens={{ childrenGap: 16 }}>
      {/* Admin Info Message */}
      {isAdmin && (
        <MessageBar messageBarType={MessageBarType.info}>
          💡 <strong>للمسؤول:</strong> يتم عرض جميع جهات الاتصال هنا. المدارس ترى فقط الجهات المحددة في لوحة الإدارة (عمود "في المرجع السريع").
        </MessageBar>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginBottom: 8 }}>
          <PrimaryButton 
            text={isEditMode ? "إنهاء التعديل" : "تعديل جهات الاتصال"}
            iconProps={{ iconName: isEditMode ? 'Accept' : 'Edit' }}
            onClick={onToggleEditMode}
          />
          {isEditMode && (
            <PrimaryButton 
              text="إضافة جهة اتصال"
              iconProps={{ iconName: 'Add' }}
              onClick={onAddContact}
              styles={{ root: { backgroundColor: '#107c10' } }}
            />
          )}
        </div>
      )}

      {/* No contacts message for schools */}
      {!isAdmin && contacts.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: '#666', backgroundColor: '#fafafa', borderRadius: 8 }}>
          <Icon iconName="ContactList" style={{ fontSize: 48, marginBottom: 12, color: '#ccc' }} />
          <div style={{ fontWeight: 600, marginBottom: 8 }}>لا توجد جهات اتصال متاحة حالياً</div>
          <div style={{ fontSize: '0.85rem' }}>سيتم إضافة جهات الاتصال من قبل إدارة التعليم</div>
        </div>
      )}

      {/* Internal Contacts */}
      {internalContacts.length > 0 && (
        <div className="card" style={{ padding: 12, backgroundColor: '#e8f4fd' }}>
          <Text variant="mediumPlus" style={{ fontWeight: 600, color: '#0078d4', marginBottom: 12, display: 'block' }}>
            🏢 جهات الاتصال الداخلية (إدارة التعليم)
          </Text>
          <Stack tokens={{ childrenGap: 8 }}>
            {internalContacts.map(contact => (
              <ContactItem 
                key={contact.id}
                contact={contact}
                isEditMode={isEditMode}
                isAdmin={isAdmin}
                onEditContact={onEditContact}
                onDeleteContact={onDeleteContact}
                bgColor="#fff"
                borderColor="#0078d4"
              />
            ))}
          </Stack>
        </div>
      )}

      {/* External Emergency Contacts */}
      {externalContacts.filter(c => c.phone).length > 0 && (
        <div className="card" style={{ padding: 12 }}>
          <Text variant="mediumPlus" style={{ fontWeight: 600, color: '#d83b01', marginBottom: 12, display: 'block' }}>
            🚨 أرقام الطوارئ الخارجية
          </Text>
          <Stack tokens={{ childrenGap: 8 }}>
            {externalContacts.filter(c => c.phone).map(contact => (
              <ContactItem 
                key={contact.id}
                contact={contact}
                isEditMode={isEditMode}
                isAdmin={isAdmin}
                onEditContact={onEditContact}
                onDeleteContact={onDeleteContact}
                bgColor="#fff5f5"
                borderColor="#ffd0d0"
                isEmergency
              />
            ))}
          </Stack>
        </div>
      )}

      {/* Other External Contacts */}
      {externalContacts.filter(c => !c.phone).length > 0 && (
        <div className="card" style={{ padding: 12 }}>
          <Text variant="mediumPlus" style={{ fontWeight: 600, color: '#107c10', marginBottom: 12, display: 'block' }}>
            📋 جهات الاتصال الخارجية الأخرى
          </Text>
          <Stack tokens={{ childrenGap: 8 }}>
            {externalContacts.filter(c => !c.phone).map(contact => (
              <ContactItem 
                key={contact.id}
                contact={contact}
                isEditMode={isEditMode}
                isAdmin={isAdmin}
                onEditContact={onEditContact}
                onDeleteContact={onDeleteContact}
                bgColor="#f5f5f5"
                borderColor="#107c10"
              />
            ))}
          </Stack>
        </div>
      )}
      {/* Contact Tips */}
      <div style={{ padding: 12, backgroundColor: '#e6f7ff', borderRadius: 8, fontSize: '0.75rem' }}>
        <strong>💡 نصائح التواصل:</strong>
        <ul style={{ margin: '8px 0 0', paddingRight: 20 }}>
          <li>عند الطوارئ: اتصل بالدفاع المدني أولاً (998)</li>
          <li>تأكد من سلامة الجميع قبل الإبلاغ</li>
          <li>وثق الحادث فوراً في نظام البلاغات</li>
          <li>أبلغ إدارة التعليم خلال ساعة من الحادث</li>
        </ul>
      </div>
    </Stack>
  )
}

// ============================================
// Scenarios Content
// ============================================
const ScenariosContent: React.FC = () => (
  <Stack tokens={{ childrenGap: 12 }}>
    <Text variant="medium" style={{ fontWeight: 600, marginBottom: 8 }}>
      📋 الفرضيات الخمس للاضطراب
    </Text>
    
    {scenarios.map((scenario, index) => (
      <div 
        key={scenario.id}
        className="card"
        style={{ 
          padding: 12,
          borderRight: `4px solid ${['#0078d4', '#5c2d91', '#d83b01', '#107c10', '#ffb900'][index]}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{
            backgroundColor: ['#0078d4', '#5c2d91', '#d83b01', '#107c10', '#ffb900'][index],
            color: '#fff',
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem',
            flexShrink: 0,
          }}>
            {scenario.number}
          </span>
          <div style={{ flex: 1 }}>
            <Text variant="small" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
              {scenario.nameAr}
            </Text>
            <Text variant="tiny" style={{ color: '#666', display: 'block', marginBottom: 8 }}>
              {scenario.description}
            </Text>
            <div style={{ fontSize: '0.7rem' }}>
              <strong>البدائل:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {scenario.alternatives.map((alt, i) => (
                  <span 
                    key={i}
                    style={{
                      padding: '2px 8px',
                      backgroundColor: '#e6f7ff',
                      borderRadius: 12,
                      fontSize: '0.65rem',
                    }}
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </Stack>
)

// ============================================
// Levels Content
// ============================================
const LevelsContent: React.FC = () => {
  const levelColors = ['#107c10', '#ffb900', '#d83b01', '#a4262c']
  
  return (
    <Stack tokens={{ childrenGap: 12 }}>
      <Text variant="medium" style={{ fontWeight: 600, marginBottom: 8 }}>
        ⚠️ مستويات تصنيف الاضطراب
      </Text>
      
      {disruptionLevels.map((level, index) => (
        <div 
          key={level.level}
          className="card"
          style={{ 
            padding: 12,
            borderRight: `4px solid ${levelColors[index]}`,
            backgroundColor: index === 3 ? '#fff5f5' : '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              backgroundColor: levelColors[index],
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 4,
              fontWeight: 600,
              fontSize: '0.8rem',
            }}>
              {level.nameAr}
            </span>
            <Text variant="small" style={{ color: '#666' }}>{level.descriptionAr}</Text>
          </div>
          
          <div style={{ fontSize: '0.7rem', color: '#444' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <div><strong>البنية التحتية:</strong> {level.thresholds.infrastructure.substring(0, 30)}...</div>
              <div><strong>الموارد البشرية:</strong> {level.thresholds.humanResources}</div>
              <div><strong>التقنية:</strong> {level.thresholds.technology.substring(0, 30)}...</div>
              <div><strong>الاتصالات:</strong> {level.thresholds.communications.substring(0, 25)}...</div>
            </div>
            <div style={{ marginTop: 8, padding: '4px 8px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
              <strong>صلاحية التفعيل:</strong> {level.activationAuthority}
            </div>
          </div>
        </div>
      ))}
    </Stack>
  )
}

// ============================================
// Definitions Content
// ============================================
const DefinitionsContent: React.FC = () => (
  <Stack tokens={{ childrenGap: 12 }}>
    <Text variant="medium" style={{ fontWeight: 600, marginBottom: 8 }}>
      📖 المصطلحات والتعريفات
    </Text>
    
    {Object.entries(definitions).map(([key, def]) => (
      <div 
        key={key}
        className="card"
        style={{ padding: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{
            backgroundColor: '#0078d4',
            color: '#fff',
            padding: '2px 10px',
            borderRadius: 4,
            fontWeight: 700,
            fontSize: '0.85rem',
            fontFamily: 'monospace',
          }}>
            {key}
          </span>
          <Text variant="small" style={{ fontWeight: 600 }}>{def.ar}</Text>
        </div>
        <Text variant="tiny" style={{ color: '#666', display: 'block' }}>
          {def.description}
        </Text>
        <Text variant="tiny" style={{ color: '#999', fontStyle: 'italic' }}>
          {def.en}
        </Text>
      </div>
    ))}
    
    {/* Additional BC Terms */}
    <div className="card" style={{ padding: 12, backgroundColor: '#f9f9f9' }}>
      <Text variant="small" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
        📝 مصطلحات إضافية
      </Text>
      <div style={{ fontSize: '0.75rem', lineHeight: 1.8 }}>
        <p><strong>الأنشطة الحساسة:</strong> الأنشطة التي تُعطى الأولوية في الاستعادة</p>
        <p><strong>مركز الأعمال البديل:</strong> مرفق يُستخدم لضمان استمرارية التعليم (المدرسة البديلة)</p>
        <p><strong>فريق استمرارية الأعمال:</strong> مجموعة مسؤولة عن تفعيل ومراقبة الخطة</p>
        <p><strong>إجراءات الاستجابة:</strong> إجراءات للتعامل مع الاضطرابات وتقليل آثارها</p>
        <p><strong>إجراءات التعافي:</strong> إجراءات لاستعادة الوضع لما قبل الاضطراب</p>
      </div>
    </div>
  </Stack>
)

// ============================================
// Edit Contact Panel
// ============================================
interface EditContactPanelProps {
  contact: AdminContact
  onSave: (contact: Partial<AdminContact>) => void
  onClose: () => void
}

const EditContactPanel: React.FC<EditContactPanelProps> = ({ contact, onSave, onClose }) => {
  const [form, setForm] = useState<AdminContact>(contact)

  const categoryOptions: IDropdownOption[] = [
    { key: 'internal', text: 'داخلي (إدارة التعليم)' },
    { key: 'external', text: 'خارجي' },
  ]

  const organizationOptions: IDropdownOption[] = [
    { key: 'tatweer', text: 'شركة تطوير' },
    { key: 'it_systems', text: 'الأنظمة وخدمات تقنية المعلومات' },
    { key: 'infosec', text: 'أمن المعلومات' },
    { key: 'civil_defense', text: 'الدفاع المدني' },
    { key: 'police', text: 'الشرطة' },
    { key: 'ambulance', text: 'الإسعاف' },
    { key: 'red_crescent', text: 'الهلال الأحمر' },
    { key: 'ministry', text: 'وزارة التعليم' },
    { key: 'external', text: 'جهة خارجية أخرى' },
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 24,
        maxWidth: 600,
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text variant="xLarge" style={{ fontWeight: 600 }}>
            {contact.id ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال'}
          </Text>
          <IconButton
            iconProps={{ iconName: 'Cancel' }}
            onClick={onClose}
          />
        </div>

        <Stack tokens={{ childrenGap: 12 }}>
          <Dropdown
            label="التصنيف"
            selectedKey={form.category}
            options={categoryOptions}
            onChange={(_, opt) => setForm({ ...form, category: opt?.key as 'internal' | 'external' })}
            required
          />

          <TextField
            label="الاسم / الجهة"
            value={form.Title}
            onChange={(_, val) => setForm({ ...form, Title: val || '' })}
            required
          />
          
          <Dropdown
            label="نوع الجهة"
            selectedKey={form.organization}
            options={organizationOptions}
            onChange={(_, opt) => setForm({ ...form, organization: opt?.key as string || '' })}
          />

          <TextField
            label="الوظيفة / الدور"
            value={form.role}
            onChange={(_, val) => setForm({ ...form, role: val || '' })}
          />

          <TextField
            label="رقم الهاتف"
            value={form.phone}
            onChange={(_, val) => setForm({ ...form, phone: val || '' })}
            placeholder="998 أو 997"
          />

          <TextField
            label="البريد الإلكتروني"
            value={form.email}
            onChange={(_, val) => setForm({ ...form, email: val || '' })}
          />

          <TextField
            label="نطاق التواصل"
            value={form.contactScope}
            onChange={(_, val) => setForm({ ...form, contactScope: val || '' })}
            multiline
            rows={2}
            placeholder="مشاكل المباني، حوادث الأمن السيبراني، إلخ"
          />

          <TextField
            label="توقيت التواصل"
            value={form.contactTiming}
            onChange={(_, val) => setForm({ ...form, contactTiming: val || '' })}
            multiline
            rows={2}
            placeholder="عند وجود اضطراب، عند الحريق، إلخ"
          />

          <TextField
            label="العضو البديل"
            value={form.backupMember}
            onChange={(_, val) => setForm({ ...form, backupMember: val || '' })}
          />

          <TextField
            label="ملاحظات"
            value={form.notes}
            onChange={(_, val) => setForm({ ...form, notes: val || '' })}
            multiline
            rows={3}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <PrimaryButton
              text="حفظ"
              onClick={() => onSave(form)}
              styles={{ root: { flex: 1 } }}
            />
            <DefaultButton
              text="إلغاء"
              onClick={onClose}
              styles={{ root: { flex: 1 } }}
            />
          </div>
        </Stack>
      </div>
    </div>
  )
}

export default BCInfoSidebar
