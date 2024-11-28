/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  type DataQueryRequest,
  type DataQueryResponse,
  DataSourceApi,
  type DataSourceInstanceSettings,
  dateMath,
  type DateTime,
  FieldType,
  MutableDataFrame,
  type ScopedVars,
} from '@grafana/data';
import type { NodeGraphOptions, SpanBarOptions } from '@grafana/o11y-ds-frontend';
import { type BackendSrvRequest, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { identity, omit, pick, pickBy } from 'lodash';
import { lastValueFrom, type Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// import { ALL_OPERATIONS_KEY } from './components/SearchForm';
import type { TraceIdTimeParamsOptions } from './configuration/TraceIdTimeParams';
// import { mapJaegerDependenciesResponse } from './dependencyGraphTransform';
import { createGraphFrames } from './graphTransform';
import { createTableFrame, createTraceFrame } from './responseTransform';
import type { TraceQuery } from './types';
import { convertTagsLogfmt } from './util';
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
// export interface JaegerJsonData extends DataSourceJsonData {
//   nodeGraph?: NodeGraphOptions;
//   traceIdTimeParams?: TraceIdTimeParamsOptions;
// }

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
    // this.nodeGraph = instanceSettings.jsonData.nodeGraph;
    // this.traceIdTimeParams = instanceSettings.jsonData.traceIdTimeParams;
  }

  async loadOptions<
    T = {
      text: string;
      value: string;
    }[],
  >(appName: string, field: string) {
    if (!appName || !field?.length) return [] as T;
    return await lastValueFrom(
      this.request<Record<typeof field, T>>(QueryUrl.load_options, {
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
          if (!data) return [] as T;
          return data[field];
        }),
        catchError(() => {
          return of([] as T);
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

    // Use the internal /dependencies API for rendering the dependency graph.
    // if (target.queryType === 'dependencyGraph') {
    //   const timeRange = getTemplateSrv().timeRange;
    //   const endTs = getTime(timeRange.to, true) / 1000;
    //   const lookback = endTs - getTime(timeRange.from, false) / 1000;
    //   return this.request('/api/dependencies', { endTs, lookback }).pipe(map(mapJaegerDependenciesResponse));
    // }

    if (target.queryType === 'search' && !this.isSearchFormValid(target)) {
      return of({ error: { message: 'You must select a app.' }, data: [] });
    }

    if (target.queryType !== 'search' && target.query) {
      // let url = `/api/traces/${encodeURIComponent(getTemplateSrv().replace(target.query, options.scopedVars))}`;
      // if (this.traceIdTimeParams) {
      //   url += `?start=${start}&end=${end}`;
      // }

      return this.request(QueryUrl.get_trace_detail, {
        params: {
          app_name: target.app_name,
          trace_id: target.query,
          ...this.getTimeRange(),
          bk_biz_id: this.bizId,
        },
        method: 'GET',
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

    // if (target.queryType === 'upload') {
    //   if (!this.uploadedJson) {
    //     return of({ data: [] });
    //   }

    //   try {
    //     const traceData = JSON.parse(this.uploadedJson as string).data[0];
    //     const data = [createTraceFrame(traceData)];
    //     if (this.nodeGraph?.enabled) {
    //       data.push(...createGraphFrames(traceData));
    //     }
    //     return of({ data });
    //   } catch (error) {
    //     return of({ error: { message: 'The JSON file uploaded is not in a valid format' }, data: [] });
    //   }
    // }
    const jaegerInterpolated = pick(this.applyVariables(target, options.scopedVars), [
      'service',
      'operation',
      'tags',
      'min_duration',
      'max_duration',
      'limit',
    ]);
    // remove empty properties
    let jaegerQuery = pickBy(jaegerInterpolated, identity);

    // if (jaegerQuery.operation === ALL_OPERATIONS_KEY) {
    //   jaegerQuery = omit(jaegerQuery, 'operation');
    // }

    if (jaegerQuery.tags) {
      jaegerQuery = {
        ...jaegerQuery,
        tags: convertTagsLogfmt(jaegerQuery.tags.toString()),
      };
    }
    return this.request(QueryUrl.list_trace, {
      params: {
        ...this.getTimeRange(),
        ...jaegerQuery,
        app_name: target.app_name,
        bk_biz_id: this.bizId,
      },
      method: 'GET',
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
      service: template.replace(query.service ?? '', scopedVars),
      operation: template.replace(query.operation ?? '', scopedVars),
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
      params: {
        bk_biz_id: this.bizId,
      },
      method: 'GET',
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

function getTime(date: DateTime | string, roundUp: boolean) {
  if (typeof date === 'string') {
    date = dateMath.parse(date, roundUp)!;
  }
  return date.valueOf() * 1000;
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
