import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import process from "node:process";

function loadDotenvFile(filePath) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

for (const envName of [".env.local", ".env"]) {
  loadDotenvFile(resolve(process.cwd(), envName));
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL이 없어 RAG 자동 색인을 실행할 수 없습니다.");
  process.exit(1);
}

const { GoogleGenAI } = await import("@google/genai");
const { neonConfig } = await import("@neondatabase/serverless");
const { PrismaNeon } = await import("@prisma/adapter-neon");
const ws = (await import("ws")).default;
const { PrismaClient } = await import("../src/generated/prisma/client.ts");

neonConfig.webSocketConstructor = ws;

const EMBED_MODEL = "text-embedding-004";
const LOCAL_DIM = 256;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = "true";
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function hashToken(token) {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % LOCAL_DIM;
}

function normalize(vec) {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

function localEmbed(text) {
  const vec = new Array(LOCAL_DIM).fill(0);
  const lower = text.toLowerCase();
  const words = lower.match(/[\p{L}\p{N}]+/gu) ?? [];
  for (const w of words) vec[hashToken(w)] += 1;
  const compact = lower.replace(/\s+/g, "");
  for (let i = 0; i < compact.length - 1; i++) {
    vec[hashToken(compact.slice(i, i + 2))] += 1;
  }
  return normalize(vec);
}

async function embedTexts(texts) {
  if (texts.length === 0) return { vectors: [], provider: "local" };

  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const res = await ai.models.embedContent({ model: EMBED_MODEL, contents: texts });
      const raw = res.embeddings ?? [];
      const vectors = raw.map((e) => e.values ?? []);
      if (vectors.length === texts.length && vectors.every((v) => v.length > 0)) {
        return { vectors: vectors.map(normalize), provider: "gemini" };
      }
    } catch (err) {
      console.warn("[rag-index] Gemini 임베딩 실패, 로컬 임베딩으로 폴백합니다.", err?.message ?? err);
    }
  }

  return { vectors: texts.map(localEmbed), provider: "local" };
}

function chunkText(text, size = 900, overlap = 150) {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  if (clean.length <= size) return [{ idx: 0, content: clean }];

  const chunks = [];
  let start = 0;
  let idx = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    if (end < clean.length) {
      const slice = clean.slice(start, end);
      const brk = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf(". "),
      );
      if (brk > size * 0.5) end = start + brk + 1;
    }
    const content = clean.slice(start, end).trim();
    if (content) chunks.push({ idx: idx++, content });
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

async function resolveUser(prisma, args) {
  if (args["user-id"]) {
    const user = await prisma.user.findUnique({
      where: { id: args["user-id"] },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw new Error(`user-id '${args["user-id"]}' 사용자를 찾을 수 없습니다.`);
    return user;
  }

  if (args["user-email"]) {
    const user = await prisma.user.findUnique({
      where: { email: args["user-email"] },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw new Error(`user-email '${args["user-email"]}' 사용자를 찾을 수 없습니다.`);
    return user;
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
    orderBy: { id: "asc" },
    take: 2,
  });
  if (users.length === 0) throw new Error("사용자가 없어 RAG 문서를 연결할 수 없습니다.");
  if (users.length > 1) {
    throw new Error("사용자가 여러 명입니다. --user-id 또는 --user-email을 지정해 주세요.");
  }
  return users[0];
}

async function resolveWorkspace(prisma, userId, args) {
  if (args["workspace-id"]) {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: args["workspace-id"],
          userId,
        },
      },
      include: {
        workspace: { select: { id: true, name: true } },
      },
    });
    if (!membership) {
      throw new Error(`workspace-id '${args["workspace-id"]}' 에 대한 멤버십이 없습니다.`);
    }
    return membership.workspace;
  }

  return null;
}

const args = parseArgs(process.argv.slice(2));
const usingDefaultFile = !args.file;
const filePath = resolve(
  process.cwd(),
  args.file ?? "docs/datasets/zeff-ai-rag-source-extended.md",
);
// --file을 지정했는데 --title/--file-name을 안 주면, 기본값("Extended" 문서 제목)으로
// 떨어져서 다른 문서를 그 문서 자리에 덮어써버리는 사고가 난다 — 파일명 기준으로
// 새 제목을 만들어 서로 다른 문서면 서로 다른 LibraryItem이 되도록 한다.
const fileName = args["file-name"] ?? (usingDefaultFile ? "zeff-ai-rag-source-extended.md" : basename(filePath));
const title = args.title ?? (usingDefaultFile ? "ZEFF AI RAG Source Extended" : fileName);

if (!existsSync(filePath)) {
  console.error(`RAG 원문 파일을 찾을 수 없습니다: ${filePath}`);
  process.exit(1);
}

const extractedText = readFileSync(filePath, "utf8").trim();
if (!extractedText) {
  console.error("RAG 원문 파일이 비어 있습니다.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

try {
  const user = await resolveUser(prisma, args);
  const workspace = await resolveWorkspace(prisma, user.id, args);
  const workspaceId = workspace?.id ?? null;
  const chunks = chunkText(extractedText);
  const { vectors, provider } = await embedTexts(chunks.map((c) => c.content));

  const existing = await prisma.libraryItem.findFirst({
    where: {
      userId: user.id,
      workspaceId,
      title,
    },
    select: { id: true },
  });

  const item = existing
    ? await prisma.libraryItem.update({
        where: { id: existing.id },
        data: {
          title,
          fileUrl: `local://${fileName}`,
          fileName,
          mimeType: "text/markdown",
          extractedText,
        },
      })
    : await prisma.libraryItem.create({
        data: {
          userId: user.id,
          workspaceId,
          title,
          fileUrl: `local://${fileName}`,
          fileName,
          mimeType: "text/markdown",
          extractedText,
        },
      });

  await prisma.$transaction([
    prisma.documentChunk.deleteMany({ where: { libraryItemId: item.id } }),
    prisma.documentChunk.createMany({
      data: chunks.map((chunk, i) => ({
        libraryItemId: item.id,
        userId: user.id,
        workspaceId,
        idx: chunk.idx,
        content: chunk.content,
        embedding: vectors[i] ?? [],
        provider,
      })),
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        libraryItemId: item.id,
        title,
        user: { id: user.id, email: user.email ?? null, name: user.name ?? null },
        workspace: workspace ? { id: workspace.id, name: workspace.name } : null,
        filePath,
        chunks: chunks.length,
        provider,
      },
      null,
      2,
    ),
  );
} catch (err) {
  console.error("[rag-index] 실패:", err?.message ?? err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
