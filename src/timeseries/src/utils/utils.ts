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
export const getCookie = (name: string): null | string => {
  const reg = new RegExp(`(^|)${name}=([^;]*)(;|$)`);
  const data = document.cookie.match(reg);
  if (data) {
    return unescape(data[2]);
  }
  return null;
};
const language = getCookie('blueking_language');
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

export const createMetricTitleTooltips = (metricData: any) => {
  const data = metricData;
  const curActive = `${data.data_source_label}_${data.data_type_label}`;
  const options = [
    // 公共展示项
    { label: getEnByName('指标名'), val: data.metric_field },
    { label: getEnByName('指标别名'), val: data.metric_field_name },
    { label: getEnByName('指标来源'), val: data.data_source_label },
    { label: getEnByName('监控对象'), val: data.result_table_label_name },
  ];
  const elList = {
    bk_data_time_series: [
      // 数据平台
      ...options,
      { label: getEnByName('表名'), val: data.result_table_id },
    ],
    bk_log_search_time_series: [
      // 日志采集
      ...options,
      { label: getEnByName('索引集'), val: data.related_name },
      { label: getEnByName('索引'), val: data.result_table_id },
      { label: getEnByName('数据源类别'), val: data.extend_fields?.scenario_name },
      { label: getEnByName('数据源名'), val: data.extend_fields?.storage_cluster_name },
    ],
    bk_monitor_log: [...options],
    bk_monitor_time_series: [
      // 监控采集
      ...options,
      { label: getEnByName('插件ID'), val: data.related_id },
      { label: getEnByName('插件名'), val: data.related_name },
      { label: getEnByName('分类ID'), val: data.result_table_id },
      { label: getEnByName('分类名'), val: data.result_table_name },
      { label: getEnByName('含义'), val: data.description },
    ],
    custom_time_series: [
      // 自定义指标
      ...options,
      { label: getEnByName('数据ID'), val: data.extend_fields?.bk_data_id },
      { label: getEnByName('数据名'), val: data.result_table_name },
    ],
  };
  // 拨测指标融合后不需要显示插件id插件名
  const resultTableLabel = data.result_table_label;
  const relatedId = data.related_id;
  if (resultTableLabel === 'uptimecheck' && !relatedId) {
    const list = elList.bk_monitor_time_series;
    elList.bk_monitor_time_series = list.filter(
      item => item.label !== getEnByName('插件ID') && item.label !== getEnByName('插件名'),
    );
  }
  const curElList = (elList as any)[curActive] || [...options];
  let content =
    curActive === 'bk_log_search_time_series'
      ? `<div class="popover-metric-title">${[data.related_name, data.metric_field].filter(Boolean).join('.')}</div>\n`
      : `<div class="popover-metric-title">${[data.result_table_id, data.metric_field]
          .filter(Boolean)
          .join('.')}</div>\n`;
  if (data.collect_config) {
    const collectorConfig = data.collect_config
      .split(';')
      .map(item => `<div>${item}</div>`)
      .join('');
    curElList.splice(0, 0, { label: getEnByName('采集配置'), val: collectorConfig });
  }

  if (data.metric_field === data.metric_field_name) {
    const index = curElList.indexOf((item: { label: string }) => item.label === getEnByName('指标别名'));
    curElList.splice(index, 1);
  }
  curElList.forEach((item: { label: any; val: any }) => {
    content += `<div class="popover-metric-item"><div>${item.label}：${item.val || '--'}</div></div>\n`;
  });
  content += `<div class="popover-metric-item"><div>${getEnByName('单位')}：${metricData.unit || '--'}</div></div>\n`;
  content += `<div class="popover-metric-item"><div>${getEnByName('采集步长')}：${metricData.collect_interval || '--'}${
    metricData.collect_interval ? 'm' : ''
  }</div></div>\n`;
  return content;
};
