import type { ReactNode } from 'react';

interface HeaderMeta {
  label: string;
  value: string | number;
}

interface ManagementPageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
  meta?: HeaderMeta[];
}

export default function ManagementPageHeader({
  title,
  description,
  actions,
  meta = []
}: ManagementPageHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50/60 p-5 shadow-sm sm:p-6">
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-sky-100/80 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {meta.length > 0 && (
        <div className="relative mt-4 flex flex-wrap gap-2">
          {meta.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
