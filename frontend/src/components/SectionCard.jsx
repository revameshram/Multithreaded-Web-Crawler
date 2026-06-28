export default function SectionCard({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-line bg-panel/90 p-5 shadow-panel ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-textMain">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-textMuted">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
