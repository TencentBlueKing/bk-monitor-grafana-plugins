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
  // fields that should be individually merged vs wholesale replaced
  '__mergeFields',
  { value: ['dependencies', 'search', 'tracking'] },
);
/**
 * Merge the embedded config from the query service (if present) with the
 */
export default function getConfig() {
  return defaultConfig;
}

export function getConfigValue(path: string) {
  return _get(getConfig(), path);
}
