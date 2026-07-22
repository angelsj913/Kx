import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import RootSessionProvider from "@/components/RootSessionProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zeffai.com"),
  title: {
    default: "ZEFF AI — 공부와 일을 한곳에서, AI 학습·업무 워크스페이스",
    template: "%s · ZEFF AI",
  },
  description:
    "강의 자료·PDF 요약, 시험 문제 생성, 강의 영상·음성 분석부터 워드·PPT·엑셀 문서 자동 생성까지. 공부와 일을 한곳에서 끝내는 개인용 AI 워크스페이스, ZEFF AI.",
  keywords: [
    "ZEFF AI",
    "제프 AI",
    "AI 학습",
    "시험공부 AI",
    "강의 요약",
    "PDF 요약",
    "강의 분석",
    "문제 생성",
    "PPT 자동 생성",
    "엑셀 자동화",
    "AI 워크스페이스",
    "대학생 공부 앱",
    "AI 튜터",
  ],
  applicationName: "ZEFF AI",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "ZEFF AI",
    title: "ZEFF AI — 공부와 일을 한곳에서",
    description:
      "강의 요약·문제 생성·강의 영상 분석부터 워드·PPT·엑셀 자동 생성까지, 공부와 업무를 한곳에서 끝내는 AI 워크스페이스.",
    url: "https://zeffai.com",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZEFF AI — 공부와 일을 한곳에서",
    description:
      "강의 요약·문제 생성·강의 분석부터 워드·PPT·엑셀 자동 생성까지, 공부와 업무를 한곳에서.",
  },
  appleWebApp: {
    capable: true,
    title: "ZEFF AI",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1120" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <RootSessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </RootSessionProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
