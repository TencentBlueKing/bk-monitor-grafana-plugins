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

import { DataQuery } from '@grafana/data';

import { EditMode, IConditionItem, IExpresionItem, IFunctionItem, ITargetItem, IntervalType } from './metric';
// datasource 查询数据
export interface IQueryConfig {
  alias: string;
  data_label: string; // 指标二段式使用
  data_source_label: string; // 指标来源
  data_type_label: string; // 指标类型
  display: boolean;
  filter_dict: Record<string, string>;
  functions: IFunctionItem[];
  group_by: string[];
  index_set_id?: string;
  interval: IntervalType;
  interval_unit: string;
  method: string;
  metric_field: string;
  mode: EditMode;
  query_string?: string;
  refId: string;
  result_table_id: string;
  result_table_label: string; // 表名
  source: string;
  time_field: string;
  where: IConditionItem[];
}
export interface QueryData extends DataQuery {
  alias?: string;
  cluster: ITargetItem[];
  display?: boolean;
  expression?: string;
  expressionList?: IExpresionItem[];
  format?: string;
  host: ITargetItem[];
  mode: EditMode;
  module: ITargetItem[];
  only_promql?: boolean;
  promqlAlias?: string;
  query_configs: IQueryConfig[];
  showExpression?: boolean;
  source?: string;
  step?: string;
  type?: string;
  enableDownSampling?: boolean;
}

export const DIM_NULL_ID = '';
