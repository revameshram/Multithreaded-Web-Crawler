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
      subtitle="Select a graph node to inspect crawl metadata and link relationships."
      className="lg:col-span-4"
    >
      {node ? (
        <div>
          <DetailRow label="URL" value={node.url} />
          <DetailRow label="Title" value={node.title || 'Untitled page'} />
          <DetailRow label="HTTP Status" value={node.httpStatus} />
          <DetailRow label="Response Time" value={node.responseTimeMillis ? `${node.responseTimeMillis} ms` : '-'} />
          <DetailRow label="Parent URL" value={node.parentUrl} />
          <DetailRow label="Crawl Depth" value={node.depth} />
          <DetailRow label="Outgoing Links" value={node.outgoingLinks} />
          <DetailRow label="Incoming Links" value={node.incomingLinks} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-textMuted">
          Click a node in the live graph to inspect its details here.
        </div>
      )}
    </SectionCard>
  );
}
