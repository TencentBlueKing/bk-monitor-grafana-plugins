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
import Tooltip from 'antd/es/tooltip';
import React from 'react';

import type { MetricDetail } from '../typings/metric';
import { LanguageContext } from '../utils/context';
export interface IEditorFormProps {
  metricList?: MetricDetail[];
  title?: string;
  tips?: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  renderTitle?: () => Element;
}

interface IEditorFormState {
  a: string;
}

export default class EditorForm extends React.PureComponent<IEditorFormProps, IEditorFormState> {
  render(): JSX.Element {
    const { renderTitle, title, tips, style, labelStyle } = this.props;
    return (
      <LanguageContext.Consumer>
        {({ language }) => (
          <div
            style={style}
            className='editor-form'
          >
            <span
              style={{ minWidth: !tips ? '56px' : '80px', ...labelStyle }}
              className='editor-form-label'
            >
              {renderTitle ? renderTitle() : title}
              {tips && (
                <Tooltip
                  mouseEnterDelay={0.2}
                  overlayClassName='monitor-tooltip'
                  placement='right'
                  title={tips}
                >
                  <i
                    style={{ marginLeft: language !== 'en' ? 'auto' : '8px' }}
                    className='fa fa-info-circle label-tip'
                  />
                </Tooltip>
              )}
            </span>
            <div className='editor-form-content'>{this.props?.children}</div>
          </div>
        )}
      </LanguageContext.Consumer>
    );
  }
}
