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
/* eslint-disable @typescript-eslint/naming-convention */
import {
  BootData,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
} from '@grafana/data';
import { BackendSrvRequest, getBackendSrv } from '@grafana/runtime';

import { QueryOption } from '../typings/config';
import { IMetric } from '../typings/metric';
import { random } from '../utils/utils';
export interface QueryFetchData {
  metrics: IMetric[];
  series: Array<{
    datapoints: Array<[number, number]>;
    dimensions: Record<string, string>;
    target: string;
    unit: string;
  }>;
}
export type fieldType =
  | 'formula'
  | 'interval'
  | 'metric_id'
  | 'metric_item'
  | 'metric_source'
  | 'metric_type'
  | 'object_id'
  | 'object_name'
  | 'object_type'
  | 'target_instance'
  | 'target_ip';
export type IAliasData = Partial<Record<fieldType, string>>;
export enum QueryUrl {
  add_custom_metric = 'add_custom_metric/',
  get_metric_list = 'get_metric_list/',
  graph_promql_query = 'graph_promql_query/',
  promql_to_query_config = 'promql_to_query_config/',
  query = 'time_series/unify_query/',
  query_async_task_result = 'query_async_task_result/',
  query_config_to_promql = 'query_config_to_promql/',
  queryDataUrl = 'time_series/query/',
  queryDimensionValue = 'get_dimension_values/',
  queryMetricFunction = 'time_series/functions/',
  queryMetricLevel = 'time_series/metric_level/',
  queryMetricUrl = 'time_series/metric/',
  queryMonitorObjectUrl = 'get_label/',
  queryMonitorTarget = 'topo_tree/',
  queryVariableField = 'get_variable_field/',
  queryVariableValue = 'get_variable_value/',
  testAndSaveUrl = '',
  update_metric_list_by_biz = 'update_metric_list_by_biz/',
}
declare global {
  interface Window {
    grafanaBootData?: BootData;
  }
}
export default class DashboardDatasource extends DataSourceApi<QueryData, QueryOption> {
  public baseUrl: string;
  public bizId: number | string;
  public configData: QueryOption;
  public url: string;
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
        : (window as any).grafanaBootData.user.orgName;
  }

  /**
   * @description: panel query api
   * @param {DataQueryRequest} options
   * @return {*}
   */
  async query(options: DataQueryRequest<QueryData>): Promise<DataQueryResponse> {
    const targetList = options.targets.filter(item => !item.hide);
    const down_sample_range = options.interval;
    if (!targetList?.length) {
      return Promise.resolve({ data: [] });
    }
    return [];
  }
  request({
    data = {},
    method = 'GET',
    params = {},
    url,
  }: {
    data?: Record<string, any> | null;
    method?: string;
    params?: Record<string, any> | null;
    url: string;
  }) {
    try {
      const options: BackendSrvRequest = Object.assign(
        {},
        {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            traceparent: `00-${random(32, 'abcdef0123456789')}-${random(16, 'abcdef0123456789')}-01`,
          },
          method,
          showSuccessAlert: false,
          url: this.useToken ? `${this.url}/profiling/${url}` : this.baseUrl + url,
        },
        method === 'GET'
          ? { params: { ...(params || data), bk_biz_id: this.bizId } }
          : { data: { ...(data || params), bk_biz_id: this.bizId } },
      );
      return getBackendSrv()
        .datasourceRequest(options)
        .then(res => {
          if (res?.data?.result === false) {
            return Promise.reject(res.data);
          }
          if (res.status === 200 && res?.data?.result) {
            return res.data.data;
          }
          return [];
        })
        .catch(error => Promise.reject(error));
    } catch (error) {
      return Promise.reject(error);
    }
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
    return this.request({
      url: QueryUrl.testAndSaveUrl,
    })
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
}
