"use client";

import { Check, X } from "lucide-react";
import { evaluatePassword, type PasswordContext } from "@/lib/password";

export default function PasswordStrengthHint({
  password,
  context,
}: {
  password: string;
  context?: PasswordContext;
}) {
  if (!password) return null;
  const rules = evaluatePassword(password, context);

  return (
    <ul className="mt-1.5 space-y-1">
      {rules.map((rule) => (
        <li
          key={rule.key}
          className={`flex items-center gap-1.5 text-[11px] ${
            rule.ok
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {rule.ok ? (
            <Check className="h-3 w-3 shrink-0" />
          ) : (
            <X className="h-3 w-3 shrink-0" />
          )}
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
