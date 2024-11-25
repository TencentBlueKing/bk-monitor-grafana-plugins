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
  type DataSourceInstanceSettings,
  DataSourceApi,
  type ScopedVars,
  type TimeRange,
  type DataFrame,
  FieldType,
  ArrayVector,
  type Field,
  TIME_SERIES_TIME_FIELD_NAME,
  TIME_SERIES_VALUE_FIELD_NAME,
  getDisplayProcessor,
} from '@grafana/data';
import { getBackendSrv, type BackendSrvRequest, getTemplateSrv } from '@grafana/runtime';
import apiCacheInstance from 'common/utils/api-cache';

import { type QueryOption } from '../typings/config';
import { DIM_NULL_ID, type IQueryConfig, type QueryData } from '../typings/datasource';
import { type IMetric, type ITargetData, type EditMode, type IntervalType } from '../typings/metric';
import { type K8sVariableQueryType, ScenarioType, type VariableQuery, VariableQueryType } from '../typings/variable';
import { handleTransformOldVariableQuery } from '../utils/common';
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
  add_custom_metric = 'add_custom_metric/',
  get_alarm_event_dimension_value = 'get_alarm_event_dimension_value/', // 告警事件维度查询
  get_alarm_event_field = 'get_alarm_event_field/', // 告警事件字段查询
  get_metric_list = 'get_metric_list/',
  graph_promql_query = 'graph_promql_query/',
  promql_to_query_config = 'promql_to_query_config/',
  query = 'time_series/unify_query/',
  query_alarm_event_graph = 'query_alarm_event_graph/', // 告警事件数据查询
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
   * @description: 添加自定义指标
   * @return {*}
   */
  async addCustomMetric(data: { result_table_id: string; metric_field: string }) {
    return await this.request({
      method: 'POST',
      url: QueryUrl.add_custom_metric,
      data,
    });
  }
  public buildAlaisVariables(
    alias: string,
    scopedVars: ScopedVars,
    metric: IMetric,
    aliasData: IAliasData,
    dimensions: Record<string, string>,
  ) {
    const regex = /\$([\w]+)|\[\[([\s\S]+?)\]\]/g;
    const tagRegx = /(\$(tag_|dim_)\$[\w.]+)/gm;
    let aliasNew = alias;
    aliasNew = alias.replace(tagRegx, (match: any, g1: any, g2: any) => {
      const group = g1 || g2;
      let tag = group.replace('$tag_', '').replace('$dim_', '');
      if (regex.test(tag)) {
        tag = getTemplateSrv().replace(tag, scopedVars);
        return typeof dimensions[tag] === 'undefined' ? match : dimensions[tag];
      }
      return match;
    });
    const aliasName = aliasNew.replace(regex, (match: any, g1: any, g2: any) => {
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
          if (typeof metric?.[newKey] === 'undefined') {
            return metric?.[tag] || match;
          }
          return metric?.[newKey] || match;
        }
      }
      const variables = this.buildWhereVariables([match], undefined);

      return variables.length ? (variables.length === 1 ? variables.join('') : `(${variables.join(',')})`) : match;
    });
    return aliasName;
  }
  buildFetchSeries(
    { series = [], metrics = [] }: QueryFetchData,
    scopedVars: ScopedVars,
    alias: string,
    config?: IQueryConfig,
    query?: QueryData,
    isExpression?: boolean,
  ) {
    const hasVariateAlias = String(alias).match(/\$/im);
    let metric: IMetric;
    let aliasData: IAliasData = {};
    // 兼容老版本变量设置
    if (hasVariateAlias && !!config) {
      metric = isExpression
        ? metrics[0]
        : metrics.find(
            item => item.metric_field === config.metric_field && item.result_table_id === config.result_table_id,
          );
      aliasData = {
        metric_id: metric?.metric_field,
        metric_source: metric?.data_source_label,
        object_type: metric?.result_table_label,
        metric_type: metric?.result_table_name,
        metric_item: metric?.related_name,
        interval: config.interval.toString(),
        formula: config.method,
        object_id: metric?.result_table_label,
        object_name: metric?.result_table_label_name,
      };
    }
    if (query.format === 'heatmap') {
      return this.formatHeatmap(series, hasVariateAlias, aliasData, alias, scopedVars, metric, query.refId);
    }
    if (query.format === 'table') {
      return this.formatTable(series, hasVariateAlias, aliasData, alias, scopedVars, metric, query.refId);
    }
    return this.formatTimeseries(series, hasVariateAlias, aliasData, alias, scopedVars, metric, query.refId);
  }
  buildMetricFindParams(query: VariableQuery, scopedVars?: any) {
    if (query.queryType === VariableQueryType.Promql) {
      return {
        start_time: (getTemplateSrv() as any).timeRange.from.unix(),
        end_time: (getTemplateSrv() as any).timeRange.to.unix(),
        promql: this.buildPromqlVariables(query.promql, scopedVars),
      };
    }
    if (query.queryType !== VariableQueryType.Dimension) {
      return {
        label_field: query.showField,
        value_field: query.valueField,
        where:
          query.where?.map?.(condition => ({ ...condition, value: this.buildWhereVariables(condition.value, {}) })) ||
          [],
      };
    }
    const {
      metricConfig: { group_by, where = [], ...params },
    } = query;
    return {
      ...params,
      where: where.map(condition => ({ ...condition, value: this.buildWhereVariables(condition.value, {}) })),
      field: Array.isArray(group_by) ? group_by[0] || '' : group_by || '',
      start_time: (getTemplateSrv() as any).timeRange.from.unix(),
      end_time: (getTemplateSrv() as any).timeRange.to.unix(),
    };
  }
  public buildPromqlVariables(promql: string, scopedVars: Record<string, any>) {
    return getTemplateSrv().replace(promql || '', scopedVars, (value, variable, formatValue) => {
      if (Array.isArray(value)) {
        const v = value
          .map(v => {
            const val = JSON.stringify(formatValue(v, 'regex', variable));
            return val.slice(1, val.length - 1);
          })
          .join('|');
        return value.length > 1 ? `(${v})` : v;
      }
      return formatValue(Array.isArray(value) ? value[0] : value, 'glob', variable);
    });
  }
  buildTargets({ host, cluster, module }: ITargetData) {
    if (host?.length) {
      return host.map(item => {
        const idList = item.value.split('|');
        if (idList.length) {
          return {
            bk_target_ip: idList[0],
            bk_target_cloud_id: idList[1],
          };
        }
        return {
          bk_target_service_instance_id: item.value,
        };
      });
    }
    if (module?.length) {
      return module.map(item => ({
        bk_inst_id: item.value,
        bk_obj_id: 'module',
      }));
    }
    if (cluster?.length) {
      return cluster.map(item => ({
        bk_inst_id: item.value,
        bk_obj_id: 'set',
      }));
    }
    return [];
  }
  public buildWhereVariables(values: string | string[], scopedVars: ScopedVars | undefined) {
    const valList = [];
    Array.isArray(values) &&
      values.forEach(val => {
        if (val === DIM_NULL_ID) {
          valList.push('');
        } else if (String(val).match(/^\$/)) {
          let isArrayVal = false;
          const list = [];
          getTemplateSrv().replace(val, scopedVars, v => {
            if (!isArrayVal) {
              isArrayVal = Array.isArray(v) && v.length > 1;
            }
            if (v) {
              Array.isArray(v) ? list.push(...v) : list.push(v);
            } else {
              list.push(val);
            }
          });
          isArrayVal ? valList.push(...list) : valList.push(getTemplateSrv().replace(val, scopedVars));
        } else {
          valList.push(getTemplateSrv().replace(val, scopedVars));
        }
      });
    return valList;
  }
  formatHeatmap(series, hasVariateAlias, aliasData, alias, scopedVars, metric, refId) {
    const dataFrame: DataFrame[] = [];
    series.forEach(serie => {
      // 兼容老版本变量设置
      if (hasVariateAlias) {
        aliasData.target_ip = serie.dimensions.bk_target_ip;
        aliasData.target_instance = serie.dimensions.bk_inst_name;
      }
      if (!serie.unit || serie.unit === 'none') delete serie.unit;
      const newSerie = {
        ...serie,
        target: hasVariateAlias
          ? this.buildAlaisVariables(alias, scopedVars, metric, aliasData, serie.dimensions)
          : alias || serie.target,
      };
      const fields: Field[] = [];
      fields.push({
        name: TIME_SERIES_TIME_FIELD_NAME,
        type: FieldType.time,
        config: {},
        values: new ArrayVector<number>(newSerie.datapoints.map(v => v[1])),
      });
      fields.push({
        name: TIME_SERIES_VALUE_FIELD_NAME,
        type: FieldType.number,
        display: getDisplayProcessor(),
        config: {
          displayNameFromDS: newSerie.target,
        },
        labels: serie.dimensions,
        values: new ArrayVector<number>(newSerie.datapoints.map(v => v[0])),
      });
      dataFrame.push({
        meta: {},
        refId,
        length: fields[0].values.length,
        fields,
        name: newSerie.target,
      });
    });
    return this.mergeHeatmapFrames(dataFrame);
  }
  formatTable(series, hasVariateAlias, aliasData, alias, scopedVars, metric, refId) {
    const TimeField = {
      name: 'Time',
      type: FieldType.time,
      config: {} as any,
      values: new ArrayVector(),
    };
    const ValueField = {
      name: 'Value',
      type: FieldType.number,
      config: {} as any,
      values: new ArrayVector(),
    };

    const dimisionFields = [];
    series.forEach(serie => {
      if (serie.dimensions) {
        Object.keys(serie.dimensions)
          .filter(key => !dimisionFields.some(item => item.name === key))
          .forEach(key => {
            dimisionFields.push({
              name: key,
              config: { filterable: true },
              type: FieldType.string,
              values: new ArrayVector(),
            });
          });
      }
    });
    series.forEach(serie => {
      // 兼容老版本变量设置
      if (hasVariateAlias) {
        aliasData.target_ip = serie.dimensions.bk_target_ip;
        aliasData.target_instance = serie.dimensions.bk_inst_name;
      }
      if (!serie.unit || serie.unit === 'none') delete serie.unit;
      const newSerie = {
        ...serie,
        target: hasVariateAlias
          ? this.buildAlaisVariables(alias, scopedVars, metric, aliasData, serie.dimensions)
          : alias || serie.target,
      };
      ValueField.config.unit = newSerie.unit;
      newSerie.datapoints.forEach(v => {
        TimeField.values.add(v[1]);
        ValueField.values.add(v[0]);
        dimisionFields?.forEach(dimisionFiled => {
          const dimValue = newSerie.dimensions[dimisionFiled.name];
          if (typeof dimValue !== 'undefined') {
            dimisionFiled.values.add(newSerie.dimensions[dimisionFiled.name]);
          }
        });
      });
    });
    const data: DataFrame = {
      refId,
      fields: [TimeField, ...dimisionFields, ValueField],
      length: TimeField.values.length,
    };
    return [data];
  }
  formatTimeseries(series, hasVariateAlias, aliasData, alias, scopedVars, metric, refId) {
    return series.map(serie => {
      // 兼容老版本变量设置
      if (hasVariateAlias) {
        aliasData.target_ip = serie.dimensions.bk_target_ip;
        aliasData.target_instance = serie.dimensions.bk_inst_name;
      }
      if (!serie.unit || serie.unit === 'none') delete serie.unit;
      const target = hasVariateAlias
        ? this.buildAlaisVariables(alias, scopedVars, metric, aliasData, serie.dimensions)
        : alias || serie.target;
      const newSerie = {
        ...serie,
        target,
      };
      const TimeField = {
        name: 'Time',
        type: FieldType.time,
        config: {
          // interval: config.interval * 1000,
        } as any,
        values: new ArrayVector(newSerie.datapoints.map(v => v[1])),
      };
      const ValueField = {
        name: 'Value',
        type: FieldType.number,
        config: {
          displayName: newSerie.target,
          unit: newSerie.unit,
        },
        values: new ArrayVector(newSerie.datapoints.map(v => v[0])),
        labels: newSerie.dimensions || {},
      };
      // let dimisionFields;
      // if (newSerie.dimensions) {
      //   dimisionFields = Object.keys(newSerie.dimensions).map(key => ({
      //     name: key,
      //     config: { filterable: true },
      //     type: FieldType.string,
      //     values: new ArrayVector(),
      //   }));
      //   newSerie.datapoints.forEach(() => {
      //     dimisionFields.forEach((dimisionFiled) => {
      //       dimisionFiled.values.add(newSerie.dimensions[dimisionFiled.name]);
      //     });
      //   });
      // }
      const data: DataFrame = {
        refId,
        fields: [TimeField, ValueField],
        length: newSerie.datapoints.length,
      };
      return data;
    });
  }
  async getAlarmEventDimensionValue(params: { field: string }) {
    return await this.request({
      method: 'GET',
      params: {
        start_time: (getTemplateSrv() as any).timeRange.from.unix(),
        end_time: (getTemplateSrv() as any).timeRange.to.unix(),
        field: params.field,
      },
      url: QueryUrl.get_alarm_event_dimension_value,
    });
  }
  async getAlarmEventField() {
    return await this.request({
      method: 'GET',
      url: QueryUrl.get_alarm_event_field,
    });
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
  async getMetricList(data: Record<string, any>) {
    return await this.request({
      method: 'POST',
      url: QueryUrl.get_metric_list,
      data,
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
          data_label: options.dataLabel || undefined,
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
  // 获取公共指标函数列表
  async getQueryMetricFunction(params = { type: 'grafana' }) {
    return await this.request({
      method: 'GET',
      url: QueryUrl.queryMetricFunction,
      params,
    }).catch(() => []);
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
  getRangeScopedVars(range: TimeRange) {
    const msRange = range.to.diff(range.from);
    const sRange = Math.round(msRange / 1000);
    return {
      __range_ms: { text: msRange, value: msRange },
      __range_s: { text: sRange, value: sRange },
      __range: { text: `${sRange}s`, value: `${sRange}s` },
    };
  }
  getValueText(responseLength: number, refId = '') {
    return responseLength > 1 ? `Value #${refId}` : 'Value';
  }
  // 变量名查询
  public async getVariableField(type: K8sVariableQueryType | VariableQueryType, scenario: ScenarioType) {
    const params = {
      url: QueryUrl.queryVariableField,
      params: {
        type,
        scenario,
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
  handleGetPromqlConfig(config: IQueryConfig) {
    const logParam = config.data_source_label === 'bk_log_search' ? { index_set_id: config.index_set_id || '' } : {};
    const interval = this.repalceInterval(config.interval, config.interval_unit);
    return {
      data_source_label: config.data_source_label,
      data_type_label: config.data_type_label,
      result_table_id: config.result_table_id,
      data_label: config.data_label || undefined,
      alias: config.refId || 'a',
      metric_field: config.metric_field,
      agg_dimension: config.group_by,
      agg_interval: interval,
      agg_method: config.method,
      agg_condition: config.where?.filter?.(item => item.key && item.value?.length) || [],
      time_field: config.time_field || 'time',
      functions: config.functions,
      ...logParam,
    };
  }
  handleGetQueryConfig(config: IQueryConfig, scopedVars: ScopedVars) {
    return {
      group_by: (config.group_by || []).map(set => getTemplateSrv().replace(set, scopedVars)),
      where:
        config.where
          ?.filter?.(item => item.key && item.value?.length)
          .map(condition => ({ ...condition, value: this.buildWhereVariables(condition.value, scopedVars) })) || [],
      interval: config.interval === 'auto' || !config.interval ? 'auto' : config.interval,
      interval_unit: config.interval_unit || 'h',
    };
  }
  mergeHeatmapFrames(frames: DataFrame[]): DataFrame[] {
    if (frames.length === 0) {
      return [];
    }

    const timeField = frames[0].fields.find(field => field.type === FieldType.time)!;
    const countFields = frames.map(frame => {
      const field = frame.fields.find(field => field.type === FieldType.number)!;

      return {
        ...field,
        name: field.config.displayNameFromDS! ?? TIME_SERIES_VALUE_FIELD_NAME,
      };
    });

    return [
      {
        ...frames[0],
        meta: {
          ...frames[0].meta,
          type: 'heatmap-rows',
        },
        fields: [timeField!, ...countFields],
      },
    ] as any;
  }
  /**
   * @description: 变量取值
   * @param {VariableQuery} options
   * @return {*}
   */
  async metricFindQuery(options: VariableQuery) {
    if (!options?.queryType) {
      return Promise.resolve([]);
    }
    let query = options;
    // 兼容老版本插件数据
    if ((query as any)?.conditions || (query as any)?.dimensionData) {
      query = handleTransformOldVariableQuery(query);
    }
    const data = await this.getVariableValue({
      type: query.queryType,
      scenario: query.scenario || ScenarioType.OS,
      params: this.buildMetricFindParams(query),
    }).then(data => data.map(item => ({ text: item.label, value: item.value })));
    return data;
  }
  /**
   * @description: promql 转换 ui查询参数
   * @param {string} promql
   * @param {EditMode} mode
   * @return {*}
   */
  public async promqlToqueryConfig(promql: string, mode: EditMode = 'code') {
    return await this.request({
      url: QueryUrl.promql_to_query_config,
      data: {
        promql,
      },
      method: 'post',
    }).then(data => ({
      ...data,
      query_configs:
        data?.query_configs?.map(item => ({
          where: item.agg_condition,
          method: item.agg_method,
          interval: item.agg_interval,
          group_by: item.agg_dimension,
          refId: item.alias,
          alias: '',
          data_source_label: item.data_source_label,
          data_type_label: item.data_type_label,
          interval_unit: 's',
          functions: item.functions,
          metric_field: item.metric_field,
          result_table_id: item.result_table_id,
          data_label: item.data_label,
          display: true,
          mode,
        })) || [],
    }));
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
    const queryList: QueryData[] = targetList as any;
    const promiseList = [];
    let errorMsg = '';
    queryList.forEach((item: QueryData) => {
      // 指标数据请求
      item.query_configs?.forEach(config => {
        if (config) {
          promiseList.push(
            this.request({
              url: QueryUrl.query_alarm_event_graph,
              data: {
                down_sample_range,
                format: item.format,
                start_time: options.range.from.unix(),
                end_time: options.range.to.unix(),
                expression: config.refId || '',
                ...this.handleGetQueryConfig(config, options.scopedVars),
                // query_configs: [this.handleGetQueryConfig(config, options.scopedVars)],
              },
              method: 'POST',
            })
              .then((data: QueryFetchData) =>
                this.buildFetchSeries(data, options.scopedVars, config.alias, config, item),
              )
              .catch(e => {
                console.error(e);
                errorMsg += e.data?.message || 'query error';
                return [];
              }),
          );
        }
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
    const list: DataQueryResponse = Object.assign(
      {
        ...data,
        data: data.data?.map(({ unit, ...props }) => (needUnit ? { unit, ...props } : props)),
      },
      errorMsg.length
        ? {
            error: {
              message: errorMsg,
              status: 'error',
            },
          }
        : {},
    );
    if (list.data?.length > 1) {
      const tableRefId = options.targets.filter(item => item.format === 'table').map(item => item.refId);
      const tableFrames = list.data.filter(item => tableRefId.includes(item.refId));
      if (tableFrames.length > 1) {
        const newList = {
          ...list,
          data: list.data.map(item => {
            if (tableRefId.includes(item.refId)) {
              return {
                ...item,
                fields: item.fields.map(field => {
                  if (field.name === 'Value') {
                    return {
                      ...field,
                      name: `Value #${item.refId}`,
                    };
                  }
                  return field;
                }),
              };
            }
            return item;
          }),
        };
        return newList;
      }
    }
    return list;
  }
  async queryAsyncTaskResult(params: { task_id: string }) {
    return await this.request({
      method: 'GET',
      url: QueryUrl.query_async_task_result,
      params,
    }).catch(() => ({}));
  }
  /**
   * @description: 查询参数转换promql
   * @param {QueryData} targets
   * @return {*}
   */
  public async queryConfigToPromql(targets: QueryData) {
    const params = {
      expression: targets.query_configs?.[0]?.refId || 'a',
      query_configs: targets.query_configs.map(item => this.handleGetPromqlConfig(item)),
    };
    return await this.request({
      url: QueryUrl.query_config_to_promql,
      data: params,
      method: 'post',
    }).then(data => data.promql || '');
  }
  /**
   *
   * @param inter 汇聚周期
   * @param unit 单位
   * @returns {number} 转换后的汇聚周期 单位固定 s
   */
  repalceInterval(inter: IntervalType, unit: string) {
    let interval: number | string = inter;
    if (typeof interval === 'string' && interval !== 'auto') {
      interval = +getTemplateSrv()
        .replace(interval)
        .replace(/(\d+)(.*)/, (match: string, p1: string, p2: string) => {
          let str: number | string = p1 || '10';
          switch (p2) {
            case 'm':
              str = +p1 * 60;
              break;
            case 'h':
              str = +p1 * 60 * 60;
              break;
            case 'd':
              str = +p1 * 60 * 60 * 24;
              break;
            case 'w':
              str = +p1 * 60 * 60 * 24 * 7;
              break;
            default:
              str = (+p1 || 10) * (unit === 'm' ? 60 : 1);
              break;
          }
          return str.toString();
        });
    } else if (typeof interval === 'number') {
      if (unit === 'm') {
        interval = interval * 60;
      }
    }
    return interval || (unit === 'm' ? 60 : 10);
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
          url: this.useToken ? `${this.url}/timeseries/${url}` : this.baseUrl + url,
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
        status: 'error',
        message: 'Need Set baseUrl',
      };
    }
    if (this.useToken && !this.configData?.bizId) {
      return {
        status: 'error',
        message: 'Need Set bizId',
      };
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
  async updateMetricListByBiz() {
    return await this.request({
      method: 'POST',
      url: QueryUrl.update_metric_list_by_biz,
      data: {},
    }).catch(() => '');
  }
}
