# 🎓 HNU Timetable

한남대학교 학생들을 위한 시간표 조합 웹 애플리케이션

## ✨ 주요 기능

### 📚 과목 검색 및 필터링
- **다양한 카테고리**: 교필, 교선, 전필, 전선, 온라인, 학기, 교직, 일선, 코드쉐어, 마이크로디그리
- **세밀한 필터링**: 단과대학, 학년, 요일, 학점별 검색
- **시간 확정 과목** 필터링

### 🗓️ 비주얼 시간표
- **에브리타임 스타일** UI
- **시간 충돌 감지** 및 경고
- **연속 교시 자동 병합** (예: 월5,6 → 13:00~14:50)
- **과목별 색상** 구분 (15가지 파스텔 컬러)
- **드래그 앤 드롭** 지원 (추가/제거)

### 💾 데이터 관리
- **로컬 저장소** 자동 저장
- **학점 집계**: 총 학점, 강의/실습 시간 계산
- **온라인 강좌** 별도 표시
- **Excel 파일** 업로드 지원

### 🎨 사용자 경험
- **반응형 디자인**
- **다크/라이트 모드** 지원
- **과목 상세 정보** 모달
- **충돌 강제 추가** 옵션

## 🚀 시작하기

### 필수 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/hnu-timetable.git
cd hnu-timetable

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **상태 관리**: Zustand
- **스타일링**: Tailwind CSS v4
- **빌드 도구**: Vite 7
- **엑셀 처리**: SheetJS (xlsx)
- **테스팅**: Vitest

## 📁 프로젝트 구조

```
src/
├── components/        # React 컴포넌트
│   ├── CourseList.tsx
│   ├── Timetable.tsx
│   ├── WeeklyTimetable.tsx
│   └── ...
├── data/             # 강좌 데이터
│   └── courses/
│       ├── core.ts           # 교양필수
│       ├── electives.ts      # 교양선택
│       ├── major_required.ts # 전공필수
│       ├── major_elective.ts # 전공선택
│       └── online.ts         # 온라인강좌
├── stores/           # Zustand 스토어
├── types/            # TypeScript 타입 정의
├── utils/            # 유틸리티 함수
│   ├── detectConflict.ts   # 시간 충돌 감지
│   ├── parseTimeSlots.ts   # 시간 파싱
│   └── storage.ts          # 로컬 저장소
└── constants/        # 상수 정의
```

## 🎯 주요 알고리즘

### 시간 충돌 감지
- Union-Find 자료구조를 사용한 전이적 충돌 그룹화
- O(n log n) 시간 복잡도

### 시간 블록 병합
- 같은 그룹(이론/실습)의 연속된 교시를 하나의 블록으로 병합
- 예: 월2,3,4 → 10:00~12:50

### 색상 할당
- 15가지 파스텔 컬러를 순환하여 과목별 색상 자동 할당

## 📝 사용 방법

1. **필터 선택**: 이수구분, 단과대학, 학년 등 원하는 조건 선택
2. **과목 검색**: 키워드로 과목명/교수명/학과 검색
3. **과목 추가**: 리스트에서 원하는 과목 클릭
4. **시간표 확인**: 오른쪽 시간표에서 시각적으로 확인
5. **충돌 처리**: 시간 충돌 시 경고 모달에서 선택
6. **자동 저장**: 브라우저에 자동으로 저장

## 🐛 알려진 이슈

- [ ] 토요일 시간표 지원 미흡
- [ ] 모바일 환경에서 가로 스크롤 최적화 필요
- [ ] Excel 파일 크기 제한 필요

## 🤝 기여하기

버그 리포트, 기능 제안, Pull Request 모두 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.


## 🙏 감사의 말

- 한남대학교 학생들의 피드백
- 에브리타임 UI 디자인 영감
- React, Vite, Tailwind CSS 커뮤니티

## 📬 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 등록해주세요.

---

**⚠️ 주의사항**
- 이 프로젝트는 **비공식** 시간표 조합 도구입니다
- 공식 수강신청 시스템이 아니므로 정확성을 보장하지 않습니다
- 실제 수강신청은 학교 공식 시스템을 이용하세요
