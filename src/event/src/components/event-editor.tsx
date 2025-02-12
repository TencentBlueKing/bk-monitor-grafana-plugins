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

import type { QueryEditorProps } from '@grafana/data';
import Spin from 'antd/es/spin';
import React from 'react';

import type { QueryOption } from '../typings/config';
import type { QueryData } from '../typings/datasource';
import type { ICommonItem, IConditionItem, MetricType, IDataItem } from '../typings/metric';
import { getCookie, t } from 'common/utils/utils';
import AliasInput from './alias-input';
import ConditionInput from './condition-input';
import DataInput from './data-input';
import DimensionInput from './dimension-input';
import EditorForm from './editor-form';
import IntervalInput from './interval-input';
import QueryFormula from './query-formula';
import TypeInput from './type-iput';

import type QueryDataSource from '../datasource/datasource';

export type IQueryEditorProps = QueryEditorProps<QueryDataSource, QueryData, QueryOption>;
interface IQueryEditorState {
  loading: boolean;
  inited: boolean;
  language: string;
  typeId: MetricType;
  dataId: string;
  metric: string;
  dataList: IDataItem[];
  method: string;
  interval: number;
  intervalUnit: string;
  dimension: string[];
  condition: IConditionItem[];
  alias: string;
  queryString: string;
}
export default class MonitorQueryEditor extends React.PureComponent<IQueryEditorProps, IQueryEditorState> {
  constructor(props, context) {
    super(props, context);
    let { query_configs } = this.props.query;
    const hasQuery = query_configs?.length > 0;
    if (!hasQuery) {
      query_configs = [{}] as any;
    }
    const [
      {
        interval = 60,
        interval_unit = 's',
        where = [{}],
        group_by = [],
        metric_field = '',
        method = 'COUNT',
        data_source_label = 'bk_monitor',
        data_type_label = 'log',
        result_table_id = '',
        query_string = '',
        alias = '',
      },
    ] = query_configs;
    const typeId = `${data_source_label}|${data_type_label}` as MetricType;
    const condition = where.length ? where : ([{}] as any);
    if (condition[condition.length - 1]?.key) {
      condition.push({} as any);
    }
    this.state = {
      loading: true,
      inited: false,
      language: getCookie('blueking_language'),
      typeId,
      dataId: result_table_id,
      dataList: [],
      method,
      interval,
      intervalUnit: interval_unit,
      metric: metric_field,
      dimension: group_by,
      condition,
      alias,
      queryString: query_string,
    };
    this.initState(this.state.typeId, hasQuery);
  }
  get curData() {
    return (
      this.state.dataList?.find?.(item => item.id === this.state.dataId) || {
        metrics: [],
        dimensions: [],
        time_field: '',
      }
    );
  }
  handleQuery = () => {
    const query: any = this.handleGetQueryData();
    const { refId, hide, key, queryType, datasource } = this.props.query;
    this.props.onChange({ refId, hide, key, queryType, datasource, ...query });
    this.props.onRunQuery();
  };
  handleGetQueryData() {
    const { alias, typeId, dataId, dimension, metric, interval, intervalUnit, method, condition, queryString } =
      this.state;
    const [data_source_label, data_type_label] = typeId.split('|');
    if (!dataId) return {};
    return {
      query_configs: [
        {
          data_source_label,
          data_type_label,
          result_table_id: dataId,
          alias,
          refId: 'a',
          // result_table_label: item.result_table_label,
          group_by: dimension,
          interval,
          interval_unit: intervalUnit,
          metric_field: metric,
          method,
          time_field: this.curData.time_field || 'time',
          where: condition.filter?.(item => item.key) || [],
          query_string: queryString,
        },
      ],
    };
  }
  /**
   * @description: 初始化state
   * @param {MetricType} typeId
   * @param {boolean} hasQuery
   * @return {*}
   */
  async initState(typeId: MetricType, hasQuery: boolean) {
    if (!hasQuery) {
      await this.handeTypeIdChange(typeId);
    } else {
      const [data_source_label, data_type_label] = typeId.split('|');
      const dataList: IDataItem[] = await this.props.datasource.getDataSourceConfig({
        data_source_label,
        data_type_label,
      });
      this.setState({
        dataList,
      });
    }
    setTimeout(() => {
      this.setState({
        loading: false,
        inited: true,
      });
    }, 300);
  }
  /**
   * @description:数据类型改变时触发
   * @param {MetricType} typeId
   * @return {*}
   */
  handeTypeIdChange = async (typeId: MetricType) => {
    const [data_source_label, data_type_label] = typeId.split('|');
    this.state.inited && this.setState({ loading: true });
    const dataList: IDataItem[] = await this.props.datasource.getDataSourceConfig({
      data_source_label,
      data_type_label,
    });
    this.setState(
      {
        loading: false,
        typeId,
        dataId: dataList[0]?.id || '',
        dataList,
        method: dataList[0]?.metrics?.length && typeId !== 'custom|event' ? this.state.method : 'COUNT',
      },
      () => {
        this.setState(
          {
            metric: this.curData.metrics?.[0]?.id || '',
            dimension: [],
            condition: [{}] as any,
          },
          this.handleQuery,
        );
      },
    );
  };
  handleQueryStringChange = async (queryString: string) => {
    this.setState({ queryString }, this.handleQuery);
  };
  handleMethodChange = async (method: string) => {
    this.setState({ method }, this.handleQuery);
  };
  handleAliasChange = async (alias: string) => {
    this.setState({ alias }, this.handleQuery);
  };
  handleIntervalChange = async (interval: number) => {
    this.setState({ interval }, this.handleQuery);
  };
  handleIntervalUnitChange = async (intervalUnit: string) => {
    this.setState({ intervalUnit }, this.handleQuery);
  };
  handleDataIdChage = async (dataId: string) => {
    this.setState({ dataId, dimension: [], condition: [{}] as any }, this.handleQuery);
  };
  handleDimensionChange = async (dimension: string[]) => {
    this.setState({ dimension }, this.handleQuery);
  };
  handleConditionChange = async (condition: IConditionItem[], needQuery = true) => {
    this.setState({ condition }, () => {
      needQuery && this.handleQuery();
    });
  };
  getDimensionValue = async (v: string): Promise<Record<string, ICommonItem[]>> => {
    let list = [];
    if (!v) return {};
    const { metric, dataId, typeId, method } = this.state;
    const [data_source_label, data_type_label] = typeId.split('|');
    list = await this.props.datasource.getNewDimensionValue({
      resultTableId: dataId,
      metricField: method === 'COUNT' ? '_index' : metric,
      dataSourceLabel: data_source_label,
      dataTypeLabel: data_type_label,
      field: v,
    });
    return { [v]: list || [] };
  };
  render(): JSX.Element {
    const {
      language,
      metric,
      typeId,
      dataId,
      dataList,
      inited,
      loading,
      method,
      intervalUnit,
      interval,
      dimension,
      condition,
      alias,
      queryString,
    } = this.state;
    const dimensionList = this.curData.dimensions;
    const metricList = this.curData.metrics;
    return (
      <div className='monitor-event-grafana'>
        <Spin
          spinning={loading}
          tip='Loading...'
        >
          {inited ? (
            <>
              <div className='query-editor'>
                <EditorForm title={t('类型', language)}>
                  <TypeInput
                    value={typeId}
                    onChange={this.handeTypeIdChange}
                  />
                </EditorForm>
                <EditorForm
                  labelStyle={{ minWidth: '108px' }}
                  title={t('数据名称', language)}
                >
                  <DataInput
                    list={dataList}
                    showId={true}
                    value={dataId}
                    onChange={this.handleDataIdChage}
                  />
                </EditorForm>
              </div>
              {dataId ? (
                <div className='query-editor'>
                  <EditorForm
                    style={{ width: '100%' }}
                    labelStyle={{ minWidth: '115px' }}
                    tips='meta'
                    title={t('Query String', language)}
                  >
                    <AliasInput
                      style={{ minWidth: '100%', flex: 1 }}
                      value={queryString}
                      onChange={this.handleQueryStringChange}
                    />
                  </EditorForm>
                </div>
              ) : undefined}
              {dataId ? (
                <div className='query-editor'>
                  <EditorForm
                    labelStyle={{ minWidth: '100px' }}
                    tips='formula'
                    title={t('方法', language)}
                  >
                    <QueryFormula
                      typeId={typeId}
                      value={method}
                      onMethodChange={this.handleMethodChange}
                    />
                  </EditorForm>
                  {method !== 'COUNT' && false ? (
                    <EditorForm
                      tips='metric'
                      title={t('指标', language)}
                    >
                      <DataInput
                        list={metricList}
                        value={metric}
                        onChange={this.handleDataIdChage}
                      />
                    </EditorForm>
                  ) : undefined}
                  <EditorForm
                    tips='interval'
                    title={t('周期', language)}
                  >
                    <IntervalInput
                      interval={interval}
                      intervalUnit={intervalUnit}
                      onIntervalChange={this.handleIntervalChange}
                      onIntervalUnitChange={this.handleIntervalUnitChange}
                    />
                  </EditorForm>
                  <EditorForm
                    labelStyle={{ minWidth: '110px' }}
                    tips='tag'
                    title={t('维度', language)}
                  >
                    <DimensionInput
                      dimension={dimension}
                      dimensionList={dimensionList}
                      onDimensionChange={this.handleDimensionChange}
                    />
                  </EditorForm>
                  <EditorForm title={t('条件', language)}>
                    <ConditionInput
                      condition={condition}
                      dimensionList={dimensionList}
                      getDimensionValue={this.getDimensionValue}
                      onChange={this.handleConditionChange}
                    />
                  </EditorForm>
                  <EditorForm title={t('别名', language)}>
                    <AliasInput
                      value={alias}
                      onChange={this.handleAliasChange}
                    />
                  </EditorForm>
                </div>
              ) : undefined}
            </>
          ) : (
            <div className='inite-wrapper' />
          )}
        </Spin>
      </div>
    );
  }
}
