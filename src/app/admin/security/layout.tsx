import { requireSecurityPage } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export default async function SecuritySectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSecurityPage();
  return children;
}
