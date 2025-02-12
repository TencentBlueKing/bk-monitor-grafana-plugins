import { css } from '@emotion/css';
import type { SelectableValue } from '@grafana/data';
import { fuzzyMatch, InlineField, InlineFieldRow, Input, Select } from '@grafana/ui';
import React, { useCallback, useEffect, useState } from 'react';

import type TraceDatasource from '../datasource';
import type { TraceQuery } from '../types';
import { transformToLogfmt } from '../util';
import { t } from 'common/utils/utils';
import { getTemplateSrv } from '@grafana/runtime';

const durationPlaceholder = 'e.g. 1.2s, 100ms, 500us';

type Props = {
  datasource: TraceDatasource; // datasource
  query: TraceQuery; // trace查询缓存
  onChange: (value: TraceQuery) => void;
};

export function SearchForm({ datasource, query, onChange }: Props) {
  const [serviceOptions, setServiceOptions] = useState<Array<SelectableValue<string>>>();
  const [spanOptions, setOperationOptions] = useState<Array<SelectableValue<string>>>();
  const [isLoading, setIsLoading] = useState<{
    services: boolean;
    spans: boolean;
  }>({
    services: false,
    spans: false,
  });

  // 获取服务、spans列表
  const loadOptions = useCallback(
    async (
      loaderOfType: keyof typeof isLoading,
      field: string,
      keyword = '',
    ): Promise<Array<SelectableValue<string>>> => {
      setIsLoading(prevValue => ({ ...prevValue, [loaderOfType]: true }));

      try {
        if (!query.app_name) return [];
        const values = await datasource.loadOptions(query.app_name, field);
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
        return [];
      } finally {
        setIsLoading(prevValue => ({ ...prevValue, [loaderOfType]: false }));
      }
    },
    [datasource],
  );

  useEffect(() => {
    const getSpans = async () => {
      const spansOptions = await loadOptions('spans', 'span_name');
      setOperationOptions([...spansOptions]);
    };
    query.app_name && getSpans();
  }, [datasource, query.app_name, loadOptions]);
  useEffect(() => {
    const getServices = async () => {
      const serviceOptions = await loadOptions('services', 'resource.service.name');
      if (query.service?.length && getTemplateSrv().containsTemplate()) {
        for (const service of query.service) {
          serviceOptions.push({
            label: service,
            value: service,
          });
        }
      }
      setServiceOptions([...serviceOptions]);
    };
    query.app_name && getServices();
  }, [datasource, query.app_name, loadOptions]);
  return (
    <div className={css({ maxWidth: '500px' })}>
      <InlineFieldRow>
        <InlineField
          disabled={!query.app_name}
          label={t('服务')}
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
            isMulti
            value={query.service || undefined}
            isClearable
            onChange={v => {
              onChange({
                ...query,
                service: v?.map(item => item.value) || [],
              });
            }}
            onOpenMenu={() => loadOptions('services', 'resource.service.name')}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField
          disabled={!query.app_name}
          label={t('接口')}
          labelWidth={14}
          grow
        >
          <Select
            allowCustomValue={true}
            isMulti
            aria-label={'select-spans-name'}
            inputId='spans'
            isLoading={isLoading.spans}
            menuPlacement='bottom'
            options={spanOptions}
            placeholder='Select an spans'
            value={query.spans || undefined}
            isClearable
            onChange={v =>
              onChange({
                ...query,
                spans: v?.map(item => item.value) || [],
              })
            }
            onOpenMenu={() => loadOptions('spans', 'span_name')}
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
          label={t('最小耗时')}
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
          label={t('最大耗时')}
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
          tooltip='Maximum number of returned results, default is 10'
          grow
        >
          <Input
            id='limit'
            name='limit'
            type='number'
            value={query.limit || ''}
            placeholder='e.g. 10'
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
