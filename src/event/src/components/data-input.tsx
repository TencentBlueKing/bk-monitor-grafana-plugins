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
import React from 'react';
import type { ICommonItem } from 'typings/metric';
const { Option } = Select;
export interface IDataInputProps {
  onChange?: (v: string) => void;
  value: string;
  showId?: boolean;
  list: ICommonItem[];
}
export default class DataInput extends React.PureComponent<IDataInputProps> {
  render(): JSX.Element {
    return (
      <div>
        <Select
          className='type-input'
          dropdownClassName={'monitor-data-input-dropdown'}
          value={this.props.value}
          onChange={this.props.onChange}
          showSearch
          filterOption={(input, option) => {
            if (!option || !input) return true;
            console.info(option);
            return (
              (option?.label as string)?.toLowerCase?.().indexOf(input.toLowerCase()) >= 0 ||
              (option?.value as string)?.toLowerCase?.().indexOf(input.toLowerCase()) >= 0 ||
              (option?.dataId as string)?.toLowerCase?.().indexOf(input.toLowerCase()) >= 0
            );
          }}
        >
          {this.props.list.map(item => (
            <Option
              key={item.id}
              value={item.id}
              label={item.name}
              dataId={item.bk_data_id}
            >
              {item.name}
              {this.props.showId && <span className='mark-text'>（#{item.bk_data_id}）</span>}
            </Option>
          ))}
        </Select>
      </div>
    );
  }
}
