import type { ReactNode } from "react";

type CalloutVariant = "info" | "warning" | "danger" | "tip";

interface CalloutProps {
  type?: CalloutVariant;
  children: ReactNode;
}

const variantStyles: Record<CalloutVariant, string> = {
  info: "border-blue-500/30 bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100",
  warning: "border-amber-500/30 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
  danger: "border-red-500/30 bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-100",
  tip: "border-green-500/30 bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-100",
};

const variantIcons: Record<CalloutVariant, string> = {
  info: "ℹ️",
  warning: "⚠️",
  danger: "🚨",
  tip: "💡",
};

export function Callout({ type = "info", children }: CalloutProps) {
  return (
    <div
      className={`my-6 flex gap-3 rounded-lg border p-4 text-sm ${variantStyles[type]}`}
      role="note"
    >
      <span className="shrink-0 text-base leading-5" aria-hidden="true">
        {variantIcons[type]}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
