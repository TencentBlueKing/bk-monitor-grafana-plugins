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
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-param-reassign */
import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  DataSourceApi,
  ScopedVars,
} from '@grafana/data';
import { getBackendSrv, BackendSrvRequest, getTemplateSrv } from '@grafana/runtime';
import { QueryOption } from '../typings/config';
import { IMetric } from '../typings/metric';
import { IQueryConfig, QueryData } from '../typings/datasource';
import { VariableQuery, VariableQueryType } from '../typings/variable';
import apiCacheInstance from '../utils/api-cache';
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
  | 'metric_id'
  | 'metric_source'
  | 'metric_item'
  | 'metric_type'
  | 'object_type'
  | 'formula'
  | 'interval'
  | 'target_ip'
  | 'target_instance'
  | 'object_name'
  | 'object_id';
export type IAliasData = Partial<Record<fieldType, string>>;
export enum QueryUrl {
  testAndSaveUrl = '',
  queryDataUrl = 'time_series/query/',
  queryMetricUrl = 'time_series/metric/',
  queryMonitorObjectUrl = 'get_label/',
  queryMonitorTarget = 'topo_tree/',
  queryDimensionValue = 'get_dimension_values/',
  queryVariableField = 'get_variable_field/',
  queryVariableValue = 'get_variable_value/',
  queryMetricLevel = 'time_series/metric_level/',
  queryMetricFunction = 'time_series/functions/',
  query = 'time_series/unify_query/',
  query_config_to_promql = 'query_config_to_promql/',
  promql_to_query_config = 'promql_to_query_config/',
  get_data_source_config = 'get_data_source_config/',
  log_query = 'log/query/'
}
export default class DashboardDatasource extends DataSourceApi<QueryData, QueryOption> {
  public baseUrl: string;
  public bizId: string | number;
  public useToken: boolean;
  public url: string;
  public configData: QueryOption;
  constructor(instanceSettings: DataSourceInstanceSettings<QueryOption>) {
    super(instanceSettings);
    this.url = instanceSettings.url;
    this.configData = instanceSettings?.jsonData;
    this.baseUrl = instanceSettings?.jsonData?.baseUrl || '';
    this.useToken = instanceSettings?.jsonData?.useToken || false;
    this.bizId = this.useToken
    ? instanceSettings?.jsonData?.bizId
    : (process.env.NODE_ENV === 'development' ? 2 : (window as any).grafanaBootData.user.orgName);
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
      item?.query_configs?.forEach((config) => {
        const queryConfig = this.handleGetQueryConfig(config, options.scopedVars);
        let params = null;
        let url = '';
        if (isTableQuery) {
          url = QueryUrl.log_query;
          params = {
            data_format: 'table',
            data_source_label: queryConfig.data_source_label,
            data_type_label: queryConfig.data_type_label,
            start_time: options.range.from.unix(),
            end_time: options.range.to.unix(),
            metric_field: queryConfig.metrics[0].field,
            query_string: queryConfig.query_string,
            result_table_id: queryConfig.table,
            where: queryConfig.where,
            limit: -1,
            offset: 0,
          };
        } else {
          url = QueryUrl.query;
          params = {
            data_format: options.panelType === 'table' ? 'table' : 'time_series',
            start_time: options.range.from.unix(),
            end_time: options.range.to.unix(),
            expression: 'a',
            query_configs: [queryConfig],
          };
        }
        promiseList.push(this.request({
          url,
          data: params,
          method: 'POST',
        })
          .then((data: QueryFetchData) => (isTableQuery
            ? data
            : this.buildFetchSeries(data, options.scopedVars, config.alias, config)))
          .catch(() => []));
        configList.push(queryConfig);
      });
    });
    const needUnit = promiseList.length < 2;
    const data: any = await Promise.all(promiseList)
      .then(list => (list.reduce((pre, cur) => (cur?.length
        ? ((pre.data = [...pre.data, ...cur]), pre)
        : pre), { data: [] })))
      .catch((e) => {
        console.error(e);
        return { data: [] };
      });
    const list = {
      ...data,
      data: data.data?.map(({ unit, ...props }) => (needUnit ? { unit, ...props } : props)),
    };
    return list;
  }
  // 变量取值
  async metricFindQuery(options: VariableQuery) {
    if (!options?.queryType) {
      return Promise.resolve([]);
    }
    const query = options;
    const data = await this.getVariableValue({
      type: query.queryType,
      params: this.buildMetricFindParams(query),
    }).then(data => data.map(item => ({ text: item.label, value: item.value })));
    return data;
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
      metric_field: '_index',
      where: where.map(condition => ({ ...condition, value: this.buildWhereVariables(condition.value, {}) })),
      field: Array.isArray(group_by) ? group_by[0] || '' : group_by || '',
      start_time: (getTemplateSrv() as any).timeRange.from.unix(),
      end_time: (getTemplateSrv() as any).timeRange.to.unix(),
    };
  }
  buildFetchSeries(
    { series = [], metrics = [] }: QueryFetchData,
    scopedVars: ScopedVars,
    alias: string,
    config?: IQueryConfig,
  ) {
    const hasVariateAlias = String(alias).match(/\$/im);
    let metric: IMetric;
    let aliasData: IAliasData = {};
    // 兼容老版本变量设置
    if (hasVariateAlias && !!config) {
      metric = metrics.find(item => item.metric_field === config.metric_field
        && item.result_table_id === config.result_table_id);
      aliasData = {
        metric_id: metric?.metric_field || '',
        metric_type: metric?.result_table_name || '',
        interval: config.interval.toString(),
        formula: config.method,
      };
    }
    return series.map((serie) => {
      if (!serie.unit || serie.unit === 'none') delete serie.unit;
      return {
        ...serie,
        target: hasVariateAlias
          ? this.buildAlaisVariables(alias, scopedVars, metric, aliasData, serie.dimensions)
          : alias || serie.target,
      };
    });
  }
  handleGetQueryConfig(config: IQueryConfig, scopedVars: ScopedVars) {
    return {
      data_source_label: config.data_source_label,
      data_type_label: config.data_type_label,
      metrics: [
        {
          field: config.method === 'COUNT' ? '_index' : config.metric_field,
          method: config.method,
          alias: 'a',
        },
      ],
      query_string: getTemplateSrv().replace(config.query_string),
      table: config.result_table_id,
      group_by: config.group_by,
      where:
        config.where
          ?.filter?.(item => item.key && item.value?.length)
          .map(condition => ({
            ...condition,
            value: this.buildWhereVariables(condition.value, scopedVars),
          })) || [],
      interval: config.interval,
      interval_unit: config.interval_unit,
      time_field: config.time_field || 'time',
    };
  }
  async testDatasource() {
    if (!this.baseUrl) {
      return Promise.reject(new Error('Need Set baseUrl'));
    }
    return this.request({
      url: QueryUrl.testAndSaveUrl,
    })
      .then(() => ({
        status: 'success',
        message: 'Successfully queried the Blueking Monitor service.',
        title: 'Success',
      }))
      .catch(error => ({
        status: 'error',
        message: error.message || 'Cannot connect to Blueking Monitor REST API.',
        title: 'Error',
      }));
  }
  public buildWhereVariables(values: string[] | string, scopedVars: ScopedVars) {
    const valList = [];
    Array.isArray(values)
      && values.forEach((val) => {
        if (String(val).match(/^\$/)) {
          getTemplateSrv().replace(val, scopedVars, (v) => {
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
            matchList.forEach((set) => {
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
  async getQueryMetricLevel(data) {
    return await this.request({
      method: 'POST',
      data,
      url: QueryUrl.queryMetricLevel,
    })
      .then(data => (data || []).slice(0, window.maxMetricLevelNum || 500))
      .catch(() => []);
  }
  /**
   * @description: 通过指标信息获取对应指标详情
   * @param {*} params 指标参数
   * @return {*}
   */
  async getMetricDetailById(params) {
    const data = await this.request({
      method: 'POST',
      data: params,
      url: QueryUrl.queryMetricUrl,
    })
      .then(data => (data || []).slice(0, window.maxMetricLevelNum || 500))
      .catch(() => []);
    return data;
  }
  // 获取公共指标函数列表
  async getQueryMetricFunction(params = { type: 'grafana' }) {
    return await this.request({
      method: 'GET',
      url: QueryUrl.queryMetricFunction,
      params,
    }).catch(() => []);
  }
  // 新版获取condition dimensionlist
  public async getNewDimensionValue(options) {
    const data = await this.request({
      method: 'POST',
      url: QueryUrl.queryVariableValue,
      data: {
        type: 'dimension',
        params: {
          result_table_id: options.resultTableId,
          metric_field: options.metricField,
          field: options.field,
          data_type_label: options.dataTypeLabel,
          data_source_label: options.dataSourceLabel,
          where: [],
          start_time: (getTemplateSrv() as any).timeRange.from.unix(),
          end_time: (getTemplateSrv() as any).timeRange.to.unix(),
        },
      },
    }).catch(() => []);
    return data.map(item => ({ id: `${item.value}`, name: `${item.label}` }));
  }
  // 变量量值查询
  public async getVariableValue(data) {
    const params = {
      method: 'POST',
      url: QueryUrl.queryVariableValue,
      data,
    };
    let cacheKey: any = params;
    if (data.type === 'dimension') {
      cacheKey = Object.assign({}, params, { params: { start_time: '', end_time: '' } });
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
  // 变量名查询
  public async getVariableField(type: VariableQueryType) {
    const params = {
      url: QueryUrl.queryVariableField,
      params: {
        type,
      },
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
  /**
   * @description: 事件/日志数据源配置查询
   * @param {*} param1
   * @return {*}
   */
  public async getDataSourceConfig({ data_source_label, data_type_label }) {
    return await this.request({
      url: QueryUrl.get_data_source_config,
      method: 'GET',
      params: {
        data_source_label,
        data_type_label,
      },
    }).catch(() => []);
  }
  request({
    url,
    params = {},
    data = {},
    method = 'GET',
  }: {
    url: string;
    data?: Record<string, any> | null;
    params?: Record<string, any> | null;
    method?: string;
  }) {
    try {
      const options: BackendSrvRequest = Object.assign(
        {},
        {
          url: this.useToken ? `${this.url}/event/${url}` : this.baseUrl + url,
          method,
          showSuccessAlert: false,
          headers: {
            traceparent: `00-${random(32, 'abcdef0123456789')}-${random(16, 'abcdef0123456789')}-01`,
            'X-Requested-With': 'XMLHttpRequest',
          },
        },
        method === 'GET'
          ? { params: { ...(params || data), bk_biz_id: this.bizId } }
          : { data: { ...(data || params), bk_biz_id: this.bizId } },
      );
      return getBackendSrv()
        .datasourceRequest(options)
        .then((res) => {
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
}
