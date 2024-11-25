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
import { ICommonItem, IConditionItem, MetricType, IDataItem } from '../typings/metric';
import { VariableQueryType, VariableQuery } from '../typings/variable';
import { LanguageContext } from '../utils/context';
// import { CascaderOptionType } from 'antd/es/cascader';
import { getCookie, t } from '../utils/utils';
import AliasInput from './alias-input';
import ConditionIput from './condition-input';
import DataInput from './data-input';
import DimensionInput from './dimension-input';
import TypeInput from './type-iput';
import VariableLine from './variable-line';
interface IVariableEditorProps {
  datasource: Datasource;
  query?: VariableQuery;
  onChange: (query: VariableQuery, definition?: string) => void;
}
interface IDimensionData {
  typeId: MetricType;
  dataId: string;
  dataList: IDataItem[];
  dimension: string[];
  condition: IConditionItem[];
  queryString: string;
}
interface IVariableEditorState {
  queryType: VariableQueryType;
  loading: boolean;
  fieldList: ICommonItem[];
  showField: string | undefined;
  valueField: string | undefined;
  condition: IConditionItem[];
  language: string;
  dimensionData: IDimensionData;
}
const language = getCookie('blueking_language');
export default class VariableQueryEditor extends React.PureComponent<IVariableEditorProps, IVariableEditorState> {
  queryTypes: { value: string; label: string }[] = [
    { value: VariableQueryType.Host, label: t('主机', language) },
    { value: VariableQueryType.Module, label: t('模块', language) },
    { value: VariableQueryType.Set, label: t('集群', language) },
    { value: VariableQueryType.ServiceInstance, label: t('服务实例', language) },
    { value: VariableQueryType.Dimension, label: t('维度', language) },
  ];
  constructor(props) {
    super(props);
    const { query } = props;
    const { queryType = VariableQueryType.Host, where, showField, valueField } = query;
    const condition = where?.length ? where : ([{}] as any);
    if (condition[condition.length - 1]?.key) {
      condition.push({} as any);
    }
    this.state = {
      loading: true,
      queryType: queryType || VariableQueryType.Host,
      showField,
      valueField,
      fieldList: [],
      condition,
      language,
      dimensionData: this.getDefaultDimensionData(),
    };
    this.initstate(query);
  }
  get curData() {
    return (
      this.state.dimensionData.dataList?.find?.(item => item.id === this.state.dimensionData.dataId) || {
        metrics: [],
        dimensions: [],
        time_field: '',
      }
    );
  }
  /**
   * @description: 初始化state
   * @param {VariableQuery} query
   * @return {*}
   */
  async initstate(query: VariableQuery) {
    const { queryType = VariableQueryType.Host, dimensionConfig } = query;
    if (queryType === VariableQueryType.Dimension) {
      if (dimensionConfig) {
        const { data_source_label, data_type_label, group_by, where, query_string, result_table_id } = dimensionConfig;
        const dataList: IDataItem[] = await this.props.datasource.getDataSourceConfig({
          data_source_label,
          data_type_label,
        });
        const condition = (where?.length ? where : ([{}] as any)).slice();
        if (condition[condition.length - 1]?.key) {
          condition.push({} as any);
        }
        this.setState({
          loading: false,
          dimensionData: {
            typeId: `${data_source_label}|${data_type_label}` as MetricType,
            dataList,
            dimension: group_by,
            condition,
            dataId: result_table_id,
            queryString: query_string,
          },
        });
      } else {
        this.handleDataTypeChange('bk_monitor|log', false);
      }
    } else {
      this.handleGetFiledList(queryType);
    }
  }
  getDefaultDimensionData(): IDimensionData {
    return {
      typeId: 'bk_monitor|log',
      dataId: '',
      dataList: [],
      dimension: [],
      condition: [{}] as any,
      queryString: '',
    };
  }
  handleQuery() {
    const { queryType, showField, valueField, condition } = this.state;
    const name = this.queryTypes.find(item => item.value === queryType)?.label;
    const definition = `- Blueking Monitor - ${name}`;
    if (queryType !== VariableQueryType.Dimension) {
      this.props.onChange(
        showField && valueField
          ? {
              queryType,
              showField,
              valueField,
              where: condition.filter(item => item.key),
              variables: this.handleGetVariables(condition),
            }
          : {},
        definition,
      );
    } else {
      const { typeId, dataId, dimension, condition, queryString } = this.state.dimensionData;
      const [data_source_label, data_type_label] = typeId.split('|');
      this.props.onChange(
        dimension?.length
          ? {
              queryType,
              variables: this.handleGetVariables(condition),
              dimensionConfig: {
                data_source_label,
                data_type_label,
                result_table_id: dataId,
                where: condition.filter(item => item.key),
                group_by: dimension,
                query_string: queryString,
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
    conditions?.forEach(item => {
      item?.value?.forEach?.(val => {
        const matches = val.match(variableRegex);
        matches && variables.add(matches);
      });
    });
    return Array.from(variables).join(' ');
  }
  handleQueryTypeChange = async (v: VariableQueryType) => {
    if (v !== VariableQueryType.Dimension) {
      this.setState(
        {
          queryType: v,
          loading: true,
          showField: undefined,
          valueField: undefined,
          condition: [{} as any],
        },
        this.handleQuery,
      );
      this.handleGetFiledList(v);
    } else {
      await this.handleDataTypeChange(this.state.dimensionData.typeId || 'bk_monitor|log', false);
      this.setState(
        {
          queryType: v,
          dimensionData: {
            ...this.state.dimensionData,
            typeId: this.state.dimensionData.typeId || 'bk_monitor|log',
          },
        },
        this.handleQuery,
      );
    }
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
  handleDimensionChange = (dimension: string[]) => {
    this.setState({ dimensionData: { ...this.state.dimensionData, dimension } }, this.handleQuery);
  };
  handleDimensionConditionChange = async (condition: IConditionItem[], needQuery = true) => {
    this.setState({ dimensionData: { ...this.state.dimensionData, condition } }, () => {
      needQuery && this.handleQuery();
    });
  };
  /**
   * @description: 数据类型变更时触发
   * @param {MetricType} typeId 数据类型id
   * @return {*}
   */
  handleDataTypeChange = async (typeId: MetricType, needQuery = true) => {
    this.setState({ loading: true });
    await new Promise(async resolve => {
      const [data_source_label, data_type_label] = typeId.split('|');
      const dataList: IDataItem[] = await this.props.datasource.getDataSourceConfig({
        data_source_label,
        data_type_label,
      });
      this.setState(
        {
          dimensionData: {
            ...this.state.dimensionData,
            typeId,
            dataId: dataList[0]?.id || '',
            dataList,
          },
        },
        () => {
          this.setState(
            {
              loading: false,
              dimensionData: {
                ...this.state.dimensionData,
                dimension: this.curData.dimensions.length ? [this.curData.dimensions[0].id] : [],
                condition: [{}] as any,
              },
            },
            () => {
              needQuery && this.handleQuery();
              resolve(undefined);
            },
          );
        },
      );
    });
  };
  /**
   * @description: 数据id变更时触发
   * @param {MetricType} dataId 数据id
   * @return {*}
   */
  handleDataIdChage = async (dataId: MetricType) => {
    this.setState({ dimensionData: { ...this.state.dimensionData, dataId } }, this.handleQuery);
  };
  handleQueryStringChange = async (queryString: string) => {
    this.setState({ dimensionData: { ...this.state.dimensionData, queryString } }, this.handleQuery);
  };
  async handleGetFiledList(v: VariableQueryType) {
    const data = await this.props.datasource.getVariableField(v);
    const fieldList = data?.map(item => ({ id: item.bk_property_id, name: item.bk_property_name }));
    this.setState({ loading: false, fieldList });
  }
  getDimensionValue = async (v: string): Promise<Record<string, ICommonItem[]>> => {
    let list = [];
    if (!v) return {};
    const { dataId, typeId } = this.state.dimensionData;
    const [data_source_label, data_type_label] = typeId.split('|');
    list = await this.props.datasource.getNewDimensionValue({
      resultTableId: dataId,
      metricField: process.env.NODE_ENV === 'development' ? this.curData.metrics[0]?.id : '_index',
      dataSourceLabel: data_source_label,
      dataTypeLabel: data_type_label,
      field: v,
    });
    return { [v]: list || [] };
  };
  render() {
    const {
      queryType,
      showField,
      fieldList,
      valueField,
      condition,
      loading,
      language,
      dimensionData: { typeId, dataId, dataList, queryString, dimension, condition: dimCondition },
    } = this.state;
    const dimensionList = this.curData.dimensions;
    return (
      <LanguageContext.Provider value={{ language }}>
        <div className='event-variable-editor'>
          <Spin spinning={loading}>
            <VariableLine title={t('类型', language)}>
              <Select
                className='common-select'
                defaultValue={queryType}
                onChange={this.handleQueryTypeChange}
              >
                {this.queryTypes.map(item => (
                  <Select.Option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </VariableLine>
            {queryType !== VariableQueryType.Dimension ? (
              <>
                <VariableLine title={t('展示字段', language)}>
                  <Select
                    className='common-select'
                    optionFilterProp={'children'}
                    placeholder={t('请选择展示字段', language)}
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
                <VariableLine title={t('值字段', language)}>
                  <Select
                    className='common-select'
                    optionFilterProp={'children'}
                    placeholder={t('请选择值字段', language)}
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
                <VariableLine title={t('条件', language)}>
                  <ConditionIput
                    condition={condition}
                    dimensionList={fieldList}
                    onChange={this.handleConditionChange}
                  />
                </VariableLine>
              </>
            ) : (
              <>
                <VariableLine title={t('数据类型', language)}>
                  <TypeInput
                    value={typeId}
                    onChange={this.handleDataTypeChange}
                  />
                </VariableLine>
                <VariableLine title={t('数据名称', language)}>
                  <DataInput
                    list={dataList}
                    value={dataId}
                    onChange={this.handleDataIdChage}
                  />
                </VariableLine>
                {dataId ? (
                  <>
                    <VariableLine title={t('Query string', language)}>
                      <AliasInput
                        style={{ minWidth: '100%', flex: 1 }}
                        value={queryString}
                        onChange={this.handleQueryStringChange}
                      />
                    </VariableLine>
                    <VariableLine title={t('维度', language)}>
                      <DimensionInput
                        dimension={dimension}
                        dimensionList={dimensionList}
                        variableQuery={true}
                        onDimensionChange={this.handleDimensionChange}
                      />
                    </VariableLine>
                    <VariableLine title={t('条件', language)}>
                      <ConditionIput
                        condition={dimCondition}
                        dimensionList={dimensionList}
                        getDimensionValue={this.getDimensionValue}
                        onChange={this.handleDimensionConditionChange}
                      />
                    </VariableLine>
                  </>
                ) : undefined}
              </>
            )}
          </Spin>
        </div>
      </LanguageContext.Provider>
    );
  }
}
