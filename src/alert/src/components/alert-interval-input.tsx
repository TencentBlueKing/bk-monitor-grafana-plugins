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

import Dropdown from 'antd/es/dropdown';
import InputNumber from 'antd/es/input-number';
import Menu from 'antd/es/menu';
import Select from 'antd/es/select';
import React from 'react';

import { INTERVAL_LIST, ALERT_INTERVAL_UNIT_LIST, IntervalType } from '../typings/metric';
const { Option } = Select;
const { Item } = Menu;
export interface IIntervalInputProps {
  agg_interval: IntervalType;
  agg_interval_unit: string;
  onIntervalChange: (v: IntervalType) => void;
  onIntervalUnitChange: (v: string) => void;
}

export default class IntervalInput extends React.PureComponent<IIntervalInputProps> {
  handlePeriodBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let value: number | string = 10;
    if (typeof e.target.value === 'number' || /^[0-9]+$/.test(e.target.value)) {
      value = +e.target.value;
    } else if (typeof e.target.value === 'string') {
      if (/^\$/.test(e.target.value)) {
        value = e.target.value;
      } else {
        value = 'auto';
      }
    }
    this.props.agg_interval !== value && this.props.onIntervalChange(value);
  };
  render(): JSX.Element {
    const { onIntervalChange, onIntervalUnitChange, agg_interval, agg_interval_unit } = this.props;
    const menuList = (
      <Menu selectedKeys={[String(agg_interval)]}>
        {INTERVAL_LIST.map(item => (
          <Item
            key={item.id}
            onClick={() => agg_interval !== item.id && onIntervalChange(item.id)}
          >
            {item.name}
          </Item>
        ))}
      </Menu>
    );
    return (
      <div className='interval-input'>
        <Dropdown
          overlay={menuList}
          trigger={['click']}
        >
          <div style={{ position: 'relative' }}>
            <InputNumber
              className='interval-select'
              min={1}
              precision={0}
              value={agg_interval as number}
              onBlur={this.handlePeriodBlur}
            />
          </div>
        </Dropdown>
        <Select
          className='interval-unit'
          defaultValue={agg_interval_unit}
          disabled={agg_interval === 'auto'}
          dropdownMatchSelectWidth={80}
          showArrow={false}
          onChange={onIntervalUnitChange}
        >
          {ALERT_INTERVAL_UNIT_LIST?.map(item => (
            <Option
              key={item.id}
              value={item.id}
            >
              {item.name}
            </Option>
          ))}
        </Select>
      </div>
    );
  }
}
