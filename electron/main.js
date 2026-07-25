const { app, BrowserWindow, shell, session, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const backup = require("./backup");

// ── logging ──────────────────────────────────────────────
const logFile = path.join(path.dirname(process.execPath), "app.log");
let logStream;
try {
  logStream = fs.createWriteStream(logFile, { flags: "a" });
} catch {
  logStream = null;
}
const originalConsole = { ...console };
function writeLog(tag, args) {
  if (!logStream) return;
  try {
    logStream.write(`[${tag}] ${args.map(String).join(" ")}\n`);
  } catch {
    /* ignore */
  }
}
console.log = (...args) => {
  originalConsole.log(...args);
  writeLog("LOG", args);
};
console.error = (...args) => {
  originalConsole.error(...args);
  writeLog("ERROR", args);
};
console.warn = (...args) => {
  originalConsole.warn(...args);
  writeLog("WARN", args);
};
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

const isDev = !app.isPackaged;

/**
 * ZEFF AI Desktop — 얇은 클라이언트
 * 서버/AI 키는 패키지에 넣지 않고 https://zeffai.com 웹 워크스페이스를 앱 창에서 렌더합니다.
 * 웹 서비스는 그대로 유지되며, 데스크톱은 동일 기능·동일 계정을 사용합니다.
 */
const APP_ORIGIN = (
  process.env.ZEFF_APP_URL ||
  process.env.AI_TOOLKIT_APP_URL ||
  "https://zeffai.com"
).replace(/\/$/, "");

// 첫 실행: 인앱 로그인 화면 (웹 /login 과 동일 UI)
const ENTRY_ROUTE = "/login";
const DEV_URL = `http://localhost:3000${ENTRY_ROUTE}`;
const PROD_URL = `${APP_ORIGIN}${ENTRY_ROUTE}`;

// Google OAuth 가 Electron UA 를 거부하지 않도록 데스크톱 Chrome UA 사용
const DESKTOP_CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

let mainWindow = null;
let backupScheduler = null;

function registerBackupIpc() {
  ipcMain.handle("backup:listDrives", () => backup.listRemovableDrives());
  ipcMain.handle("backup:setTargetPath", (_e, targetPath) => {
    backup.setTargetPath(targetPath);
  });
  ipcMain.handle("backup:getTargetPath", () => backup.getTargetPath());
  ipcMain.handle("backup:writeBackupFile", (_e, fileName, base64) => {
    const out = backup.writeBackupFile(fileName, base64);
    backup.markRun();
    return out;
  });
  ipcMain.handle("backup:getLastRunAt", () => backup.getLastRunAt());
  ipcMain.handle("backup:runScheduledCheck", () => ({
    ok: backup.shouldRunScheduled(),
    message: backup.shouldRunScheduled() ? "due" : "not due",
  }));
}

/** 브랜드 로고 3조각 분리→합체 로딩 화면 (설치 후 앱 기동 시에도 동일 모션) */
function loadingHtml() {
  // public/logo 는 패키징 시 extraResources 로 포함. 개발 시 프로젝트 public 경로.
  const logoCandidates = [
    path.join(process.resourcesPath || "", "logo-zeff.png"),
    path.join(__dirname, "..", "public", "logo-zeff.png"),
    path.join(__dirname, "assets", "logo-zeff.png"),
  ];
  let logoSrc = "";
  for (const p of logoCandidates) {
    try {
      if (fs.existsSync(p)) {
        const b64 = fs.readFileSync(p).toString("base64");
        logoSrc = `data:image/png;base64,${b64}`;
        break;
      }
    } catch {
      /* next */
    }
  }

  const logoBlock = logoSrc
    ? `<div class="logo-stage" aria-hidden="true">
        <div class="piece p1"><img src="${logoSrc}" alt=""/></div>
        <div class="piece p2"><img src="${logoSrc}" alt=""/></div>
        <div class="piece p3"><img src="${logoSrc}" alt=""/></div>
      </div>`
    : `<div class="fallback-spin"></div>`;

  return (
    "data:text/html;charset=utf-8," +
    encodeURIComponent(`<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{height:100%;margin:0}
  body{
    display:flex;align-items:center;justify-content:center;
    background:radial-gradient(ellipse at 50% 30%,#1e3a8a33,#020617 55%);
    color:#e2e8f0;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  }
  .box{text-align:center;padding:24px}
  .wordmark{
    margin-top:28px;font-weight:800;font-size:28px;letter-spacing:-0.02em;
    color:#f8fafc;
  }
  .wordmark .z{
    background:linear-gradient(135deg,#2563eb,#6366f1,#3b82f6);
    -webkit-background-clip:text;background-clip:text;color:transparent;
  }
  .wordmark sup{
    font-size:0.45em;letter-spacing:0.2em;color:#60a5fa;margin-left:2px;
  }
  .hint{margin-top:12px;color:#94a3b8;font-size:13px}
  .logo-stage{
    position:relative;width:88px;height:88px;margin:0 auto;
  }
  .piece{
    position:absolute;inset:0;overflow:hidden;
    border-radius:14px;
  }
  .piece img{
    width:88px;height:88px;object-fit:contain;
    filter:drop-shadow(0 8px 24px rgba(37,99,235,.35));
  }
  /* 3조각 클립 */
  .p1{clip-path:inset(0 66.66% 0 0);animation:spread1 1.6s ease-in-out infinite;}
  .p2{clip-path:inset(0 33.33% 0 33.33%);animation:spread2 1.6s ease-in-out infinite;}
  .p3{clip-path:inset(0 0 0 66.66%);animation:spread3 1.6s ease-in-out infinite;}
  @keyframes spread1{
    0%,100%{transform:translate(0,0)}
    45%{transform:translate(-14px,-10px) rotate(-8deg)}
  }
  @keyframes spread2{
    0%,100%{transform:translate(0,0)}
    45%{transform:translate(0,14px)}
  }
  @keyframes spread3{
    0%,100%{transform:translate(0,0)}
    45%{transform:translate(14px,-10px) rotate(8deg)}
  }
  .fallback-spin{
    width:40px;height:40px;margin:0 auto;border-radius:50%;
    border:3px solid rgba(59,130,246,.25);border-top-color:#3b82f6;
    animation:spin .8s linear infinite;
  }
  @keyframes spin{to{transform:rotate(360deg)}}
</style></head>
<body>
  <div class="box">
    ${logoBlock}
    <div class="wordmark"><span class="z">Z</span>eff<sup>AI</sup></div>
    <p class="hint">ZEFF AI 워크스페이스를 준비하고 있어요…</p>
  </div>
</body></html>`)
  );
}

function errorHtml(err) {
  const msg = String(err && err.message ? err.message : err);
  return (
    "data:text/html;charset=utf-8," +
    encodeURIComponent(
      `<!doctype html><html><head><meta charset="utf-8"><style>
        html,body{height:100%;margin:0}
        body{display:flex;align-items:center;justify-content:center;
          background:#020617;color:#e2e8f0;
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
        .box{max-width:520px;text-align:center;padding:24px}
        h2{color:#f8fafc;font-size:18px;margin:0 0 10px}
        p{color:#94a3b8;font-size:13px;line-height:1.6}
        code{color:#93c5fd;font-size:12px;word-break:break-all}
      </style></head><body><div class="box">
        <h2>ZEFF AI 에 연결하지 못했어요</h2>
        <p>인터넷 연결을 확인한 뒤 다시 실행해 주세요.</p>
        <p><code>${msg.replace(/[<>&]/g, "")}</code></p>
      </div></body></html>`
    )
  );
}

function isZeffOrigin(url) {
  try {
    const { origin, hostname } = new URL(url);
    if (isDev && (origin === "http://localhost:3000" || hostname === "localhost")) {
      return true;
    }
    const host = hostname.replace(/^www\./, "");
    return host === "zeffai.com" || host.endsWith(".zeffai.com");
  } catch {
    return false;
  }
}

/** 데스크탑 앱에서는 마케팅 공식 홈페이지에 들어가지 못하게 한다.
 *  (로그인·워크스페이스·인증 콜백만 앱 안에서 쓰고, 홈은 아예 차단) */
const MARKETING_PATHS = new Set(["/", "/about", "/vision", "/download", "/prototype"]);
function isBlockedMarketing(url) {
  try {
    const u = new URL(url);
    if (!isZeffOrigin(url)) return false;
    return MARKETING_PATHS.has(u.pathname.replace(/\/+$/, "") || "/");
  } catch {
    return false;
  }
}

/** 결제·지원/약관은 공식 홈 브라우저에서 열기 */
function shouldForceExternal(url) {
  try {
    const u = new URL(url);
    if (!isZeffOrigin(url) && !u.hostname.endsWith("accounts.google.com")) {
      return true;
    }
    const p = u.pathname || "";
    if (p.startsWith("/checkout")) return true;
    if (p.startsWith("/support")) return true;
    return false;
  } catch {
    return true;
  }
}

function isAllowedInApp(url) {
  try {
    const { hostname } = new URL(url);
    if (hostname.endsWith("accounts.google.com")) return true;
    if (shouldForceExternal(url)) return false;
    return isZeffOrigin(url) || (isDev && hostname === "localhost");
  } catch {
    return false;
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#020617",
    show: true,
    autoHideMenuBar: true,
    title: "ZEFF AI",
    icon: path.join(__dirname, "assets", "icon.png"),
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.setUserAgent(DESKTOP_CHROME_UA);
  mainWindow.webContents.on(
    "did-fail-load",
    (_e, errorCode, errorDescription, validatedURL) => {
      console.error("[did-fail-load]", errorCode, errorDescription, validatedURL);
    },
  );
  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 마케팅 홈은 데스크탑에서 열지 않는다(외부 브라우저로도 X) — 앱 안에서 무시
    if (isBlockedMarketing(url)) return { action: "deny" };
    if (isAllowedInApp(url) && !shouldForceExternal(url)) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    // 마케팅 홈페이지로의 이동은 막고, 워크스페이스(/app)로 되돌린다.
    if (isBlockedMarketing(url)) {
      event.preventDefault();
      mainWindow.loadURL(`${APP_ORIGIN}/app`);
      return;
    }
    if (!isAllowedInApp(url) || shouldForceExternal(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // 데스크탑 클라이언트 표시 — 웹이 이 쿠키를 보고 로그인 화면 뒤로가기 버튼을 숨긴다.
  try {
    const cookieTargets = isDev
      ? ["http://localhost:3000"]
      : [APP_ORIGIN, "https://www.zeffai.com"];
    await Promise.all(
      cookieTargets.map((u) =>
        session.defaultSession.cookies
          .set({ url: u, name: "zeff_client", value: "desktop", sameSite: "lax" })
          .catch(() => {}),
      ),
    );
  } catch {
    /* 쿠키 실패해도 앱은 정상 동작 */
  }

  // 브랜드 로고 모션 로딩 → 로그인 화면
  await mainWindow.loadURL(loadingHtml());
  mainWindow.show();

  try {
    const url = isDev ? DEV_URL : PROD_URL;
    // 로고 모션이 보이도록 짧게 유지
    await new Promise((r) => setTimeout(r, 1400));
    await mainWindow.loadURL(url);
  } catch (err) {
    console.error("[main] failed to load app:", err);
    await mainWindow.loadURL(errorHtml(err));
    mainWindow.show();
  }
}

app.setName("ZEFF AI");
app.whenReady().then(() => {
  registerBackupIpc();
  createWindow().then(() => {
    backupScheduler = backup.createScheduler(mainWindow, APP_ORIGIN);
    backupScheduler.start();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
