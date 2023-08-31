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
import MetricInput, { MetricInputMode } from './metirc-input';
import QueryFormula from './query-formula';
import IntervalInput from './interval-input';
import DimensionInput from './dimension-input';
import ConditionInput from './condition-input';
import FunctionMenu from './function-menu';
import FunctionInput from './funtion-input';
import AliasInput from './alias-input';
import TargetInput from './target-input';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import PromqlEditor from './promql-editor';
import Spin from 'antd/es/spin';
import { LoadingState, QueryEditorProps } from '@grafana/data';
import QueryDataSource from '../datasource/datasource';
import Button from 'antd/es/button';
import {
  ITargetItem,
  ITargetData,
  IMetric,
  TARGET_TYPE,
  MetricDetail,
  IConditionItem,
  IFunctionItem,
  EditMode,
  EditorStatus,
  IntervalType,
  IExpresionItem,
} from '../typings/metric';
import { QueryOption } from '../typings/config';
import { IQueryConfig, QueryData } from '../typings/datasource';
import { handleTransformOldQuery } from '../utils/common';
import { LanguageContext } from '../utils/context';
import { getCookie, getEnByName } from '../utils/utils';
import AddvanceSetting, { AddvanceSettingKey } from './addvance-setting';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
const refLetters = 'abcdefghijklmnopqrstuvwxyz';
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
export type IQueryEditorProps = QueryEditorProps<QueryDataSource, QueryData, QueryOption>;
export enum SearcState  {
  'deafult' ='deafult',
  'auto' = 'auto',
  'loading' = 'loading'
}
interface IQueryEditorState {
  metricList: MetricDetail[];
  cluster: ITargetItem[];
  module: ITargetItem[];
  host: ITargetItem[];
  loading: boolean;
  functionList: IFunctionItem[];
  inited: boolean;
  language: string;
  mode: EditMode;
  source: string;
  isTranform: boolean;
  editorStatus: EditorStatus;
  // onlyPromql: boolean;
  step: string;
  promqlAlias: string;
  format: string;
  type: string;
  expressionList: IExpresionItem[];
  searchState: SearcState
}
export default class MonitorQueryEditor extends React.PureComponent<IQueryEditorProps, IQueryEditorState> {
  constructor(props, context) {
    super(props, context);
    let { query } = props;
    // 兼容旧版本targetData
    if (query?.data?.metric && query?.data?.monitorObject) {
      query = handleTransformOldQuery(query.data);
    }
    const { cluster = [], module = [], host = [], expression = '', mode = 'ui',  expressionList = [],  functions = [], source = '', alias = '', display = false, only_promql = false, step = '', promqlAlias = '' } = query;
    let expressions: IExpresionItem[] = expressionList;
    // 兼容旧版本
    if (expression?.length) {
      expressions = [{
        expression,
        active: display,
        functions,
        alias,
      }];
    }
    this.state = {
      metricList: [{} as any],
      cluster,
      module,
      host,
      functionList: [],
      loading: true,
      inited: false,
      language: getCookie('blueking_language'),
      mode: only_promql || mode === 'code' ? 'code' : 'ui',
      source,
      isTranform: false,
      editorStatus: 'default',
      step,
      format: query.format ?? 'time_series',
      type: query.type ?? 'range',
      promqlAlias: promqlAlias || alias,
      expressionList: expressions,
      searchState: SearcState.deafult,
    };
    this.initState(query);
  }
  /**
   * @description: 初始化state
   * @param {QueryData} query
   * @return {*}
   */
  async initState(query: QueryData) {
    const { query_configs } = query;
    let metricList: MetricDetail[] = [{} as any];
    const functionList = await this.props.datasource.getQueryMetricFunction();
    if (query_configs?.length) {
      metricList = await this.handleInitMetricList(query_configs, functionList);
    }
    let list: IExpresionItem[] = [];
    if (this.state.expressionList.length) {
      list = this.state.expressionList.map(item => ({
        ...item,
        functions: item?.functions?.length ? this.handleInitFuntions(functionList, item.functions) : [],
      }));
    }
    this.setState({
      metricList,
      functionList,
      loading: false,
      inited: true,
      expressionList: list,
    });
  }
  /**
   * @description:
   * @param {IQueryConfig} query_configs
   * @param {*} functionList
   * @return {*}
   */
  async handleInitMetricList(query_configs: IQueryConfig[], functionList) {
    const promiseList = query_configs.map((item) => {
      const commonData = {
        agg_method: item.method,
        agg_condition: item.where?.length ? item.where : [{}],
        agg_dimension: item.group_by,
        agg_interval: item.interval,
        agg_interval_unit: item.interval_unit,
        display: item.display,
        refId: (item.refId || '').toLocaleLowerCase(),
        alias: item.alias,
        functions: item?.functions?.length ? this.handleInitFuntions(functionList, item.functions) : [],
        mode: 'ui',
        source: item.source,
      };
      return this.props.datasource
        .getMetricDetailById({
          // result_table_label: item.result_table_label,
          conditions: {
            data_source_label: item.data_source_label,
            data_type_label: item.data_type_label,
            result_table_id: item.result_table_id || undefined,
            metric_field: item.metric_field,
            data_label: item.data_label || undefined,
          },
          flat_format: true,
        })
        .then((metricList) => {
          const metric = metricList.find(set => set.metric_field === item.metric_field
            && ((item.data_label && set.data_label === item.data_label) ||  set.result_table_id === (item.result_table_id || '')));
          const newMetric: IMetric = {
            ...item,
            ...metric,
            ...commonData,
          };
          return new MetricDetail(newMetric);
        })
        .catch(() => new MetricDetail({
          ...item,
          ...commonData,
        } as any));
    });
    return await Promise.all(promiseList);
  }
  /**
   * @description: 初始化function list
   * @param {IFunctionItem} functionList
   * @param {IFunctionItem} functions
   * @return {*}
   */
  handleInitFuntions(functionList: IFunctionItem[], functions: IFunctionItem[]) {
    const funcList: IFunctionItem[] = functionList.reduce(
      (pre, cur) => (cur?.children?.length ? [...pre, ...cur.children] : pre),
      [],
    );
    return functions.map((func) => {
      const funcItem = funcList.find(set => set.id === func.id);
      if (funcItem) {
        return {
          ...funcItem,
          params: funcItem?.params.map((p) => {
            const curParam = func.params.find(set => set.id);
            return {
              ...p,
              value: typeof curParam === 'undefined' ? p.default : curParam.value,
              edit: false,
            };
          }),
        };
      }
      return func;
    });
  }
  handleQuery = (list?: MetricDetail[], expression?: string, display?: boolean) => {
    const metricList = list?.length ? list : this.state.metricList;
    const query: any = this.handleGetQueryData(metricList, expression, display);
    const { refId, hide, key, queryType, datasource } = this.props.query;
    this.props.onChange({
      refId,
      hide,
      key,
      queryType,
      datasource,
      source: this.state.source,
      step: this.state.step,
      format: this.state.format,
      type: this.state.type,
      mode: this.state.mode || 'ui',
      // showExpression: this.state.showExpression,
      ...query,
    });
    this.state.searchState === SearcState.auto && this.props.onRunQuery();
  };
  handleGetQueryData(metricList: MetricDetail[], expression?: string, display?: boolean) {
    const { host, module, cluster, expressionList, promqlAlias } = this.state;
    console.info(expression, display);
    // const curExpression = typeof expression === 'undefined' ? this.state.expression : expression;
    // const curDisplay = typeof display === 'undefined' ? this.state.display : display;
    return {
      expressionList: expressionList.map(item => ({
        ...item,
        functions: item.functions?.map?.(({ id, params }) => ({
          id,
          params: params?.map?.(p => ({ id: p.id, value: p.value })) || [],
        })),
      })),
      promqlAlias,
      query_configs: metricList
        .filter(item => item.metricMetaId)
        .map((item) => {
          const logParams = item.data_source_label === 'bk_log_search'
            ? {
              index_set_id: item.index_set_id,
            }
            : {};
          return {
            data_source_label: item.data_source_label,
            data_type_label: item.data_type_label,
            result_table_id: item.result_table_id || undefined,
            result_table_label: item.result_table_label,
            data_label: item.data_label || undefined,
            filter_dict: {},
            functions: item.functions?.map?.(({ id, params }) => ({
              id,
              params: params?.map?.(p => ({ id: p.id, value: p.value })) || [],
            })),
            group_by: item.agg_dimension,
            interval: item.agg_interval,
            interval_unit: item.agg_interval_unit,
            metric_field: item.metric_field,
            method: item.agg_method,
            alias: item.alias,
            refId: item.refId,
            display: item.display,
            time_field: item.extend_fields?.time_field || item.time_field || '',
            where: item.agg_condition?.filter?.(item => item.key) || [],
            ...logParams,
          };
        }),
      host,
      module,
      cluster,
    };
  }
  handleCommonSetMetric<T extends MetricDetail, K extends keyof MetricDetail>(
    metricIndex: number,
    name: K,
    value: T[K],
    needQuery = true,
  ) {
    const list = this.state.metricList.map((item, index) => {
      if (index === metricIndex) {
        item[name] = value;
        return item.metricMetaId ? new MetricDetail({ ...item } as any) : ({ ...item } as any);
      }
      return item;
    });
    this.setState(
      {
        metricList: list,
      },
      needQuery ? this.handleQuery : undefined,
    );
  }
  /**
   * @description: 选择指标后触发
   * @param {string} v
   * @param {any} options
   * @return {*}
   */
  handleMetricChange = async (metric: IMetric, metricIndex: number): Promise<void> => {
    if (metric?.metric_id) {
      let metricList = this.state.metricList.map((item, index) => (
        index === metricIndex
          ? new MetricDetail({
            ...metric,
            agg_condition: item.agg_condition,
            agg_dimension: item.agg_dimension || [],
            agg_interval: item.agg_interval || 'auto',
            agg_method: item.agg_method,
            agg_interval_unit: item.agg_interval_unit || 's',
            functions: item.functions || [],
            alias: item.alias || '',
          } as any)
          : item
      ));
      metricList = this.handleResetMetricDimension(metricList);
      this.setState(
        {
          metricList,
        },
        this.handleQuery,
      );
    } else {
      // 清空当前指标
      this.handleDeleteMetric(metricIndex);
    }
  /**
   * @description: metric变更
   * @return {*}
   */
  };
  handleDeleteMetric = async (metricIndex: number) => {
    let metricList = this.state.metricList.length === 1
      ? [{ refId: 'a' } as any]
      : this.state.metricList.filter((item, index) => index !== metricIndex);
    metricList = this.handleResetMetricDimension(metricList);
    this.setState(
      {
        metricList,
      },
      this.handleQuery,
    );
  };
  /**
   * @description:
   * @param {number} metricIndex
   * @return {*}
   */
  handleTransfromMetricMode = async (metricIndex: number) => {
    this.setState({ isTranform: true }, async () => {
      const curMetric = this.state.metricList[metricIndex];
      let hasError = false;
      if (curMetric.mode !== 'code') {
        let source = '';
        if (curMetric.metricMetaId) {
          this.handleCommonSetMetric(metricIndex, 'loading', true, false);
          const params = this.handleGetQueryData([curMetric]);
          source = await this.props.datasource.queryConfigToPromql(params as QueryData).catch(() => {
            hasError = true;
            return '';
          });
          this.handleCommonSetMetric(metricIndex, 'source', source, false);
        }
      } else {
        let list = this.state.metricList.slice();
        if (!curMetric?.source?.trim().length) {
          list.splice(metricIndex, 1, { refId: this.handleGetNewRefId(this.state.metricList) } as any);
          this.setState(
            {
              metricList: list,
              isTranform: false,
            },
            this.handleQuery,
          );
          return;
        }
        this.handleCommonSetMetric(metricIndex, 'loading', true, false);
        const data = await this.props.datasource.promqlToqueryConfig(curMetric.source, 'ui').catch(() => {
          hasError = true;
          return {};
        });
        if (data?.query_configs?.length && data.query_configs.length === 1) {
          const metricList = await this.handleInitMetricList(data.query_configs, this.state.functionList);
          metricList.forEach(set => (set.alias = curMetric.alias));
          list.splice(metricIndex, 1, ...metricList);
          list = this.handleResetMetricDimension(list);
          this.setState(
            {
              metricList: list,
              // display: list.length > 1,
              // expression: list.length < 2 ? '' : this.state.expression,
            },
            this.handleQuery,
          );
        } else {
          hasError = true;
        }
      }
      !hasError && this.handleCommonSetMetric(metricIndex, 'mode', curMetric.mode === 'code' ? 'ui' : 'code', false);
      this.handleCommonSetMetric(metricIndex, 'loading', false, false);
      this.handleCommonSetMetric(metricIndex, 'status', hasError ? 'error' : 'default', false);
      this.setState({ isTranform: false });
    });
  };
  handleTransformMode = async () => {
    this.setState({ isTranform: true }, async () => {
      const { mode } = this.state;
      let hasError = false;
      if (mode !== 'code') {
        let source = '';
        this.setState({ loading: true });
        const params = this.handleGetQueryData(this.state.metricList);
        source = await this.props.datasource.queryConfigToPromql(params as QueryData).catch(() => {
          hasError = true;
          return '';
        });
        this.setState({ source });
      } else {
        let list = this.state.metricList.slice();
        if (!this.state.source?.trim().length) {
          this.setState(
            {
              metricList: [{ refId: this.handleGetNewRefId(this.state.metricList) } as any],
              // display: false,
              // expression: '',
              isTranform: false,
            },
            this.handleQuery,
          );
          return;
        }
        this.setState({ loading: true });
        const data = await this.props.datasource.promqlToqueryConfig(this.state.source, 'ui').catch(() => {
          hasError = true;
          return {};
        });
        if (data?.query_configs?.length) {
          const metricList = await this.handleInitMetricList(data.query_configs, this.state.functionList);
          metricList.forEach((set, index) => {
            set.alias = list[index]?.alias || '';
            set.display = list[index]?.display ?? true;
            set.mode = this.state.mode === 'code' ? 'ui' : 'code';
          });
          list = this.handleResetMetricDimension(metricList);
          this.setState(
            {
              metricList: list,
              // display: list.length > 1,
              // expression:
              //   list.length < 2
              //     ? ''
              //     : data.expression
              //       || (!this.state.expression && metricList.length === 2 ? 'a + b' : this.state.expression),
            },
            this.handleQuery,
          );
        } else {
          hasError = true;
        }
      }
      !hasError && this.setState({ mode: this.state.mode === 'code' ? 'ui' : 'code' });
      this.setState({ isTranform: false, editorStatus: hasError ? 'error' : 'default', loading: false });
    });
  };
  handleResetMetricDimension(metricList: MetricDetail[]) {
    const longDimension = metricList.reduce(
      (pre, cur) => (cur?.agg_dimension?.length > pre?.length ? cur.agg_dimension : pre),
      [],
    );
    return metricList.map((item, index) => {
      if (item.metricMetaId) {
        if (!item.refId
          || metricList.findIndex(set => set.refId.toLocaleLowerCase() === item.refId.toLocaleLowerCase()) < index) {
          item.refId = this.handleGetNewRefId(metricList);
        } else if (metricList.length === 1) {
          item.refId = 'a';
        }
        item.agg_dimension = longDimension.filter(id => item.agg_dimension.includes(id));
        return new MetricDetail({ ...item } as any);
      }
      return item;
    });
  }
  handleGetNewRefId(metricList: MetricDetail[]) {
    let letter = 'a';
    refLetters.split('').some((key) => {
      if (!metricList.some(item => item.refId.toLocaleLowerCase() === key)) {
        letter = key;
        return true;
      }
      return false;
    });
    return letter;
  }
  handleMethodChange = async (v: string, metricIndex: number) => {
    const isSumAndAuto = v.toLocaleUpperCase() === 'SUM' && this.state.metricList?.[metricIndex]?.agg_interval === 'auto';
    this.handleCommonSetMetric(metricIndex, 'agg_method', v, !isSumAndAuto);
    if (isSumAndAuto) {
      this.handleCommonSetMetric(metricIndex, 'agg_interval', 60, false);
      this.handleCommonSetMetric(metricIndex, 'agg_interval_unit', 's');
    }
  };
  handleIntervalChange = async (v: IntervalType, metricIndex: number) => {
    this.handleCommonSetMetric(metricIndex, 'agg_interval', v);
  };
  handleIntervalUnitChange = async (v: string, metricIndex: number) => {
    this.handleCommonSetMetric(metricIndex, 'agg_interval_unit', v);
  };
  handleDimensionChange = async (v: string[], metricIndex: number) => {
    this.handleCommonSetMetric(metricIndex, 'agg_dimension', v);
  };
  handleConditionChange = async (metricIndex: number, v: IConditionItem[], needQuery = true) => {
    this.handleCommonSetMetric(metricIndex, 'agg_condition', v, typeof needQuery === 'boolean' ? needQuery : true);
  };
  handleFuncitonSelected = async (v: IFunctionItem, metricIndex: number) => {
    const item = this.state.metricList[metricIndex];
    const functions = [
      ...item.functions,
      { ...v, params: v?.params?.map(p => ({ ...p, edit: false, value: p.default || p.shortlist?.[0] || '' })) },
    ];
    this.handleCommonSetMetric(metricIndex, 'functions', functions);
  };
  handleDeleteFuntion = async (metricIndex: number, funcIndex: number) => {
    const item = this.state.metricList[metricIndex];
    const list = item.functions.slice();
    list.splice(funcIndex, 1);
    this.handleCommonSetMetric(metricIndex, 'functions', list);
  };
  handleEditFuntion = (func: IFunctionItem, metricIndex: number, funcIndex: number, needQuery: boolean) => {
    const item = this.state.metricList[metricIndex];
    const list = item.functions.slice();
    list.splice(funcIndex, 1, func);
    this.handleCommonSetMetric(metricIndex, 'functions', list, needQuery);
  };
  handleExpressionFuncitonSelected = async (v: IFunctionItem, index: number) => {
    const { expressionList } = this.state;
    const item = expressionList[index];
    item.functions = [
      ...item.functions,
      { ...v, params: v?.params?.map(p => ({ ...p, edit: false, value: p.default || p.shortlist?.[0] || '' })) },
    ];
    this.setState({
      expressionList: expressionList.slice(),
    }, this.handleQuery);
  };
  handleDeleteExpressionFuntion = async (index: number, funcIndex: number) => {
    const { expressionList } = this.state;
    const item = expressionList[index];
    const list = item.functions.slice();
    list.splice(funcIndex, 1);
    item.functions = list;
    this.setState({
      expressionList: expressionList.slice(),
    }, this.handleQuery);
  };
  handleEditExpressionFuntion = (func: IFunctionItem, index: number, funcIndex: number, needQuery: boolean) => {
    const { expressionList } = this.state;
    const item = expressionList[index];
    const list = item.functions.slice();
    list.splice(funcIndex, 1, func);
    item.functions = list;
    this.setState({
      expressionList: expressionList.slice(),
    }, needQuery ? this.handleQuery : undefined);
  };
  handleAliasChange = async (v: string, metricIndex: number) => {
    this.handleCommonSetMetric(metricIndex, 'alias', v);
  };
  handleMetricChecked = async (metricIndex: number) => {
    const item = this.state.metricList[metricIndex];
    if (item.metricMetaId) {
      this.handleCommonSetMetric(metricIndex, 'display', !item.display);
    }
  };
  handleAddEmptyMetric = async () => {
    this.setState({
      metricList: [...this.state.metricList, { refId: this.handleGetNewRefId(this.state.metricList) } as any],
    });
  };
  handleExpressionChange = async (expression: string, index: number) => {
    const { expressionList } = this.state;
    const curExpression = expressionList[index];
    if (curExpression.expression !== expression) {
      curExpression.expression = expression;
      this.setState(
        {
          expressionList: expressionList.slice(),
        },
        this.handleQuery,
      );
    }
  };
  /**
   * @description: alias change
   * @param {string} alias
   * @return {*}
   */
  handleAllAliasChange = async (alias: string) => {
    if (alias !== this.state.promqlAlias) {
      this.setState(
        {
          promqlAlias: alias,
        },
        this.handleQuery,
      );
    }
  };
  handleExpressionAliasChange = async (alias: string, index: number) => {
    const { expressionList } = this.state;
    const curExpression = expressionList[index];
    if (alias !== curExpression.alias) {
      curExpression.alias = alias;
      this.setState(
        {
          expressionList: expressionList.slice(),
        },
        this.handleQuery,
      );
    }
  };
  /**
   * @description: expression change
   * @param {*}
   * @return {*}
   */
  handleExpressionChecked = async (index: number) => {
    const { expressionList } = this.state;
    expressionList[index].active = !expressionList[index].active;
    this.setState(
      {
        expressionList: expressionList.slice(),
      },
      this.handleQuery,
    );
  };
  /**
   * @description: target change
   * @param {ITargetData} data
   * @return {*}
   */
  handleTargetChange = async (data: ITargetData) => {
    this.setState(
      {
        ...data,
      },
      this.handleQuery,
    );
  };
  /**
   * @description: promql editor 失焦或者按下enter时触发
   * @param {number} metricIndex
   * @param {string} v
   * @return {*}
   */
  handleMetricSourceBlur = async (metricIndex: number, v: string, hasError = false) => {
    this.handleMetricSourceChange(metricIndex, v);
    setTimeout(async () => {
      if (!this.state.isTranform) {
        const item = this.state.metricList[metricIndex];
        if (item.metricMetaId && v.length) {
          this.handleCommonSetMetric(metricIndex, 'loading', true, false);
          if (!hasError) {
            const data = await this.props.datasource.promqlToqueryConfig(v, 'code').catch(() => {
              this.handleCommonSetMetric(metricIndex, 'status', 'error', false);
              return {};
            });
            if (data?.query_configs?.length && data.query_configs.length === 1) {
              data.query_configs[0].source = v;
              const metricList = await this.handleInitMetricList(data.query_configs, this.state.functionList);
              let list = this.state.metricList.slice();
              metricList.forEach(set => (set.alias = item.alias));
              list.splice(metricIndex, 1, ...metricList);
              list = this.handleResetMetricDimension(list);
              this.setState(
                {
                  metricList: list,
                },
                () => this.handleQuery(list),
              );
            }
          } else {
            this.handleCommonSetMetric(metricIndex, 'status', 'error', false);
          }
          this.handleCommonSetMetric(metricIndex, 'source', v, false);
          this.handleCommonSetMetric(metricIndex, 'loading', false, false);
        }
      }
    }, 20);
  };
  /**
   * @description: promql editor 失焦或者按下enter时触发
   * @param {number} metricIndex
   * @param {string} v
   * @return {*}
   */
  handleSourceBlur = async (v: string, hasError = false, immediateQuery = false) => {
    this.handleSouceChange(v);
    setTimeout(async () => {
      if (v.length && !this.state.isTranform) {
        if (!hasError) {
          this.setState({ loading: true });
          if (this.state.mode === 'code') {
            this.setState({
              source: v,
            }, () => {
              this.handleQuery();
              immediateQuery && this.state.searchState !== SearcState.auto && this.props.onRunQuery();
            });
          } else {
            const data = await this.props.datasource.promqlToqueryConfig(v, 'code').catch(() => {
              this.setState({ editorStatus: 'error' });
              return {};
            });
            if (data?.query_configs?.length) {
              const metricList = await this.handleInitMetricList(data.query_configs, this.state.functionList);
              let list = this.state.metricList.slice();
              metricList.forEach((set, index) => {
                set.alias = list[index]?.alias || '';
                set.display = list[index]?.display;
              });
              list = this.handleResetMetricDimension(metricList);
              this.setState({
                metricList: list,
                source: v,
              });
              this.handleQuery(list);
              immediateQuery && this.state.searchState !== SearcState.auto && this.props.onRunQuery();
            }
          }
          this.setState({ loading: false });
        } else {
          this.setState({ editorStatus: 'error' });
        }
      }
    }, 20);
  };
  /**
   * @description: promql editor值变更时触发
   * @param {number} metricIndex
   * @param {string} v
   * @return {*}
   */
  handleMetricSourceChange = async (metricIndex: number, v: string) => {
    if (v.trim() !== this.state.metricList[metricIndex].source) {
      this.handleCommonSetMetric(metricIndex, 'source', v, false);
    }
  };
  /**
   * @description: promql editor值变更时触发
   * @param {number} metricIndex
   * @param {string} v
   * @return {*}
   */
  handleSouceChange = async (v: string) => {
    if (v.trim() !== this.state.source) {
      this.setState({ source: v,  editorStatus: 'default' });
    }
  };

  handleProStepChange = async (v: string) => {
    if (v.trim() !== this.state.step.toString().trim()) {
      this.setState({ step: v }, this.handleQuery);
    }
  };
  handleSetMetricDisplay = async (index: number) => {
    this.handleMetricChecked(index);
  };
  handleCopyMetric = async (index: number) => {
    const curMetric = this.state.metricList[index];
    const copyMetric = new MetricDetail({ ...(curMetric as any) });
    let list = this.state.metricList.slice();
    list.splice(list.length, 0, copyMetric);
    list = this.handleResetMetricDimension(list);
    this.setState(
      {
        metricList: list,
      },
      this.handleQuery,
    );
  };
  handleAddExpression = () => {
    const { expressionList } = this.state;
    expressionList.push({
      active: true,
      expression: '',
      functions: [],
      alias: '',
    });
    this.setState({
      expressionList: expressionList.slice(),
    });
  };
  handleDeleteExpression = (index: number) => {
    const { expressionList } = this.state;
    const list = expressionList.slice();
    list.splice(index, 1);
    this.setState({
      expressionList: list,
    }, this.handleQuery);
  };
  handleAddvanceSettingChange = () => {

  };
  expressionListComp = (language) =>  {
    const { expressionList, functionList } = this.state;
    return expressionList.map((item, index) => (
      <div className="query-editor">
        <span
          className={`query-editor-label ${!item.active ? 'is-unchecked' : ''}`}
          onClick={() => this.handleExpressionChecked(index)}
        >
          <svg className="svg-icon" viewBox="0 0 1024 1024" width="200" height="200">
            <path d="M128 64v512a128 128 0 0 0 118.442667 127.658667L256 704h448v-128L1024 768l-320 192v-128H256A256 256 0 0 1 0.341333 588.8L0 576v-512h128z" />
          </svg>
        </span>
        <div className="query-editor-content">
          <EditorForm
            title={getEnByName('表达式', language)}
            labelStyle={{ paddingRight: '16px' }}
            tips={getEnByName('支持四则运算 + - * / % ^ ( ) ,如(A+B)/100', language)}
          >
            <AliasInput
              key={item.expression.length ? 'empty' : 'value'}
              inputProps={{
                defaultValue: item.expression,
                placeholder: getEnByName('支持四则运算 + - * / % ^ ( ) ,如(A+B)/100', language) }}
              style={{ minWidth: '288px' }}
              onChange={v => this.handleExpressionChange(v, index)}
            />
          </EditorForm>
          <EditorForm title={getEnByName('函数', language)}>
            <>
              {item.functions?.map((funtion, i) => (
                <FunctionInput
                  key={`${funtion.id}-${i}`}
                  funtion={funtion}
                  onDelete={() => this.handleDeleteExpressionFuntion(index, i)}
                  onEdit={(e, needQuery = true) => this.handleEditExpressionFuntion(
                    e,
                    index,
                    i,
                    needQuery,
                  )
                  }
                />
              ))}
              <FunctionMenu
                datasource={this.props.datasource}
                functionList={functionList}
                functions={item.functions}
                isExpressionFunc={true}
                onFunctionSeleted={v => this.handleExpressionFuncitonSelected(v, index)}
              />
            </>
          </EditorForm>
          <EditorForm title={getEnByName('别名', language)}>
            <AliasInput inputProps={{ defaultValue: item.alias }}
              onChange={v => this.handleExpressionAliasChange(v, index)} />
          </EditorForm>
        </div>
        <div className={'query-editor-tools multipe-metric'}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className="svg-icon source-icon"
            // style={{ display: metricList.length < 2 ? 'none' : 'flex' }}
            onClick={() => this.handleExpressionChecked(index)}>
            {
              item.active
                ? <path d="M21.92,11.6C19.9,6.91,16.1,4,12,4S4.1,6.91,2.08,11.6a1,1,0,0,0,0,.8C4.1,17.09,7.9,20,12,20s7.9-2.91,9.92-7.6A1,1,0,0,0,21.92,11.6ZM12,18c-3.17,0-6.17-2.29-7.9-6C5.83,8.29,8.83,6,12,6s6.17,2.29,7.9,6C18.17,15.71,15.17,18,12,18ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z"></path>
                : <path d="M10.94,6.08A6.93,6.93,0,0,1,12,6c3.18,0,6.17,2.29,7.91,6a15.23,15.23,0,0,1-.9,1.64,1,1,0,0,0-.16.55,1,1,0,0,0,1.86.5,15.77,15.77,0,0,0,1.21-2.3,1,1,0,0,0,0-.79C19.9,6.91,16.1,4,12,4a7.77,7.77,0,0,0-1.4.12,1,1,0,1,0,.34,2ZM3.71,2.29A1,1,0,0,0,2.29,3.71L5.39,6.8a14.62,14.62,0,0,0-3.31,4.8,1,1,0,0,0,0,.8C4.1,17.09,7.9,20,12,20a9.26,9.26,0,0,0,5.05-1.54l3.24,3.25a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42Zm6.36,9.19,2.45,2.45A1.81,1.81,0,0,1,12,14a2,2,0,0,1-2-2A1.81,1.81,0,0,1,10.07,11.48ZM12,18c-3.18,0-6.17-2.29-7.9-6A12.09,12.09,0,0,1,6.8,8.21L8.57,10A4,4,0,0,0,14,15.43L15.59,17A7.24,7.24,0,0,1,12,18Z"></path>
            }
          </svg>
          <svg
            onClick={() => this.handleDeleteExpression(index)}
            className="svg-icon delete-icon"
            viewBox="0 0 1024 1024"
            width="200"
            height="200"
          >
            <path d="M799.2 874.4c0 34.4-28.001 62.4-62.4 62.4H287.2c-34.4 0-62.4-28-62.4-62.4V212h574.4v662.4zM349.6 100c0-7.2 5.6-12.8 12.8-12.8h300c7.2 0 12.8 5.6 12.8 12.8v37.6H349.6V100z m636.8 37.6H749.6V100c0-48.001-39.2-87.2-87.2-87.2h-300c-48 0-87.2 39.199-87.2 87.2v37.6H37.6C16.8 137.6 0 154.4 0 175.2s16.8 37.6 37.6 37.6h112v661.6c0 76 61.6 137.6 137.6 137.6h449.6c76 0 137.6-61.6 137.6-137.6V212h112c20.8 0 37.6-16.8 37.6-37.6s-16.8-36.8-37.6-36.8zM512 824c20.8 0 37.6-16.8 37.6-37.6v-400c0-20.8-16.8-37.6-37.6-37.6s-37.6 16.8-37.6 37.6v400c0 20.8 16.8 37.6 37.6 37.6m-175.2 0c20.8 0 37.6-16.8 37.6-37.6v-400c0-20.8-16.8-37.6-37.6-37.6s-37.6 16.8-37.6 37.6v400c0.8 20.8 17.6 37.6 37.6 37.6m350.4 0c20.8 0 37.6-16.8 37.6-37.6v-400c0-20.8-16.8-37.6-37.6-37.6s-37.6 16.8-37.6 37.6v400c0 20.8 16.8 37.6 37.6 37.6" />
          </svg>
        </div>
      </div>
    ));
  };
  handleExchangeMode = () => {
    setTimeout(async () => {
      const { editorStatus, mode, source, metricList } = this.state;
      if (editorStatus === 'error') return;
      let hasError = false;
      this.setState({ loading: true });
      // ui => code
      if (mode === 'ui') {
        let source = '';
        const list = metricList.filter(item => item.metric_field);
        if (list.length) {
          const params = this.handleGetQueryData(list);
          let promqlAlias = params?.expressionList?.find(item => item.active)?.expression;
          if (!promqlAlias) {
            promqlAlias = params?.query_configs?.find(item => item.alias && (item.display || typeof item.display === undefined))?.alias;
          }
          source = await this.props.datasource.queryConfigToPromql(params as QueryData).catch(() => {
            hasError = true;
            return '';
          });
          source && this.setState({
            source,
            mode: 'code',
            promqlAlias: promqlAlias || params.promqlAlias,
          }, this.handleQuery);
        } else {
          !hasError && this.setState({
            source,
            mode: 'code',
            promqlAlias: '',
          }, this.handleQuery);
        }
      } else { // code => ui
        let data: any = {};
        if (source) {
          data = await this.props.datasource.promqlToqueryConfig(source, 'code').catch(() => {
            hasError = true;
            return {};
          });
        }
        if (data?.query_configs?.length) {
          const metricList = await this.handleInitMetricList(data.query_configs, this.state.functionList);
          let list = this.state.metricList.slice();
          metricList.forEach((set, index) => {
            set.alias = list[index]?.alias || '';
            set.display = list[index]?.display ?? true;
          });
          list = this.handleResetMetricDimension(metricList);
          this.setState({
            metricList: list,
            expressionList: data.expression ? [{ expression: data.expression, functions: [], alias: '', active: true }] : [],
            mode: 'ui',
          }, this.handleQuery);
        } else {
          !hasError && this.setState({
            metricList: [{ refId: 'a' } as any],
            expressionList: [],
            mode: 'ui',
          }, this.handleQuery);
        }
      }
      this.setState({
        loading: false,
        editorStatus: hasError ? 'error' : 'default',
      });
    }, 20);
  };
  handleSearchStateChange = () => {
    this.setState({
      searchState: this.state.searchState === 'auto' ? SearcState.deafult : SearcState.auto,
    });
  };
  transfromModeComp = (state: LoadingState) => {
    const isLoading = state === LoadingState.Loading;
    const { searchState, mode } = this.state;
    let btnText = getEnByName('查询');
    if (isLoading) btnText = getEnByName('查询中...');
    else if (searchState === SearcState.auto) btnText = getEnByName('自动查询');
    return <div className='transform-mode'>
      { mode === 'code' && <MetricInput mode={MetricInputMode.COPY} datasource={this.props.datasource}/>}
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
        onClick={() => !isLoading && this.props.onRunQuery()}
        className={`search-auto ${isLoading ? 'is-loading' : ''}`}
        type="primary">{btnText}</Button>
      <span className={`icon-wrap ${isLoading ? 'is-loading' : ''} `} onClick={() => !isLoading && this.handleExchangeMode()}>
        <i className='fa fa-exchange'/>{mode === 'code' ? 'UI' : 'PromQL'}
      </span>
    </div>;
  };
  addvanceSettingChange = (key: AddvanceSettingKey, v: string) => {
    this.setState({
      [key]: v,
    } as any, () => {
      this.handleQuery();
      this.state.searchState !== SearcState.auto && this.props.onRunQuery();
    });
  };
  render(): JSX.Element {
    const {
      cluster,
      module,
      host,
      metricList,
      editorStatus,
      functionList,
      loading,
      inited,
      language,
      mode,
      source,
      step,
      promqlAlias,
    } = this.state;
    const targetType = metricList.every(item => item.targetType === TARGET_TYPE.SERVICE_INSTANCE)
      ? TARGET_TYPE.SERVICE_INSTANCE
      : TARGET_TYPE.HOST;
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
                {
                  mode !== 'code'
                    ? (
                      <>
                        {
                          metricList.map((item, index) => (
                            <div className="query-editor" key={index}>
                              {
                                (metricList.length > 0 || !!this.state.expressionList?.length) &&  <span
                                  className={`query-editor-label ${!item.display ? 'is-unchecked' : ''}`}
                                  onClick={() => this.handleMetricChecked(index)}
                                >
                                  {item.refId?.toLocaleLowerCase() || 'a'}
                                </span>
                              }
                              <Spin
                                key={`${item.metricMetaId}-${item.refId}`}
                                spinning={!!item.loading && !!item.metricMetaId}
                              >
                                <div className="query-editor-content">
                                  {
                                    item.mode !== 'code'
                                      ? (
                                        <>
                                          <EditorForm title={getEnByName('指标', language)} tips="metric" style={{ flex: 1 }}>
                                            <MetricInput
                                              datasource={this.props.datasource}
                                              metric={item}
                                              onMetricChange={a => this.handleMetricChange(a, index)}
                                            />
                                          </EditorForm>
                                          {item?.metric_field && (
                                            <>
                                              <EditorForm title={getEnByName('汇聚', language)} tips="formula">
                                                <QueryFormula
                                                  metric={item}
                                                  onMethodChange={v => this.handleMethodChange(v, index)}
                                                />
                                              </EditorForm>
                                              <EditorForm title={getEnByName('周期', language)} tips="interval">
                                                <IntervalInput
                                                  metric={item}
                                                  onIntervalChange={v => this.handleIntervalChange(v, index)}
                                                  onIntervalUnitChange={v => this.handleIntervalUnitChange(v, index)}
                                                />
                                              </EditorForm>
                                              <EditorForm title={getEnByName('维度', language)} tips="tag">
                                                <DimensionInput
                                                  metric={item}
                                                  onDimensionChange={v => this.handleDimensionChange(v, index)}
                                                />
                                              </EditorForm>
                                              <EditorForm title={getEnByName('条件', language)} style={{ marginBottom: '0px' }}>
                                                <ConditionInput
                                                  metric={item}
                                                  datasource={this.props.datasource}
                                                  onChange={(v, needQuery = true) => this.handleConditionChange(
                                                    index,
                                                    v,
                                                    needQuery,
                                                  )
                                                  }
                                                />
                                              </EditorForm>
                                              <EditorForm title={getEnByName('函数', language)}>
                                                <>
                                                  {item.functions?.map((funtion, i) => (
                                                    <FunctionInput
                                                      key={`${funtion.id}-${i}`}
                                                      funtion={funtion}
                                                      onDelete={() => this.handleDeleteFuntion(index, i)}
                                                      onEdit={(e, needQuery = true) => this.handleEditFuntion(
                                                        e,
                                                        index,
                                                        i,
                                                        needQuery,
                                                      )
                                                      }
                                                    />
                                                  ))}
                                                  <FunctionMenu
                                                    metric={item}
                                                    datasource={this.props.datasource}
                                                    functionList={functionList}
                                                    onFunctionSeleted={v => this.handleFuncitonSelected(v, index)}
                                                  />
                                                </>
                                              </EditorForm>
                                              <EditorForm title={getEnByName('别名', language)}>
                                                <AliasInput metric={item} onChange={v => this.handleAliasChange(v, index)} />
                                              </EditorForm>
                                            </>
                                          )}
                                        </>
                                      )
                                      : (
                                        <PromqlEditor
                                          value={item.source}
                                          style={{
                                            minHeight: '64px',
                                            borderColor: item.status === 'error' ? '#ea3636' : '#dcdee5',
                                          }}
                                          verifiy={false}
                                          executeQuery={(v, hasError) => this.handleMetricSourceBlur(index, v, hasError)}
                                          onBlur={(v, hasError) => this.handleMetricSourceBlur(index, v, hasError)}
                                        />

                                      )}
                                </div>
                              </Spin>
                              {
                                item.metricMetaId
                                  ? (
                                    <div className={`query-editor-tools multipe-metric ${metricList.length < 2 ? '' : 'multipe-metric'}`}>
                                      {/* <svg
                                        onClick={() => this.handleTransfromMetricMode(index)}
                                        className="svg-icon source-icon"
                                        viewBox="0 0 1045 1024"
                                        width="200"
                                        height="200"
                                      >
                                        {item.mode === 'code' ? (
                                          <path d="M642.56 314.88a62.138182 62.138182 0 1 0-124.043636 0v199.912727a138.007273 138.007273 0 1 1-276.014546 0v-199.912727a62.138182 62.138182 0 0 0-124.276363 0v199.912727a262.283636 262.283636 0 0 0 524.334545 0z m204.8-62.138182a62.370909 62.370909 0 0 0-62.138182 62.138182v400.058182a62.138182 62.138182 0 0 0 124.276364 0V314.88a62.138182 62.138182 0 0 0-62.138182-62.138182z" />
                                        ) : (
                                          <path d="M326.857143 799.428571l-28.571429 28.571429q-5.714286 5.714286-13.142857 5.714286t-13.142857-5.714286L5.714286 561.714286q-5.714286-5.714286-5.714286-13.142857t5.714286-13.142858l266.285714-266.285714q5.714286-5.714286 13.142857-5.714286t13.142857 5.714286l28.571429 28.571429q5.714286 5.714286 5.714286 13.142857t-5.714286 13.142857L102.285714 548.571429l224.571429 224.571428q5.714286 5.714286 5.714286 13.142857t-5.714286 13.142857z m337.714286-609.714285L451.428571 927.428571q-2.285714 7.428571-8.857142 11.142858T429.142857 940l-35.428571-9.714286q-7.428571-2.285714-11.142857-8.857143T381.142857 907.428571l213.142857-737.714285q2.285714-7.428571 8.857143-11.142857t13.428572-1.428572l35.428571 9.714286q7.428571 2.285714 11.142857 8.857143t1.428572 14z m375.428571 372l-266.285714 266.285714q-5.714286 5.714286-13.142857 5.714286t-13.142858-5.714286l-28.571428-28.571429q-5.714286-5.714286-5.714286-13.142857t5.714286-13.142857l224.571428-224.571428-224.571428-224.571429q-5.714286-5.714286-5.714286-13.142857t5.714286-13.142857l28.571428-28.571429q5.714286-5.714286 13.142858-5.714286t13.142857 5.714286l266.285714 266.285714q5.714286 5.714286 5.714286 13.142858t-5.714286 13.142857z" />
                                        )}
                                      </svg> */}
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        className="svg-icon source-icon"
                                        // style={{ display: metricList.length < 2 ? 'none' : 'flex' }}
                                        onClick={() => this.handleSetMetricDisplay(index)}>
                                        {
                                          item.display
                                            ? <path d="M21.92,11.6C19.9,6.91,16.1,4,12,4S4.1,6.91,2.08,11.6a1,1,0,0,0,0,.8C4.1,17.09,7.9,20,12,20s7.9-2.91,9.92-7.6A1,1,0,0,0,21.92,11.6ZM12,18c-3.17,0-6.17-2.29-7.9-6C5.83,8.29,8.83,6,12,6s6.17,2.29,7.9,6C18.17,15.71,15.17,18,12,18ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z"></path>
                                            : <path d="M10.94,6.08A6.93,6.93,0,0,1,12,6c3.18,0,6.17,2.29,7.91,6a15.23,15.23,0,0,1-.9,1.64,1,1,0,0,0-.16.55,1,1,0,0,0,1.86.5,15.77,15.77,0,0,0,1.21-2.3,1,1,0,0,0,0-.79C19.9,6.91,16.1,4,12,4a7.77,7.77,0,0,0-1.4.12,1,1,0,1,0,.34,2ZM3.71,2.29A1,1,0,0,0,2.29,3.71L5.39,6.8a14.62,14.62,0,0,0-3.31,4.8,1,1,0,0,0,0,.8C4.1,17.09,7.9,20,12,20a9.26,9.26,0,0,0,5.05-1.54l3.24,3.25a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42Zm6.36,9.19,2.45,2.45A1.81,1.81,0,0,1,12,14a2,2,0,0,1-2-2A1.81,1.81,0,0,1,10.07,11.48ZM12,18c-3.18,0-6.17-2.29-7.9-6A12.09,12.09,0,0,1,6.8,8.21L8.57,10A4,4,0,0,0,14,15.43L15.59,17A7.24,7.24,0,0,1,12,18Z"></path>
                                        }
                                      </svg>
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        className="svg-icon source-icon"
                                        // style={{ display: metricList.length < 2 ? 'none' : 'flex' }}
                                        onClick={() => this.handleCopyMetric(index)}>
                                        <path d="M21,8.94a1.31,1.31,0,0,0-.06-.27l0-.09a1.07,1.07,0,0,0-.19-.28h0l-6-6h0a1.07,1.07,0,0,0-.28-.19.32.32,0,0,0-.09,0A.88.88,0,0,0,14.05,2H10A3,3,0,0,0,7,5V6H6A3,3,0,0,0,3,9V19a3,3,0,0,0,3,3h8a3,3,0,0,0,3-3V18h1a3,3,0,0,0,3-3V9S21,9,21,8.94ZM15,5.41,17.59,8H16a1,1,0,0,1-1-1ZM15,19a1,1,0,0,1-1,1H6a1,1,0,0,1-1-1V9A1,1,0,0,1,6,8H7v7a3,3,0,0,0,3,3h5Zm4-4a1,1,0,0,1-1,1H10a1,1,0,0,1-1-1V5a1,1,0,0,1,1-1h3V7a3,3,0,0,0,3,3h3Z"></path>
                                      </svg>
                                      <svg
                                        onClick={() => this.handleDeleteMetric(index)}
                                        className="svg-icon delete-icon"
                                        viewBox="0 0 1024 1024"
                                        width="200"
                                        height="200"
                                      >
                                        <path d="M799.2 874.4c0 34.4-28.001 62.4-62.4 62.4H287.2c-34.4 0-62.4-28-62.4-62.4V212h574.4v662.4zM349.6 100c0-7.2 5.6-12.8 12.8-12.8h300c7.2 0 12.8 5.6 12.8 12.8v37.6H349.6V100z m636.8 37.6H749.6V100c0-48.001-39.2-87.2-87.2-87.2h-300c-48 0-87.2 39.199-87.2 87.2v37.6H37.6C16.8 137.6 0 154.4 0 175.2s16.8 37.6 37.6 37.6h112v661.6c0 76 61.6 137.6 137.6 137.6h449.6c76 0 137.6-61.6 137.6-137.6V212h112c20.8 0 37.6-16.8 37.6-37.6s-16.8-36.8-37.6-36.8zM512 824c20.8 0 37.6-16.8 37.6-37.6v-400c0-20.8-16.8-37.6-37.6-37.6s-37.6 16.8-37.6 37.6v400c0 20.8 16.8 37.6 37.6 37.6m-175.2 0c20.8 0 37.6-16.8 37.6-37.6v-400c0-20.8-16.8-37.6-37.6-37.6s-37.6 16.8-37.6 37.6v400c0.8 20.8 17.6 37.6 37.6 37.6m350.4 0c20.8 0 37.6-16.8 37.6-37.6v-400c0-20.8-16.8-37.6-37.6-37.6s-37.6 16.8-37.6 37.6v400c0 20.8 16.8 37.6 37.6 37.6" />
                                      </svg>
                                    </div>
                                  )
                                  : undefined
                              }
                            </div>
                          ))
                        }
                        {
                          this.expressionListComp(language)
                        }
                      </>
                    )
                    : (
                      <>
                        <PromqlEditor
                          value={source}
                          style={{ minHeight: '68px', borderColor: editorStatus === 'error' ? '#ea3636' : '#dcdee5' }}
                          verifiy={true}
                          onBlur={this.handleSourceBlur}
                          executeQuery={this.handleSourceBlur}
                        />
                        {/* <div>
                          <EditorForm title={getEnByName('别名', language)}>
                            <AliasInput style={{ width: '288px', height: '32px' }} inputProps={{ defaultValue: promqlAlias }} onChange={this.handleAllAliasChange} />
                            <EditorForm title={getEnByName('Step', language)}>
                              <AliasInput style={{ width: '88px' }} inputProps={{ defaultValue: step, placeholder: 'auto' }} onChange={this.handleProStepChange} />
                            </EditorForm>
                          </EditorForm>
                        </div> */}
                      </>
                    )
                }
                {mode !== 'code' && metricList.some(item => item.metricMetaId) ? (
                  <EditorForm
                    title={getEnByName('目标', language)}
                    style={{ marginLeft: metricList.length > 1 && mode === 'ui' ? '34px' : '0px' }}
                    tips={getEnByName('维度中有目标IP和云区域ID才会生效', language)}
                  >
                    <TargetInput
                      datasource={this.props.datasource}
                      cluster={cluster}
                      module={module}
                      host={host}
                      targetType={targetType}
                      onChange={this.handleTargetChange}
                    />
                  </EditorForm>
                ) : undefined}
                {
                  mode !== 'code' && metricList.some(item => item.metric_field) ? (
                    <>
                      {
                        <Button
                          className="add-metric"
                          type="default"
                          icon={<PlusOutlined />}
                          style={{ marginLeft: metricList.length > 1 && mode === 'ui' ? '34px' : '0px' }}
                          onClick={this.handleAddEmptyMetric}
                        >
                          {getEnByName('多指标', language)}
                        </Button>
                      }
                      {
                        <Button
                          className="add-metric"
                          type="default"
                          icon={<PlusOutlined />}
                          style={{ marginLeft: '10px' }}
                          onClick={this.handleAddExpression}
                        >
                          {getEnByName('表达式', language)}
                        </Button>
                      }
                      {/* <Button
                        className="add-metric"
                        type="default"
                        style={{ marginLeft: '10px', display: 'none' }}
                        onClick={this.handleTransformMode}
                      >
                        {getEnByName(mode === 'code' ? 'UI' : 'Source', language)}
                      </Button> */}
                    </>
                  ) : undefined
                }
                {
                  <AddvanceSetting
                    mode={mode}
                    step={step}
                    promqlAlias={promqlAlias}
                    format={this.state.format}
                    type={this.state.type}
                    onChange={this.addvanceSettingChange}
                  />
                }
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
