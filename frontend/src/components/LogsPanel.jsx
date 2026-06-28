import SectionCard from './SectionCard';

const tones = {
  INFO: 'text-accent',
  WARNING: 'text-warn',
  ERROR: 'text-danger',
};

export default function LogsPanel({ logs = [] }) {
  return (
    <SectionCard
      title="Crawl Logs"
      subtitle="Backend log events stream here in real time to help explain crawler behavior."
      className="lg:col-span-8"
    >
      <div className="h-[320px] overflow-y-auto rounded-2xl border border-line bg-[#09111f] p-4 font-mono text-sm">
        {logs.length ? (
          logs.map((log, index) => (
            <div key={`${log.timestamp}-${index}`} className="border-b border-line/40 py-2 last:border-b-0">
              <span className="text-textMuted">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
              <span className={tones[log.level] ?? 'text-textMain'}>{log.level}</span>{' '}
              <span className="text-textMain">{log.message}</span>
            </div>
          ))
        ) : (
          <div className="text-textMuted">Live crawl logs will appear here after the first job starts.</div>
        )}
      </div>
    </SectionCard>
  );
}
