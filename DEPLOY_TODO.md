# 🚀 Vercel 배포 — 집에서 이어서 할 일

> 이 파일은 임시 메모입니다. 5단계 다 끝나면 파일 삭제하고 커밋하세요.

## 회사에서 끝낸 것

- Vercel 프로젝트 생성 (`onyou-repo`)
- 환경변수 9개 등록 (Supabase 4개, VAPID 4개, CRON_SECRET) — `ANTHROPIC_API_KEY`는 아직 안 함
- [package.json](package.json)에 Prisma 빌드 훅 추가 (커밋 `fef2702`)
- [vercel.json](vercel.json) cron 스케줄을 Hobby 플랜에 맞게 조정 (커밋 `875c032`)
- 첫 production 배포 성공 (빌드 1m 10s)

## 집에서 이어서 할 5단계

### 1. 코드 받기

```powershell
cd <집-OnYou-경로>
git pull
npm install
```

### 2. `.env` 파일 만들기 (Vercel CLI로 자동 다운로드)

```powershell
npm i -g vercel
vercel login
vercel link
# 질문 답변: hyungjin1994's projects → onyou-repo
vercel env pull .env
```

### 3. DB 마이그레이션 실행

Supabase 프로젝트 `cxyedzwewgnotgmteeul`는 현재 테이블 0개 상태. 아래 명령으로 [prisma/schema.prisma](prisma/schema.prisma)의 모든 모델을 DB에 반영.

```powershell
npx prisma db push
```

성공 시:
```
🚀  Your database is now in sync with your Prisma schema.
```

### 4. Supabase Auth Redirect URL 등록

Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: Vercel production URL (예: `https://onyou-repo-xxx.vercel.app`)
- **Redirect URLs**에 추가: 같은 도메인 + `/**` (예: `https://onyou-repo-xxx.vercel.app/**`)

이걸 안 하면 회원가입/로그인 후 콜백에서 막힘.

### 5. 실제 사이트 테스트

Vercel production URL 열어서:

- [ ] 회원가입 → 로그인 동작 확인
- [ ] 캘린더, 가계부, 루틴 등 페이지 접속해서 DB 연결 확인
- [ ] AI 기능은 안 됨 (`ANTHROPIC_API_KEY` 미등록 — 예상된 상태)

## 마무리

5단계 다 끝나면:

```powershell
del DEPLOY_TODO.md
git add DEPLOY_TODO.md
git commit -m "chore: remove deploy todo"
git push
```

## 회사망 이슈 주의

회사(Coocon) 네트워크에서는 SSL 가로채기 때문에 `prisma db push`가 실패함 (`self-signed certificate in certificate chain`). 집 네트워크에서는 문제 없음. 만약 집에서도 같은 에러 나면:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED=0
npx prisma db push
```

(임시 우회. 현재 PowerShell 창에서만 적용.)

## 컨텍스트

- Supabase 프로젝트 ID: `cxyedzwewgnotgmteeul`
- Vercel 프로젝트: `hyungjin1994's projects` / `onyou-repo`
- Production branch: `master`
- Vercel Hobby 플랜이라 cron은 하루 1회 제한 (`vercel.json`에서 daily로 조정됨)
