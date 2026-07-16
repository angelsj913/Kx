"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Compass, HeartHandshake, Rocket } from "lucide-react";
import { useLocalCopy } from "@/lib/useLocalCopy";
import { useLandingLanguage, type LandingLanguage } from "@/lib/landingI18n";

type Value = { title: string; desc: string };

type TeamCopy = { title: string; subtitle: string; role: string; bio: string; valuesTitle: string; values: Value[] };

const COPY: Record<LandingLanguage, TeamCopy> = {
  ko: {
    title: "만드는 사람들",
    subtitle: "작지만, 제품을 매일 직접 쓰는 사람들이 만듭니다.",
    role: "대표 · Founder",
    bio: "'복잡한 일을 가장 단순하게'라는 생각 하나로 Zeff를 시작했습니다. 매주 사용자의 목소리를 직접 읽고, 다음 주 제품에 반영하는 일을 가장 중요하게 여깁니다.",
    valuesTitle: "일하는 원칙",
    values: [
      { title: "결과로 증명합니다", desc: "말보다 쓰임으로 보여드립니다. 화면 속에서 실제로 동작하는 것만 약속합니다." },
      { title: "사용자 곁에서 고칩니다", desc: "매주 피드백을 검토하고, 불편한 지점을 가장 먼저 마주해 다음 주에 다듬습니다." },
      { title: "멈추지 않고 나아갑니다", desc: "서두르지 않되, 그리는 방향으로 꾸준히 한 걸음씩 나아갑니다." },
    ],
  },
  en: {
    title: "The people behind it",
    subtitle: "A small team — and the people who build it use it every day.",
    role: "Founder",
    bio: "Zeff started from a single idea: make complex work as simple as possible. Reading real user feedback every week and folding it into the next week's product is what we care about most.",
    valuesTitle: "How we work",
    values: [
      { title: "Prove it through results", desc: "We show it through use, not talk. We only promise what actually works on screen." },
      { title: "Fix it beside our users", desc: "We review feedback weekly, meet the rough edges first, and smooth them out the week after." },
      { title: "Keep moving forward", desc: "Without rushing, we take steady steps toward the picture we're drawing." },
    ],
  },
  ja: {
    title: "作る人たち",
    subtitle: "小さなチームですが、製品を毎日自分たちで使う人たちが作っています。",
    role: "代表 · Founder",
    bio: "「複雑なことを最もシンプルに」という一つの思いからZeffを始めました。毎週ユーザーの声を直接読み、翌週の製品に反映することを最も大切にしています。",
    valuesTitle: "仕事の原則",
    values: [
      { title: "結果で証明します", desc: "言葉より使われ方で示します。画面の中で実際に動くものだけをお約束します。" },
      { title: "ユーザーのそばで直します", desc: "毎週フィードバックを確認し、不便な点に真っ先に向き合い、翌週改善します。" },
      { title: "止まらず前進します", desc: "焦らずに、描いた方向へ着実に一歩ずつ進みます。" },
    ],
  },
  zh: {
    title: "打造团队",
    subtitle: "虽然是小团队，但产品是由每天亲自使用它的人打造的。",
    role: "创始人 · Founder",
    bio: "Zeff 源于一个简单的想法：把复杂的事情变得最简单。我们最看重的是每周亲自阅读用户的反馈，并将其体现在下一周的产品中。",
    valuesTitle: "工作原则",
    values: [
      { title: "用结果证明", desc: "用实际效果说话，而非空谈。我们只承诺屏幕上真正可用的功能。" },
      { title: "在用户身边持续改进", desc: "每周审阅反馈，率先直面不便之处，并在下周加以完善。" },
      { title: "不停步，稳步前行", desc: "不急躁，朝着既定方向稳步前进。" },
    ],
  },
  ru: {
    title: "Команда",
    subtitle: "Небольшая команда — и её создают те, кто пользуется продуктом каждый день.",
    role: "Основатель · Founder",
    bio: "Zeff начался с одной идеи: сделать сложные задачи максимально простыми. Мы читаем отзывы пользователей каждую неделю и учитываем их в продукте на следующей неделе — это для нас важнее всего.",
    valuesTitle: "Принципы работы",
    values: [
      { title: "Доказываем результатом", desc: "Мы показываем не словами, а делом. Обещаем только то, что реально работает на экране." },
      { title: "Исправляем рядом с пользователями", desc: "Еженедельно рассматриваем отзывы, в первую очередь беремся за неудобные места и дорабатываем их на следующей неделе." },
      { title: "Двигаемся вперёд без остановок", desc: "Не спеша, но уверенно продвигаемся шаг за шагом в выбранном направлении." },
    ],
  },
  de: {
    title: "Die Menschen dahinter",
    subtitle: "Ein kleines Team — und die Menschen, die es bauen, nutzen es jeden Tag selbst.",
    role: "Gründer · Founder",
    bio: "Zeff entstand aus einer einzigen Idee: komplexe Arbeit so einfach wie möglich zu machen. Jede Woche echtes Nutzerfeedback zu lesen und es ins Produkt der nächsten Woche einfließen zu lassen, ist uns am wichtigsten.",
    valuesTitle: "Wie wir arbeiten",
    values: [
      { title: "Wir beweisen es durch Ergebnisse", desc: "Wir zeigen es durch Nutzung, nicht durch Worte. Wir versprechen nur, was auf dem Bildschirm tatsächlich funktioniert." },
      { title: "Wir verbessern direkt an der Seite unserer Nutzer", desc: "Wir prüfen wöchentlich Feedback, gehen unangenehme Stellen zuerst an und glätten sie in der folgenden Woche." },
      { title: "Wir bewegen uns stetig vorwärts", desc: "Ohne zu hetzen, gehen wir Schritt für Schritt in die Richtung, die wir uns vorgenommen haben." },
    ],
  },
  fr: {
    title: "Les personnes derrière",
    subtitle: "Une petite équipe — et les personnes qui la construisent l'utilisent elles-mêmes chaque jour.",
    role: "Fondateur · Founder",
    bio: "Zeff est né d'une seule idée : rendre le travail complexe aussi simple que possible. Lire les retours réels des utilisateurs chaque semaine et les intégrer au produit de la semaine suivante est ce qui compte le plus pour nous.",
    valuesTitle: "Comment nous travaillons",
    values: [
      { title: "Nous le prouvons par les résultats", desc: "Nous le montrons par l'usage, pas par les mots. Nous ne promettons que ce qui fonctionne réellement à l'écran." },
      { title: "Nous corrigeons aux côtés de nos utilisateurs", desc: "Nous examinons les retours chaque semaine, affrontons d'abord les points gênants et les corrigeons la semaine suivante." },
      { title: "Nous avançons sans nous arrêter", desc: "Sans précipitation, nous avançons pas à pas, de façon constante, vers la direction que nous avons tracée." },
    ],
  },
  es: {
    title: "Las personas detrás",
    subtitle: "Un equipo pequeño, y las personas que lo construyen lo usan ellas mismas todos los días.",
    role: "Fundador · Founder",
    bio: "Zeff nació de una sola idea: hacer que el trabajo complejo sea lo más simple posible. Leer los comentarios reales de los usuarios cada semana e incorporarlos al producto de la semana siguiente es lo que más nos importa.",
    valuesTitle: "Cómo trabajamos",
    values: [
      { title: "Lo demostramos con resultados", desc: "Lo mostramos con el uso, no con palabras. Solo prometemos lo que realmente funciona en la pantalla." },
      { title: "Lo arreglamos junto a nuestros usuarios", desc: "Revisamos los comentarios cada semana, enfrentamos primero los puntos incómodos y los pulimos la semana siguiente." },
      { title: "Avanzamos sin detenernos", desc: "Sin apresurarnos, avanzamos paso a paso de forma constante hacia el rumbo que trazamos." },
    ],
  },
};

const VALUE_ICONS = [Rocket, HeartHandshake, Compass];

export default function Team() {
  const copy = useLocalCopy(COPY);
  const { language } = useLandingLanguage();
  const founderName = language === "ko" ? "권승준" : "Kwon Seungjun";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-slate-50 to-slate-50 py-20 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      {/* 위 FeatureShowcase 와 이음새 제거 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-50/0 via-slate-50/50 to-transparent dark:from-slate-950 dark:via-slate-950/90 dark:to-transparent"
      />
      {/* Footer 로 자연스럽게 이어지는 하단 페이드 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950"
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-5 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:flex-row sm:text-left dark:border-slate-800 dark:bg-slate-900"
        >
          {/* 브랜드 로고: 라이트=검정 이미지, 다크=흰색 이미지 (filter 대신 실제 교체 —
              일부 브라우저에서 filter: invert()가 이미지에 안 먹는 문제 회피) */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <Image
              src="/logo-zeff.png"
              alt="ZEFF"
              width={56}
              height={56}
              className="h-14 w-14 object-contain dark:hidden"
            />
            <Image
              src="/logo-zeff-dark.png"
              alt="ZEFF"
              width={56}
              height={56}
              className="hidden h-14 w-14 object-contain dark:block"
            />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{founderName}</p>
            <p className="mt-0.5 text-sm font-medium text-blue-600 dark:text-blue-400">{copy.role}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{copy.bio}</p>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {copy.values.map((v, i) => {
            const Icon = VALUE_ICONS[i];
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10">
                  <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{v.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
