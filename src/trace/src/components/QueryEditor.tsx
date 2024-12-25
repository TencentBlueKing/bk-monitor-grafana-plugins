import { css } from '@emotion/css';
import type { QueryEditorProps, SelectableValue } from '@grafana/data';
import {
  Button,
  HorizontalGroup,
  InlineField,
  InlineFieldRow,
  QueryField,
  RadioButtonGroup,
  Select,
  useStyles2,
} from '@grafana/ui';
import React, { useEffect, useState } from 'react';

import type TraceDatasource from '../datasource';
import type { TraceQuery, JaegerQueryType } from '../types';
import { SearchForm } from './SearchForm';
import { t } from 'common/utils/utils';
import { getTemplateSrv } from '@grafana/runtime';

type Props = QueryEditorProps<TraceDatasource, TraceQuery>;

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const [appLoading, setAppLoading] = useState(false);
  const [appOptions, setAppOptions] = useState<Array<SelectableValue<string>>>();

  const styles = useStyles2(getStyles);

  useEffect(() => {
    setAppLoading(true);
    datasource.getListApplication().subscribe({
      next: data => {
        const appList =
          data?.map(item => ({
            value: item.app_name,
            label: item.app_name,
          })) || [];
        if (query.app_name && getTemplateSrv().containsTemplate(query.app_name)) {
          appList.push({
            value: query.app_name,
            label: query.app_name,
          });
        }
        setAppOptions(appList);
        if (data.length && !query.app_name) {
          onChange({
            ...query,
            app_name: data[0].app_name,
          });
        }
        setAppLoading(false);
      },
      error: () => {
        setAppOptions([]);
        setAppLoading(false);
      },
    });
  }, [datasource]);
  // trace_id查询图表
  const onChangeQuery = (value: string) => {
    const nextQuery: TraceQuery = { ...query, query: value };
    onChange(nextQuery);
  };
  const renderEditorBody = () => {
    switch (query.queryType) {
      case 'search':
        return (
          <SearchForm
            datasource={datasource}
            query={query}
            onChange={onChange}
          />
        );
      case 'dependencyGraph':
        return null;
      default:
        return (
          <InlineFieldRow>
            <InlineField
              label='Trace ID'
              labelWidth={14}
              grow
            >
              <QueryField
                placeholder={'Enter a Trace ID (run with Shift+Enter)'}
                portalOrigin='jaeger'
                query={query.query}
                onChange={onChangeQuery}
                onRunQuery={onRunQuery}
              />
            </InlineField>
          </InlineFieldRow>
        );
    }
  };

  return (
    <>
      <div className={styles.container}>
        <InlineFieldRow>
          <InlineField
            grow={true}
            label={t('查询方式')}
          >
            <HorizontalGroup
              align={'center'}
              justify={'space-between'}
              spacing={'sm'}
            >
              <RadioButtonGroup<JaegerQueryType>
                options={[
                  { value: 'search', label: 'Search' },
                  { value: undefined, label: 'TraceID' },
                  // { value: 'dependencyGraph', label: 'Dependency graph' },
                ]}
                size='md'
                value={query.queryType}
                onChange={v =>
                  onChange({
                    ...query,
                    queryType: v,
                  })
                }
              />
            </HorizontalGroup>
          </InlineField>
          <Button
            style={{ marginLeft: '10px' }}
            size='md'
            fill='solid'
            onClick={onRunQuery}
          >
            {t('查询')}
          </Button>
        </InlineFieldRow>
        <InlineFieldRow style={{ maxWidth: '500px' }}>
          <InlineField
            label={t('应用')}
            labelWidth={14}
            grow
          >
            <Select
              allowCustomValue={true}
              aria-label={'select-app-name'}
              inputId='app'
              isLoading={appLoading}
              menuPlacement='bottom'
              options={appOptions}
              placeholder='Select a App'
              value={appOptions?.find(v => v?.value === query.app_name) || undefined}
              isClearable={false}
              onChange={v => {
                onChange({
                  ...query,
                  app_name: v?.value,
                  service: query.app_name !== v?.value ? [] : query.service,
                  spans: query.app_name !== v?.value ? [] : query.spans,
                });
              }}
            />
          </InlineField>
        </InlineFieldRow>
        {renderEditorBody()}
      </div>
    </>
  );
}

const getStyles = () => ({
  container: css({
    width: '100%',
  }),
});
