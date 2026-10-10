# Tencent Blueking Monitor TimeSeries DataSource

> Note: This plugin requires Grafana version >= 7.5, for Grafana installation, please read [Download Grafana](https://grafana.com/grafana/download).

# Introduction

[Tencent Blueking Monitor](https://bk.tencent.com/docs/document/7.0/248/40001) is a part of Tencent Blueking Platform, is a product that monitors the host and Internet applications. The monitoring service can be used to collect monitoring metrics of host (system performance, component services, databases, logs, trace, etc.), detect the availability of Internet application services, and set alarms for metrics.

This datasource will help you query timeseries metric data from Tencent Blueking Monitor in your grafana.

# Get Started

Install the latest plugin using Grafana CLI:

```bash
$ grafana-cli plugins install bkmonitor-timeseries-datasource
```

# PromQL rate interval

PromQL queries support `$__rate_interval` (also `${__rate_interval}` and
`[[__rate_interval]]`), for example:

```promql
rate(http_requests_total[$__rate_interval])
```

The window is calculated per query as
`max($__interval + scrape_interval, 4 * scrape_interval)`.
Set **Scrape interval** in the data source configuration to the actual collection
period. It defaults to `15s` for existing data sources. In provisioned data sources,
use `jsonData.timeInterval`. A query's **Min Step**, including template variables,
overrides this setting; an empty or `auto` Min Step uses the data source setting.
For metrics collected every minute, configure `1m` to ensure a window of at least
`4m`. `$__interval` and the backend query step retain their existing behavior.

# Contact Us

If you have any questions using this app, you are welcome to [create an issue](https://github.com/TencentBlueKing/bk-monitor-grafana-plugins/issues/new).

# License
Tencent Blueking Monitor TimeSeries DataSource is delivered under the [MIT](https://raw.githubusercontent.com/TencentBlueKing/bk-monitor-grafana-plugins/master/LICENSE).
