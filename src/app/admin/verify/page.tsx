import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { isAdminMfaVerified } from "@/lib/adminMfa";
import AdminVerifyClient from "@/components/admin/AdminVerifyClient";

export const dynamic = "force-dynamic";

export default async function AdminVerifyPage() {
  const session = await auth();
  if (!session?.user || !isAdminSession(session)) {
    redirect("/login?callbackUrl=/admin/security");
  }
  if (session.user.id && (await isAdminMfaVerified(session.user.id))) {
    redirect("/admin/security");
  }
  return <AdminVerifyClient />;
}
