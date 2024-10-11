/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
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
import React, { useEffect, useState } from 'react';

import ProfilingDatasource from '../datasource/datasource';
// import { QueryOption } from '../typings/config';
import { ProfilingQuery } from '../typings/datasource';
import { IProfileApp } from '../typings/profile';
import { getEnByName } from '../utils/utils';
import AppSelector from './app-selector';
import EditorForm from './editor-form';

type Props = QueryEditorProps<ProfilingDatasource, ProfilingQuery>;
export function QueryEditor({ datasource }: Props) {
  const appList = useProfileApp(datasource);
  const language = 'zh-CN';
  const [loading, setLoading] = useState<boolean>(false);
  console.info(appList);
  return (
    <div className='monitor-grafana'>
      <Spin
        spinning={loading}
        tip='Loading...'
      >
        <div className='query-editor-content'>
          <EditorForm title={getEnByName('应用/服务', language)}>
            <AppSelector app='' />
          </EditorForm>
          {/* <EditorForm
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
            </EditorForm> */}
        </div>
      </Spin>
    </div>
  );
}

function useProfileApp(datasource: ProfilingDatasource) {
  const [appList, setAppList] = useState<IProfileApp>();
  useEffect(() => {
    (async () => {
      const data = await datasource.getProfileApplicationService();
      setAppList(data);
    })();
  }, [datasource]);
  return appList;
}
