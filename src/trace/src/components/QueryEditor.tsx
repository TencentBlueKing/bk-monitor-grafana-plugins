import { css } from '@emotion/css';
import type { QueryEditorProps, SelectableValue } from '@grafana/data';
import {
  Button,
  FileDropzone,
  HorizontalGroup,
  InlineField,
  InlineFieldRow,
  Modal,
  QueryField,
  RadioButtonGroup,
  Select,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import React, { useEffect, useState } from 'react';

import type TraceDatasource from '../datasource';
import type { TraceQuery, JaegerQueryType } from '../types';
import { SearchForm } from './SearchForm';

type Props = QueryEditorProps<TraceDatasource, TraceQuery>;

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [appLoading, setAppLoading] = useState(false);
  const [appOptions, setAppOptions] = useState<Array<SelectableValue<string>>>();

  const theme = useTheme2();
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
        // if (query.app_name && getTemplateSrv().containsTemplate(query.app_name)) {
        //   appList.push(toOption(query.app_name));
        // }
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
      <Modal
        isOpen={uploadModalOpen}
        title={'Upload trace'}
        onDismiss={() => setUploadModalOpen(false)}
      >
        <div className={css({ padding: theme.spacing(2) })}>
          <FileDropzone
            options={{ multiple: false }}
            onLoad={result => {
              datasource.uploadedJson = result;
              onChange({
                ...query,
                queryType: 'upload',
              });
              setUploadModalOpen(false);
              onRunQuery();
            }}
          />
        </div>
      </Modal>
      <div className={styles.container}>
        <InlineFieldRow>
          <InlineField
            grow={true}
            label='Query type'
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
              {/* <Button
                size='sm'
                variant='secondary'
                onClick={() => {
                  setUploadModalOpen(true);
                }}
              >
                Import trace
              </Button> */}
            </HorizontalGroup>
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow style={{ maxWidth: '500px' }}>
          <InlineField
            label='App Name'
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
              onChange={v =>
                onChange({
                  ...query,
                  app_name: v?.value!,
                  service: query.app_name !== v?.value ? undefined : query.service,
                  operation: query.app_name !== v?.value ? undefined : query.operation,
                })
              }
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
