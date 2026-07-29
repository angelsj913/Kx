import AuthSessionProvider from "@/components/AuthSessionProvider";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
