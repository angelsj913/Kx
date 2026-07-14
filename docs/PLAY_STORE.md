# ZEFF AI — Google Play 스토어 등록 가이드

Windows 코드 서명 인증서 **없이** Android 앱을 Play 스토어에 올리는 절차입니다.  
앱은 Electron과 같이 **얇은 클라이언트**로 `https://zeffai.com` 을 로드합니다.

| 항목 | 내용 |
|------|------|
| 패키지 ID | `com.zeffai.app` |
| 프레임워크 | Capacitor 8 + Android |
| 비용 | Play 개발자 등록 **일회성 $25** (코드 서명 인증서 연 구독 없음) |
| 업로드 형식 | **AAB** (Android App Bundle) |
| 개인정보 처리방침 | https://zeffai.com/support/legal#privacy |

---

## 1. Google Play Console 계정 (본인)

1. [Google Play Console](https://play.google.com/console) 접속  
2. 개발자 계정 만들기 (개인 또는 조직)  
3. **$25 일회 등록비** 결제  
4. 신원 확인 완료 대기 (며칠 걸릴 수 있음)

---

## 2. 앱 만들기

1. **앱 만들기** → 이름 `ZEFF AI`  
2. 기본 언어: 한국어  
3. 앱/게임: 앱  
4. 무료/유료: 무료 (인앱·웹 구독은 정책 확인)  
5. 선언 항목 체크 후 만들기

---

## 3. AAB 빌드

### 로컬 (Android Studio / SDK 있는 PC)

```bash
# 업로드 키 한 번 생성 (분실 금지 — Play 앱 서명과 별개로 업로드 키)
keytool -genkey -v -keystore zeffai-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias zeffai

# android/keystore.properties
# storeFile=zeffai-upload.jks
# storePassword=...
# keyAlias=zeffai
# keyPassword=...

npm ci
npm run android:bundle
# 결과: android/app/build/outputs/bundle/release/app-release.aab
```

### GitHub Actions (권장)

1. repo Secrets 등록 (선택, 서명 AAB용):
   - `ANDROID_KEYSTORE_BASE64` — jks를 base64한 값  
   - `ANDROID_KEYSTORE_PASSWORD`  
   - `ANDROID_KEY_ALIAS`  
   - `ANDROID_KEY_PASSWORD`  
2. Actions → **Build Android (Play Store AAB)** → Run workflow  
3. 또는 태그: `git tag android-v1.0.0 && git push origin android-v1.0.0`  
4. Artifacts에서 `zeffai-android-aab` 다운로드  

서명을 안 넣어도 AAB는 나올 수 있으나, **Play 업로드용으로는 서명된 AAB**가 필요합니다.  
Play App Signing을 쓰면 **업로드 키**만 있으면 되고, 최종 배포 키는 Google이 관리합니다.

---

## 4. Play Console 제출 체크리스트

- [ ] **프로덕션** 또는 **내부 테스트** 트랙에 AAB 업로드  
- [ ] 스토어 등록정보: 짧은 설명, 긴 설명, 스크린샷 (폰 필수)  
- [ ] 앱 아이콘 512×512  
- [ ] 기능 그래픽(선택)  
- [ ] 개인정보처리방침 URL: `https://zeffai.com/support/legal#privacy`  
- [ ] 앱 콘텐츠 / 광고 여부 / 타겟 연령  
- [ ] Data safety (수집 데이터 항목 — 계정, 사용 데이터 등 솔직히 기재)  
- [ ] 카테고리: 생산성 등  
- [ ] 연락 이메일  
- [ ] 심사 제출  

내부 테스트(이메일 테스터)로 먼저 올리면 심사 전에 설치 확인이 쉽습니다.

---

## 5. 심사 통과 후

1. `src/lib/constants.ts` 의 `PLAY_STORE_URL` 을 실제 링크로 교체  
2. 랜딩 히어로 Android 버튼이 스토어로 연결됨  
3. (선택) Digital Asset Links:  
   `https://zeffai.com/.well-known/assetlinks.json`  
   → 딥링크 `autoVerify` 신뢰에 사용

---

## 6. 정책 주의 (거절 줄이기)

1. **단순 웹뷰만** 있는 앱은 품질/정책으로 거절될 수 있음.  
   - 스플래시·딥링크·공식 도메인·로그인 플로우를 갖춘 셸 + 실제 서비스(zeffai.com)로 구성함.  
2. **외부 결제(Stripe 등)** 를 쓰는 디지털 콘텐츠는 Play 결제 정책과 충돌할 수 있음.  
   - 웹 전용 구독이면 스토어 설명에 명확히 쓰고, 필요 시 Play Billing 검토.  
3. Google 로그인: WebView 제한이 있으면 시스템 브라우저 로그인으로 보완 가능 (`@capacitor/browser`).  
4. 마이크/파일 권한은 실제 기능 쓸 때만 요청·선언.

---

## 7. 비용 요약

| 항목 | 비용 |
|------|------|
| Play 개발자 등록 | **$25 한 번** |
| 코드 서명 인증서 (Windows용) | **불필요** |
| Play App Signing | 무료 |
| Capacitor / 빌드 | 무료 (오픈소스) |

Windows 설치 파일의 SmartScreen 문제는 이 경로와 **무관**합니다.  
모바일은 Play, PC는 웹/`zeffai.installer.exe` 를 계속 쓰면 됩니다.
