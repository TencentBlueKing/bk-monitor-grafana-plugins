/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  type DataQueryRequest,
  type DataQueryResponse,
  DataSourceApi,
  type DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame,
  type ScopedVars,
} from '@grafana/data';
import type { NodeGraphOptions, SpanBarOptions } from '@grafana/o11y-ds-frontend';
import { type BackendSrvRequest, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { identity, pick, pickBy } from 'lodash';
import { lastValueFrom, type Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import type { TraceIdTimeParamsOptions } from './configuration/TraceIdTimeParams';
import { createGraphFrames } from './graphTransform';
import { createTableFrame, createTraceFrame } from './responseTransform';
import type { TraceQuery } from './types';
import { convertTagsFilters } from './util';
import type { QueryOption } from './types/config';
import { random } from 'common/utils/utils';
import type { IApplication } from './types/trace';
export enum QueryUrl {
  list_application = 'list_trace_application_info/',
  load_options = 'get_trace_field_option_values/',
  list_trace = 'list_trace/',
  get_trace_detail = 'get_trace_detail/',
  testAndSaveUrl = '',
}

export default class TraceDatasource extends DataSourceApi<TraceQuery, QueryOption> {
  uploadedJson: ArrayBuffer | null | string = null;
  nodeGraph?: NodeGraphOptions;
  traceIdTimeParams?: TraceIdTimeParamsOptions;
  spanBar?: SpanBarOptions;

  public baseUrl: string;
  public bizId?: number | string;
  public configData: QueryOption;
  public url?: string;
  public useToken: boolean;
  constructor(private instanceSettings: DataSourceInstanceSettings<QueryOption>) {
    super(instanceSettings);
    this.url = instanceSettings.url;
    this.configData = instanceSettings?.jsonData;
    this.baseUrl = instanceSettings?.jsonData?.baseUrl || '';
    this.useToken = instanceSettings?.jsonData?.useToken || false;
    this.bizId = this.useToken
      ? instanceSettings?.jsonData?.bizId
      : process.env.NODE_ENV === 'development'
        ? 2
        : window?.grafanaBootData?.user.orgName;
  }

  async loadOptions<
    T extends {
      text: string;
      value: string;
    },
  >(appName: string, field: string) {
    if (!appName || !field?.length) return [] as T[];
    return await lastValueFrom(
      this.request<Record<typeof field, T[]>>(QueryUrl.load_options, {
        data: {
          fields: [field],
          ...this.getTimeRange(),
          bk_biz_id: this.bizId,
          app_name: appName,
        },
        hideFromInspector: true,
        method: 'POST',
      }).pipe(
        map(data => {
          if (!data) return [] as T[];
          return data[field];
        }),
        catchError(() => {
          return of([] as T[]);
        }),
      ),
    );
  }

  isSearchFormValid(query: TraceQuery): boolean {
    return !!query.app_name;
  }

  query(options: DataQueryRequest<TraceQuery>): Observable<DataQueryResponse> {
    // At this moment we expect only one target. In case we somehow change the UI to be able to show multiple
    // traces at one we need to change this.
    const target: TraceQuery = options.targets[0];

    if (!target?.app_name) {
      return of({ data: [emptyTraceDataFrame] });
    }
    if (target.queryType === 'search' && !this.isSearchFormValid(target)) {
      return of({ error: { message: 'You must select a app.' }, data: [] });
    }
    if (target.queryType !== 'search' && target.query) {
      return this.request(QueryUrl.get_trace_detail, {
        data: {
          app_name: target.app_name,
          trace_id: target.query,
          ...this.getTimeRange(),
          bk_biz_id: this.bizId,
        },
        method: 'POST',
      }).pipe(
        map(response => {
          const traceData = response?.[0];
          if (!traceData) {
            return { data: [emptyTraceDataFrame] };
          }
          const data = [createTraceFrame(traceData)];
          if (this.nodeGraph?.enabled) {
            data.push(...createGraphFrames(traceData));
          }
          return {
            data,
          };
        }),
      );
    }
    const traceInterpolated = pick(this.applyVariables(target, options.scopedVars), [
      'service',
      'spans',
      'tags',
      'min_duration',
      'max_duration',
      'limit',
    ]);
    // remove empty properties
    let traceQuery = pickBy(traceInterpolated, identity);

    // if (traceQuery.spans === ALL_OPERATIONS_KEY) {
    //   traceQuery = omit(traceQuery, 'spans');
    // }

    return this.request(QueryUrl.list_trace, {
      data: {
        ...this.getTimeRange(),
        app_name: target.app_name,
        bk_biz_id: this.bizId,
        filters: [
          ...convertTagsFilters({
            span_name: traceQuery.service,
            'resource.service.name': traceQuery.spans,
          }),
          ...convertTagsFilters(traceQuery.tags?.toString()),
        ],
        limit: traceQuery.limit,
        min_duration: traceQuery.min_duration,
        max_duration: traceQuery.max_duration,
      },
      method: 'POST',
    }).pipe(
      map(data => {
        return {
          data: [createTableFrame(target.app_name!, data.data || [], this.instanceSettings)],
        };
      }),
    );
  }

  interpolateVariablesInQueries(queries: TraceQuery[], scopedVars: ScopedVars): TraceQuery[] {
    if (!queries || queries.length === 0) {
      return [];
    }

    return queries.map(query => {
      return {
        ...query,
        datasource: this.getRef(),
        ...this.applyVariables(query, scopedVars),
      };
    });
  }

  applyVariables(query: TraceQuery, scopedVars: ScopedVars) {
    let expandedQuery = { ...query };
    const template = getTemplateSrv();
    return {
      ...expandedQuery,
      tags: template.replace(query.tags ?? '', scopedVars),
      service: query.service,
      spans: query.spans,
      min_duration: template.replace(query.min_duration ?? '', scopedVars),
      max_duration: template.replace(query.max_duration ?? '', scopedVars),
    };
  }

  async testDatasource() {
    if (!this.baseUrl) {
      return {
        message: 'Need Set baseUrl',
        status: 'error',
      };
    }
    if (this.useToken && !this.configData?.bizId) {
      return {
        message: 'Need Set bizId',
        status: 'error',
      };
    }
    return lastValueFrom(
      this.request(QueryUrl.testAndSaveUrl, {
        params: {
          bk_biz_id: this.bizId,
        },
      }),
    )
      .then(() => ({
        message: 'Successfully queried the Blueking Monitor service.',
        status: 'success',
        title: 'Success',
      }))
      .catch(error => ({
        message: error.message || 'Cannot connect to Blueking Monitor REST API.',
        status: 'error',
        title: 'Error',
      }));
  }

  getTimeRange(): { start_time: number; end_time: number } {
    const range = (getTemplateSrv() as any).timeRange;
    return {
      start_time: range.from.unix(),
      end_time: range.to.unix(),
    };
  }

  getQueryDisplayText(query: TraceQuery) {
    return query.query || '';
  }
  getListApplication() {
    return this.request<IApplication[]>(QueryUrl.list_application, {
      data: {
        bk_biz_id: this.bizId,
      },
      method: 'POST',
    }).pipe(
      map(data => {
        if (!data) return [];
        return data;
      }),
      catchError(() => {
        return of([] as IApplication[]);
      }),
    );
  }
  private request<T = any>(apiUrl: string, options?: Partial<BackendSrvRequest>): Observable<T | undefined> {
    const url = `${this.useToken ? `${this.url}/trace/${apiUrl}` : this.baseUrl + apiUrl}`;
    const req = {
      ...options,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        traceparent: `00-${random(32, 'abcdef0123456789')}-${random(16, 'abcdef0123456789')}-01`,
      },
      url,
    };
    return getBackendSrv()
      .fetch<{
        data: T;
        result: boolean;
      }>(req)
      .pipe(
        map(res => {
          if (res?.data?.result === false) {
            throw res.data;
          }
          if (res.status === 200 && res?.data?.result) {
            return res.data.data;
          }
          throw res.data;
        }),
      );
  }
}
const emptyTraceDataFrame = new MutableDataFrame({
  fields: [
    {
      name: 'trace',
      type: FieldType.trace,
      values: [],
    },
  ],
  meta: {
    preferredVisualisationType: 'trace',
    custom: {
      traceFormat: 'jaeger',
    },
  },
});
