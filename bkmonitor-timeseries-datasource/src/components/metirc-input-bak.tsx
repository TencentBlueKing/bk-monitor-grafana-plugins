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
/* eslint-disable camelcase */
import React from 'react';
import { IMetric, MetricDetail } from '../typings/metric';
import Cascader from 'antd/es/cascader';
import CloseCircleFilled from '@ant-design/icons/CloseCircleFilled';
import { LanguageContext } from '../utils/context';
import { createMetricTitleTooltips, getEnByName } from '../utils/utils';
// import Divider from 'antd/es/divider';
import Popover from 'antd/es/popover';
import Tooltip from 'antd/es/tooltip';
export interface IQueryProps {
  metric: MetricDetail;
  datasource: any;
  onMetricChange: (value: string[], options: any) => void;
}
interface IQueryState {
  open: boolean;
  queryString: string;
  searchList: any[];
  timer: any;
  metricList: IMetric[];
}

export default class MonitorQueryEditor extends React.PureComponent<IQueryProps, IQueryState> {
  constructor(props, context) {
    super(props, context);
    this.state = {
      open: false,
      queryString: '',
      searchList: [],
      metricList: [],
      timer: null,
    };
  }

  handlePopupChange = async (v: boolean): Promise<void> => {
    if (!this.state.metricList?.length) {
      this.setState({
        open: false,
      });
      await this.handleGetMetricLevelData([]);
    }
    this.setState({
      open: v,
    });
  };
  /**
   * @description: 动态加载选项
   * @param {*} selectOption
   * @return {*}
   */
  handleLoadData = async (selectOption) => {
    await this.handleGetMetricLevelData(selectOption);
  };
  /**
   * @description:  输入查询时候触发
   * @param {*} e
   * @return {*}
   */
  handleInput = async (e) => {
    const query = e?.target?.value?.trim() || '';
    this.setState({
      queryString: e?.target?.value || '',
      open: true,
    });
    let list = [];
    if (!query.length) {
      this.setState({
        searchList: list,
      });
      clearTimeout(this.state.timer);
      return;
    }
    clearTimeout(this.state.timer);
    const timer = setTimeout(async () => {
      list = await this.handleGetMetricSearchData(query);
      this.setState({
        searchList: list || [],
      });
    }, 300);
    this.setState({
      timer,
    });
  };
  handleMetricChange = async (a, b) => {
    clearTimeout(this.state.timer);
    this.props.onMetricChange(a, b);
    this.setState({
      queryString: '',
      searchList: [],
    });
  };
  displayRender = (): JSX.Element => {
    const { metric_field_name, metric_field, result_table_id,
      result_table_label_name, result_table_name } = this.props.metric;
    const labels = [result_table_label_name, result_table_name, metric_field_name];
    return metric_field ? (
      <div className="metric-label">
        { result_table_id ? `${result_table_id}.${metric_field}` : metric_field}
        <span className="metric-label-desc">（{labels.join(' / ')}）</span>
      </div>
    ) : null;
  };
  handleClear = () => {
    if (this.state.queryString) {
      clearTimeout(this.state.timer);
      this.setState({
        queryString: '',
        searchList: [],
      });
    } else {
      this.props.onMetricChange([], []);
    }
  };
  /**
   * @description: 按层级获取指标数据
   * @param {any} options
   * @return {*}
   */
  handleGetMetricLevelData = async (options: any = []) => {
    const curOption = options[options.length - 1];
    if (curOption) curOption.loading = true;
    const list = options?.[1]?.data_source?.split('.');
    let metricList = [];
    const result_table_label = options?.[0]?.id || '';
    let needToolTip = false;
    if (options.length < 4) {
      let params = {};
      const commonCondition = {
        data_source_label: list?.[0] || '',
        data_type_label: list?.[1] || '',
      };
      switch (options.length) {
        case 0:
        default:
          params = { level: 'result_table_label' };
          break;
        case 1:
          params = { level: 'data_source', conditions: { result_table_label } };
          break;
        case 2:
          params = {
            level: 'related_id',
            conditions: {
              result_table_label,
              ...commonCondition,
            },
          };
          break;
        case 3:
          params = {
            level: 'result_table_id',
            conditions: {
              result_table_label,
              related_id: options?.[2]?.related_id || '',
              ...commonCondition,
            },
          };
      }
      metricList = await this.props.datasource.getQueryMetricLevel(params);
    } else {
      metricList = await this.props.datasource.getMetricDetailById({
        result_table_label,
        conditions: {
          data_source_label: list[0],
          data_type_label: list[1],
          ...Object.assign({}, options?.[3]?.result_table_name ? {
            result_table_name: options[3].result_table_name,
          } : {
            result_table_id: options?.[3]?.result_table_id || '',
          }),
        },
        flat_format: true,
      });
      needToolTip = true;
    }
    if (curOption && metricList?.length) {
      curOption.children = metricList.map(item => ({
        ...item,
        name: needToolTip ? <Popover zIndex={9999} placement="right" content={<div dangerouslySetInnerHTML={{ __html: createMetricTitleTooltips(item) }}></div>}>
          <div>{item.name}</div>
        </Popover> : item.name,
        isLeaf: options.length >= 4,
      }));
    }
    if (curOption) curOption.loading = false;
    this.setState({
      metricList: !curOption ? metricList.map(item => ({
        ...item,
        isLeaf: false })) : [...this.state.metricList],
    });
  };
  /**
   * @description: 搜索metric
   * @param {string} queryString
   * @return {*}
   */
  handleGetMetricSearchData = async (queryString: string) => {
    const metricList = await this.props.datasource.getMetricDetailById({
      query_string: queryString,
      flat_format: true,
    });
    return (metricList || []).map((item: IMetric) => {
      const name = `${item.result_table_label_name} / ${item.data_source_label_name} / ${item.related_name} / ${item.result_table_label_name} / ${item.name}`;
      return {
        ...item,
        id: `${item.result_table_id}.${item.id}`,
        // eslint-disable-next-line max-len
        name: <Popover zIndex={9999} placement="right" content={<div dangerouslySetInnerHTML={{ __html: createMetricTitleTooltips(item) }}></div>}>
          <div>{name}</div>
        </Popover>,
      };
    });
  };
  render(): JSX.Element {
    const { metricList } = this.state;
    const needPlaceholder = this.state.queryString.length === 0 && !this.props.metric?.metric_field;
    return (
      <LanguageContext.Consumer>
        {({ language }) => (
          <Cascader
            expandTrigger="click"
            showSearch={false}
            loadData={this.handleLoadData}
            open={this.state.open}
            onChange={this.handleMetricChange}
            onDropdownVisibleChange={this.handlePopupChange}
            fieldNames={{
              label: 'name',
              value: 'id',
              children: 'children',
            }}
            options={this.state.queryString.length ? this.state.searchList : metricList}
          >
            <div className="mitric-input">
              <span
                className="mitric-input-name"
                style={{ display: this.state.queryString.length > 0 ? 'none' : 'flex' }}
              >
                {this.displayRender()}
              </span>
              <Popover placement='topRight' content={!!this.props.metric?.metric_field ? <div dangerouslySetInnerHTML={{ __html: createMetricTitleTooltips(this.props.metric) }}/> : undefined}>
                <input
                  className="ant-input mitric-input-search"
                  value={this.state.queryString}
                  onChange={this.handleInput}
                  placeholder={needPlaceholder ? getEnByName('请选择监控指标', language) : ''}
                  onKeyDown={e => e.stopPropagation()}
                />
              </Popover>
              <CloseCircleFilled
                className="anticon ant-cascader-picker-clear"
                style={{ display: needPlaceholder ? 'none' : 'flex' }}
                onClick={this.handleClear}
              />
            </div>
          </Cascader>
        )}
      </LanguageContext.Consumer>
    );
  }
}
