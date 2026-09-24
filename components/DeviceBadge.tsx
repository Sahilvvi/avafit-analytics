import { Monitor, Smartphone, HelpCircle } from "lucide-react";

export default function DeviceBadge({ device }: { device: string | null | undefined }) {
  const d = (device ?? "").toLowerCase();
  const Icon = d.includes("ios") || d.includes("phone") ? Smartphone : d.includes("desktop") ? Monitor : HelpCircle;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 px-2 py-0.5 text-xs font-medium text-text-secondary">
      <Icon size={12} className="text-text-muted" />
      {device || "unknown"}
    </span>
  );
}
