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
// import Cascader from 'antd/es/cascader';
import CloseCircleFilled from '@ant-design/icons/CloseCircleFilled';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { LanguageContext } from '../utils/context';
import { createMetricTitleTooltips, random } from '../utils/utils';
// import Divider from 'antd/es/divider';
import Popover from 'antd/es/popover';
import Input from 'antd/es/input';
import Tabs from 'antd/es/tabs';
import Spin from 'antd/es/spin';
import Checkbox from 'antd/es/checkbox';
import DashboardDatasource from 'datasource/datasource';
import Tooltip from 'antd/es/tooltip';
import Message from 'antd/es/message';
import SyncOutlined from '@ant-design/icons/SyncOutlined';
let interval: any = null;
const { TabPane } = Tabs;
export enum MetricInputMode {
  EDIT = 'edit',
  COPY = 'copy'
};
export interface IQueryProps {
  metric?: MetricDetail;
  datasource: DashboardDatasource;
  mode?: MetricInputMode;
  onMetricChange?: (metric: IMetric) => void;
}
type RightPanelType = 'datasource' | 'scenario';
interface ITagItem {
  id: string;
  name: string;
}
interface IDataSourceItem extends ITagItem {
  count: number;
  data_source_label: string;
  data_type_label: string;
}
interface IMetricResponse {
  metric_list: IMetric[];
  tag_list: ITagItem[];
  data_source_list: IDataSourceItem[];
  scenario_list: IDataSourceItem[];
  count: number;
}
interface IQueryState {
  metricList: IMetric[];
  tagList: ITagItem[];
  dataSourceList: IDataSourceItem[];
  scenarioList: IDataSourceItem[];
  page: number,
  pageSize: number,
  total: number;
  keyword: string;
  tag: ITagItem;
  datasourceLabel: IDataSourceItem[];
  resultTableLabel: string[];
  moreLoading: boolean;
  loading: boolean;
  open: boolean;
  isArrowKeySet: boolean;
  focusIndex: number;
  timer: any
  refleshMetric: boolean
}

export default class MonitorQueryEditor extends React.PureComponent<IQueryProps, IQueryState> {
  containerRef: any = null;
  inputRef: any = null;
  constructor(props, context) {
    super(props, context);
    this.containerRef = React.createRef();
    this.inputRef = React.createRef();
    this.state = {
      metricList: [],
      tagList: [],
      dataSourceList: [],
      datasourceLabel: [],
      resultTableLabel: [],
      scenarioList: [],
      page: 1,
      pageSize: 20,
      total: 0,
      keyword: '',
      tag: null,
      moreLoading: false,
      loading: false,
      open: false,
      isArrowKeySet: false,
      focusIndex: -1,
      timer: null,
      refleshMetric: false,
    };;
  }
  componentDidMount(): void {
    document.addEventListener('mousemove', this.handleMouseMove);
  }
  componentWillUnmount(): void {
    document.removeEventListener('mousemove', this.handleMouseMove);
  }
  handleMouseMove = () => {
    this.setState({
      isArrowKeySet: false,
    });
  };
  /**
   * @description: 上下键和Enter键
   * @param {any} e
   * @return {*}
   */
  handleKeyDown = (e: any) => {
    if (['ArrowDown', 'ArrowUp'].includes(e.code)) {
      e.preventDefault();
      e.stopPropagation();
      this.containerRef.current.focus();
      const { focusIndex, metricList, page, pageSize, total } = this.state;
      let index = e.code === 'ArrowUp' ? focusIndex - 1 : focusIndex + 1;
      if (index < 0) {
        index = page * pageSize >= total ? metricList.length - 1 : metricList.length - 4;
      } else index = index <= metricList.length - 1 ? index : 0;
      const metric = metricList[index];
      const dom = document.getElementById(`${metric.metric_id}_${index}`);
      const showToolMetric = metricList.find(item => item.showTool);
      showToolMetric && (showToolMetric.showTool = false);
      dom?.focus();
      this.setState({
        isArrowKeySet: true,
        focusIndex: index,
        metricList: metricList.slice(),
      });
    } else if (this.state.isArrowKeySet && ['Enter', 'NumpadEnter'].includes(e.code)) {
      const { focusIndex, metricList } = this.state;
      const metric = metricList[focusIndex];
      this.props.onMetricChange(metric);
      this.handleVisibleChange(false);
    }
  };
  /**
   * @description: metric变更
   * @param {any} e
   * @param {IMetric} metric
   * @return {*}
   */
  handleMetricChange = async (e: any, metric: IMetric) => {
    e.stopPropagation();
    if (this.props.mode === MetricInputMode.COPY) {
      this.handleCopyMetric(metric, e);
      this.handleVisibleChange(false);
      return;
    }
    this.props.onMetricChange(metric);
    this.handleVisibleChange(false);
  };
  /**
   * @description: 清空
   * @return {*}
   */
  handleClear = () => {
    this.props.onMetricChange(null);
    this.handleVisibleChange(false);
  };
  /** 滚动事件
   * @description:
   * @param {any} e
   * @return {*}
   */
  handleScoll = async (e: any) => {
    if (Math.ceil(this.state.total / this.state.pageSize) <= this.state.page) return;
    const el = (e as any).target;
    const { scrollHeight, scrollTop, clientHeight } = el as any;
    if (Math.ceil(scrollTop) + clientHeight >= scrollHeight) {
      this.setState({
        moreLoading: true,
        page: this.state.page + 1,
      }, this.getMetricList);
    }
  };
  // 获取指标列表
  getMetricList = async (isSearch?: boolean) => {
    const { page, pageSize, tag, metricList, datasourceLabel,
      resultTableLabel, dataSourceList, scenarioList, focusIndex } = this.state;
    const {
      metric_list = [],
      tag_list = [],
      scenario_list = [],
      data_source_list = [],
      count = 0,
    }: IMetricResponse = await this.props.datasource.getMetricList({
      conditions: [{ key: 'query', value: this.state.keyword }],
      data_type_label: this.props.mode === MetricInputMode.COPY ? 'time_series' : 'grafana',
      page,
      page_size: pageSize,
      tag: tag?.id || '',
      data_source: datasourceLabel.map(item => [item.data_source_label, item.data_type_label]),
      result_table_label: resultTableLabel,
    });
    const metrics = (isSearch ? metric_list : metricList.concat(metric_list)).map(metric => ({
      ...metric,
      showTool: false,
      titleName: [metric.result_table_id, metric.metric_field].filter(Boolean).join('.'),
      titleAlias: metric.metric_field === metric.metric_field_name ? '' : metric.metric_field_name,
      subtitle: [
        metric.result_table_label_name,
        data_source_list.find(item => item.data_source_label === metric.data_source_label
          && item.data_type_label === metric.data_type_label)?.name,
        metric.related_name].filter(Boolean).join(' / '),
    }));
    let tags  = [];
    if (tag?.id) {
      if (tag_list.length) {
        tags = tag_list.some(item => item.id === tag.id) ? tag_list : [{ ...tag }].concat(tag_list);
      } else {
        tags = [{ ...tag }];
      }
    } else {
      tags = tag_list;
    }
    let datasources;
    if (datasourceLabel?.length) {
      if (data_source_list.length) {
        datasources = data_source_list.filter(item => item.count > 0
          || datasourceLabel.some(set => set.id === item.id));
      } else {
        datasources = dataSourceList.filter(item => datasourceLabel.some(set => set.id === item.id));
      }
    } else {
      datasources = data_source_list.filter(item => item.count > 0);
    }
    let resultTables;
    if (resultTableLabel?.length) {
      if (scenario_list.length) {
        resultTables = scenario_list.filter(item => item.count > 0
          || resultTableLabel.includes(item.id));
      } else {
        resultTables = scenarioList.filter(item => resultTableLabel.includes(item.id));
      }
    } else {
      resultTables = scenario_list.filter(item => item.count > 0);
    }
    this.setState({
      metricList: metrics,
      tagList: tags,
      dataSourceList: datasources,
      scenarioList: resultTables,
      moreLoading: false,
      loading: false,
      total: count,
      focusIndex: isSearch ? -1 : focusIndex,
      isArrowKeySet: !isSearch,
    });
  };
  // 输入查询
  handleSearch = (e: any) => {
    this.setState({
      loading: true,
      keyword: e.target.value.toString().trim(),
      page: 1,
      isArrowKeySet: false,
    }, () => {
      clearTimeout(this.state.timer);
      const timer = setTimeout(() => {
        this.getMetricList(true);
      }, 330);
      setTimeout(() => {
        this.setState({ timer });
      });
    });
  };
  handleTagChange = (activeKey: string) => {
    const { tag, tagList } = this.state;
    this.setState({
      loading: true,
      tag: activeKey === tag?.id ? null : tagList.find(item => item.id === activeKey),
      page: 1,
    }, () => this.getMetricList(true));
  };
  /**
   * @description: 右侧check事件
   * @param {any} e
   * @param {RightPanelType} type 类型
   * @param {IDataSourceItem} item 数据item
   * @return {*}
   */
  handleCheckChange= async (e: any, type: RightPanelType, item: IDataSourceItem) => {
    const { checked } = e.target;
    if (type === 'datasource') {
      this.setState({
        datasourceLabel: checked
          ? this.state.datasourceLabel.concat(item)
          : this.state.datasourceLabel.filter(d => d.id !== item.id),
      });
    } else {
      this.setState({
        resultTableLabel: checked
          ? this.state.resultTableLabel.concat(item.id)
          : this.state.resultTableLabel.filter(d => d !== item.id),
      });
    }
    this.setState({
      loading: true,
      page: 1,
    }, () => this.getMetricList(true));
  };
  /**
   * @description: 查询字符传匹配
   * @param {string} str
   * @return {*}
   */
  getSearchNode= (str: string) => {
    if (!str) return str;
    let { keyword } = this.state;
    const len = keyword.length;
    if (!keyword?.trim().length || !str.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())) return str;
    const list = [];
    let lastIndex = -1;
    keyword = keyword.replace(/([.*/]{1})/gmi, '\\$1');
    str.replace(new RegExp(`${keyword}`, 'igm'), (key, index) => {
      if (list.length === 0 && index !== 0) {
        list.push(str.slice(0, index));
      } else if (lastIndex >= 0) {
        list.push(str.slice(lastIndex + key.length, index));
      }
      list.push(<span className='is-keyword'>{key}</span>);
      lastIndex = index;
      return key;
    });
    if (lastIndex >= 0) {
      list.push(str.slice(lastIndex + len));
    }
    return list.length ? list : str;
  };
  /**
   * @description: 复制指标名
   * @param {IMetric} metric
   * @param {any} e
   * @return {*}
   */
  handleCopyMetric(metric: IMetric, e: any) {
    e.stopPropagation();
    const metircDom = document.getElementById(metric.metric_id);
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(metircDom);
    selection.removeAllRanges();
    selection.addRange(range);
    Message.success({
      content: '复制成功',
      duration: 3,
    });
    document.execCommand('copy');
  }
  handShowContent =() => {
    this.setState({ open: true });
  };
  handleVisibleChange= (v) => {
    if (v && v !== this.state.open) {
      document.addEventListener('keydown', this.handleKeyDown);
      this.setState({
        open: false,
        page: 1,
        pageSize: 20,
        total: 0,
        keyword: '',
        tag: null,
        moreLoading: false,
        loading: true,
        datasourceLabel: [],
        resultTableLabel: [],
        isArrowKeySet: false,
        focusIndex: -1,
      }, () => {
        this.getMetricList(true);
        setTimeout(() => {
          this.inputRef.current.focus();
        }, 300);
      });
    } else if (!v) {
      document.removeEventListener('keydown', this.handleKeyDown);
    }
    this.setState({ open: v });
  };

  handleShowTool(e, metric: IMetric, i: number) {
    if (this.state.isArrowKeySet) {
      e.preventDefault();
      return;
    }
    metric.showTool = true;
    this.setState({
      metricList: this.state.metricList.slice(),
      focusIndex: i,
      isArrowKeySet: false,
    });
  }
  handleHideTool(metric: IMetric) {
    metric.showTool = false;
    this.setState({
      metricList: this.state.metricList.slice(),
    });
  }
  handInputFocus = () => {
    this.setState({
      isArrowKeySet: false,
    });
  };
  handleReleshMetric = async () => {
    if (this.state.refleshMetric) return;
    this.setState({ refleshMetric: true });
    const taskId = await this.props.datasource.updateMetricListByBiz().catch(() => '');
    if (taskId) {
      interval =  setInterval(async () => {
        const result: any = await this.props.datasource.queryAsyncTaskResult({ task_id: taskId })
          .catch(() => ({ is_completed: true }));
        if (result?.state === 'SUCCESS' || result.is_completed) {
          clearInterval(interval);
          this.setState({ loading: true, refleshMetric: false }, this.getMetricList);
        }
      }, 2000);
    } else {
      this.setState({ refleshMetric: false });
    }
  };
  // 右侧checkbox 面版
  contentRightPanel(list: IDataSourceItem[], dataType: RightPanelType) {
    const { datasourceLabel, resultTableLabel } = this.state;
    return <>
      <div className='content-tag-title'>{dataType === 'scenario' ? '监控对象' : '采集来源'}</div>
      <ul className='content-tag-list'>
        {
          list.map(item => <Checkbox
            className='list-item'
            key={item.id}
            checked={dataType === 'datasource' ? datasourceLabel.some(set => set.id === item.id) : resultTableLabel.includes(item.id)}
            onChange={e => this.handleCheckChange(e, dataType, item)}>
            {item.name}<span className='list-item-count'>{item.count}</span>
          </Checkbox>)
        }
      </ul>
    </>;
  }
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
  // 弹层面版
  contentRender() {
    const { tagList, metricList, dataSourceList, scenarioList, keyword,
      tag, total, page, pageSize, loading, focusIndex, isArrowKeySet } = this.state;
    const showAllTotal = metricList.length > 0 && Math.ceil(total / pageSize) <= page;
    return <div className='metric-dropdown'>
      <div className='metric-dropdown-input'>
        <Input
          value={keyword}
          onChange={this.handleSearch}
          onFocus={this.handInputFocus}
          placeholder='搜索指标'
          ref={this.inputRef}
          autoFocus={true}
          allowClear={true}/>
        <span className={`reflesh-icon ${this.state.refleshMetric ? 'reflesh-pendding' : ''}`} onClick={this.handleReleshMetric}><SyncOutlined /></span>
      </div>
      <div className={`metric-dropdown-tag ${!tagList.length ? 'tab-empty' : ''}`}>
        {
          tagList.length > 0 && <Tabs defaultActiveKey={tag?.id || random(10)}
            activeKey={tag?.id || random(10)}
            onTabClick={this.handleTagChange}>
            {tagList.map(item => (
              <TabPane tab={
                <span className='tab-tag'>{item.name}</span>
              } key={item.id}></TabPane>
            ))}
          </Tabs>
        }
      </div>
      <Spin spinning={loading} className="content-spin">
        <div className='metric-dropdown-content'>
          <ul className='content-list'
            tabIndex={-1}
            onScroll={this.handleScoll}
            ref={this.containerRef}>
            {
              metricList.map((metric, i) => <Tooltip
                mouseEnterDelay={ isArrowKeySet ? 99999999 : 1}
                placement='right'
                title={!!metric?.metric_field
                  ? <div dangerouslySetInnerHTML={{ __html: createMetricTitleTooltips(metric) }}/>
                  : undefined}>
                <div
                  className={`metric-item ${focusIndex === i ? 'focus-item' : ''} ${isArrowKeySet ? 'is-arrow' : ''}`}
                  key={`${metric.metric_id}_${i}`}
                  id={`${metric.metric_id}_${i}`}
                  tabIndex={-1}
                  onClick={e => this.handleMetricChange(e, metric)}
                  onMouseEnter={e => this.handleShowTool(e, metric, i)}
                  onMouseLeave={() => this.handleHideTool(metric)}>
                  <div className='metric-item-title'>
                    <span style={{ fontSize: 0, opacity: 0 }}
                      id={metric.metric_id}>{metric.metric_id.replace(/\./g, ':').replace('::', ':')}
                    </span>
                    <div className='title-wrap'>
                      <span className='title-name'>{this.getSearchNode(metric.readable_name)}</span>{this.getSearchNode(metric.titleAlias)}
                    </div>
                    {
                      this.props.mode !== MetricInputMode.COPY && <Tooltip title="复制指标名">
                        <span style={{ visibility: metric.showTool ? 'visible' : 'hidden' }} className='copy-icon' onClick={e => this.handleCopyMetric(metric, e)}>
                          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10467" width="200" height="200"><path d="M732.8 256H163.2C144 256 128 272 128 291.2v569.6c0 19.2 16 35.2 35.2 35.2h569.6c19.2 0 35.2-16 35.2-35.2V291.2c0-19.2-16-35.2-35.2-35.2z m-28.8 64v512H192V320h512z m160-192c19.2 0 32 12.8 32 32v608h-64V192H256V128h608z m-256 512H288v64h320v-64z m0-192H288v64h320v-64z"></path></svg>
                        </span>
                      </Tooltip>
                    }
                  </div>
                  <div className='metric-item-subtitle'>{metric.subtitle}</div>
                </div>
              </Tooltip>)

            }
            {
              !metricList.length && <div className='empty-content'>
                <div className='empty-content-icon'>
                  <svg className="ant-empty-img-simple" width="64" height="41" viewBox="0 0 64 41" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(0 1)" fill="none" fillRule="evenodd">
                      <ellipse className="ant-empty-img-simple-ellipse" cx="32" cy="33" rx="32" ry="7"></ellipse>
                      <g className="ant-empty-img-simple-g" fillRule="nonzero">
                        <path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z"></path>
                        <path d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z" className="ant-empty-img-simple-path"></path>
                      </g>
                    </g>
                  </svg>
                </div>
                <div className='empty-content-title'>暂无数据</div>
                {/* <div className='empty-content-subtitle'>
                  <div>指标显示是基于实际的数据上报</div>
                  <div>1. 如需接入新的数据，请看 <span className='text-btn'>文档</span></div>
                </div> */}
              </div>
            }
            {
              showAllTotal && <div className='all-data'>已加载全部数据</div>
            }
            {
              this.state.moreLoading && <Spin indicator={<LoadingOutlined style={{ fontSize: 20 }} spin />} className='more-loading'></Spin>
            }
          </ul>
          <div className='content-tag'>
            {dataSourceList.length > 0 && this.contentRightPanel(dataSourceList, 'datasource')}
            {scenarioList.length > 0 && this.contentRightPanel(scenarioList, 'scenario')}
          </div>
        </div>
      </Spin>
    </div>;
  }
  render(): JSX.Element {
    const needPlaceholder = !this.props.metric?.metric_field;
    return (
      <LanguageContext.Consumer>
        {({  }) => (
          <div className={`mitric-input ${this.props.mode === MetricInputMode.COPY ? 'copy-mode' : ''}`}>
            <Popover
              placement='bottomLeft'
              overlayClassName='mitric-input-popover'
              trigger="click"
              visible={this.state.open}
              onVisibleChange={this.handleVisibleChange}
              getPopupContainer={() => document.querySelector('.dashboard-settings') || document.body}
              content={this.contentRender()}>
              {
                this.props.mode === MetricInputMode.COPY
                  ? <div className='copy-mode-input'>
                  指标选择
                    <i className='fa fa-angle-down'/>
                  </div>
                  : <div style={{ flex: 1 }} onClick={this.handShowContent}>
                    <Tooltip placement='right' title={!!this.props.metric?.metric_field
                      ? <div dangerouslySetInnerHTML={{ __html: createMetricTitleTooltips(this.props.metric) }}/>
                      : undefined}>
                      <span
                        className="mitric-input-name"
                      >
                        {needPlaceholder ? '选择指标' : this.displayRender()}
                      </span>
                    </Tooltip>
                  </div>
              }
            </Popover>
            <CloseCircleFilled
              className="anticon ant-cascader-picker-clear"
              style={{ display: needPlaceholder ? 'none' : 'flex' }}
              onClick={this.handleClear}
            />
          </div>
        )}
      </LanguageContext.Consumer>
    );
  }
}
