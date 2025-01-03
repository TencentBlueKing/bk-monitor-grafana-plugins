import { get as _get } from 'lodash';
export const FALLBACK_DAG_MAX_NUM_SERVICES = 100;

export const defaultConfig = Object.defineProperty(
  {
    archiveEnabled: false,
    dependencies: {
      dagMaxNumServices: FALLBACK_DAG_MAX_NUM_SERVICES,
      menuEnabled: true,
    },
    linkPatterns: [],
    search: {
      maxLookback: {
        label: '2 Days',
        value: '2d',
      },
      maxLimit: 1500,
    },
    tracking: {
      gaID: null,
      trackErrors: true,
    },
  },
  // 应该单独合并而不是整体替换的字段
  '__mergeFields',
  { value: ['dependencies', 'search', 'tracking'] },
);
/**
 * 将来自查询服务的嵌入配置（如果存在）与…合并
 */
export default function getConfig() {
  return defaultConfig;
}

export function getConfigValue(path: string) {
  return _get(getConfig(), path);
}
