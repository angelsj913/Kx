"use client";

import { motion } from "framer-motion";
import { FileText, ListChecks, Lightbulb, StickyNote, Play, Presentation } from "lucide-react";
import { useLocalCopy } from "@/lib/useLocalCopy";
import type { LandingLanguage } from "@/lib/landingI18n";

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

function MockSummary() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-center gap-1.5 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
      </div>
      <div className="grid grid-cols-2 gap-3 p-3">
        <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-2 w-3/4 rounded bg-slate-300 dark:bg-slate-700" />
          <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {[FileText, ListChecks, Lightbulb, StickyNote].map((Icon, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                  i === 0
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <Icon className="h-2.5 w-2.5" />
              </span>
            ))}
          </div>
          <div className="h-2 w-full rounded bg-blue-200 dark:bg-blue-500/30" />
          <div className="h-2 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

function MockLecture() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="relative flex aspect-video items-center justify-center bg-slate-900">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900">
          <Play className="h-4 w-4 translate-x-[1px]" />
        </span>
        <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white">
          12:04
        </span>
      </div>
      <div className="space-y-1.5 p-3">
        <div className="h-2 w-1/2 rounded bg-slate-300 dark:bg-slate-700" />
        <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-2 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function MockDocs() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="h-2 w-3/4 rounded bg-slate-300 dark:bg-slate-700" />
          <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <Presentation className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="h-8 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

function MockLibrary() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="mb-2 flex gap-1.5">
        <span className="rounded-md bg-blue-600/15 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
          내 서재
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          공유 서재
        </span>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900"
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-2 w-3/4 rounded bg-slate-300 dark:bg-slate-700" />
              <div className="h-1.5 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const MOCKS = [MockSummary, MockLecture, MockDocs, MockLibrary];

export default function FeatureShowcase() {
  const copy = useLocalCopy(COPY);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/80 to-slate-50 py-20 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      {/* 위 요금제 섹션에서 이어지는 상단 페이드 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/0 via-white/40 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-transparent"
      />
      {/* 아래 「만드는 사람들」과 경계 없이 이어지는 하단 페이드 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950"
      />
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            {copy.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base dark:text-slate-400">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-16 space-y-16">
          {copy.items.map((item, i) => {
            const Mock = MOCKS[i];
            const reversed = i % 2 === 1;
            return (
              <motion.div
                key={item.no}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="grid items-center gap-8 md:grid-cols-2"
              >
                <div className={reversed ? "md:order-2" : ""}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400">
                      {item.no}
                    </span>
                    <span className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
                    {item.desc}
                  </p>
                </div>
                <div className={reversed ? "md:order-1" : ""}>
                  <Mock />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
