# 데스크톱 코드 서명 (Windows / macOS)

ZEFF AI 데스크톱 앱은 `electron-builder`로 빌드합니다(`package.json`의 `build` 필드).
현재 릴리스는 **코드 서명이 되어 있지 않아** 설치 시 Windows SmartScreen("Windows의 PC 보호")과
macOS의 "확인되지 않은 개발자" 경고가 표시됩니다. 이는 정상이며, 서명 인증서를 적용하면 사라집니다.

> ⚠️ 코드 서명에는 **유료 인증서**가 필요합니다(아래). 이 저장소/CI가 자동으로 발급·구매할 수
> 없으므로, 인증서를 확보한 뒤 아래 환경변수를 CI(또는 로컬 빌드 머신)에 설정하면
> `electron-builder`가 빌드 시 자동으로 서명·공증합니다. **인증서·비밀번호는 절대 커밋하지 마세요.**

---

## Windows (Authenticode)

1. 코드 서명 인증서를 발급받습니다.
   - **OV(Organization Validation)**: 저렴하지만 SmartScreen 신뢰(reputation)가 쌓이기 전까지 초기엔 경고가 남을 수 있음.
   - **EV(Extended Validation)**: 즉시 SmartScreen 신뢰를 받음(HSM/USB 토큰 필요, 더 비쌈).
2. 인증서를 `.pfx`(PKCS#12)로 준비하고, 빌드 환경에 다음 환경변수를 설정합니다.

   | 환경변수 | 설명 |
   | --- | --- |
   | `CSC_LINK` | `.pfx` 파일 경로 또는 base64 문자열 |
   | `CSC_KEY_PASSWORD` | `.pfx` 비밀번호 |

3. 빌드: `npm run electron:build:win`
   - `CSC_LINK`가 있으면 `electron-builder`가 설치 파일(NSIS)과 실행 파일을 자동 서명합니다.
   - 환경변수가 없으면 **서명 없이** 빌드됩니다(현재 상태).

> EV 인증서가 하드웨어 토큰(HSM)에 있는 경우 `CSC_LINK` 대신 서명 도구(예: `signtool` + 토큰,
> 또는 Azure Trusted Signing)를 쓰는 커스텀 서명 훅이 필요할 수 있습니다.

---

## macOS (Developer ID + 공증)

1. **Apple Developer Program**($99/년) 가입 후 **Developer ID Application** 인증서를 생성합니다.
2. 빌드 환경에 다음을 설정합니다.

   | 환경변수 | 설명 |
   | --- | --- |
   | `CSC_LINK` | Developer ID 인증서(`.p12`) 경로 또는 base64 |
   | `CSC_KEY_PASSWORD` | `.p12` 비밀번호 |
   | `APPLE_ID` | 공증용 Apple 계정 이메일 |
   | `APPLE_APP_SPECIFIC_PASSWORD` | 앱 암호(App-Specific Password) |
   | `APPLE_TEAM_ID` | 개발자 팀 ID |

3. `package.json`의 `build.mac`에 공증을 켜려면 `"notarize": true`를 추가합니다.
   위 `APPLE_*` 환경변수가 있을 때만 켜세요(없이 켜면 빌드가 실패합니다).
4. 빌드: `npm run electron:build:mac`

---

## 요약

- 인증서가 **없는 지금**: 빌드는 정상 동작하며 산출물은 **미서명**입니다. 사용자에겐 다운로드
  페이지의 "설치 중 보안 경고가 뜨나요?" 안내로 우회 방법을 제공합니다.
- 인증서를 **확보한 뒤**: 위 환경변수만 설정하면 별도 코드 수정 없이 서명·공증된 설치 파일이
  생성되어 경고가 사라집니다.
