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
import { QueryData } from '../typings/datasource';
import { VariableQuery } from '../typings/variable';
/**
 * @description: 转换旧版本查询
 * @param {any} data 旧版本数据
 * @return {*}
 */
export const handleTransformOldQuery = (data: any) => {
  const [dataSourceTypeLabel, index_set_id, resultTableId, metricField] = data?.metric?.id;
  const dataSourceLabel = dataSourceTypeLabel?.replace(/(_|\.)(log|event|time_series)$/, '');
  const queryConfig: any = Object.assign(
    {},
    {
      alias: data.alias,
      data_source_label: dataSourceLabel,
      data_type_label: dataSourceTypeLabel?.replace(new RegExp(`^${dataSourceLabel}(_|.)`), ''),
      display: true,
      filter_dict: {},
      functions: handleTransformOldFunc(data),
      group_by: data.dimensions || [],
      interval: data.period,
      interval_unit: 's',
      method: data.method,
      metric_field: metricField,
      mode: 'ui',
      refId: 'a',
      result_table_id: resultTableId,
      result_table_label: data?.monitorObject?.id,
      source: '',
      time_field: '',
      where: data.conditions.map(item =>
        item.reduce((pre, cur) => {
          pre[cur.type] = cur.value;
          return pre;
        }, {}),
      ),
    },
    dataSourceLabel === 'bk_log_search' ? { index_set_id } : {},
  );
  const newQuery: QueryData = {
    alias: '',
    display: false,
    expression: '',
    mode: 'ui',
    query_configs: [
      {
        ...queryConfig,
      },
    ],
    refId: 'a',
    ...handleTransformOldTarget(data),
  };
  return newQuery;
};
/**
 * @description: 转换旧版本变量查询
 * @param {any} data 元数据
 * @return {*}
 */
export const handleTransformOldVariableQuery = (data: any) => {
  let metricConfig: any = {};
  if (data.dimensionData) {
    const { conditions, dimensions, metric, monitorObject } = data.dimensionData;
    const [dataSourceTypeLabel, , resultTableId, metricField] = metric?.id;
    const dataSourceLabel = dataSourceTypeLabel?.replace(/(_|\.)(log|event|time_series)$/, '') || '';
    metricConfig = {
      data_source_label: dataSourceLabel,
      data_type_label: dataSourceTypeLabel?.replace(new RegExp(`^${dataSourceLabel}(_|.)`), ''),
      group_by: typeof dimensions === 'string' ? [dimensions] : dimensions,
      metric_field: metricField,
      result_table_id: resultTableId,
      result_table_label: monitorObject?.id,
      where: conditions?.map(item =>
        item.reduce((pre, cur) => {
          pre[cur.type] = cur.value;
          return pre;
        }, {}),
      ),
    };
  }
  const newQuery: VariableQuery = {
    metricConfig,
    queryType: data.queryType,
    showField: data.showField,
    valueField: data.valueField,
    variables: data.variables,
    where:
      data.conditions?.map?.(item =>
        item.reduce((pre, cur) => {
          pre[cur.type] = cur.value;
          return pre;
        }, {}),
      ) || [],
  };
  return newQuery;
};
/**
 * @description: 转换旧版本监控目标
 * @param {any} data 元数据
 * @return {*}
 */
export const handleTransformOldTarget = (data: any) => {
  // 最早期版本
  if (data.target) {
    let host = [];
    host = data.target?.realValues?.map?.(set => {
      if (data.monitorObject.groupId === 'hosts') {
        const idList = set.split('-');
        return {
          label: idList[1],
          value: set,
        };
      }
      return {
        bk_target_service_instance_id: set,
      };
    });
    return {
      cluster: [],
      host,
      module: [],
    };
  }
  let host = [];
  let module = [];
  let cluster = [];
  if (data.cluster) {
    cluster = data.cluster?.list || [];
  }
  if (data.module) {
    module = data.module?.list || [];
  }
  if (data.host) {
    host = data.host?.list || [];
  }
  return {
    cluster,
    host,
    module,
  };
};
/**
 * @description: 转换旧版本监控函数
 * @param {any} data 原始数据
 * @return {*}
 */
export const handleTransformOldFunc = (data: any) => {
  const funcList: any[] = [];
  if (data.func?.rank?.sort) {
    funcList.push({
      id: data.func.rank.sort === 'desc' ? 'top' : 'bottom',
      params: [
        {
          id: 'n',
          value: data.func.rank.limit,
        },
      ],
    });
  }
  if (data.offset) {
    funcList.push({
      id: 'time_shift',
      params: [
        {
          id: 'n',
          value: data.offset,
        },
      ],
    });
  }
  return funcList;
};
