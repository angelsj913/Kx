"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  X,
  UserRound,
  SlidersHorizontal,
  ShieldCheck,
  CreditCard,
  FileCode,
  Keyboard,
  Languages,
  KeyRound,
} from "lucide-react";

type Tab = "general" | "account" | "privacy" | "billing" | "features" | "shortcuts" | "language";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "general", label: "일반", icon: SlidersHorizontal },
  { id: "account", label: "계정", icon: UserRound },
  { id: "privacy", label: "개인정보 보호", icon: ShieldCheck },
  { id: "billing", label: "결제", icon: CreditCard },
  { id: "features", label: "기능", icon: FileCode },
  { id: "shortcuts", label: "단축키", icon: Keyboard },
  { id: "language", label: "언어", icon: Languages },
];

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("general");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-[32rem] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <nav className="w-40 shrink-0 border-r border-slate-800/60 bg-slate-950/40 p-2 sm:w-48">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                tab === t.id ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/60"
              }`}
            >
              <t.icon className="h-4 w-4 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {tab === "general" && <GeneralTab />}
            {tab === "account" && <AccountTab />}
            {tab === "privacy" && <PrivacyTab />}
            {tab === "billing" && <BillingTab />}
            {tab === "features" && <FeaturesTab />}
            {tab === "shortcuts" && <ShortcutsTab />}
            {tab === "language" && <LanguageTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({
  label,
  desc,
  action,
}: {
  label: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800/60 bg-slate-800/30 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-100">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-slate-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

function MutedButton({
  children,
  danger = false,
  onClick,
}: {
  children: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
        danger
          ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
          : "border-slate-700/60 text-slate-300 hover:bg-slate-800/60"
      }`}
    >
      {children}
    </button>
  );
}

function GeneralTab() {
  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">일반</h2>
      <Section title="프로필">
        <Row label="이름·아바타" desc="표시 이름과 프로필 사진을 관리해요." action={<MutedButton>수정</MutedButton>} />
      </Section>
      <Section title="환경설정">
        <Row label="테마" desc="다크 모드로 고정되어 있어요." action={<MutedButton>준비 중</MutedButton>} />
      </Section>
    </>
  );
}

function AccountTab() {
  const { data: session } = useSession();
  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">계정</h2>
      <Section title="내 계정 정보">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-800/30 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500">
            <UserRound className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">{session?.user?.name ?? "사용자"}</p>
            <p className="truncate text-xs text-slate-500">{session?.user?.email ?? ""}</p>
          </div>
        </div>
        <Row
          label="비밀번호 변경"
          desc="구글 계정으로만 로그인 중이라면 해당 없음. 추후 웹사이트에서 연결됩니다."
          action={
            <button
              type="button"
              disabled
              className="shrink-0 rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              <KeyRound className="mr-1 inline h-3 w-3" />
              준비 중
            </button>
          }
        />
        <Row
          label="모든 기기에서 로그아웃"
          desc="이 계정으로 로그인된 다른 모든 기기에서 세션을 종료해요."
          action={<MutedButton onClick={() => signOut({ callbackUrl: "/" })}>로그아웃</MutedButton>}
        />
      </Section>
      <Section title="위험 구역">
        <Row
          label="계정 탈퇴"
          desc="모든 대화 기록과 생성물이 영구적으로 삭제돼요."
          action={<MutedButton danger>탈퇴</MutedButton>}
        />
      </Section>
    </>
  );
}

function PrivacyTab() {
  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">개인정보 보호</h2>
      <Section title="약관">
        <Row label="개인정보처리방침" action={<MutedButton>보기</MutedButton>} />
      </Section>
      <Section title="데이터">
        <Row
          label="데이터 및 메모리 관리"
          desc="대화 기록, 생성 결과물, 저장된 파일을 한 번에 관리해요."
          action={<MutedButton>관리</MutedButton>}
        />
      </Section>
    </>
  );
}

function BillingTab() {
  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">결제</h2>
      <Section title="결제 정보">
        <Row label="결제 수단" desc="등록된 결제 수단이 없어요." action={<MutedButton>등록</MutedButton>} />
        <Row label="청구서" desc="지난 청구 내역을 확인해요." action={<MutedButton>보기</MutedButton>} />
        <Row label="다음 청구일 / 금액" desc="무료 플랜 사용 중 — 청구 예정 없음" />
      </Section>
      <Section title="위험 구역">
        <Row label="결제수단 해지" action={<MutedButton danger>해지</MutedButton>} />
      </Section>
    </>
  );
}

function FeaturesTab() {
  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">기능</h2>
      <Section title="확장 기능">
        <Row
          label="코드 및 파일 사용"
          desc="대화 중 코드 실행, 문서 첨부 등 확장 기능을 켜고 꺼요."
          action={<MutedButton>설정</MutedButton>}
        />
      </Section>
    </>
  );
}

function ShortcutsTab() {
  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">단축키</h2>
      <Section title="자주 쓰는 동작">
        <Row label="새 대화" action={<kbd className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">⌘ N</kbd>} />
        <Row label="메시지 전송" action={<kbd className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">Enter</kbd>} />
        <Row label="설정 열기" action={<kbd className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">⌘ ,</kbd>} />
      </Section>
    </>
  );
}

function LanguageTab() {
  return (
    <>
      <h2 className="mb-4 text-lg font-bold text-slate-50">언어</h2>
      <Section title="표시 언어">
        <Row
          label="언어 변경"
          desc="현재 한국어로 표시되고 있어요."
          action={
            <select className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-200 outline-none">
              <option>한국어</option>
              <option>English</option>
            </select>
          }
        />
      </Section>
    </>
  );
}
