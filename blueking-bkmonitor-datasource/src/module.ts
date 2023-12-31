import { loadPluginCss } from '@grafana/runtime';
import Datasource from './datasource/datasource';
import ConfigEditor from './configuration/config-editor';
import QueryEditor from './components/query-editor';
import VariableQueryEditor from './components/variable-editor';
import { DataSourcePlugin } from '@grafana/data';
loadPluginCss({
  dark: 'plugins/blueking-bkmonitor-datasource/dark.css',
  light: 'plugins/blueking-bkmonitor-datasource/light.css',
});
  export const plugin = new DataSourcePlugin(Datasource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setVariableQueryEditor(VariableQueryEditor);
