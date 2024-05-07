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
export const INTERVAL_LIST = [
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
export const LOG_CONDITION_METHOD_LIST = [
  { id: 'is', name: 'is' },
  { id: 'is one of', name: 'is one of' },
  { id: 'is not', name: 'is not' },
  { id: 'is not one of', name: 'is not one of' },
];
export const STRING_CONDITION_METHOD_LIST = [
  { id: 'eq', name: '=' },
  { id: 'neq', name: '!=' },
  { id: 'include', name: 'include' },
  { id: 'exclude', name: 'exclude' },
  { id: 'reg', name: 'regex' },
  { id: 'nreg', name: 'nregex' },
];
export const CONDITION = [
  { id: 'or', name: 'OR' },
  { id: 'and', name: 'AND' },
];
export interface IConditionItem {
  key: string;
  method: string;
  value: string[];
  condition?: string;
}
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
}
export interface IConditionMethodItem {
  label: string;
  value: string;
}
export interface ICommonItem {
  id: string;
  name: string;
  is_dimension: boolean;
  type: string;
  bk_data_id?: string;
}
export type MetricType = 'alert|event' | 'bk_monitor|log' | 'custom|event';

export interface IDataItem extends ICommonItem {
  dimensions: ICommonItem[];
  metrics: ICommonItem[];
  time_field: string;
}
