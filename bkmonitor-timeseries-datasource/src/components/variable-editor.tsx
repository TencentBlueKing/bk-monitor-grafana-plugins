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
import VariableLine from './variable-line';
import Select from 'antd/es/select';
import ConditionIput from './condition-input';
import MetricInput from './metirc-input';
import DimensionInput from './dimension-input';
import PromqlEditor from './promql-editor';
import { VariableQueryType, VariableQuery, K8sVariableQueryType, ScenarioType } from '../typings/variable';
import Spin from 'antd/es/spin';
import { EditorStatus, ICommonItem, IConditionItem, IMetric, MetricDetail } from '../typings/metric';
import Datasource from '../datasource/datasource';
// import { CascaderOptionType } from 'antd/es/cascader';
import { handleTransformOldVariableQuery } from '../utils/common';
import { getCookie, getEnByName } from '../utils/utils';
import { LanguageContext } from '../utils/context';
interface IVariableEditorProps {
  datasource: Datasource;
  query?: VariableQuery;
  onChange: (query: VariableQuery, definition?: string) => void;
}
interface IVariableEditorState {
  queryType: VariableQueryType | K8sVariableQueryType;
  scenario: ScenarioType;
  loading: boolean;
  fieldList: ICommonItem[];
  showField: string | undefined;
  valueField: string | undefined;
  condition: IConditionItem[];
  metricDetail: MetricDetail;
  language: string;
  promql: string;
  editorStatus: EditorStatus;
}
const language = getCookie('blueking_language');
export default class VariableQueryEditor extends React.PureComponent<IVariableEditorProps, IVariableEditorState> {
  // 主机列表
  queryTypes: { value: string; label: string }[] = [
    { value: VariableQueryType.Host, label: getEnByName('主机', language) },
    { value: VariableQueryType.Module, label: getEnByName('模块', language) },
    { value: VariableQueryType.Set, label: getEnByName('集群', language) },
    { value: VariableQueryType.ServiceInstance, label: getEnByName('服务实例', language) },
    { value: VariableQueryType.Dimension, label: getEnByName('维度', language) },
    { value: VariableQueryType.Promql, label: 'prometheus' },
  ];
  // k8s列表
  k8sTypes: { value: string; label: string }[] = [
    { value: K8sVariableQueryType.Cluster, label: K8sVariableQueryType.Cluster },
    { value: K8sVariableQueryType.Container, label: K8sVariableQueryType.Container },
    { value: K8sVariableQueryType.Namespace, label: K8sVariableQueryType.Namespace },
    { value: K8sVariableQueryType.Node, label: K8sVariableQueryType.Node },
    { value: K8sVariableQueryType.Pod, label: K8sVariableQueryType.Pod },
    { value: K8sVariableQueryType.Service, label: K8sVariableQueryType.Service },
  ];
  // 场景列表
  scenarioList: { value: string; label: string }[] = [
    { value: ScenarioType.OS, label: getEnByName('主机监控', language) },
    { value: ScenarioType.Kubernetes, label: getEnByName('Kubernetes', language) },
  ];
  constructor(props) {
    super(props);
    let { query } = props;
    if (query?.conditions || query?.dimensionData) {
      query = handleTransformOldVariableQuery(query);
    }
    const { queryType = VariableQueryType.Host, where, showField, valueField, promql = '', scenario } = query;
    const condition = (where?.length ? where : [{} as any]).slice();
    if (condition[condition.length - 1]?.key) {
      condition.push({} as any);
    }
    const isPromql = queryType === VariableQueryType.Promql;
    // if (!isPromql) {
    //   this.queryTypes = this.queryTypes.filter(item => item.value !== VariableQueryType.Promql);
    // }
    this.state = {
      loading: !isPromql,
      queryType: queryType || VariableQueryType.Host,
      // 场景 默认 os
      scenario: scenario || ScenarioType.OS,
      showField,
      valueField,
      fieldList: [],
      condition,
      metricDetail: {} as any,
      language,
      promql,
      editorStatus: 'default',
    };
    this.initstate(query);
  }
  /**
   * @description: init state
   * @param {VariableQuery} query
   * @return {*}
   */
  async initstate(query: VariableQuery) {
    const { queryType = VariableQueryType.Host, metricConfig: item } = query;
    if (queryType === VariableQueryType.Promql) return;
    if (queryType === VariableQueryType.Dimension && item) {
      const { result_table_label, data_source_label, data_type_label,
        result_table_id, metric_field, group_by, where } = item;
      const data: IMetric[] = await this.props.datasource
        .getMetricDetailById({
          result_table_label,
          conditions: {
            data_source_label,
            data_type_label,
            result_table_id,
            metric_field,
          },
          flat_format: true,
        })
        .catch(() => []);
      const metric = data.find(metric => metric_field === metric.metric_field
         && result_table_id === metric.result_table_id);
      this.setState({
        metricDetail: new MetricDetail({ ...metric, agg_dimension: group_by, agg_condition: where }),
        loading: false,
      });
    } else {
      this.handleGetFiledList(queryType);
    }
  }
  /**
   * @description: query graph data
   * @param {*}
   * @return {*}
   */
  handleQuery() {
    const { queryType, showField, valueField, condition, promql, scenario } = this.state;
    const name = [...this.queryTypes, ...this.k8sTypes].find(item => item.value === queryType)?.label;
    const definition = `- Blueking Monitor - ${name}`;
    if (queryType !== VariableQueryType.Dimension) {
      let data =  {};
      if (queryType === VariableQueryType.Promql) {
        data = {
          queryType,
          promql,
        };
      } else if (showField && valueField) {
        data = {
          scenario,
          queryType,
          showField,
          valueField,
          where: condition.filter(item => item.key),
          variables: this.handleGetVariables(condition),
        };
      }
      this.props.onChange(
        data,
        definition,
      );
    } else {
      const {
        data_source_label,
        data_type_label,
        result_table_id,
        result_table_label,
        metric_field,
        agg_condition,
        agg_dimension,
      } = this.state.metricDetail;
      this.props.onChange(
        metric_field && agg_dimension?.length
          ? {
            queryType,
            variables: this.handleGetVariables(agg_condition),
            metricConfig: {
              data_source_label,
              data_type_label,
              result_table_id,
              result_table_label,
              metric_field,
              where: agg_condition.filter(item => item.key),
              group_by: agg_dimension,
            },
          }
          : {},
        definition,
      );
    }
  }
  handleGetVariables(conditions: IConditionItem[]): string {
    const variableRegex = /\$(\w+)|\[\[([\s\S]+?)(?::(\w+))?\]\]|\${(\w+)(?:\.([^:^}]+))?(?::(\w+))?}/g;
    const variables = new Set();
    conditions?.forEach((item) => {
      item?.value?.forEach?.((val) => {
        const matches = val.match(variableRegex);
        matches && variables.add(matches);
      });
    });
    return Array.from(variables).join(' ');
  }
  handleQueryTypeChange = async (v: VariableQueryType | K8sVariableQueryType) => {
    if (v !== VariableQueryType.Dimension) {
      const needLoading = v !== VariableQueryType.Promql;
      this.setState(
        {
          queryType: v,
          loading: needLoading,
          showField: undefined,
          valueField: undefined,
          condition: [{} as any],
          promql: '',
        },
        this.handleQuery,
      );
      needLoading && this.handleGetFiledList(v);
    } else {
      this.setState({ queryType: v }, this.handleQuery);
    }
  };
  handleScenarioChange = async (v: ScenarioType) => {
    this.setState({ scenario: v }, () => {
      this.handleQueryTypeChange(v === ScenarioType.Kubernetes
        ? K8sVariableQueryType.Cluster
        : VariableQueryType.Host);
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
  handleValueFieldChange = async (v: string) => {
    this.setState(
      {
        valueField: v,
      },
      this.state.showField ? this.handleQuery : undefined,
    );
  };
  handleConditionChange = async (condition: IConditionItem[], needQuery = true) => {
    this.setState(
      {
        condition,
      },
      needQuery ? this.handleQuery : undefined,
    );
  };
  handleMetricChange = async (metric: IMetric) => {
    if (metric?.metric_id) {
      metric.agg_dimension = metric.default_dimensions?.slice?.(0, 1) || [
        metric.dimensions?.slice?.(0, 1)?.[0].id,
      ];
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
  handleDeleteMetric() {
    this.setState(
      {
        metricDetail: {} as any,
      },
      this.handleQuery,
    );
  }
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
  async handleGetFiledList(v: VariableQueryType | K8sVariableQueryType) {
    const data = await this.props.datasource.getVariableField(v, this.state.scenario);
    const fieldList = data?.map(item => ({ id: item.bk_property_id, name: item.bk_property_name }));
    this.setState({ loading: false, fieldList });
  }
  handleSourceBlur = async (v: string, hasError = false) => {
    if (v.length) {
      if (!hasError) {
        this.setState({
          promql: v,
        }, this.handleQuery);
      } else {
        this.setState({ editorStatus: 'error' });
      }
    }
  };
  render() {
    const { queryType, scenario, showField, fieldList, valueField, condition, metricDetail, loading,
      language, promql, editorStatus } = this.state;
    const fakerMetric: any = { dimensions: fieldList, agg_condition: condition };
    return (
      <LanguageContext.Provider value={{ language }}>
        <div className="variable-editor">
          <Spin spinning={loading}>
            <VariableLine title={getEnByName('场景', language)}>
              <Select defaultValue={scenario} className="common-select" onChange={this.handleScenarioChange}>
                {this.scenarioList.map(item => (
                  <Select.Option key={item.value} value={item.value}>
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </VariableLine>
            <VariableLine title={getEnByName('类型', language)}>
              <Select value={queryType} className="common-select" onChange={v => this.handleQueryTypeChange(v)}>
                { (scenario === ScenarioType.Kubernetes ? this.k8sTypes : this.queryTypes).map(item => (
                  <Select.Option key={item.value} value={item.value}>
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </VariableLine>
            {
              queryType === VariableQueryType.Promql ? <div>
                <PromqlEditor
                  value={promql}
                  style={{ minHeight: '120px', borderColor: editorStatus === 'error' ? '#ea3636' : '#dcdee5' }}
                  onBlur={this.handleSourceBlur}
                  verifiy={false}
                  executeQuery={this.handleSourceBlur}
                />
              </div>
                : <>
                  {queryType !== VariableQueryType.Dimension ? (
                    <>
                      <VariableLine title={getEnByName('展示字段', language)}>
                        <Select
                          placeholder={getEnByName('请选择展示字段', language)}
                          value={showField}
                          onChange={this.handleShowFieldChange}
                          showSearch
                          optionFilterProp={'children'}
                          className="common-select"
                        >
                          {fieldList.map(item => (
                            <Select.Option key={item.id} value={item.id}>
                              {item.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </VariableLine>
                      <VariableLine title={getEnByName('值字段', language)}>
                        <Select
                          value={valueField}
                          placeholder={getEnByName('请选择值字段', language)}
                          onChange={this.handleValueFieldChange}
                          showSearch
                          optionFilterProp={'children'}
                          className="common-select"
                        >
                          {fieldList.map(item => (
                            <Select.Option key={item.id} value={item.id}>
                              {item.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </VariableLine>
                      <VariableLine title={getEnByName('条件', language)}>
                        <ConditionIput metric={fakerMetric} onChange={this.handleConditionChange} />
                      </VariableLine>
                    </>
                  ) : (
                    <>
                      <VariableLine title={getEnByName('指标选择', language)}>
                        <MetricInput
                          metric={metricDetail}
                          datasource={this.props.datasource}
                          onMetricChange={this.handleMetricChange}
                        />
                      </VariableLine>
                      {metricDetail?.metricMetaId ? (
                        <>
                          <VariableLine title={getEnByName('维度', language)}>
                            <DimensionInput
                              metric={metricDetail}
                              onDimensionChange={this.handleDimensionChange}
                              variableQuery={true}
                            />
                          </VariableLine>
                          <VariableLine title={getEnByName('条件', language)}>
                            <ConditionIput
                              metric={metricDetail}
                              datasource={this.props.datasource}
                              onChange={this.handleDimensionConditionChange}
                            />
                          </VariableLine>
                        </>
                      ) : undefined}
                    </>
                  )}
                </>
            }
          </Spin>
        </div>
      </LanguageContext.Provider>
    );
  }
}
