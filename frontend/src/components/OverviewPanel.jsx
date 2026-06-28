import SectionCard from './SectionCard';
import StatCard from './StatCard';

export default function OverviewPanel({ job }) {
  const metrics = job?.metrics;
  const runningSeconds = Math.floor((job?.runningTimeMillis ?? 0) / 1000);

  return (
    <SectionCard
      title="Live Crawl Dashboard"
      subtitle="Real-time crawl status, throughput, queue pressure, and duplicate tracking."
      className="lg:col-span-7"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Current Status" value={job?.status ?? 'IDLE'} hint={job?.targetUrl ?? 'No active target'} />
        <StatCard label="Running Time" value={`${runningSeconds}s`} hint={`Depth ${job?.maxDepth ?? '-'} · Threads ${job?.workerThreads ?? '-'}`} />
        <StatCard label="Pages Visited" value={metrics?.pagesVisited ?? 0} hint="Dequeued and processed by workers" />
        <StatCard label="Pages Queued" value={metrics?.pagesQueued ?? 0} hint="Discovered URLs entering the BFS frontier" />
        <StatCard label="Pages Completed" value={metrics?.pagesCompleted ?? 0} hint="Successful page processing completions" />
        <StatCard label="Duplicate URLs" value={metrics?.duplicateUrls ?? 0} hint="Detected before repeat processing" />
        <StatCard label="Broken Links" value={metrics?.brokenLinks ?? 0} hint="HTTP failures and crawler exceptions" />
        <StatCard label="Avg Response Time" value={`${Math.round(metrics?.averageResponseTimeMillis ?? 0)} ms`} hint="Average over completed pages" />
        <StatCard label="Job ID" value={job?.jobId ? `${job.jobId.slice(0, 8)}...` : '-'} hint="Returned immediately on crawl creation" />
      </div>
    </SectionCard>
  );
}
