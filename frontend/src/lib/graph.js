const xGap = 260;
const yGap = 110;

export function buildFlowGraph(nodes = [], edges = []) {
  const depthOffsets = new Map();
  const flowNodes = nodes.map((node) => {
    const currentOffset = depthOffsets.get(node.depth) ?? 0;
    depthOffsets.set(node.depth, currentOffset + 1);

    return {
      id: node.id,
      position: {
        x: node.depth * xGap,
        y: currentOffset * yGap,
      },
      data: {
        label: node.title || node.url,
        status: node.httpStatus,
        url: node.url,
      },
      type: 'custom',
    };
  });

  const flowEdges = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: true,
  }));

  return { flowNodes, flowEdges };
}
