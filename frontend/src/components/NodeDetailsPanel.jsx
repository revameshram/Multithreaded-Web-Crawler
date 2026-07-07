import SectionCard from './SectionCard';

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-line/70 py-3 last:border-b-0">
      <span className="text-sm text-textMuted">{label}</span>
      <span className="break-all text-sm text-textMain">{value ?? '-'}</span>
    </div>
  );
}

export default function NodeDetailsPanel({ node }) {
  return (
    <SectionCard
      title="Node Details"
      subtitle="Select a node to view properties."
      className="lg:col-span-4"
    >
      {node ? (
        <div>
          <DetailRow label="URL" value={node.url} />
          <DetailRow label="Title" value={node.title || 'Untitled Page'} />
          <DetailRow label="HTTP Status" value={node.httpStatus} />
          <DetailRow label="Crawl Depth" value={node.depth} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-textMuted">
          Click a node in the live graph to inspect its details here.
        </div>
      )}
    </SectionCard>
  );
}
