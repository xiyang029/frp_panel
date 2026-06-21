package prometheus

import (
	"testing"

	"github.com/prometheus/client_golang/prometheus"
	dto "github.com/prometheus/client_model/go"
	"github.com/stretchr/testify/require"
)

func TestServerMetricsRemoveProxyDeletesDetailedMetrics(t *testing.T) {
	require := require.New(t)

	previousRegisterer := prometheus.DefaultRegisterer
	previousGatherer := prometheus.DefaultGatherer
	registry := prometheus.NewRegistry()
	prometheus.DefaultRegisterer = registry
	prometheus.DefaultGatherer = registry
	t.Cleanup(func() {
		prometheus.DefaultRegisterer = previousRegisterer
		prometheus.DefaultGatherer = previousGatherer
	})

	metrics := newServerMetrics()
	metrics.NewProxy("proxy", "tcp", "", "")
	metrics.OpenConnection("proxy", "tcp")
	metrics.AddTrafficIn("proxy", "tcp", 10)
	metrics.AddTrafficOut("proxy", "tcp", 20)

	require.Len(readMetricLabels(t, metrics.proxyCountDetailed), 1)
	require.Len(readMetricLabels(t, metrics.connectionCount), 1)
	require.Len(readMetricLabels(t, metrics.trafficIn), 1)
	require.Len(readMetricLabels(t, metrics.trafficOut), 1)

	metrics.RemoveProxy("proxy", "tcp")

	require.Empty(readMetricLabels(t, metrics.proxyCountDetailed))
	require.Empty(readMetricLabels(t, metrics.connectionCount))
	require.Empty(readMetricLabels(t, metrics.trafficIn))
	require.Empty(readMetricLabels(t, metrics.trafficOut))
}

func readMetricLabels(t *testing.T, collector prometheus.Collector) []*dto.Metric {
	t.Helper()

	ch := make(chan prometheus.Metric, 16)
	collector.Collect(ch)
	close(ch)

	var metrics []*dto.Metric
	for metric := range ch {
		dtoMetric := &dto.Metric{}
		require.NoError(t, metric.Write(dtoMetric))
		metrics = append(metrics, dtoMetric)
	}
	return metrics
}
