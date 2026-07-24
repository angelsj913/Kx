import type { ReactNode } from "react";

/** structured/*View.tsx + ResultPanel/FileResultPanel이 공유하는 카드 셸(테두리+헤더 행). */
export default function PanelShell({
  icon,
  title,
  actions,
  headerClassName = "",
  titleClassName = "",
  children,
}: {
  icon: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  headerClassName?: string;
  titleClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-black/40 dark:backdrop-blur-md">
      <div className={`flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5 dark:border-slate-800 ${headerClassName}`}>
        <h2 className={`flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ${titleClassName}`}>
          {icon}
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </div>
  );
}
