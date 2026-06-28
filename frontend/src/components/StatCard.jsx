import { motion } from 'framer-motion';

export default function StatCard({ label, value, hint }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-line bg-panelSoft/90 p-4"
    >
      <div className="text-xs uppercase tracking-[0.18em] text-textMuted">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-textMain">{value}</div>
      {hint ? <div className="mt-1 text-sm text-textMuted">{hint}</div> : null}
    </motion.div>
  );
}
