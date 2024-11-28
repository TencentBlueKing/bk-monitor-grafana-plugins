import { css } from '@emotion/css';
import { type SelectableValue, toOption } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { fuzzyMatch, InlineField, InlineFieldRow, Input, Select } from '@grafana/ui';
// import { notifyApp } from 'grafana/app/core/actions';
// import { createErrorNotification } from 'grafana/app/core/copy/appNotification';
// import { dispatch } from 'grafana/app/store/store';
import React, { useCallback, useEffect, useState } from 'react';

import type TraceDatasource from '../datasource';
import type { TraceQuery } from '../types';
import { transformToLogfmt } from '../util';

const durationPlaceholder = 'e.g. 1.2s, 100ms, 500us';

type Props = {
  datasource: TraceDatasource;
  query: TraceQuery;
  onChange: (value: TraceQuery) => void;
};

export function SearchForm({ datasource, query, onChange }: Props) {
  const [serviceOptions, setServiceOptions] = useState<Array<SelectableValue<string>>>();
  const [operationOptions, setOperationOptions] = useState<Array<SelectableValue<string>>>();
  const [isLoading, setIsLoading] = useState<{
    services: boolean;
    operations: boolean;
  }>({
    services: false,
    operations: false,
  });

  const loadOptions = useCallback(
    async (
      loaderOfType: keyof typeof isLoading,
      field: string,
      keyword = '',
    ): Promise<Array<SelectableValue<string>>> => {
      setIsLoading(prevValue => ({ ...prevValue, [loaderOfType]: true }));

      try {
        const values = await datasource.loadOptions(query.app_name!, field);
        if (!values?.length) {
          return [{ label: `No ${loaderOfType} found`, value: `No ${loaderOfType} found` }];
        }

        const options: SelectableValue[] = values.sort().map(option => ({
          label: option.text,
          value: option.value,
        }));

        const filteredOptions = options.filter(item => (item.value ? fuzzyMatch(item.value, keyword).found : false));
        return filteredOptions;
      } catch (error) {
        // if (error instanceof Error) {
        //   dispatch(notifyApp(createErrorNotification('Error', error)));
        // }
        return [];
      } finally {
        setIsLoading(prevValue => ({ ...prevValue, [loaderOfType]: false }));
      }
    },
    [datasource],
  );

  useEffect(() => {
    const getOperations = async () => {
      const operations = await loadOptions('operations', 'span_name');
      if (query.operation && getTemplateSrv().containsTemplate(query.operation)) {
        operations.push(toOption(query.operation));
      }
      setOperationOptions([...operations]);
    };
    if (query.app_name) {
      getOperations();
    }
  }, [datasource, query.app_name, loadOptions]);
  useEffect(() => {
    const getServices = async () => {
      const operations = await loadOptions('services', 'resource.service.name');
      if (query.service && getTemplateSrv().containsTemplate(query.service)) {
        operations.push(toOption(query.service));
      }
      setServiceOptions([...operations]);
    };
    if (query.app_name) {
      getServices();
    }
  }, [datasource, query.app_name, loadOptions]);
  return (
    <div className={css({ maxWidth: '500px' })}>
      <InlineFieldRow>
        <InlineField
          disabled={!query.app_name}
          label='Service Name'
          labelWidth={14}
          grow
        >
          <Select
            allowCustomValue={true}
            aria-label={'select-service-name'}
            inputId='service'
            isLoading={isLoading.services}
            menuPlacement='bottom'
            options={serviceOptions}
            placeholder='Select a service'
            value={serviceOptions?.find(v => v?.value === query.service) || undefined}
            isClearable
            onChange={v =>
              onChange({
                ...query,
                service: v?.value!,
                operation: query.service !== v?.value ? undefined : query.operation,
              })
            }
            onOpenMenu={() => loadOptions('services', 'resource.service.name')}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField
          disabled={!query.app_name}
          label='Operation Name'
          labelWidth={14}
          grow
        >
          <Select
            allowCustomValue={true}
            aria-label={'select-operation-name'}
            inputId='operation'
            isLoading={isLoading.operations}
            menuPlacement='bottom'
            options={operationOptions}
            placeholder='Select an operation'
            value={operationOptions?.find(v => v.value === query.operation) || null}
            isClearable
            onChange={v =>
              onChange({
                ...query,
                operation: v?.value! || undefined,
              })
            }
            onOpenMenu={() => loadOptions('operations', 'span_name')}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField
          label='Tags'
          labelWidth={14}
          tooltip='Values should be in logfmt.'
          grow
        >
          <Input
            id='tags'
            placeholder='http.status_code=200 error=true'
            value={transformToLogfmt(query.tags)}
            onChange={v =>
              onChange({
                ...query,
                tags: v.currentTarget.value,
              })
            }
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField
          label='Min Duration'
          labelWidth={14}
          grow
        >
          <Input
            id='min_duration'
            name='min_duration'
            placeholder={durationPlaceholder}
            value={query.min_duration || ''}
            onChange={v =>
              onChange({
                ...query,
                min_duration: v.currentTarget.value,
              })
            }
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField
          label='Max Duration'
          labelWidth={14}
          grow
        >
          <Input
            id='max_duration'
            name='max_duration'
            placeholder={durationPlaceholder}
            value={query.max_duration || ''}
            onChange={v =>
              onChange({
                ...query,
                max_duration: v.currentTarget.value,
              })
            }
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField
          label='Limit'
          labelWidth={14}
          tooltip='Maximum number of returned results'
          grow
        >
          <Input
            id='limit'
            name='limit'
            type='number'
            value={query.limit || ''}
            onChange={v =>
              onChange({
                ...query,
                limit: v.currentTarget.value ? Number.parseInt(v.currentTarget.value, 10) : undefined,
              })
            }
          />
        </InlineField>
      </InlineFieldRow>
    </div>
  );
}

export default SearchForm;
