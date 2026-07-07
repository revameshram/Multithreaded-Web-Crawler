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
      borderColor = 'border-accent/80 node-active-glow shadow-[0_0_15px_rgba(229,9,20,0.4)]';
      badgeText = `${status}`;
      badgeClass = 'bg-accent/15 text-accent border border-accent/30';
    } else if (status >= 300 && status < 400) {
      statusColor = 'bg-accentAlt';
      borderColor = 'border-accentAlt/60';
      badgeText = `${status}`;
      badgeClass = 'bg-accentAlt/15 text-accentAlt border border-accentAlt/30';
    } else {
      statusColor = 'bg-danger';
      borderColor = 'border-danger/60';
      badgeText = `${status}`;
      badgeClass = 'bg-danger/15 text-danger border border-danger/30';
    }
  } else {
    // Pending/Active state
    borderColor = 'border-accent/40 node-active-glow shadow-[0_0_10px_rgba(229,9,20,0.2)]';
  }

  // Fallback title if label is empty
  const displayTitle = label || 'Untitled Page';

  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`px-4 py-3 rounded-xl border bg-panel/95 shadow-md min-w-[180px] max-w-[240px] transition-all ${borderColor}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-accent !w-2 !h-2" />
      
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          {/* Title */}
          <h4 className="text-xs font-semibold text-textMain truncate flex-1" title={displayTitle}>
            {displayTitle}
          </h4>
          {/* Status badge */}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeClass}`}>
            {badgeText}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-accent !w-2 !h-2" />
    </motion.div>
  );
});
