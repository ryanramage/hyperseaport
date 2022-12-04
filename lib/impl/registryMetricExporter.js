const { ExportResultCode } = require('@opentelemetry/core')
const { AggregationTemporality } = require('@opentelemetry/sdk-metrics')

// this is just a knock off of
// https://github.com/open-telemetry/opentelemetry-js/blob/main/packages/sdk-metrics/src/export/ConsoleMetricExporter.ts

class RegistryMetricExporter {
  constructor (localRegistry) {
    this._shutdown = false
    this.localRegistry = localRegistry
  }

  export (metrics, resultCallback) {
    if (this._shutdown) {
      // If the exporter is shutting down, by spec, we need to return FAILED as export result
      setImmediate(resultCallback, { code: ExportResultCode.FAILED })
      return
    }
    return RegistryMetricExporter._sendMetrics(metrics, resultCallback)
  }

  forceFlush () {
    return Promise.resolve()
  }

  selectAggregationTemporality (_instrumentType) {
    return AggregationTemporality.CUMULATIVE
  }

  shutdown () {
    this._shutdown = true
    return Promise.resolve()
  }

  static _sendMetrics (metrics, done) {
    console.log(JSON.stringify(metrics, null, 4))
    // for (const scopeMetrics of metrics.scopeMetrics) {
    //   for (const metric of scopeMetrics.metrics) {
    //     console.dir({
    //       descriptor: metric.descriptor,
    //       dataPointType: metric.dataPointType
    //     });
    //     console.log(JSON.stringify(metric.dataPoints, null, 4))
    //   }
    // }
    const publicMetrics = filterMetrics(metrics)
    this.localRegistry.recordNodeLoadStats(publicMetrics)
    done({ code: ExportResultCode.SUCCESS })
  }
}
exports.RegistryMetricExporter = RegistryMetricExporter

function filterMetrics (metrics) {
  return metrics // todo filter
}
