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
import React from 'react';
import type { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { LegacyForms, TagsInput } from '@grafana/ui';

import type { QueryOption, SecureOption } from '../types/config';
import { t } from 'common/utils/utils';
import { css } from '@emotion/css';

const { FormField, Input, Switch } = LegacyForms;

export const ConfigEditor: React.FC<DataSourcePluginOptionsEditorProps<QueryOption, SecureOption>> = ({
  options,
  onOptionsChange,
}) => {
  const style = getStyles();
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
                onBlur={e => {
                  onOptionsChange({
                    ...options,
                    jsonData: {
                      ...options.jsonData,
                      baseUrl: e.target.value.trim(),
                    },
                  });
                }}
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
                checked={options?.jsonData?.useToken ?? false}
                label=''
                onChange={e => {
                  onOptionsChange({
                    ...options,
                    jsonData: {
                      ...options.jsonData,
                      useToken: !!e.target?.checked,
                    },
                  });
                }}
              />
            }
            label={t('是否启用token')}
            labelWidth={10}
            tooltip={t('是否启用token')}
          />
        </div>
        {options?.jsonData?.useToken && (
          <>
            <div className='gf-form'>
              <FormField
                inputEl={
                  <TagsInput
                    className={style.tagContainer}
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
                    onBlur={e => {
                      onOptionsChange({
                        ...options,
                        jsonData: {
                          ...options.jsonData,
                          bizId: e.target.value.trim(),
                        },
                      });
                    }}
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
                    onBlur={e => {
                      onOptionsChange({
                        ...options,
                        secureJsonData: {
                          ...options.secureJsonData,
                          token: e.target.value.trim(),
                        },
                      });
                    }}
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

const getStyles = () => ({
  tagContainer: css({
    width: '100%',
  }),
});
