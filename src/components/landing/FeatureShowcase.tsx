"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Play,
  Presentation,
  Table2,
  Check,
  MessagesSquare,
} from "lucide-react";
import { useLocalCopy } from "@/lib/useLocalCopy";
import type { LandingLanguage } from "@/lib/landingI18n";
import { useScrollProgress, stickySceneIndex, sceneLocalProgress } from "@/lib/landingScroll";

type Item = { no: string; tag: string; title: string; desc: string };
type ShowcaseCopy = { title: string; subtitle: string; items: Item[] };

const COPY: Partial<Record<LandingLanguage, ShowcaseCopy>> & { en: ShowcaseCopy } = {
  ko: {
    title: "이럴 때, Zeff",
    subtitle: "화면 안에서 실제로 매일 쓰이는 기능만 골라 담았습니다.",
    items: [
      {
        no: "01",
        tag: "AI 요약",
        title: "자료를 넣으면, 핵심만 남습니다",
        desc: "수업 자료나 PDF를 올리면 시험에 나올 법한 핵심을 정리해 요약본으로 돌려줍니다. 요약 옆의 퀴즈·개념·메모 탭으로 복습까지 자연스럽게 이어집니다.",
      },
      {
        no: "02",
        tag: "강의 분석",
        title: "영상과 음성을, 한 장의 노트로",
        desc: "강의 영상 링크 하나면 충분합니다. 화면 속 판서와 말소리를 함께 읽어 하나의 정리된 노트로 묶어 드립니다.",
      },
      {
        no: "03",
        tag: "문서 · 발표자료",
        title: "핵심만 던지면, 초안이 완성됩니다",
        desc: "필요한 내용만 알려 주면 워드·PPT·엑셀 초안을 만들고, 우측 패널에서 바로 열어 미리볼 수 있습니다. 표와 서식까지 고려해 받은 그대로 다듬어 쓰기 좋습니다.",
      },
      {
        no: "04",
        tag: "공유 서재",
        title: "내 자료와 팀 자료를 한곳에서",
        desc: "개인 서재와 팀 워크스페이스 공유 서재를 나눠 관리하고, Book Chat으로 문서와 바로 대화할 수 있습니다.",
      },
    ],
  },
  en: {
    title: "This is where Zeff fits",
    subtitle: "We picked only the features people actually reach for every day.",
    items: [
      {
        no: "01",
        tag: "AI Summary",
        title: "Drop in the material, keep only what matters",
        desc: "Upload lecture notes or a PDF and get back a summary of the points most likely to show up on a test. Quiz, concept, and memo tabs sit right beside it, so review flows on naturally.",
      },
      {
        no: "02",
        tag: "Lecture Analysis",
        title: "Video and audio, into a single note",
        desc: "One lecture link is enough. Zeff reads the writing on screen and the spoken words together and ties them into one organized note.",
      },
      {
        no: "03",
        tag: "Docs · Slides",
        title: "Give the gist, get a draft",
        desc: "Tell it just what you need and get Word, PPT, or Excel drafts — then open them in the right-hand panel to preview. Formatting and tables included, ready to polish as-is.",
      },
      {
        no: "04",
        tag: "Shared Library",
        title: "Personal and team materials, together",
        desc: "Keep a personal library and a team workspace shared library, then chat with any document through Book Chat.",
      },
    ],
  },
  ja: {
    title: "こんな時、Zeff",
    subtitle: "画面の中で実際に毎日使われる機能だけを厳選しました。",
    items: [
      {
        no: "01",
        tag: "AI要約",
        title: "資料を入れると、要点だけが残ります",
        desc: "授業資料やPDFをアップロードすると、テストに出そうな要点をまとめた要約を返します。要約の横のクイズ・概念・メモタブで復習まで自然につながります。",
      },
      {
        no: "02",
        tag: "講義分析",
        title: "映像と音声を、一枚のノートに",
        desc: "講義動画のリンク一つで十分です。画面上の板書と話し声を一緒に読み取り、一つの整理されたノートにまとめます。",
      },
      {
        no: "03",
        tag: "文書・発表資料",
        title: "要点を伝えるだけで、下書きが完成します",
        desc: "必要な内容だけ伝えれば、Word・PPT・Excelの下書きを作成し、右側パネルですぐに開いてプレビューできます。表や書式まで考慮されているので、そのまま仕上げて使いやすいです。",
      },
      {
        no: "04",
        tag: "共有ライブラリ",
        title: "自分の資料とチームの資料を一か所で",
        desc: "個人ライブラリとチームワークスペースの共有ライブラリを分けて管理し、Book Chatで文書とすぐに対話できます。",
      },
    ],
  },
  zh: {
    title: "这些场景，交给 Zeff",
    subtitle: "只挑选了大家在屏幕中每天真正会用到的功能。",
    items: [
      {
        no: "01",
        tag: "AI摘要",
        title: "放入资料，只留下重点",
        desc: "上传课堂资料或PDF，即可获得整理好的、可能出现在考试中的重点摘要。摘要旁的测验·概念·笔记标签，让复习自然衔接。",
      },
      {
        no: "02",
        tag: "讲座分析",
        title: "把视频和音频，整理成一份笔记",
        desc: "只需一个讲座视频链接即可。Zeff 会同时读取画面中的板书和讲话内容，整理成一份条理清晰的笔记。",
      },
      {
        no: "03",
        tag: "文档·演示文稿",
        title: "只需说出重点，草稿即可完成",
        desc: "只要告诉它你需要的内容，就能生成 Word·PPT·Excel 草稿，并可在右侧面板中直接打开预览。表格和格式也一并处理好，拿到手即可直接修改使用。",
      },
      {
        no: "04",
        tag: "共享资料库",
        title: "把个人资料和团队资料放在一处",
        desc: "分别管理个人资料库与团队工作区共享资料库，并可通过 Book Chat 直接与文档对话。",
      },
    ],
  },
  ru: {
    title: "Вот для чего Zeff",
    subtitle: "Мы отобрали только те функции, которыми реально пользуются каждый день.",
    items: [
      {
        no: "01",
        tag: "ИИ-конспект",
        title: "Загрузите материал — останется только суть",
        desc: "Загрузите конспект лекции или PDF и получите сводку ключевых моментов, которые могут встретиться на экзамене. Рядом со сводкой — вкладки викторины, понятий и заметок, так что повторение продолжается естественным образом.",
      },
      {
        no: "02",
        tag: "Анализ лекций",
        title: "Видео и звук — в единый конспект",
        desc: "Достаточно одной ссылки на видео лекции. Zeff считывает запись на экране и произнесённые слова вместе и объединяет их в один структурированный конспект.",
      },
      {
        no: "03",
        tag: "Документы и презентации",
        title: "Опишите суть — получите черновик",
        desc: "Просто скажите, что нужно, и получите черновик в Word, PPT или Excel — затем откройте его в панели справа для предпросмотра. Форматирование и таблицы уже учтены, можно сразу дорабатывать.",
      },
      {
        no: "04",
        tag: "Общая библиотека",
        title: "Личные и командные материалы — вместе",
        desc: "Ведите отдельно личную библиотеку и общую библиотеку командного рабочего пространства, а через Book Chat общайтесь с любым документом напрямую.",
      },
    ],
  },
  de: {
    title: "Genau dafür ist Zeff da",
    subtitle: "Wir haben nur die Funktionen ausgewählt, die im Alltag wirklich genutzt werden.",
    items: [
      {
        no: "01",
        tag: "KI-Zusammenfassung",
        title: "Material rein, nur das Wesentliche bleibt",
        desc: "Laden Sie Vorlesungsunterlagen oder ein PDF hoch und erhalten Sie eine Zusammenfassung der Punkte, die wahrscheinlich in einer Prüfung drankommen. Direkt daneben helfen Quiz-, Konzept- und Notiz-Tabs beim Wiederholen.",
      },
      {
        no: "02",
        tag: "Vorlesungsanalyse",
        title: "Video und Ton, in einer einzigen Notiz",
        desc: "Ein Link zur Vorlesung genügt. Zeff liest Tafelbild und gesprochenes Wort gemeinsam und fasst beides in einer strukturierten Notiz zusammen.",
      },
      {
        no: "03",
        tag: "Dokumente · Präsentationen",
        title: "Nur das Wesentliche nennen, der Entwurf ist fertig",
        desc: "Sagen Sie einfach, was Sie brauchen, und erhalten Sie Entwürfe für Word, PPT oder Excel — direkt im rechten Panel zur Vorschau geöffnet. Tabellen und Formatierung sind schon berücksichtigt, bereit zum direkten Weiterbearbeiten.",
      },
      {
        no: "04",
        tag: "Geteilte Bibliothek",
        title: "Eigene und Team-Materialien an einem Ort",
        desc: "Verwalten Sie eine persönliche Bibliothek getrennt von der geteilten Bibliothek des Team-Workspace und sprechen Sie über Book Chat direkt mit jedem Dokument.",
      },
    ],
  },
  fr: {
    title: "C'est là que Zeff intervient",
    subtitle: "Nous n'avons retenu que les fonctions réellement utilisées au quotidien.",
    items: [
      {
        no: "01",
        tag: "Résumé IA",
        title: "Déposez le contenu, ne gardez que l'essentiel",
        desc: "Importez des notes de cours ou un PDF et recevez un résumé des points les plus susceptibles de tomber à l'examen. Les onglets quiz, concepts et notes juste à côté prolongent naturellement la révision.",
      },
      {
        no: "02",
        tag: "Analyse de cours",
        title: "Vidéo et audio réunis en une seule note",
        desc: "Un simple lien vers la vidéo du cours suffit. Zeff lit ensemble ce qui est écrit à l'écran et ce qui est dit, puis réunit le tout en une note organisée.",
      },
      {
        no: "03",
        tag: "Documents · Présentations",
        title: "Donnez l'essentiel, obtenez un brouillon",
        desc: "Indiquez simplement ce dont vous avez besoin pour obtenir des brouillons Word, PPT ou Excel, à ouvrir directement dans le panneau de droite pour les prévisualiser. Mise en forme et tableaux inclus, prêts à être peaufinés tels quels.",
      },
      {
        no: "04",
        tag: "Bibliothèque partagée",
        title: "Vos documents et ceux de l'équipe, au même endroit",
        desc: "Gérez séparément une bibliothèque personnelle et la bibliothèque partagée de l'espace de travail d'équipe, et discutez directement avec n'importe quel document via Book Chat.",
      },
    ],
  },
  es: {
    title: "Para esto está Zeff",
    subtitle: "Elegimos solo las funciones que realmente se usan todos los días.",
    items: [
      {
        no: "01",
        tag: "Resumen con IA",
        title: "Sube el material, quédate solo con lo esencial",
        desc: "Sube apuntes de clase o un PDF y recibe un resumen de los puntos con más probabilidad de aparecer en un examen. Las pestañas de cuestionario, conceptos y notas justo al lado hacen que el repaso fluya de forma natural.",
      },
      {
        no: "02",
        tag: "Análisis de clases",
        title: "Video y audio, en una sola nota",
        desc: "Basta con un enlace al video de la clase. Zeff lee lo escrito en pantalla y lo hablado en conjunto, y lo une en una nota organizada.",
      },
      {
        no: "03",
        tag: "Documentos · Presentaciones",
        title: "Indica lo esencial y obtén un borrador",
        desc: "Dile solo lo que necesitas y obtén borradores en Word, PPT o Excel, listos para abrir y previsualizar en el panel derecho. Incluye tablas y formato, listos para pulir tal cual.",
      },
      {
        no: "04",
        tag: "Biblioteca compartida",
        title: "Tu material y el del equipo, en un solo lugar",
        desc: "Gestiona por separado tu biblioteca personal y la biblioteca compartida del espacio de equipo, y conversa directamente con cualquier documento mediante Book Chat.",
      },
    ],
  },
};

/* 기능 미리보기 목업 — 회색 스켈레톤 막대가 아니라 실제 제품 UI처럼 보이도록
   문서 구조·파형·미니 차트·표 등 시각 요소로 밀도와 사실성을 높였다. 문구는
   로케일에 종속되지 않게 최소화하고 형태로 의미를 전달한다.
   (라이트: 겉 카드는 border-slate-200+bg-white → 전역 규칙으로 slate-50 면이 되고,
    안쪽 패널은 bg-white 흰 면으로 얹혀 다크 모드처럼 면의 위계가 생긴다.) */

// 요약 패널의 라인 — width로 자연스러운 문단 리듬을 준다.
function TextLine({ w, tone = "base" }: { w: string; tone?: "base" | "faint" | "accent" }) {
  const bg =
    tone === "accent"
      ? "bg-blue-200/80 dark:bg-blue-500/30"
      : tone === "faint"
        ? "bg-slate-100 dark:bg-slate-800"
        : "bg-slate-200 dark:bg-slate-700/80";
  return <div className={`h-1.5 rounded-full ${bg}`} style={{ width: w }} />;
}

function MockSummary({ progress = 1 }: { progress?: number }) {
  const bullets = ["핵심 개념 3개", "시험 출제 포인트", "복습 체크리스트"];
  const visibleBullets = Math.max(1, Math.ceil(progress * bullets.length));
  return (
    <div className="relative flex gap-4">
      {/* PDF stack */}
      <div className="relative h-36 w-24 shrink-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-x-0 rounded border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
            style={{ top: i * 6, height: "7.5rem", transform: `rotate(${i * 2 - 2}deg)`, zIndex: 3 - i }}
          >
            <div className="border-b border-slate-100 px-2 py-1 dark:border-slate-800">
              <span className="inline-block rounded bg-rose-100 px-1 py-0.5 text-[7px] font-bold text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">PDF</span>
            </div>
            <div className="space-y-1 p-2">
              <TextLine w="90%" tone="faint" />
              <TextLine w="75%" tone="faint" />
              <TextLine w="85%" tone="faint" />
            </div>
          </div>
        ))}
      </div>
      {/* 3 bullets */}
      <div className="flex min-w-0 flex-1 flex-col justify-center space-y-2">
        {bullets.slice(0, visibleBullets).map((label, i) => (
          <div key={label} className="flex items-start gap-2">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-slate-700 dark:text-slate-200">{label}</p>
              <TextLine w={`${88 - i * 6}%`} tone={i === 0 ? "accent" : "faint"} />
            </div>
          </div>
        ))}
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-blue-600 dark:bg-blue-400" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function MockLecture({ progress = 0.65 }: { progress?: number }) {
  const wave = [28, 52, 38, 68, 88, 58, 42, 72, 48, 82, 62, 36, 54, 78, 56, 32, 46, 70];
  const activeCount = Math.floor(progress * wave.length);
  return (
    <div className="space-y-3">
      <div className="flex h-10 items-end gap-[2px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
        {wave.map((h, i) => (
          <span
            key={i}
            className={`w-full rounded-sm ${i < activeCount ? "bg-slate-800 dark:bg-slate-200" : "bg-slate-200 dark:bg-slate-700"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Play className="h-3 w-3 text-slate-500" fill="currentColor" />
          <span className="font-mono text-[9px] tabular-nums text-slate-400">08:12</span>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
          판서와 음성을 함께 읽어 한 장의 노트로 정리합니다.
        </p>
        <div className="mt-2 space-y-1">
          <TextLine w="92%" tone="faint" />
          <TextLine w="78%" tone="faint" />
        </div>
      </div>
    </div>
  );
}

function MockDocs({ slideIndex = 0 }: { slideIndex?: number }) {
  const tabs = [
    { id: "docx", label: "DOCX", Icon: FileText },
    { id: "pptx", label: "PPTX", Icon: Presentation },
    { id: "xlsx", label: "XLSX", Icon: Table2 },
  ] as const;
  const activeTab = slideIndex % 3;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {tabs.map(({ id, label, Icon }, i) => (
          <span
            key={id}
            className={`flex flex-1 items-center justify-center gap-1 px-2 py-2 text-[9px] font-semibold ${
              i === activeTab
                ? "border-b-2 border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100"
                : "text-slate-400"
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </span>
        ))}
      </div>
      <div className="p-3">
        {activeTab === 0 && (
          <div className="space-y-2">
            <TextLine w="65%" />
            <TextLine w="100%" tone="faint" />
            <TextLine w="88%" tone="faint" />
            <div className="mt-2 overflow-hidden rounded border border-slate-200 dark:border-slate-700">
              {[0, 1].map((r) => (
                <div key={r} className="flex divide-x divide-slate-200 dark:divide-slate-700">
                  {[0, 1, 2].map((c) => (
                    <div key={c} className={`h-4 flex-1 ${r === 0 ? "bg-slate-100 dark:bg-slate-800" : "bg-white dark:bg-slate-900"}`} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 1 && (
          <div className="space-y-2">
            <TextLine w="50%" />
            <div className="flex h-14 items-end gap-1.5 pt-1">
              {[40, 65, 50, 85, 55].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-slate-700 dark:bg-slate-300" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        )}
        {activeTab === 2 && (
          <div className="space-y-1 font-mono text-[9px]">
            {["A1", "B1", "C1"].map((cell, i) => (
              <div key={cell} className="flex gap-2 border-b border-slate-100 py-1 dark:border-slate-800">
                <span className="w-6 text-slate-400">{cell}</span>
                <span className={`h-1.5 flex-1 rounded ${i === 1 ? "bg-slate-800 dark:bg-slate-200" : "bg-slate-200 dark:bg-slate-700"}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MockLibrary() {
  const books = [
    { spine: "PDF", h: "h-14", color: "bg-rose-200 dark:bg-rose-500/30" },
    { spine: "DOC", h: "h-16", color: "bg-blue-200 dark:bg-blue-500/30" },
    { spine: "XLS", h: "h-12", color: "bg-emerald-200 dark:bg-emerald-500/30" },
    { spine: "PPT", h: "h-14", color: "bg-amber-200 dark:bg-amber-500/30" },
  ];
  return (
    <div className="relative">
      <div className="flex items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 pb-3 pt-8 dark:border-slate-700 dark:bg-slate-900/60">
        <div className="absolute inset-x-4 bottom-3 h-1 rounded bg-slate-300 dark:bg-slate-600" aria-hidden />
        {books.map((b) => (
          <div
            key={b.spine}
            className={`relative z-10 flex w-8 flex-col items-center justify-end rounded-t-sm border border-slate-300 ${b.color} ${b.h} dark:border-slate-600`}
          >
            <span className="mb-1 rotate-180 font-mono text-[7px] font-bold tracking-wider text-slate-600 [writing-mode:vertical-rl] dark:text-slate-300">
              {b.spine}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute -right-1 top-2 max-w-[9rem] rounded-xl rounded-bl-sm border border-slate-200 bg-white px-2.5 py-2 shadow-lg dark:border-slate-600 dark:bg-slate-800">
        <div className="flex items-center gap-1">
          <MessagesSquare className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-200">Book Chat</span>
        </div>
        <p className="mt-1 text-[8px] leading-snug text-slate-500 dark:text-slate-400">
          이 문서에서 핵심 요약을 알려줘
        </p>
      </div>
    </div>
  );
}

const MOCKS = [MockSummary, MockLecture, MockDocs, MockLibrary];

function ProgressRing({ index, active, done, progress }: { index: number; active: boolean; done: boolean; progress: number }) {
  const pct = active ? progress * 100 : done ? 100 : 0;
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex h-11 w-11 items-center justify-center">
      <svg className="-rotate-90" width="44" height="44" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="3" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          className="stroke-blue-600 dark:stroke-blue-400"
          strokeWidth="3"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute text-[10px] font-bold ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}

function MockWithProgress({ index, localP }: { index: number; localP: number }) {
  if (index === 0) return <MockSummary progress={localP} />;
  if (index === 1) return <MockLecture progress={localP} />;
  if (index === 2) return <MockDocs slideIndex={Math.floor(localP * 5)} />;
  return <MockLibrary />;
}

function StaticShowcase({ copy }: { copy: ShowcaseCopy }) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">{copy.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-400">{copy.subtitle}</p>
        </div>
        <div className="mt-16 space-y-16">
          {copy.items.map((item, i) => {
            const Mock = MOCKS[i];
            const reversed = i % 2 === 1;
            return (
              // reduced-motion 폴백은 애니메이션을 쓰지 않는다. 이전엔 whileInView+opacity:0라
              // 동작 줄이기를 켠 사용자(특히 iOS)에게 콘텐츠가 안 보이는 경로가 됐다.
              <div key={item.no} className="grid items-center gap-8 md:grid-cols-2">
                <div className={reversed ? "md:order-2" : ""}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400">{item.no}</span>
                    <span className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">{item.tag}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">{item.desc}</p>
                </div>
                <div className={reversed ? "md:order-1" : ""}><Mock /></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function FeatureShowcase() {
  const copy = useLocalCopy(COPY);
  const { sectionRef, p, reducedMotion, mounted } = useScrollProgress<HTMLElement>({ topOffset: 72 });
  const count = MOCKS.length;
  const prevIdx = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const next = stickySceneIndex(p, count, 0.1, prevIdx.current);
    prevIdx.current = next;
    setActiveIndex(next);
  }, [p, count]);

  const item = copy.items[activeIndex]!;
  const localP = sceneLocalProgress(p, count, activeIndex);

  if (reducedMotion) return <StaticShowcase copy={copy} />;

  return (
    <section
      ref={sectionRef}
      // 배경을 직접 칠하지 않는다 — 불투명 배경은 .landing-shell의 공용 표면을 440vh 동안
      // 덮어버려 고정 헤더 뒤가 순백이 되고 경계선이 생겼다. 공용 표면이 비치게 둔다.
      className="relative h-[440vh]"
    >
      <div className="sticky top-0 flex min-h-[100svh] items-center overflow-hidden py-20 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,rgba(37,99,235,0.10),transparent_38%)] dark:bg-[radial-gradient(circle_at_75%_45%,rgba(59,130,246,0.14),transparent_38%)]"
        />
        <div className="relative mx-auto w-full max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">{copy.title}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-400">{copy.subtitle}</p>
          </div>
          <div className="mt-10 grid items-center gap-8 md:mt-14 md:grid-cols-[0.88fr_1.12fr] md:gap-12">
            <motion.div key={item.no} initial={mounted ? { opacity: 0, y: 14 } : false} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400">{item.no}</span>
                <span className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">{item.tag}</span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">{item.desc}</p>
              <div className="mt-7 flex gap-3" aria-hidden>
                {copy.items.map((scene, index) => (
                  <ProgressRing
                    key={scene.no}
                    index={index}
                    active={index === activeIndex}
                    done={index < activeIndex}
                    progress={index === activeIndex ? localP : 0}
                  />
                ))}
              </div>
            </motion.div>

            <div className="relative h-[min(22rem,50vh)] min-h-[16rem]">
              {MOCKS.map((_, i) => {
                const offset = i - activeIndex;
                const isPast = i < activeIndex;
                const isActive = i === activeIndex;
                if (offset > 2 || offset < -1) return null;
                return (
                  <motion.div
                    key={i}
                    animate={{
                      opacity: isActive ? 1 : isPast ? 0 : 0.35,
                      scale: isActive ? 1 : 0.94 - Math.abs(offset) * 0.02,
                      y: offset * 14,
                      zIndex: 10 - Math.abs(offset),
                    }}
                    className={`absolute inset-x-0 top-0 landing-card rounded-2xl p-3 sm:p-4 ${!isActive ? "pointer-events-none blur-[1px]" : "shadow-xl"}`}
                  >
                    <MockWithProgress index={i} localP={isActive ? localP : 1} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
