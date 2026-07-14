/**
 * CI workflow (legacy path) looks for AI-Toolkit-Windows-Installer.exe.
 * Product artifact is zeffai.installer.exe — keep both names after build.
 */
const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "dist-electron");
const primary = path.join(dist, "zeffai.installer.exe");
const alias = path.join(dist, "AI-Toolkit-Windows-Installer.exe");

if (!fs.existsSync(primary)) {
  // fallback: any installer exe
  const candidates = fs.existsSync(dist)
    ? fs.readdirSync(dist).filter((f) => f.endsWith(".exe") && !f.includes("uninstaller"))
    : [];
  if (!candidates.length) {
    console.error("[copy-win-installer-alias] no installer found in", dist);
    process.exit(1);
  }
  const src = path.join(dist, candidates[0]);
  fs.copyFileSync(src, primary);
  console.log("[copy-win-installer-alias] promoted", candidates[0], "-> zeffai.installer.exe");
}

fs.copyFileSync(primary, alias);
console.log("[copy-win-installer-alias] ok", primary, "->", alias);
