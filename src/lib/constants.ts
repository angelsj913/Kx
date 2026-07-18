// 업로드 제한 — 라이브러리·채팅 첨부 공통. 서버 메모리(파일을 통째로
// Buffer + base64로 올린다)와 Blob 저장 비용을 로그인 사용자가 임의로
// 키우지 못하게 막는 상한이다.
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB / 파일
export const MAX_UPLOAD_MB = 20;
export const MAX_CHAT_FILES = 10; // 한 메시지당 첨부 개수

// ZEFF AI 데스크톱 설치 파일 — GitHub Release 자산으로 배포
export const REPO = "https://github.com/angelsj913/Kx";
export const REPO_SLUG = "angelsj913/Kx";
/** 파일명에 zeffai 포함 (요청 사항) */
export const WINDOWS_FILENAME = "zeffai.installer.exe";
export const MAC_FILENAME = "zeffai-mac.dmg";
export const WINDOWS_DOWNLOAD_URL = `${REPO}/releases/latest/download/${WINDOWS_FILENAME}`;
export const MAC_DOWNLOAD_URL = `${REPO}/releases/latest/download/${MAC_FILENAME}`;
export const ALL_RELEASES_URL = `${REPO}/releases`;

/** 공식 홈 (데스크톱·모바일·결제·약관 공통) */
export const OFFICIAL_SITE = "https://zeffai.com";
export const LEGAL_TERMS_URL = `${OFFICIAL_SITE}/support/legal#terms`;
export const LEGAL_PRIVACY_URL = `${OFFICIAL_SITE}/support/legal#privacy`;

/**
 * Google Play 스토어 링크 — 심사 통과 후 실제 URL로 교체
 * 예: https://play.google.com/store/apps/details?id=com.zeffai.app
 */
export const PLAY_STORE_URL = "";
export const ANDROID_PACKAGE_ID = "com.zeffai.app";

export const APP_VERSION = "1.0.0";
export const SYSTEM_REQUIREMENTS = {
  windows: {
    os: "Windows 10 / 11 (64-bit)",
    cpu: "듀얼코어 2.0GHz 이상",
    ram: "4GB 이상 (8GB 권장)",
    disk: "500MB 이상 여유 공간",
  },
  mac: {
    os: "macOS 12 (Monterey) 이상",
    cpu: "Apple Silicon 또는 Intel",
    ram: "4GB 이상 (8GB 권장)",
    disk: "500MB 이상 여유 공간",
  },
  android: {
    os: "Android 7.0 (API 24) 이상",
    ram: "3GB 이상 권장",
    disk: "100MB 이상 여유 공간",
  },
} as const;
