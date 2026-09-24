export default function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {description ? <p className="mt-0.5 text-xs text-text-muted">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
