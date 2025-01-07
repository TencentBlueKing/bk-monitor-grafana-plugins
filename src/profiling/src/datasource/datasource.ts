/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台社区版 (BlueKing PaaS Community Edition) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台社区版 (BlueKing PaaS Community Edition) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台社区版 (BlueKing PaaS Community Edition):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

import {
  type BootData,
  type DataQueryRequest,
  type DataQueryResponse,
  DataSourceApi,
  type DataSourceInstanceSettings,
  toDataFrame,
} from '@grafana/data';
import {
  type BackendDataSourceResponse,
  type BackendSrvRequest,
  getBackendSrv,
  getTemplateSrv,
} from '@grafana/runtime';
import { catchError, lastValueFrom, map, merge, Observable, of } from 'rxjs';

import type { QueryOption } from '../typings/config';
import type { ProfilingQuery } from '../typings/datasource';
import type { ICommonItem } from '../typings/metric';
import type { IApplication } from '../typings/profile';
import { random } from 'common/utils/utils';
export enum QueryUrl {
  get_profile_application_service = 'get_profile_application_service/',
  get_profile_labels = 'get_profile_label/',
  get_profile_type = 'get_profile_type/',
  get_profile_values = 'get_profile_label_values/',
  query_graph_profile = 'query_graph_profile/',
  testAndSaveUrl = '',
}
declare global {
  interface Window {
    grafanaBootData?: BootData;
  }
}
export default class DashboardDatasource extends DataSourceApi<ProfilingQuery, QueryOption> {
  public baseUrl: string;
  public bizId?: number | string;
  public configData: QueryOption;
  public url?: string;
  public useToken: boolean;
  constructor(instanceSettings: DataSourceInstanceSettings<QueryOption>) {
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

  query(request: DataQueryRequest<ProfilingQuery>): Observable<DataQueryResponse> {
    const filterTarget = {
      ...request,
      targets: request.targets.filter(t => t.hide !== true && t.app_name && t.service_name && t.profile_type),
    };
    const streams: Array<Observable<DataQueryResponse>> = [];
    for (const target of filterTarget.targets) {
      streams.push(
        new Observable(subscriber => {
          this.queryProfilingGraph(filterTarget, target)
            .then(events => {
              if (Object.keys(events || {}).length === 0) {
                subscriber.next({ data: [toDataFrame([])] });
                return;
              }
              subscriber.next({ data: [toDataFrame(events)] });
            })
            .catch(err => subscriber.error(err))
            .finally(() => subscriber.complete());
        }),
      );
    }
    return merge(...streams);
  }
  async queryProfilingGraph(options: DataQueryRequest, target: ProfilingQuery) {
    const filterLabel: Record<string, string> = {};
    for (const item of target?.filter_labels || []) {
      if (!item.value?.length || !item.key) {
        continue;
      }
      // 多选逻辑 暂时关闭
      // const values: string[] = [];
      // for (const value of item.value) {
      //   const result = getTemplateSrv().replace(value, options.scopedVars);
      //   if (Array.isArray(result)) {
      //     values.push(...result);
      //     continue;
      //   }
      //   values.push(result);
      // }
      // filterLabel[item.key] = Array.from(new Set(values));
      filterLabel[item.key] = item.value;
    }
    return await lastValueFrom(
      this.request<BackendDataSourceResponse>(QueryUrl.query_graph_profile, {
        data: {
          bk_biz_id: this.bizId,
          app_name: getTemplateSrv().replace(target.app_name),
          service_name: getTemplateSrv().replace(target.service_name),
          data_type: target.profile_type,
          profile_id: target.profile_id,
          offset: target.offset,
          filter_labels: filterLabel,
          diagram_types: ['grafana_flame'],
          ...this.getTimeRange('ns'),
        },
        method: 'POST',
      }),
    );
  }
  getTimeRange(type: 's' | 'ns' = 's'): Partial<{ start_time: number; end_time: number; start: number; end: number }> {
    const range = (getTemplateSrv() as any).timeRange;
    if (type === 'ns') {
      return { start: range.from.valueOf() * 1000, end: range.to.valueOf() * 1000 };
    }
    return {
      start_time: range.from.unix(),
      end_time: range.to.unix(),
    };
  }
  getProfileTypes(params: Pick<ProfilingQuery, 'app_name' | 'service_name'>) {
    return this.request<{
      bk_biz_id: number;
      app_name: string;
      name: string;
      create_time: string;
      last_check_time: string;
      data_types: Array<{
        key: string;
        name: string;
        is_large: boolean;
      }>;
    }>(QueryUrl.get_profile_type, {
      params: {
        bk_biz_id: this.bizId,
        ...params,
        ...this.getTimeRange(),
      },
      method: 'GET',
    }).pipe(
      map(data =>
        (data?.data_types || []).map(item => ({
          label: item.name,
          value: item.key,
        })),
      ),
      catchError(() => {
        return of([]);
      }),
    );
  }
  getProfileApplicationService() {
    return this.request<{
      normal?: IApplication[];
      no_data?: IApplication[];
    }>(QueryUrl.get_profile_application_service, {
      params: {
        bk_biz_id: this.bizId,
        ...this.getTimeRange(),
      },
      method: 'GET',
    }).pipe(
      map(data => {
        if (!data) return [];
        return [...(data?.normal || []), ...(data?.no_data || [])];
      }),
      catchError(() => {
        return of([] as IApplication[]);
      }),
    );
  }
  getProfileLabels(params: Pick<ProfilingQuery, 'app_name' | 'service_name'>) {
    return this.request<{
      label_keys: string[];
    }>(QueryUrl.get_profile_labels, {
      params: {
        bk_biz_id: this.bizId,
        ...params,
        ...this.getTimeRange(),
      },
      method: 'GET',
    }).pipe(
      map(data => (data?.label_keys || []).map<ICommonItem>(key => ({ id: key, name: key }))),
      catchError(() => {
        return of([] as ICommonItem[]);
      }),
    );
  }
  getProfileValues(params: Pick<ProfilingQuery, 'app_name' | 'service_name'> & { label_key: string }) {
    return this.request<{
      label_values: string[];
    }>(QueryUrl.get_profile_values, {
      params: {
        bk_biz_id: this.bizId,
        ...params,
        ...this.getTimeRange('ns'),
        offset: 0,
        rows: 1000,
      },
      method: 'GET',
    }).pipe(
      map(data => (data?.label_values || []).map<ICommonItem>(key => ({ id: key, name: key }))),
      catchError(() => {
        return of([] as ICommonItem[]);
      }),
    );
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
  private request<T>(apiUrl: string, options?: Partial<BackendSrvRequest>): Observable<T | undefined> {
    const url = `${this.useToken ? `${this.url}/profiling/${apiUrl}` : this.baseUrl + apiUrl}`;
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
