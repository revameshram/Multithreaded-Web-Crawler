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
              if (status === null || status === undefined) return '#8fa2c7';
              if (status >= 200 && status < 300) return '#3dd9b3';
              if (status >= 300 && status < 400) return '#7cc8ff';
              return '#ef4444';
            }}
            maskColor="rgba(11, 17, 32, 0.6)"
            style={{ backgroundColor: '#11192d', border: '1px solid #223252' }}
          />
          <Controls />
          <Background color="#20304f" gap={20} />
        </ReactFlow>
      </div>
    </SectionCard>
  );
}

