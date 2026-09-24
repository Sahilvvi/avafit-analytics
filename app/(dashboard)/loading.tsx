import { Skeleton } from "@/components/halcyon/ui";

export default function Loading() {
  return (
    <div className="hc-page">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skeleton" style={{ width: 160, height: 12, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 240, height: 28, borderRadius: 8 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} h={110} />
        ))}
      </div>
      <Skeleton h={320} />
    </div>
  );
}
