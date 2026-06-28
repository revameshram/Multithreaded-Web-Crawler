import SectionCard from './SectionCard';

const stateTone = {
  DOWNLOADING: 'text-accent',
  PARSING: 'text-accentAlt',
  PROCESSING: 'text-warn',
  WAITING: 'text-textMuted',
};

export default function ThreadActivityPanel({ threads = [] }) {
  return (
    <SectionCard
      title="Thread Activity"
      subtitle="Every worker thread advertises its current execution state and active URL."
      className="lg:col-span-4"
    >
      <div className="space-y-3">
        {threads.length ? (
          threads.map((thread) => (
            <div key={thread.threadName} className="rounded-2xl border border-line bg-ink/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-textMain">{thread.threadName}</h3>
                <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${stateTone[thread.state] ?? 'text-textMuted'}`}>
                  {thread.state}
                </span>
              </div>
              <p className="mt-3 break-all text-sm text-textMuted">{thread.currentUrl || 'Idle - waiting for queue work'}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-textMuted">
            Thread activity will appear as soon as a crawl starts.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
