import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

/**
 * 읽기 전용 하드코딩 시크릿 스캐너.
 * 스킬 근거: implementing-secret-scanning-with-gitleaks, testing-for-sensitive-data-exposure
 * (스킬의 gitleaks/trufflehog 절차를 그대로 실행하지 않고, 그 탐지 아이디어만 우리 src/ 정적 스캔으로 구현)
 *
 * 원칙:
 * - 우리 저장소 `src/` 소스만 읽는다. git history·외부·.env 파일은 건드리지 않는다.
 * - 탐지값은 원문을 저장하지 않고 앞4·뒤4만 남기고 마스킹한다.
 * - `process.env.*` 참조 라인은 시크릿이 아니므로 제외한다.
 */

export type SecretHit = {
  file: string; // repo-relative
  line: number;
  kind: string;
  masked: string;
};

// 잘 알려진 시크릿 포맷. FP를 줄이려 접두어가 뚜렷한 것 위주.
const PATTERNS: { kind: string; re: RegExp }[] = [
  { kind: "stripe_live_secret", re: /sk_live_[0-9a-zA-Z]{16,}/ },
  { kind: "stripe_restricted_key", re: /rk_live_[0-9a-zA-Z]{16,}/ },
  { kind: "aws_access_key_id", re: /AKIA[0-9A-Z]{16}/ },
  { kind: "google_api_key", re: /AIza[0-9A-Za-z\-_]{35}/ },
  { kind: "github_pat", re: /ghp_[0-9A-Za-z]{36}|github_pat_[0-9A-Za-z_]{40,}/ },
  { kind: "slack_token", re: /xox[baprs]-[0-9A-Za-z-]{10,}/ },
  { kind: "private_key_block", re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----/ },
  // 시크릿처럼 보이는 변수에 긴 리터럴을 직접 대입한 경우 (템플릿/환경변수 제외는 아래 로직에서 처리)
  {
    kind: "hardcoded_secret_assignment",
    re: /(?:secret|token|api[_-]?key|passw(?:or)?d|access[_-]?key|private[_-]?key)\s*[:=]\s*["'`][A-Za-z0-9+/=_\-]{24,}["'`]/i,
  },
];

const SCAN_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "generated", "dist", "build", ".git"]);
// 스캐너 자신과 규칙 정의 파일은 정규식 리터럴 때문에 자기 자신을 오탐하므로 제외.
const SKIP_FILES = new Set(["src/lib/security/secretScan.ts", "src/lib/security/checks.ts"]);
// 명백한 플레이스홀더/예시 토큰은 시크릿이 아님.
const PLACEHOLDER = /example|placeholder|your[-_]|dummy|xxxx|changeme|<[^>]+>|\.\.\.|test[-_]?key/i;

function mask(secret: string): string {
  if (secret.length <= 10) return "****";
  return `${secret.slice(0, 4)}…${secret.slice(-4)} (len ${secret.length})`;
}

async function walk(dir: string, root: string, out: string[]): Promise<void> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      await walk(full, root, out);
    } else if (e.isFile()) {
      const dot = e.name.lastIndexOf(".");
      if (dot >= 0 && SCAN_EXTS.has(e.name.slice(dot))) out.push(full);
    }
  }
}

export async function scanSourceForSecrets(): Promise<SecretHit[]> {
  const root = process.cwd();
  const srcDir = join(root, "src");
  const files: string[] = [];
  await walk(srcDir, root, files);

  const hits: SecretHit[] = [];
  for (const file of files) {
    const rel = relative(root, file).split(sep).join("/");
    if (SKIP_FILES.has(rel)) continue;
    let content: string;
    try {
      content = await readFile(file, "utf8");
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 환경변수 참조·템플릿 보간은 시크릿이 아니다.
      if (line.includes("process.env")) continue;
      if (PLACEHOLDER.test(line)) continue;
      for (const { kind, re } of PATTERNS) {
        const m = re.exec(line);
        if (!m) continue;
        // 대입형은 값 안에 ${ 가 있으면 템플릿이므로 스킵.
        if (kind === "hardcoded_secret_assignment" && /\$\{/.test(m[0])) continue;
        hits.push({ file: rel, line: i + 1, kind, masked: mask(m[0]) });
        break; // 한 라인당 1건이면 충분
      }
    }
  }
  return hits;
}
