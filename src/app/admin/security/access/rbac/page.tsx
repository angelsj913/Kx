import { prisma } from "@/lib/prisma";
import { requireSecurityPage } from "@/lib/requireAdmin";
import { SecurityPageShell } from "@/components/admin/SecurityPageShell";
import { RbacManager } from "@/components/admin/RbacManager";

export const dynamic = "force-dynamic";

export default async function AccessRbacPage() {
  await requireSecurityPage();
  const [assignments, admins] = await Promise.all([
    prisma.adminRoleAssignment.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.user.findMany({
      where: {
        email: { in: ["zeff@zeffai.com", "kxeung9@gmail.com"] },
      },
      select: { id: true, email: true, name: true },
    }),
  ]);

  return (
    <SecurityPageShell title="역할 및 권한 관리" description="RBAC · allowlist 보조">
      <p className="mb-4 text-xs text-slate-500">
        기본 관리자는 이메일 allowlist로 동작합니다. 여기서 추가 역할을 부여할 수 있습니다.
      </p>
      <RbacManager admins={admins} assignments={assignments} />
    </SecurityPageShell>
  );
}
