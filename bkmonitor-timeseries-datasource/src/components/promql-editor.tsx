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
import { EditorView, highlightSpecialChars, keymap, ViewUpdate, placeholder } from '@codemirror/view';
import { EditorState, Prec, Compartment } from '@codemirror/state';
import { indentOnInput, syntaxTree } from '@codemirror/language';
import { history, historyKeymap } from '@codemirror/history';
import { defaultKeymap, insertNewlineAndIndent } from '@codemirror/commands';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { commentKeymap } from '@codemirror/comment';
import { lintKeymap } from '@codemirror/lint';
import { PromQLExtension } from 'codemirror-promql';
import { autocompletion, completionKeymap, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { CompleteStrategy, newCompleteStrategy } from 'codemirror-promql/dist/esm/complete';
import { theme, promqlHighlighter } from './theme';
const promqlExtension = new PromQLExtension();
const dynamicConfigCompartment = new Compartment();
interface IPromqlEditorProps {
  value: string;
  style?: React.CSSProperties;
  verifiy?: boolean;
  executeQuery?: (v: string, hasError: boolean) => void;
  onChange?: (v: string) => void;
  onBlur?: (v: string, hasError: boolean) => void;
}

export class HistoryCompleteStrategy implements CompleteStrategy {
  private complete: CompleteStrategy;
  private queryHistory: string[];
  constructor(complete: CompleteStrategy, queryHistory: string[]) {
    this.complete = complete;
    this.queryHistory = queryHistory;
  }

  promQL(context: CompletionContext): Promise<CompletionResult | null> | CompletionResult | null {
    return Promise.resolve(this.complete.promQL(context)).then((res) => {
      const { state, pos } = context;
      const tree = syntaxTree(state).resolve(pos, -1);
      const start = res !== null ? res.from : tree.from;

      if (start !== 0) {
        return res;
      }

      const historyItems: CompletionResult = {
        from: start,
        to: pos,
        options: this.queryHistory.map(q => ({
          label: q.length < 80 ? q : q.slice(0, 76).concat('...'),
          detail: 'past query',
          apply: q,
          info: q.length < 80 ? undefined : q,
        })),
        span: /^[a-zA-Z0-9_:]+$/,
      };

      if (res !== null) {
        historyItems.options = historyItems.options.concat(res.options);
      }
      return historyItems;
    });
  }
}
export default class PromqlEditor extends React.PureComponent<IPromqlEditorProps> {
  containerRef: any = null;
  viewRef: any = null;
  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
    this.viewRef = React.createRef();
  }
  componentDidMount() {
    const handleBlur = () => {
      if (this.props.value === this.viewRef.current.state.doc.toString()) return;
      const hasError = false;
      // if (this.viewRef.current && this.props.verifiy) {
      //   const lintFunc = promqlExtension.getLinter().promQL()(this.viewRef.current as EditorView) as Diagnostic[];
      //   hasError = lintFunc?.length > 0;
      // }

      this.props.onBlur(this.viewRef.current.state.doc.toString(), hasError);
    };
    promqlExtension.activateCompletion(true);
    promqlExtension.activateLinter(false);
    promqlExtension.setComplete({
      completeStrategy: new HistoryCompleteStrategy(
        // newCompleteStrategy({
        //   remote: { url: 'http://demo.robustperception.io:9090' },
        // }),
        newCompleteStrategy(),
        [],
      ),
    });
    const dynamicConfig = [promqlHighlighter, promqlExtension.asExtension()];
    const view = this.viewRef.current;
    if (view === null) {
      if (!this.containerRef.current) {
        throw new Error('expected CodeMirror container element to exist');
      }
      const startState = EditorState.create({
        doc: this.props.value,
        extensions: [
          theme,
          highlightSpecialChars(),
          history(),
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          autocompletion(),
          highlightSelectionMatches(),
          EditorView.lineWrapping,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...commentKeymap,
            ...completionKeymap,
            ...lintKeymap,
          ]),
          placeholder('Expression (press Shift+Enter for newlines)'),
          dynamicConfigCompartment.of(dynamicConfig),
          // This keymap is added without precedence so that closing the autocomplete dropdown
          // via Escape works without blurring the editor.
          keymap.of([
            {
              key: 'Escape',
              run: (v: EditorView): boolean => {
                v.contentDOM.blur();
                return false;
              },
            },
          ]),
          Prec.override(keymap.of([
            {
              key: 'Enter',
              run: (v: EditorView): boolean => {
                const hasError = false;
                // if (this.viewRef.current && this.props.verifiy) {
                //   const lintFunc = promqlExtension.getLinter().promQL()(v) as Diagnostic[];
                //   hasError = lintFunc?.length > 0;
                // }
                this.props.executeQuery(v.state.doc.toString(), hasError);
                return true;
              },
            },
            {
              key: 'Shift-Enter',
              run: insertNewlineAndIndent,
            },
          ])),
          EditorView.updateListener.of((update: ViewUpdate): void => {
            this.props.onChange?.(update.state.doc.toString());
          }),
        ],
      });
      const view = new EditorView({
        state: startState,
        parent: this.containerRef.current,
      });
      this.viewRef.current = view;
      view.contentDOM.removeEventListener('blur', handleBlur);
      view.contentDOM.addEventListener('blur', handleBlur);
    } else {
      view.dispatch(view.state.update({
        effects: dynamicConfigCompartment.reconfigure(dynamicConfig),
      }));
    }
  }
  render() {
    return (
      <div className="promql-editor">
        <div className="promql-editor-instance" style={this.props.style} ref={this.containerRef}></div>
      </div>
    );
  }
}
