import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const BACKUP_MAGIC = Buffer.from("ZEFF");
const PBKDF2_ITERATIONS = 100_000;

export type BackupPayload = {
  version: 1;
  exportedAt: string;
  database: Record<string, unknown[]>;
  blobRefs: Array<{ url: string; fileName?: string | null; source: string }>;
};

/** Prisma 전 테이블 JSON export (서버리스 pg_dump 대체) */
export async function exportDatabaseJson(): Promise<BackupPayload["database"]> {
  const [
    users,
    accounts,
    sessions,
    verificationTokens,
    historyItems,
    chatSessions,
    chatHistory,
    answerFeedbacks,
    userAiProfiles,
    learnedQaPairs,
    userMemories,
    libraryItems,
    documentChunks,
    reviewCards,
    verificationCodes,
    inquiries,
    workspaces,
    workspaceMembers,
    workspaceInvites,
    userSettings,
    systemConfigs,
    globalCounters,
    rateLimitHits,
    orders,
    savedPaymentMethods,
    usageCounters,
    workBoardTasks,
    savedInsights,
    referrals,
    loginEvents,
    adminAuditLogs,
    backupRecords,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.account.findMany(),
    prisma.session.findMany(),
    prisma.verificationToken.findMany(),
    prisma.historyItem.findMany(),
    prisma.chatSession.findMany(),
    prisma.chatHistory.findMany(),
    prisma.answerFeedback.findMany(),
    prisma.userAiProfile.findMany(),
    prisma.learnedQaPair.findMany(),
    prisma.userMemory.findMany(),
    prisma.libraryItem.findMany(),
    prisma.documentChunk.findMany(),
    prisma.reviewCard.findMany(),
    prisma.verificationCode.findMany(),
    prisma.inquiry.findMany(),
    prisma.workspace.findMany(),
    prisma.workspaceMember.findMany(),
    prisma.workspaceInvite.findMany(),
    prisma.userSettings.findMany(),
    prisma.systemConfig.findMany(),
    prisma.globalCounter.findMany(),
    prisma.rateLimitHit.findMany(),
    prisma.order.findMany(),
    prisma.savedPaymentMethod.findMany(),
    prisma.usageCounter.findMany(),
    prisma.workBoardTask.findMany(),
    prisma.savedInsight.findMany(),
    prisma.referral.findMany(),
    prisma.loginEvent.findMany(),
    prisma.adminAuditLog.findMany(),
    prisma.backupRecord.findMany(),
  ]);

  return {
    User: users,
    Account: accounts,
    Session: sessions,
    VerificationToken: verificationTokens,
    HistoryItem: historyItems,
    ChatSession: chatSessions,
    ChatHistory: chatHistory,
    AnswerFeedback: answerFeedbacks,
    UserAiProfile: userAiProfiles,
    LearnedQaPair: learnedQaPairs,
    UserMemory: userMemories,
    LibraryItem: libraryItems,
    DocumentChunk: documentChunks,
    ReviewCard: reviewCards,
    VerificationCode: verificationCodes,
    Inquiry: inquiries,
    Workspace: workspaces,
    WorkspaceMember: workspaceMembers,
    WorkspaceInvite: workspaceInvites,
    UserSettings: userSettings,
    SystemConfig: systemConfigs,
    GlobalCounter: globalCounters,
    RateLimitHit: rateLimitHits,
    Order: orders,
    SavedPaymentMethod: savedPaymentMethods,
    UsageCounter: usageCounters,
    WorkBoardTask: workBoardTasks,
    SavedInsight: savedInsights,
    Referral: referrals,
    LoginEvent: loginEvents,
    AdminAuditLog: adminAuditLogs,
    BackupRecord: backupRecords,
  };
}

export async function collectBlobRefs(): Promise<BackupPayload["blobRefs"]> {
  const refs: BackupPayload["blobRefs"] = [];
  const [library, history, chat, inquiries] = await Promise.all([
    prisma.libraryItem.findMany({ select: { fileUrl: true, fileName: true } }),
    prisma.historyItem.findMany({
      where: { fileUrl: { not: null } },
      select: { fileUrl: true, fileName: true },
    }),
    prisma.chatHistory.findMany({
      where: { fileUrl: { not: null } },
      select: { fileUrl: true, fileName: true },
    }),
    prisma.inquiry.findMany({
      where: { fileUrl: { not: null } },
      select: { fileUrl: true, fileName: true },
    }),
  ]);

  for (const row of library) {
    refs.push({ url: row.fileUrl, fileName: row.fileName, source: "LibraryItem" });
  }
  for (const row of history) {
    if (row.fileUrl) refs.push({ url: row.fileUrl, fileName: row.fileName, source: "HistoryItem" });
  }
  for (const row of chat) {
    if (row.fileUrl) refs.push({ url: row.fileUrl, fileName: row.fileName, source: "ChatHistory" });
  }
  for (const row of inquiries) {
    if (row.fileUrl) refs.push({ url: row.fileUrl, fileName: row.fileName, source: "Inquiry" });
  }

  const seen = new Set<string>();
  return refs.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

export async function buildBackupPayload(): Promise<BackupPayload> {
  const [database, blobRefs] = await Promise.all([exportDatabaseJson(), collectBlobRefs()]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    database,
    blobRefs,
  };
}

export function encryptBackupJson(payload: BackupPayload, password: string): Buffer {
  const plain = Buffer.from(JSON.stringify(payload), "utf8");
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, "sha256");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([BACKUP_MAGIC, salt, iv, tag, encrypted]);
}

export function backupFileName(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}_zeff-backup.enc`;
}
