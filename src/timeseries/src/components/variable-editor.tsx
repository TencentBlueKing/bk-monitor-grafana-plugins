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
import Select from 'antd/es/select';
import Spin from 'antd/es/spin';
import React from 'react';

import Datasource from '../datasource/datasource';
import { EditorStatus, ICommonItem, IConditionItem, IMetric, MetricDetail } from '../typings/metric';
import { K8sVariableQueryType, ScenarioType, VariableQuery, VariableQueryType } from '../typings/variable';
// import { CascaderOptionType } from 'antd/es/cascader';
import { handleTransformOldVariableQuery } from '../utils/common';
import { LanguageContext } from '../utils/context';
import { getCookie, getEnByName } from '../utils/utils';
import ConditionIput from './condition-input';
import DimensionInput from './dimension-input';
import MetricInput from './metirc-input';
import PromqlEditor from './promql-editor';
import VariableLine from './variable-line';
interface IVariableEditorProps {
  datasource: Datasource;
  onChange: (query: VariableQuery, definition?: string) => void;
  query?: VariableQuery;
}
interface IVariableEditorState {
  condition: IConditionItem[];
  editorStatus: EditorStatus;
  fieldList: ICommonItem[];
  language: string;
  loading: boolean;
  metricDetail: MetricDetail;
  promql: string;
  queryType: K8sVariableQueryType | VariableQueryType;
  scenario: ScenarioType;
  showField: string | undefined;
  valueField: string | undefined;
}
const language = getCookie('blueking_language')!;
export default class VariableQueryEditor extends React.PureComponent<IVariableEditorProps, IVariableEditorState> {
  // k8s列表
  k8sTypes: { label: string; value: string }[] = [
    { label: K8sVariableQueryType.Cluster, value: K8sVariableQueryType.Cluster },
    { label: K8sVariableQueryType.Container, value: K8sVariableQueryType.Container },
    { label: K8sVariableQueryType.Namespace, value: K8sVariableQueryType.Namespace },
    { label: K8sVariableQueryType.Node, value: K8sVariableQueryType.Node },
    { label: K8sVariableQueryType.Pod, value: K8sVariableQueryType.Pod },
    { label: K8sVariableQueryType.Service, value: K8sVariableQueryType.Service },
  ];
  // 主机列表
  queryTypes: { label: string; value: string }[] = [
    { label: getEnByName('主机', language), value: VariableQueryType.Host },
    { label: getEnByName('模块', language), value: VariableQueryType.Module },
    { label: getEnByName('集群', language), value: VariableQueryType.Set },
    { label: getEnByName('服务实例', language), value: VariableQueryType.ServiceInstance },
    { label: getEnByName('维度', language), value: VariableQueryType.Dimension },
    { label: 'prometheus', value: VariableQueryType.Promql },
  ];
  // 场景列表
  scenarioList: { label: string; value: string }[] = [
    { label: getEnByName('主机监控', language), value: ScenarioType.OS },
    { label: getEnByName('Kubernetes', language), value: ScenarioType.Kubernetes },
  ];
  constructor(props) {
    super(props);
    let { query } = props;
    if (query?.conditions || query?.dimensionData) {
      query = handleTransformOldVariableQuery(query);
    }
    const { promql = '', queryType = VariableQueryType.Host, scenario, showField, valueField, where } = query;
    const condition = (where?.length ? where : [{} as any]).slice();
    if (condition[condition.length - 1]?.key) {
      condition.push({} as any);
    }
    const isPromql = queryType === VariableQueryType.Promql;
    // if (!isPromql) {
    //   this.queryTypes = this.queryTypes.filter(item => item.value !== VariableQueryType.Promql);
    // }
    this.state = {
      condition,
      editorStatus: 'default',
      fieldList: [],
      language,
      loading: !isPromql,
      metricDetail: {} as any,
      promql,
      queryType: queryType || VariableQueryType.Host,
      // 场景 默认 os
      scenario: scenario || ScenarioType.OS,
      showField,
      valueField,
    };
    this.initstate(query);
  }
  handleConditionChange = async (condition: IConditionItem[], needQuery = true) => {
    this.setState(
      {
        condition,
      },
      needQuery ? this.handleQuery : undefined,
    );
  };
  handleDimensionChange = (dimensions: string[]) => {
    const { metricDetail } = this.state;
    metricDetail.agg_dimension = dimensions;
    this.setState(
      {
        metricDetail: new MetricDetail(metricDetail),
      },
      this.handleQuery,
    );
  };
  handleDimensionConditionChange = async (condition: IConditionItem[], needQuery = true) => {
    const { metricDetail } = this.state;
    metricDetail.agg_condition = condition;
    this.setState(
      {
        metricDetail: new MetricDetail(metricDetail),
      },
      needQuery ? this.handleQuery : undefined,
    );
  };
  handleMetricChange = async (metric: IMetric | null) => {
    if (metric?.metric_id) {
      metric.agg_dimension = metric.default_dimensions?.slice?.(0, 1) || [metric.dimensions?.slice?.(0, 1)?.[0].id];
      this.setState(
        {
          metricDetail: new MetricDetail(metric),
        },
        this.handleQuery,
      );
    } else {
      // 清空当前指标
      this.handleDeleteMetric();
    }
  };
  handleQueryTypeChange = async (v: K8sVariableQueryType | VariableQueryType) => {
    if (v !== VariableQueryType.Dimension) {
      const needLoading = v !== VariableQueryType.Promql;
      this.setState(
        {
          condition: [{} as any],
          loading: needLoading,
          promql: '',
          queryType: v,
          showField: undefined,
          valueField: undefined,
        },
        !needLoading ? undefined : this.handleQuery,
      );
      needLoading && this.handleGetFiledList(v);
    } else {
      this.setState({ queryType: v }, this.handleQuery);
    }
  };
  handleScenarioChange = async (v: ScenarioType) => {
    this.setState({ scenario: v }, () => {
      this.handleQueryTypeChange(v === ScenarioType.Kubernetes ? K8sVariableQueryType.Cluster : VariableQueryType.Host);
    });
  };
  handleShowFieldChange = async (v: string) => {
    this.setState(
      {
        showField: v,
      },
      this.state.valueField ? this.handleQuery : undefined,
    );
  };
  handleSourceBlur = async (v: string, hasError = false) => {
    if (v.length) {
      if (!hasError) {
        this.setState(
          {
            promql: v,
          },
          this.handleQuery,
        );
      } else {
        this.setState({ editorStatus: 'error' });
      }
    }
  };
  handleValueFieldChange = async (v: string) => {
    this.setState(
      {
        valueField: v,
      },
      this.state.showField ? this.handleQuery : undefined,
    );
  };
  handleDeleteMetric() {
    this.setState(
      {
        metricDetail: {} as any,
      },
      this.handleQuery,
    );
  }
  async handleGetFiledList(v: K8sVariableQueryType | VariableQueryType) {
    const data = await this.props.datasource.getVariableField(v, this.state.scenario);
    const fieldList = data?.map(item => ({ id: item.bk_property_id, name: item.bk_property_name }));
    this.setState({ fieldList, loading: false });
  }
  handleGetVariables(conditions: IConditionItem[]): string {
    const variableRegex = /\$(\w+)|\[\[([\s\S]+?)(?::(\w+))?\]\]|\${(\w+)(?:\.([^:^}]+))?(?::(\w+))?}/g;
    const variables = new Set();
    conditions?.forEach(item => {
      item?.value?.forEach?.(val => {
        const matches = val.match(variableRegex);
        matches && variables.add(matches);
      });
    });
    return Array.from(variables).join(' ');
  }
  /**
   * @description: query graph data
   * @param {*}
   * @return {*}
   */
  handleQuery() {
    const { condition, promql, queryType, scenario, showField, valueField } = this.state;
    const name = [...this.queryTypes, ...this.k8sTypes].find(item => item.value === queryType)?.label;
    const definition = `- Blueking Monitor - ${name}`;
    if (queryType !== VariableQueryType.Dimension) {
      let data = {};
      if (queryType === VariableQueryType.Promql) {
        data = {
          promql,
          queryType,
        };
      } else if (showField && valueField) {
        data = {
          queryType,
          scenario,
          showField,
          valueField,
          variables: this.handleGetVariables(condition),
          where: condition.filter(item => item.key),
        };
      }
      this.props.onChange(data, definition);
    } else {
      const {
        agg_condition,
        agg_dimension,
        data_label,
        data_source_label,
        data_type_label,
        metric_field,
        result_table_id,
        result_table_label,
      } = this.state.metricDetail;
      this.props.onChange(
        metric_field && agg_dimension?.length
          ? {
              metricConfig: {
                data_label,
                data_source_label,
                data_type_label,
                group_by: agg_dimension,
                metric_field,
                result_table_id,
                result_table_label,
                where: agg_condition.filter(item => item.key),
              },
              queryType,
              variables: this.handleGetVariables(agg_condition),
            }
          : {},
        definition,
      );
    }
  }
  /**
   * @description: init state
   * @param {VariableQuery} query
   * @return {*}
   */
  async initstate(query: VariableQuery) {
    const { metricConfig: item, queryType = VariableQueryType.Host } = query;
    if (queryType === VariableQueryType.Promql) return;
    if (queryType === VariableQueryType.Dimension && item) {
      const {
        data_label,
        data_source_label,
        data_type_label,
        group_by,
        metric_field,
        result_table_id,
        result_table_label,
        where,
      } = item;
      const data: IMetric[] = await this.props.datasource
        .getMetricDetailById({
          conditions: {
            data_label,
            data_source_label,
            data_type_label,
            metric_field,
            result_table_id,
          },
          flat_format: true,
          result_table_label,
        })
        .catch(() => []);
      const metric = data.find(
        metric =>
          metric_field === metric.metric_field &&
          ((data_label && data_label === metric.data_label) || result_table_id === metric.result_table_id),
      );
      this.setState({
        loading: false,
        metricDetail: new MetricDetail({ ...metric, agg_condition: where, agg_dimension: group_by }),
      });
    } else {
      this.handleGetFiledList(queryType);
    }
  }
  render() {
    const {
      condition,
      editorStatus,
      fieldList,
      language,
      loading,
      metricDetail,
      promql,
      queryType,
      scenario,
      showField,
      valueField,
    } = this.state;
    const fakerMetric: any = { agg_condition: condition, dimensions: fieldList };
    return (
      <LanguageContext.Provider value={{ language }}>
        <div className='variable-editor'>
          <Spin spinning={loading}>
            <VariableLine title={getEnByName('场景', language)}>
              <Select
                className='common-select'
                defaultValue={scenario}
                onChange={this.handleScenarioChange}
              >
                {this.scenarioList.map(item => (
                  <Select.Option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </VariableLine>
            <VariableLine title={getEnByName('类型', language)}>
              <Select
                className='common-select'
                value={queryType}
                onChange={v => this.handleQueryTypeChange(v)}
              >
                {(scenario === ScenarioType.Kubernetes ? this.k8sTypes : this.queryTypes).map(item => (
                  <Select.Option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </VariableLine>
            {queryType === VariableQueryType.Promql ? (
              <div>
                <PromqlEditor
                  style={{ borderColor: editorStatus === 'error' ? '#ea3636' : '#dcdee5', minHeight: '120px' }}
                  executeQuery={this.handleSourceBlur}
                  value={promql}
                  verifiy={false}
                  onBlur={this.handleSourceBlur}
                />
              </div>
            ) : (
              <>
                {queryType !== VariableQueryType.Dimension ? (
                  <>
                    <VariableLine title={getEnByName('展示字段', language)}>
                      <Select
                        className='common-select'
                        optionFilterProp={'children'}
                        placeholder={getEnByName('请选择展示字段', language)}
                        value={showField}
                        showSearch
                        onChange={this.handleShowFieldChange}
                      >
                        {fieldList.map(item => (
                          <Select.Option
                            key={item.id}
                            value={item.id}
                          >
                            {item.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </VariableLine>
                    <VariableLine title={getEnByName('值字段', language)}>
                      <Select
                        className='common-select'
                        optionFilterProp={'children'}
                        placeholder={getEnByName('请选择值字段', language)}
                        value={valueField}
                        showSearch
                        onChange={this.handleValueFieldChange}
                      >
                        {fieldList.map(item => (
                          <Select.Option
                            key={item.id}
                            value={item.id}
                          >
                            {item.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </VariableLine>
                    <VariableLine title={getEnByName('条件', language)}>
                      <ConditionIput
                        metric={fakerMetric}
                        onChange={this.handleConditionChange}
                      />
                    </VariableLine>
                  </>
                ) : (
                  <>
                    <VariableLine title={getEnByName('指标选择', language)}>
                      <MetricInput
                        datasource={this.props.datasource}
                        metric={metricDetail}
                        onMetricChange={this.handleMetricChange}
                      />
                    </VariableLine>
                    {metricDetail?.metricMetaId ? (
                      <>
                        <VariableLine title={getEnByName('维度', language)}>
                          <DimensionInput
                            metric={metricDetail}
                            variableQuery={true}
                            onDimensionChange={this.handleDimensionChange}
                          />
                        </VariableLine>
                        <VariableLine title={getEnByName('条件', language)}>
                          <ConditionIput
                            datasource={this.props.datasource}
                            metric={metricDetail}
                            onChange={this.handleDimensionConditionChange}
                          />
                        </VariableLine>
                      </>
                    ) : undefined}
                  </>
                )}
              </>
            )}
          </Spin>
        </div>
      </LanguageContext.Provider>
    );
  }
}
