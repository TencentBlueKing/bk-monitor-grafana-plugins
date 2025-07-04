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
/* eslint-disable @typescript-eslint/naming-convention */
import {
  ArrayVector,
  type BootData,
  type DataFrame,
  type DataQueryRequest,
  type DataQueryResponse,
  DataSourceApi,
  type DataSourceInstanceSettings,
  type Field,
  FieldType,
  type ScopedVar,
  type ScopedVars,
  TIME_SERIES_TIME_FIELD_NAME,
  TIME_SERIES_VALUE_FIELD_NAME,
  type TimeRange,
} from '@grafana/data';
import { type BackendSrvRequest, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import apiCacheInstance from 'common/utils/api-cache';

import type { QueryOption } from '../typings/config';
import { DIM_NULL_ID, type IQueryConfig, type QueryData } from '../typings/datasource';
import type { EditMode, IMetric, ITargetData, IntervalType } from '../typings/metric';
import { type K8sVariableQueryType, ScenarioType, type VariableQuery, VariableQueryType } from '../typings/variable';
import { handleTransformOldQuery, handleTransformOldVariableQuery } from '../utils/common';
import { random } from 'common/utils/utils';

/*
 * This regex matches 3 types of variable reference with an optional format specifier
 * There are 6 capture groups that replace will return
 * \$(\w+)                                    $var1
 * \[\[(\w+?)(?::(\w+))?\]\]                  [[var2]] or [[var2:fmt2]]
 * \${(\w+)(?:\.([^:^\}]+))?(?::([^\}]+))?}   ${var3} or ${var3.fieldPath} or ${var3:fmt3} (or ${var3.fieldPath:fmt3} but that is not a separate capture group)
 */
export const variableRegex = /\$(\w+)|\[\[(\w+?)(?::(\w+))?\]\]|\${(\w+)(?:\.([^:^\}]+))?(?::([^\}]+))?}/g;
interface QueryFetchData {
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
    this.url = instanceSettings.url || '';
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
  async addCustomMetric(data: { metric_field: string; result_table_id: string }) {
    return await this.request({
      data,
      method: 'POST',
      url: QueryUrl.add_custom_metric,
    });
  }
  createScopedVariables(data: Record<string, any>, rawKey = '', keyPrefix = '') {
    const monitorScopedVars: ScopedVars = {};
    for (const [key, val] of Object.entries(data || [])) {
      let text = '';
      let value = '';
      if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === 'undefined' || item === null) {
            continue;
          }
          if (typeof item === 'string' || typeof item === 'number') {
            text += `${item},`;
            value += `${item},`;
            continue;
          }
          if (typeof item === 'object') {
            if ('id' in item) {
              value += `${item.id},`;
            }
            if ('value' in item) {
              value += `${item.value},`;
            }
            if ('name' in item) {
              text += `${item.name},`;
            }
            if ('label' in item) {
              text += `${item.label},`;
            }
            continue;
          }
          text += `${item},`;
          value += `${item},`;
        }
        text = val.length ? text.slice(0, -1) : JSON.stringify(val);
        value = val.length ? value.slice(0, -1) : JSON.stringify(val);
      } else if (typeof val === 'object' && val !== null) {
        text = val.name || val.label || val.value || val.id || val;
        value = val.id || val.value || val.name || val.label || val;
      } else {
        text = val;
        value = val;
      }
      monitorScopedVars[`${keyPrefix}${key}`] = {
        text,
        value,
      };
      if (key?.includes?.('.')) {
        monitorScopedVars[`${keyPrefix}${key}`.replace(/\./g, '_')] = {
          text,
          value,
        };
      }
    }
    if (rawKey && !(rawKey in monitorScopedVars)) {
      monitorScopedVars[rawKey] = {
        text: {
          ...data,
        },
        value: {
          ...data,
        },
      };
    }
    return monitorScopedVars;
  }
  public buildAliasVariables(
    alias: string,
    scopedVars: ScopedVars,
    metric: IMetric,
    aliasData: IAliasData,
    sere: Record<string, any>,
  ) {
    const { dimensions, dimensions_translation } = sere || { dimensions: {}, dimensions_translation: {} };
    const monitorScopedVars: { [key: string]: ScopedVar | undefined } = {
      ...this.createScopedVariables({
        ...metric,
        ...aliasData,
        ...scopedVars,
      }),
      ...this.createScopedVariables(dimensions || {}, '', 'tag_'),
      ...this.createScopedVariables(dimensions || {}, 'dimensions', 'dim_'),
      ...this.createScopedVariables(dimensions_translation || {}, 'dimensions_translation', 'trans_'),
      ...this.createScopedVariables(metric || {}, 'metric', 'metric_'),
    };
    const str = getTemplateSrv().replace(alias, monitorScopedVars);
    if (variableRegex.test(str)) {
      variableRegex.lastIndex = 0;
      return getTemplateSrv().replace(str, monitorScopedVars);
    }
    return str;
  }
  buildFetchSeries(
    { metrics = [], series = [] }: QueryFetchData,
    scopedVars: ScopedVars,
    alias: string,
    config?: IQueryConfig,
    query?: QueryData,
    isExpression?: boolean,
  ) {
    const hasVariateAlias = String(alias).match(variableRegex);
    let metric: IMetric | undefined = undefined;
    let aliasData: IAliasData = {};
    // 兼容老版本变量设置
    if (hasVariateAlias && !!config) {
      metric = isExpression
        ? metrics[0]
        : metrics.find(
            item => item.metric_field === config.metric_field && item.result_table_id === config.result_table_id,
          );
      aliasData = {
        formula: config.method,
        interval: config.interval.toString(),
        metric_id: metric?.metric_field,
        metric_item: metric?.related_name,
        metric_source: metric?.data_source_label,
        metric_type: metric?.result_table_name,
        object_id: metric?.result_table_label,
        object_name: metric?.result_table_label_name,
        object_type: metric?.result_table_label,
      };
    }
    if (query?.format === 'heatmap') {
      return this.formatHeatmap(series, hasVariateAlias, aliasData, alias, scopedVars, metric, query.refId);
    }
    if (query?.format === 'table') {
      return this.formatTable(series, hasVariateAlias, aliasData, alias, scopedVars, metric, query.refId);
    }
    return this.formatTimeSeries(series, hasVariateAlias, aliasData, alias, scopedVars, metric, query?.refId);
  }
  buildMetricFindParams(query: VariableQuery, scopedVars?: any) {
    if (query.queryType === VariableQueryType.Promql) {
      return {
        end_time: (getTemplateSrv() as any).timeRange.to.unix(),
        promql: this.buildPromqlVariables(query.promql!, scopedVars),
        start_time: (getTemplateSrv() as any).timeRange.from.unix(),
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
      end_time: (getTemplateSrv() as any).timeRange.to.unix(),
      field: Array.isArray(group_by) ? group_by[0] || '' : group_by || '',
      start_time: (getTemplateSrv() as any).timeRange.from.unix(),
      where: where.map(condition => ({ ...condition, value: this.buildWhereVariables(condition.value, {}) })),
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
  buildTargets({ cluster, host, module }: ITargetData) {
    if (host?.length) {
      return host.map(item => {
        const idList = item.value.split('|');
        if (idList.length) {
          return {
            bk_target_cloud_id: idList[1],
            bk_target_ip: idList[0],
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
    const valList: string[] = [];
    Array.isArray(values) &&
      // biome-ignore lint/complexity/noForEach: <explanation>
      values.forEach(val => {
        if (val === DIM_NULL_ID) {
          valList.push('');
        } else if (String(val).match(variableRegex)) {
          let isArrayVal = false;
          const list: string[] = [];
          getTemplateSrv().replace(val, scopedVars, (v: string | string[]) => {
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
    // biome-ignore lint/complexity/noForEach: <explanation>
    series.forEach(sere => {
      // 兼容老版本变量设置
      if (hasVariateAlias) {
        aliasData.target_ip = sere.dimensions.bk_target_ip;
        aliasData.target_instance = sere.dimensions.bk_inst_name;
      }
      if (!sere.unit || sere.unit === 'none') {
        // biome-ignore lint/performance/noDelete: <explanation>
        delete sere.unit;
      }
      const newSere = {
        ...sere,
        target: hasVariateAlias
          ? this.buildAliasVariables(alias, scopedVars, metric, aliasData, sere)
          : alias || sere.target,
      };
      const fields: Field[] = [];
      fields.push({
        config: {},
        name: TIME_SERIES_TIME_FIELD_NAME,
        type: FieldType.time,
        values: new ArrayVector<number>(newSere.datapoints.map(v => v[1])),
      });
      fields.push({
        config: {
          displayNameFromDS: newSere.target,
          unit: newSere.unit || undefined,
        },
        // display: getDisplayProcessor(),
        labels: sere.dimensions,
        name: TIME_SERIES_VALUE_FIELD_NAME,
        type: FieldType.number,
        values: new ArrayVector<number>(newSere.datapoints.map(v => v[0])),
      });
      dataFrame.push({
        fields,
        length: fields[0].values.length,
        meta: {},
        name: newSere.target,
        refId,
      });
    });
    return this.mergeHeatmapFrames(dataFrame);
  }
  formatTable(series, hasVariateAlias, aliasData, alias, scopedVars, metric, refId) {
    const TimeField = {
      config: {} as any,
      name: 'Time',
      type: FieldType.time,
      values: new ArrayVector(),
    };
    const ValueField = {
      config: {} as any,
      name: 'Value',
      type: FieldType.number,
      values: new ArrayVector(),
    };

    const dimensionFields: Array<{
      config: any;
      name: string;
      type: FieldType;
      values: ArrayVector;
    }> = [];
    // biome-ignore lint/complexity/noForEach: <explanation>
    series.forEach(sere => {
      if (sere.dimensions) {
        // biome-ignore lint/complexity/noForEach: <explanation>
        Object.keys(sere.dimensions)
          .filter(key => !dimensionFields.some(item => item.name === key))
          .forEach(key => {
            dimensionFields.push({
              config: { filterable: true },
              name: key,
              type: FieldType.string,
              values: new ArrayVector(),
            });
          });
      }
    });
    // biome-ignore lint/complexity/noForEach: <explanation>
    series.forEach(sere => {
      // 兼容老版本变量设置
      if (hasVariateAlias) {
        aliasData.target_ip = sere.dimensions.bk_target_ip;
        aliasData.target_instance = sere.dimensions.bk_inst_name;
      }
      if (!sere.unit || sere.unit === 'none') {
        // biome-ignore lint/performance/noDelete: <explanation>
        delete sere.unit;
      }
      const newSere = {
        ...sere,
        target: hasVariateAlias
          ? this.buildAliasVariables(alias, scopedVars, metric, aliasData, sere)
          : alias || sere.target,
      };
      ValueField.config.unit = newSere.unit;
      // biome-ignore lint/complexity/noForEach: <explanation>
      newSere.datapoints.forEach(v => {
        TimeField.values.add(v[1]);
        ValueField.values.add(v[0]);
        // biome-ignore lint/complexity/noForEach: <explanation>
        dimensionFields?.forEach(dimensionFiled => {
          const dimValue = newSere.dimensions[dimensionFiled.name];
          if (typeof dimValue !== 'undefined') {
            dimensionFiled.values.add(newSere.dimensions[dimensionFiled.name]);
          }
        });
      });
    });
    const data: DataFrame = {
      fields: [TimeField, ...dimensionFields, ValueField],
      length: TimeField.values.length,
      refId,
    };
    return [data];
  }
  formatTimeSeries(series, hasVariateAlias, aliasData, alias, scopedVars, metric, refId) {
    return series.map(sere => {
      // 兼容老版本变量设置
      if (hasVariateAlias) {
        aliasData.target_ip = sere.dimensions.bk_target_ip;
        aliasData.target_instance = sere.dimensions.bk_inst_name;
      }
      if (!sere.unit || sere.unit === 'none') {
        // biome-ignore lint/performance/noDelete: <explanation>
        delete sere.unit;
      }
      const target = hasVariateAlias
        ? this.buildAliasVariables(alias, scopedVars, metric, aliasData, sere)
        : alias || sere.target;
      const newSeries = {
        ...sere,
        target,
      };
      const TimeField = {
        config: {
          // interval: config.interval * 1000,
        } as any,
        name: 'Time',
        type: FieldType.time,
        values: new ArrayVector(newSeries.datapoints.map(v => v[1])),
      };
      const isGrafana9 = !!window.grafanaBootData?.settings?.buildInfo?.version?.toString()?.startsWith('9.');
      const nameConfig = isGrafana9
        ? {
            displayNameFromDS: target,
          }
        : {
            displayName: target,
          };
      const ValueField = {
        config: {
          ...nameConfig,
          unit: newSeries.unit || undefined,
        },
        labels: newSeries.dimensions || {},
        name: 'Value',
        type: FieldType.number,
        values: new ArrayVector(newSeries.datapoints.map(v => v[0])),
      };
      const data: DataFrame = {
        fields: [TimeField, ValueField],
        length: newSeries.datapoints.length,
        refId,
      };
      return data;
    });
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
  // 获取公共指标函数列表
  async getMetricList(data: Record<string, any>) {
    return await this.request({
      data,
      method: 'POST',
      url: QueryUrl.get_metric_list,
    }).catch(() => []);
  }
  // 新版获取condition dimensions
  public async getNewDimensionValue(options) {
    const data = await this.request({
      data: {
        params: {
          data_label: options.dataLabel || undefined,
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
  getRangeScopedVars(range: TimeRange) {
    const msRange = range.to.diff(range.from);
    const sRange = Math.round(msRange / 1000);
    return {
      __range: { text: `${sRange}s`, value: `${sRange}s` },
      __range_ms: { text: msRange, value: msRange },
      __range_s: { text: sRange, value: sRange },
    };
  }
  getValueText(responseLength: number, refId = '') {
    return responseLength > 1 ? `Value #${refId}` : 'Value';
  }
  // 变量名查询
  public async getVariableField(type: K8sVariableQueryType | VariableQueryType, scenario: ScenarioType) {
    const params = {
      params: {
        scenario,
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
  handleGetPromqlConfig(config: IQueryConfig) {
    const logParam = config.data_source_label === 'bk_log_search' ? { index_set_id: config.index_set_id || '' } : {};
    const interval = this.replaceInterval(config.interval, config.interval_unit, {});
    return {
      agg_condition: config.where?.filter?.(item => item.key && item.value?.length) || [],
      agg_dimension: config.group_by,
      agg_interval: interval,
      agg_method: config.method,
      alias: config.refId || 'a',
      data_label: config.data_label || undefined,
      data_source_label: config.data_source_label,
      data_type_label: config.data_type_label,
      functions: config.functions,
      metric_field: config.metric_field,
      result_table_id: config.result_table_id,
      time_field: config.time_field || 'time',
      ...logParam,
    };
  }
  handleGetQueryConfig(config: IQueryConfig, scopedVars: ScopedVars) {
    const logParam = config.data_source_label === 'bk_log_search' ? { index_set_id: config.index_set_id || '' } : {};
    return {
      data_label: config.data_label,
      data_source_label: config.data_source_label,
      data_type_label: config.data_type_label,
      display: config.display,
      filter_dict: {},
      functions:
        config.functions
          ?.filter?.(item => item.id)
          .map(func => ({
            ...func,
            params: func.params?.map(set => ({
              ...set,
              value:
                typeof set.value === 'string'
                  ? getTemplateSrv().replace(set.value, {
                      ...scopedVars,
                      interval: { text: config.interval, value: config.interval },
                      interval_unit: { text: config.interval_unit, value: config.interval_unit },
                    })
                  : set.value,
            })),
          })) || [],
      group_by: (config.group_by || []).map(set => getTemplateSrv().replace(set, scopedVars)),
      interval: this.replaceInterval(config.interval, config.interval_unit, scopedVars),
      interval_unit: 's',
      metrics: [{ alias: config.refId || 'a', field: config.metric_field, method: config.method }],
      table: config.result_table_id,
      time_field: config.time_field || 'time',
      where:
        config.where
          ?.filter?.(item => item.key && item.value?.length)
          .map(condition => ({ ...condition, value: this.buildWhereVariables(condition.value, scopedVars) })) || [],
      ...logParam,
    };
  }
  mergeHeatmapFrames(frames: DataFrame[]): DataFrame[] {
    if (frames.length === 0) {
      return [];
    }

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const timeField = frames[0].fields.find(field => field.type === FieldType.time)!;
    const countFields = frames.map(frame => {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const field = frame.fields.find(field => field.type === FieldType.number)!;

      return {
        ...field,
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        name: field.config.displayNameFromDS! ?? TIME_SERIES_VALUE_FIELD_NAME,
      };
    });

    return [
      {
        ...frames[0],
        fields: [timeField!, ...countFields],
        meta: {
          ...frames[0].meta,
          type: 'heatmap-rows',
        },
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
      params: this.buildMetricFindParams(query),
      scenario: query.scenario || ScenarioType.OS,
      type: query.queryType,
    }).then(data => data.map(item => ({ text: item.label, value: item.value })));
    return data;
  }
  /**
   * @description: promql 转换 ui查询参数
   * @param {string} promql
   * @param {EditMode} mode
   * @return {*}
   */
  public async promqlToQueryConfig(promql: string, mode: EditMode = 'code') {
    return await this.request({
      data: {
        promql,
      },
      method: 'post',
      url: QueryUrl.promql_to_query_config,
    }).then(data => ({
      ...data,
      query_configs:
        data?.query_configs?.map(item => ({
          alias: '',
          data_label: item.data_label,
          data_source_label: item.data_source_label,
          data_type_label: item.data_type_label,
          display: true,
          functions: item.functions,
          group_by: item.agg_dimension,
          interval: item.agg_interval,
          interval_unit: 's',
          method: item.agg_method,
          metric_field: item.metric_field,
          mode,
          refId: item.alias,
          result_table_id: item.result_table_id,
          where: item.agg_condition,
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

    // 兼容老版本query数据
    const queryList: QueryData[] = (targetList as any).map(item => {
      if (item?.data?.metric && item?.data?.monitorObject) {
        return handleTransformOldQuery(item.data);
      }
      if ((item as QueryData).expression?.length) {
        return {
          ...item,
          expressionList: [
            {
              active: item.display,
              alias: item.alias || '',
              expression: item.expression || '',
              functions: [],
            },
          ],
        };
      }
      return {
        ...item,
        mode: item.only_promql ? 'code' : item.mode,
      };
    });
    const promiseList: Array<Promise<any>> = [];
    let errorMsg = '';
    // biome-ignore lint/complexity/noForEach: <explanation>
    queryList.forEach((item: QueryData) => {
      const configList: Array<{
        config: IQueryConfig;
      }> = [];
      // 指标数据请求
      if (item?.mode !== 'code') {
        // biome-ignore lint/complexity/noForEach: <explanation>
        item.query_configs?.forEach(config => {
          const queryConfig = this.handleGetQueryConfig(config, options.scopedVars);
          if (config.display) {
            const { cluster, host, module } = item;
            promiseList.push(
              this.request({
                data: {
                  display: config.display,
                  down_sample_range: item.enableDownSampling !== false ? down_sample_range : undefined,
                  end_time: options.range.to.unix(),
                  expression: config.refId || '',
                  format: item.format,
                  query_configs: [queryConfig],
                  start_time: options.range.from.unix(),
                  target: this.buildTargets({ cluster, host, module }),
                  type: item.type,
                },
                method: 'POST',
                url: QueryUrl.query,
              })
                .then((data: QueryFetchData) =>
                  this.buildFetchSeries(data, options.scopedVars, config.alias, config, item),
                )
                .catch(e => {
                  console.error(e);
                  errorMsg += e.message || e.data?.message || 'query error';
                  return [];
                }),
            );
          }
          configList.push(queryConfig);
        });
      }
      // 表达式图表数据请求
      if (
        item.mode === 'code' ||
        item.only_promql ||
        (item.expressionList?.some(item => item.expression && item.active) && configList.length > 0)
      ) {
        if (item.mode === 'code' || item.only_promql) {
          const replaceScopedVars = {
            ...options.scopedVars,
            ...this.getRangeScopedVars(options.range),
          };
          const params = {
            data: {
              down_sample_range: item.enableDownSampling === true ? down_sample_range : undefined, // promql 原来默认是不开启的
              end_time: options.range.to.unix(),
              format: item.format,
              promql: this.buildPromqlVariables(item.source!, replaceScopedVars),
              start_time: options.range.from.unix(),
              step: getTemplateSrv().replace(item.step, replaceScopedVars) || 'auto',
              type: item.type,
            },
            method: 'POST',
            url: QueryUrl.graph_promql_query,
          };
          promiseList.push(
            this.request(params)
              .then(data =>
                this.buildFetchSeries(
                  data,
                  options.scopedVars,
                  item.mode === 'code' ? item.promqlAlias || item.alias || '' : item.alias || '',
                  undefined,
                  item,
                ),
              )
              .catch(e => {
                console.error(e);
                errorMsg += e.message || e.data?.message || 'query error';
                return [];
              }),
          );
        } else {
          const { cluster, expressionList, host, module, enableDownSampling } = item;
          // biome-ignore lint/complexity/noForEach: <explanation>
          expressionList?.forEach(exp => {
            if (exp.expression && exp.active) {
              const p = {
                data: {
                  display: exp.active,
                  down_sample_range: enableDownSampling !== false ? down_sample_range : undefined,
                  end_time: options.range.to.unix(),
                  expression: exp.expression,
                  format: item.format,
                  functions: exp.functions?.filter?.(item => item.id),
                  query_configs: configList,
                  start_time: options.range.from.unix(),
                  target: this.buildTargets({ cluster, host, module }),
                  type: item.type,
                },
                method: 'POST',
                url: QueryUrl.query,
              };
              promiseList.push(
                this.request(p)
                  .then(data => this.buildFetchSeries(data, options.scopedVars, exp.alias, null, item, true))
                  .catch(e => {
                    console.error(e);
                    errorMsg += e.message || e.data?.message || 'query error';
                    return [];
                  }),
              );
            }
          });
        }
      }
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
      params,
      url: QueryUrl.query_async_task_result,
    }).catch(() => ({}));
  }
  /**
   * @description: 查询参数转换promql
   * @param {QueryData} targets
   * @return {*}
   */
  public async queryConfigToPromql(targets: QueryData) {
    const params = {
      expression: targets.expressionList?.length
        ? targets.expressionList[0]?.expression || 'a'
        : targets.query_configs?.[0]?.refId || 'a',
      query_configs: targets.query_configs.map(item => this.handleGetPromqlConfig(item)),
    };
    return await this.request({
      data: params,
      method: 'post',
      url: QueryUrl.query_config_to_promql,
    }).then(data => data.promql || '');
  }
  /**
   *
   * @param inter 汇聚周期
   * @param unit 单位
   * @returns {number} 转换后的汇聚周期 单位固定 s
   */
  replaceInterval(inter: IntervalType, unit: string, scopedVars: ScopedVars) {
    let interval: number | string = inter;
    if (typeof interval === 'string' && interval !== 'auto') {
      const intervalStr = getTemplateSrv().replace(interval, scopedVars);
      if (['$__interval_ms'].includes(interval)) {
        // ms 转换为 s
        return +intervalStr / 1000;
      }
      interval = +intervalStr.replace(/(\d+)(.*)/, (match: string, p1: string, p2: string) => {
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
          url: this.useToken ? `${this.url}/timeseries/${url}` : this.baseUrl + url,
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
  async updateMetricListByBiz() {
    return await this.request({
      data: {},
      method: 'POST',
      url: QueryUrl.update_metric_list_by_biz,
    }).catch(() => '');
  }
}
