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
import { HighlightStyle, tags } from '@codemirror/highlight';
import { EditorView } from '@codemirror/view';

export const theme = EditorView.theme({
  '&': {
    '&.cm-focused': {
      outline: 'none !important',
      outline_fallback: 'none',
    },
  },
  '.cm-completionDetail': {
    color: '#999',
    float: 'right',
  },
  '.cm-completionIcon': {
    '&:after': { content: "'\\ea88'" },
    boxSizing: 'content-box',
    color: '#007acc',
    fontFamily: 'codicon',
    fontSize: '16px',
    lineHeight: '1',
    marginRight: '10px',
    opacity: '1',
    paddingRight: '0',
    verticalAlign: 'top',
  },
  '.cm-completionIcon-class': {
    '&:after': { content: "'○'" },
  },
  '.cm-completionIcon-constant': {
    '&:after': { content: "'c'" },
    color: '#007acc',
  },

  '.cm-completionIcon-enum': {
    '&:after': { content: "'∪'" },
  },

  '.cm-completionIcon-function, .cm-completionIcon-method': {
    '&:after': { content: "'f'" },
    color: '#652d90',
  },

  '.cm-completionIcon-interface': {
    '&:after': { content: "'◌'" },
  },

  '.cm-completionIcon-keyword': {
    '&:after': { content: "'k'" },
    color: '#616161',
  },

  '.cm-completionIcon-namespace': {
    '&:after': { content: "'▢'" },
  },
  '.cm-completionIcon-property': {
    '&:after': { content: "'□'" },
  },

  '.cm-completionIcon-text': {
    '&:after': { content: "'t'" },
    color: '#ee9d28',
  },

  '.cm-completionIcon-type': {
    '&:after': { content: "'𝑡'" },
  },

  '.cm-completionIcon-variable': {
    '&:after': { content: "'𝑥'" },
  },

  '.cm-completionInfo.cm-completionInfo-left': {
    '&:before': {
      border: '10px solid transparent',
      borderLeftColor: '#d6ebff',
      content: "' '",
      height: '0',
      position: 'absolute',
      right: '-20px',
      width: '0',
    },
    marginRight: '12px',
  },

  '.cm-completionInfo.cm-completionInfo-right': {
    '&:before': {
      border: '10px solid transparent',
      borderRightColor: '#d6ebff',
      content: "' '",
      height: '0',
      left: '-20px',
      position: 'absolute',
      width: '0',
    },
    marginLeft: '12px',
  },

  '.cm-completionMatchedText': {
    color: '#0066bf',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  '.cm-diagnostic': {
    '&.cm-diagnostic-error': {
      borderLeft: '3px solid #e65013',
    },
  },
  '.cm-line': {
    '& > span::selection': {
      backgroundColor: '#add6ff',
    },
    '&::selection': {
      backgroundColor: '#add6ff',
    },
    padding: '0 11px',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#dedede',
    color: '#000',
    fontWeight: 'bold',
    outline: '1px dashed transparent',
  },
  '.cm-nonmatchingBracket': { borderColor: 'red' },
  '.cm-placeholder': {
    fontFamily:
      // eslint-disable-next-line max-len
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans","Liberation Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"',
  },
  '.cm-scroller': {
    fontFamily: '"DejaVu Sans Mono", monospace',
    overflow: 'hidden',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#e6f3ff',
  },
  '.cm-tooltip': {
    backgroundColor: '#f8f8f8',
    borderColor: 'rgba(52, 79, 113, 0.2)',
  },
  '.cm-tooltip.cm-completionInfo': {
    backgroundColor: '#d6ebff',
    border: 'none',
    fontFamily: "'Open Sans', 'Lucida Sans Unicode', 'Lucida Grande', sans-serif;",
    marginTop: '-11px',
    maxWidth: 'min-content',
    minWidth: '250px',
    padding: '10px',
  },
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '& > ul': {
      fontFamily: '"DejaVu Sans Mono", monospace',
      maxHeight: '350px',
      maxWidth: 'unset',
    },
    '& > ul > li': {
      padding: '2px 1em 2px 3px',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: '#d6ebff',
      color: 'unset',
    },
    '& li:hover': {
      backgroundColor: '#ddd',
    },
    minWidth: '30%',
  },
});

export const promqlHighlighter = HighlightStyle.define([
  { color: '#000', tag: tags.name },
  { color: '#09885a', tag: tags.number },
  { color: '#a31515', tag: tags.string },
  { color: '#008080', tag: tags.keyword },
  { color: '#008080', tag: tags.function(tags.variableName) },
  { color: '#800000', tag: tags.labelName },
  { tag: tags.operator },
  { color: '#008080', tag: tags.modifier },
  { tag: tags.paren },
  { tag: tags.squareBracket },
  { tag: tags.brace },
  { color: 'red', tag: tags.invalid },
  { color: '#888', fontStyle: 'italic', tag: tags.comment },
]);
