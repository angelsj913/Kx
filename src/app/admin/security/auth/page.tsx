import { redirect } from "next/navigation";

export default function AuthRedirect() {
  redirect("/admin/security/access/logs");
}
