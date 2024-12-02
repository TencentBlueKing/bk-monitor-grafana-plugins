import logfmt from 'logfmt';
import type { FilterParam } from './types';
export function convertTagsFilters<
  T extends string | undefined | Record<string, string | number | string[] | undefined>,
>(tags: T) {
  if (!tags) {
    return '';
  }
  let data: Partial<Record<string, string | boolean | number | null | string[]>>;
  if (typeof tags === 'string') {
    data = logfmt.parse(tags);
  } else {
    data = tags;
  }
  const filters: FilterParam[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key && value) {
      if (Array.isArray(value)) {
        filters.push({
          key,
          value,
          operator: 'equal',
        });
        continue;
      }
      filters.push({
        key,
        value: [typeof value !== 'string' ? String(value) : value],
        operator: 'equal',
      });
    }
  }
  return filters;
}

export function transformToLogfmt(tags: string | undefined) {
  if (!tags) {
    return '';
  }
  try {
    return logfmt.stringify(JSON.parse(tags));
  } catch {
    return tags;
  }
}
