"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { Download, Apple, Monitor, HardDrive, Cpu, MemoryStick, CheckCircle2, Package, ExternalLink, Loader2 } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/ui/Logo";
import { useLocalCopy } from "@/lib/useLocalCopy";
import {
  WINDOWS_DOWNLOAD_URL,
  MAC_DOWNLOAD_URL,
  WINDOWS_FILENAME,
  MAC_FILENAME,
  ALL_RELEASES_URL,
  APP_VERSION,
  SYSTEM_REQUIREMENTS,
  REPO_SLUG,
} from "@/lib/constants";

type OS = "windows" | "mac" | "other";

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 5.1 10.5 4v7.5H3V5.1Zm0 13.8L10.5 20v-7.4H3v6.3ZM11.6 3.85 21 2.5v9H11.6V3.85Zm0 16.3L21 21.5v-9H11.6v7.65Z" />
    </svg>
  );
}

type GhAsset = { name: string; browser_download_url: string; size: number };
type GhRelease = {
  id: number;
  tag_name: string;
  name: string | null;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  assets: GhAsset[];
};

const COPY = {
  ko: {
    title: "ZEFF AI 다운로드",
    subtitle: "설치 파일을 내려받아 실행하면 바로 사용할 수 있습니다.",
    recommended: "현재 기기에 권장",
    windows: "Windows용 다운로드",
    mac: "macOS용 다운로드",
    fileLabel: "설치 파일",
    reqTitle: "시스템 요구사항",
    reqOs: "운영체제",
    reqCpu: "프로세서",
    reqRam: "메모리",
    reqDisk: "저장공간",
    howto: "내려받은 설치 파일을 실행하고 화면 안내에 따라 설치하세요. Windows는 .exe, macOS는 .dmg 파일입니다.",
    olderTitle: "이전 버전",
    olderDesc: "이전 버전이 필요하신 경우 아래에서 내려받을 수 있습니다. 이전 버전은 보안 업데이트가 제공되지 않을 수 있어, 가능하면 최신 버전 사용을 권장합니다.",
    olderLoading: "이전 버전을 불러오는 중...",
    olderEmpty: "아직 게시된 이전 버전이 없습니다. 최신 버전을 사용해 주세요.",
    archive: "전체 릴리스 보기",
    latest: "최신",
    version: "버전",
    released: "게시일",
    download: "다운로드",
    notesNote: "설치 파일이 아직 게시되지 않은 경우 다운로드 링크는 릴리스 게시 후 동작합니다.",
  },
  en: {
    title: "Download ZEFF AI",
    subtitle: "Download the installer, run it, and you're ready to go.",
    recommended: "Recommended for your device",
    windows: "Download for Windows",
    mac: "Download for macOS",
    fileLabel: "Installer",
    reqTitle: "System requirements",
    reqOs: "OS",
    reqCpu: "Processor",
    reqRam: "Memory",
    reqDisk: "Storage",
    howto: "Run the downloaded installer and follow the on-screen steps. Windows uses a .exe file, macOS a .dmg file.",
    olderTitle: "Previous versions",
    olderDesc: "Need an older version? Download it below. Older versions may not receive security updates, so use the latest version when possible.",
    olderLoading: "Loading previous versions...",
    olderEmpty: "No previous versions have been published yet. Please use the latest version.",
    archive: "View all releases",
    latest: "Latest",
    version: "Version",
    released: "Released",
    download: "Download",
    notesNote: "If installers aren't published yet, the download links will start working once a release is posted.",
  },
};

function formatSize(bytes: number): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function DownloadPage() {
  const c = useLocalCopy(COPY);
  const [os, setOs] = useState<OS>("other");
  const [releases, setReleases] = useState<GhRelease[] | null>(null);
  const [loadingReleases, setLoadingReleases] = useState(true);

  useEffect(() => {
    (async () => {
      const ua = navigator.userAgent;
      if (/Win/i.test(ua)) setOs("windows");
      else if (/Mac/i.test(ua)) setOs("mac");
    })();
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/${REPO_SLUG}/releases?per_page=20`, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) throw new Error("failed");
        const data: GhRelease[] = await res.json();
        if (!ignore) setReleases(Array.isArray(data) ? data : []);
      } catch {
        if (!ignore) setReleases([]);
      } finally {
        if (!ignore) setLoadingReleases(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const platforms = [
    {
      id: "windows" as const,
      name: "Windows",
      icon: WindowsIcon,
      cta: c.windows,
      url: WINDOWS_DOWNLOAD_URL,
      filename: WINDOWS_FILENAME,
      req: SYSTEM_REQUIREMENTS.windows,
    },
    {
      id: "mac" as const,
      name: "macOS",
      icon: Apple,
      cta: c.mac,
      url: MAC_DOWNLOAD_URL,
      filename: MAC_FILENAME,
      req: SYSTEM_REQUIREMENTS.mac,
    },
  ];

  // 이전 버전: 최신(첫 릴리스)을 제외한 나머지
  const olderReleases = (releases ?? []).slice(1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
          <BackButton fallbackHref="/" />
          <Link href="/" className="flex items-center">
            <Logo size="sm" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="rounded-full bg-blue-600/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
            {c.version} {APP_VERSION}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{c.title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{c.subtitle}</p>

        {/* 플랫폼별 다운로드 카드 */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {platforms.map((p) => {
            const isRecommended = os === p.id;
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border p-6 transition-colors ${
                  isRecommended
                    ? "border-blue-500 bg-white shadow-lg shadow-blue-600/10 dark:border-blue-500/60 dark:bg-slate-900"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                {isRecommended && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <CheckCircle2 className="h-3 w-3" />
                    {c.recommended}
                  </span>
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Icon className="h-6 w-6 text-slate-700 dark:text-slate-200" />
                </div>
                <h2 className="mt-4 text-lg font-bold">{p.name}</h2>
                <dl className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-3.5 w-3.5 shrink-0" /> {p.req.os}
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5 shrink-0" /> {c.fileLabel}: {p.filename}
                  </div>
                </dl>
                <a
                  href={p.url}
                  download
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500"
                >
                  <Download className="h-4 w-4" />
                  {p.cta}
                </a>
              </div>
            );
          })}
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          {c.howto}
        </p>

        {/* 상세 시스템 요구사항 표 */}
        <section className="mt-10">
          <h2 className="text-lg font-bold">{c.reqTitle}</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold"> </th>
                  <th className="px-4 py-3 font-semibold">Windows</th>
                  <th className="px-4 py-3 font-semibold">macOS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { icon: Monitor, label: c.reqOs, w: SYSTEM_REQUIREMENTS.windows.os, m: SYSTEM_REQUIREMENTS.mac.os },
                  { icon: Cpu, label: c.reqCpu, w: SYSTEM_REQUIREMENTS.windows.cpu, m: SYSTEM_REQUIREMENTS.mac.cpu },
                  { icon: MemoryStick, label: c.reqRam, w: SYSTEM_REQUIREMENTS.windows.ram, m: SYSTEM_REQUIREMENTS.mac.ram },
                  { icon: HardDrive, label: c.reqDisk, w: SYSTEM_REQUIREMENTS.windows.disk, m: SYSTEM_REQUIREMENTS.mac.disk },
                ].map(({ icon: Icon, label, w, m }) => (
                  <tr key={label} className="bg-white dark:bg-slate-900">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{w}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 이전 버전 */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{c.olderTitle}</h2>
            <a
              href={ALL_RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {c.archive}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{c.olderDesc}</p>

          <div className="mt-4 space-y-3">
            {loadingReleases ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {c.olderLoading}
              </div>
            ) : olderReleases.length === 0 ? (
              <p className="rounded-xl border border-slate-200 px-4 py-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {c.olderEmpty}
              </p>
            ) : (
              olderReleases.map((rel) => (
                <div
                  key={rel.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {rel.name || rel.tag_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {c.released} {new Date(rel.published_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rel.assets.length === 0 ? (
                        <a
                          href={rel.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-400/60 dark:border-slate-700 dark:text-slate-300"
                        >
                          {c.archive}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        rel.assets.map((a) => (
                          <a
                            key={a.name}
                            href={a.browser_download_url}
                            download
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600/10 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-600/20 dark:text-blue-300"
                          >
                            <Download className="h-3 w-3" />
                            {a.name.endsWith(".dmg") ? "macOS" : a.name.endsWith(".exe") ? "Windows" : a.name}
                            {a.size ? <span className="text-blue-500/70">· {formatSize(a.size)}</span> : null}
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">{c.notesNote}</p>
        </section>
      </div>
    </div>
  );
}
