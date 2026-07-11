// 설치 파일은 GitHub Release 자산으로 배포됩니다. Release가 발행되면
// 아래 URL이 그대로 동작합니다. 이름을 바꾸면 여기만 수정하세요.
export const REPO = "https://github.com/angelsj913/Kx";
export const REPO_SLUG = "angelsj913/Kx"; // GitHub API 호출용 owner/repo
export const WINDOWS_FILENAME = "AI-Toolkit-Windows-Installer.exe";
export const MAC_FILENAME = "AI-Toolkit-Mac-Installer.dmg";
export const WINDOWS_DOWNLOAD_URL = `${REPO}/releases/latest/download/${WINDOWS_FILENAME}`;
export const MAC_DOWNLOAD_URL = `${REPO}/releases/latest/download/${MAC_FILENAME}`;
export const ALL_RELEASES_URL = `${REPO}/releases`;

// 현재 배포 버전 및 시스템 요구사항 (릴리스 갱신 시 함께 업데이트).
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
