import SectionCard from './SectionCard';

export default function QueuePanel({ queue }) {
  return (
    <SectionCard
      title="Live Queue"
      subtitle="BFS queue pressure, current URL, and the next URLs waiting for workers."
      className="lg:col-span-4"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-ink/50 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-textMuted">Current Queue Size</div>
          <div className="mt-2 text-3xl font-semibold text-textMain">{queue?.queueSize ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-line bg-ink/50 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-textMuted">Current URL</div>
          <div className="mt-2 break-all text-sm text-textMain">{queue?.currentUrl || 'No URL currently being processed'}</div>
        </div>
        <div className="rounded-2xl border border-line bg-ink/50 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-textMuted">Upcoming URLs</div>
          <div className="mt-3 space-y-2">
            {queue?.upcomingUrls?.length ? (
              queue.upcomingUrls.map((url) => (
                <div key={url} className="truncate rounded-xl bg-panel px-3 py-2 text-sm text-textMuted">
                  {url}
                </div>
              ))
            ) : (
              <div className="text-sm text-textMuted">The frontier is empty right now.</div>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
