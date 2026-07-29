import AuthSessionProvider from "@/components/AuthSessionProvider";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
