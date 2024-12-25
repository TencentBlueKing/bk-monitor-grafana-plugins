import type { TraceResponse, TraceSpanData } from '../types/trace';
import TreeNode from './TreeNode';

export const getTraceSpans = (trace: TraceResponse) => trace.spans;

export const TREE_ROOT_ID = '__root__';

/**
 *
 * 构建一个由 { value: spanID, children } 项组成的树，该树源自 span.references 信息。
 * 这棵树表示父/子关系的分组。最根部的节点是名义上的，其 .value === TREE_ROOT_ID。
 * 这样做是因为根跨度（main trace span）并不总是包含在跟踪数据中。
 * 因此，可能会有多个顶级跨度，而根节点则作为它们的共同父节点。
 * 在树构建完成后，子节点会根据 span.startTime 进行排序。
 * @param {Trace} trace 要构建跨度ID树的跟踪数据。
 * @return {TreeNode} 一个由跟踪中各跨度之间关系派生出的跨度ID树。
 */
export function getTraceSpanIdsAsTree(trace: TraceResponse, spanMap: Map<string, TraceSpanData> | null = null) {
  const nodesById = new Map(trace.spans.map((span: TraceSpanData) => [span.spanID, new TreeNode(span.spanID)]));
  const spansById = spanMap ?? new Map(trace.spans.map((span: TraceSpanData) => [span.spanID, span]));
  const root = new TreeNode(TREE_ROOT_ID);
  for (const span of trace.spans) {
    const node = nodesById.get(span.spanID)!;
    if (Array.isArray(span.references) && span.references.length) {
      const { refType, spanID: parentID } = span.references[0];
      if (refType === 'CHILD_OF' || refType === 'FOLLOWS_FROM') {
        const parent = nodesById.get(parentID) || root;
        parent.children?.push(node);
      } else {
        throw new Error(`Unrecognized ref type: ${refType}`);
      }
    } else {
      root.children.push(node);
    }
  }
  const comparator = (nodeA: TreeNode<string>, nodeB: TreeNode<string>) => {
    const a: TraceSpanData | undefined = nodeA?.value ? spansById.get(nodeA.value.toString()) : undefined;
    const b: TraceSpanData | undefined = nodeB?.value ? spansById.get(nodeB.value.toString()) : undefined;
    return +(a?.startTime! > b?.startTime!) || +(a?.startTime === b?.startTime) - 1;
  };
  for (const span of trace.spans) {
    const node = nodesById.get(span.spanID);
    if (node!.children.length > 1) {
      node?.children.sort(comparator);
    }
  }
  root.children.sort(comparator);
  return root;
}
