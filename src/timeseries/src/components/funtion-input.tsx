import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';
import Divider from 'antd/es/divider';
import Dropdown from 'antd/es/dropdown';
import Input from 'antd/es/input';
import Menu from 'antd/es/menu';
import Popover from 'antd/es/popover';
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
import React from 'react';

import { IFunctionItem, IFunctionParam } from '../typings/metric';
import { LanguageContext } from '../utils/context';
import { getEnByName } from '../utils/utils';
export const EMPTY_VALUE = '-空-';
export interface IFunctionInputProps {
  funtion: IFunctionItem;
  onDelete: () => void;
  onEdit: (item: IFunctionItem, needQuery?: boolean) => void;
}
interface IFunctionInputState {
  isSelect: boolean;
}

export default class FunctionInput extends React.PureComponent<IFunctionInputProps, IFunctionInputState> {
  constructor(props) {
    super(props);
    this.state = {
      isSelect: false,
    };
  }
  handleDelete = () => {
    this.props.onDelete();
    setTimeout(() => {
      document.body.click();
    }, 20);
  };
  handleParamBlur = (e: React.FocusEvent<HTMLInputElement>, item: IFunctionParam) => {
    e.persist();
    setTimeout(() => {
      if (!this.state.isSelect) {
        item.edit = false;
        const value = typeof e.target.value === 'string' ? e.target.value.trim() || item.default : e.target.value;
        const hasChange = value !== item.value;
        item.value = value;
        this.props.onEdit(this.props.funtion, hasChange);
      } else {
        this.setState({
          isSelect: false,
        });
        item.edit = false;
        this.props.onEdit(this.props.funtion, false);
      }
    }, 20);
  };
  handleParamClick = async (e: React.MouseEvent<HTMLSpanElement, MouseEvent>, item: IFunctionParam) => {
    e.preventDefault();
    e.stopPropagation();
    item.edit = true;
    this.props.onEdit(this.props.funtion, false);
  };
  handleSelectParam = async (key, param: IFunctionParam) => {
    this.setState({
      isSelect: true,
    });
    if (param.value !== key) {
      param.value = key;
      this.props.onEdit(this.props.funtion);
    }
  };
  render(): JSX.Element {
    const { funtion } = this.props;
    const getParamList = (param: IFunctionParam) =>
      param?.shortlist?.length ? (
        <Menu defaultSelectedKeys={[param.value!.toString()]}>
          {(param.shortlist as any).map(id => (
            <Menu.Item key={id === '' ? EMPTY_VALUE : id.toString()}>
              <div
                className='funciton-menu-item'
                onMouseDown={() => this.handleSelectParam(id, param)}
              >
                {id === '' ? EMPTY_VALUE : id}
              </div>
            </Menu.Item>
          ))}
        </Menu>
      ) : undefined;
    return (
      <div className='funtion-input'>
        <LanguageContext.Consumer>
          {({ language }) => (
            <Popover
              content={
                <div style={{ margin: '-12px -16px' }}>
                  <Divider style={{ margin: '0' }} />
                  <div
                    className='key-del'
                    onClick={this.handleDelete}
                  >
                    <CloseCircleOutlined style={{ marginRight: '5px' }} />
                    {getEnByName('删除', language)}
                  </div>
                </div>
              }
              trigger='click'
            >
              <span className='funtion-input-name'>{funtion.name}</span>
            </Popover>
          )}
        </LanguageContext.Consumer>
        {funtion?.params?.length ? (
          <>
            <span className='funtion-input-label'>&nbsp;(&nbsp;</span>
            {funtion.params.map(param => {
              if (param.edit) {
                return (
                  <Dropdown
                    key={param.id}
                    overlay={getParamList(param)}
                    overlayClassName='funciton-menu-list'
                    trigger={['click']}
                    visible={param.edit && param.shortlist?.length > 0}
                  >
                    <Input
                      key={param.id}
                      className='param-input'
                      defaultValue={param.value === '' ? '-空-' : param.value}
                      autoFocus
                      onBlur={e => this.handleParamBlur(e, param)}
                    ></Input>
                  </Dropdown>
                );
              }
              return (
                <span
                  key={param.id}
                  className='funtion-input-param'
                  onClick={e => this.handleParamClick(e, param)}
                >
                  {param.value === '' ? EMPTY_VALUE : param.value}
                </span>
              );
            })}
            <span className='funtion-input-label'>&nbsp;)&nbsp;</span>
          </>
        ) : undefined}
      </div>
    );
  }
}
