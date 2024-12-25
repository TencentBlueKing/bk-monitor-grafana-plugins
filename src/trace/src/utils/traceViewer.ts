import { memoize } from 'lodash';

import type { TraceSpan } from '../types/trace';

export function _getTraceNameImpl(spans: TraceSpan[]) {
  // Use a span with no references to another span in given array
  // prefering the span with the fewest references
  // using start time as a tie breaker
  let candidateSpan: TraceSpan | undefined;
  const allIDs: Set<string> = new Set(spans.map(({ spanID }) => spanID));

  for (let i = 0; i < spans.length; i++) {
    const hasInternalRef = spans[i].references?.some(
      ({ traceID, spanID }) => traceID === spans[i].traceID && allIDs.has(spanID),
    );
    if (hasInternalRef) {
      continue;
    }

    if (!candidateSpan) {
      candidateSpan = spans[i];
      continue;
    }

    const thisRefLength = spans[i].references?.length || 0;
    const candidateRefLength = candidateSpan.references?.length || 0;

    if (
      thisRefLength < candidateRefLength ||
      (thisRefLength === candidateRefLength && spans[i].startTime < candidateSpan.startTime)
    ) {
      candidateSpan = spans[i];
    }
  }
  return candidateSpan ? `${candidateSpan.process.serviceName}: ${candidateSpan.operationName}` : '';
}

export const getTraceName = memoize(_getTraceNameImpl, (spans: TraceSpan[]) => {
  if (!spans.length) {
    return 0;
  }
  return spans[0].traceID;
});

export function findHeaderTags(spans: TraceSpan[]) {
  for (let i = 0; i < spans.length; i++) {
    const method = spans[i].tags.filter(tag => {
      return tag.key === 'http.method';
    });

    const status = spans[i].tags.filter(tag => {
      return tag.key === 'http.status_code';
    });

    const url = spans[i].tags.filter(tag => {
      return tag.key === 'http.url' || tag.key === 'http.target' || tag.key === 'http.path';
    });

    if (method.length > 0 || status.length > 0 || url.length > 0) {
      return { method, status, url };
    }
  }
  return {};
}

export const getHeaderTags = memoize(findHeaderTags, (spans: TraceSpan[]) => {
  if (!spans.length) {
    return 0;
  }
  return spans[0].traceID;
});
