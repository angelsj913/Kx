import type { CapacitorConfig } from "@capacitor/cli";

/**
 * ZEFF AI Android — 얇은 클라이언트 (Electron 데스크톱과 동일 전략)
 * 앱 패키지에 서버/AI 키를 넣지 않고 https://zeffai.com 웹 워크스페이스를 로드합니다.
 */
const APP_ORIGIN = (
  process.env.ZEFF_APP_URL ||
  process.env.AI_TOOLKIT_APP_URL ||
  "https://zeffai.com"
).replace(/\/$/, "");

const config: CapacitorConfig = {
  appId: "com.zeffai.app",
  appName: "ZEFF AI",
  // 오프라인 폴백 스플래시용 (실제 화면은 server.url)
  webDir: "mobile/www",
  server: {
    url: `${APP_ORIGIN}/login`,
    cleartext: false,
    androidScheme: "https",
    // OAuth·결제·공식 도메인 허용 (WebView 내 이동)
    allowNavigation: [
      "zeffai.com",
      "*.zeffai.com",
      "accounts.google.com",
      "*.google.com",
      "*.googleusercontent.com",
      "checkout.stripe.com",
      "*.stripe.com",
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0f172a",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0f172a",
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0f172a",
    webContentsDebuggingEnabled: false,
  },
};

export default config;
