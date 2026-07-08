const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const net = require("net");
const { fork } = require("child_process");

// Redirect console output to file for debugging
const logFile = path.join(app.getPath('userData'), 'app.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });
const originalConsole = { ...console };

console.log = (...args) => {
  originalConsole.log(...args);
  logStream.write(`[LOG] ${args.join(' ')}\n`);
};

console.error = (...args) => {
  originalConsole.error(...args);
  logStream.write(`[ERROR] ${args.join(' ')}\n`);
};

console.warn = (...args) => {
  originalConsole.warn(...args);
  logStream.write(`[WARN] ${args.join(' ')}\n`);
};

// Add global error handlers to catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  console.error('[uncaughtException] Stack:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[unhandledRejection]', reason);
  console.error('[unhandledRejection] Promise:', promise);
});

const isDev = !app.isPackaged;
// The desktop app renders the tool workspace at /app; the site root (/) is a
// download-only landing page served on the web (Vercel).
const APP_ROUTE = "/app";
const DEV_URL = `http://localhost:3000${APP_ROUTE}`;

let mainWindow = null;
let serverProcess = null;

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
      <p>AI \uD234\uD0B7\uC744 \uC900\uBE44\uD558\uACE0 \uC788\uC5B4\uC694\u2026</p>
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
        <h2>\uC571\uC744 \uC2DC\uC791\uD558\uC9C0 \uBABB\uD588\uC5B4\uC694</h2>
        <p>\uB0B4\uBD80 \uC11C\uBC84\uB97C \uC2DC\uC791\uD558\uB294 \uC911 \uBB38\uC81C\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.</p>
        <p><code>${msg}</code></p>
      </div></body></html>`
    )
  );
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = require("http").get(url, (res) => {
        res.destroy();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Next.js 서버 시작 시간 초과"));
        } else {
          setTimeout(tryOnce, 300);
        }
      });
    };
    tryOnce();
  });
}

// Best-effort load of a local .env / .env.local placed next to the app resources.
function loadEnvFile() {
  const candidates = isDev
    ? [path.join(process.cwd(), ".env.local"), path.join(process.cwd(), ".env")]
    : [
        path.join(process.resourcesPath, ".env.local"),
        path.join(process.resourcesPath, ".env"),
        path.join(path.dirname(process.execPath), ".env.local"),
        path.join(path.dirname(process.execPath), ".env"),
      ];
  const env = {};
  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      for (const line of fs.readFileSync(file, "utf8").split("\n")) {
        const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
        if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch {
      /* ignore */
    }
  }
  return env;
}

async function startProductionServer() {
  console.log('[startProductionServer] Starting production server');
  console.log('[startProductionServer] process.resourcesPath:', process.resourcesPath);
  console.log('[startProductionServer] process.execPath:', process.execPath);
  
  const port = await getFreePort();
  const standaloneDir = path.join(process.resourcesPath, "standalone");
  const serverJs = path.join(standaloneDir, "server.js");
  
  console.log('[startProductionServer] standaloneDir:', standaloneDir);
  console.log('[startProductionServer] serverJs:', serverJs);
  
  if (!fs.existsSync(standaloneDir)) {
    throw new Error(`Standalone directory not found: ${standaloneDir}`);
  }
  
  if (!fs.existsSync(serverJs)) {
    throw new Error(`Server.js not found: ${serverJs}`);
  }

  serverProcess = fork(serverJs, [], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ...loadEnvFile(),
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      // Critical: without this, forking the Electron binary would launch a
      // second GUI Electron process instead of running server.js as Node,
      // so the Next.js server would never come up and no window would appear.
      ELECTRON_RUN_AS_NODE: "1",
    },
    // Run server.js with Electron's bundled Node runtime.
    execPath: process.execPath,
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  console.log('[startProductionServer] Server process forked, PID:', serverProcess.pid);

  serverProcess.stdout?.on("data", (d) => console.log(`[next] ${d}`));
  serverProcess.stderr?.on("data", (d) => console.error(`[next] ${d}`));
  serverProcess.on("exit", (code) =>
    console.error(`[next] server process exited with code ${code}`)
  );
  serverProcess.on("error", (err) => {
    console.error('[startProductionServer] Server process error:', err);
  });

  const base = `http://127.0.0.1:${port}`;
  console.log('[startProductionServer] Waiting for server at:', base);
  await waitForServer(base);
  console.log('[startProductionServer] Server is ready at:', base);
  return `${base}${APP_ROUTE}`;
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

  // Open DevTools to debug renderer process errors
  mainWindow.webContents.openDevTools();

  // Detect page load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('[did-fail-load]', errorCode, errorDescription, validatedURL);
  });

  // Show the window as soon as its first frame is ready so the user always
  // sees a window even while the local server is still starting up.
  mainWindow.once("ready-to-show", () => mainWindow.show());

  // Open external links in the OS browser, not inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Immediately render a lightweight loading screen, then swap to the real URL.
  await mainWindow.loadURL(LOADING_HTML);
  mainWindow.show();

  try {
    const url = isDev ? DEV_URL : await startProductionServer();
    await mainWindow.loadURL(url);
  } catch (err) {
    console.error("[main] failed to start app:", err);
    await mainWindow.loadURL(errorHtml(err));
    mainWindow.show();
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {
      /* ignore */
    }
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("before-quit", () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {
      /* ignore */
    }
  }
});
