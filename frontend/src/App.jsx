import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ConfigForm from './components/ConfigForm';
import OverviewPanel from './components/OverviewPanel';
import GraphPanel from './components/GraphPanel';
import NodeDetailsPanel from './components/NodeDetailsPanel';
import ThreadActivityPanel from './components/ThreadActivityPanel';
import QueuePanel from './components/QueuePanel';
import LogsPanel from './components/LogsPanel';
import SummaryPanel from './components/SummaryPanel';
import SectionCard from './components/SectionCard';
import { createCrawlJob, fetchCrawlJob, fetchCrawlSummary } from './lib/api';
import { connectToCrawl } from './lib/ws';

export default function App() {
  const [job, setJob] = useState(null);
  const [summary, setSummary] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  useEffect(() => {
    if (!jobId) {
      return undefined;
    }

    let unsubscribe = () => {};

    async function bootstrap() {
      try {
        const snapshot = await fetchCrawlJob(jobId);
        setJob(snapshot);

        unsubscribe = connectToCrawl(jobId, async (event) => {
          if (event.payload?.jobId) {
            setJob(event.payload);
          } else if (event.type === 'THREAD_ACTIVITY') {
            setJob((current) => current ? { ...current, threads: event.payload } : current);
          } else if (event.type === 'LOG') {
            setJob((current) => current ? { ...current, logs: [event.payload, ...(current.logs || [])].slice(0, 250) } : current);
          }

          if (event.type === 'JOB_COMPLETED') {
            const latestSummary = await fetchCrawlSummary(jobId);
            setSummary(latestSummary);
          }
        });
      } catch (requestError) {
        setError('Unable to load crawl job details from the backend.');
      }
    }

    bootstrap();

    return () => {
      unsubscribe();
    };
  }, [jobId]);

  const selectedNode = useMemo(
    () => job?.nodes?.find((node) => node.id === selectedNodeId) ?? null,
    [job?.nodes, selectedNodeId],
  );

  async function handleStart(payload) {
    setError('');
    setSummary(null);
    setSelectedNodeId(null);
    setIsStarting(true);
    try {
      const response = await createCrawlJob(payload);
      setJobId(response.jobId);
    } catch (requestError) {
      setError('Failed to start crawl job. Make sure the Spring Boot backend is running on port 8080.');
    } finally {
      setIsStarting(false);
    }
  }

  function handleReset() {
    setJobId(null);
    setJob(null);
    setSummary(null);
    setSelectedNodeId(null);
    setError('');
  }

  return (
    <div className="min-h-screen bg-shell px-4 py-6 text-textMain md:px-8">
      <div className="mx-auto max-w-[1600px]">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 rounded-[28px] border border-line bg-panel/80 px-6 py-6 shadow-panel"
        >
          <h1 className="text-3xl font-semibold text-textMain md:text-5xl">Interactive Multithreaded Web Crawler</h1>
        </motion.header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {!jobId ? (
          /* Landing page / Configuration Screen */
          <div className="mx-auto max-w-2xl">
            <ConfigForm onStart={handleStart} isStarting={isStarting} />
          </div>
        ) : (
          /* Live Crawl Dashboard View */
          <div className="grid gap-6 lg:grid-cols-12">
            <OverviewPanel job={job} />
            
            <SectionCard
              title="Job Control Panel"
              subtitle="Review active streaming session metadata or reset the dashboard to create a new crawl job."
              className="lg:col-span-5"
              action={
                <button
                  onClick={handleReset}
                  className="rounded-2xl border border-line bg-panelSoft px-4 py-2 text-sm font-semibold text-textMain transition hover:border-accent hover:text-accent"
                >
                  New Crawl
                </button>
              }
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-line bg-ink/50 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-textMuted">Active Job</div>
                  <div className="mt-2 text-sm font-semibold text-textMain truncate">{jobId.slice(0, 8)}...</div>
                </div>
                <div className="rounded-2xl border border-line bg-ink/50 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-textMuted">Max Depth</div>
                  <div className="mt-2 text-sm font-semibold text-textMain">Depth {job?.maxDepth || '-'}</div>
                </div>
                <div className="rounded-2xl border border-line bg-ink/50 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-textMuted">Worker Pool</div>
                  <div className="mt-2 text-sm font-semibold text-textMain">{job?.workerThreads || '-'} Threads</div>
                </div>
              </div>
            </SectionCard>

            <GraphPanel nodes={job?.nodes || []} edges={job?.edges || []} onNodeClick={setSelectedNodeId} />
            <NodeDetailsPanel node={selectedNode} />
            <ThreadActivityPanel threads={job?.threads || []} />
            <QueuePanel queue={job?.queue} />
            <LogsPanel logs={job?.logs || []} />
            <SummaryPanel summary={summary} isVisible={Boolean(summary)} />
          </div>
        )}
      </div>
    </div>
  );
}
