"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Apple, Monitor, HardDrive, Cpu, MemoryStick, CheckCircle2, Package } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/ui/Logo";
import { useLocalCopy } from "@/lib/useLocalCopy";
import {
  WINDOWS_DOWNLOAD_URL,
  MAC_DOWNLOAD_URL,
  WINDOWS_FILENAME,
  MAC_FILENAME,
  APP_VERSION,
  SYSTEM_REQUIREMENTS,
} from "@/lib/constants";

type OS = "windows" | "mac" | "other";

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 5.1 10.5 4v7.5H3V5.1Zm0 13.8L10.5 20v-7.4H3v6.3ZM11.6 3.85 21 2.5v9H11.6V3.85Zm0 16.3L21 21.5v-9H11.6v7.65Z" />
    </svg>
  );
}

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
    smartScreenTitle: "설치 중 보안 경고가 뜨나요?",
    smartScreen: "Windows에서 'Windows의 PC 보호'(SmartScreen)나 '알 수 없는 게시자' 경고가 보이면 [추가 정보] → [실행]을 눌러 설치하세요. 아직 코드 서명 인증서 적용 전이라 표시되는 정상 경고입니다. macOS에서 '확인되지 않은 개발자' 경고가 나오면 파일을 마우스 오른쪽 클릭 → [열기]를 선택하세요.",
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
    smartScreenTitle: "Seeing a security warning during install?",
    smartScreen: "If Windows shows a 'Windows protected your PC' (SmartScreen) or 'unknown publisher' warning, click More info → Run anyway. It appears only because the app isn't code-signed yet and is safe to proceed. On macOS, if you see an 'unidentified developer' warning, right-click the file → Open.",
  },
  ja: {
    title: "ZEFF AI ダウンロード",
    subtitle: "インストーラーをダウンロードして実行するだけで、すぐに使い始められます。",
    recommended: "このデバイスにおすすめ",
    windows: "Windows版をダウンロード",
    mac: "macOS版をダウンロード",
    fileLabel: "インストーラー",
    reqTitle: "システム要件",
    reqOs: "OS",
    reqCpu: "プロセッサ",
    reqRam: "メモリ",
    reqDisk: "ストレージ",
    howto: "ダウンロードしたインストーラーを実行し、画面の指示に従ってインストールしてください。Windowsは.exe、macOSは.dmgファイルです。",
    olderTitle: "以前のバージョン",
    olderDesc: "以前のバージョンが必要な場合は、以下からダウンロードできます。旧バージョンにはセキュリティアップデートが提供されない場合があるため、できるだけ最新版のご利用をおすすめします。",
    olderLoading: "以前のバージョンを読み込んでいます...",
    olderEmpty: "公開されている以前のバージョンはまだありません。最新版をご利用ください。",
    archive: "すべてのリリースを見る",
    latest: "最新",
    version: "バージョン",
    released: "公開日",
    download: "ダウンロード",
    notesNote: "インストーラーがまだ公開されていない場合、ダウンロードリンクはリリース公開後に有効になります。",
    smartScreenTitle: "インストール中にセキュリティ警告が出ますか？",
    smartScreen: "Windowsで「WindowsによってPCが保護されました」(SmartScreen)や「不明な発行元」の警告が出た場合は、[詳細情報]→[実行]を押してインストールしてください。まだコード署名証明書を適用していないため表示される正常な警告です。macOSで「未確認の開発元」警告が出た場合は、ファイルを右クリック→[開く]を選択してください。",
  },
  zh: {
    title: "下载 ZEFF AI",
    subtitle: "下载安装程序并运行，即可立即使用。",
    recommended: "推荐用于此设备",
    windows: "下载 Windows 版",
    mac: "下载 macOS 版",
    fileLabel: "安装程序",
    reqTitle: "系统要求",
    reqOs: "操作系统",
    reqCpu: "处理器",
    reqRam: "内存",
    reqDisk: "存储空间",
    howto: "运行下载的安装程序，按照屏幕提示进行安装。Windows 为 .exe 文件，macOS 为 .dmg 文件。",
    olderTitle: "以前的版本",
    olderDesc: "如果需要旧版本，可在下方下载。旧版本可能不再提供安全更新，建议尽量使用最新版本。",
    olderLoading: "正在加载以前的版本...",
    olderEmpty: "目前还没有发布过以前的版本。请使用最新版本。",
    archive: "查看全部版本",
    latest: "最新",
    version: "版本",
    released: "发布日期",
    download: "下载",
    notesNote: "如果安装程序尚未发布，下载链接将在版本发布后生效。",
    smartScreenTitle: "安装时出现安全警告？",
    smartScreen: "如果 Windows 显示“Windows 已保护你的电脑”(SmartScreen) 或“未知发布者”警告，请点击“更多信息”→“仍要运行”进行安装。这只是因为应用尚未进行代码签名，可放心继续。在 macOS 上如果出现“无法验证开发者”警告，请右键点击文件→“打开”。",
  },
  ru: {
    title: "Скачать ZEFF AI",
    subtitle: "Скачайте установщик, запустите его — и можно сразу начинать работу.",
    recommended: "Рекомендуется для вашего устройства",
    windows: "Скачать для Windows",
    mac: "Скачать для macOS",
    fileLabel: "Установщик",
    reqTitle: "Системные требования",
    reqOs: "ОС",
    reqCpu: "Процессор",
    reqRam: "Память",
    reqDisk: "Накопитель",
    howto: "Запустите скачанный установщик и следуйте инструкциям на экране. Для Windows — файл .exe, для macOS — файл .dmg.",
    olderTitle: "Предыдущие версии",
    olderDesc: "Нужна более старая версия? Скачайте её ниже. Старые версии могут не получать обновления безопасности, поэтому по возможности используйте последнюю версию.",
    olderLoading: "Загрузка предыдущих версий...",
    olderEmpty: "Предыдущие версии пока не опубликованы. Пожалуйста, используйте последнюю версию.",
    archive: "Смотреть все релизы",
    latest: "Последняя",
    version: "Версия",
    released: "Дата выпуска",
    download: "Скачать",
    notesNote: "Если установщик ещё не опубликован, ссылка для скачивания станет активной после публикации релиза.",
    smartScreenTitle: "Предупреждение безопасности при установке?",
    smartScreen: "Если Windows показывает предупреждение «Система Windows защитила ваш компьютер» (SmartScreen) или «неизвестный издатель», нажмите «Подробнее» → «Выполнить в любом случае». Оно появляется лишь потому, что приложение ещё не подписано сертификатом, и продолжать безопасно. В macOS при предупреждении «неопознанный разработчик» щёлкните файл правой кнопкой → «Открыть».",
  },
  de: {
    title: "ZEFF AI herunterladen",
    subtitle: "Installationsprogramm herunterladen, ausführen – und schon können Sie loslegen.",
    recommended: "Empfohlen für dieses Gerät",
    windows: "Für Windows herunterladen",
    mac: "Für macOS herunterladen",
    fileLabel: "Installationsprogramm",
    reqTitle: "Systemanforderungen",
    reqOs: "Betriebssystem",
    reqCpu: "Prozessor",
    reqRam: "Arbeitsspeicher",
    reqDisk: "Speicherplatz",
    howto: "Führen Sie das heruntergeladene Installationsprogramm aus und folgen Sie den Anweisungen auf dem Bildschirm. Windows verwendet eine .exe-Datei, macOS eine .dmg-Datei.",
    olderTitle: "Frühere Versionen",
    olderDesc: "Benötigen Sie eine ältere Version? Sie können sie unten herunterladen. Ältere Versionen erhalten möglicherweise keine Sicherheitsupdates mehr — verwenden Sie daher nach Möglichkeit die neueste Version.",
    olderLoading: "Frühere Versionen werden geladen …",
    olderEmpty: "Es wurden noch keine früheren Versionen veröffentlicht. Bitte verwenden Sie die neueste Version.",
    archive: "Alle Releases ansehen",
    latest: "Neueste",
    version: "Version",
    released: "Veröffentlicht",
    download: "Herunterladen",
    notesNote: "Falls die Installationsprogramme noch nicht veröffentlicht sind, funktionieren die Download-Links, sobald ein Release veröffentlicht wurde.",
    smartScreenTitle: "Sicherheitswarnung bei der Installation?",
    smartScreen: "Wenn Windows eine Warnung „Der Computer wurde durch Windows geschützt“ (SmartScreen) oder „unbekannter Herausgeber“ anzeigt, klicken Sie auf Weitere Informationen → Trotzdem ausführen. Sie erscheint nur, weil die App noch nicht code-signiert ist, und das Fortfahren ist sicher. Wenn macOS „nicht verifizierter Entwickler“ meldet, klicken Sie mit der rechten Maustaste auf die Datei → Öffnen.",
  },
  fr: {
    title: "Télécharger ZEFF AI",
    subtitle: "Téléchargez l'installateur, exécutez-le, et c'est prêt.",
    recommended: "Recommandé pour cet appareil",
    windows: "Télécharger pour Windows",
    mac: "Télécharger pour macOS",
    fileLabel: "Installateur",
    reqTitle: "Configuration requise",
    reqOs: "Système d'exploitation",
    reqCpu: "Processeur",
    reqRam: "Mémoire",
    reqDisk: "Stockage",
    howto: "Exécutez l'installateur téléchargé et suivez les instructions à l'écran. Windows utilise un fichier .exe, macOS un fichier .dmg.",
    olderTitle: "Versions précédentes",
    olderDesc: "Besoin d'une version antérieure ? Téléchargez-la ci-dessous. Les anciennes versions peuvent ne plus recevoir de mises à jour de sécurité ; utilisez donc la dernière version si possible.",
    olderLoading: "Chargement des versions précédentes…",
    olderEmpty: "Aucune version précédente n'a encore été publiée. Veuillez utiliser la dernière version.",
    archive: "Voir toutes les versions",
    latest: "Dernière",
    version: "Version",
    released: "Publiée le",
    download: "Télécharger",
    notesNote: "Si les installateurs ne sont pas encore publiés, les liens de téléchargement fonctionneront dès la publication d'une version.",
    smartScreenTitle: "Un avertissement de sécurité pendant l'installation ?",
    smartScreen: "Si Windows affiche un avertissement « Windows a protégé votre ordinateur » (SmartScreen) ou « éditeur inconnu », cliquez sur Informations complémentaires → Exécuter quand même. Il apparaît uniquement parce que l'application n'est pas encore signée, et vous pouvez continuer en toute sécurité. Sur macOS, en cas d'avertissement « développeur non identifié », faites un clic droit sur le fichier → Ouvrir.",
  },
  es: {
    title: "Descargar ZEFF AI",
    subtitle: "Descarga el instalador, ejecútalo y podrás empezar a usarlo enseguida.",
    recommended: "Recomendado para este dispositivo",
    windows: "Descargar para Windows",
    mac: "Descargar para macOS",
    fileLabel: "Instalador",
    reqTitle: "Requisitos del sistema",
    reqOs: "Sistema operativo",
    reqCpu: "Procesador",
    reqRam: "Memoria",
    reqDisk: "Almacenamiento",
    howto: "Ejecuta el instalador descargado y sigue las instrucciones en pantalla. Windows usa un archivo .exe, macOS un archivo .dmg.",
    olderTitle: "Versiones anteriores",
    olderDesc: "¿Necesitas una versión anterior? Puedes descargarla a continuación. Es posible que las versiones anteriores no reciban actualizaciones de seguridad, así que te recomendamos usar la última versión siempre que sea posible.",
    olderLoading: "Cargando versiones anteriores...",
    olderEmpty: "Todavía no se ha publicado ninguna versión anterior. Usa la última versión.",
    archive: "Ver todas las versiones",
    latest: "Más reciente",
    version: "Versión",
    released: "Publicada",
    download: "Descargar",
    notesNote: "Si los instaladores aún no se han publicado, los enlaces de descarga funcionarán en cuanto se publique una versión.",
    smartScreenTitle: "¿Aparece una advertencia de seguridad al instalar?",
    smartScreen: "Si Windows muestra una advertencia «Windows protegió tu PC» (SmartScreen) o «editor desconocido», haz clic en Más información → Ejecutar de todas formas. Aparece solo porque la app aún no está firmada con certificado, y es seguro continuar. En macOS, si ves una advertencia de «desarrollador no identificado», haz clic derecho en el archivo → Abrir.",
  },
};

export default function DownloadPage() {
  const c = useLocalCopy(COPY);
  const [os, setOs] = useState<OS>("other");

  useEffect(() => {
    (async () => {
      const ua = navigator.userAgent;
      if (/Win/i.test(ua)) setOs("windows");
      else if (/Mac/i.test(ua)) setOs("mac");
    })();
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

        {/* 코드 서명 전이라 설치 시 뜨는 SmartScreen/미확인 개발자 경고 안내 */}
        <details className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          <summary className="cursor-pointer font-semibold">{c.smartScreenTitle}</summary>
          <p className="mt-2">{c.smartScreen}</p>
        </details>

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
      </div>
    </div>
  );
}
