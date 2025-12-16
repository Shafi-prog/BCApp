/**
 * التشغيل المتبادل للمدارس - Mutual School Operation System
 * ==========================================================
 * This script automatically assigns alternative schools based on:
 * 1. Same school level (المرحلة)
 * 2. Same gender (بنين/بنات)
 * 3. Geographic proximity (within specified distance)
 *
 * Author: School BC App
 * Date: December 2024
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    SCHOOLS_FILE: 'src/data/schools.ts',
    MAX_DISTANCE_KM: 10.0,  // Maximum distance for alternative school
    MAX_ALTERNATIVES: 3,     // Number of alternatives per school
    OUTPUT_JSON: 'mutual_operation_plan.json',
    OUTPUT_CSV: 'mutual_operation_plan.csv'
};

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const deltaLat = (lat2 - lat1) * Math.PI / 180;
    const deltaLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
}

/**
 * Load schools data from TypeScript file
 */
function loadSchools(filepath) {
    console.log('📂 جاري تحميل بيانات المدارس...');
    
    const content = fs.readFileSync(filepath, 'utf-8');
    
    // Extract the array from TypeScript
    const match = content.match(/export const schoolsData.*?=\s*(\[[\s\S]+\])/);
    if (!match) {
        throw new Error('Could not find schoolsData in file');
    }
    
    // Convert to valid JSON (add quotes around keys)
    let jsonStr = match[1];
    jsonStr = jsonStr.replace(/(\w+):/g, '"$1":');
    
    const data = JSON.parse(jsonStr);
    
    const schools = [];
    for (const item of data) {
        const lat = parseFloat(item.Latitude || 0);
        const lon = parseFloat(item.Longitude || 0);
        
        if (lat === 0 || lon === 0 || isNaN(lat) || isNaN(lon)) {
            continue; // Skip schools without coordinates
        }
        
        schools.push({
            schoolId: item.SchoolID || '',
            schoolName: item.SchoolName || '',
            level: item.Level || '',
            gender: item.SchoolGender || '',
            latitude: lat,
            longitude: lon,
            sector: item.SectorDescription || '',
            principalName: item.PrincipalName || '',
            principalPhone: item.PrincipalPhone || '',
            schoolEmail: item.SchoolEmail || ''
        });
    }
    
    console.log(`✅ تم تحميل ${schools.length} مدرسة بنجاح`);
    return schools;
}

/**
 * Group schools by level and gender
 */
function groupSchools(schools) {
    const groups = {};
    
    for (const school of schools) {
        const key = `${school.level}|${school.gender}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(school);
    }
    
    return groups;
}

/**
 * Find alternative schools for a given school
 */
function findAlternatives(school, candidates, maxDistance, maxAlternatives) {
    const alternatives = [];
    
    for (const candidate of candidates) {
        if (candidate.schoolId === school.schoolId) {
            continue; // Skip self
        }
        
        const distance = haversineDistance(
            school.latitude, school.longitude,
            candidate.latitude, candidate.longitude
        );
        
        if (distance <= maxDistance) {
            alternatives.push({
                school: candidate,
                distance: Math.round(distance * 100) / 100
            });
        }
    }
    
    // Sort by distance
    alternatives.sort((a, b) => a.distance - b.distance);
    
    // Return top alternatives with priority
    return alternatives.slice(0, maxAlternatives).map((alt, idx) => ({
        priority: idx + 1,
        alternativeSchool: alt.school,
        distanceKm: alt.distance
    }));
}

/**
 * Generate the complete mutual operation plan
 */
function generateMutualOperationPlan(schools, maxDistance, maxAlternatives) {
    console.log(`\n🔄 جاري إنشاء خطة التشغيل المتبادل...`);
    console.log(`   - الحد الأقصى للمسافة: ${maxDistance} كم`);
    console.log(`   - عدد البدائل لكل مدرسة: ${maxAlternatives}`);
    
    // Group schools
    const groups = groupSchools(schools);
    
    console.log(`\n📊 توزيع المدارس حسب المرحلة والجنس:`);
    for (const [key, schoolList] of Object.entries(groups)) {
        const [level, gender] = key.split('|');
        console.log(`   - ${level} (${gender}): ${schoolList.length} مدرسة`);
    }
    
    // Generate alternatives for each school
    const assignments = {};
    let withAlternatives = 0;
    let withoutAlternatives = 0;
    
    for (const school of schools) {
        const key = `${school.level}|${school.gender}`;
        const candidates = groups[key] || [];
        
        const alternatives = findAlternatives(school, candidates, maxDistance, maxAlternatives);
        
        assignments[school.schoolId] = {
            school,
            alternatives
        };
        
        if (alternatives.length > 0) {
            withAlternatives++;
        } else {
            withoutAlternatives++;
        }
    }
    
    console.log(`\n✅ نتائج التشغيل المتبادل:`);
    console.log(`   - مدارس لها بدائل: ${withAlternatives}`);
    console.log(`   - مدارس بدون بدائل قريبة: ${withoutAlternatives}`);
    
    return assignments;
}

/**
 * Generate statistics
 */
function generateStatistics(assignments) {
    const stats = {
        totalSchools: Object.keys(assignments).length,
        schoolsWithAlternatives: 0,
        schoolsWithoutAlternatives: 0,
        byLevel: {},
        byGender: {},
        bySector: {},
        distances: []
    };
    
    for (const [schoolId, data] of Object.entries(assignments)) {
        const { school, alternatives } = data;
        
        // Initialize level stats
        if (!stats.byLevel[school.level]) {
            stats.byLevel[school.level] = { withAlt: 0, withoutAlt: 0 };
        }
        // Initialize gender stats
        if (!stats.byGender[school.gender]) {
            stats.byGender[school.gender] = { withAlt: 0, withoutAlt: 0 };
        }
        // Initialize sector stats
        if (!stats.bySector[school.sector]) {
            stats.bySector[school.sector] = { withAlt: 0, withoutAlt: 0 };
        }
        
        if (alternatives.length > 0) {
            stats.schoolsWithAlternatives++;
            stats.byLevel[school.level].withAlt++;
            stats.byGender[school.gender].withAlt++;
            stats.bySector[school.sector].withAlt++;
            
            for (const alt of alternatives) {
                stats.distances.push(alt.distanceKm);
            }
        } else {
            stats.schoolsWithoutAlternatives++;
            stats.byLevel[school.level].withoutAlt++;
            stats.byGender[school.gender].withoutAlt++;
            stats.bySector[school.sector].withoutAlt++;
        }
    }
    
    if (stats.distances.length > 0) {
        stats.avgDistance = Math.round(stats.distances.reduce((a, b) => a + b, 0) / stats.distances.length * 100) / 100;
        stats.minDistance = Math.min(...stats.distances);
        stats.maxDistance = Math.max(...stats.distances);
    }
    
    return stats;
}

/**
 * Print statistics
 */
function printStatistics(stats) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 إحصائيات خطة التشغيل المتبادل');
    console.log('='.repeat(80));
    
    console.log(`\n📈 الإحصائيات العامة:`);
    console.log(`   - إجمالي المدارس: ${stats.totalSchools}`);
    console.log(`   - مدارس لها بدائل: ${stats.schoolsWithAlternatives} (${Math.round(stats.schoolsWithAlternatives/stats.totalSchools*100)}%)`);
    console.log(`   - مدارس بدون بدائل: ${stats.schoolsWithoutAlternatives} (${Math.round(stats.schoolsWithoutAlternatives/stats.totalSchools*100)}%)`);
    
    if (stats.distances.length > 0) {
        console.log(`\n📏 إحصائيات المسافات:`);
        console.log(`   - متوسط المسافة: ${stats.avgDistance} كم`);
        console.log(`   - أقل مسافة: ${stats.minDistance} كم`);
        console.log(`   - أكبر مسافة: ${stats.maxDistance} كم`);
    }
    
    console.log(`\n🎓 حسب المرحلة الدراسية:`);
    for (const [level, data] of Object.entries(stats.byLevel)) {
        const total = data.withAlt + data.withoutAlt;
        console.log(`   - ${level}: ${data.withAlt}/${total} لها بدائل`);
    }
    
    console.log(`\n👫 حسب الجنس:`);
    for (const [gender, data] of Object.entries(stats.byGender)) {
        const total = data.withAlt + data.withoutAlt;
        console.log(`   - ${gender}: ${data.withAlt}/${total} لها بدائل`);
    }
    
    console.log(`\n🏘️ حسب القطاع:`);
    for (const [sector, data] of Object.entries(stats.bySector)) {
        const total = data.withAlt + data.withoutAlt;
        const percent = Math.round(data.withAlt / total * 100);
        console.log(`   - ${sector}: ${data.withAlt}/${total} (${percent}%)`);
    }
}

/**
 * Print sample report
 */
function printSampleReport(assignments, sampleSize = 5) {
    console.log('\n' + '='.repeat(80));
    console.log('📋 نموذج من خطة التشغيل المتبادل للمدارس');
    console.log('='.repeat(80));
    
    let count = 0;
    for (const [schoolId, data] of Object.entries(assignments)) {
        if (data.alternatives.length === 0) continue;
        if (count >= sampleSize) break;
        
        const { school, alternatives } = data;
        
        console.log(`\n🏫 ${school.schoolName}`);
        console.log(`   المرحلة: ${school.level} | الجنس: ${school.gender}`);
        console.log(`   القطاع: ${school.sector}`);
        console.log(`   الموقع: (${school.latitude}, ${school.longitude})`);
        console.log(`   البدائل المتاحة:`);
        
        for (const alt of alternatives) {
            console.log(`      ${alt.priority}. ${alt.alternativeSchool.schoolName}`);
            console.log(`         المسافة: ${alt.distanceKm} كم | القطاع: ${alt.alternativeSchool.sector}`);
            console.log(`         المدير: ${alt.alternativeSchool.principalName}`);
        }
        
        count++;
    }
}

/**
 * Export to JSON
 */
function exportToJson(assignments, outputPath) {
    const exportData = [];
    
    for (const [schoolId, data] of Object.entries(assignments)) {
        if (data.alternatives.length === 0) continue;
        
        const { school, alternatives } = data;
        
        exportData.push({
            schoolId: school.schoolId,
            schoolName: school.schoolName,
            level: school.level,
            gender: school.gender,
            sector: school.sector,
            latitude: school.latitude,
            longitude: school.longitude,
            alternatives: alternatives.map(alt => ({
                priority: alt.priority,
                alternativeSchoolId: alt.alternativeSchool.schoolId,
                alternativeSchoolName: alt.alternativeSchool.schoolName,
                alternativeSector: alt.alternativeSchool.sector,
                distanceKm: alt.distanceKm,
                principalName: alt.alternativeSchool.principalName,
                principalPhone: alt.alternativeSchool.principalPhone,
                alternativeLatitude: alt.alternativeSchool.latitude,
                alternativeLongitude: alt.alternativeSchool.longitude
            }))
        });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
    console.log(`\n💾 تم حفظ خطة التشغيل المتبادل في: ${outputPath}`);
    
    return exportData;
}

/**
 * Export to CSV
 */
function exportToCsv(assignments, outputPath) {
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel
    const headers = [
        'رقم المدرسة',
        'اسم المدرسة',
        'المرحلة',
        'الجنس',
        'القطاع',
        'رقم المدرسة البديلة',
        'اسم المدرسة البديلة',
        'قطاع المدرسة البديلة',
        'المسافة (كم)',
        'الأولوية',
        'مدير المدرسة البديلة',
        'جوال المدير'
    ];
    
    const rows = [headers.join(',')];
    
    for (const [schoolId, data] of Object.entries(assignments)) {
        for (const alt of data.alternatives) {
            rows.push([
                data.school.schoolId,
                `"${data.school.schoolName}"`,
                data.school.level,
                data.school.gender,
                `"${data.school.sector}"`,
                alt.alternativeSchool.schoolId,
                `"${alt.alternativeSchool.schoolName}"`,
                `"${alt.alternativeSchool.sector}"`,
                alt.distanceKm,
                alt.priority,
                `"${alt.alternativeSchool.principalName}"`,
                alt.alternativeSchool.principalPhone
            ].join(','));
        }
    }
    
    fs.writeFileSync(outputPath, BOM + rows.join('\n'), 'utf-8');
    console.log(`📊 تم حفظ ملف CSV في: ${outputPath}`);
}

/**
 * Generate TypeScript data for the app
 */
function exportToTypeScript(assignments, outputPath) {
    const exportData = [];
    
    for (const [schoolId, data] of Object.entries(assignments)) {
        if (data.alternatives.length === 0) continue;
        
        const { school, alternatives } = data;
        
        exportData.push({
            schoolId: school.schoolId,
            schoolName: school.schoolName,
            level: school.level,
            gender: school.gender,
            sector: school.sector,
            alternatives: alternatives.map(alt => ({
                priority: alt.priority,
                schoolId: alt.alternativeSchool.schoolId,
                schoolName: alt.alternativeSchool.schoolName,
                sector: alt.alternativeSchool.sector,
                distanceKm: alt.distanceKm,
                principalName: alt.alternativeSchool.principalName,
                principalPhone: alt.alternativeSchool.principalPhone
            }))
        });
    }
    
    const tsContent = `// Auto-generated Mutual Operation Plan (التشغيل المتبادل للمدارس)
// Generated on: ${new Date().toISOString()}
// Total schools with alternatives: ${exportData.length}

export interface AlternativeSchool {
    priority: number;
    schoolId: string;
    schoolName: string;
    sector: string;
    distanceKm: number;
    principalName: string;
    principalPhone: string;
}

export interface SchoolAlternatives {
    schoolId: string;
    schoolName: string;
    level: string;
    gender: string;
    sector: string;
    alternatives: AlternativeSchool[];
}

export const mutualOperationPlan: SchoolAlternatives[] = ${JSON.stringify(exportData, null, 2)};

// Helper function to get alternatives for a school
export function getAlternativesForSchool(schoolId: string): SchoolAlternatives | undefined {
    return mutualOperationPlan.find(s => s.schoolId === schoolId);
}

// Helper function to get alternatives by school name
export function getAlternativesByName(schoolName: string): SchoolAlternatives | undefined {
    return mutualOperationPlan.find(s => s.schoolName === schoolName);
}
`;
    
    fs.writeFileSync(outputPath, tsContent, 'utf-8');
    console.log(`📝 تم حفظ ملف TypeScript في: ${outputPath}`);
}

/**
 * Main function
 */
function main() {
    console.log('\n' + '='.repeat(80));
    console.log('🏫 نظام التشغيل المتبادل للمدارس');
    console.log('   الإدارة العامة للتعليم بمنطقة المدينة المنورة');
    console.log('='.repeat(80));
    
    try {
        // Load schools
        const schools = loadSchools(CONFIG.SCHOOLS_FILE);
        
        // Generate mutual operation plan
        const assignments = generateMutualOperationPlan(
            schools,
            CONFIG.MAX_DISTANCE_KM,
            CONFIG.MAX_ALTERNATIVES
        );
        
        // Generate and print statistics
        const stats = generateStatistics(assignments);
        printStatistics(stats);
        
        // Print sample report
        printSampleReport(assignments, 5);
        
        // Export to files
        exportToJson(assignments, CONFIG.OUTPUT_JSON);
        exportToCsv(assignments, CONFIG.OUTPUT_CSV);
        exportToTypeScript(assignments, 'src/data/mutualOperation.ts');
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ تم إنشاء خطة التشغيل المتبادل بنجاح!');
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('❌ خطأ:', error.message);
        process.exit(1);
    }
}

// Run
main();
