import { dateTime, type DataQueryRequest, type DataSourceInstanceSettings, type ScopedVars } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';

import DashboardDatasource, { QueryUrl, variableRegex } from './datasource';
import type { QueryOption } from '../typings/config';
import type { QueryData } from '../typings/datasource';

jest.mock('@grafana/runtime', () => ({ getTemplateSrv: jest.fn() }));
jest.mock('common/utils/api-cache', () => ({}), { virtual: true });
jest.mock('common/utils/utils', () => ({ random: () => 'test' }), { virtual: true });
jest.mock('../utils/common', () => ({}));

describe('PromQL $__rate_interval', () => {
  let datasource: DashboardDatasource;
  let request: jest.SpyInstance;

  beforeEach(() => {
    // Emulate Grafana's scoped variable interpolation while keeping unknown variables intact.
    (getTemplateSrv as jest.Mock).mockReturnValue({
      replace: (text: string, scopedVars: ScopedVars = {}) =>
        text.replace(variableRegex, (match, name, legacyName, _legacyFormat, bracedName) => {
          const variable = scopedVars[name || legacyName || bracedName];
          return variable ? String(variable.value) : match;
        }),
    });
    datasource = new DashboardDatasource({
      jsonData: { baseUrl: '', bizId: '2', useToken: true },
    } as DataSourceInstanceSettings<QueryOption>);
    request = jest.spyOn(datasource, 'request').mockResolvedValue({ series: [], metrics: [] });
    jest.spyOn(datasource, 'buildFetchSeries').mockReturnValue([]);
  });

  afterEach(() => jest.restoreAllMocks());

  const runQuery = (targets: Array<Partial<QueryData>>, intervalMs = 10000, scopedVars: ScopedVars = {}) =>
    datasource.query({
      requestId: 'test',
      timezone: 'utc',
      app: 'dashboard',
      startTime: 0,
      targets: targets.map(target => ({
        refId: 'A',
        mode: 'code',
        source: 'rate(counter[$__rate_interval])',
        ...target,
      })),
      interval: `${intervalMs}ms`,
      intervalMs,
      range: {
        from: dateTime(0),
        to: dateTime(3600000),
        raw: { from: dateTime(0), to: dateTime(3600000) },
      },
      scopedVars: {
        __interval: { text: `${intervalMs}ms`, value: `${intervalMs}ms` },
        __interval_ms: { text: intervalMs, value: intervalMs },
        ...scopedVars,
      },
    } as DataQueryRequest<QueryData>);

  it('supports existing data sources with no scrape interval configuration', async () => {
    await runQuery([{}]);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: QueryUrl.graph_promql_query,
        data: expect.objectContaining({ promql: 'rate(counter[60s])', step: 'auto' }),
      })
    );
  });

  it.each(['', 'auto'])('uses the configured scrape interval when Min Step is "%s"', async step => {
    datasource.configData.timeInterval = '1m';
    await runQuery([{ step }]);
    expect(request.mock.calls[0][0].data.promql).toBe('rate(counter[240s])');
  });

  it('expands the window with the panel interval when zooming out', async () => {
    datasource.configData.timeInterval = '1m';
    await runQuery([{}], 300000);
    expect(request.mock.calls[0][0].data.promql).toBe('rate(counter[360s])');
  });

  it('calculates each target independently and leaves query steps unchanged', async () => {
    datasource.configData.timeInterval = '1m';
    await runQuery([{ step: '30s' }, { refId: 'B', step: '2m' }]);
    expect(request.mock.calls.map(([params]) => [params.data.promql, params.data.step])).toEqual([
      ['rate(counter[120s])', '30s'],
      ['rate(counter[480s])', '2m'],
    ]);
  });

  it.each(['$scrape', '${scrape}', '[[scrape]]'])('resolves Min Step variable %s before calculating', async step => {
    await runQuery([{ step }], 10000, { scrape: { text: '1m', value: '1m' } });
    expect(request.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        promql: 'rate(counter[240s])',
        step: '1m',
      })
    );
  });

  it('preserves interval, range, and dashboard variables alongside all rate interval syntaxes', async () => {
    await runQuery(
      [
        {
          source:
            'rate(counter{job="$job"}[$__rate_interval]) + increase(counter[${__rate_interval}]) + ' +
            'sum_over_time(counter[[[__rate_interval]]]) + $__interval_ms + ${__range_s}',
          step: '$__interval',
        },
      ],
      30000,
      { job: { text: 'api', value: 'api' } }
    );
    expect(request.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        promql:
          'rate(counter{job="api"}[120s]) + increase(counter[120s]) + ' + 'sum_over_time(counter[120s]) + 30000 + 3600',
        step: '30000ms',
      })
    );
  });

  it('supports the legacy only_promql query flag', async () => {
    await runQuery([{ mode: undefined, only_promql: true }]);
    expect(request.mock.calls[0][0].data.promql).toBe('rate(counter[60s])');
  });

  it.each(['invalid', '0s', '-1s'])('falls back for an invalid datasource scrape interval: %s', async interval => {
    datasource.configData.timeInterval = interval;
    await runQuery([{}]);
    expect(request.mock.calls[0][0].data.promql).toBe('rate(counter[60s])');
  });

  it('keeps sub-second windows valid PromQL durations', async () => {
    await runQuery([{ step: '250ms' }], 1100);
    expect(request.mock.calls[0][0].data.promql).toBe('rate(counter[1350ms])');
  });
});
