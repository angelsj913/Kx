import { redirect } from "next/navigation";

/** 흔한 오타 /admine → /admin */
export default function AdminTypoRedirect() {
  redirect("/admin");
}
