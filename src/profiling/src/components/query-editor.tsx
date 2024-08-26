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
import { QueryEditorProps } from '@grafana/data';
import Spin from 'antd/es/spin';
import React from 'react';

import QueryDataSource from '../datasource/datasource';
import { QueryOption } from '../typings/config';
import { QueryData } from '../typings/datasource';
import { IConditionItem } from '../typings/metric';
import { LanguageContext } from '../utils/context';
import { getCookie, getEnByName } from '../utils/utils';
import AppSelector from './app-selector';
import ConditionInput from './condition-input';
import EditorForm from './editor-form';
const OptionList = [
  { id: 'app', name: 'app' },
  { id: 'target', name: 'target' },
];
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
export type IQueryEditorProps = QueryEditorProps<QueryDataSource, QueryData, QueryOption>;
interface IQueryEditorState {
  inited: boolean;
  language: string;
  loading: boolean;
  filters: IConditionItem[];
}
export default class MonitorQueryEditor extends React.PureComponent<IQueryEditorProps, IQueryEditorState> {
  constructor(props, context) {
    super(props, context);
    // let { query } = props;
    this.state = {
      inited: false,
      language: getCookie('blueking_language'),
      loading: true,
      filters: [{} as IConditionItem],
    };
  }
  async componentDidMount() {
    await this.initState();
  }
  async initState() {
    this.setState({ inited: true, loading: false });
  }
  onFiltersChange = async (filters: IConditionItem[], needQuery = false) => {
    this.setState({ filters });
    console.info('onFiltersChange', filters, needQuery);
  };
  render(): JSX.Element {
    const { language, loading, inited } = this.state;
    // const { data } = this.props;
    return (
      <LanguageContext.Provider value={{ language }}>
        <div className='monitor-grafana'>
          <Spin
            spinning={loading}
            tip='Loading...'
          >
            {inited ? (
              <div className='query-editor-content'>
                <EditorForm title={getEnByName('应用/服务', language)}>
                  <AppSelector app='' />
                </EditorForm>
                <EditorForm
                  // style={{ flex: 1 }}
                  title={getEnByName('Profile 类型', language)}
                >
                  <AppSelector app='' />
                </EditorForm>
                <EditorForm title={getEnByName('条件', language)}>
                  <ConditionInput
                    filterList={this.state.filters}
                    keyList={OptionList}
                    onChange={this.onFiltersChange}
                  />
                </EditorForm>
              </div>
            ) : (
              <div className='inite-wrapper' />
            )}
          </Spin>
        </div>
      </LanguageContext.Provider>
    );
  }
}
