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
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { QueryOption } from '../typings/config';
import { LegacyForms } from '@grafana/ui';
const { Input, FormField } = LegacyForms;
export default class ConfigEditor extends React.PureComponent<DataSourcePluginOptionsEditorProps<QueryOption>> {
  handleBaseUrlChange = (e: React.FocusEvent<HTMLInputElement>) => {
    this.props.onOptionsChange({
      ...this.props.options,
      jsonData: {
        ...this.props.options.jsonData,
        baseUrl: e.target.value.trim(),
      },
    });
  };
  render() {
    const { options } = this.props;
    return (
      <>
        <h3 className="page-heading">BlueKing Monitor API Details</h3>
        <div className="gf-form-group">
          <div className="gf-form-inline">
            <div className="gf-form" style={{ width: '100%' }}>
              <FormField
                label="Base Url"
                labelWidth={10}
                inputEl={
                  <Input
                    style={{ width: '500px' }}
                    defaultValue={options.jsonData.baseUrl}
                    spellCheck={false}
                    placeholder="15s"
                    onBlur={this.handleBaseUrlChange}
                  />
                }
                tooltip="蓝鲸监控API路径"
              />
            </div>
          </div>
        </div>
      </>
    );
  }
}
