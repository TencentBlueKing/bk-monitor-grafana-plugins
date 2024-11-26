import { css } from '@emotion/css';
import type { QueryEditorProps } from '@grafana/data';
import {
  Button,
  FileDropzone,
  HorizontalGroup,
  InlineField,
  InlineFieldRow,
  Modal,
  QueryField,
  RadioButtonGroup,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import React, { useState } from 'react';

import type { JaegerDatasource } from '../datasource';
import type { JaegerQuery, JaegerQueryType } from '../types';
import { SearchForm } from './SearchForm';

type Props = QueryEditorProps<JaegerDatasource, JaegerQuery>;

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const theme = useTheme2();
  const styles = useStyles2(getStyles);

  const onChangeQuery = (value: string) => {
    const nextQuery: JaegerQuery = { ...query, query: value };
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
                  { value: 'dependencyGraph', label: 'Dependency graph' },
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
              <Button
                size='sm'
                variant='secondary'
                onClick={() => {
                  setUploadModalOpen(true);
                }}
              >
                Import trace
              </Button>
            </HorizontalGroup>
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
