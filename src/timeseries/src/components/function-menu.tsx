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
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import Input from 'antd/es/input';
import Popover from 'antd/es/popover';
import React from 'react';

import { IFunctionItem, MetricDetail } from '../typings/metric';
import { LanguageContext } from '../utils/context';
import { getEnByName } from '../utils/utils';
export interface IFunctionMenuProps {
  datasource: any;
  functionList: IFunctionItem[];
  functions?: IFunctionItem[];
  isExpressionFunc?: boolean;
  metric?: MetricDetail;
  onFunctionSeleted: (v: IFunctionItem) => void;
}

interface IFunctionMenuState {
  activeFuncId: string;
  activeFuncType: string;
  activeItem: IFunctionItem;
  keyword: string;
  show: boolean;
}

export default class FunctionMenu extends React.PureComponent<IFunctionMenuProps, IFunctionMenuState> {
  handleFuncMouseenter = (item: IFunctionItem) => {
    this.setState({
      activeFuncId: item?.id || '',
      activeItem: item,
    });
  };
  handleFuncTypeMouseenter = (item: IFunctionItem) => {
    this.setState({
      activeFuncId: '',
      activeFuncType: item?.id || '',
      activeItem: item,
    });
  };
  handleKeywordChange = (e: any) => {
    this.setState(
      {
        keyword: e?.target?.value || '',
      },
      () => {
        this.handleFuncTypeMouseenter(this.filterList[0]);
      },
    );
  };
  handleSelectFunc = (item: IFunctionItem) => {
    this.setState({
      show: false,
    });
    this.props.onFunctionSeleted(item);
  };
  handleVisibleChange = (show: boolean) => {
    const { activeFuncId, activeFuncType } = this.state;
    if (show && !activeFuncType && !activeFuncId && this.filterFucList.length) {
      this.setState({
        activeFuncType: this.filterFucList[0]?.id || '',
        activeItem: this.filterFucList[0],
      });
    }
    this.setState({
      show,
    });
  };
  constructor(props, context) {
    super(props, context);
    this.state = {
      activeFuncId: '',
      activeFuncType: '',
      activeItem: null,
      keyword: '',
      show: false,
    };
  }

  render(): JSX.Element {
    const { activeFuncId, activeFuncType, activeItem, keyword, show } = this.state;
    const functions = this.props.isExpressionFunc ? this.props.functions : this.props.metric.functions;
    return (
      <div className='function-menu'>
        <LanguageContext.Consumer>
          {({ language }) => (
            <Popover
              content={
                <div className='function-menu-panel'>
                  <Input
                    className='panel-search'
                    onChange={this.handleKeywordChange}
                    placeholder={getEnByName('搜索函数', language)}
                    suffix={<SearchOutlined style={{ color: '#c4c6cc', fontSize: '16px' }} />}
                    value={keyword}
                  ></Input>
                  <div className='panel-list'>
                    {this.filterList?.length > 0 && (
                      <ul className='panel-item'>
                        {this.filterList.map((item: IFunctionItem) => (
                          <li
                            className={`list-item ${item.id === activeFuncType ? 'item-active' : ''}`}
                            key={item.id}
                            onMouseEnter={() => this.handleFuncTypeMouseenter(item)}
                          >
                            {item.name}
                            <i className='icon-monitor icon-arrow-right arrow-icon'></i>
                          </li>
                        ))}
                      </ul>
                    )}
                    {this.activeFuncList?.length > 0 && (
                      <ul className='panel-item'>
                        {this.activeFuncList.map(
                          (item: IFunctionItem) =>
                            item.id.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()) && (
                              <li
                                className={`list-item ${item.id === activeFuncId ? 'item-active' : ''}`}
                                key={item.id}
                                onClick={() => this.handleSelectFunc(item)}
                                onMouseEnter={() => this.handleFuncMouseenter(item)}
                              >
                                {item.name.slice(0, item.name.toLocaleLowerCase().indexOf(keyword.toLocaleLowerCase()))}
                                <span style={{ color: '#FF9C00' }}>
                                  {item.name.slice(
                                    item.name.toLocaleLowerCase().indexOf(keyword.toLocaleLowerCase()),
                                    item.name.toLocaleLowerCase().indexOf(keyword.toLocaleLowerCase()) + keyword.length,
                                  )}
                                </span>
                                {item.name.slice(
                                  item.name.toLocaleLowerCase().indexOf(keyword.toLocaleLowerCase()) + keyword.length,
                                  item.name.length,
                                )}
                              </li>
                            ),
                        )}
                      </ul>
                    )}
                    {(activeFuncId || activeFuncType) && (
                      <div className='panel-desc'>
                        <div className='desc-title'>{activeItem.name}</div>
                        <div className='desc-content'>{activeItem.description}</div>
                      </div>
                    )}
                    {(!this.filterList?.length || !this.activeFuncList?.length) && (
                      <div className='panel-desc'>{getEnByName('暂无数据', language)}</div>
                    )}
                  </div>
                </div>
              }
              onVisibleChange={this.handleVisibleChange}
              trigger='click'
              visible={show}
            >
              {functions?.length ? (
                <span className='menu-add'>
                  <PlusOutlined className='add-icon' />
                </span>
              ) : (
                <span className='function-menu-anchor'>{getEnByName('请选择', language)}</span>
              )}
            </Popover>
          )}
        </LanguageContext.Consumer>
      </div>
    );
  }
  get activeFunc() {
    return this.activeFuncList.find((item) => item.id === this.state.activeFuncId);
  }
  get activeFuncList() {
    const list = this.filterList.find((item) => item.id === this.state.activeFuncType)?.children || [];
    return this.props.isExpressionFunc ? list.filter((item) => item.support_expression) : list;
  }
  get activeFuncTypeDesc() {
    return this.filterFucList.find((item) => item.id === this.state.activeFuncType)?.description || '';
  }
  get filterFucList() {
    if (this.props.isExpressionFunc) {
      return this.props.functionList.filter((item) => item.children.some((set) => set.support_expression));
    }
    if (this.props.metric?.isAllFunc) return this.props.functionList;
    return this.props.functionList.filter((item) => ['sort', 'time_shift'].includes(item.id));
  }
  get filterList() {
    if (!this.state.keyword) return this.filterFucList;
    return this.filterFucList.filter((func) =>
      func?.children?.some((item) => item.name.toLocaleLowerCase().includes(this.state.keyword.toLocaleLowerCase())),
    );
  }
}
