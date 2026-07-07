import { useMemo, useState } from 'react';
import SectionCard from './SectionCard';

const RECOMMENDED_DEPTH = 3;
const RECOMMENDED_THREADS = 8;

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ConfigForm({ onStart, isStarting }) {
  const [targetUrl, setTargetUrl] = useState('');
  const [useRecommendedSettings, setUseRecommendedSettings] = useState(true);
  const [maxDepth, setMaxDepth] = useState(RECOMMENDED_DEPTH);
  const [workerThreads, setWorkerThreads] = useState(RECOMMENDED_THREADS);

  const isValid = useMemo(() => isValidUrl(targetUrl), [targetUrl]);

  function handleRecommendedChange(checked) {
    setUseRecommendedSettings(checked);
    if (checked) {
      setMaxDepth(RECOMMENDED_DEPTH);
      setWorkerThreads(RECOMMENDED_THREADS);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!isValid || isStarting) {
      return;
    }

    onStart({
      targetUrl,
      maxDepth,
      workerThreads,
      useRecommendedSettings,
    });
  }

  return (
    <SectionCard
      title="Start SpiderCrawl"
      subtitle="Enter a URL to discover links and map their topology."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textMain" htmlFor="targetUrl">
            Website URL
          </label>
          <input
            id="targetUrl"
            value={targetUrl}
            onChange={(event) => setTargetUrl(event.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-2xl border border-line bg-ink/70 px-4 py-3 text-textMain outline-none transition focus:border-accent"
          />
          {!isValid && targetUrl ? (
            <p className="text-sm text-danger">Enter a valid URL starting with http:// or https://</p>
          ) : null}
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-line bg-ink/40 px-4 py-3">
          <input
            type="checkbox"
            checked={useRecommendedSettings}
            onChange={(event) => handleRecommendedChange(event.target.checked)}
            className="h-4 w-4 rounded border-line bg-ink text-accent focus:ring-accent"
          />
          <span className="text-sm text-textMain">Use Recommended Settings</span>
          <span className="ml-auto text-xs uppercase tracking-[0.18em] text-textMuted">Depth 3 · Threads 8</span>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-textMain" htmlFor="maxDepth">
              Maximum Crawl Depth
            </label>
            <input
              id="maxDepth"
              type="number"
              min="1"
              max="10"
              value={maxDepth}
              disabled={useRecommendedSettings}
              onChange={(event) => setMaxDepth(Number(event.target.value))}
              className="w-full rounded-2xl border border-line bg-ink/70 px-4 py-3 text-textMain outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-accent"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-textMain" htmlFor="workerThreads">
              Number of Worker Threads
            </label>
            <input
              id="workerThreads"
              type="number"
              min="1"
              max="32"
              value={workerThreads}
              disabled={useRecommendedSettings}
              onChange={(event) => setWorkerThreads(Number(event.target.value))}
              className="w-full rounded-2xl border border-line bg-ink/70 px-4 py-3 text-textMain outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-accent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isValid || isStarting}
          className="inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isStarting ? 'Starting Crawl...' : 'Start Crawl'}
        </button>
      </form>
    </SectionCard>
  );
}
