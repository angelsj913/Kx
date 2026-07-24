import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SecurityBackLink() {
  return (
    <Link
      href="/admin/security"
      className="mb-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      보안 대시보드
    </Link>
  );
}
