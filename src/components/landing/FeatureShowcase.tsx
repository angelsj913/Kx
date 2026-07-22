"use client";

import { motion } from "framer-motion";
import {
  FileText,
  ListChecks,
  Lightbulb,
  StickyNote,
  Play,
  Presentation,
  Sparkles,
  Users,
  Check,
} from "lucide-react";
import { useLocalCopy } from "@/lib/useLocalCopy";
import type { LandingLanguage } from "@/lib/landingI18n";
import { useScrollProgress, sceneIndex } from "@/lib/landingScroll";

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
  const summaryTabs = [
    { Icon: FileText, active: true },
    { Icon: ListChecks, active: false },
    { Icon: Lightbulb, active: false },
    { Icon: StickyNote, active: false },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-950 dark:shadow-none">
      <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300/80 dark:bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80 dark:bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80 dark:bg-slate-700" />
        <span className="ml-2 h-3 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-[1fr_1.1fr] gap-2.5 p-3">
        {/* 원본 문서 */}
        <div className="space-y-2 rounded-lg border border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-2 w-1/2 rounded bg-slate-300 dark:bg-slate-600" />
          <div className="space-y-1.5 pt-0.5">
            <TextLine w="100%" tone="faint" />
            <TextLine w="92%" tone="accent" />
            <TextLine w="98%" tone="faint" />
            <TextLine w="80%" tone="faint" />
            <TextLine w="88%" tone="faint" />
            <TextLine w="70%" tone="faint" />
          </div>
        </div>
        {/* AI 요약 */}
        <div className="space-y-2 rounded-lg border border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {summaryTabs.map(({ Icon, active }, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center justify-center rounded-md p-1 ${
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  }`}
                >
                  <Icon className="h-2.5 w-2.5" />
                </span>
              ))}
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              <Sparkles className="h-2 w-2" /> AI
            </span>
          </div>
          <div className="space-y-1.5 pt-0.5">
            {["96%", "88%", "92%", "78%"].map((w, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Check className="h-2.5 w-2.5 shrink-0 text-blue-500" />
                <TextLine w={w} tone={i === 1 ? "accent" : "base"} />
              </div>
            ))}
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockLecture({ progress = 0.65 }: { progress?: number }) {
  // 파형(오디오) — 높이가 다른 막대로 실제 음성 트랙처럼 보이게.
  const wave = [30, 55, 40, 70, 90, 60, 45, 75, 50, 85, 65, 40, 55, 80, 60, 35, 50, 72];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-950 dark:shadow-none">
      <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-800">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg">
          <Play className="h-4 w-4 translate-x-[1px] fill-current" />
        </span>
        <span className="absolute bottom-2 right-2 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-white">
          08:12 / 12:04
        </span>
        {/* 하단 진행바 */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20">
          <div className="h-full bg-blue-500" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      {/* 파형 + 자막 노트 */}
      <div className="space-y-2.5 p-3">
        <div className="flex h-8 items-center gap-[3px]">
          {wave.map((h, i) => (
            <span
              key={i}
              className={`w-full rounded-full ${i < Math.floor(progress * wave.length) ? "bg-blue-400/80 dark:bg-blue-500/60" : "bg-slate-200 dark:bg-slate-700"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="space-y-1.5">
          {[
            { t: "00:12", w: "82%" },
            { t: "03:40", w: "70%" },
          ].map(({ t, w }) => (
            <div key={t} className="flex items-center gap-1.5">
              <span className="rounded bg-slate-100 px-1 py-0.5 text-[8px] font-medium tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {t}
              </span>
              <TextLine w={w} tone="faint" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockDocs({ slideIndex = 0 }: { slideIndex?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-md dark:border-slate-700 dark:bg-slate-950 dark:shadow-none">
      <div className="grid grid-cols-2 gap-2.5">
        {/* Word 문서 + 표 */}
        <div className="space-y-2 rounded-lg border border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="h-2 w-10 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <TextLine w="70%" />
          <TextLine w="100%" tone="faint" />
          <TextLine w="90%" tone="faint" />
          {/* 미니 표 */}
          <div className="mt-1 overflow-hidden rounded border border-slate-200 dark:border-slate-700">
            {[0, 1, 2].map((r) => (
              <div key={r} className="flex divide-x divide-slate-200 dark:divide-slate-700">
                {[0, 1, 2].map((c) => (
                  <div
                    key={c}
                    className={`h-3 flex-1 ${
                      r === 0 ? "bg-blue-50 dark:bg-blue-500/10" : "bg-white dark:bg-slate-900"
                    } ${r === 0 || c === 0 ? "border-b border-slate-200 dark:border-slate-700" : ""}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* PPT 슬라이드 + 막대 차트 */}
        <div className="space-y-2 rounded-lg border border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1">
            <Presentation className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="h-2 w-8 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <TextLine w="60%" />
          {/* 막대 차트 */}
          <div className="flex h-12 items-end gap-1.5 pt-1">
            {[45, 70, 55, 90, 65].map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t bg-gradient-to-t from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-400 ${i === slideIndex % 5 ? "ring-2 ring-blue-300" : ""}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="h-px bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

function MockLibrary() {
  const files = [
    { badge: "PDF", badgeCls: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300", shared: false, w: "68%" },
    { badge: "DOC", badgeCls: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300", shared: true, w: "80%" },
    { badge: "XLS", badgeCls: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300", shared: true, w: "56%" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-md dark:border-slate-700 dark:bg-slate-950 dark:shadow-none">
      <div className="mb-2.5 flex gap-1.5">
        <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm shadow-blue-600/30">
          내 서재
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <Users className="h-2.5 w-2.5" /> 공유 서재
        </span>
      </div>
      <div className="space-y-1.5">
        {files.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[7px] font-bold ${f.badgeCls}`}
            >
              {f.badge}
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-2 rounded bg-slate-300 dark:bg-slate-600" style={{ width: f.w }} />
              <div className="h-1.5 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            {f.shared && (
              <div className="flex -space-x-1">
                <span className="h-3.5 w-3.5 rounded-full border border-white bg-blue-400 dark:border-slate-900" />
                <span className="h-3.5 w-3.5 rounded-full border border-white bg-indigo-400 dark:border-slate-900" />
              </div>
            )}
          </div>
        ))}
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
              <motion.div key={item.no} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid items-center gap-8 md:grid-cols-2">
                <div className={reversed ? "md:order-2" : ""}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400">{item.no}</span>
                    <span className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">{item.tag}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">{item.desc}</p>
                </div>
                <div className={reversed ? "md:order-1" : ""}><Mock /></div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function FeatureShowcase() {
  const copy = useLocalCopy(COPY);
  const { sectionRef, p, reducedMotion } = useScrollProgress<HTMLElement>({ topOffset: 72 });
  const activeIndex = sceneIndex(p, MOCKS.length);
  const item = copy.items[activeIndex]!;
  const localP = MOCKS.length > 1 ? (p * MOCKS.length) % 1 : p;

  if (reducedMotion) return <StaticShowcase copy={copy} />;

  return (
    <section ref={sectionRef} className="relative h-[360vh]">
      <div className="sticky top-0 flex min-h-[100svh] items-center py-20">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">{copy.title}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-400">{copy.subtitle}</p>
          </div>
          <div className="mt-10 grid items-center gap-8 md:mt-14 md:grid-cols-[0.88fr_1.12fr] md:gap-12">
            <motion.div key={item.no} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
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
