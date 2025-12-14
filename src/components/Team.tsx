import React, { useEffect, useState } from 'react'
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  PrimaryButton,
  DefaultButton,
  Panel,
  TextField,
  Dropdown,
  IconButton,
  MessageBar,
  MessageBarType,
  Spinner,
  Stack,
  PanelType,
  Text,
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { SharePointService, TeamMember } from '../services/sharepointService'

// Job role options matching original app (6 roles)
const jobRoleOptions = [
  { key: 'وكيل /ة المدرسة للشؤون المدرسية', text: 'وكيل /ة المدرسة للشؤون المدرسية' },
  { key: 'منسق/ة الأمن والسلامة بالمدرسة', text: 'منسق/ة الأمن والسلامة بالمدرسة' },
  { key: 'الموجه/ة الطلابي/ة', text: 'الموجه/ة الطلابي/ة' },
  { key: 'الموجه/ة الصحي/ة', text: 'الموجه/ة الصحي/ة' },
  { key: 'معلم/ة', text: 'معلم/ة' },
  { key: 'إداري/ة', text: 'إداري/ة' },
]

// Core team roles that get "عضو أساسي" membership type
const coreTeamRoles = [
  'وكيل /ة المدرسة للشؤون المدرسية',
  'منسق/ة الأمن والسلامة بالمدرسة',
  'الموجه/ة الطلابي/ة',
]

// Auto-assign membership type based on job role (original app logic)
const getMembershipType = (jobRole: string): string => {
  return coreTeamRoles.includes(jobRole) ? 'عضو أساسي' : 'عضو احتياطي'
}

const membershipTypeOptions = [
  { key: 'عضو أساسي', text: 'عضو أساسي' },
  { key: 'عضو احتياطي', text: 'عضو احتياطي' },
]

const Team: React.FC = () => {
  const { user } = useAuth()
  const [items, setItems] = useState<TeamMember[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null)
  const [mobileError, setMobileError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [form, setForm] = useState<TeamMember>({
    Title: '',
    JobRole: '',
    MembershipType: '',
    MemberEmail: '',
    MemberMobile: '',
    SchoolName_Ref: '',
  })

  // Validate mobile number - must start with 9665 and be 12 digits (original app logic)
  const validateMobile = (mobile: string): boolean => {
    return /^9665\d{8}$/.test(mobile)
  }

  // Validate email format (original app logic)
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Handle job role change - auto-assign membership type
  const handleJobRoleChange = (jobRole: string) => {
    const membershipType = getMembershipType(jobRole)
    setForm({ ...form, JobRole: jobRole, MembershipType: membershipType })
  }

  const columns: IColumn[] = [
    { key: 'Title', name: 'الاسم', fieldName: 'Title', minWidth: 150, maxWidth: 200 },
    { key: 'JobRole', name: 'الوظيفة', fieldName: 'JobRole', minWidth: 120 },
    { key: 'MembershipType', name: 'نوع العضوية', fieldName: 'MembershipType', minWidth: 100 },
    { key: 'MemberEmail', name: 'البريد الإلكتروني', fieldName: 'MemberEmail', minWidth: 150 },
    { key: 'MemberMobile', name: 'الجوال', fieldName: 'MemberMobile', minWidth: 100 },
    {
      key: 'actions',
      name: 'الإجراءات',
      fieldName: 'actions',
      minWidth: 100,
      onRender: (item: TeamMember) => (
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <IconButton
            iconProps={{ iconName: 'Edit', styles: { root: { fontSize: 16, fontWeight: 600 } } }}
            onClick={() => onEdit(item)}
            title="تعديل"
            ariaLabel="تعديل"
            styles={{ 
              root: { 
                color: '#0078d4',
                backgroundColor: '#e6f2ff',
                borderRadius: 4,
                width: 32,
                height: 32,
              },
              rootHovered: { backgroundColor: '#cce4ff' },
              icon: { color: '#0078d4', fontSize: 16 }
            }}
          />
          <IconButton
            iconProps={{ iconName: 'Delete', styles: { root: { fontSize: 16, fontWeight: 600 } } }}
            onClick={() => onDelete(item.Id!)}
            title="حذف"
            ariaLabel="حذف"
            styles={{ 
              root: { 
                color: '#d83b01',
                backgroundColor: '#fce8e6',
                borderRadius: 4,
                width: 32,
                height: 32,
              },
              rootHovered: { backgroundColor: '#f5d0cc' },
              icon: { color: '#d83b01', fontSize: 16 }
            }}
          />
        </Stack>
      ),
    },
  ]

  const loadTeamMembers = async () => {
    setLoading(true)
    try {
      const schoolName = user?.type === 'admin' ? undefined : user?.schoolName
      const data = await SharePointService.getTeamMembers(schoolName)
      setItems(data)
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل تحميل أعضاء الفريق: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeamMembers()
  }, [user])

  const onOpen = () => {
    setEditingId(null)
    setForm({ 
      Title: '', 
      JobRole: '', 
      MembershipType: '', 
      MemberEmail: '', 
      MemberMobile: '', 
      SchoolName_Ref: user?.schoolName || '' 
    })
    setPanelOpen(true)
  }

  const onEdit = (member: TeamMember) => {
    setEditingId(member.Id || null)
    setForm({ ...member })
    setPanelOpen(true)
  }

  const onClose = () => {
    setPanelOpen(false)
    setEditingId(null)
  }

  const onSave = async () => {
    // Validate required fields
    if (!form.Title || !form.JobRole) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى ملء جميع الحقول المطلوبة (الاسم والوظيفة)' })
      return
    }

    // Validate mobile number (required and must be 9665 format)
    if (!form.MemberMobile) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى إدخال رقم الجوال' })
      return
    }
    if (!validateMobile(form.MemberMobile)) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى إدخال رقم جوال صحيح (يبدأ بـ 9665 ويتكون من 12 رقم)' })
      return
    }

    // Validate email (required)
    if (!form.MemberEmail) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى إدخال البريد الإلكتروني' })
      return
    }
    if (!validateEmail(form.MemberEmail)) {
      setMessage({ type: MessageBarType.warning, text: 'يرجى إدخال بريد إلكتروني صحيح' })
      return
    }

    setLoading(true)
    try {
      const memberData = {
        ...form,
        SchoolName_Ref: form.SchoolName_Ref || user?.schoolName || '',
      }

      if (editingId) {
        await SharePointService.updateTeamMember(editingId, memberData, user?.schoolId)
        setMessage({ type: MessageBarType.success, text: 'تم تحديث العضو بنجاح' })
      } else {
        await SharePointService.createTeamMember(memberData, user?.schoolId)
        setMessage({ type: MessageBarType.success, text: 'تم إضافة العضو بنجاح' })
      }
      onClose()
      loadTeamMembers()
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل الحفظ: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العضو؟')) return

    setLoading(true)
    try {
      await SharePointService.deleteTeamMember(id)
      setMessage({ type: MessageBarType.success, text: 'تم حذف العضو بنجاح' })
      loadTeamMembers()
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: `فشل الحذف: ${e}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      {user?.schoolName && (
        <div style={{ backgroundColor: '#008752', borderRadius: '8px', padding: '16px 24px', color: '#fff', marginBottom: 16 }}>
          <Text variant="large" style={{ color: '#fff', fontWeight: 600 }}>
            حياكم الله - {user.schoolName}
          </Text>
        </div>
      )}
      
      <Text variant="xxLarge" block style={{ marginBottom: 8 }}>
        <strong>فريق الأمن والسلامة</strong>
      </Text>
      <Text variant="medium" style={{ color: '#666', marginBottom: 16, display: 'block' }}>
        إدارة أعضاء فريق الأمن والسلامة المدرسي
      </Text>

      {message && (
        <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)} styles={{ root: { marginBottom: 16 } }}>
          {message.text}
        </MessageBar>
      )}

      {loading && <Spinner label="جاري التحميل..." />}

      <Stack horizontal horizontalAlign="end" style={{ marginBottom: 16 }}>
        <PrimaryButton text="إضافة عضو جديد" iconProps={{ iconName: 'AddFriend' }} onClick={onOpen} disabled={loading} />
      </Stack>

      <div className="card">
        <DetailsList 
          items={items} 
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
        />
        {items.length === 0 && !loading && (
          <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
            لا يوجد أعضاء في الفريق حالياً
          </div>
        )}
      </div>

      <Panel
        isOpen={panelOpen}
        onDismiss={onClose}
        headerText={editingId ? 'تعديل عضو الفريق' : 'إضافة عضو جديد'}
        type={PanelType.medium}
        isFooterAtBottom={true}
        onRenderFooterContent={() => (
          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <PrimaryButton text="حفظ" onClick={onSave} disabled={loading} />
            <DefaultButton text="إلغاء" onClick={onClose} disabled={loading} />
          </Stack>
        )}
      >
        <div style={{ padding: 16 }}>
          <TextField
            label="الاسم الكامل *"
            value={form.Title}
            onChange={(_, v) => setForm({ ...form, Title: v || '' })}
            required
            placeholder="أدخل اسم العضو"
          />
          {user?.schoolName && (
            <TextField
              label="المدرسة"
              value={form.SchoolName_Ref || user.schoolName}
              disabled
              readOnly
              styles={{ field: { backgroundColor: '#f3f2f1', color: '#323130' }, root: { marginTop: 12 } }}
            />
          )}
          <Dropdown
            label="الوظيفة *"
            selectedKey={form.JobRole}
            options={jobRoleOptions}
            onChange={(_, option) => handleJobRoleChange(option?.key as string || '')}
            required
            placeholder="اختر الوظيفة"
            styles={{ root: { marginTop: 12 } }}
          />
          <div style={{ marginTop: 12 }}>
            <Text variant="small" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>نوع العضوية</Text>
            <TextField
              value={form.MembershipType || ''}
              disabled
              readOnly
              styles={{ 
                field: { 
                  backgroundColor: form.MembershipType === 'عضو أساسي' ? '#e6f4ea' : '#fff3e0', 
                  color: '#323130',
                  fontWeight: 600
                }
              }}
            />
            <Text variant="small" style={{ color: '#666', marginTop: 4, display: 'block' }}>
              {form.MembershipType === 'عضو أساسي' 
                ? '✓ عضو أساسي في الفريق' 
                : form.MembershipType === 'عضو احتياطي' 
                  ? '○ عضو احتياطي في الفريق' 
                  : 'يتم تحديد نوع العضوية تلقائياً بناءً على الوظيفة'}
            </Text>
          </div>
          <TextField
            label="رقم الجوال *"
            value={form.MemberMobile || ''}
            onChange={(_, v) => {
              setForm({ ...form, MemberMobile: v || '' })
              if (v && !validateMobile(v)) {
                setMobileError('رقم الجوال يجب أن يبدأ بـ 9665 ويتكون من 12 رقم')
              } else {
                setMobileError('')
              }
            }}
            placeholder="9665xxxxxxxx"
            maxLength={12}
            required
            description="يجب أن يبدأ بـ 9665 ويتكون من 12 رقم (مثال: 966512345678)"
            errorMessage={mobileError}
            styles={{ root: { marginTop: 12 } }}
          />
          <TextField
            label="البريد الإلكتروني *"
            type="email"
            value={form.MemberEmail || ''}
            onChange={(_, v) => {
              setForm({ ...form, MemberEmail: v || '' })
              if (v && !validateEmail(v)) {
                setEmailError('يرجى إدخال بريد إلكتروني صحيح')
              } else {
                setEmailError('')
              }
            }}
            placeholder="example@email.com"
            required
            errorMessage={emailError}
            styles={{ root: { marginTop: 12 } }}
          />
          <div style={{ padding: '12px', backgroundColor: '#f0f9ff', border: '1px solid #0078d4', borderRadius: '4px', marginTop: 16 }}>
            <Text variant="small" style={{ color: '#004578' }}>
              📎 <strong>لإضافة ملف القرار:</strong> بعد الحفظ، يمكنك إضافة الملفات من خلال عمود "المرفقات" في الجدول
            </Text>
          </div>
        </div>
      </Panel>
    </div>
  )
}

export default Team

