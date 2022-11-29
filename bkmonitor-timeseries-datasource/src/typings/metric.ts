/* eslint-disable @typescript-eslint/naming-convention */
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
/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */


// 汇聚方法列表
export const METHOD_LIST = [
  {
    id: 'SUM',
    name: 'SUM',
  },
  {
    id: 'AVG',
    name: 'AVG',
  },
  {
    id: 'MAX',
    name: 'MAX',
  },
  {
    id: 'MIN',
    name: 'MIN',
  },
  {
    id: 'COUNT',
    name: 'COUNT',
  },
];

export const NOT_TIME_AGG_METHOD_LIST = [
  {
    id: 'sum_without_time',
    name: 'SUM(PromQL)',
  },
  {
    id: 'avg_without_time',
    name: 'AVG(PromQL)',
  },
  {
    id: 'max_without_time',
    name: 'MAX(PromQL)',
  },
  {
    id: 'min_without_time',
    name: 'MIN(PromQL)',
  },
  {
    id: 'count_without_time',
    name: 'COUNT(PromQL)',
  },
];

export type IntervalType = number | 'auto';
export interface IIntervalItem {
  id: IntervalType;
  name: string | number;
}
// 汇聚周期列表
export const INTERVAL_LIST: IIntervalItem[] = [
  {
    id: 'auto',
    name: 'auto',
  },
  {
    id: 1,
    name: 1,
  },
  {
    id: 2,
    name: 2,
  },
  {
    id: 5,
    name: 5,
  },
  {
    id: 10,
    name: 10,
  },
  {
    id: 30,
    name: 30,
  },
  {
    id: 60,
    name: 60,
  },
  {
    id: 120,
    name: 120,
  },
  {
    id: 300,
    name: 300,
  },
  {
    id: 600,
    name: 600,
  },
  {
    id: 900,
    name: 900,
  },
];
// 汇聚周期单位
export const INTERVAL_UNIT_LIST = [
  {
    id: 'm',
    name: 'min',
  },
  {
    id: 's',
    name: 's',
  },
];
// 监控条件
export const CONDITION_METHOD_LIST = [
  { id: 'eq', name: '=' },
  { id: 'gt', name: '>' },
  { id: 'gte', name: '>=' },
  { id: 'lt', name: '<' },
  { id: 'lte', name: '<=' },
  { id: 'neq', name: '!=' },
  { id: 'include', name: 'include' },
  { id: 'exclude', name: 'exclude' },
  { id: 'reg', name: 'regex' },
  { id: 'nreg', name: 'nregex' },
];
// number 监控条件
export const NUMBER_CONDITION_METHOD_LIST = [
  { id: 'eq', name: '=' },
  { id: 'gt', name: '>' },
  { id: 'gte', name: '>=' },
  { id: 'lt', name: '<' },
  { id: 'lte', name: '<=' },
  { id: 'neq', name: '!=' },
  { id: 'include', name: 'include' },
  { id: 'exclude', name: 'exclude' },
  { id: 'reg', name: 'regex' },
  { id: 'nreg', name: 'nregex' },
];
// log 监控条件
export const LOG_CONDITION_METHOD_LIST = [
  { id: 'is', name: 'is' },
  { id: 'is one of', name: 'is one of' },
  { id: 'is not', name: 'is not' },
  { id: 'is not one of', name: 'is not one of' },
];
// string 监控条件
export const STRING_CONDITION_METHOD_LIST = [
  { id: 'eq', name: '=' },
  { id: 'neq', name: '!=' },
  { id: 'include', name: 'include' },
  { id: 'exclude', name: 'exclude' },
  { id: 'reg', name: 'regex' },
  { id: 'nreg', name: 'nregex' },
];
// 监控目标类型
export enum TARGET_TYPE {
  'HOST' = 'HOST',
  'SERVICE_INSTANCE' = 'SERVICE_INSTANCE',
  'NONE' = 'NONE'
}
// 监控条件 设置条件
export const CONDITION = [
  { id: 'or', name: 'OR' },
  { id: 'and', name: 'AND' },
];

// 监控条件
export interface IConditionItem {
  key: string; // 维度
  method: string; // 方法
  value: string[]; // 值
  condition?: string; // 判断条件
}
// api 指标数据
export interface IMetric {
  collect_interval: number;
  condition_methods: IConditionMethodItem[];
  data_source_label: string;
  data_source_label_name: string;
  data_type_label: string;
  default_condition: IConditionItem[];
  default_dimensions: string[];
  description: string;
  dimensions: ICommonItem[];
  extend_fields: Record<string, any>;
  id: string;
  metric_id: string;
  metric_field: string;
  metric_field_name: string;
  name: string;
  related_id: string;
  related_name: string;
  result_table_id: string;
  result_table_label: string;
  result_table_label_name: string;
  result_table_name: string;
  unit: string;
  method_list?: string[];
  agg_interval?: string;
  agg_interval_unit?: string;
  agg_method?: string;
  agg_dimension?: string[];
  agg_condition?: IConditionItem[];
  alias?: string;
  display: boolean;
  refId?: string;
  functions?: IFunctionItem[];
  titleName: string;
  titleAlias: string;
  subtitle: string;
  showTool: boolean;
  readable_name?: string;
}
// 编辑模式
export type EditMode = 'code' | 'ui';
// 编辑状态
export type EditorStatus = 'default' | 'error';
// 指标详情 实例
export class MetricDetail {
  collect_interval: number;
  condition_methods: IConditionMethodItem[];
  data_source_label: string;
  data_source_label_name: string;
  data_type_label: string;
  default_condition: IConditionItem[] = [];
  default_dimensions: string[];
  description: string;
  dimensions: ICommonItem[];
  extend_fields: Record<string, any>;
  id: string;
  metric_field: string;
  metric_field_name: string;
  name: string;
  related_id: string;
  related_name: string;
  result_table_id: string;
  result_table_label: string;
  result_table_label_name: string;
  result_table_name: string;
  unit: string;
  method_list: [];

  agg_interval_unit_list = INTERVAL_UNIT_LIST;
  agg_interval_list: IIntervalItem[] = INTERVAL_LIST;
  index_set_id = '';
  agg_interval: IntervalType = 'auto';
  agg_interval_unit = 's';
  alias = '';
  agg_method = 'AVG';
  agg_dimension: string[];
  agg_condition: IConditionItem[] = [];
  functions: IFunctionItem[] = [];
  display = true;
  refId = '';
  // source code 使用
  mode: EditMode = 'ui';
  source = '';
  loading = false;
  status: EditorStatus = 'default';
  readable_name?: string;

  constructor(metricDetail: IMetric | MetricDetail) {
    Object.keys(metricDetail).forEach(key => (this[key] = metricDetail[key]));
    this.agg_method = metricDetail.agg_method
      || (this.onlyCountMethod ? 'COUNT' : metricDetail?.method_list?.length ? metricDetail.method_list[0] : 'AVG');
    this.agg_dimension = metricDetail.agg_dimension || metricDetail.default_dimensions || [];
    const condition = (metricDetail.agg_condition
    || (metricDetail.default_condition?.length ? metricDetail.default_condition : [{} as any])).slice();

    if (condition[condition.length - 1]?.key) {
      condition.push({} as any);
    }
    this.agg_condition = condition.length ? condition : [{}];
    this.index_set_id = metricDetail?.extend_fields?.index_set_id || '';
  }
  get curMetricId() {
    return `${this.data_source_label}|${this.data_type_label}|${this.result_table_id}|${this.metric_field}`;
  }
  get metricMetaId() {
    return `${this.data_source_label}|${this.data_type_label}`;
  }
  // 是否可以设置多指标
  get canSetMulitpeMetric() {
    return (
      ['bk_monitor|time_series', 'custom|time_series'].includes(this.metricMetaId)
      && !this.result_table_id.match(/^uptimecheck/i)
      && !this.isSpecialCMDBDimension
    );
  }
  get isSpecialCMDBDimension() {
    return (
      this.metricMetaId === 'bk_monitor|time_series'
      && (this.agg_dimension.some(dim => ['bk_inst_id', 'bk_obj_id'].includes(dim))
        || this.agg_condition.some(condition => ['bk_inst_id', 'bk_obj_id'].includes(condition.key)))
    );
  }
  // 是否可以设置实时查询
  get canSetRealTimeSearch() {
    return ['bk_monitor|time_series', 'custom|time_series', 'bk_monitor|event'].includes(this.metricMetaId);
  }
  // 是否可设置汇聚查询
  get canSetConvergeSearch() {
    return this.metricMetaId !== 'bk_monitor|event';
  }
  // 是否可设置汇聚查询
  get canSetSourceCode() {
    return this.data_type_label === 'time_series' && this.data_source_label !== 'bk_log_search';
  }
  // 是否可设置维度
  get canSetDimension() {
    return this.metricMetaId !== 'bk_monitor|event';
  }
  // 是否可设置汇聚方法
  get canSetAggMethod() {
    return this.metricMetaId !== 'bk_monitor|event';
  }
  // 是否可设置汇聚周期
  get canSetAggInterval() {
    return this.metricMetaId !== 'bk_monitor|event';
  }
  // 是否可设置检索语句
  get canSetQueryString() {
    return this.data_source_label !== 'bk_monitor' && this.data_type_label === 'log';
  }
  // 是否可设置函数
  get canSetFunction() {
    return this.metricMetaId !== 'bk_monitor|event';
  }
  // 是否可设置多指标计算
  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  get canSetMetricCalc() {
    return true;
    // return ['bk_monitor|time_series', 'custom|time_series'].includes(this.metricMetaId)
    // && !this.result_table_id.match(/^uptimecheck/i) && !this.isSpecialCMDBDimension
  }
  get isAllFunc() {
    return ['bk_monitor|time_series', 'custom|time_series'].includes(this.metricMetaId)
    && !this.result_table_id.match(/^uptimecheck/i) && !this.isSpecialCMDBDimension;
  }
  get canNotTimeAggMethod() {
    return ['bk_monitor|time_series', 'custom|time_series'].includes(this.metricMetaId) && !(this.result_table_id.match(/^uptimecheck/i) && ['message', 'response_code'].includes(this.metric_field)) && !this.isSpecialCMDBDimension;
  }
  get aggMethodList() {
    if (this.onlyCountMethod) {
      return [{ id: 'COUNT', name: 'COUNT' }];
    }
    if (this.canNotTimeAggMethod) {
      return [].concat(METHOD_LIST, NOT_TIME_AGG_METHOD_LIST);
    }
    return this?.method_list?.length ? this.method_list.map(set => ({ id: set, name: set })) : METHOD_LIST;
  }
  get onlyCountMethod() {
    return (
      ['bk_log_search|log', 'custom|event'].includes(this.metricMetaId)
      || (this.metricMetaId === 'bk_monitor|time_series'
        && this.result_table_id === 'uptimecheck.http'
        && ['message', 'response_code'].includes(this.metric_field))
    );
  }

  get targetType(): TARGET_TYPE {
    if (['os', 'host_device', 'host_process'].includes(this.result_table_label)) return TARGET_TYPE.HOST;
    if (['service_module', 'component'].includes(this.result_table_label)) return TARGET_TYPE.SERVICE_INSTANCE;
    return TARGET_TYPE.NONE;
  }
}
// 监控函数参数
export interface IFunctionParam {
  id?: string; // 函数参数id
  name?: string; // 函数参数名称
  default: string | number; // 函数参数默认值
  value?: string | number; // 函数参数值
  edit?: boolean; // 是否可编辑
  shortlist: string[] | number[]; // 参数可选值列表
}
// 监控函数
export interface IFunctionItem {
  id: string; // 函数id
  name: string; // 函数名称
  children?: IFunctionItem[]; // 函数子项
  params?: IFunctionParam[]; // 函数参数列表
  description?: string; // 函数描述
  key?: string; // 函数key
  support_expression?: boolean
}

// 监控条件列表item
export interface IConditionMethodItem {
  label: string;
  value: string;
}
// 通用列表item
export interface ICommonItem {
  id: string;
  name: string;
  is_dimension: boolean;
  type?: string;
}
// 监控目标列表item
export interface ITargetItem {
  label: string;
  value: string;
}
// 监控目标
export interface ITargetData {
  host: ITargetItem[];
  module: ITargetItem[];
  cluster: ITargetItem[];
}

export interface IExpresionItem {
  expression: string;
  functions: IFunctionItem[];
  alias: string;
  active: boolean;
}
