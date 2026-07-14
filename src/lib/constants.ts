// ZEFF AI 데스크톱 설치 파일 — GitHub Release 자산으로 배포
export const REPO = "https://github.com/angelsj913/Kx";
export const REPO_SLUG = "angelsj913/Kx";
/** 파일명에 zeffai 포함 (요청 사항) */
export const WINDOWS_FILENAME = "zeffai.installer.exe";
export const MAC_FILENAME = "zeffai-mac.dmg";
export const WINDOWS_DOWNLOAD_URL = `${REPO}/releases/latest/download/${WINDOWS_FILENAME}`;
export const MAC_DOWNLOAD_URL = `${REPO}/releases/latest/download/${MAC_FILENAME}`;
export const ALL_RELEASES_URL = `${REPO}/releases`;

/** 공식 홈 (데스크톱·결제·약관 공통) */
export const OFFICIAL_SITE = "https://zeffai.com";
export const LEGAL_TERMS_URL = `${OFFICIAL_SITE}/support/legal#terms`;
export const LEGAL_PRIVACY_URL = `${OFFICIAL_SITE}/support/legal#privacy`;
export const LEGAL_CONSENT_URL = `${OFFICIAL_SITE}/support/legal#consent`;
export const CHECKOUT_BASE_URL = `${OFFICIAL_SITE}/checkout`;

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
} as const;
