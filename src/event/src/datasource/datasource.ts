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
  type DataQueryRequest,
  type DataQueryResponse,
  DataSourceApi,
  type DataSourceInstanceSettings,
  type ScopedVars,
} from '@grafana/data';
import { type BackendSrvRequest, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import apiCacheInstance from 'common/utils/api-cache';

import { type QueryOption } from '../typings/config';
import { type IQueryConfig, type QueryData } from '../typings/datasource';
import { type IMetric } from '../typings/metric';
import { type VariableQuery, VariableQueryType } from '../typings/variable';
import { random } from '../utils/utils';
interface QueryFetchData {
  metrics: IMetric[];
  series: {
    datapoints: [number, number][];
    dimensions: Record<string, string>;
    target: string;
    unit: string;
  }[];
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
  get_data_source_config = 'get_data_source_config/',
  log_query = 'log/query/',
  promql_to_query_config = 'promql_to_query_config/',
  query = 'time_series/unify_query/',
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

  public buildAlaisVariables(
    alias: string,
    scopedVars: ScopedVars,
    metric: IMetric,
    aliasData: IAliasData,
    dimensions: Record<string, string>,
  ) {
    const regex = /\$(\w+)|\[\[([\s\S]+?)\]\]/g;
    const aliasName = alias.replace(regex, (match: any, g1: any, g2: any) => {
      const group = g1 || g2;
      if (aliasData) {
        if (Object.keys(aliasData).includes(group)) {
          return aliasData[group] || match;
        }
        if (/^(tag_|dim_)/im.test(group)) {
          const tag = group.replace('tag_', '').replace('dim_', '');
          return typeof dimensions[tag] === 'undefined' ? match : dimensions[tag];
        }
        if (/^(metric_)/im.test(group)) {
          const tag = group.replace('metric_', '');
          const matchList = tag.match(/(_[a-zA-Z])/g);
          let newKey = tag;
          if (matchList) {
            matchList.forEach(set => {
              newKey = newKey.replace(set, set.replace('_', '').toLocaleUpperCase());
            });
          }
          return typeof metric?.[newKey] === 'undefined' ? match : metric[newKey];
        }
      }
      const variables = this.buildWhereVariables([match], scopedVars);
      return variables.length ? `(${variables.join(',')})` : match;
    });
    return aliasName;
  }
  buildFetchSeries(
    { metrics = [], series = [] }: QueryFetchData,
    scopedVars: ScopedVars,
    alias: string,
    config?: IQueryConfig,
  ) {
    const hasVariateAlias = String(alias).match(/\$/im);
    let metric: IMetric;
    let aliasData: IAliasData = {};
    // 兼容老版本变量设置
    if (hasVariateAlias && !!config) {
      metric = metrics.find(
        item => item.metric_field === config.metric_field && item.result_table_id === config.result_table_id,
      );
      aliasData = {
        formula: config.method,
        interval: config.interval.toString(),
        metric_id: metric?.metric_field || '',
        metric_type: metric?.result_table_name || '',
      };
    }
    return series.map(serie => {
      if (!serie.unit || serie.unit === 'none') delete serie.unit;
      return {
        ...serie,
        target: hasVariateAlias
          ? this.buildAlaisVariables(alias, scopedVars, metric, aliasData, serie.dimensions)
          : alias || serie.target,
      };
    });
  }
  buildMetricFindParams(query: VariableQuery) {
    if (query.queryType !== VariableQueryType.Dimension) {
      return {
        label_field: query.showField,
        value_field: query.valueField,
        where:
          query.where?.map?.(condition => ({
            ...condition,
            value: this.buildWhereVariables(condition.value, {}),
          })) || [],
      };
    }
    const {
      dimensionConfig: { group_by, where = [], ...params },
    } = query;
    return {
      ...params,
      end_time: (getTemplateSrv() as any).timeRange.to.unix(),
      field: Array.isArray(group_by) ? group_by[0] || '' : group_by || '',
      metric_field: '_index',
      start_time: (getTemplateSrv() as any).timeRange.from.unix(),
      where: where.map(condition => ({ ...condition, value: this.buildWhereVariables(condition.value, {}) })),
    };
  }
  public buildWhereVariables(values: string | string[], scopedVars: ScopedVars) {
    const valList = [];
    Array.isArray(values) &&
      values.forEach(val => {
        if (String(val).match(/^\$/)) {
          getTemplateSrv().replace(val, scopedVars, v => {
            if (v) {
              Array.isArray(v) ? valList.push(...v) : valList.push(v);
            } else {
              valList.push(val);
            }
          });
        } else {
          valList.push(getTemplateSrv().replace(val, scopedVars));
        }
      });
    return valList;
  }
  /**
   * @description: 事件/日志数据源配置查询
   * @param {*} param1
   * @return {*}
   */
  public async getDataSourceConfig({ data_source_label, data_type_label }) {
    return await this.request({
      method: 'GET',
      params: {
        data_source_label,
        data_type_label,
      },
      url: QueryUrl.get_data_source_config,
    }).catch(() => []);
  }
  /**
   * @description: 通过指标信息获取对应指标详情
   * @param {*} params 指标参数
   * @return {*}
   */
  async getMetricDetailById(params) {
    const data = await this.request({
      data: params,
      method: 'POST',
      url: QueryUrl.queryMetricUrl,
    })
      .then(data => (data || []).slice(0, window.maxMetricLevelNum || 500))
      .catch(() => []);
    return data;
  }
  // 新版获取condition dimensionlist
  public async getNewDimensionValue(options) {
    const data = await this.request({
      data: {
        params: {
          data_source_label: options.dataSourceLabel,
          data_type_label: options.dataTypeLabel,
          end_time: (getTemplateSrv() as any).timeRange.to.unix(),
          field: options.field,
          metric_field: options.metricField,
          result_table_id: options.resultTableId,
          start_time: (getTemplateSrv() as any).timeRange.from.unix(),
          where: [],
        },
        type: 'dimension',
      },
      method: 'POST',
      url: QueryUrl.queryVariableValue,
    }).catch(() => []);
    return data.map(item => ({ id: `${item.value}`, name: `${item.label}` }));
  }
  // 获取公共指标函数列表
  async getQueryMetricFunction(params = { type: 'grafana' }) {
    return await this.request({
      method: 'GET',
      params,
      url: QueryUrl.queryMetricFunction,
    }).catch(() => []);
  }
  async getQueryMetricLevel(data) {
    return await this.request({
      data,
      method: 'POST',
      url: QueryUrl.queryMetricLevel,
    })
      .then(data => (data || []).slice(0, window.maxMetricLevelNum || 500))
      .catch(() => []);
  }
  // 变量名查询
  public async getVariableField(type: VariableQueryType) {
    const params = {
      params: {
        type,
      },
      url: QueryUrl.queryVariableField,
    };
    const cacheKey = JSON.stringify(params);
    if (apiCacheInstance.getCache(cacheKey)) {
      const data = await apiCacheInstance.getCache(cacheKey);
      return data;
    }
    apiCacheInstance.setCache(
      cacheKey,
      this.request(params).catch(() => []),
    );
    const data = await apiCacheInstance.getCache(cacheKey);
    return data;
  }
  // 变量量值查询
  public async getVariableValue(data) {
    const params = {
      data,
      method: 'POST',
      url: QueryUrl.queryVariableValue,
    };
    let cacheKey: any = params;
    if (data.type === 'dimension') {
      cacheKey = Object.assign({}, params, { params: { end_time: '', start_time: '' } });
    }
    cacheKey = JSON.stringify(cacheKey);
    if (apiCacheInstance.getCache(cacheKey)) {
      const data = await apiCacheInstance.getCache(cacheKey);
      return data;
    }
    apiCacheInstance.setCache(
      cacheKey,
      this.request(params).catch(() => []),
    );
    const res = await apiCacheInstance.getCache(cacheKey);
    return res;
  }
  handleGetQueryConfig(config: IQueryConfig, scopedVars: ScopedVars) {
    return {
      data_source_label: config.data_source_label,
      data_type_label: config.data_type_label,
      group_by: config.group_by,
      interval: config.interval,
      interval_unit: config.interval_unit,
      metrics: [
        {
          alias: 'a',
          field: config.method === 'COUNT' ? '_index' : config.metric_field,
          method: config.method,
        },
      ],
      query_string: getTemplateSrv().replace(config.query_string),
      table: config.result_table_id,
      time_field: config.time_field || 'time',
      where:
        config.where
          ?.filter?.(item => item.key && item.value?.length)
          .map(condition => ({
            ...condition,
            value: this.buildWhereVariables(condition.value, scopedVars),
          })) || [],
    };
  }
  // 变量取值
  async metricFindQuery(options: VariableQuery) {
    if (!options?.queryType) {
      return Promise.resolve([]);
    }
    const query = options;
    const data = await this.getVariableValue({
      params: this.buildMetricFindParams(query),
      type: query.queryType,
    }).then(data => data.map(item => ({ text: item.label, value: item.value })));
    return data;
  }
  async query(options: DataQueryRequest<QueryData> & { panelType: string }): Promise<DataQueryResponse> {
    const targetList = options.targets.filter(item => !item.hide);
    if (!targetList?.length) {
      return Promise.resolve({ data: [] });
    }
    const promiseList = [];
    const isTableQuery = options.panelType === 'table';
    targetList.forEach((item: QueryData) => {
      const configList = [];
      // 指标数据请求
      item?.query_configs?.forEach(config => {
        const queryConfig = this.handleGetQueryConfig(config, options.scopedVars);
        let params = null;
        let url = '';
        if (isTableQuery) {
          url = QueryUrl.log_query;
          params = {
            data_format: 'table',
            data_source_label: queryConfig.data_source_label,
            data_type_label: queryConfig.data_type_label,
            end_time: options.range.to.unix(),
            limit: -1,
            metric_field: queryConfig.metrics[0].field,
            offset: 0,
            query_string: queryConfig.query_string,
            result_table_id: queryConfig.table,
            start_time: options.range.from.unix(),
            where: queryConfig.where,
          };
        } else {
          url = QueryUrl.query;
          params = {
            data_format: options.panelType === 'table' ? 'table' : 'time_series',
            end_time: options.range.to.unix(),
            expression: 'a',
            query_configs: [queryConfig],
            start_time: options.range.from.unix(),
          };
        }
        promiseList.push(
          this.request({
            data: params,
            method: 'POST',
            url,
          })
            .then((data: QueryFetchData) =>
              isTableQuery ? data : this.buildFetchSeries(data, options.scopedVars, config.alias, config),
            )
            .catch(() => []),
        );
        configList.push(queryConfig);
      });
    });
    const needUnit = promiseList.length < 2;
    const data: any = await Promise.all(promiseList)
      .then(list =>
        list.reduce((pre, cur) => (cur?.length ? ((pre.data = [...pre.data, ...cur]), pre) : pre), { data: [] }),
      )
      .catch(e => {
        console.error(e);
        return { data: [] };
      });
    const list = {
      ...data,
      data: data.data?.map(({ unit, ...props }) => (needUnit ? { unit, ...props } : props)),
    };
    return list;
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
          url: this.useToken ? `${this.url}/event/${url}` : this.baseUrl + url,
        },
        method === 'GET'
          ? { params: { ...(params || data), bk_biz_id: this.bizId } }
          : { data: { ...(data || params), bk_biz_id: this.bizId } },
      );
      return getBackendSrv()
        .datasourceRequest(options)
        .then(res => {
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
      return Promise.reject(new Error('Need Set baseUrl'));
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
