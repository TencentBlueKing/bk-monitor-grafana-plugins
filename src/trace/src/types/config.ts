import type { DataSourceJsonData } from '@grafana/data';

// config editor 数据
export interface QueryOption extends DataSourceJsonData {
  baseUrl?: string; // api base url
  bizId?: string;
  keepCookies?: string[];
  useToken?: boolean;
}

export interface SecureOption {
  token?: string;
}
