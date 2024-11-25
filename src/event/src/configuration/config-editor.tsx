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
import type { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { LegacyForms, TagsInput } from '@grafana/ui';
import React from 'react';

import type { QueryOption, SecureOption } from '../typings/config';
import { t } from 'common/utils/utils';
const { FormField, Input, Switch } = LegacyForms;
export default class ConfigEditor extends React.PureComponent<
  DataSourcePluginOptionsEditorProps<QueryOption, SecureOption>,
  { useToken: boolean }
> {
  constructor(props) {
    super(props);
    this.state = {
      useToken: props.options?.jsonData?.useToken ?? false,
    };
  }
  handleChange = (type: string, e: React.FocusEvent<HTMLInputElement>) => {
    this.props.onOptionsChange({
      ...this.props.options,
      jsonData: {
        ...this.props.options.jsonData,
        [type]: e.target.value.trim(),
      },
    });
  };
  handleTokenChange = (e: React.FocusEvent<HTMLInputElement>) => {
    this.props.onOptionsChange({
      ...this.props.options,
      secureJsonData: {
        ...this.props.options.secureJsonData,
        token: e.target.value.trim(),
      },
    });
  };
  handleUseTokenChange = e => {
    const useToken = e.target.checked;
    this.setState({ useToken });
    this.props.onOptionsChange({
      ...this.props.options,
      jsonData: {
        ...this.props.options.jsonData,
        useToken,
      },
    });
  };
  render() {
    const { onOptionsChange, options } = this.props;
    const tagProps: any = {
      style: { width: '500px' },
    };
    return (
      <>
        <h3 className='page-heading'>BlueKing Monitor API Details</h3>
        <div className='gf-form-group'>
          <div
            style={{ width: '100%' }}
            className='gf-form'
          >
            <FormField
              inputEl={
                <Input
                  style={{ width: '500px' }}
                  defaultValue={options.jsonData.baseUrl}
                  placeholder={t('蓝鲸监控API路径')}
                  spellCheck={false}
                  onBlur={e => this.handleChange('baseUrl', e)}
                />
              }
              label='Base Url'
              labelWidth={10}
              tooltip={t('蓝鲸监控API路径')}
            />
          </div>
          <div
            style={{ width: '100%' }}
            className='gf-form'
          >
            <FormField
              inputEl={
                <Switch
                  checked={this.state.useToken}
                  label=''
                  onChange={this.handleUseTokenChange}
                />
              }
              label={t('是否启用token')}
              labelWidth={10}
              tooltip={t('是否启用token')}
            />
          </div>
          {this.state.useToken && (
            <>
              <div className='gf-form'>
                <FormField
                  inputEl={
                    <TagsInput
                      {...tagProps}
                      width={500}
                      tags={options.jsonData.keepCookies}
                      // style={{ width: '500px' }}
                      onChange={cookies =>
                        onOptionsChange({
                          ...this.props.options,
                          jsonData: {
                            ...this.props.options.jsonData,
                            keepCookies: cookies,
                          },
                        })
                      }
                    />
                  }
                  label='Allowed cookies'
                  labelWidth={10}
                  tooltip={t('Grafana代理默认删除转发的cookie,按名称指定应转发到数据源的cookie')}
                />
              </div>
              <div
                style={{ width: '100%' }}
                className='gf-form'
              >
                <FormField
                  inputEl={
                    <Input
                      style={{ width: '500px' }}
                      defaultValue={options.jsonData.bizId}
                      placeholder={t('蓝鲸监控业务ID')}
                      spellCheck={false}
                      onBlur={e => this.handleChange('bizId', e)}
                    />
                  }
                  label='业务ID'
                  labelWidth={10}
                  tooltip={t('蓝鲸监控业务ID')}
                />
              </div>
              <div
                style={{ width: '100%' }}
                className='gf-form'
              >
                <FormField
                  inputEl={
                    <Input
                      style={{ width: '500px' }}
                      placeholder={
                        options.secureJsonFields?.token ? t('已设置免登入Token') : t('蓝鲸监控当前业务免登入Token')
                      }
                      defaultValue={options.secureJsonData?.token ?? ''}
                      spellCheck={false}
                      type='password'
                      onBlur={this.handleTokenChange}
                    />
                  }
                  label='Token'
                  labelWidth={10}
                  tooltip={t('蓝鲸监控当前业务免登入Token')}
                />
              </div>
            </>
          )}
        </div>
      </>
    );
  }
}
