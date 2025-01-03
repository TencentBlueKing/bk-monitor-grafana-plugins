/* eslint-disable @typescript-eslint/no-misused-promises */
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
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import Divider from 'antd/es/divider';
import Select from 'antd/es/select';
import Tooltip from 'antd/es/tooltip';
import React, { useState, useEffect } from 'react';
import { map, merge, type Observable } from 'rxjs';

import type { ProfilingQuery } from '../typings/datasource';
import { CONDITION, type ICommonItem, type IConditionItem, STRING_CONDITION_METHOD_LIST } from '../typings/metric';
// import { DIM_NULL_ID } from '../typings/profile';
import { t } from 'common/utils/utils';

import type DataSource from '../datasource/datasource';

const { Option } = Select;

export interface IProps {
  datasource: DataSource;
  filterList: IConditionItem[];
  keyList: ICommonItem[];
  appName: ProfilingQuery['app_name'];
  serviceName: ProfilingQuery['service_name'];
  onChange: (v: IConditionItem[], needQuery?: boolean) => void;
}

const ConditionInput: React.FC<IProps> = ({ datasource, filterList, keyList, onChange, appName, serviceName }) => {
  const [dimensionValueMap, setDimensionValueMap] = useState<Record<string, ICommonItem[]>>({});
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const list: Observable<Record<string, ICommonItem[]>>[] = [];
    for (const { key } of filterList) {
      if (key && !(key in dimensionValueMap)) {
        list.push(
          datasource
            .getProfileValues({
              app_name: appName,
              service_name: serviceName,
              label_key: key,
            })
            .pipe(map(data => ({ [key]: data || [] }))),
        );
      }
    }
    if (!list.length) return;
    merge(...list).subscribe(data => {
      setDimensionValueMap({
        ...dimensionValueMap,
        ...data,
      });
    });
  }, [appName, serviceName, datasource, filterList]);

  const handleAddClick = (index: number) => {
    const list = filterList.slice();
    list.splice(index, 1, { key: '' });
    onChange(list, false);
  };

  const handleConditionChange = (v: string, index: number) => {
    handleCommonChange(index, 'condition', v);
  };

  const handleConditionKeyDown = (e, index: number) => {
    if (
      e.key === 'Enter' &&
      e.target.value &&
      !keyList.some(item => item.id === e.target.value || item.name === e.target.value)
    ) {
      const dimension = e.target.value;
      keyList.push({ id: dimension, name: dimension });
      handleKeyChange(e.target.value, index);
    }
  };

  const handleDeleteKey = (index: number) => {
    const list = filterList.slice();
    if (index === list.length - 1) {
      list.splice(index, 1, {});
    } else {
      if (list[index + 1].condition && (list[index - 1]?.condition || index === 0)) {
        const { condition, ...item } = list[index + 1];
        list[index + 1] = item;
      }
      list.splice(index, 1);
    }
    onChange(list);
  };

  const handleKeyChange = async (v: string, index: number) => {
    const list = filterList.map((item, i) => {
      if (i === index) {
        if (item.key !== v) {
          return {
            ...item,
            key: v,
            method: getMethodList()[0].id,
            value: '',
            ...(i > 0 ? { condition: 'and' } : {}),
          };
        }
        return {
          ...item,
          key: v,
        };
      }
      return item;
    });
    onChange(list);
  };

  const handleMethodChange = (v: string, index: number) => {
    handleCommonChange(index, 'method', v);
  };

  const handleValueChange = (v: string, index: number) => {
    const param = filterList.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          value: v,
        };
      }
      return item;
    });
    if (index === filterList.length - 1) {
      param.push({});
    }
    onChange(param);
  };

  const handleValueConditionKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleCommonChange = <T extends IConditionItem, K extends keyof T>(index: number, name: K, v: T[K]) => {
    onChange(
      filterList.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            [name]: v,
          };
        }
        return item;
      }),
    );
  };

  const getMethodList = () => {
    return [...STRING_CONDITION_METHOD_LIST].filter(item => item.id === 'eq');
  };

  const needNUll = (key: string) => {
    const item = keyList?.find(item => item.id === key);
    if (!item) return true;
    return typeof item.type === 'undefined' || item.type === 'string';
  };

  const getMaxWidth = (list: ICommonItem[]) =>
    Math.max(list?.reduce((max, cur) => Math.max(max, +cur?.name?.length), 1) * 10, 100);

  return (
    <div className='condition-input'>
      {filterList?.map((item, index) => (
        <React.Fragment key={JSON.stringify(item)}>
          {item?.condition && (
            <Select
              className='condition-input-condition'
              defaultValue={item.condition}
              dropdownMatchSelectWidth={100}
              showArrow={false}
              onChange={v => handleConditionChange(v, index)}
            >
              {CONDITION?.map(dim => (
                <Option
                  key={dim.id}
                  value={dim.id}
                >
                  {dim.name}
                </Option>
              ))}
            </Select>
          )}
          {typeof item.key !== 'undefined' ? (
            <Select
              dropdownRender={menu =>
                item.value ? (
                  <div>
                    {menu}
                    <Divider style={{ margin: '0' }} />
                    <div
                      className='key-del'
                      onClick={() => handleDeleteKey(index)}
                    >
                      <CloseCircleOutlined style={{ marginRight: '5px' }} />
                      {t('删除')}
                    </div>
                  </div>
                ) : (
                  menu
                )
              }
              autoFocus={true}
              className={`condition-input-key-${index}`}
              style={{ marginLeft: '-1px' }}
              defaultOpen={item.key === '' && !!keyList.length}
              defaultValue={item.key || undefined}
              dropdownMatchSelectWidth={140}
              placeholder={t('请选择')}
              showArrow={false}
              showSearch
              onChange={v => handleKeyChange(v, index)}
              onInputKeyDown={v => handleConditionKeyDown(v, index)}
            >
              {keyList?.map(dim => (
                <Option
                  key={dim.id}
                  value={dim.id}
                >
                  <Tooltip
                    placement='right'
                    title={dim.id}
                  >
                    <div>{dim.name || dim.id}</div>
                  </Tooltip>
                </Option>
              ))}
            </Select>
          ) : (
            <span
              className='condition-input-add'
              onClick={() => handleAddClick(index)}
            >
              <PlusOutlined className='add-icon' />
            </span>
          )}
          {item?.key && (
            <>
              <Select
                className='condition-input-method'
                defaultValue={item.method}
                dropdownMatchSelectWidth={80}
                showArrow={false}
                onChange={v => handleMethodChange(v, index)}
              >
                {getMethodList().map(dim => (
                  <Option
                    key={dim.id}
                    value={dim.id}
                  >
                    {dim.name}
                  </Option>
                ))}
              </Select>
              <Select
                dropdownStyle={{
                  display: dimensionValueMap[item.key]?.length < 1 ? 'none' : '',
                  minWidth: `${getMaxWidth(dimensionValueMap[item.key])}px`,
                  width: `${getMaxWidth(dimensionValueMap[item.key])}px`,
                }}
                autoFocus={true}
                className='condition-input-value'
                defaultValue={item.value}
                dropdownMatchSelectWidth={true}
                placeholder={t('请输入')}
                showArrow={false}
                tokenSeparators={[',', '|', '\n', ' ', '\r\n', '\r']}
                onChange={v => handleValueChange(v, index)}
                onInputKeyDown={v => handleValueConditionKeyDown(v)}
                showSearch={true}
              >
                {/* {needNUll(item.key) && (
                  <Option
                    key={DIM_NULL_ID}
                    value={DIM_NULL_ID}
                  >
                    {t('- 空 -')}
                  </Option>
                )} */}
                {dimensionValueMap[item.key]?.map?.(dim => (
                  <Option
                    key={dim.id}
                    value={dim.id}
                  >
                    {dim.name}
                  </Option>
                ))}
              </Select>
            </>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ConditionInput;
