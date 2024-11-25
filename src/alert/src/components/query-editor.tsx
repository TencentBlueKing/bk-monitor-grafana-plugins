/* eslint-disable @typescript-eslint/no-explicit-any */
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
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { LoadingState, type QueryEditorProps } from '@grafana/data';
import Button from 'antd/es/button';
import Spin from 'antd/es/spin';
import React from 'react';

import type { QueryOption } from '../typings/config';
import type { IQueryConfig, QueryData } from '../typings/datasource';
import type { ICommonItem, IConditionItem, IntervalType } from '../typings/metric';
import { LanguageContext } from '../utils/context';
import { getCookie, t } from '../utils/utils';
import AlertAliasInput from './alert-alias-input';
import AlertConditionInput from './alert-condition-input';
import AlertDimensionInput from './alert-dimension-input';
import AlertIntervalInput from './alert-interval-input';
import AlertQueryFormula from './alert-query-formula';
import EditorForm from './editor-form';

import type QueryDataSource from '../datasource/datasource';
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
export type IQueryEditorProps = QueryEditorProps<QueryDataSource, QueryData, QueryOption>;
export enum SearcState {
  auto = 'auto',
  deafult = 'deafult',
  loading = 'loading',
}
interface IQueryEditorState {
  agg_method: string;
  alias: string;
  fieldList: ICommonItem[];
  group_by: string[];
  inited: boolean;
  interval: IntervalType;
  interval_unit: string;
  language: string;
  loading: boolean;
  searchState: SearcState;
  where: IConditionItem[];
}
export default class MonitorQueryEditor extends React.PureComponent<IQueryEditorProps, IQueryEditorState> {
  constructor(props, context) {
    super(props, context);
    const { query } = props;
    const { alias, group_by, interval, interval_unit, method, where } =
      (query.query_configs?.[0] as IQueryConfig) || {};
    this.state = {
      agg_method: method || 'COUNT',
      alias: alias || '',
      fieldList: [],
      group_by: group_by || [],
      inited: false,
      interval: interval || 'auto',
      interval_unit: interval_unit || 'h',
      language: getCookie('blueking_language') || 'zh-cn',
      loading: true,
      searchState: SearcState.deafult,
      where: where?.length ? where : [{} as any],
    };
    this.initState();
  }
  handleAliasChange = async (v: string) => {
    this.setState(
      {
        alias: v,
      },
      this.handleQuery
    );
  };
  handleClickQuery = () => {
    if (this.props.data?.state === LoadingState.Loading) return;
    const query: any = this.handleGetQueryData();
    const { datasource, hide, key, queryType, refId } = this.props.query;
    this.props.onChange({
      datasource,
      hide,
      key,
      queryType,
      refId,
      ...query,
    });
    this.props.onRunQuery();
  };
  handleConditionChange = async (v: IConditionItem[], needQuery = true) => {
    this.setState(
      {
        where: v,
      },
      () => needQuery !== false && this.handleQuery()
    );
  };
  handleDimensionChange = async (v: string[]) => {
    this.setState(
      {
        group_by: v,
      },
      this.handleQuery
    );
  };
  handleIntervalChange = async (v: number) => {
    this.setState(
      {
        interval: v,
      },
      this.handleQuery
    );
  };
  handleIntervalUnitChange = async (v: string) => {
    this.setState(
      {
        interval_unit: v,
      },
      this.handleQuery
    );
  };
  handleMethodChange = async (v: string) => {
    this.setState(
      {
        agg_method: v,
      },
      this.handleQuery
    );
  };
  handleQuery = () => {
    const query: any = this.handleGetQueryData();
    const { datasource, hide, key, queryType, refId } = this.props.query;
    this.props.onChange({
      datasource,
      hide,
      key,
      queryType,
      refId,
      ...query,
    });
    this.state.searchState === SearcState.auto && this.props.onRunQuery();
  };
  handleSearchStateChange = () => {
    this.setState({
      searchState: this.state.searchState === 'auto' ? SearcState.deafult : SearcState.auto,
    });
  };
  transfromModeComp = (state: LoadingState) => {
    const isLoading = state === LoadingState.Loading;
    const { searchState } = this.state;
    let btnText = t('查询');
    if (isLoading) btnText = t('查询中...');
    else if (searchState === SearcState.auto) btnText = t('自动查询');
    return (
      <div className='transform-mode'>
        <span
          className='search-play'
          onClick={() => !isLoading && this.handleSearchStateChange()}
        >
          {isLoading ? (
            <LoadingOutlined
              style={{ color: '#3A84FF', cursor: isLoading ? 'not-allowed' : 'pointer' }}
              spin
            />
          ) : (
            <i className={`fa ${searchState === SearcState.deafult ? 'fa-play' : 'fa-pause'}`} />
          )}
        </span>
        <Button
          className={`search-auto ${isLoading ? 'is-loading' : ''}`}
          disabled={isLoading}
          size='small'
          type='primary'
          onClick={this.handleClickQuery}
        >
          {btnText}
        </Button>
      </div>
    );
  };
  handleGetQueryData() {
    return {
      query_configs: [
        {
          alias: this.state.alias,
          group_by: this.state.group_by,
          interval: this.state.interval,
          interval_unit: this.state.interval_unit,
          method: this.state.agg_method,
          where: this.state.where?.filter?.(item => item.key) || [],
        },
      ],
    };
  }
  /**
   * @description: 初始化state
   * @param {QueryData} query
   * @return {*}
   */
  async initState() {
    const list = await this.props.datasource.getAlarmEventField();
    this.setState({
      fieldList: list,
      inited: true,
      loading: false,
    });
  }
  render(): JSX.Element {
    const { agg_method, inited, language, loading } = this.state;
    const { data } = this.props;
    return (
      <LanguageContext.Provider value={{ language }}>
        <div className='monitor-grafana-alert'>
          <Spin
            spinning={loading}
            tip='Loading...'
          >
            {inited ? (
              <>
                {this.transfromModeComp(data?.state)}
                <div className='query-editor'>
                  <div className='query-editor-content'>
                    <>
                      <EditorForm
                        tips='formula'
                        title={t('汇聚', language)}
                      >
                        <AlertQueryFormula
                          agg_method={agg_method}
                          onMethodChange={this.handleMethodChange}
                        />
                      </EditorForm>
                      <EditorForm
                        tips='interval'
                        title={t('周期', language)}
                      >
                        <AlertIntervalInput
                          agg_interval={this.state.interval}
                          agg_interval_unit={this.state.interval_unit}
                          onIntervalChange={this.handleIntervalChange}
                          onIntervalUnitChange={this.handleIntervalUnitChange}
                        />
                      </EditorForm>
                      <EditorForm
                        tips='tag'
                        title={t('维度', language)}
                      >
                        <AlertDimensionInput
                          agg_dimension={this.state.group_by}
                          dimensions={this.state.fieldList}
                          onDimensionChange={this.handleDimensionChange}
                        />
                      </EditorForm>
                      <EditorForm
                        style={{ marginBottom: '0px' }}
                        title={t('条件', language)}
                      >
                        <AlertConditionInput
                          agg_condition={this.state.where}
                          datasource={this.props.datasource}
                          dimensions={this.state.fieldList}
                          onChange={(v, needQuery = true) => this.handleConditionChange(v, needQuery)}
                        />
                      </EditorForm>
                      <EditorForm title={t('别名', language)}>
                        <AlertAliasInput
                          alias={this.state.alias}
                          onChange={this.handleAliasChange}
                        />
                      </EditorForm>
                    </>
                  </div>
                </div>
              </>
            ) : (
              <div className='inite-wrapper' />
            )}
          </Spin>
        </div>
      </LanguageContext.Provider>
    );
  }
}
