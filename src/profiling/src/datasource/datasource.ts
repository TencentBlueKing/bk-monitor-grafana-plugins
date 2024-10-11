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
  BootData,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  toDataFrame,
} from '@grafana/data';
import {
  BackendDataSourceResponse,
  BackendSrvRequest,
  getBackendSrv,
  getTemplateSrv,
  TemplateSrv,
} from '@grafana/runtime';
import { lastValueFrom, map, merge, Observable } from 'rxjs';

import { QueryOption } from '../typings/config';
import { ProfilingQuery } from '../typings/datasource';
import { IProfileApp } from '../typings/profile';
import { random } from '../utils/utils';
export enum QueryUrl {
  get_profile_application_service = 'get_profile_application_service ',
  query_graph_profile = 'query_graph_profile',
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
  constructor(
    private instanceSettings: DataSourceInstanceSettings<QueryOption>,
    private readonly templateSrv: TemplateSrv = getTemplateSrv(),
  ) {
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
      targets: request.targets.filter(t => t.hide !== true),
    };
    const streams: Array<Observable<DataQueryResponse>> = [];
    for (const target of filterTarget.targets) {
      streams.push(
        new Observable(subscriber => {
          this.queryProfilingGraph(filterTarget, target)
            .then(events => subscriber.next({ data: [toDataFrame(events)] }))
            .catch(err => subscriber.error(err))
            .finally(() => subscriber.complete());
        }),
      );
    }
    return merge(...streams);
  }
  async queryProfilingGraph(options: DataQueryRequest, target: ProfilingQuery) {
    return await lastValueFrom(
      this.request<BackendDataSourceResponse>(QueryUrl.query_graph_profile, {
        data: {
          bk_biz_id: this.bizId,
          start: options.range.from.valueOf(),
          end: options.range.to.valueOf(),
          app_name: target.app_name,
          service_name: target.service_name,
          data_type: target.data_type,
          profile_id: target.profile_id,
          offset: target.offset,
          filter_labels: target.filter_labels,
        },
        method: 'POST',
      }),
    );
  }
  async getProfileApplicationService() {
    return await lastValueFrom(
      this.request<IProfileApp>(QueryUrl.get_profile_application_service, {
        data: {
          bk_biz_id: this.bizId,
        },
        method: 'GET',
      }),
    ).catch(() => undefined);
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
  private request<T = any>(apiUrl: string, options?: Partial<BackendSrvRequest>): Observable<T> {
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
      .fetch<T>(req)
      .pipe(map(res => res.data));
  }
}
