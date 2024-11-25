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

import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import Divider from 'antd/es/divider';
import Select from 'antd/es/select';
import Tooltip from 'antd/es/tooltip';
import React from 'react';

import {
  type ICommonItem,
  type IConditionItem,
  CONDITION,
  NUMBER_CONDITION_METHOD_LIST,
  STRING_CONDITION_METHOD_LIST,
} from '../typings/metric';
import { LanguageContext } from '../utils/context';
import { t } from 'common/utils/utils';
const { Option } = Select;
export interface IProps {
  dimensionList: ICommonItem[];
  condition: IConditionItem[];
  getDimensionValue?: (v: string) => Promise<Record<string, ICommonItem[]>>;
  onChange: (v: IConditionItem[], needQuery?: boolean) => void;
}
interface IState {
  dimensionValueMap: Record<string, ICommonItem[]>;
}
export default class ConditionInput extends React.PureComponent<IProps, IState> {
  constructor(props, context) {
    super(props, context);
    this.state = {
      dimensionValueMap: {},
    };
    this.initDimensionValueMap();
  }
  async initDimensionValueMap() {
    const { condition, getDimensionValue } = this.props;
    if (condition.length && condition[0].key) {
      const promiseList = condition.filter(item => item.key).map(item => getDimensionValue(item.key));
      const data = await Promise.all(promiseList);
      this.setState({
        dimensionValueMap: data.reduce((pre, cur) => ({ ...pre, ...cur }), {}),
      });
    }
  }
  getMethodList = (keyVal: string) => {
    const { dimensionList } = this.props;
    const dimensionItem = dimensionList?.find?.(item => item.id === keyVal);
    const type = dimensionItem?.type || '';
    const list = [];
    if (type === 'number') {
      return [...list, ...NUMBER_CONDITION_METHOD_LIST];
    }
    return [...list, ...STRING_CONDITION_METHOD_LIST];
  };
  handleCommonChange<T extends IConditionItem, K extends keyof T>(index: number, name: K, v: T[K]) {
    const { condition } = this.props;
    this.props.onChange(
      condition.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            [name]: v,
          };
        }
        return item;
      }),
    );
  }
  handleKeyChange = async (v: string, index: number) => {
    this.props.onChange(
      this.props.condition.map((item, i) => {
        if (i === index) {
          if (item.key !== v) {
            return {
              ...item,
              key: v,
              method: this.getMethodList(v)[0].id,
              value: [],
              ...(i > 0 ? { condition: 'and' } : {}),
            };
          }
          return {
            ...item,
            key: v,
          };
        }
        return item;
      }),
    );
    if (this.state.dimensionValueMap[v] || !v || !this.props.getDimensionValue) return;
    const data = await this.props.getDimensionValue(v);
    this.setState({
      dimensionValueMap: {
        ...this.state.dimensionValueMap,
        ...data,
      },
    });
  };
  handleMethodChange = (v: string, index: number) => {
    this.handleCommonChange(index, 'method', v);
  };
  handleValueChange = (v: string[], index: number) => {
    const param = this.props.condition.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          value: v,
        };
      }
      return item;
    });
    if (index === this.props.condition.length - 1) {
      param.push({} as any);
    }
    this.props.onChange(param);
  };
  handleConditionChange = (v: string, index: number) => {
    this.handleCommonChange(index, 'condition', v);
  };
  handleAddClick = (index: number) => {
    const list = this.props.condition.slice();
    list.splice(index, 1, {
      key: '',
    } as any);
    this.props.onChange(list, false);
  };
  handleKeyVisibleChange = (open: boolean, index: number) => {
    if (!open) {
      setTimeout(() => {
        if (this.props.condition[index].key === '') {
          const list = this.props.condition.slice();
          list[index] = {} as any;
          this.props.onChange(list, false);
        }
      }, 20);
    }
  };
  handleDeleteKey = (index: number) => {
    const list = this.props.condition.slice();
    if (index === list.length - 1) {
      list.splice(index, 1, {} as any);
    } else {
      if (list[index + 1].condition && (list[index - 1]?.condition || index === 0)) {
        const { condition, ...item } = list[index + 1];
        list[index + 1] = item;
      }
      list.splice(index, 1);
    }
    this.props.onChange(list);
  };
  render(): JSX.Element {
    const { dimensionValueMap } = this.state;
    const { dimensionList, condition } = this.props;
    return (
      <div className='condition-input'>
        <LanguageContext.Consumer>
          {({ language }) =>
            condition.map((item, index) => [
              item?.condition && (
                <Select
                  key={`condition-${index}-${item.key}`}
                  className='condition-input-condition'
                  defaultValue={item.condition}
                  dropdownMatchSelectWidth={100}
                  showArrow={false}
                  onChange={v => this.handleConditionChange(v, index)}
                >
                  {CONDITION?.map(dim => (
                    <Option
                      key={dim.id}
                      value={dim.id}
                    >
                      {dim.name}
                    </Option>
                  ))}
                </Select>
              ),
              typeof item.key !== 'undefined' ? (
                <Select
                  key={`key-${index}-${item.key}`}
                  dropdownRender={(menu): JSX.Element =>
                    item.value ? (
                      <div>
                        {menu}
                        <Divider style={{ margin: '0' }} />
                        <div
                          className='key-del'
                          onClick={(): void => this.handleDeleteKey(index)}
                        >
                          <CloseCircleOutlined style={{ marginRight: '5px' }} />
                          {t('删除', language)}
                        </div>
                      </div>
                    ) : (
                      menu
                    )
                  }
                  autoFocus={true}
                  className='condition-input-key'
                  defaultOpen={item.key === ''}
                  defaultValue={item.key || ''}
                  dropdownMatchSelectWidth={140}
                  placeholder={t('请选择', language)}
                  showArrow={false}
                  showSearch
                  onChange={(v: string) => this.handleKeyChange(v, index)}
                  onDropdownVisibleChange={v => this.handleKeyVisibleChange(v, index)}
                >
                  {dimensionList?.map(dim => (
                    <Option
                      key={dim.id}
                      value={dim.id}
                    >
                      <Tooltip
                        placement='right'
                        title={dim.id}
                      >
                        <div>{dim.name || dim.id}</div>
                      </Tooltip>
                    </Option>
                  ))}
                </Select>
              ) : (
                <span
                  key={`add-${index}`}
                  className='condition-input-add'
                  onClick={() => this.handleAddClick(index)}
                >
                  <PlusOutlined className='add-icon' />
                </span>
              ),
              item?.key && [
                <Select
                  key={`method-${index}-${item.key}`}
                  className='condition-input-method'
                  defaultValue={item.method}
                  dropdownMatchSelectWidth={80}
                  showArrow={false}
                  onChange={v => this.handleMethodChange(v, index)}
                >
                  {this.getMethodList(item.key).map(dim => (
                    <Option
                      key={dim.id}
                      value={dim.id}
                    >
                      {dim.name}
                    </Option>
                  ))}
                </Select>,
                <Select
                  key={`value-${index}-${item.key}`}
                  className='condition-input-value'
                  defaultValue={item.value}
                  dropdownMatchSelectWidth={true}
                  dropdownStyle={{ display: dimensionValueMap[item.key]?.length < 1 ? 'none' : '' }}
                  mode='tags'
                  placeholder={t('请选择', language)}
                  showArrow={false}
                  onChange={v => this.handleValueChange(v, index)}
                >
                  {dimensionValueMap[item.key]?.map?.(dim => (
                    <Option
                      key={dim.id}
                      value={dim.id}
                    >
                      {dim.name}
                    </Option>
                  ))}
                </Select>,
              ],
            ])
          }
        </LanguageContext.Consumer>
      </div>
    );
  }
}
