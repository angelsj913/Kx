// Copies the static assets and public dir into the Next.js standalone output
// so the self-contained server can serve them when run from Electron.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

if (!fs.existsSync(standalone)) {
  console.error(
    "[prepare-standalone] .next/standalone not found. Run `next build` first."
  );
  process.exit(1);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyDir(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static")
);
copyDir(path.join(root, "public"), path.join(standalone, "public"));

console.log("[prepare-standalone] static + public copied into standalone output.");
