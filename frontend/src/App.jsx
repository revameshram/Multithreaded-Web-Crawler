import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ConfigForm from './components/ConfigForm';
import GraphPanel from './components/GraphPanel';
import NodeDetailsPanel from './components/NodeDetailsPanel';
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

    let unsubscribe = () => { };

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
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-red-950/70 bg-[#0d0d0d]/90 px-6 py-4 shadow-md">
          <h1 className="text-4xl font-normal text-accent font-creepster tracking-widest">SpiderCrawl</h1>
          {jobId ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-textMuted bg-[#181818] px-3.5 py-2 rounded-lg border border-red-950/80">
                Nodes Crawled: <span className="text-accent font-bold text-base ml-1">{job?.nodes?.length || 0}</span>
              </span>
              <button
                onClick={handleReset}
                className="rounded-lg border border-red-950/85 bg-[#1c1c1c] px-4 py-2 text-sm font-semibold text-textMain transition hover:border-accent hover:text-accent"
              >
                New Crawl
              </button>
            </div>
          ) : null}
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {!jobId ? (
          /* Landing page / Configuration Screen */
          <div className="mx-auto max-w-xl py-8">
            <ConfigForm onStart={handleStart} isStarting={isStarting} />
          </div>
        ) : (
          /* Live Crawl Dashboard View */
          <div className="grid gap-6 lg:grid-cols-12">
            <GraphPanel nodes={job?.nodes || []} edges={job?.edges || []} onNodeClick={setSelectedNodeId} />
            <NodeDetailsPanel node={selectedNode} />
          </div>
        )}
      </div>
    </div>
  );
}
