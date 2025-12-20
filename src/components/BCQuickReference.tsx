// BC Quick Reference - Full Page Version (moved from sidebar)
// Contains all important BC information for schools
import React, { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  MessageBar,
  MessageBarType,
  Spinner,
  DefaultButton,
  Icon,
  Pivot,
  PivotItem,
} from '@fluentui/react';
import { useAuth } from '../context/AuthContext';
import { AdminDataService, AdminContact } from '../services/adminDataService';
import { SharePointService } from '../services/sharepointService';

const BCQuickReference: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.type === 'admin';

  // Contacts
  const [allContacts, setAllContacts] = useState<AdminContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Scenarios
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);

  // RTO Data
  const [rtoData, setRtoData] = useState<any>(null);
  const [loadingRTO, setLoadingRTO] = useState(false);

  useEffect(() => {
    loadContacts();
    loadScenarios();
    loadRTO();
  }, [user]);

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const contacts = await AdminDataService.getAdminContacts();
      
      // Filter for schools: only show visible contacts
      const filteredContacts = isAdmin 
        ? contacts 
        : contacts.filter(c => c.isVisibleToSchools);
      
      setAllContacts(filteredContacts);
    } catch (e) {
      console.error('[BCQuickReference] Error loading contacts:', e);
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadScenarios = async () => {
    try {
      setLoadingScenarios(true);
      const data = await AdminDataService.getPlanScenarios();
      setScenarios(data || []);
    } catch (e) {
      console.error('[BCQuickReference] Error loading scenarios:', e);
    } finally {
      setLoadingScenarios(false);
    }
  };

  const loadRTO = async () => {
    try {
      setLoadingRTO(true);
      const schoolName = user?.type === 'school' ? user.schoolName : undefined;
      const sharedPlan = await AdminDataService.getSharedBCPlan();
      setRtoData(sharedPlan);
    } catch (e) {
      console.error('[BCQuickReference] Error loading RTO:', e);
    } finally {
      setLoadingRTO(false);
    }
  };

  // Group contacts
  const internalContacts = allContacts.filter(c => c.category === 'internal');
  const externalEmergencyContacts = allContacts.filter(
    c => c.category === 'external' && c.role?.toLowerCase().includes('طوارئ')
  );
  const otherExternalContacts = allContacts.filter(
    c => c.category === 'external' && !c.role?.toLowerCase().includes('طوارئ')
  );

  const ContactCard: React.FC<{ contact: AdminContact }> = ({ contact }) => (
    <div
      style={{
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        border: '1px solid #e1dfdd',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }}
    >
      <Stack tokens={{ childrenGap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon
            iconName={contact.category === 'internal' ? 'Contact' : 'Phone'}
            style={{
              fontSize: 24,
              color: contact.category === 'internal' ? '#0078d4' : '#107c10',
            }}
          />
          <Text variant="mediumPlus" style={{ fontWeight: 600, color: '#333' }}>
            {contact.Title}
          </Text>
        </div>

        {contact.role && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Icon iconName="Org" style={{ fontSize: 14, color: '#666' }} />
            <Text variant="small" style={{ color: '#666' }}>
              {contact.role}
            </Text>
          </div>
        )}

        {contact.organization && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Icon iconName="CityNext" style={{ fontSize: 14, color: '#666' }} />
            <Text variant="small" style={{ color: '#666' }}>
              {contact.organization}
            </Text>
          </div>
        )}

        {contact.phone && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Icon iconName="Phone" style={{ fontSize: 14, color: '#008752' }} />
            <a
              href={`tel:${contact.phone}`}
              style={{
                color: '#008752',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                direction: 'ltr',
              }}
            >
              {contact.phone}
            </a>
          </div>
        )}

        {contact.email && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Icon iconName="Mail" style={{ fontSize: 14, color: '#0078d4' }} />
            <a
              href={`mailto:${contact.email}`}
              style={{
                color: '#0078d4',
                textDecoration: 'none',
                fontSize: '0.85rem',
              }}
            >
              {contact.email}
            </a>
          </div>
        )}

        {contact.notes && (
          <Text
            variant="small"
            style={{
              color: '#666',
              marginTop: 4,
              padding: 8,
              backgroundColor: '#f9f9f9',
              borderRadius: 4,
              fontStyle: 'italic',
            }}
          >
            {contact.notes}
          </Text>
        )}
      </Stack>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#008752', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon iconName="BookAnswers" style={{ fontSize: 32 }} />
          المرجع السريع لاستمرارية الأعمال
        </h1>
        <Text variant="medium" style={{ color: '#666' }}>
          معلومات مهمة وجهات اتصال أساسية لضمان استمرارية العملية التعليمية
        </Text>
      </div>

      {isAdmin && (
        <MessageBar messageBarType={MessageBarType.info} styles={{ root: { marginBottom: 16 } }}>
          <strong>للمسؤول:</strong> يمكنك التحكم بالجهات المعروضة للمدارس من لوحة الإدارة → جهات الاتصال → Toggle "في المرجع السريع"
        </MessageBar>
      )}

      <Pivot>
        {/* Tab 1: Contacts */}
        <PivotItem headerText="جهات الاتصال" itemIcon="ContactList">
          {loadingContacts ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Spinner label="جاري تحميل جهات الاتصال..." />
            </div>
          ) : (
            <Stack tokens={{ childrenGap: 24 }} styles={{ root: { padding: '20px 0' } }}>
              {/* Internal Contacts */}
              {internalContacts.length > 0 && (
                <div>
                  <h3 style={{ color: '#0078d4', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon iconName="Contact" />
                    جهات الاتصال الداخلية
                  </h3>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: 16,
                    }}
                  >
                    {internalContacts.map(contact => (
                      <ContactCard key={contact.id} contact={contact} />
                    ))}
                  </div>
                </div>
              )}

              {/* External Emergency Contacts */}
              {externalEmergencyContacts.length > 0 && (
                <div>
                  <h3 style={{ color: '#d83b01', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon iconName="Phone" />
                    جهات الاتصال الخارجية (طوارئ)
                  </h3>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: 16,
                    }}
                  >
                    {externalEmergencyContacts.map(contact => (
                      <ContactCard key={contact.id} contact={contact} />
                    ))}
                  </div>
                </div>
              )}

              {/* Other External Contacts */}
              {otherExternalContacts.length > 0 && (
                <div>
                  <h3 style={{ color: '#107c10', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon iconName="CityNext" />
                    جهات الاتصال الخارجية (أخرى)
                  </h3>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: 16,
                    }}
                  >
                    {otherExternalContacts.map(contact => (
                      <ContactCard key={contact.id} contact={contact} />
                    ))}
                  </div>
                </div>
              )}

              {allContacts.length === 0 && (
                <MessageBar messageBarType={MessageBarType.warning}>
                  لا توجد جهات اتصال متاحة حالياً
                </MessageBar>
              )}
            </Stack>
          )}
        </PivotItem>

        {/* Tab 2: RTO Objectives */}
        <PivotItem headerText="أهداف وقت التعافي (RTO)" itemIcon="TimelineProgress">
          {loadingRTO ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Spinner label="جاري تحميل البيانات..." />
            </div>
          ) : (
            <div style={{ padding: '20px 0' }}>
              <div
                style={{
                  padding: 24,
                  backgroundColor: '#f0f8ff',
                  borderRadius: 8,
                  border: '2px solid #0078d4',
                }}
              >
                <h3 style={{ color: '#0078d4', marginBottom: 16 }}>⏱️ أهداف وقت التعافي (RTO)</h3>
                <Text variant="large" block style={{ marginBottom: 12 }}>
                  <strong>الهدف:</strong> استئناف العملية التعليمية خلال <span style={{ color: '#d83b01', fontWeight: 700 }}>24 ساعة</span> من أي انقطاع
                </Text>
                <Text variant="medium" block style={{ color: '#666', lineHeight: 1.6 }}>
                  في حال حدوث أي انقطاع في العملية التعليمية (كوارث طبيعية، أعطال فنية، جوائح، إلخ)، يجب تفعيل البدائل المتاحة لضمان استمرارية التعليم للطلاب خلال المدة المحددة.
                </Text>
                {rtoData && (
                  <div style={{ marginTop: 16, padding: 16, backgroundColor: '#fff', borderRadius: 4 }}>
                    <Text variant="medium" block>
                      <strong>آخر مراجعة:</strong> {rtoData.lastUpdated ? new Date(rtoData.lastUpdated).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          )}
        </PivotItem>

        {/* Tab 3: Scenarios */}
        <PivotItem headerText="السيناريوهات والاستجابة" itemIcon="WebAppBuilderFragment">
          {loadingScenarios ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Spinner label="جاري تحميل السيناريوهات..." />
            </div>
          ) : (
            <Stack tokens={{ childrenGap: 16 }} styles={{ root: { padding: '20px 0' } }}>
              {scenarios.map((scenario, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 20,
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    border: '1px solid #e1dfdd',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <h3 style={{ color: '#008752', marginBottom: 12 }}>
                    {idx + 1}. {scenario.title}
                  </h3>
                  <Text variant="medium" block style={{ marginBottom: 12, color: '#666' }}>
                    {scenario.description}
                  </Text>
                  {scenario.actions && scenario.actions.length > 0 && (
                    <div>
                      <Text variant="mediumPlus" block style={{ fontWeight: 600, marginBottom: 8 }}>
                        إجراءات الاستجابة:
                      </Text>
                      <ul style={{ margin: 0, paddingRight: 24, color: '#333' }}>
                        {scenario.actions.map((action: string, actionIdx: number) => (
                          <li key={actionIdx} style={{ marginBottom: 6 }}>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              {scenarios.length === 0 && (
                <MessageBar messageBarType={MessageBarType.info}>
                  لا توجد سيناريوهات متاحة حالياً. سيتم إضافتها من قبل الإدارة.
                </MessageBar>
              )}
            </Stack>
          )}
        </PivotItem>
      </Pivot>
    </div>
  );
};

export default BCQuickReference;
