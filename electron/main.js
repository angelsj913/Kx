const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");

// Redirect console output to file for debugging
const logFile = path.join(path.dirname(process.execPath), "app.log");
const logStream = fs.createWriteStream(logFile, { flags: "a" });
const originalConsole = { ...console };

console.log = (...args) => {
  originalConsole.log(...args);
  logStream.write(`[LOG] ${args.join(" ")}\n`);
};

console.error = (...args) => {
  originalConsole.error(...args);
  logStream.write(`[ERROR] ${args.join(" ")}\n`);
};

console.warn = (...args) => {
  originalConsole.warn(...args);
  logStream.write(`[WARN] ${args.join(" ")}\n`);
};

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
  console.error("[uncaughtException] Stack:", err.stack);
});

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

const isDev = !app.isPackaged;

// The desktop app is a thin client: it never runs its own Next.js server or
// holds backend secrets (DB, Google OAuth, AI keys all live server-side on
// Vercel). It just renders the deployed cloud app's /app workspace, the same
// way a browser would. This lets the same account/login/history follow the
// user across every device, including this desktop install.
//
// Override with AI_TOOLKIT_APP_URL for pointing a packaged build at a
// staging/preview deployment without rebuilding.
const APP_ORIGIN =
  process.env.AI_TOOLKIT_APP_URL || "https://kx-chi.vercel.app";
const APP_ROUTE = "/app";
const DEV_URL = `http://localhost:3000${APP_ROUTE}`;
const PROD_URL = `${APP_ORIGIN.replace(/\/$/, "")}${APP_ROUTE}`;

// Google blocks OAuth sign-in inside "embedded" browsers, which it detects
// mainly by user-agent sniffing (Electron's default UA includes
// "Electron/x.y.z"). Presenting a normal desktop Chrome UA lets the Google
// login screen render instead of the "disallowed_useragent" error, while the
// whole login flow still runs inside this same window/session so the
// resulting session cookie is immediately usable by the app.
const DESKTOP_CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

let mainWindow = null;

const LOADING_HTML =
  "data:text/html;charset=utf-8," +
  encodeURIComponent(
    `<!doctype html><html><head><meta charset="utf-8"><style>
      html,body{height:100%;margin:0}
      body{display:flex;align-items:center;justify-content:center;
        background:#020617;color:#e2e8f0;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
      .box{text-align:center}
      .spinner{width:38px;height:38px;margin:0 auto 18px;border-radius:50%;
        border:3px solid rgba(139,92,246,.25);border-top-color:#8b5cf6;
        animation:spin .8s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}
      p{color:#94a3b8;font-size:14px}
    </style></head><body><div class="box">
      <div class="spinner"></div>
      <p>AI 툴킷을 준비하고 있어요…</p>
    </div></body></html>`
  );

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
        code{color:#c4b5fd;font-size:12px;word-break:break-all}
      </style></head><body><div class="box">
        <h2>서버에 연결하지 못했어요</h2>
        <p>인터넷 연결을 확인하고 잠시 후 다시 시도해 주세요.</p>
        <p><code>${msg}</code></p>
      </div></body></html>`
    )
  );
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: "#020617",
    show: true,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setUserAgent(DESKTOP_CHROME_UA);

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      console.error("[did-fail-load]", errorCode, errorDescription, validatedURL);
    }
  );

  mainWindow.once("ready-to-show", () => mainWindow.show());

  // Only the app's own origin (and Google's accounts domain, needed mid-OAuth
  // redirect) should ever navigate inside this window. Anything else the
  // page tries to open (release notes, external docs, etc.) goes to the OS
  // browser instead of hijacking the desktop app.
  const targetOrigin = isDev ? "http://localhost:3000" : APP_ORIGIN;
  function isAllowedInApp(url) {
    try {
      const { origin, hostname } = new URL(url);
      return origin === targetOrigin || hostname.endsWith("accounts.google.com");
    } catch {
      return false;
    }
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedInApp(url)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedInApp(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(LOADING_HTML);
  mainWindow.show();

  try {
    const url = isDev ? DEV_URL : PROD_URL;
    await mainWindow.loadURL(url);
  } catch (err) {
    console.error("[main] failed to load app:", err);
    await mainWindow.loadURL(errorHtml(err));
    mainWindow.show();
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
