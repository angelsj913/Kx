const fs = require("fs");
const path = require("path");
const os = require("os");

const SCHEDULE_MS = 48 * 60 * 60 * 1000;
const CONFIG_DIR = path.join(os.homedir(), ".zeff-ai");
const CONFIG_FILE = path.join(CONFIG_DIR, "backup-config.json");

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    }
  } catch {
    /* ignore */
  }
  return { targetPath: null, lastRunAt: null, passwordHint: null };
}

function writeConfig(cfg) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf8");
}

function listRemovableDrives() {
  const drives = [];
  if (process.platform === "win32") {
    for (let code = 68; code <= 90; code++) {
      const letter = String.fromCharCode(code);
      const root = `${letter}:\\`;
      try {
        fs.accessSync(root, fs.constants.W_OK);
        drives.push({ path: root, label: `Drive ${letter}:` });
      } catch {
        /* not mounted */
      }
    }
  } else if (process.platform === "darwin") {
    const volumes = "/Volumes";
    try {
      for (const name of fs.readdirSync(volumes)) {
        if (name === "Macintosh HD") continue;
        const p = path.join(volumes, name);
        try {
          fs.accessSync(p, fs.constants.W_OK);
          drives.push({ path: p, label: name });
        } catch {
          /* skip */
        }
      }
    } catch {
      /* ignore */
    }
  } else {
    const media = "/media";
    const mnt = "/mnt";
    for (const base of [media, mnt]) {
      try {
        if (!fs.existsSync(base)) continue;
        for (const name of fs.readdirSync(base)) {
          const p = path.join(base, name);
          try {
            fs.accessSync(p, fs.constants.W_OK);
            drives.push({ path: p, label: name });
          } catch {
            /* skip */
          }
        }
      } catch {
        /* ignore */
      }
    }
  }
  return drives;
}

function writeBackupFile(fileName, base64Data) {
  const cfg = readConfig();
  if (!cfg.targetPath) {
    throw new Error("백업 HDD 경로가 설정되지 않았습니다.");
  }
  const outPath = path.join(cfg.targetPath, fileName);
  fs.writeFileSync(outPath, Buffer.from(base64Data, "base64"));
  return outPath;
}

function setTargetPath(targetPath) {
  const cfg = readConfig();
  cfg.targetPath = targetPath;
  writeConfig(cfg);
}

function getTargetPath() {
  return readConfig().targetPath;
}

function getLastRunAt() {
  return readConfig().lastRunAt;
}

function markRun() {
  const cfg = readConfig();
  cfg.lastRunAt = new Date().toISOString();
  writeConfig(cfg);
}

function shouldRunScheduled() {
  const cfg = readConfig();
  if (!cfg.targetPath) return false;
  if (!cfg.lastRunAt) return true;
  const elapsed = Date.now() - new Date(cfg.lastRunAt).getTime();
  return elapsed >= SCHEDULE_MS;
}

/** Electron main에서 webContents로 백업 페이지 트리거 */
function createScheduler(mainWindow, appOrigin) {
  let timer = null;

  async function tick() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (!shouldRunScheduled()) return;

    try {
      const url = `${appOrigin}/admin/security/backup`;
      if (mainWindow.webContents.getURL().includes("/admin/security/backup")) {
        await mainWindow.webContents.executeJavaScript(`
          (async () => {
            if (window.__zeffScheduledBackupRunning) return;
            window.__zeffScheduledBackupRunning = true;
            try {
              const pwd = sessionStorage.getItem('zeff_backup_password');
              if (!pwd || pwd.length < 8) return { ok: false, message: '비밀번호 미설정' };
              const btn = document.querySelector('button[type="button"]');
              /* scheduled는 API 직접 호출 */
              const res = await fetch('/api/admin/backup/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd, trigger: 'scheduled' }),
              });
              const data = await res.json();
              if (res.ok && data.encryptedBase64 && window.zeffBackup) {
                await window.zeffBackup.writeBackupFile(data.fileName, data.encryptedBase64);
              }
              return { ok: res.ok, message: data.error || 'scheduled backup done' };
            } finally {
              window.__zeffScheduledBackupRunning = false;
            }
          })()
        `);
        markRun();
      }
    } catch (err) {
      console.error("[backup scheduler]", err);
    }
  }

  function start() {
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 60 * 60 * 1000);
    setTimeout(tick, 30_000);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  return { start, stop, markRun, shouldRunScheduled };
}

module.exports = {
  listRemovableDrives,
  writeBackupFile,
  setTargetPath,
  getTargetPath,
  getLastRunAt,
  markRun,
  createScheduler,
  SCHEDULE_MS,
};
