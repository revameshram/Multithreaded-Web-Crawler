import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';

export default memo(function CustomNode({ data }) {
  const { label, status, url } = data;

  // Determine border, text, and badge styles based on HTTP status
  let statusColor = 'bg-textMuted';
  let borderColor = 'border-line';
  let badgeText = 'Pending';
  let badgeClass = 'bg-line/40 text-textMuted';

  if (status !== null && status !== undefined) {
    if (status >= 200 && status < 300) {
      statusColor = 'bg-accent';
      borderColor = 'border-accent/40 shadow-[0_0_12px_rgba(61,217,179,0.15)]';
      badgeText = `${status} OK`;
      badgeClass = 'bg-accent/10 text-accent border border-accent/20';
    } else if (status >= 300 && status < 400) {
      statusColor = 'bg-accentAlt';
      borderColor = 'border-accentAlt/40';
      badgeText = `${status} Redirect`;
      badgeClass = 'bg-accentAlt/10 text-accentAlt border border-accentAlt/20';
    } else {
      statusColor = 'bg-danger';
      borderColor = 'border-danger/40 shadow-[0_0_12px_rgba(239,68,68,0.15)]';
      badgeText = `${status} Error`;
      badgeClass = 'bg-danger/10 text-danger border border-danger/20';
    }
  }

  // Parse url to show a short path description
  const displayUrl = (() => {
    try {
      const parsed = new URL(url);
      return parsed.pathname === '/' ? parsed.hostname : `${parsed.hostname}${parsed.pathname}`;
    } catch {
      return url;
    }
  })();

  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`px-4 py-3 rounded-2xl border bg-panel/95 shadow-lg min-w-[200px] max-w-[280px] transition-all hover:border-textMuted/45 ${borderColor}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-line !w-2 !h-2" />
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Status Dot */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {status === null && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-textMuted opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColor}`}></span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-textMuted">Web Page</span>
          </div>
          {/* Status badge */}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeClass}`}>
            {badgeText}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-xs font-semibold text-textMain truncate" title={label || url}>
          {label || displayUrl}
        </h4>

        {/* Short URL path */}
        <p className="text-[10px] text-textMuted truncate" title={url}>
          {displayUrl}
        </p>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-line !w-2 !h-2" />
    </motion.div>
  );
});
