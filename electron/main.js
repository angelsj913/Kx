const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const net = require("net");
const { fork } = require("child_process");

const isDev = !app.isPackaged;
const DEV_URL = "http://localhost:3000";

let mainWindow = null;
let serverProcess = null;

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
  const port = await getFreePort();
  const standaloneDir = path.join(process.resourcesPath, "standalone");
  const serverJs = path.join(standaloneDir, "server.js");

  serverProcess = fork(serverJs, [], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ...loadEnvFile(),
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
    },
    // Run server.js with Electron's bundled Node runtime.
    execPath: process.execPath,
    silent: false,
  });

  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url);
  return url;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: "#020617",
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open external links in the OS browser, not inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const url = isDev ? DEV_URL : await startProductionServer();
  await mainWindow.loadURL(url);
  mainWindow.show();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
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
