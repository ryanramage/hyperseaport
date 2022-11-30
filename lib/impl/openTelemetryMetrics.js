const { HostMetrics } = require('@opentelemetry/host-metrics');
const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');

module.exports = (options) => {
  if (!options.exporter) {
    throw new Error('An exporter must be provided')
  }
  let hostMetrics = options.hostMetrics
  if (!hostMetrics) {
    const meterProvider = options.meterProvider || new MeterProvider()
    const reader = new PeriodicExportingMetricReader({
      exporter: options.exporter,
      exportIntervalMillis: options.exportIntervalMillis || 4000
    })
    meterProvider.addMetricReader(reader)
    hostMetrics = new HostMetrics({ meterProvider })
  }
  const start = () => hostMetrics.start()
  return { start }
}
