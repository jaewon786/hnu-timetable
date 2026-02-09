import json, re, os

with open("excel_data.json", "r", encoding="utf-8") as f:
    excel_data = json.load(f)

major_rows = excel_data["전공"]
excel_map = {}
for row in major_rows[2:]:
    if len(row) < 7:
        continue
    code = row[4].strip()
    section = row[5].strip().zfill(2) if row[5].strip() else row[5].strip()
    if not code:
        continue
    key = f"{code}-{section}"
    excel_map[key] = {
        "college": row[0].strip(),
        "department": row[1].strip(),
        "major": row[2].strip(),
        "name": row[6].strip(),
        "category": row[7].strip() if len(row) > 7 else "",
    }

course_files = [
    "src/data/courses/major_required.ts",
    "src/data/courses/major_elective.ts",
    "src/data/courses/semester.ts",
    "src/data/courses/teaching.ts",
    "src/data/courses/normal_electives.ts",
]
code_ids = set()
for fp in course_files:
    if not os.path.exists(fp):
        continue
    with open(fp, "r", encoding="utf-8") as f:
        content = f.read()
    for m in re.finditer(r"id:\s*'([^']+)'", content):
        cid = m.group(1)
        parts = cid.split("-")
        if len(parts) == 2:
            code_ids.add(f"{parts[0]}-{parts[1].zfill(2)}")

missing = [(k, v) for k, v in sorted(excel_map.items()) if k not in code_ids]
for k, v in missing[:5]:
    print(f"{k}: {v['name']} | {v['category']} | {v['college']} / {v['department']} / {v['major']}")
print(f"(총 {len(missing)}개)")
