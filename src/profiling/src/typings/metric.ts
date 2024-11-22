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

// 监控条件
export const CONDITION_METHOD_LIST = [
  { id: 'eq', name: '=' },
  { id: 'gt', name: '>' },
  { id: 'gte', name: '>=' },
  { id: 'lt', name: '<' },
  { id: 'lte', name: '<=' },
  { id: 'neq', name: '!=' },
  { id: 'include', name: 'include' },
  { id: 'exclude', name: 'exclude' },
  { id: 'reg', name: 'regex' },
  { id: 'nreg', name: 'nregex' },
];
// number 监控条件
export const NUMBER_CONDITION_METHOD_LIST = [
  { id: 'eq', name: '=' },
  { id: 'gt', name: '>' },
  { id: 'gte', name: '>=' },
  { id: 'lt', name: '<' },
  { id: 'lte', name: '<=' },
  { id: 'neq', name: '!=' },
  { id: 'include', name: 'include' },
  { id: 'exclude', name: 'exclude' },
  { id: 'reg', name: 'regex' },
  { id: 'nreg', name: 'nregex' },
];
// log 监控条件
export const LOG_CONDITION_METHOD_LIST = [
  { id: 'is', name: 'is' },
  { id: 'is one of', name: 'is one of' },
  { id: 'is not', name: 'is not' },
  { id: 'is not one of', name: 'is not one of' },
];
// string 监控条件
export const STRING_CONDITION_METHOD_LIST = [
  { id: 'eq', name: '=' },
  { id: 'neq', name: '!=' },
  { id: 'include', name: 'include' },
  { id: 'exclude', name: 'exclude' },
  { id: 'reg', name: 'regex' },
  { id: 'nreg', name: 'nregex' },
];

// 监控条件 设置条件
export const CONDITION = [
  // { id: 'or', name: 'OR' },
  { id: 'and', name: 'AND' },
];

// 监控条件
export type IConditionItem = {
  condition?: string; // 判断条件
  key?: string; // 维度
  method?: string; // 方法
  value?: string[]; // 值
};

// 监控条件列表item
export interface IConditionMethodItem {
  label: string;
  value: string;
}
// 通用列表item
export interface ICommonItem {
  type?: string;
  id: string;
  name: string;
}
