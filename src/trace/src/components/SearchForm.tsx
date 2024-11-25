import { css } from '@emotion/css';
import { type SelectableValue, toOption } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { fuzzyMatch, InlineField, InlineFieldRow, Input, Select } from '@grafana/ui';
// import { notifyApp } from 'grafana/app/core/actions';
// import { createErrorNotification } from 'grafana/app/core/copy/appNotification';
// import { dispatch } from 'grafana/app/store/store';
import React, { useCallback, useEffect, useState } from 'react';

import { type JaegerDatasource } from '../datasource';
import { type JaegerQuery } from '../types';
import { transformToLogfmt } from '../util';

const durationPlaceholder = 'e.g. 1.2s, 100ms, 500us';

type Props = {
  datasource: JaegerDatasource;
  query: JaegerQuery;
  onChange: (value: JaegerQuery) => void;
};

export const ALL_OPERATIONS_KEY = 'All';
const allOperationsOption: SelectableValue<string> = {
  label: ALL_OPERATIONS_KEY,
  value: undefined,
};

export function SearchForm({ datasource, query, onChange }: Props) {
  const [appOptions, setAppOptions] = useState<Array<SelectableValue<string>>>();
  const [serviceOptions, setServiceOptions] = useState<Array<SelectableValue<string>>>();
  const [operationOptions, setOperationOptions] = useState<Array<SelectableValue<string>>>();
  const [isLoading, setIsLoading] = useState<{
    app: boolean;
    services: boolean;
    operations: boolean;
  }>({
    app: false,
    services: false,
    operations: false,
  });

  const loadOptions = useCallback(
    async (url: string, loaderOfType: string, query = ''): Promise<Array<SelectableValue<string>>> => {
      setIsLoading(prevValue => ({ ...prevValue, [loaderOfType]: true }));

      try {
        const values: null | string[] = await datasource.metadataRequest(url);
        if (!values) {
          return [{ label: `No ${loaderOfType} found`, value: `No ${loaderOfType} found` }];
        }

        const options: SelectableValue[] = values.sort().map(option => ({
          label: option,
          value: option,
        }));

        const filteredOptions = options.filter(item => (item.value ? fuzzyMatch(item.value, query).found : false));
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
    const getServices = async () => {
      const services = await loadOptions('/api/services', 'services');
      if (query.service && getTemplateSrv().containsTemplate(query.service)) {
        services.push(toOption(query.service));
      }
      setServiceOptions(services);
    };
    getServices();
  }, [datasource, loadOptions, query.service]);

  useEffect(() => {
    const getOperations = async () => {
      const operations = await loadOptions(
        `/api/services/${encodeURIComponent(getTemplateSrv().replace(query.service!))}/operations`,
        'operations',
      );
      if (query.operation && getTemplateSrv().containsTemplate(query.operation)) {
        operations.push(toOption(query.operation));
      }
      setOperationOptions([allOperationsOption, ...operations]);
    };
    if (query.service) {
      getOperations();
    }
  }, [datasource, query.service, loadOptions, query.operation]);

  return (
    <div className={css({ maxWidth: '500px' })}>
      <InlineFieldRow>
        <InlineField
          label='App Name'
          labelWidth={14}
          grow
        >
          <Select
            allowCustomValue={true}
            aria-label={'select-app-name'}
            inputId='app'
            isLoading={isLoading.app}
            menuPlacement='bottom'
            options={appOptions}
            placeholder='Select a App'
            value={appOptions?.find(v => v?.value === query.app) || undefined}
            isClearable
            onChange={v =>
              onChange({
                ...query,
                app: v?.value!,
                service: query.app !== v?.value ? undefined : query.service,
                operation: query.app !== v?.value ? undefined : query.operation,
              })
            }
            onOpenMenu={() => loadOptions('/api/services', 'services')}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField
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
            onOpenMenu={() => loadOptions('/api/services', 'services')}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField
          disabled={!query.service}
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
            onOpenMenu={() =>
              loadOptions(
                `/api/services/${encodeURIComponent(getTemplateSrv().replace(query.service!))}/operations`,
                'operations',
              )
            }
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
            id='minDuration'
            name='minDuration'
            placeholder={durationPlaceholder}
            value={query.minDuration || ''}
            onChange={v =>
              onChange({
                ...query,
                minDuration: v.currentTarget.value,
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
            id='maxDuration'
            name='maxDuration'
            placeholder={durationPlaceholder}
            value={query.maxDuration || ''}
            onChange={v =>
              onChange({
                ...query,
                maxDuration: v.currentTarget.value,
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
                limit: v.currentTarget.value ? parseInt(v.currentTarget.value, 10) : undefined,
              })
            }
          />
        </InlineField>
      </InlineFieldRow>
    </div>
  );
}

export default SearchForm;
