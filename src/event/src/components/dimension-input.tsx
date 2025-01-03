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

import CloseOutlined from '@ant-design/icons/CloseOutlined';
import Select from 'antd/es/select';
import Tooltip from 'antd/es/tooltip';
import React from 'react';

import type { ICommonItem } from '../typings/metric';
import { LanguageContext } from '../utils/context';
import { t } from 'common/utils/utils';
const { Option } = Select;
export interface IDimensionInputProps {
  dimensionList: ICommonItem[];
  dimension: string[];
  onDimensionChange: (v: string[]) => void;
  variableQuery?: boolean;
}
interface IDimensionInputState {
  open: boolean;
}

export default class DimensionInput extends React.PureComponent<IDimensionInputProps, IDimensionInputState> {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }
  onDimensionFocus = (): void => {
    this.setState({
      open: true,
    });
  };
  onDimensionBlur = (): void => {
    this.setState({
      open: false,
    });
  };
  render(): JSX.Element {
    const { variableQuery, dimension, dimensionList, onDimensionChange } = this.props;
    const selectProps: any = {};
    !variableQuery && (selectProps.mode = 'tags');
    return (
      <LanguageContext.Consumer>
        {({ language }) => (
          <Select
            tagRender={(item): JSX.Element => (
              <Tooltip
                placement='top'
                title={item.value}
              >
                <span className='ant-select-selection-item'>
                  <span className='ant-select-selection-item-content'>{item.label}</span>
                  <span
                    className='ant-select-selection-item-remove'
                    onClick={item.onClose}
                  >
                    <CloseOutlined rev={''} />
                  </span>
                </span>
              </Tooltip>
            )}
            className='dimension-input'
            open={this.state.open}
            placeholder={t('维度', language)}
            showArrow={false}
            showSearch
            {...selectProps}
            value={dimension}
            onBlur={this.onDimensionBlur}
            onChange={onDimensionChange}
            onFocus={this.onDimensionFocus}
          >
            {dimensionList?.map(item => (
              <Option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </Option>
            ))}
          </Select>
        )}
      </LanguageContext.Consumer>
    );
  }
}
