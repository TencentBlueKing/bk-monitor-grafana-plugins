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
import { DataQuery } from '@grafana/data';
import { ITargetItem, IConditionItem, IFunctionItem, EditMode, IntervalType, IExpresionItem } from './metric';
// datasource 查询数据
export interface IQueryConfig {
  data_source_label: string; // 指标来源
  data_type_label: string;  // 指标类型
  result_table_label: string; // 表名
  filter_dict: {};
  functions: IFunctionItem[];
  group_by: string[];
  interval: IntervalType;
  interval_unit: string;
  metric_field: string;
  method: string;
  alias: string;
  refId: string;
  display: boolean;
  result_table_id: string;
  time_field: string;
  index_set_id?: string;
  query_string?: string;
  mode: EditMode;
  source: string;
  where: IConditionItem[];
}
export interface QueryData extends DataQuery {
  expression?: string;
  alias?: string;
  display?: boolean;
  query_configs: IQueryConfig[];
  host: ITargetItem[];
  module: ITargetItem[];
  cluster: ITargetItem[];
  mode: EditMode;
  step?: string;
  format?: string;
  type?: string;
  showExpression?: boolean;
  source?: string;
  promqlAlias?: string;
  expressionList?: IExpresionItem[]
}
