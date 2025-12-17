import React, { useState, useEffect } from 'react'
import {
  Stack,
  Text,
  Spinner,
  Icon,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  SearchBox,
  DefaultButton,
  PrimaryButton,
  Dropdown,
  IDropdownOption,
} from '@fluentui/react'
import { useAuth } from '../context/AuthContext'
import { SharePointService, SchoolInfo as SchoolInfoType } from '../services/sharepointService'

interface InfoCardProps {
  icon: string
  label: string
  value: string | undefined
  color?: string
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value, color = '#008752' }) => (
  <div
    style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      minHeight: '70px',
    }}
  >
    <div
      style={{
        backgroundColor: `${color}15`,
        borderRadius: '8px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon iconName={icon} style={{ fontSize: '20px', color }} />
    </div>
    <div style={{ flex: 1 }}>
      <Text variant="small" style={{ color: '#666', display: 'block', marginBottom: '4px' }}>
        {label}
      </Text>
      <Text variant="medium" style={{ fontWeight: 600, color: '#323130' }}>
        {value || '-'}
      </Text>
    </div>
  </div>
)

interface SectionHeaderProps {
  title: string
  icon: string
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: '2px solid #008752',
    }}
  >
    <Icon iconName={icon} style={{ fontSize: '20px', color: '#008752' }} />
    <Text variant="xLarge" style={{ fontWeight: 600, color: '#323130' }}>
      {title}
    </Text>
  </div>
)

const SchoolInfo: React.FC = () => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfoType | null>(null)
  const [allSchools, setAllSchools] = useState<SchoolInfoType[]>([])
  const [filteredSchools, setFilteredSchools] = useState<SchoolInfoType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<SchoolInfoType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dataFilter, setDataFilter] = useState<string>('')
  const { user } = useAuth()

  const isAdmin = user?.type === 'admin'

  // Filter options for admin
  const filterOptions: IDropdownOption[] = [
    { key: '', text: 'جميع المدارس' },
    { key: 'noTeam', text: 'مدارس بدون فريق' },
    { key: 'noDrills', text: 'مدارس بدون تمارين' },
    { key: 'noTraining', text: 'مدارس بدون تدريب' },
  ]

  useEffect(() => {
    loadSchoolInfo()
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, allSchools, dataFilter])

  const applyFilters = async () => {
    let filtered = allSchools

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.SchoolName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.SchoolID?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.PrincipalName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply data filter
    if (dataFilter && isAdmin) {
      try {
        if (dataFilter === 'noTeam') {
          const teams = await SharePointService.getTeamMembers()
          const schoolsWithTeams = new Set(teams.map(t => t.SchoolName_Ref))
          filtered = filtered.filter(s => !schoolsWithTeams.has(s.SchoolName))
        } else if (dataFilter === 'noDrills') {
          const drills = await SharePointService.getDrills()
          const schoolsWithDrills = new Set(drills.map(d => d.SchoolName_Ref))
          filtered = filtered.filter(s => !schoolsWithDrills.has(s.SchoolName))
        } else if (dataFilter === 'noTraining') {
          const trainings = await SharePointService.getTrainingLog()
          const schoolsWithTraining = new Set(trainings.map(t => t.SchoolName_Ref))
          filtered = filtered.filter(s => !schoolsWithTraining.has(s.SchoolName))
        }
      } catch (e) {
        console.error('Error applying filter:', e)
      }
    }

    setFilteredSchools(filtered)
  }

  const exportToPDF = () => {
    // Create a simple text-based PDF export
    const schoolNames = filteredSchools.map((s, i) => `${i + 1}. ${s.SchoolName} - ${s.SchoolID}`).join('\n')
    const content = `قائمة المدارس\n\nعدد المدارس: ${filteredSchools.length}\n\n${schoolNames}`
    
    // Create a downloadable text file (PDF libraries can be added later)
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `schools-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const loadSchoolInfo = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await SharePointService.getSchoolInfo()
      
      if (isAdmin) {
        setAllSchools(data || [])
        setFilteredSchools(data || [])
      } else if (user?.schoolName) {
        const school = data?.find(s => s.SchoolName === user.schoolName)
        setSchoolInfo(school || null)
      } else if (data && data.length > 0) {
        setSchoolInfo(data[0])
      }
    } catch (e) {
      console.error(e)
      setError('خطأ في تحميل معلومات المدرسة')
    } finally {
      setLoading(false)
    }
  }

  // Admin columns for school list
  const schoolColumns: IColumn[] = [
    { 
      key: 'SchoolName', 
      name: 'اسم المدرسة', 
      fieldName: 'SchoolName', 
      minWidth: 150, 
      flexGrow: 2, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: SchoolInfoType) => (
        <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.SchoolName}</div>
      ),
    },
    { 
      key: 'SchoolID', 
      name: 'الرقم الإحصائي', 
      fieldName: 'SchoolID', 
      minWidth: 80, 
      flexGrow: 1, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: SchoolInfoType) => (
        <div style={{ textAlign: 'center', width: '100%' }}>{item.SchoolID}</div>
      ),
    },
    { 
      key: 'Level', 
      name: 'المرحلة', 
      fieldName: 'Level', 
      minWidth: 70, 
      flexGrow: 1, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: SchoolInfoType) => (
        <div style={{ textAlign: 'center', width: '100%' }}>{item.Level}</div>
      ),
    },
    { 
      key: 'SchoolGender', 
      name: 'النوع', 
      fieldName: 'SchoolGender', 
      minWidth: 45, 
      flexGrow: 1, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: SchoolInfoType) => (
        <div style={{ textAlign: 'center', width: '100%' }}>{item.SchoolGender}</div>
      ),
    },
    { 
      key: 'PrincipalName', 
      name: 'مدير/ة المدرسة', 
      fieldName: 'PrincipalName', 
      minWidth: 110, 
      flexGrow: 2, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: SchoolInfoType) => (
        <div style={{ textAlign: 'center', width: '100%', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.PrincipalName}</div>
      ),
    },
    { 
      key: 'SectorDescription', 
      name: 'القطاع', 
      fieldName: 'SectorDescription', 
      minWidth: 70, 
      flexGrow: 1, 
      isResizable: true,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: SchoolInfoType) => (
        <div style={{ textAlign: 'center', width: '100%' }}>{item.SectorDescription}</div>
      ),
    },
    {
      key: 'view',
      name: 'عرض',
      minWidth: 50,
      flexGrow: 0,
      styles: { cellTitle: { justifyContent: 'center', textAlign: 'center' } },
      onRender: (item: SchoolInfoType) => (
        <div style={{ textAlign: 'center', width: '100%' }}>
          <button
            onClick={() => setSelectedSchool(item)}
            style={{
              padding: '4px 12px',
              backgroundColor: '#008752',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            عرض
          </button>
        </div>
      )
    }
  ]

  const getMapUrl = (lat?: string, lng?: string) => {
    if (!lat || !lng) return '#'
    return `https://www.google.com/maps?q=${lat},${lng}`
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner label="جارٍ تحميل معلومات المدرسة..." />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '32px' }}>
        <div style={{ padding: '16px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c50f1f' }}>
          {error}
        </div>
      </div>
    )
  }

  // Determine which school info to display (selected school for admin, or user's school)
  const displaySchool = isAdmin ? selectedSchool : schoolInfo

  // Admin view with school list
  if (isAdmin) {
    return (
      <div style={{ padding: '32px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Stack tokens={{ childrenGap: 24 }}>
          {/* Header */}
          <div
            style={{
              backgroundColor: '#008752',
              borderRadius: '12px',
              padding: '24px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon iconName="Org" style={{ fontSize: '32px', color: '#fff' }} />
            </div>
            <div>
              <Text variant="xxLarge" style={{ color: '#fff', fontWeight: 700, display: 'block' }}>
                دليل المدارس
              </Text>
              <Text variant="medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                عدد المدارس: {allSchools.length} مدرسة
              </Text>
            </div>
          </div>

          {/* Search and List */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginBottom: 16, flexWrap: 'wrap' }}>
              <SearchBox
                placeholder="ابحث عن مدرسة بالاسم أو الرقم الإحصائي أو اسم المدير/ة..."
                value={searchQuery}
                onChange={(_, newValue) => setSearchQuery(newValue || '')}
                styles={{ root: { flex: 1, minWidth: 300 } }}
              />
              <Dropdown
                placeholder="تصفية المدارس حسب البيانات"
                options={filterOptions}
                selectedKey={dataFilter}
                onChange={(_, option) => setDataFilter(option?.key as string || '')}
                styles={{ root: { width: 250 } }}
              />
              <PrimaryButton
                text="تصدير PDF"
                iconProps={{ iconName: 'PDF' }}
                onClick={exportToPDF}
                disabled={filteredSchools.length === 0}
                styles={{ root: { backgroundColor: '#d13438', borderColor: '#d13438' } }}
              />
            </Stack>
            
            <Text variant="medium" style={{ color: '#666', marginBottom: 12, display: 'block' }}>
              عرض {filteredSchools.length} من {allSchools.length} مدرسة
            </Text>
            
            <div style={{ maxHeight: 400, overflowY: 'auto', width: '100%' }}>
              <DetailsList
                items={filteredSchools}
                columns={schoolColumns}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.none}
                compact
                styles={{ root: { width: '100%' } }}
              />
            </div>
            
            {filteredSchools.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                لا توجد نتائج للبحث
              </div>
            )}
          </div>

          {/* Selected School Details */}
          {selectedSchool && (
            <SchoolDetailView school={selectedSchool} onClose={() => setSelectedSchool(null)} />
          )}
        </Stack>
      </div>
    )
  }

  // Non-admin: show school info directly
  if (!schoolInfo) {
    return (
      <div style={{ padding: '32px' }}>
        <div style={{ padding: '16px', backgroundColor: '#fff4ce', border: '1px solid #ffb900', borderRadius: '4px', color: '#8a6d00' }}>
          لم يتم العثور على معلومات المدرسة
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Stack tokens={{ childrenGap: 24 }}>
        {/* Header */}
        <div
          style={{
            backgroundColor: '#008752',
            borderRadius: '12px',
            padding: '24px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon iconName="CityNext" style={{ fontSize: '32px', color: '#fff' }} />
          </div>
          <div>
            <Text variant="xxLarge" style={{ color: '#fff', fontWeight: 700, display: 'block' }}>
              {schoolInfo.SchoolName || schoolInfo.Title}
            </Text>
            <Text variant="medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
              الرقم الإحصائي للمدرسة: {schoolInfo.SchoolID || '-'}
            </Text>
          </div>
        </div>

        {/* Basic Information */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <SectionHeader title="المعلومات الأساسية" icon="Info" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            <InfoCard icon="School" label="اسم المدرسة" value={schoolInfo.SchoolName} color="#0078d4" />
            <InfoCard icon="NumberSymbol" label="الرقم الإحصائي للمدرسة" value={schoolInfo.SchoolID} color="#8764b8" />
            <InfoCard icon="Education" label="المرحلة الدراسية" value={schoolInfo.Level} color="#00a36c" />
            <InfoCard icon="People" label="نوع المدرسة" value={schoolInfo.SchoolGender} color="#d83b01" />
            <InfoCard icon="BuildingMultiple" label="نمط المدرسة" value={schoolInfo.SchoolType} color="#107c10" />
            <InfoCard icon="Library" label="نوع التعليم" value={schoolInfo.EducationType} color="#038387" />
            <InfoCard icon="Clock" label="وقت الدراسة" value={schoolInfo.StudyTime} color="#ca5010" />
            <InfoCard icon="Home" label="ملكية المبنى" value={schoolInfo.BuildingOwnership} color="#5c2d91" />
            <InfoCard icon="MapPin" label="القطاع / المنطقة" value={schoolInfo.SectorDescription} color="#004e8c" />
          </div>
        </div>

        {/* Principal Information */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <SectionHeader title="معلومات مدير/ة المدرسة" icon="Contact" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
            <div style={{ flex: '1 1 280px', maxWidth: '350px' }}>
              <InfoCard icon="Contact" label="اسم مدير/ة المدرسة" value={schoolInfo.PrincipalName} color="#008752" />
            </div>
            <div style={{ flex: '1 1 280px', maxWidth: '350px' }}>
              <InfoCard icon="Mail" label="البريد الإلكتروني لمدير/ة المدرسة" value={schoolInfo.principalEmail} color="#008752" />
            </div>
            <div style={{ flex: '1 1 280px', maxWidth: '350px' }}>
              <InfoCard icon="Phone" label="رقم هاتف مدير/ة المدرسة" value={schoolInfo.PrincipalPhone} color="#008752" />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <SectionHeader title="معلومات التواصل" icon="Mail" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            <InfoCard icon="Mail" label="البريد الإلكتروني للمدرسة" value={schoolInfo.SchoolEmail} color="#0078d4" />
          </div>
        </div>

        {/* Location */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <SectionHeader title="موقع المدرسة" icon="MapPin" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <InfoCard icon="GlobeFavorite" label="خط العرض (Latitude)" value={schoolInfo.Latitude} color="#0078d4" />
            <InfoCard icon="GlobeFavorite" label="خط الطول (Longitude)" value={schoolInfo.Longitude} color="#d83b01" />
          </div>

          {schoolInfo.Latitude && schoolInfo.Longitude ? (
            <div>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e1e1e1', height: '350px', position: 'relative' }}>
                <iframe
                  title="موقع المدرسة"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${schoolInfo.Latitude},${schoolInfo.Longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  allowFullScreen
                />
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                <a
                  href={getMapUrl(schoolInfo.Latitude, schoolInfo.Longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#0078d4',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  <Icon iconName="NavigateExternalInline" />
                  فتح في خرائط جوجل
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${schoolInfo.Latitude},${schoolInfo.Longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#107c10',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  <Icon iconName="Car" />
                  الحصول على الاتجاهات
                </a>
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
              <Icon iconName="MapPin" style={{ fontSize: '48px', color: '#ccc', marginBottom: '12px' }} />
              <Text variant="medium" style={{ display: 'block' }}>
                لا تتوفر معلومات الموقع الجغرافي لهذه المدرسة
              </Text>
            </div>
          )}
        </div>
      </Stack>
    </div>
  )
}

// School Detail View Component for Admin
interface SchoolDetailViewProps {
  school: SchoolInfoType
  onClose: () => void
}

const SchoolDetailView: React.FC<SchoolDetailViewProps> = ({ school, onClose }) => {
  const getMapUrl = (lat?: string, lng?: string) => {
    if (!lat || !lng) return '#'
    return `https://www.google.com/maps?q=${lat},${lng}`
  }

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #008752' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text variant="xLarge" style={{ fontWeight: 600, color: '#008752' }}>
          {school.SchoolName}
        </Text>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f2f1',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          إغلاق
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
        <InfoCard icon="NumberSymbol" label="الرقم الإحصائي" value={school.SchoolID} color="#8764b8" />
        <InfoCard icon="Education" label="المرحلة" value={school.Level} color="#00a36c" />
        <InfoCard icon="People" label="النوع" value={school.SchoolGender} color="#d83b01" />
        <InfoCard icon="BuildingMultiple" label="نمط المدرسة" value={school.SchoolType} color="#107c10" />
        <InfoCard icon="Library" label="نوع التعليم" value={school.EducationType} color="#038387" />
        <InfoCard icon="Contact" label="مدير/ة المدرسة" value={school.PrincipalName} color="#008752" />
        <InfoCard icon="Mail" label="بريد المدير/ة" value={school.principalEmail} color="#0078d4" />
        <InfoCard icon="Phone" label="هاتف المدير/ة" value={school.PrincipalPhone} color="#107c10" />
        <InfoCard icon="MapPin" label="القطاع" value={school.SectorDescription} color="#004e8c" />
        <InfoCard icon="Clock" label="وقت الدراسة" value={school.StudyTime} color="#ca5010" />
        <InfoCard icon="Home" label="ملكية المبنى" value={school.BuildingOwnership} color="#5c2d91" />
        <InfoCard icon="Mail" label="بريد المدرسة" value={school.SchoolEmail} color="#0078d4" />
      </div>
      
      {school.Latitude && school.Longitude && (
        <div style={{ marginTop: 16 }}>
          <a
            href={getMapUrl(school.Latitude, school.Longitude)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0078d4',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '13px',
            }}
          >
            <Icon iconName="MapPin" />
            عرض الموقع
          </a>
        </div>
      )}
    </div>
  )
}

export default SchoolInfo
