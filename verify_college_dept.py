"""
엑셀 전공 시트의 college/department/major 와
코드 내 과목 데이터의 college/department/major 를 비교하여 불일치를 찾는 스크립트
"""
import json
import re
import os

# 1) 엑셀 데이터 로드
with open("excel_data.json", "r", encoding="utf-8") as f:
    excel_data = json.load(f)

major_rows = excel_data.get("전공", [])
# header: ['단과대학', '학부/학과', '전공', '학년', '학수번호', '분반', '과목 명', '이수구분', '학점', '담당교수', '강의시간', '강의실', '비고']
# idx:      0           1            2       3       4           5

# 엑셀 기준 맵: (학수번호, 분반) -> {college, department, major}
excel_map = {}
for row in major_rows[2:]:  # skip empty row + header
    if len(row) < 6:
        continue
    college = row[0].strip()
    department = row[1].strip()
    major = row[2].strip()
    code = row[4].strip()
    section = row[5].strip().zfill(2) if row[5].strip() else row[5].strip()
    
    if not code:
        continue
    
    key = f"{code}-{section}"
    excel_map[key] = {
        "college": college,
        "department": department,
        "major": major,
    }

print(f"엑셀 전공 시트 과목 수: {len(excel_map)}")

# 2) 코드 데이터 로드 - 각 ts 파일에서 과목 데이터 추출
# 정규식으로 id, college, department, major 추출
course_files = [
    "src/data/courses/major_required.ts",
    "src/data/courses/major_elective.ts",
    "src/data/courses/semester.ts",
    "src/data/courses/teaching.ts",
    "src/data/courses/normal_electives.ts",
]

code_courses = {}  # id -> {college, department, major, file}

for filepath in course_files:
    if not os.path.exists(filepath):
        print(f"  [SKIP] {filepath} not found")
        continue
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 각 과목 블록 추출
    # id 패턴: id: '12345-1' 또는 id: '12345-01'
    blocks = re.split(r'\{\s*\n', content)
    
    for block in blocks:
        id_match = re.search(r"id:\s*'([^']+)'", block)
        college_match = re.search(r"college:\s*'([^']*)'", block)
        dept_match = re.search(r"department:\s*'([^']*)'", block)
        major_match = re.search(r"major:\s*'([^']*)'", block)
        
        if id_match and college_match and dept_match and major_match:
            course_id = id_match.group(1)
            # id를 code-section 형태로 정규화
            parts = course_id.split('-')
            if len(parts) == 2:
                code_part = parts[0]
                section_part = parts[1].zfill(2)
                normalized_id = f"{code_part}-{section_part}"
            else:
                normalized_id = course_id
            
            code_courses[normalized_id] = {
                "college": college_match.group(1),
                "department": dept_match.group(1),
                "major": major_match.group(1),
                "file": os.path.basename(filepath),
                "raw_id": course_id,
            }

print(f"코드 과목 수 (전필/전선/학기/교직/일선): {len(code_courses)}")

# 3) 비교
mismatches = []
missing_in_code = []
missing_in_excel = []

for key, excel_info in excel_map.items():
    if key not in code_courses:
        missing_in_code.append((key, excel_info))
        continue
    
    code_info = code_courses[key]
    
    diffs = []
    for field in ["college", "department", "major"]:
        excel_val = excel_info[field]
        code_val = code_info[field]
        if excel_val != code_val:
            diffs.append(f"  {field}: 엑셀='{excel_val}' vs 코드='{code_val}'")
    
    if diffs:
        mismatches.append((key, code_info["file"], diffs))

for key, code_info in code_courses.items():
    if key not in excel_map:
        missing_in_excel.append((key, code_info))

# 4) 결과 출력
print(f"\n=== 불일치 항목: {len(mismatches)}개 ===")
for key, filename, diffs in sorted(mismatches):
    print(f"\n[{key}] ({filename})")
    for d in diffs:
        print(d)

print(f"\n=== 엑셀에는 있지만 코드에 없는 과목: {len(missing_in_code)}개 ===")
for key, info in sorted(missing_in_code)[:20]:
    print(f"  {key}: {info['college']} / {info['department']} / {info['major']}")
if len(missing_in_code) > 20:
    print(f"  ... 외 {len(missing_in_code)-20}개")

print(f"\n=== 코드에는 있지만 엑셀 전공시트에 없는 과목: {len(missing_in_excel)}개 ===")
for key, info in sorted(missing_in_excel)[:20]:
    print(f"  {key}: {info['college']} / {info['department']} / {info['major']} ({info['file']})")
if len(missing_in_excel) > 20:
    print(f"  ... 외 {len(missing_in_excel)-20}개")
