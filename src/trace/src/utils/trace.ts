/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import type { TraceResponse, TraceSpanData } from '../types/trace';
import TreeNode from './TreeNode';

export const getTraceSpans = (trace: TraceResponse) => trace.spans;

export const TREE_ROOT_ID = '__root__';

/**
 * Build a tree of { value: spanID, children } items derived from the
 * `span.references` information. The tree represents the grouping of parent /
 * child relationships. The root-most node is nominal in that
 * `.value === TREE_ROOT_ID`. This is done because a root span (the main trace
 * span) is not always included with the trace data. Thus, there can be
 * multiple top-level spans, and the root node acts as their common parent.
 *
 * The children are sorted by `span.startTime` after the tree is built.
 *
 * @param  {Trace} trace The trace to build the tree of spanIDs.
 * @return {TreeNode}    A tree of spanIDs derived from the relationships
 *                       between spans in the trace.
 */
export function getTraceSpanIdsAsTree(trace: TraceResponse, spanMap: Map<string, TraceSpanData> | null = null) {
  const nodesById = new Map(trace.spans.map((span: TraceSpanData) => [span.spanID, new TreeNode(span.spanID)]));
  const spansById = spanMap ?? new Map(trace.spans.map((span: TraceSpanData) => [span.spanID, span]));
  const root = new TreeNode(TREE_ROOT_ID);
  trace.spans.forEach((span: TraceSpanData) => {
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
  });
  const comparator = (nodeA: TreeNode<string>, nodeB: TreeNode<string>) => {
    const a: TraceSpanData | undefined = nodeA?.value ? spansById.get(nodeA.value.toString()) : undefined;
    const b: TraceSpanData | undefined = nodeB?.value ? spansById.get(nodeB.value.toString()) : undefined;
    return +(a?.startTime! > b?.startTime!) || +(a?.startTime === b?.startTime) - 1;
  };
  trace.spans.forEach((span: TraceSpanData) => {
    const node = nodesById.get(span.spanID);
    if (node!.children.length > 1) {
      node?.children.sort(comparator);
    }
  });
  root.children.sort(comparator);
  return root;
}
