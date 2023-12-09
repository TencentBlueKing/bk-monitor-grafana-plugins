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
import EditorForm from './editor-form';
import AliasInput from './alias-input';
import Select from 'antd/es/select';
import { EditMode } from 'typings/metric';
import { getEnByName } from '../utils/utils';
export type AddvanceSettingKey = 'step' | 'format' | 'promqlAlias' | 'type';
export interface IAddvanceSettingProps {
  step: string;
  format: string;
  promqlAlias: string;
  type: string;
  mode: EditMode;
  onMinStepChange?: (v: string) => void;
  onFormatChange?: (v: string) => void;
  onTypeChange?: (v: string) => void;
  onPromqlAliasChange?: (v: string) => void;
  onChange?: (key: AddvanceSettingKey, value: string) => void
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
    const { showContent  } = this.state;
    const { step, promqlAlias, format, type, onChange, mode } = this.props;
    const getHeaderContent = () => <div className='header-content'>
      {mode === 'code' && <span className='header-content-item'>Min Step: {step || 'auto'}</span>}
      {mode === 'code' && <span className='header-content-item'>{getEnByName('别名')}: {promqlAlias || '-'}</span>}
      <span className='header-content-item'>{getEnByName('输出模式')}: {formatList.find(item => item.id === format)?.name || 'Time Series'}</span>
      <span className='header-content-item'>{getEnByName('类型')}: {typeList.find(item => item.id === type)?.name || 'Range'}</span>
    </div>;
    const uiForm = () => <>
      <EditorForm title={getEnByName('输出模式')}>
        <Select dropdownStyle={{ minWidth: '100px' }} value={format} onChange={v => onChange('format', v)}>
          {
            formatList.map(item => <Select.Option
              value={item.id}
              key={item.id}>
              {item.name}
            </Select.Option>)
          }
        </Select>
        <EditorForm title={getEnByName('类型')}>
          <Select value={type} onChange={v => onChange('type', v)}>
            {
              typeList.map(item => <Select.Option
                value={item.id}
                key={item.id}>
                {item.name}
              </Select.Option>)
            }
          </Select>
        </EditorForm>
      </EditorForm>
    </>;
    return (
      <div className='addvance-setting'>
        <div className='addvance-setting-title'>
          <span onClick={this.handleClickTitle} style={{ display: 'flex' }}>
            <i className={`fa fa-angle-down ${showContent ? 'is-open' : ''}`}/>{getEnByName('高级配置')}
          </span>
          {!showContent && getHeaderContent() }
        </div>
        <div className={`addvance-setting-content ${showContent ? '' : 'is-hidden'}`}>
          {
            mode === 'code' ? <EditorForm title='Min Step' labelStyle={{
              minWidth: '86px',
            }}>
              <AliasInput style={{ width: '88px', height: '32px' }}
                inputProps={{ defaultValue: step, placeholder: 'auto' }}
                onChange={v => onChange('step', v)} />
              <EditorForm title={getEnByName('别名')}>
                <AliasInput
                  style={{ width: '288px', height: '32px' }}
                  inputProps={{ defaultValue: promqlAlias }}
                  onChange={v => onChange('promqlAlias', v)} />
              </EditorForm>
              <EditorForm title={getEnByName('输出模式')}>
                <Select dropdownStyle={{ minWidth: '100px' }} value={format} onChange={v => onChange('format', v)}>
                  {
                    formatList.map(item => <Select.Option
                      value={item.id}
                      key={item.id}>
                      {item.name}
                    </Select.Option>)
                  }
                </Select>
              </EditorForm>
              <EditorForm title={getEnByName('类型')}>
                <Select value={type} onChange={v => onChange('type', v)}>
                  {
                    typeList.map(item => <Select.Option
                      value={item.id}
                      key={item.id}>
                      {item.name}
                    </Select.Option>)
                  }
                </Select>
              </EditorForm>
            </EditorForm>
              : uiForm()
          }
        </div>
      </div>
    );
  }
}
