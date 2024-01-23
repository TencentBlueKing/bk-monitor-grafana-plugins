/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
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
import EditorForm from './editor-form';
import Spin from 'antd/es/spin';
import {  LoadingState, QueryEditorProps } from '@grafana/data';
import QueryDataSource from '../datasource/datasource';
import Button from 'antd/es/button';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { QueryOption } from '../typings/config';
import { IQueryConfig, QueryData } from '../typings/datasource';
import { LanguageContext } from '../utils/context';
import { getCookie, getEnByName } from '../utils/utils';
import { ICommonItem, IConditionItem, IntervalType } from 'typings/metric';
import AlertQueryFormula from './alert-query-formula';
import AlertIntervalInput from './alert-interval-input';
import AlertDimensionInput from './alert-dimension-input';
import AlertConditionInput from './alert-condition-input';
import AlertAliasInput from './alert-alias-input';
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
export type IQueryEditorProps = QueryEditorProps<QueryDataSource, QueryData, QueryOption>;
export enum SearcState  {
  'deafult' ='deafult',
  'auto' = 'auto',
  'loading' = 'loading'
}
interface IQueryEditorState {
  loading: boolean;
  inited: boolean;
  language: string;
  fieldList: ICommonItem[];
  agg_method: string;
  group_by: string[];
  interval: IntervalType;
  interval_unit: string;
  alias: string;
  where: IConditionItem[];
  searchState: SearcState
}
export default class MonitorQueryEditor extends React.PureComponent<IQueryEditorProps, IQueryEditorState> {
  constructor(props, context) {
    super(props, context);
    const { query } = props;
    const { method, interval, interval_unit, group_by, alias, where } = query.query_configs?.[0] as IQueryConfig || {};
    this.state = {
      loading: true,
      inited: false,
      language: getCookie('blueking_language'),
      fieldList: [],
      agg_method: method || 'COUNT',
      searchState: SearcState.deafult,
      group_by: group_by || [],
      interval: interval || 60,
      interval_unit: interval_unit || 's',
      alias: alias || '',
      where: where?.length ? where : [{} as any],
    };
    this.initState();
  }
  /**
   * @description: 初始化state
   * @param {QueryData} query
   * @return {*}
   */
  async initState() {
    const list = await this.props.datasource.getAlarmEventField();
    this.setState({
      loading: false,
      inited: true,
      fieldList: list,
    });
  }
  handleQuery = () => {
    const query: any = this.handleGetQueryData();
    const { refId, hide, key, queryType, datasource } = this.props.query;
    this.props.onChange({
      refId,
      hide,
      key,
      queryType,
      datasource,
      ...query,
    });
    this.state.searchState === SearcState.auto && this.props.onRunQuery();
  };
  handleGetQueryData() {
    return {
      query_configs: [{
        group_by: this.state.group_by,
        interval: this.state.interval,
        interval_unit: this.state.interval_unit,
        method: this.state.agg_method,
        alias: this.state.alias,
        where: this.state.where?.filter?.(item => item.key) || [],
      }],
    };
  }
  handleMethodChange = async (v: string) => {
    this.setState({
      agg_method: v,
    }, this.handleQuery);
  };
  handleIntervalChange = async (v: number) => {
    this.setState({
      interval: v,
    }, this.handleQuery);
  };
  handleIntervalUnitChange = async (v: string) => {
    this.setState({
      interval_unit: v,
    }, this.handleQuery);
  };
  handleDimensionChange = async (v: string[]) => {
    this.setState({
      group_by: v,
    }, this.handleQuery);
  };
  handleAliasChange = async (v: string) => {
    this.setState({
      alias: v,
    }, this.handleQuery);
  };
  handleConditionChange = async (v: IConditionItem[], needQuery = true) => {
    this.setState({
      where: v,
    }, () => needQuery !== false && this.handleQuery());
  };
  handleSearchStateChange = () => {
    this.setState({
      searchState: this.state.searchState === 'auto' ? SearcState.deafult : SearcState.auto,
    });
  };
  handleClickQuery = () => {
    if (this.props.data?.state === LoadingState.Loading) return;
    const query: any = this.handleGetQueryData();
    const { refId, hide, key, queryType, datasource } = this.props.query;
    this.props.onChange({
      refId,
      hide,
      key,
      queryType,
      datasource,
      ...query,
    });
    this.props.onRunQuery();
  };
  transfromModeComp = (state: LoadingState) => {
    const isLoading = state === LoadingState.Loading;
    const { searchState } = this.state;
    let btnText = getEnByName('查询');
    if (isLoading) btnText = getEnByName('查询中...');
    else if (searchState === SearcState.auto) btnText = getEnByName('自动查询');
    return <div className='transform-mode'>
      <span className='search-play' onClick={() => !isLoading && this.handleSearchStateChange()}>
        {
          isLoading
            ? <LoadingOutlined spin style={{ color: '#3A84FF', cursor: isLoading ? 'not-allowed' : 'pointer' }}/>
            : <i className={`fa ${searchState === SearcState.deafult ? 'fa-play' : 'fa-pause'}`}/>
        }
      </span>
      <Button
        size="small"
        disabled={isLoading}
        onClick={this.handleClickQuery}
        className={`search-auto ${isLoading ? 'is-loading' : ''}`}
        type="primary">{btnText}</Button>
    </div>;
  };
  render(): JSX.Element {
    const {
      loading,
      inited,
      language,
      agg_method,
    } = this.state;
    const { data } = this.props;
    return (
      <LanguageContext.Provider value={{ language }}>
        <div className="monitor-grafana">
          <Spin spinning={loading} tip="Loading...">
            {inited ? (
              <>
                {
                  this.transfromModeComp(data?.state)
                }
                <div className="query-editor">
                  <div className="query-editor-content">
                    <>
                      <EditorForm title={getEnByName('汇聚', language)} tips="formula">
                        <AlertQueryFormula
                          agg_method={agg_method}
                          onMethodChange={this.handleMethodChange}
                        />
                      </EditorForm>
                      <EditorForm title={getEnByName('周期', language)} tips="interval">
                        <AlertIntervalInput
                          agg_interval={this.state.interval}
                          agg_interval_unit={this.state.interval_unit}
                          onIntervalChange={this.handleIntervalChange}
                          onIntervalUnitChange={this.handleIntervalUnitChange}
                        />
                      </EditorForm>
                      <EditorForm title={getEnByName('维度', language)} tips="tag">
                        <AlertDimensionInput
                          dimensions={this.state.fieldList}
                          agg_dimension={this.state.group_by}
                          onDimensionChange={this.handleDimensionChange}
                        />
                      </EditorForm>
                      <EditorForm title={getEnByName('条件', language)} style={{ marginBottom: '0px' }}>
                        <AlertConditionInput
                          agg_condition={this.state.where}
                          dimensions={this.state.fieldList}
                          datasource={this.props.datasource}
                          onChange={(v, needQuery = true) => this.handleConditionChange(
                            v,
                            needQuery,
                          )
                          }
                        />
                      </EditorForm>
                      <EditorForm title={getEnByName('别名', language)}>
                        <AlertAliasInput alias={this.state.alias} onChange={this.handleAliasChange} />
                      </EditorForm>
                    </>
                  </div>
                </div>
              </>
            ) : (
              <div className="inite-wrapper" />
            )}
          </Spin>
        </div>
      </LanguageContext.Provider>
    );
  }
}
