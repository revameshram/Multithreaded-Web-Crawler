import SectionCard from './SectionCard';

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(summary, filename) {
  const rows = [
    ['metric', 'value'],
    ['totalPages', summary.totalPages],
    ['uniqueUrls', summary.uniqueUrls],
    ['brokenLinks', summary.brokenLinks],
    ['averageResponseTimeMillis', summary.averageResponseTimeMillis],
    ['maximumDepth', summary.maximumDepth],
    ['duplicateUrls', summary.duplicateUrls],
    ['durationMillis', summary.durationMillis],
  ];
  const csv = rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function SummaryPanel({ summary, isVisible }) {
  if (!isVisible) {
    return null;
  }

  return (
    <SectionCard
      title="Crawl Summary"
      subtitle="Final metrics and quick export actions for portfolio-friendly demos."
      className="lg:col-span-12"
      action={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => downloadCsv(summary, 'crawl-summary.csv')}
            className="rounded-xl border border-line px-3 py-2 text-sm text-textMain transition hover:border-accent"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => downloadJson(summary, 'crawl-summary.json')}
            className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-ink transition hover:brightness-110"
          >
            Export JSON
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-line bg-ink/50 p-4 text-sm text-textMain">Total Pages: {summary.totalPages}</div>
        <div className="rounded-2xl border border-line bg-ink/50 p-4 text-sm text-textMain">Unique URLs: {summary.uniqueUrls}</div>
        <div className="rounded-2xl border border-line bg-ink/50 p-4 text-sm text-textMain">Broken Links: {summary.brokenLinks}</div>
        <div className="rounded-2xl border border-line bg-ink/50 p-4 text-sm text-textMain">Average Response Time: {Math.round(summary.averageResponseTimeMillis)} ms</div>
        <div className="rounded-2xl border border-line bg-ink/50 p-4 text-sm text-textMain">Maximum Depth: {summary.maximumDepth}</div>
        <div className="rounded-2xl border border-line bg-ink/50 p-4 text-sm text-textMain">Duplicate URLs: {summary.duplicateUrls}</div>
        <div className="rounded-2xl border border-line bg-ink/50 p-4 text-sm text-textMain">Duration: {Math.round(summary.durationMillis / 1000)} s</div>
      </div>
    </SectionCard>
  );
}
