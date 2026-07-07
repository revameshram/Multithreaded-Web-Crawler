import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import SectionCard from './SectionCard';
import { buildFlowGraph } from '../lib/graph';
import CustomNode from './CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

export default function GraphPanel({ nodes, edges, onNodeClick }) {
  const { flowNodes, flowEdges } = useMemo(() => buildFlowGraph(nodes, edges), [nodes, edges]);

  return (
    <SectionCard
      title="Live Crawl Graph"
      subtitle="Each page is a node, each hyperlink is an edge, and the graph grows as discovery events arrive."
      className="lg:col-span-8"
    >
      <div className="h-[520px] overflow-hidden rounded-2xl border border-line bg-ink/60">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          onNodeClick={(_, node) => onNodeClick(node.id)}
        >
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) => {
              const status = node.data?.status;
              if (status === null || status === undefined) return '#371818';
              if (status >= 200 && status < 300) return '#ef4444';
              if (status >= 300 && status < 400) return '#b91c1c';
              return '#7f1d1d';
            }}
            maskColor="rgba(5, 5, 5, 0.7)"
            style={{ backgroundColor: '#121212', border: '1px solid #371818' }}
          />
          <Controls />
          <Background color="#371818" gap={20} />
        </ReactFlow>
      </div>
    </SectionCard>
  );
}

