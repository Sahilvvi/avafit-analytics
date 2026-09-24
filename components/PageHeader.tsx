import AutoRefresh from "./AutoRefresh";

export default function PageHeader({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-2 text-accent">{eyebrow}</p> : null}
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-text-muted">{description}</p> : null}
      </div>
      <AutoRefresh />
    </div>
  );
}
