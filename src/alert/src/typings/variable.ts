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

import type { IConditionItem } from './metric';
// 变量类型
export enum VariableQueryType {
  Dimension = 'dimension',
  Host = 'host',
  Module = 'module',
  Promql = 'prometheus',
  ServiceInstance = 'service_instance',
  Set = 'set',
}
export enum K8sVariableQueryType {
  Cluster = 'cluster',
  Container = 'container',
  Namespace = 'namespace',
  Node = 'node',
  Pod = 'pod',
  Service = 'service',
}
export enum ScenarioType {
  Kubernetes = 'kubernetes',
  OS = 'os',
}
// 指标类型变量配置
export interface IMetricConfig {
  data_source_label: string;
  data_type_label: string;
  result_table_label: string;
  result_table_id: string;
  group_by: string[];
  metric_field: string;
  data_label: string;
  where: IConditionItem[];
}
// 变量查询参数
export interface VariableQuery {
  showField?: string;
  queryType?: VariableQueryType;
  scenario?: ScenarioType;
  valueField?: string;
  where?: IConditionItem[];
  variables?: string;
  metricConfig?: IMetricConfig;
  promql?: string;
}
