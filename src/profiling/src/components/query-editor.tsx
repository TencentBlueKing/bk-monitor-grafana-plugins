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
import Cascader, { type BaseOptionType } from 'antd/es/cascader';
import Select from 'antd/es/select';
import Tooltip from 'antd/es/tooltip';
import React, { useEffect, useState } from 'react';

import { LanguageContext } from '../utils/context';
import { t, language } from 'common/utils/utils';
import ConditionInput from './condition-input';
import EditorForm from './editor-form';

import type ProfilingDatasource from '../datasource/datasource';
import type { ProfilingQuery } from '../typings/datasource';
import type { ICommonItem } from '../typings/metric';
import type { QueryEditorProps } from '@grafana/data';

type Props = QueryEditorProps<ProfilingDatasource, ProfilingQuery>;

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const [appList, setAppList] = useState<BaseOptionType[]>([]);
  const [profileTypeList, setProfileTypeList] = useState<BaseOptionType[]>([]);
  const [labels, setLabels] = useState<ICommonItem[]>([]);
  const [isLoading, setIsLoading] = useState({
    types: false,
    labels: false,
    app: false,
  });
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setIsLoading(v => ({
      ...v,
      app: true,
    }));
    datasource.getProfileApplicationService().subscribe({
      next: data => {
        const appList =
          data?.map(item => ({
            value: item.app_name,
            label: item.app_name,
            app_alias: item.app_alias,
            disabled: !item?.services?.length,
            children: item?.services?.map(service => ({
              value: service.name,
              label: service.name,
            })),
          })) || [];
        setAppList(appList);
        if (data.length && (!query.app_name || !query.service_name)) {
          onChange({
            ...query,
            app_name: data[0].app_name,
            service_name: data[0].services[0].name,
          });
        }
        setIsLoading(v => ({
          ...v,
          app: false,
        }));
      },
      error: () => {
        setAppList([]);
        setIsLoading(v => ({
          ...v,
          app: false,
        }));
      },
    });
  }, [datasource]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!query.app_name || !query.service_name) return;
    setIsLoading(v => ({
      ...v,
      types: true,
      labels: true,
    }));
    datasource
      .getProfileTypes({
        app_name: query.app_name,
        service_name: query.service_name,
      })
      .subscribe({
        next: data => {
          setProfileTypeList(data);
          if (data.length) {
            onChange({ ...query, profile_type: data[0].value });
            onRunQuery();
          }
          setIsLoading(v => ({ ...v, types: false }));
        },
        error: () => {
          setProfileTypeList([]);
          setIsLoading(v => ({ ...v, types: false }));
        },
      });
    datasource
      .getProfileLabels({
        app_name: query.app_name,
        service_name: query.service_name,
      })
      .subscribe({
        next: data => {
          setLabels(data);
          setIsLoading(v => ({ ...v, labels: false }));
        },
        error: () => {
          setLabels([]);
          setIsLoading(v => ({ ...v, labels: false }));
        },
      });
  }, [query.app_name, query.service_name, datasource]);
  return (
    <LanguageContext.Provider value={{ language }}>
      <div className='monitor-profiling'>
        <div className='query-editor-content'>
          <EditorForm title={t('应用/服务')}>
            <Cascader
              style={{ width: '100%', minWidth: '160px' }}
              options={appList.map(option => {
                if (option.disabled) {
                  return {
                    ...option,
                    label: (
                      <Tooltip
                        placement='right'
                        title={t('无数据')}
                      >
                        <span>{option.label}</span>
                      </Tooltip>
                    ),
                    disabled: true,
                  };
                }
                return {
                  ...option,
                  label: (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        flexWrap: 'nowrap',
                      }}
                    >
                      {option.app_alias}
                      <span>({option.value})</span>
                    </div>
                  ),
                };
              })}
              dropdownMenuColumnStyle={{ minWidth: '100%' }}
              expandTrigger='click'
              loading={isLoading.app}
              showSearch={true}
              value={query.app_name && query.service_name ? [query.app_name, query.service_name] : undefined}
              onChange={v => {
                onChange({ ...query, app_name: v[0], service_name: v[1], profile_type: '', filter_labels: [] });
                onRunQuery();
              }}
            />
          </EditorForm>
          <EditorForm title={t('Profile 类型')}>
            <Select
              style={{ width: '160px' }}
              disabled={isLoading.types}
              loading={isLoading.types}
              placeholder={isLoading.types ? t('加载中') : t('请选择')}
              value={query.profile_type || undefined}
              onChange={v => {
                onChange({ ...query, profile_type: v });
                onRunQuery();
              }}
            >
              {profileTypeList.map(item => (
                <Select.Option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </Select.Option>
              ))}
            </Select>
          </EditorForm>
          <EditorForm title={t('条件')}>
            <ConditionInput
              appName={query.app_name}
              datasource={datasource}
              filterList={query.filter_labels?.length ? query.filter_labels : [{}]}
              keyList={labels}
              serviceName={query.app_name}
              onChange={(v, needQuery = true) => {
                onChange({ ...query, filter_labels: v });
                needQuery && onRunQuery();
              }}
            />
          </EditorForm>
        </div>
      </div>
    </LanguageContext.Provider>
  );
}
