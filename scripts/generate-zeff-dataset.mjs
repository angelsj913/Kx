import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT_JSONL = resolve("/workspace/docs/datasets/zeff-ai-training-1000.jsonl");
const OUT_CHAT = resolve("/workspace/docs/datasets/zeff-ai-training-1000.messages.jsonl");
const OUT_RAG = resolve("/workspace/docs/datasets/zeff-ai-rag-source.md");
const OUT_JSONL_10000 = resolve("/workspace/docs/datasets/zeff-ai-training-10000.jsonl");
const OUT_CHAT_10000 = resolve("/workspace/docs/datasets/zeff-ai-training-10000.messages.jsonl");
const OUT_RAG_EXTENDED = resolve("/workspace/docs/datasets/zeff-ai-rag-source-extended.md");

function fact(
  slug,
  subject,
  answer,
  { why = "", action = "", warning = "", status = "", priority = "" } = {},
) {
  return { slug, subject, answer, why, action, warning, status, priority };
}

const categories = [
  {
    id: "product",
    title: "제품 개요",
    facts: [
      fact("official-domain", "ZEFF AI의 공식 도메인", "공식 도메인은 https://zeffai.com 입니다.", {
        why: "브랜드 링크와 배포 설명은 항상 이 주소를 기준으로 맞추는 편이 안전합니다.",
        action: "문서와 버튼 링크도 이 도메인 기준으로 점검하면 됩니다.",
        warning: "테스트 도메인을 공식 주소처럼 안내하면 안 됩니다.",
        priority: "공식 링크 일관성 유지",
      }),
      fact("web-first", "ZEFF AI의 핵심 제공 형태", "핵심은 웹앱이며, 데스크톱과 모바일은 그 웹앱을 여는 얇은 클라이언트입니다.", {
        why: "실제 기능과 데이터 처리는 클라우드 웹 서비스 중심으로 운영됩니다.",
        action: "제품 소개 문구도 웹앱 중심 서비스로 맞추는 것이 좋습니다.",
        warning: "로컬 설치형 독립 AI처럼 설명하면 오해를 부를 수 있습니다.",
        priority: "웹앱 중심 설명 유지",
      }),
      fact("cloud-service", "ZEFF AI의 서비스 구조", "현재 구조는 클라우드 기반 웹 서비스 중심입니다.", {
        why: "클라이언트 패키지 안에 AI 키를 넣지 않는 방향이기 때문입니다.",
        action: "보안 설명에서는 서버 중심 처리 구조를 함께 안내하면 됩니다.",
        warning: "오프라인 완전 독립형으로 과장하면 안 됩니다.",
      }),
      fact("desktop-shell", "Windows 데스크톱 앱의 성격", "Windows 앱은 Electron 기반의 얇은 셸 앱입니다.", {
        why: "실제 서비스는 https://zeffai.com 을 통해 제공됩니다.",
        action: "기능 설명 시 웹앱과 동일한 계정 흐름을 안내하면 됩니다.",
        warning: "네이티브 로컬 AI 엔진처럼 설명하면 안 됩니다.",
      }),
      fact("android-shell", "Android 앱의 성격", "Android 앱은 Capacitor 기반의 얇은 셸 앱입니다.", {
        why: "production에서는 https://zeffai.com/login 경로를 로드합니다.",
        action: "모바일 안내에서는 로그인 진입 경로를 함께 안내하면 좋습니다.",
        warning: "독립 실행형 오프라인 앱처럼 홍보하면 안 됩니다.",
      }),
      fact("user-language", "기본 응답 언어", "기본 응답 언어는 한국어로 유지하는 것이 맞습니다.", {
        why: "현재 사용자 선호와 기존 대화 흐름이 한국어 중심이기 때문입니다.",
        action: "사용자가 언어를 바꾸면 그때 함께 전환하면 됩니다.",
      }),
      fact("cost-sensitive", "의사결정의 기본 기준", "의사결정에서는 비용 민감도를 우선 반영하는 편이 맞습니다.", {
        why: "배포 신뢰와 운영 효율 사이에서 저비용 경로를 선호하기 때문입니다.",
        action: "대안을 제시할 때는 더 싸고 단순한 방법부터 보여주면 됩니다.",
        warning: "고비용 선택지를 기본안처럼 밀어붙이지 않는 것이 좋습니다.",
      }),
      fact("do-not-reargue", "이미 결정된 방향을 다루는 원칙", "이미 결정된 방향은 다시 설득하지 않고 그 안에서 다음 단계를 돕는 방식이 맞습니다.", {
        why: "사용자 선호를 존중하고 진행 속도를 유지할 수 있기 때문입니다.",
        action: "질문이 오면 실행 항목과 체크리스트를 바로 제안하면 됩니다.",
      }),
      fact("login-entry", "공식 로그인 진입점", "클라이언트 셸의 공식 로그인 진입점은 /login 경로입니다.", {
        why: "데스크톱과 모바일 모두 production origin 아래의 로그인 진입을 사용합니다.",
        action: "셸 클라이언트 설명에는 /login 진입을 함께 표기하면 됩니다.",
      }),
      fact("production-live", "현재 운영 상태", "ZEFF AI 웹 서비스는 현재 라이브 상태로 운영 중입니다.", {
        why: "공식 운영 주소는 https://zeffai.com 입니다.",
        action: "배포 점검 시에는 실제 사이트 응답과 주요 로그인 흐름을 먼저 보면 됩니다.",
        status: "웹은 라이브이고, Play Store 공개 링크는 아직 비어 있습니다.",
      }),
    ],
  },
  {
    id: "distribution",
    title: "배포 구조",
    facts: [
      fact("windows-release-url", "Windows 설치 파일 배포 방식", "Windows 설치 파일은 GitHub Releases를 통해 배포하는 흐름입니다.", {
        why: "서명 인증서를 구매하지 않은 상태에서도 릴리스 파일을 배포할 수 있기 때문입니다.",
        action: "릴리스 태그와 다운로드 링크를 함께 관리하면 됩니다.",
        warning: "unsigned .exe에는 신뢰 경고가 따를 수 있습니다.",
      }),
      fact("electron-loads-web", "Electron 앱의 실제 동작", "Electron 앱은 내부에 AI 모델을 품는 대신 공식 웹앱을 로드합니다.", {
        why: "클라이언트에 AI 키를 넣지 않고 서버 중심으로 기능을 운영하려는 구조입니다.",
        action: "설명 문구는 thin client 또는 shell app 기준으로 맞추면 됩니다.",
      }),
      fact("android-package", "Android 패키지 ID", "Android 패키지 ID는 com.zeffai.app 입니다.", {
        action: "Play Console, asset links, 서명 설정에도 같은 ID를 일관되게 써야 합니다.",
        warning: "패키지 ID를 중간에 바꾸면 스토어 연속성이 깨질 수 있습니다.",
      }),
      fact("android-login-url", "Android 앱의 로드 URL", "Android 앱은 production에서 https://zeffai.com/login 을 로드합니다.", {
        why: "모바일 셸 앱도 웹앱 로그인 플로우를 그대로 사용하기 때문입니다.",
        action: "테스트 시에는 로그인, 세션 유지, 외부 링크 이동을 같이 확인하면 됩니다.",
      }),
      fact("play-url-empty", "현재 Play URL 상태", "현재 PLAY_STORE_URL 값은 비어 있어서 공개 스토어 링크가 아직 연결되지 않은 상태입니다.", {
        status: "Play Console 등록과 공개 링크 확정이 남아 있습니다.",
        action: "공개 후에는 상수를 실제 스토어 URL로 교체하면 됩니다.",
      }),
      fact("assetlinks-placeholder", "assetlinks.json 상태", "assetlinks.json은 존재하지만 SHA256 지문은 아직 placeholder 상태입니다.", {
        why: "실제 앱 서명 지문이 준비된 뒤에 교체해야 하기 때문입니다.",
        action: "Play 업로드용 서명값이 확정되면 .well-known 파일을 업데이트하면 됩니다.",
        warning: "placeholder 상태로 autoVerify를 기대하면 안 됩니다.",
      }),
      fact("windows-workflow", "Windows 빌드 워크플로 위치", "Windows 설치 파일용 워크플로는 .github/workflows/build-windows-installer.yml 에 있습니다.", {
        action: "릴리스 자동화를 볼 때는 이 워크플로와 릴리스 태그 규칙을 같이 확인하면 됩니다.",
      }),
      fact("android-ci-template", "Android CI 템플릿 위치", "Android CI 템플릿은 docs/ci/build-android.yml 에 두는 상태입니다.", {
        why: "이전 토큰에 workflow 스코프가 없어 .github/workflows 경로로 직접 푸시하지 못했기 때문입니다.",
        action: "필요하면 GitHub 웹에서 내용을 복사해 실제 workflow 파일로 넣으면 됩니다.",
      }),
      fact("no-client-keys", "클라이언트 패키지의 보안 원칙", "클라이언트 패키지에는 AI 키를 넣지 않는 방향이 맞습니다.", {
        why: "웹, 데스크톱, 모바일 모두 서버 중심으로 보안과 비용 제어를 하려는 구조이기 때문입니다.",
        warning: "클라이언트 번들 안에 비밀값을 넣으면 곧바로 노출 위험이 생깁니다.",
      }),
      fact("main-deploy", "배포 기준 브랜치", "배포 기준 브랜치는 main 입니다.", {
        why: "Vercel이 GitHub의 main 브랜치를 기준으로 배포하는 흐름을 사용하기 때문입니다.",
        action: "프로덕션 반영 전에는 main 기준 변경점과 빌드 상태를 확인하면 됩니다.",
      }),
    ],
  },
  {
    id: "windows",
    title: "Windows 서명과 신뢰",
    facts: [
      fact("signing-cost", "Windows 코드 서명의 비용 구조", "공개 배포용 Windows 코드 서명 인증서는 일반적으로 비용 부담이 큰 편입니다.", {
        why: "신원 검증과 하드웨어 토큰 또는 HSM 요구가 붙기 때문입니다.",
        action: "비용 민감한 경우에는 다른 배포 경로를 먼저 검토하는 편이 좋습니다.",
      }),
      fact("ov-range", "OV 인증서 비용대", "OV 코드 서명 인증서는 대략 연 200달러에서 450달러 수준으로 안내되는 경우가 많습니다.", {
        warning: "리셀러와 시점에 따라 실제 가격은 달라질 수 있습니다.",
      }),
      fact("ev-range", "EV 인증서 비용대", "EV 코드 서명 인증서는 대략 연 250달러에서 700달러 이상으로 형성되는 경우가 많습니다.", {
        warning: "가격은 공급사와 정책 변화에 따라 달라질 수 있습니다.",
        why: "EV가 더 강한 신원 검증 절차를 요구하는 경우가 많기 때문입니다.",
      }),
      fact("hsm-required", "하드웨어 토큰 요구", "최근에는 코드 서명에서 하드웨어 토큰이나 HSM 요구가 사실상 표준처럼 붙습니다.", {
        why: "키 유출 위험을 줄이려는 업계 정책 변화가 반영된 결과입니다.",
        warning: "단순 파일형 인증서만으로 끝난다고 기대하면 안 됩니다.",
      }),
      fact("azure-artifact", "상대적으로 저렴한 대안", "Azure Artifact Signing은 월 단위 과금으로 보일 수 있어 전통적 연간 인증서보다 저렴하게 느껴질 수 있습니다.", {
        warning: "지역 제한이나 계정 조건을 반드시 확인해야 합니다.",
        action: "자격이 맞는지 먼저 확인한 뒤 비교하면 됩니다.",
      }),
      fact("store-path", "Microsoft Store 경로의 장점", "Microsoft Store 경로는 별도 공인 코드 서명 인증서 구매 없이 신뢰 배포를 노릴 수 있는 대안입니다.", {
        why: "스토어 제출 시 Microsoft 쪽 재서명과 신뢰 경로를 활용할 수 있기 때문입니다.",
        action: "MSIX 패키징과 스토어 제출 절차를 함께 준비해야 합니다.",
      }),
      fact("unsigned-warning", "unsigned .exe의 한계", "공개 배포용 unsigned .exe는 SmartScreen 경고를 피하기 어렵습니다.", {
        warning: "서명 없이 경고를 없앨 수 있다고 말하면 안 됩니다.",
        action: "이 제약을 전제로 다운로드 경로를 안내해야 합니다.",
      }),
      fact("skip-ev-for-smartscreen", "EV 구매 판단 기준", "SmartScreen만을 이유로 EV를 기본 추천하는 것은 현재 기준으로 효율이 낮을 수 있습니다.", {
        why: "예전처럼 즉시 우회 효과를 보장한다고 보기 어렵기 때문입니다.",
        priority: "비용 대비 효과 검토",
      }),
      fact("annual-prepaid", "전통적 인증서 결제 방식", "전통적 코드 서명 인증서는 보통 연 단위 선결제 구조입니다.", {
        why: "구독형이 아니라 연간 발급 및 검증 모델을 따르는 경우가 많기 때문입니다.",
      }),
      fact("msix-option", "Windows 대체 배포안", "Windows에서는 MSIX와 Microsoft Store가 신뢰 배포 측면의 대체안이 될 수 있습니다.", {
        action: "필요하면 나중에 PC 경로는 MSIX, 모바일은 Play로 병행하는 전략을 검토하면 됩니다.",
        priority: "현재는 Android Play 우선",
      }),
    ],
  },
  {
    id: "playstore",
    title: "Google Play",
    facts: [
      fact("play-fee", "Play 개발자 등록 비용", "Google Play 개발자 등록은 일반적으로 25달러 1회 비용입니다.", {
        why: "Windows 공인 코드 서명처럼 매년 인증서를 갱신하는 구조와는 다릅니다.",
      }),
      fact("individual-org", "Play 계정 유형 선택", "사업자 등록이 확실하면 조직 계정이 좋고, 그렇지 않으면 개인 계정으로 시작하는 편이 현실적입니다.", {
        action: "법인 자료와 공개 운영 형태를 기준으로 결정하면 됩니다.",
      }),
      fact("duns", "D-U-N-S 번호의 맥락", "D-U-N-S는 보통 조직 계정이나 기업 신원 확인 맥락에서 중요해질 수 있습니다.", {
        warning: "개인 계정에 항상 필수라고 단정하면 안 됩니다.",
      }),
      fact("upload-keystore", "업로드 키스토어의 역할", "Play 배포에서는 업로드 키스토어를 안전하게 관리하는 것이 중요합니다.", {
        why: "업로드 키와 최종 배포 키 관리를 분리할 수 있기 때문입니다.",
        action: "키스토어 파일과 비밀번호를 안전한 비밀 저장소에 보관하면 됩니다.",
      }),
      fact("play-app-signing", "Play App Signing", "Play App Signing은 일반적으로 무료로 사용할 수 있습니다.", {
        why: "최종 서명 키 관리를 Google 쪽에 맡길 수 있어 운영 부담을 줄일 수 있습니다.",
      }),
      fact("aab-required", "Play 업로드 형식", "Play 제출은 AAB 형식을 기준으로 준비하는 편이 맞습니다.", {
        action: "릴리스 빌드 결과가 app-release.aab 로 나오는지 확인하면 됩니다.",
      }),
      fact("privacy-url", "개인정보처리방침 링크", "Play 제출 시 개인정보처리방침 URL은 https://zeffai.com/support/legal#privacy 를 기준으로 사용할 수 있습니다.", {
        action: "스토어 등록정보와 앱 내 법률 링크도 같은 주소로 맞추면 됩니다.",
      }),
      fact("internal-test-first", "권장 배포 순서", "처음에는 프로덕션보다 내부 테스트 트랙부터 올리는 편이 안전합니다.", {
        why: "설치, 로그인, 결제 안내, 외부 링크 흐름을 먼저 검증할 수 있기 때문입니다.",
      }),
      fact("listing-assets", "스토어 등록 정보 준비물", "Play 제출에는 설명문, 스크린샷, 앱 아이콘 같은 스토어 자산이 필요합니다.", {
        action: "폰 스크린샷과 512x512 아이콘을 우선 준비하면 됩니다.",
      }),
      fact("set-play-url-after-live", "공개 후 해야 할 연결 작업", "스토어 공개 후에는 PLAY_STORE_URL 상수를 실제 링크로 채워야 합니다.", {
        action: "랜딩 페이지 Android CTA가 스토어로 연결되는지 함께 점검하면 됩니다.",
        status: "현재는 아직 비어 있는 상태입니다.",
      }),
    ],
  },
  {
    id: "tech",
    title: "기술 스택",
    facts: [
      fact("next-version", "Next.js 버전", "현재 웹 스택의 주요 프레임워크는 Next.js 16.2.10 입니다.", {
        warning: "이 버전은 익숙한 예전 Next.js와 다를 수 있어 관련 가이드를 먼저 확인하는 편이 안전합니다.",
      }),
      fact("react-version", "React 버전", "React 19를 사용합니다."),
      fact("tailwind-version", "Tailwind 버전", "Tailwind CSS 4를 사용합니다."),
      fact("next-auth", "인증 라이브러리", "인증은 next-auth v5 beta 기준으로 구성되어 있습니다.", {
        warning: "베타 계열 API와 설정 차이를 염두에 두는 편이 좋습니다.",
      }),
      fact("prisma-version", "Prisma 버전", "DB 레이어는 Prisma 7.8 기준입니다.", {
        why: "빌드 스크립트와 CLI 옵션 호환성도 이 버전에 맞춰야 합니다.",
      }),
      fact("neon-postgres", "데이터베이스", "DB는 Neon Postgres와 Prisma 조합을 사용합니다."),
      fact("vercel-hosting", "호스팅", "웹 서비스 호스팅은 Vercel 기준으로 운영합니다."),
      fact("electron-builder", "Windows 패키징", "Windows 데스크톱 빌드는 Electron과 electron-builder 조합을 사용합니다.", {
        action: "설치 파일 이름과 NSIS 설정도 이 흐름에서 관리하면 됩니다.",
      }),
      fact("capacitor-version", "모바일 셸 프레임워크", "Android 셸은 Capacitor 8 기반입니다."),
      fact("prisma-output", "Prisma client 출력 경로", "Prisma client 출력 경로는 기본 node_modules가 아니라 src/generated/prisma 입니다.", {
        warning: "기본 경로를 전제로 한 설명을 그대로 적용하면 안 됩니다.",
      }),
    ],
  },
  {
    id: "build",
    title: "빌드와 배포",
    facts: [
      fact("postinstall-generate", "postinstall 스크립트", "postinstall 단계에서는 prisma generate 가 중요합니다.", {
        why: "Vercel 배포 환경에서도 Prisma client를 안정적으로 생성하기 위해 필요합니다.",
      }),
      fact("build-script", "현재 build 스크립트", "현재 build 스크립트는 prisma generate && prisma db push && next build 형태를 유지하는 편이 맞습니다.", {
        action: "배포 설정과 package.json 스크립트가 이 흐름과 일치하는지 확인하면 됩니다.",
      }),
      fact("skip-generate-removed", "제거된 Prisma 옵션", "Prisma 7.8에서는 prisma db push --skip-generate 옵션을 사용하면 안 됩니다.", {
        why: "해당 옵션이 제거되어 바로 빌드 실패로 이어질 수 있기 때문입니다.",
        warning: "이 플래그를 다시 제안하면 안 됩니다.",
      }),
      fact("vercel-failure-cause", "최근 Vercel 실패 원인", "최근 Vercel 빌드 실패 원인은 제거된 Prisma CLI 옵션 사용이었습니다.", {
        action: "비슷한 오류가 나면 build 스크립트와 Prisma 버전부터 먼저 확인하면 됩니다.",
      }),
      fact("workflow-scope", "workflow 스코프 이슈", "이전 GitHub 토큰에는 workflow 스코프가 없어 workflows 경로 직접 푸시에 제한이 있었습니다.", {
        action: "필요하면 GitHub 웹에서 새 workflow 파일을 직접 추가하면 됩니다.",
      }),
      fact("android-ci-location", "Android CI 원본 파일 위치", "Android AAB 빌드용 CI 원본은 docs/ci/build-android.yml 에 있습니다."),
      fact("signed-aab", "Play 제출용 AAB 조건", "Play 업로드용 AAB는 서명된 릴리스 번들을 준비하는 편이 맞습니다.", {
        why: "Play App Signing을 쓰더라도 업로드 키 기준 서명은 필요하기 때문입니다.",
      }),
      fact("landing-scale-config", "스케일 조정 파일", "랜딩 배율 조정은 src/lib/landingScale.ts 중심으로 관리하면 됩니다.", {
        action: "수치 조정은 이 파일만 손보는 식으로 단순화하는 편이 좋습니다.",
      }),
      fact("check-main-before-deploy", "프로덕션 반영 전 확인", "프로덕션 반영 전에는 main 기준 최신 커밋과 배포 로그를 먼저 확인하는 것이 좋습니다.", {
        action: "특히 package.json, Prisma, 환경변수 관련 변경을 우선 점검하면 됩니다.",
      }),
      fact("no-secret-leak", "배포 보안 원칙", "배포 과정에서는 키와 비밀번호 같은 비밀값을 로그나 저장소에 노출하지 않는 것이 중요합니다.", {
        warning: "토큰이 노출되었으면 즉시 폐기하고 재발급하는 편이 안전합니다.",
      }),
    ],
  },
  {
    id: "ui",
    title: "홈페이지 스케일링",
    facts: [
      fact("large-monitor-issue", "큰 모니터에서의 문제", "큰 모니터에서 홈페이지가 너무 작아 보이는 문제를 스케일 조정으로 보완한 상태입니다.", {
        why: "rem 기반으로 전체 비율을 키워 한꺼번에 대응하는 방식이기 때문입니다.",
      }),
      fact("mobile-fixed", "모바일 스케일 기본값", "모바일 구간은 기본적으로 고정 스케일 1을 유지합니다."),
      fact("tablet-fixed", "태블릿 스케일 기본값", "태블릿 구간도 기본적으로 고정 스케일 1을 유지합니다."),
      fact("desktop-scale", "데스크톱 스케일 방식", "데스크톱 구간은 화면 너비를 기준으로 점진적으로 확대하는 방식입니다.", {
        why: "큰 화면에서도 UI가 지나치게 작아 보이지 않도록 하기 위한 조정입니다.",
      }),
      fact("desktop-base-width", "데스크톱 기준 폭", "데스크톱 스케일 계산의 기준 폭은 1536 근처를 사용합니다."),
      fact("desktop-max", "데스크톱 최대 배율", "현재 데스크톱 최대 배율 상한은 1.55 입니다.", {
        warning: "너무 높이면 일부 레이아웃이 과하게 커질 수 있습니다.",
      }),
      fact("viewport-component", "배율 적용 컴포넌트", "배율 적용은 LandingViewportScale 컴포넌트를 통해 처리합니다."),
      fact("page-wrapper", "홈페이지 적용 위치", "홈페이지에서는 page.tsx 에서 LandingViewportScale로 랜딩을 감싸는 구조입니다."),
      fact("separate-ratios", "모바일과 데스크톱 분리 원칙", "모바일과 데스크톱 비율을 분리해서 조정하는 것이 현재 방향에 맞습니다.", {
        why: "같은 규칙을 모든 화면에 적용하면 작은 화면과 큰 화면의 만족도가 동시에 떨어질 수 있기 때문입니다.",
      }),
      fact("edit-one-file", "주요 조정 포인트", "배율 튜닝은 우선 src/lib/landingScale.ts 한 곳에서 조정하는 것이 가장 단순합니다.", {
        action: "강하게 키우고 싶으면 desktop max와 기준 폭을 함께 만지면 됩니다.",
      }),
    ],
  },
  {
    id: "ai",
    title: "AI 제공자와 동작",
    facts: [
      fact("provider-count", "지원하는 AI 제공자 수", "코드상 지원하는 AI 제공자 키 종류는 6개입니다.", {
        why: "Gemini, Groq, Cerebras, Mistral, OpenRouter, DeepSeek를 기준으로 합니다.",
      }),
      fact("gemini-multimodal", "Gemini의 역할", "Gemini는 텍스트뿐 아니라 이미지와 오디오 같은 멀티모달 처리에도 중요합니다.", {
        why: "현재 구현에서 파일 첨부 분석과 임베딩 폴백 전 상위 경로에 사용되기 때문입니다.",
      }),
      fact("groq-role", "Groq의 역할", "Groq는 현재 이 프로젝트에서 빠른 추론 제공자 중 하나로 쓰입니다.", {
        warning: "학습 플랫폼처럼 설명하지 않는 편이 맞습니다.",
      }),
      fact("openrouter-role", "OpenRouter의 역할", "OpenRouter는 모델 그 자체라기보다 여러 모델을 연결하는 라우팅 계층에 가깝습니다."),
      fact("deepseek-role", "DeepSeek의 위치", "DeepSeek는 초저가 추론 축으로 설명하는 편이 맞습니다."),
      fact("provider-fallback", "다중 제공자 폴백", "현재 AI 호출은 여러 제공자를 후보로 두고 폴백하는 구조를 사용합니다.", {
        why: "한 제공자 실패 시 다른 후보로 넘어가 가용성을 높이기 위해서입니다.",
      }),
      fact("available-keys-filter", "키 기반 후보 필터링", "실제 호출 전에는 설정된 키가 있는 제공자만 후보로 남기는 필터링을 합니다.", {
        why: "없는 키를 가진 제공자를 먼저 때리지 않기 위한 구조입니다.",
      }),
      fact("multimodal-needs-gemini", "멀티모달 입력 조건", "현재 구현 기준으로 이미지나 오디오 분석에는 GEMINI_API_KEY가 특히 중요합니다.", {
        warning: "Gemini 키 없이 첨부 분석이 바로 된다고 말하면 안 됩니다.",
      }),
      fact("embedding-fallback", "임베딩 폴백", "임베딩은 GEMINI_API_KEY가 있으면 Gemini를 쓰고 없으면 로컬 임베딩으로 폴백합니다.", {
        why: "키가 없어도 기본 검색이 아예 막히지 않도록 하기 위한 설계입니다.",
      }),
      fact("korean-answer-style", "AI 응답 스타일 원칙", "현재 방향에서는 한국어로 간결하고 실무적으로 답하는 스타일이 맞습니다.", {
        action: "결론 먼저, 이유는 짧은 목록으로 덧붙이는 형태가 적합합니다.",
      }),
    ],
  },
  {
    id: "rag",
    title: "RAG와 데이터 활용",
    facts: [
      fact("library-extracted-text", "문서 원문 저장 위치", "서재 문서의 분석 텍스트는 LibraryItem.extractedText 에 저장됩니다.", {
        why: "이 텍스트를 바탕으로 색인과 문서 기반 대화를 이어갈 수 있기 때문입니다.",
      }),
      fact("document-chunk", "색인 저장 구조", "색인된 조각은 DocumentChunk 테이블에 청크와 임베딩 형태로 저장됩니다."),
      fact("chunking", "청킹 방식", "청킹은 겹침이 있는 텍스트 분할 방식으로 문단과 문장 경계를 최대한 살리도록 되어 있습니다."),
      fact("index-api", "색인 API 입력", "색인 API는 libraryItemId 를 받아 해당 문서의 extractedText 를 청킹하고 임베딩합니다."),
      fact("search-topk", "검색 상위 개수", "검색에서는 상위 관련 청크를 뽑아 컨텍스트로 묶어 답변에 사용합니다.", {
        why: "관련성이 높은 근거만 모델에 넣어 응답 정확도를 높이기 위한 구조입니다.",
      }),
      fact("local-embedding", "키 없는 검색 동작", "GEMINI_API_KEY가 없어도 로컬 임베딩으로 기본 검색은 동작합니다.", {
        warning: "품질은 외부 임베딩 대비 달라질 수 있습니다.",
      }),
      fact("source-citation", "근거 표기 원칙", "RAG 답변은 [1], [2] 같은 근거 번호를 붙여 설명하는 방식이 적합합니다.", {
        why: "문서 기반 응답의 신뢰성과 추적 가능성을 높일 수 있기 때문입니다.",
      }),
      fact("context-only", "보수적 답변 원칙", "문서에 없는 내용은 없다고 말하는 보수적 응답 원칙이 중요합니다.", {
        warning: "컨텍스트 밖 내용을 지어내면 안 됩니다.",
      }),
      fact("grok-as-docs", "grok 대화 활용법", "grok 대화 데이터는 모델 재학습보다 문서로 정리해 RAG에 넣는 방식이 가장 현실적입니다.", {
        why: "현재 레포에 이미 색인과 검색 흐름이 있어서 빠르게 붙일 수 있기 때문입니다.",
      }),
      fact("split-by-topic", "문서 분할 전략", "대화 로그는 한 파일로 몰기보다 주제별 문서로 나누는 편이 검색 품질이 더 좋습니다.", {
        action: "브랜드 톤, 제품 결정, 배포 정책, 비용 선호처럼 문서군을 나누면 됩니다.",
      }),
    ],
  },
  {
    id: "policy",
    title: "응답 정책과 말투",
    facts: [
      fact("ko-default", "기본 응답 언어 정책", "기본 응답 언어는 한국어로 유지하는 편이 맞습니다.", {
        action: "사용자가 영어 등 다른 언어로 바꾸면 그때 전환하면 됩니다.",
      }),
      fact("official-url-policy", "브랜드 URL 정책", "공식 브랜드 URL은 항상 https://zeffai.com 기준으로 설명해야 합니다."),
      fact("shell-policy", "제품 설명 정책", "데스크톱과 모바일은 웹앱을 여는 셸이라는 점을 분명히 설명하는 것이 맞습니다."),
      fact("low-cost-first", "비용 우선 정책", "대안을 제시할 때는 더 싸고 단순한 방법을 먼저 보여주는 것이 좋습니다.", {
        why: "현재 사용자 선호가 비용 민감도 우선이기 때문입니다.",
      }),
      fact("no-overclaim", "과장 금지 정책", "없는 기능을 이미 구현된 것처럼 말하지 않는 것이 중요합니다.", {
        warning: "배포 완료 전 기능을 공개 완료처럼 말하면 신뢰를 해칠 수 있습니다.",
      }),
      fact("no-smartscreen-claim", "SmartScreen 관련 금지 문구", "unsigned .exe가 SmartScreen 경고 없이 설치된다고 말하면 안 됩니다."),
      fact("no-prisma-flag", "Prisma 금지 제안", "제거된 prisma db push --skip-generate 플래그를 다시 제안하면 안 됩니다."),
      fact("no-fake-play-live", "Play 출시 상태 설명 원칙", "Play 등록이 끝나지 않았다면 공개 배포 완료처럼 설명하면 안 됩니다."),
      fact("no-secret-request", "보안 답변 원칙", "민감한 키나 비밀번호를 평문으로 요구하거나 출력하지 않는 것이 중요합니다."),
      fact("concise-practical-tone", "말투 원칙", "답변은 짧고 실무적이며 협업형 톤으로 유지하는 편이 좋습니다.", {
        action: "결론부터 말하고, 필요한 경우 이유를 2~4개 정도로 짧게 붙이면 됩니다.",
      }),
    ],
  },
];

const patterns = [
  {
    id: "explain",
    instruction: (fact) => `${fact.subject} 설명해줘.`,
    output: (fact) => joinSentences(fact.answer, fact.why),
  },
  {
    id: "one-line",
    instruction: (fact) => `${fact.subject} 한 줄로 말해줘.`,
    output: (fact) => fact.answer,
  },
  {
    id: "beginner",
    instruction: (fact) => `${fact.subject} 초보자도 이해하게 쉽게 설명해줘.`,
    output: (fact) =>
      joinSentences(
        fact.answer,
        fact.why || "처음 볼 때는 핵심 구조만 이해하면 충분합니다.",
        fact.action ? `실행은 ${fact.action}` : "",
      ),
  },
  {
    id: "decision",
    instruction: (fact) => `${fact.subject} 관련해서 어떤 판단 기준으로 보면 돼?`,
    output: (fact) =>
      joinSentences(
        fact.answer,
        fact.priority ? `판단 기준은 ${fact.priority}입니다.` : "",
        fact.warning ? `주의할 점은 ${fact.warning}` : "",
      ),
  },
  {
    id: "action",
    instruction: (fact) => `${fact.subject} 기준으로 다음에 뭘 하면 돼?`,
    output: (fact) =>
      joinSentences(
        fact.answer,
        fact.action ? `다음 단계는 ${fact.action}` : "다음 단계는 현재 상태를 기준으로 필요한 연결 작업을 점검하는 것입니다.",
      ),
  },
  {
    id: "caution",
    instruction: (fact) => `${fact.subject}에서 주의할 점만 짧게 알려줘.`,
    output: (fact) =>
      joinSentences(
        fact.answer,
        fact.warning ? `주의할 점은 ${fact.warning}` : "과장하거나 확정되지 않은 내용을 단정하지 않는 것이 중요합니다.",
      ),
  },
  {
    id: "status",
    instruction: (fact) => `${fact.subject} 현재 상태를 알려줘.`,
    output: (fact) =>
      joinSentences(
        fact.answer,
        fact.status ? `현재 상태는 ${fact.status}` : "현재 상태는 이 기준을 유지하는 방향으로 이해하면 됩니다.",
      ),
  },
  {
    id: "practical",
    instruction: (fact) => `${fact.subject} 실무적으로는 어떻게 설명하는 게 좋아?`,
    output: (fact) =>
      joinSentences(
        fact.answer,
        fact.why || "실무 설명에서는 범위를 좁혀서 말하는 편이 좋습니다.",
        fact.warning ? `오해 방지를 위해 ${fact.warning}` : "",
      ),
  },
  {
    id: "misunderstanding",
    instruction: (fact) => `${fact.subject} 관련해서 사람들이 오해하기 쉬운 점은 뭐야?`,
    output: (fact) =>
      joinSentences(
        fact.answer,
        fact.warning ? `오해하기 쉬운 점은 ${fact.warning}` : "과장된 기대를 붙여 설명하는 것이 흔한 오해 포인트입니다.",
      ),
  },
  {
    id: "priority",
    instruction: (fact) => `${fact.subject} 우선순위 관점에서 정리해줘.`,
    output: (fact) =>
      joinSentences(
        fact.answer,
        fact.priority ? `우선순위는 ${fact.priority}입니다.` : "",
        fact.action ? `실행은 ${fact.action}` : "",
      ),
  },
];

const queryFrames = [
  {
    id: "plain",
    wrap: (instruction) => instruction,
  },
  {
    id: "current",
    wrap: (instruction) => `현재 기준으로 ${instruction}`,
  },
  {
    id: "practical",
    wrap: (instruction) => `실무적으로 ${instruction}`,
  },
  {
    id: "ops",
    wrap: (instruction) => `운영 관점에서 ${instruction}`,
  },
  {
    id: "cost",
    wrap: (instruction) => `비용 관점도 반영해서 ${instruction}`,
  },
  {
    id: "product",
    wrap: (instruction) => `ZEFF AI 제품 문맥에서 ${instruction}`,
  },
  {
    id: "handoff",
    wrap: (instruction) => `handoff 문서를 기준으로 ${instruction}`,
  },
  {
    id: "playstore",
    wrap: (instruction) => `Play Store 준비 흐름까지 고려해서 ${instruction}`,
  },
  {
    id: "caution",
    wrap: (instruction) => `오해하지 않게 ${instruction}`,
  },
  {
    id: "next-step",
    wrap: (instruction) => `${instruction} 그리고 바로 다음 단계도 알려줘.`,
  },
];

const handoffNarrative = [
  "## Chat Handoff 요약",
  "- ZEFF AI는 https://zeffai.com 중심의 개인 AI 워크스페이스 웹앱입니다.",
  "- Windows와 Android 앱은 독립 AI 프로그램이 아니라 웹앱을 여는 thin client 입니다.",
  "- Windows 배포는 GitHub Releases의 unsigned installer 흐름을 유지합니다.",
  "- Windows SmartScreen 경고는 정식 서명이나 Store 경로 없이 제거할 수 없습니다.",
  "- 사용자는 비용 민감도를 우선했고, Windows 코드 서명 구매보다 Android + Play Store 경로를 선택했습니다.",
  "- Android 패키지 ID는 com.zeffai.app 이고, production 진입 URL은 https://zeffai.com/login 입니다.",
  "- Play Console 등록, 업로드 키스토어, workflow 복사, signed AAB, 실제 PLAY_STORE_URL 반영은 아직 남은 과업입니다.",
  "- homepage는 큰 모니터에서 너무 작게 보이던 문제를 landing scale 설정으로 완화했습니다.",
  "- mobile, tablet, desktop 스케일은 별도로 분리되어 있습니다.",
  "- Prisma 7.8 환경에서는 prisma db push --skip-generate 를 쓰면 안 되고, build는 prisma generate && prisma db push && next build 형태를 유지해야 합니다.",
  "",
  "## 이전 대화 핵심 의사결정",
  "- 고비용 Windows OV/EV 인증서 구매는 현재 기본안이 아닙니다.",
  "- 배포 신뢰를 가장 싸게 가져가려면 Android Play Store가 우선안입니다.",
  "- Microsoft Store MSIX는 추후 Windows 신뢰 배포안으로만 보류합니다.",
  "- 이미 결정된 방향은 다시 설득하지 않고 다음 실행 단계로 이어가는 것이 답변 원칙입니다.",
  "- 기본 응답 언어는 한국어입니다.",
  "",
  "## Play Store 제출 실무 메모",
  "- Play 개발자 등록은 일반적으로 25달러 1회 비용입니다.",
  "- 업로드 형식은 AAB 기준으로 준비합니다.",
  "- 업로드 키스토어는 분실하지 않도록 안전하게 보관합니다.",
  "- Play App Signing은 무료이며 최종 배포 키 관리를 Google에 맡길 수 있습니다.",
  "- 공개 전에는 내부 테스트 트랙으로 먼저 설치와 로그인 흐름을 점검하는 편이 좋습니다.",
  "- 개인정보처리방침 링크는 https://zeffai.com/support/legal#privacy 를 기준으로 씁니다.",
  "- 공개 후에는 PLAY_STORE_URL 상수를 실제 스토어 링크로 바꾸고 랜딩 버튼을 연결합니다.",
  "- assetlinks.json 의 SHA256 placeholder는 실제 서명 지문으로 교체해야 합니다.",
  "",
  "## 답변 정책 메모",
  "- ZEFF AI는 웹앱 중심 서비스로 설명합니다.",
  "- 데스크톱과 모바일은 shell app 이라고 설명합니다.",
  "- Groq는 추론 제공자로 설명하고, 학습 플랫폼처럼 단정하지 않습니다.",
  "- SmartScreen 경고를 서명 없이 숨길 수 있다고 말하지 않습니다.",
  "- 없는 기능을 구현 완료처럼 말하지 않습니다.",
  "- 사용자가 비용을 중요하게 볼 때는 더 저렴하고 단순한 경로부터 제안합니다.",
];

function joinSentences(...parts) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
}

const records = [];
const ragSections = [];

for (const category of categories) {
  ragSections.push(`## ${category.title}`);
  for (const fact of category.facts) {
    ragSections.push(`### ${fact.subject}`);
    ragSections.push(`- 핵심: ${fact.answer}`);
    if (fact.why) ragSections.push(`- 이유: ${fact.why}`);
    if (fact.action) ragSections.push(`- 실행: ${fact.action}`);
    if (fact.warning) ragSections.push(`- 주의: ${fact.warning}`);
    if (fact.status) ragSections.push(`- 상태: ${fact.status}`);
    if (fact.priority) ragSections.push(`- 우선순위: ${fact.priority}`);
    ragSections.push("");

    for (const pattern of patterns) {
      records.push({
        id: `${category.id}-${fact.slug}-${pattern.id}`,
        language: "ko",
        category: category.id,
        tags: [category.id, fact.slug, pattern.id],
        instruction: pattern.instruction(fact),
        output: pattern.output(fact),
      });
    }
  }
}

if (records.length !== 1000) {
  throw new Error(`Expected 1000 records but got ${records.length}`);
}

const records10000 = [];
for (const row of records) {
  for (const frame of queryFrames) {
    records10000.push({
      id: `${row.id}-${frame.id}`,
      language: row.language,
      category: row.category,
      tags: [...row.tags, frame.id],
      instruction: frame.wrap(row.instruction),
      output: row.output,
    });
  }
}

if (records10000.length !== 10000) {
  throw new Error(`Expected 10000 records but got ${records10000.length}`);
}

mkdirSync(dirname(OUT_JSONL), { recursive: true });

writeFileSync(OUT_JSONL, `${records.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");

const chatRows = records.map((row) => ({
  id: row.id,
  messages: [
    {
      role: "system",
      content:
        "당신은 ZEFF AI 운영 문맥을 따르는 한국어 도우미입니다. 공식 도메인은 https://zeffai.com 이며, 비용 효율과 실무적 정확성을 우선합니다.",
    },
    { role: "user", content: row.instruction },
    { role: "assistant", content: row.output },
  ],
}));

writeFileSync(OUT_CHAT, `${chatRows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");

writeFileSync(OUT_JSONL_10000, `${records10000.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");

const chatRows10000 = records10000.map((row) => ({
  id: row.id,
  messages: [
    {
      role: "system",
      content:
        "당신은 ZEFF AI 운영 문맥을 따르는 한국어 도우미입니다. 공식 도메인은 https://zeffai.com 이며, 비용 효율과 실무적 정확성을 우선합니다. 데스크톱과 모바일은 웹앱을 여는 셸 앱으로 설명하고, 확인되지 않은 내용은 단정하지 않습니다.",
    },
    { role: "user", content: row.instruction },
    { role: "assistant", content: row.output },
  ],
}));

writeFileSync(OUT_CHAT_10000, `${chatRows10000.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");

const ragDoc = [
  "# ZEFF AI RAG Source",
  "",
  "이 문서는 ZEFF AI 운영 문맥, 정책, 배포 원칙, 기술 스택, RAG 활용 가이드를 한곳에 모은 지식 원문입니다.",
  "현재 레포의 RAG 흐름에 바로 넣어 검색 기반 답변 자료로 쓸 수 있습니다.",
  "",
  ...ragSections,
].join("\n");

writeFileSync(OUT_RAG, `${ragDoc}\n`, "utf8");

const extendedRagDoc = [
  "# ZEFF AI RAG Source Extended",
  "",
  "이 문서는 기존 RAG 원문에 handoff 문서 핵심, 대화 의사결정, Play Store 실무 메모를 더한 확장본입니다.",
  "대화형 문맥과 운영 규칙을 함께 검색하도록 만들 때 이 파일을 우선 쓰면 됩니다.",
  "",
  ...handoffNarrative,
  "",
  ...ragSections,
].join("\n");

writeFileSync(OUT_RAG_EXTENDED, `${extendedRagDoc}\n`, "utf8");

console.log(`generated records: ${records.length}`);
console.log(`jsonl: ${OUT_JSONL}`);
console.log(`chat: ${OUT_CHAT}`);
console.log(`rag: ${OUT_RAG}`);
console.log(`generated records extended: ${records10000.length}`);
console.log(`jsonl extended: ${OUT_JSONL_10000}`);
console.log(`chat extended: ${OUT_CHAT_10000}`);
console.log(`rag extended: ${OUT_RAG_EXTENDED}`);
