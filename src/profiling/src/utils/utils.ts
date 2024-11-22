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

import enData from '../lang/en.json';

/**
 * @description: 生成随机字符串
 * @param {number} n 长度
 * @return {*}
 */
export const random = (n: number, str = 'abcdefghijklmnopqrstuvwxyz0123456789'): string => {
  // 生成n位长度的字符串
  let result = '';
  for (let i = 0; i < n; i++) {
    result += str[parseInt(String(Math.random() * str.length))];
  }
  return result;
};
/**
 * @description: 获取cookie
 * @param {string} name cookie名称
 * @return {*}
 */
export const getCookie = (name: string): string => {
  const reg = new RegExp(`(^|)${name}=([^;]*)(;|$)`);
  const data = document.cookie.match(reg);
  if (data) {
    return unescape(data[2]);
  }
  return '';
};
export const language = getCookie('blueking_language');
/**
 * @description: 获取翻译
 * @param {string} name 翻译字符
 * @param {string} lang 语言
 * @return {*}
 */
export const getEnByName = (name: string, lang = language): string => {
  if (process.env.NODE_ENV === 'development' && !enData[name]) {
    console.log(`翻译缺失：${name}`);
  }
  return lang === 'en' ? enData[name] || name : name;
};
