// Notification Bell Component - Shows admin announcements to schools
import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Panel,
  PanelType,
  Stack,
  Text,
  MessageBar,
  MessageBarType,
  DefaultButton,
  Icon,
} from '@fluentui/react';
import { useAuth } from '../context/AuthContext';
import { AnnouncementService, Announcement } from '../services/announcementService';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnnouncements();
    // Refresh announcements every 5 minutes
    const interval = setInterval(loadAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const loadAnnouncements = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const schoolName = user.type === 'school' ? user.schoolName : undefined;
      const data = await AnnouncementService.getAnnouncements(schoolName);
      setAnnouncements(data);
      
      if (user.type === 'school') {
        const count = await AnnouncementService.getUnreadCount(user.schoolName || '');
        setUnreadCount(count);
      }
    } catch (e) {
      console.error('[NotificationBell] Error loading announcements:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = async () => {
    setPanelOpen(true);
    // Mark all as read when opening panel
    if (user?.type === 'school' && user.schoolName) {
      try {
        await Promise.all(
          announcements.map(a => AnnouncementService.markAsRead(a.id, user.schoolName!))
        );
        setUnreadCount(0);
      } catch (e) {
        console.error('[NotificationBell] Error marking as read:', e);
      }
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🚨';
      case 'urgent': return '⚠️';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#d83b01';
      case 'urgent': return '#ff8c00';
      default: return '#0078d4';
    }
  };

  return (
    <>
      <div style={{ position: 'relative' }}>
        <IconButton
          iconProps={{ iconName: 'Ringer' }}
          title="الإشعارات والتنبيهات"
          ariaLabel="الإشعارات"
          onClick={handleBellClick}
          styles={{
            root: {
              color: '#fff',
              fontSize: 20,
            },
            rootHovered: {
              color: '#e6f2ff',
            },
          }}
        />
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              backgroundColor: '#d83b01',
              color: '#fff',
              borderRadius: '50%',
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 700,
              border: '2px solid #008752',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </div>

      <Panel
        isOpen={panelOpen}
        onDismiss={() => setPanelOpen(false)}
        type={PanelType.medium}
        headerText="الإشعارات والتنبيهات"
        closeButtonAriaLabel="إغلاق"
        styles={{
          header: {
            background: 'linear-gradient(135deg, #008752, #006644)',
            color: '#fff',
          },
          headerText: {
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 600,
          },
          closeButton: {
            color: '#fff',
          },
        }}
      >
        <Stack tokens={{ childrenGap: 12 }} styles={{ root: { padding: '16px 0' } }}>
          {loading && (
            <MessageBar messageBarType={MessageBarType.info}>
              جاري تحميل الإشعارات...
            </MessageBar>
          )}

          {!loading && announcements.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <Icon iconName="Ringer" style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
              <Text variant="large" block style={{ color: '#666' }}>
                لا توجد إشعارات حالياً
              </Text>
              <Text variant="small" block style={{ marginTop: 8 }}>
                سيتم إشعارك بأي تحديثات مهمة من الإدارة
              </Text>
            </div>
          )}

          {!loading && announcements.map((announcement) => (
            <div
              key={announcement.id}
              style={{
                padding: 16,
                backgroundColor: announcement.priority === 'critical' ? '#fef0f0' : '#f9f9f9',
                borderLeft: `4px solid ${getPriorityColor(announcement.priority)}`,
                borderRadius: 4,
              }}
            >
              <Stack tokens={{ childrenGap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: '1.5rem' }}>{getPriorityIcon(announcement.priority)}</span>
                  <div style={{ flex: 1 }}>
                    <Text
                      variant="mediumPlus"
                      block
                      style={{
                        fontWeight: 600,
                        color: getPriorityColor(announcement.priority),
                      }}
                    >
                      {announcement.Title}
                    </Text>
                    <Text variant="small" block style={{ color: '#666', marginTop: 4 }}>
                      {new Date(announcement.publishDate).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </div>
                </div>

                <Text
                  variant="medium"
                  block
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    color: '#333',
                  }}
                >
                  {announcement.message}
                </Text>

                {announcement.attachmentUrl && (
                  <DefaultButton
                    text="عرض المرفق"
                    iconProps={{ iconName: 'Attach' }}
                    onClick={() => window.open(announcement.attachmentUrl, '_blank')}
                    styles={{
                      root: {
                        marginTop: 8,
                        borderColor: getPriorityColor(announcement.priority),
                        color: getPriorityColor(announcement.priority),
                      },
                    }}
                  />
                )}

                {announcement.expiryDate && (
                  <Text variant="tiny" block style={{ color: '#999', marginTop: 4 }}>
                    ينتهي: {new Date(announcement.expiryDate).toLocaleDateString('ar-SA')}
                  </Text>
                )}
              </Stack>
            </div>
          ))}
        </Stack>
      </Panel>
    </>
  );
};

export default NotificationBell;
