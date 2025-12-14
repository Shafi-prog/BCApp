import React, { useState, useEffect, useMemo } from 'react'
import {
  Stack,
  Text,
  TextField,
  PrimaryButton,
  DefaultButton,
  Dropdown,
  IDropdownOption,
  Spinner,
  MessageBar,
  MessageBarType,
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { SharePointService } from '../services/sharepointService'

interface SchoolInfo {
  Id: number
  SchoolName: string
  SchoolID: string
  PrincipalName: string
  PrincipalID: string
  principalEmail: string
  PrincipalPhone: string
}

const LoginIllustration: React.FC = () => (
  <svg viewBox="0 0 400 300" style={{ width: '100%', height: 'auto', maxWidth: '350px' }}>
    <rect x="50" y="50" width="300" height="200" rx="10" fill="#e8f8ef" />
    <rect x="120" y="100" width="160" height="130" fill="#008752" rx="5" />
    <rect x="140" y="120" width="40" height="50" fill="#fff" rx="2" />
    <rect x="220" y="120" width="40" height="50" fill="#fff" rx="2" />
    <rect x="170" y="180" width="60" height="50" fill="#fff" rx="2" />
    <polygon points="100,100 200,50 300,100" fill="#005f3b" />
    <rect x="195" y="30" width="4" height="25" fill="#333" />
    <rect x="199" y="30" width="25" height="15" fill="#008752" />
    <circle cx="90" cy="200" r="15" fill="#008752" />
    <rect x="80" y="220" width="20" height="25" rx="5" fill="#008752" />
    <circle cx="310" cy="200" r="15" fill="#107c10" />
    <rect x="300" y="220" width="20" height="25" rx="5" fill="#107c10" />
  </svg>
)

const Login: React.FC = () => {
  const [loginType, setLoginType] = useState<'select' | 'school' | 'admin'>('select')
  const [schools, setSchools] = useState<SchoolInfo[]>([])
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [principalId, setPrincipalId] = useState<string>('')
  const [adminPassword, setAdminPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const { login } = useAuth()

  useEffect(() => {
    loadSchools()
  }, [])

  const loadSchools = async () => {
    try {
      setLoading(true)
      const data = await SharePointService.getSchoolInfo()
      setSchools(data || [])
    } catch (e) {
      console.error(e)
      setError('خطأ في تحميل بيانات المدارس')
    } finally {
      setLoading(false)
    }
  }

  const handleSchoolLogin = () => {
    setError('')
    if (!selectedSchool || !principalId) {
      setError('يرجى اختيار المدرسة وإدخال رقم هوية المدير/المديرة')
      return
    }

    const school = schools.find(s => s.SchoolName === selectedSchool)
    if (!school) {
      setError('المدرسة المختارة غير موجودة')
      return
    }

    if (school.PrincipalID !== principalId) {
      setError('رقم الهوية غير صحيح')
      return
    }

    login({
      type: 'school',
      schoolName: selectedSchool,
      principalId: principalId,
      schoolId: school.Id
    })
  }

  const handleAdminLogin = () => {
    setError('')
    if (adminPassword !== 'admin123') {
      setError('كلمة المرور غير صحيحة')
      return
    }
    login({ type: 'admin' })
  }

  const filteredSchools: IDropdownOption[] = useMemo(() =>
    schools
      .filter(s => 
        s.SchoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.SchoolName.includes(searchTerm)
      )
      .map(s => ({ key: s.SchoolName, text: s.SchoolName })),
    [schools, searchTerm]
  )

  return (
    <div
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #005f3b 0%, #008752 50%, #00a86b 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxWidth: '900px',
          width: '100%',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Left side - Illustration */}
        <div
          className="login-illustration"
          style={{
            flex: '1',
            background: 'linear-gradient(180deg, #f0f8ff 0%, #e6f2ff 100%)',
            padding: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '500px',
          }}
        >
          <LoginIllustration />
          <Text variant="xLarge" style={{ marginTop: '24px', color: '#008752', textAlign: 'center' }}>
            <strong>نظام متابعة استمرارية العملية التعليمية</strong>
          </Text>
          <Text variant="medium" style={{ marginTop: '12px', color: '#666', textAlign: 'center' }}>
            وزارة التعليم - المملكة العربية السعودية
          </Text>
        </div>

        {/* Right side - Login Form */}
        <div
          style={{
            flex: '1',
            padding: '48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {loginType === 'select' && (
            <Stack tokens={{ childrenGap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #008752, #005f3b)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 4px 15px rgba(0, 135, 82, 0.3)',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>🏫</span>
                </div>
                <Text variant="xxLarge" block>
                  <strong>تسجيل الدخول</strong>
                </Text>
                <Text variant="medium" style={{ marginTop: '8px', color: '#666' }}>
                  اختر نوع الحساب للمتابعة
                </Text>
              </div>
              <Stack tokens={{ childrenGap: 12 }}>
                <PrimaryButton
                  text="🏫 دخول المدارس"
                  onClick={() => setLoginType('school')}
                  styles={{ root: { height: '56px', fontSize: '16px', borderRadius: '8px' } }}
                />
                <DefaultButton
                  text="👤 دخول المسؤول"
                  onClick={() => setLoginType('admin')}
                  styles={{ root: { height: '56px', fontSize: '16px', borderRadius: '8px' } }}
                />
              </Stack>
            </Stack>
          )}

          {loginType === 'school' && (
            <Stack tokens={{ childrenGap: 20 }}>
              <div>
                <Text variant="xLarge" block>
                  <strong>🏫 دخول المدارس</strong>
                </Text>
                <Text variant="medium" style={{ marginTop: '8px', color: '#666' }}>
                  أدخل بيانات المدرسة للدخول
                </Text>
              </div>

              {error && (
                <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')}>
                  {error}
                </MessageBar>
              )}

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spinner label="جارٍ تحميل بيانات المدارس..." />
                </div>
              ) : (
                <Stack tokens={{ childrenGap: 16 }}>
                  <TextField
                    label="🔍 البحث عن المدرسة"
                    value={searchTerm}
                    onChange={(_, v) => setSearchTerm(v || '')}
                    placeholder="اكتب اسم المدرسة للبحث..."
                    styles={{ root: { marginBottom: '8px' } }}
                  />
                  <Dropdown
                    label="🏫 اختر المدرسة"
                    options={filteredSchools}
                    selectedKey={selectedSchool}
                    onChange={(_, option) => setSelectedSchool(option?.key as string || '')}
                    placeholder={schools.length > 0 ? `${filteredSchools.length} مدرسة متاحة` : 'لا توجد مدارس'}
                    required
                    styles={{ dropdown: { minHeight: '40px' } }}
                  />
                  <TextField
                    label="🔑 رقم هوية المدير / المديرة"
                    type="password"
                    value={principalId}
                    onChange={(_, v) => setPrincipalId(v || '')}
                    placeholder="أدخل رقم الهوية (10 أرقام)"
                    required
                    canRevealPassword
                  />
                  <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: '8px' }}>
                    <PrimaryButton
                      text="دخول"
                      onClick={handleSchoolLogin}
                      styles={{ root: { flex: 1, height: '44px', borderRadius: '6px' } }}
                      disabled={!selectedSchool || !principalId}
                    />
                    <DefaultButton
                      text="رجوع"
                      onClick={() => {
                        setLoginType('select')
                        setError('')
                      }}
                      styles={{ root: { height: '44px', borderRadius: '6px' } }}
                    />
                  </Stack>
                </Stack>
              )}
            </Stack>
          )}

          {loginType === 'admin' && (
            <Stack tokens={{ childrenGap: 20 }}>
              <div>
                <Text variant="xLarge" block>
                  <strong>👤 دخول المسؤول</strong>
                </Text>
                <Text variant="medium" style={{ marginTop: '8px', color: '#666' }}>
                  أدخل كلمة المرور للدخول كمسؤول
                </Text>
              </div>

              {error && (
                <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError('')}>
                  {error}
                </MessageBar>
              )}

              <Stack tokens={{ childrenGap: 16 }}>
                <TextField
                  label="🔑 كلمة المرور"
                  type="password"
                  value={adminPassword}
                  onChange={(_, v) => setAdminPassword(v || '')}
                  placeholder="أدخل كلمة المرور"
                  required
                  canRevealPassword
                />
                <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: '8px' }}>
                  <PrimaryButton
                    text="دخول"
                    onClick={handleAdminLogin}
                    styles={{ root: { flex: 1, height: '44px', borderRadius: '6px' } }}
                    disabled={!adminPassword}
                  />
                  <DefaultButton
                    text="رجوع"
                    onClick={() => {
                      setLoginType('select')
                      setError('')
                    }}
                    styles={{ root: { height: '44px', borderRadius: '6px' } }}
                  />
                </Stack>
              </Stack>
            </Stack>
          )}
        </div>
      </div>

      <style>
        {`
          @media (max-width: 768px) {
            .login-illustration {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  )
}

export default Login
