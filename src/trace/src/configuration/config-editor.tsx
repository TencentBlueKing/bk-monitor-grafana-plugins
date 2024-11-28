/* eslint-disable @typescript-eslint/no-explicit-any */
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
import type { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { LegacyForms, TagsInput } from '@grafana/ui';
import React, { useState } from 'react';

import type { QueryOption, SecureOption } from '../types/config';
import { t } from 'common/utils/utils';

const { FormField, Input, Switch } = LegacyForms;

const ConfigEditor: React.FC<DataSourcePluginOptionsEditorProps<QueryOption, SecureOption>> = ({
  options,
  onOptionsChange,
}) => {
  const [useToken, setUseToken] = useState<boolean>(options?.jsonData?.useToken ?? false);

  const handleChange = (type: string, e: React.FocusEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        [type]: e.target.value.trim(),
      },
    });
  };

  const handleTokenChange = (e: React.FocusEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        ...options.secureJsonData,
        token: e.target.value.trim(),
      },
    });
  };

  const handleUseTokenChange = (e: React.SyntheticEvent<HTMLInputElement, Event>) => {
    const newUseToken = (e.target as any).checked;
    setUseToken(newUseToken);
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        useToken: newUseToken,
      },
    });
  };

  const tagProps = {
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
                onBlur={e => handleChange('baseUrl', e)}
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
                checked={useToken}
                label=''
                onChange={e => handleUseTokenChange(e)}
              />
            }
            label={t('是否启用token')}
            labelWidth={10}
            tooltip={t('是否启用token')}
          />
        </div>
        {useToken && (
          <>
            <div className='gf-form'>
              <FormField
                inputEl={
                  <TagsInput
                    {...tagProps}
                    width={500}
                    tags={options.jsonData.keepCookies}
                    onChange={cookies =>
                      onOptionsChange({
                        ...options,
                        jsonData: {
                          ...options.jsonData,
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
                    onBlur={e => handleChange('bizId', e)}
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
                    onBlur={handleTokenChange}
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
};

export default ConfigEditor;
