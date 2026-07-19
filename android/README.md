# ZEFF AI — Android (Capacitor) 프로젝트

이 폴더는 **Android Studio에서 바로 열 수 있는** 네이티브 Android 프로젝트입니다.
ZEFF AI 안드로이드 앱은 서버/AI 키를 앱에 넣지 않는 **얇은 클라이언트(thin client)** 로,
`https://zeffai.com/login` 웹 워크스페이스를 WebView로 로드합니다(데스크톱 Electron과 동일 전략).
설정은 저장소 루트의 [`capacitor.config.ts`](../capacitor.config.ts)에서 관리됩니다.

---

## 1. 사전 준비

- **Android Studio** (Hedgehog 이상 권장)
- **JDK 17** (Android Studio 내장 JDK 사용 가능)
- **Node.js 18+** & 저장소 루트에서 `npm install` 완료
- Android SDK / Platform-Tools (Android Studio 최초 실행 시 자동 설치)

---

## 2. 웹 자산 동기화 (Android Studio에서 열기 전에)

저장소 **루트**에서 실행합니다. 웹 자산·플러그인·네이티브 설정을 이 `android/` 프로젝트에 반영합니다.

```bash
# 루트 디렉터리에서
npm install            # 최초 1회
npx cap sync android   # 웹 자산 + 플러그인 + capacitor.config 동기화
```

> `capacitor.config.ts`(appId, server.url, 스플래시/상태바, allowNavigation 등)를 바꾼
> 뒤에는 반드시 `npx cap sync android` 를 다시 실행해야 네이티브 쪽에 적용됩니다.

---

## 3. Android Studio에서 열기

1. Android Studio 실행 → **File ▸ Open…**
2. 이 저장소의 **`android/`** 폴더를 선택해 엽니다. (루트가 아니라 `android/` 폴더입니다.)
3. 첫 실행 시 **Gradle sync** 가 자동으로 돕니다. (인터넷 필요 — 의존성 다운로드)
   - 수동 실행: 툴바의 코끼리 아이콘(**Sync Project with Gradle Files**).
4. 상단 기기 선택기에서 **에뮬레이터** 또는 **USB 디버깅이 켜진 실기기**를 선택합니다.
5. **Run ▸ Run 'app'** (▶) 로 실행합니다.

> 명령줄 대안: 루트에서 `npx cap open android` 를 실행하면 Android Studio가 이 프로젝트로 바로 열립니다.

---

## 4. 릴리스 빌드 (APK / AAB)

Play 스토어 배포는 **AAB(Android App Bundle)**, 사이드로드 테스트는 **APK** 를 사용합니다.

- **Android Studio GUI**
  - APK: **Build ▸ Build Bundle(s) / APK(s) ▸ Build APK(s)**
  - AAB: **Build ▸ Generate Signed Bundle / APK…** ▸ *Android App Bundle*
  - 서명 키(keystore)를 만들거나 선택하고 릴리스 빌드를 생성합니다.
- **명령줄 대안** (`android/` 폴더에서)
  - Debug APK: `./gradlew assembleDebug` → `app/build/outputs/apk/debug/app-debug.apk`
  - Release AAB: `./gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`

> 릴리스 서명 키(`*.jks`)와 비밀번호는 **절대 커밋하지 마세요.** `keystore.properties` 등으로
> 분리하고 `.gitignore` 에 포함합니다.

---

## 5. 앱 식별 정보

| 항목 | 값 |
| --- | --- |
| Application ID | `com.zeffai.app` |
| 앱 이름 | ZEFF AI |
| 로드 URL | `https://zeffai.com/login` (환경변수 `ZEFF_APP_URL` 로 재정의 가능) |

`ZEFF_APP_URL` 을 지정한 뒤 `npx cap sync android` 를 실행하면 다른 오리진(예: 스테이징)을 가리키게 할 수 있습니다.

---

## 6. 자주 겪는 문제

- **Gradle sync 실패 / 의존성 못 찾음** → 네트워크 확인 후 재시도, `File ▸ Invalidate Caches / Restart`.
- **빈 화면 / 흰 화면** → `npx cap sync android` 를 다시 돌렸는지, 기기가 인터넷에 연결됐는지 확인.
  이 앱은 원격 웹을 로드하므로 오프라인에서는 스플래시 이후 콘텐츠가 뜨지 않습니다.
- **Google 로그인/결제 이동 차단** → `capacitor.config.ts` 의 `server.allowNavigation` 도메인 목록을 확인.
- **JDK 버전 오류** → Android Studio ▸ *Settings ▸ Build, Execution, Deployment ▸ Gradle* 에서 JDK 17 지정.
