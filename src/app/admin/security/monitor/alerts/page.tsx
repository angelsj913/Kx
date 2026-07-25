import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";
import { AlertSettingsForm } from "@/components/admin/AlertSettingsForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const KEY = "security.alert.config";

export default async function MonitorAlertsPage() {
  await requireSecurityPage();
  const row = await prisma.systemConfig.findUnique({ where: { key: KEY } });
  let initial = { email: "zeff@zeffai.com", threshold: "medium", enabled: false };
  if (row?.value) {
    try {
      initial = { ...initial, ...JSON.parse(row.value) };
    } catch {
      /* ignore */
    }
  }

  return (
    <SecurityPageShell title="알림 설정" description="알림 채널 · 심각도 임계값">
      <AlertSettingsForm initial={initial} />
    </SecurityPageShell>
  );
}
