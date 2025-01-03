import { DataSourcePlugin } from '@grafana/data';

import { QueryEditor } from './components/QueryEditor';
import { ConfigEditor } from './configuration/ConfigEditor';
import TraceDatasource from './datasource';

export const plugin = new DataSourcePlugin(TraceDatasource).setConfigEditor(ConfigEditor).setQueryEditor(QueryEditor);
