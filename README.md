# JiraLite - 프로젝트 관리 도구

Jira와 유사한 기능을 제공하는 경량 프로젝트 관리 애플리케이션입니다.

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=flat-square&logo=tailwind-css)

## 🚀 주요 기능

### 팀 관리
- 팀 생성/수정/삭제 (Soft Delete)
- 팀 멤버 초대 및 역할 관리 (OWNER, ADMIN, MEMBER)
- 팀 활동 로그

### 프로젝트 관리
- 프로젝트 CRUD
- 프로젝트 즐겨찾기/아카이브
- 커스텀 상태 및 라벨 관리
- WIP(Work In Progress) 제한 설정

### 이슈 관리
- 칸반 보드 (드래그 앤 드롭)
- 이슈 생성/수정/삭제
- 서브태스크 관리
- 댓글 기능
- 우선순위 및 마감일 설정

### AI 기능
- 이슈 요약 자동 생성
- AI 제안
- 자동 라벨 추천
- 중복 이슈 탐지
- 댓글 요약

### 대시보드
- 개인 대시보드
- 프로젝트별 통계
- 이슈 현황 차트

### 알림
- 실시간 알림
- 마감일 알림
- 이슈 할당 알림

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn UI (Radix UI)
- **State Management**: SWR
- **Forms**: React Hook Form + Zod
- **Drag & Drop**: dnd-kit
- **Charts**: Recharts

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password, Google OAuth)
- **API**: Next.js Route Handlers
- **Validation**: Zod

## 📦 설치 및 실행

### 필수 요구사항
- Node.js 18+
- pnpm (권장) 또는 npm

### 설치

# 저장소 클론
git clone https://github.com/iirbdka/litmers-contest-2025.git
cd litmers-contest-2025

# 의존성 설치
pnpm install
# 또는
npm install### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 선택사항### 개발 서버 실행

pnpm dev
# 또는
npm run dev브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 프로덕션 빌드

pnpm build
pnpm start## 🗄 데이터베이스 설정

Supabase 프로젝트 생성 후, `supabase/migrations` 폴더의 SQL 파일들을 순서대로 실행하세요:

1. `20240101000001_create_enums.sql` - Enum 타입 생성
2. `20240101000002_create_tables.sql` - 테이블 생성
3. `20240101000003_create_functions.sql` - 함수 및 트리거 생성
4. `20240101000004_create_rls_policies.sql` - RLS 정책 설정
5. `20240101000005_due_date_notifications.sql` - 마감일 알림 설정

## 📁 프로젝트 구조

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 페이지 (로그인, 회원가입 등)
│   ├── api/               # API Route Handlers
│   ├── dashboard/         # 대시보드
│   ├── projects/          # 프로젝트 페이지
│   ├── teams/             # 팀 페이지
│   ├── issues/            # 이슈 상세 페이지
│   └── settings/          # 설정 페이지
├── components/            # React 컴포넌트
│   ├── ui/               # Shadcn UI 컴포넌트
│   ├── auth/             # 인증 관련 컴포넌트
│   ├── dashboard/        # 대시보드 컴포넌트
│   ├── projects/         # 프로젝트 컴포넌트
│   ├── teams/            # 팀 컴포넌트
│   ├── issues/           # 이슈 컴포넌트
│   └── layout/           # 레이아웃 컴포넌트
├── hooks/                 # Custom React Hooks
├── lib/                   # 유틸리티 및 라이브러리
│   ├── api/              # API 클라이언트
│   └── supabase/         # Supabase 클라이언트
├── src/
│   └── schemas/          # Zod 스키마 정의
├── supabase/
│   └── migrations/       # 데이터베이스 마이그레이션
└── types/                 # TypeScript 타입 정의
```

## 🔐 인증

- **이메일/비밀번호**: 기본 인증 방식
- **Google OAuth**: 소셜 로그인 지원

## 📱 반응형 디자인

모바일, 태블릿, 데스크톱 환경 모두 지원합니다.

## 🚀 배포

### Vercel 배포

1. [Vercel](https://vercel.com)에서 GitHub 레포지토리 연결
2. Environment Variables 설정
3. Deploy 클릭

### Supabase 설정

배포 후 Supabase 대시보드에서:
1. **Authentication** → **URL Configuration**
2. **Site URL**: `https://your-domain.vercel.app`
3. **Redirect URLs**에 `https://your-domain.vercel.app/auth/callback` 추가

## 📄 라이선스

MIT License

## 👥 기여

이슈 및 Pull Request 환영합니다!
```

---

이 내용을 `README.md` 파일로 저장하려면 **Agent 모드**로 전환해주세요.
