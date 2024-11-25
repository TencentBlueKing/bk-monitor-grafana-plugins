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
import Switch from 'antd/es/switch';
import React from 'react';
import { EditMode } from 'typings/metric';

import { t } from '../utils/utils';
import AliasInput from './alias-input';
import EditorForm from './editor-form';
export type AddvanceSettingKey = 'enableDownSampling' | 'format' | 'promqlAlias' | 'step' | 'type';
export interface IAddvanceSettingProps {
  format: string;
  mode: EditMode;
  onChange: (key: AddvanceSettingKey, value: string) => void;
  onFormatChange?: (v: string) => void;
  onMinStepChange?: (v: string) => void;
  onPromqlAliasChange?: (v: string) => void;
  onTypeChange?: (v: string) => void;
  promqlAlias: string;
  step: string;
  type: string;
  enableDownSampling: boolean;
}

interface IAddvanceState {
  showContent: boolean;
}
const formatList = [
  {
    id: 'time_series',
    name: 'Time Series',
  },
  {
    id: 'table',
    name: 'Table',
  },
  {
    id: 'heatmap',
    name: 'Heatmap',
  },
];
const typeList = [
  {
    id: 'range',
    name: 'Range',
  },
  {
    id: 'instant',
    name: 'Instant',
  },
];
export default class AddvanceSetting extends React.PureComponent<IAddvanceSettingProps, IAddvanceState> {
  constructor(props) {
    super(props);
    this.state = {
      showContent: false,
    };
  }

  handleClickTitle = () => {
    this.setState({
      showContent: !this.state.showContent,
    });
  };

  render(): JSX.Element {
    const { showContent } = this.state;
    const { format, mode, onChange, promqlAlias, step, type, enableDownSampling } = this.props;
    const getHeaderContent = () => (
      <div className='header-content'>
        {mode === 'code' && <span className='header-content-item'>Min Step: {step || 'auto'}</span>}
        {mode === 'code' && (
          <span className='header-content-item'>
            {t('别名')}: {promqlAlias || '-'}
          </span>
        )}
        <span className='header-content-item'>
          {t('输出模式')}: {formatList.find(item => item.id === format)?.name || 'Time Series'}
        </span>
        <span className='header-content-item'>
          {t('类型')}: {typeList.find(item => item.id === type)?.name || 'Range'}
        </span>
        <span className='header-content-item'>
          {t('降采样')}: {enableDownSampling ? t('开启') : t('关闭')}
        </span>
      </div>
    );
    const uiForm = () => (
      <>
        <EditorForm title={t('输出模式')}>
          <Select
            dropdownStyle={{ minWidth: '100px' }}
            value={format}
            onChange={v => onChange('format', v)}
          >
            {formatList.map(item => (
              <Select.Option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </Select.Option>
            ))}
          </Select>
          <EditorForm title={t('类型')}>
            <Select
              value={type}
              onChange={v => onChange('type', v)}
            >
              {typeList.map(item => (
                <Select.Option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </EditorForm>
          <EditorForm title={t('降采样')}>
            <div className='down-sample-wrapper'>
              <Switch
                checked={enableDownSampling}
                checkedChildren={t('开启')}
                size='small'
                unCheckedChildren={t('关闭')}
                onChange={v => onChange('enableDownSampling', v)}
              />
            </div>
          </EditorForm>
        </EditorForm>
      </>
    );
    return (
      <div className='addvance-setting'>
        <div className='addvance-setting-title'>
          <span
            style={{ display: 'flex' }}
            onClick={this.handleClickTitle}
          >
            <i className={`fa fa-angle-down ${showContent ? 'is-open' : ''}`} />
            {t('高级配置')}
          </span>
          {!showContent && getHeaderContent()}
        </div>
        <div className={`addvance-setting-content ${showContent ? '' : 'is-hidden'}`}>
          {mode === 'code' ? (
            <EditorForm
              labelStyle={{
                minWidth: '86px',
              }}
              title='Min Step'
            >
              <AliasInput
                style={{ height: '32px', width: '88px' }}
                inputProps={{ defaultValue: step, placeholder: 'auto' }}
                onChange={v => onChange('step', v)}
              />
              <EditorForm title={t('别名')}>
                <AliasInput
                  style={{ height: '32px', width: '288px' }}
                  inputProps={{ defaultValue: promqlAlias }}
                  onChange={v => onChange('promqlAlias', v)}
                />
              </EditorForm>
              <EditorForm title={t('输出模式')}>
                <Select
                  dropdownStyle={{ minWidth: '100px' }}
                  value={format}
                  onChange={v => onChange('format', v)}
                >
                  {formatList.map(item => (
                    <Select.Option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
              </EditorForm>
              <EditorForm title={t('类型')}>
                <Select
                  value={type}
                  onChange={v => onChange('type', v)}
                >
                  {typeList.map(item => (
                    <Select.Option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
              </EditorForm>
              <EditorForm title={t('降采样')}>
                <div className='down-sample-wrapper'>
                  <Switch
                    checked={enableDownSampling}
                    checkedChildren={t('开启')}
                    size='small'
                    unCheckedChildren={t('关闭')}
                    onChange={v => onChange('enableDownSampling', v)}
                  />
                </div>
              </EditorForm>
            </EditorForm>
          ) : (
            uiForm()
          )}
        </div>
      </div>
    );
  }
}
