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
  <img 
    src="https://cdn-icons-png.flaticon.com/512/4436/4436481.png" 
    alt="Account Verification" 
    style={{ 
      width: '100%', 
      height: 'auto', 
      maxWidth: '350px',
      objectFit: 'contain'
    }} 
  />
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

  const handleForgotPassword = async () => {
    if (!selectedSchool) {
      setError('يرجى اختيار المدرسة أولاً')
      return
    }

    const school = schools.find(s => s.SchoolName === selectedSchool)
    if (!school) {
      setError('المدرسة المختارة غير موجودة')
      return
    }

    // For now, just show a message without calling external API
    // TODO: Configure Power Automate flow and update the URL
    const requestData = {
      schoolName: selectedSchool,
      principalName: school.PrincipalName,
      principalEmail: school.principalEmail,
      principalPhone: school.PrincipalPhone,
      principalId: principalId || 'غير محدد',
      requestDate: new Date().toLocaleString('ar-SA')
    }

    // Log the request for debugging
    console.log('Forgot Password Request:', requestData)

    // Show success message (will actually work once Power Automate is configured)
    alert(`طلب استعادة كلمة المرور

المدرسة: ${selectedSchool}
المدير/ة: ${school.PrincipalName}
الهاتف: ${school.PrincipalPhone}

سيتم التواصل معك قريباً من قبل الإدارة.

ملاحظة: لتفعيل الإرسال التلقائي، يجب إعداد Power Automate Flow.`)
    setError('')

    /* Uncomment this when Power Automate Flow is ready:
    try {
      setLoading(true)
      const flowUrl = 'YOUR_POWER_AUTOMATE_FLOW_URL_HERE'
      
      const response = await fetch(flowUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        setError('')
        alert('تم إرسال طلب استعادة كلمة المرور. سيتم التواصل معك قريباً.')
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (e) {
      console.error('Error sending forgot password request:', e)
      setError('حدث خطأ في إرسال الطلب. يرجى التواصل مع الإدارة مباشرة.')
    } finally {
      setLoading(false)
    }
    */
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
            <strong>قواعد بيانات متابعة استمرارية العملية التعليمية</strong>
          </Text>
          <Text variant="medium" style={{ marginTop: '12px', color: '#666', textAlign: 'center' }}>
            الإدارة العامة للتعليم بمنطقة المدينة المنورة
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && selectedSchool && principalId) {
                        handleSchoolLogin()
                      }
                    }}
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
                  <DefaultButton
                    text="🔑 نسيت كلمة المرور؟"
                    onClick={handleForgotPassword}
                    styles={{ 
                      root: { 
                        height: '40px', 
                        borderRadius: '6px',
                        marginTop: '8px',
                        borderColor: '#0078d4',
                        color: '#0078d4'
                      } 
                    }}
                    disabled={!selectedSchool || loading}
                  />
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && adminPassword) {
                      handleAdminLogin()
                    }
                  }}
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
