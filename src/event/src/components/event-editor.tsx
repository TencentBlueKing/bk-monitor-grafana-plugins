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
import DimensionInput from './dimension-input';
import EditorForm from './editor-form';
import IntervalInput from './interval-input';
import QueryFormula from './query-formula';
import TypeInput from './type-iput';

import type QueryDataSource from '../datasource/datasource';
import Select from 'antd/es/select';

export type IQueryEditorProps = QueryEditorProps<QueryDataSource, QueryData, QueryOption>;
interface IQueryEditorState {
  loading: boolean;
  inited: boolean;
  language: string;
  typeId: MetricType;
  metricId: string;
  dataList: IDataItem[];
  method: string;
  interval: number;
  intervalUnit: string;
  dimension: string[];
  condition: IConditionItem[];
  alias: string;
  queryString: string;
  currentMetricItem?: IDataItem;
  page: number;
  total: number;
  keyword: string;
  timer: any;
}
export default class MonitorQueryEditor extends React.PureComponent<IQueryEditorProps, IQueryEditorState> {
  constructor(props, context) {
    super(props, context);
    const { query_configs } = this.props.query;
    let [
      {
        interval = 60,
        interval_unit = 's',
        where = [{}],
        group_by = [],
        method = 'COUNT',
        data_source_label = 'bk_monitor',
        data_type_label = 'log',
        metric_id = '',
        query_string = '',
        alias = '',
        metric_field = '',
        result_table_id = '',
      },
    ] = query_configs;
    if (!metric_id && result_table_id) {
      // 旧版数据兼容
      metric_field = result_table_id;
      result_table_id = metric_field;
    }
    const typeId = `${data_source_label}|${data_type_label}` as MetricType;
    const condition = where.length ? where : ([{}] as any);
    if (condition[condition.length - 1]?.key) {
      condition.push({} as any);
    }
    this.state = {
      loading: true,
      inited: false,
      language: getCookie('blueking_language') || '',
      typeId,
      metricId: metric_id,
      dataList: [],
      method,
      interval,
      intervalUnit: interval_unit,
      dimension: group_by,
      condition,
      alias,
      queryString: query_string,
      currentMetricItem: undefined,
      page: 1,
      total: 0,
      keyword: '',
      timer: null,
    };
    this.initState(this.state.typeId, metric_id);
  }

  handleQuery = () => {
    const query: any = this.handleGetQueryData();
    const { refId, hide, key, queryType, datasource } = this.props.query;
    this.props.onChange({ refId, hide, key, queryType, datasource, ...query });
    this.props.onRunQuery();
  };
  handleGetQueryData() {
    const {
      alias,
      typeId,
      metricId,
      dimension,
      interval,
      intervalUnit,
      method,
      condition,
      queryString,
      dataList,
      currentMetricItem,
    } = this.state;
    const [data_source_label, data_type_label] = typeId.split('|');
    if (!metricId) return {};
    const metricItem = dataList.find(item => item.id === metricId);
    if (!metricItem) return {};
    return {
      query_configs: [
        {
          data_source_label,
          data_type_label,
          result_table_id: metricItem.result_table_id,
          alias,
          refId: 'a',
          group_by: dimension,
          interval,
          interval_unit: intervalUnit,
          metric_field: metricItem.metric_field,
          metric_id: metricItem.metric_id,
          method,
          time_field: currentMetricItem?.time_field || 'time',
          where: condition.filter?.(item => item.key) || [],
          query_string: queryString,
          event_name: metricItem?.extend_fields?.custom_event_name,
        },
      ],
    };
  }
  /**
   * @description: 初始化state
   * @param {MetricType} typeId
   * @param {string} metric_id
   * @return {*}
   */
  async initState(typeId: MetricType, metric_id: string) {
    const [data_source_label, data_type_label] = typeId.split('|');
    const getInitMetricList = async (id: string): Promise<IDataItem[]> => {
      return await this.props.datasource
        .getMetricList({
          conditions: [
            {
              key: id ? 'metric_id' : 'query',
              value: id || '',
            },
          ],
          data_source: [[data_source_label, data_type_label]],
          page: 1,
          page_size: 500,
        })
        .then(({ metric_list }) => {
          return metric_list
            ?.filter(item => (id ? item.metric_id === id : true))
            ?.map?.(item => ({ ...item, id: item.metric_id, name: item.metric_field_name }));
        })
        .catch(() => []);
    };
    const promiseList = [getInitMetricList('')];
    if (metric_id) {
      promiseList.push(getInitMetricList(metric_id));
    }
    const [dataList, initDataList] = await Promise.all(promiseList);
    if (metric_id && initDataList?.length && !dataList?.some(item => item.id === metric_id)) {
      dataList.unshift({ ...initDataList[0] });
    }
    this.setState({
      currentMetricItem: dataList[0],
      dataList,
      metricId: metric_id || dataList[0]?.id,
    });
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
  handelTypeIdChange = async (typeId: MetricType) => {
    this.setState(
      {
        typeId,
        total: 0,
        loading: true,
        dataList: [],
        metricId: '',
        currentMetricItem: undefined,
      },
      async () => {
        const dataList: IDataItem[] = await this.getMetricList();
        this.setState(
          {
            loading: false,
            metricId: dataList[0]?.id || '',
            dataList,
            currentMetricItem: dataList[0],
            method: dataList[0]?.metrics?.length && typeId !== 'custom|event' ? this.state.method : 'COUNT',
          },
          () => {
            this.setState(
              {
                dimension: [],
                condition: [{}] as any,
              },
              this.handleQuery,
            );
          },
        );
      },
    );
  };
  getMetricList = async (page = 1, keyword = '') => {
    if (this.state.total !== 0 && this.state.total <= this.state.dataList.length) return this.state.dataList;
    const [data_source_label, data_type_label] = this.state.typeId.split('|');
    const data = await this.props.datasource
      .getMetricList({
        conditions: [
          {
            key: 'query',
            value: keyword,
          },
        ],
        data_source: [[data_source_label, data_type_label]],
        data_type_label: data_type_label,
        page,
        page_size: 500,
      })
      .then(({ metric_list }) => {
        return metric_list?.map?.(item => ({ ...item, id: item.metric_id, name: item.metric_field_name }));
      })
      .catch(() => []);
    this.setState({ total: data.count || 0 });
    return page === 1 ? data : this.state.dataList.slice().concat(data);
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
  handleDataIdChange = async (metricId: string) => {
    const metricItem = this.state.dataList.find(item => item.id === metricId);
    this.setState({ metricId, currentMetricItem: metricItem, dimension: [], condition: [{}] as any }, this.handleQuery);
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
    const { typeId, method, currentMetricItem } = this.state;
    const [data_source_label, data_type_label] = typeId.split('|');
    list = await this.props.datasource.getNewDimensionValue({
      resultTableId: currentMetricItem?.result_table_id,
      metricField: method === 'COUNT' ? '_index' : currentMetricItem?.metric_field,
      dataSourceLabel: data_source_label,
      dataTypeLabel: data_type_label,
      field: v,
    });
    return { [v]: list || [] };
  };
  handleSearch = async (value: string) => {
    if (this.state.timer) clearTimeout(this.state.timer);
    const timer = setTimeout(async () => {
      this.setState({ loading: true, keyword: value, page: 1 });
      const dataList = await this.getMetricList(1, value);
      this.setState({ loading: false, timer: null, dataList });
    }, 300);
    this.setState({ timer });
  };
  handlePopupScroll = async e => {
    if (this.state.loading) return;
    const target = e.target;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight) {
      this.setState({ loading: true, page: +this.state.page + 1 }, async () => {
        const dataList = await this.getMetricList(this.state.page, this.state.keyword);
        this.setState({ loading: false, dataList });
      });
    }
  };
  handleDropdownVisibleChange = (open: boolean) => {
    if (!open) {
      this.setState({
        keyword: '',
        page: 1,
        total: 0,
        loading: false,
      });
    }
  };
  render(): JSX.Element {
    const {
      language,
      typeId,
      metricId,
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
    const dimensionList = this.state.currentMetricItem?.dimensions || [];
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
                    onChange={this.handelTypeIdChange}
                  />
                </EditorForm>
                <EditorForm
                  labelStyle={{ minWidth: '108px' }}
                  title={t('数据名称', language)}
                >
                  <Select
                    className='type-input'
                    value={this.state.metricId}
                    virtual={true}
                    onSelect={v => {
                      this.setState({
                        metricId: v,
                        currentMetricItem: dataList.find(item => item.id === v),
                      });
                    }}
                    popupClassName='type-input-popup'
                    showSearch
                    filterOption={false}
                    loading={this.state.loading}
                    fieldNames={{ label: 'name', value: 'id' }}
                    options={this.state.dataList}
                    onSearch={this.handleSearch}
                    onPopupScroll={this.handlePopupScroll}
                    onDropdownVisibleChange={this.handleDropdownVisibleChange}
                  />
                </EditorForm>
              </div>
              {metricId ? (
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
              {metricId ? (
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
