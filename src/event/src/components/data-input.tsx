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
import type { ICommonItem } from '../typings/metric';
export interface IDataInputProps {
  onChange: (v: string) => void;
  value: string;
  showId?: boolean;
  list: ICommonItem[];
  getMetricList: (keyword: string, page: number) => Promise<void>;
}
export default class DataInput extends React.PureComponent<
  IDataInputProps,
  {
    loading: boolean;
    timer: any;
    keyword: string;
    page: number;
  }
> {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      timer: null,
      keyword: '',
      page: 1,
    };
  }
  // componentDidUpdate(prevProps: Readonly<IDataInputProps>): void {
  //   if (prevProps.typeId !== this.props.typeId) {
  //     this.setState({ loading: true, page: 1 }, async () => {
  //       await this.props.getMetricList();
  //       this.setState({ loading: false });
  //     });
  //   }
  // }
  handleSearch = async (value: string) => {
    if (this.state.timer) clearTimeout(this.state.timer);
    const timer = setTimeout(async () => {
      this.setState({ loading: true, keyword: value, page: 1 });
      await this.props.getMetricList(value, 1);
      this.setState({ loading: false, timer: null });
    }, 300);
    this.setState({ timer });
  };
  handlePopupScroll = async e => {
    if (this.state.loading) return;
    const target = e.target;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight) {
      this.setState({ loading: true, page: +this.state.page + 1 }, async () => {
        await this.props.getMetricList(this.state.keyword, this.state.page);
        this.setState({ loading: false });
      });
    }
  };
  render(): JSX.Element {
    return (
      <div>
        <Select
          className='type-input'
          value={this.props.value}
          virtual={true}
          onSelect={v => {
            this.setState({
              keyword: '',
              page: 1,
            });
            this.props.onChange(v);
          }}
          popupClassName='type-input-popup'
          showSearch
          filterOption={false}
          loading={this.state.loading}
          fieldNames={{ label: 'name', value: 'id' }}
          options={this.props.list}
          onSearch={this.handleSearch}
          onPopupScroll={this.handlePopupScroll}
        />
      </div>
    );
  }
}
