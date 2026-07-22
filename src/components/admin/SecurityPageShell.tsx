"use client";

import { usePathname } from "next/navigation";
import SecurityNav from "@/components/admin/SecurityNav";

export function SecurityPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div>
      <h1 className="text-xl font-bold">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      <SecurityNav pathname={pathname} />
      {children}
    </div>
  );
}
