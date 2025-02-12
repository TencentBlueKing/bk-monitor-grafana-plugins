/**
 * All timestamps are in microseconds
 */

// TODO: Fix KeyValuePair types
export type TraceKeyValuePair = {
  key: string;
  type?: string;
  value: any;
};

export type TraceLink = {
  url: string;
  text: string;
};

export type TraceLog = {
  timestamp: number;
  fields: TraceKeyValuePair[];
};

export type TraceProcess = {
  serviceName: string;
  tags: TraceKeyValuePair[];
};

export type TraceSpanReference = {
  refType: 'CHILD_OF' | 'FOLLOWS_FROM';

  span?: TraceSpan | null | undefined;
  spanID: string;
  traceID: string;
  tags?: TraceKeyValuePair[];
};

export type TraceSpanData = {
  spanID: string;
  traceID: string;
  processID: string;
  operationName: string;
  // Times are in microseconds
  startTime: number;
  duration: number;
  logs: TraceLog[];
  tags?: TraceKeyValuePair[];
  kind?: string;
  statusCode?: number;
  statusMessage?: string;
  instrumentationLibraryName?: string;
  instrumentationLibraryVersion?: string;
  traceState?: string;
  references?: TraceSpanReference[];
  warnings?: null | string[];
  stackTraces?: string[];
  flags: number;
  errorIconColor?: string;
  dataFrameRowIndex?: number;
  childSpanIds?: string[];
};

export type TraceSpan = TraceSpanData & {
  depth: number;
  hasChildren: boolean;
  childSpanCount: number;
  process: TraceProcess;
  relativeStartTime: number;
  tags: NonNullable<TraceSpanData['tags']>;
  references: NonNullable<TraceSpanData['references']>;
  warnings: NonNullable<TraceSpanData['warnings']>;
  childSpanIds: NonNullable<TraceSpanData['childSpanIds']>;
  subsidiarilyReferencedBy: TraceSpanReference[];
};

export type TraceData = {
  processes: Record<string, TraceProcess>;
  traceID: string;
  warnings?: null | string[];
};

export type TraceResponse = TraceData & {
  spans: TraceSpanData[];
};

export type Trace = TraceData & {
  duration: number;
  endTime: number;
  spans: TraceSpan[];
  startTime: number;
  traceName: string;
  services: Array<{ name: string; numberOfSpans: number }>;
};

// It is a section of span that lies on critical path
export type CriticalPathSection = {
  spanId: string;
  section_start: number;
  section_end: number;
};

export interface IService {
  id: number;
  last_check_time: string;
  created_at: string;
  updated_at: string;
  bk_biz_id: number;
  app_name: string;
  name: string;
  period: string;
  period_type: string;
  frequency: null | string;
  data_type: string;
  sample_type: string;
  is_large: boolean;
}

export interface IApplication {
  bk_biz_id: number;
  app_name: string;
  app_alias: string;
}
