# -*- coding: utf-8 -*-
"""
التشغيل المتبادل للمدارس - Mutual School Operation System
==========================================================
This script automatically assigns alternative schools based on:
1. Same school level (المرحلة)
2. Same gender (بنين/بنات)
3. Geographic proximity (within specified distance)

Author: School BC App
Date: December 2024
"""

import json
import re
import math
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from collections import defaultdict

@dataclass
class School:
    """School data structure"""
    school_id: str
    school_name: str
    level: str  # المرحلة الإبتدائية, المرحلة المتوسطة, المرحلة الثانوية
    gender: str  # بنين, بنات
    latitude: float
    longitude: float
    sector: str
    principal_name: str
    principal_phone: str
    school_email: str

@dataclass
class AlternativeAssignment:
    """Alternative school assignment"""
    school: School
    alternative_school: School
    distance_km: float
    priority: int  # 1 = closest, 2 = second closest, etc.

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the distance between two points on Earth using Haversine formula
    Returns distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def load_schools_from_typescript(filepath: str) -> List[School]:
    """
    Load schools data from the TypeScript file
    """
    print("📂 جاري تحميل بيانات المدارس...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract the array from TypeScript
    match = re.search(r'export const schoolsData.*?=\s*(\[.+\])', content, re.DOTALL)
    if not match:
        raise ValueError("Could not find schoolsData in file")
    
    # Convert to valid JSON (add quotes around keys)
    json_str = match.group(1)
    # Fix JavaScript object notation to JSON
    json_str = re.sub(r'(\w+):', r'"\1":', json_str)
    
    data = json.loads(json_str)
    
    schools = []
    for item in data:
        try:
            lat = float(item.get('Latitude', 0) or 0)
            lon = float(item.get('Longitude', 0) or 0)
            
            if lat == 0 or lon == 0:
                continue  # Skip schools without coordinates
                
            school = School(
                school_id=item.get('SchoolID', ''),
                school_name=item.get('SchoolName', ''),
                level=item.get('Level', ''),
                gender=item.get('SchoolGender', ''),
                latitude=lat,
                longitude=lon,
                sector=item.get('SectorDescription', ''),
                principal_name=item.get('PrincipalName', ''),
                principal_phone=item.get('PrincipalPhone', ''),
                school_email=item.get('SchoolEmail', '')
            )
            schools.append(school)
        except (ValueError, TypeError):
            continue
    
    print(f"✅ تم تحميل {len(schools)} مدرسة بنجاح")
    return schools

def group_schools_by_criteria(schools: List[School]) -> Dict[Tuple[str, str], List[School]]:
    """
    Group schools by level and gender for matching
    """
    groups = defaultdict(list)
    for school in schools:
        key = (school.level, school.gender)
        groups[key].append(school)
    return dict(groups)

def find_alternative_schools(
    school: School, 
    candidates: List[School], 
    max_distance_km: float = 10.0,
    max_alternatives: int = 3
) -> List[AlternativeAssignment]:
    """
    Find alternative schools for a given school
    - Must be same level and gender
    - Within maximum distance
    - Returns up to max_alternatives sorted by distance
    """
    alternatives = []
    
    for candidate in candidates:
        if candidate.school_id == school.school_id:
            continue  # Skip self
        
        distance = haversine_distance(
            school.latitude, school.longitude,
            candidate.latitude, candidate.longitude
        )
        
        if distance <= max_distance_km:
            alternatives.append((candidate, distance))
    
    # Sort by distance
    alternatives.sort(key=lambda x: x[1])
    
    # Return top alternatives
    result = []
    for i, (alt_school, distance) in enumerate(alternatives[:max_alternatives]):
        result.append(AlternativeAssignment(
            school=school,
            alternative_school=alt_school,
            distance_km=round(distance, 2),
            priority=i + 1
        ))
    
    return result

def generate_mutual_operation_plan(
    schools: List[School],
    max_distance_km: float = 10.0,
    max_alternatives: int = 3
) -> Dict[str, List[AlternativeAssignment]]:
    """
    Generate the complete mutual operation plan (التشغيل المتبادل)
    """
    print(f"\n🔄 جاري إنشاء خطة التشغيل المتبادل...")
    print(f"   - الحد الأقصى للمسافة: {max_distance_km} كم")
    print(f"   - عدد البدائل لكل مدرسة: {max_alternatives}")
    
    # Group schools
    groups = group_schools_by_criteria(schools)
    
    print(f"\n📊 توزيع المدارس حسب المرحلة والجنس:")
    for (level, gender), school_list in groups.items():
        print(f"   - {level} ({gender}): {len(school_list)} مدرسة")
    
    # Generate alternatives for each school
    all_assignments = {}
    schools_with_alternatives = 0
    schools_without_alternatives = 0
    
    for school in schools:
        key = (school.level, school.gender)
        candidates = groups.get(key, [])
        
        alternatives = find_alternative_schools(
            school, candidates, max_distance_km, max_alternatives
        )
        
        all_assignments[school.school_id] = alternatives
        
        if alternatives:
            schools_with_alternatives += 1
        else:
            schools_without_alternatives += 1
    
    print(f"\n✅ نتائج التشغيل المتبادل:")
    print(f"   - مدارس لها بدائل: {schools_with_alternatives}")
    print(f"   - مدارس بدون بدائل قريبة: {schools_without_alternatives}")
    
    return all_assignments

def export_to_json(
    assignments: Dict[str, List[AlternativeAssignment]], 
    output_path: str
):
    """
    Export the mutual operation plan to JSON
    """
    export_data = []
    
    for school_id, alternatives in assignments.items():
        if not alternatives:
            continue
            
        school = alternatives[0].school
        
        school_data = {
            "schoolId": school.school_id,
            "schoolName": school.school_name,
            "level": school.level,
            "gender": school.gender,
            "sector": school.sector,
            "latitude": school.latitude,
            "longitude": school.longitude,
            "alternatives": []
        }
        
        for alt in alternatives:
            school_data["alternatives"].append({
                "priority": alt.priority,
                "alternativeSchoolId": alt.alternative_school.school_id,
                "alternativeSchoolName": alt.alternative_school.school_name,
                "alternativeSector": alt.alternative_school.sector,
                "distanceKm": alt.distance_km,
                "principalName": alt.alternative_school.principal_name,
                "principalPhone": alt.alternative_school.principal_phone,
                "alternativeLatitude": alt.alternative_school.latitude,
                "alternativeLongitude": alt.alternative_school.longitude
            })
        
        export_data.append(school_data)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 تم حفظ خطة التشغيل المتبادل في: {output_path}")

def export_to_csv(
    assignments: Dict[str, List[AlternativeAssignment]], 
    output_path: str
):
    """
    Export to CSV for Excel/SharePoint
    """
    import csv
    
    with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        
        # Header
        writer.writerow([
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
        ])
        
        for school_id, alternatives in assignments.items():
            for alt in alternatives:
                writer.writerow([
                    alt.school.school_id,
                    alt.school.school_name,
                    alt.school.level,
                    alt.school.gender,
                    alt.school.sector,
                    alt.alternative_school.school_id,
                    alt.alternative_school.school_name,
                    alt.alternative_school.sector,
                    alt.distance_km,
                    alt.priority,
                    alt.alternative_school.principal_name,
                    alt.alternative_school.principal_phone
                ])
    
    print(f"📊 تم حفظ ملف CSV في: {output_path}")

def print_sample_report(assignments: Dict[str, List[AlternativeAssignment]], sample_size: int = 5):
    """
    Print a sample report of the assignments
    """
    print("\n" + "="*80)
    print("📋 نموذج من خطة التشغيل المتبادل للمدارس")
    print("="*80)
    
    count = 0
    for school_id, alternatives in assignments.items():
        if not alternatives:
            continue
        if count >= sample_size:
            break
            
        school = alternatives[0].school
        print(f"\n🏫 {school.school_name}")
        print(f"   المرحلة: {school.level} | الجنس: {school.gender}")
        print(f"   القطاع: {school.sector}")
        print(f"   الموقع: ({school.latitude}, {school.longitude})")
        print(f"   البدائل المتاحة:")
        
        for alt in alternatives:
            print(f"      {alt.priority}. {alt.alternative_school.school_name}")
            print(f"         المسافة: {alt.distance_km} كم | القطاع: {alt.alternative_school.sector}")
            print(f"         المدير: {alt.alternative_school.principal_name}")
        
        count += 1

def generate_statistics(assignments: Dict[str, List[AlternativeAssignment]]) -> Dict:
    """
    Generate statistics about the mutual operation plan
    """
    stats = {
        "total_schools": len(assignments),
        "schools_with_alternatives": 0,
        "schools_without_alternatives": 0,
        "by_level": defaultdict(lambda: {"with_alt": 0, "without_alt": 0}),
        "by_gender": defaultdict(lambda: {"with_alt": 0, "without_alt": 0}),
        "by_sector": defaultdict(lambda: {"with_alt": 0, "without_alt": 0}),
        "average_distance": 0,
        "min_distance": float('inf'),
        "max_distance": 0
    }
    
    distances = []
    
    for school_id, alternatives in assignments.items():
        if alternatives:
            school = alternatives[0].school
            stats["schools_with_alternatives"] += 1
            stats["by_level"][school.level]["with_alt"] += 1
            stats["by_gender"][school.gender]["with_alt"] += 1
            stats["by_sector"][school.sector]["with_alt"] += 1
            
            for alt in alternatives:
                distances.append(alt.distance_km)
        else:
            stats["schools_without_alternatives"] += 1
    
    if distances:
        stats["average_distance"] = round(sum(distances) / len(distances), 2)
        stats["min_distance"] = min(distances)
        stats["max_distance"] = max(distances)
    
    return stats

def print_statistics(stats: Dict):
    """
    Print detailed statistics
    """
    print("\n" + "="*80)
    print("📊 إحصائيات خطة التشغيل المتبادل")
    print("="*80)
    
    print(f"\n📈 الإحصائيات العامة:")
    print(f"   - إجمالي المدارس: {stats['total_schools']}")
    print(f"   - مدارس لها بدائل: {stats['schools_with_alternatives']} ({round(stats['schools_with_alternatives']/stats['total_schools']*100, 1)}%)")
    print(f"   - مدارس بدون بدائل: {stats['schools_without_alternatives']} ({round(stats['schools_without_alternatives']/stats['total_schools']*100, 1)}%)")
    
    print(f"\n📏 إحصائيات المسافات:")
    print(f"   - متوسط المسافة: {stats['average_distance']} كم")
    print(f"   - أقل مسافة: {stats['min_distance']} كم")
    print(f"   - أكبر مسافة: {stats['max_distance']} كم")
    
    print(f"\n🎓 حسب المرحلة الدراسية:")
    for level, data in stats["by_level"].items():
        total = data["with_alt"] + data["without_alt"]
        print(f"   - {level}: {data['with_alt']}/{total} لها بدائل")
    
    print(f"\n👫 حسب الجنس:")
    for gender, data in stats["by_gender"].items():
        total = data["with_alt"] + data["without_alt"]
        print(f"   - {gender}: {data['with_alt']}/{total} لها بدائل")

def main():
    """
    Main function to run the mutual operation plan generator
    """
    print("\n" + "="*80)
    print("🏫 نظام التشغيل المتبادل للمدارس")
    print("   الإدارة العامة للتعليم بمنطقة المدينة المنورة")
    print("="*80)
    
    # Configuration
    SCHOOLS_FILE = "src/data/schools.ts"
    MAX_DISTANCE_KM = 10.0  # Maximum distance for alternative school
    MAX_ALTERNATIVES = 3     # Number of alternatives per school
    
    # Load schools
    schools = load_schools_from_typescript(SCHOOLS_FILE)
    
    # Generate mutual operation plan
    assignments = generate_mutual_operation_plan(
        schools, 
        max_distance_km=MAX_DISTANCE_KM,
        max_alternatives=MAX_ALTERNATIVES
    )
    
    # Generate and print statistics
    stats = generate_statistics(assignments)
    print_statistics(stats)
    
    # Print sample report
    print_sample_report(assignments, sample_size=5)
    
    # Export to files
    export_to_json(assignments, "mutual_operation_plan.json")
    export_to_csv(assignments, "mutual_operation_plan.csv")
    
    print("\n" + "="*80)
    print("✅ تم إنشاء خطة التشغيل المتبادل بنجاح!")
    print("="*80)
    
    return assignments

if __name__ == "__main__":
    assignments = main()
