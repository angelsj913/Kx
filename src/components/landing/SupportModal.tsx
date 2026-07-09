"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  LifeBuoy,
  ChevronDown,
  Mail,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { LANDING_MODE_STYLE } from "@/lib/landingTheme";
import type { AppMode } from "@/lib/tools";

const SUPPORT_FAQS = [
  {
    q: "로그인이 계속 안 돼요",
    a: "먼저 사용 중인 구글 계정에 다시 로그인해 보세요. 그래도 안 되면 앱을 완전히 종료했다가 다시 실행해 주세요. 회사·학교에서 발급받은 계정은 소속 기관의 보안 정책으로 외부 앱 로그인이 막혀 있는 경우도 있으니, 이땐 개인 구글 계정으로 시도해 보시는 것을 권장해요.",
  },
  {
    q: "만든 문서가 다운로드되지 않아요",
    a: "생성이 끝난 직후 바로 다운로드 버튼을 눌러보세요. 만약 그 순간을 놓쳤다면, 히스토리 화면에서 같은 결과물을 다시 찾아 내려받을 수 있습니다. 브라우저나 백신 프로그램이 다운로드를 차단하는 경우도 있으니 잠시 꺼두고 시도해 보는 것도 방법이에요.",
  },
  {
    q: "AI가 이상하거나 부정확한 답변을 줘요",
    a: "입력 내용을 조금 더 구체적으로 적을수록 결과 품질이 크게 좋아집니다. 예시 문장을 참고해서 상황과 원하는 결과를 함께 적어보세요. 특정 응답이 유독 이상하다면, 같은 요청을 한 번 더 실행해 보시는 것도 좋은 방법이에요.",
  },
  {
    q: "다른 기기에서 작업 내용이 안 보여요",
    a: "같은 구글 계정으로 로그인되어 있는지부터 확인해 주세요. 계정이 같다면 보통 몇 초 안에 동기화가 완료됩니다. 인터넷 연결이 불안정한 환경에서는 반영까지 조금 더 시간이 걸릴 수 있어요.",
  },
];

function FaqAccordion({ accentText, accentBorder }: { accentText: string; accentBorder: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-2.5">
      {SUPPORT_FAQS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={item.q}
            className={`overflow-hidden rounded-xl border transition-colors duration-300 ${
              isOpen ? accentBorder : "border-slate-700/50"
            } bg-slate-800/40`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors duration-200 ${
                isOpen ? accentText : "text-slate-100"
              }`}
            >
              {item.q}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-sm leading-relaxed text-slate-400">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

type SendState = "idle" | "sending" | "sent";

function InquiryForm({
  accentBg,
  ring,
}: {
  accentBg: string;
  ring: string;
}) {
  const [status, setStatus] = useState<SendState>("idle");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 900);
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-6 py-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-300" />
        <p className="text-sm font-semibold text-emerald-200">
          문의가 성공적으로 접수되었습니다
        </p>
        <p className="text-xs leading-relaxed text-emerald-300/80">
          입력하신 이메일로 확인 후 빠르게 답변드릴게요. 보통 영업일 기준 1~2일
          내에 회신됩니다.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setEmail("");
            setMessage("");
          }}
          className="mt-1 text-xs font-medium text-emerald-200 underline decoration-emerald-400/50 underline-offset-4 hover:text-emerald-100"
        >
          다른 문의 남기기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="support-email" className="mb-1.5 block text-xs font-medium text-slate-400">
          답변받으실 이메일
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="support-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`w-full rounded-xl border border-slate-700/60 bg-slate-800/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500 ${ring} focus-visible:ring-2`}
          />
        </div>
      </div>
      <div>
        <label htmlFor="support-message" className="mb-1.5 block text-xs font-medium text-slate-400">
          어떤 점이 궁금하거나 불편하셨나요?
        </label>
        <textarea
          id="support-message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="상황을 자세히 적어주실수록 더 정확하게 도와드릴 수 있어요."
          className={`w-full resize-none rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-500 ${ring} focus-visible:ring-2`}
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className={`flex w-full items-center justify-center gap-2 rounded-xl ${accentBg} px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70`}
      >
        {status === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            전송 중...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            문의 보내기
          </>
        )}
      </button>
    </form>
  );
}

export default function SupportModal({
  open,
  mode,
  onClose,
}: {
  open: boolean;
  mode: AppMode;
  onClose: () => void;
}) {
  const s = LANDING_MODE_STYLE[mode];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKey);
      };
    }
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="고객지원 센터"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border ${s.border} bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-md`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg} shadow-lg`}>
                  <LifeBuoy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-50">고객지원 센터</h2>
                  <p className={`text-xs font-medium ${s.accentText}`}>
                    {s.name} 화면으로 보고 있어요
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="닫기"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
              <section>
                <h3 className="text-sm font-semibold text-slate-200">
                  자주 겪는 문제부터 확인해 보세요
                </h3>
                <div className="mt-3">
                  <FaqAccordion accentText={s.accentText} accentBorder={s.border} />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-200">
                  해결되지 않으셨나요?
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  아래에 이메일과 상황을 남겨주시면 담당자가 직접 확인하고
                  답변드릴게요.
                </p>
                <div className="mt-4">
                  <InquiryForm accentBg={s.iconBg} ring={s.ring} />
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
