import AuthSessionProvider from "@/components/AuthSessionProvider";

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
