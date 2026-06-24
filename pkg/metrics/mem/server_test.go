package mem

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	clocktesting "k8s.io/utils/clock/testing"
)

func TestServerMetricsUsesClockForProxyTimestamps(t *testing.T) {
	require := require.New(t)

	start := time.Date(2026, time.May, 8, 12, 30, 0, 0, time.UTC)
	clk := clocktesting.NewFakeClock(start)
	metrics := newServerMetricsWithClock(clk)

	metrics.NewProxy("proxy", "tcp", "user", "client-id")
	require.Equal(start, metrics.info.ProxyStatistics["proxy"].LastStartTime)

	closedAt := start.Add(time.Minute)
	clk.SetTime(closedAt)
	metrics.CloseProxy("proxy", "tcp")
	require.Equal(closedAt, metrics.info.ProxyStatistics["proxy"].LastCloseTime)
}

func TestServerMetricsClearUselessInfoUsesClock(t *testing.T) {
	require := require.New(t)

	start := time.Date(2026, time.May, 8, 12, 30, 0, 0, time.UTC)
	clk := clocktesting.NewFakeClock(start.Add(25 * time.Hour))
	metrics := newServerMetricsWithClock(clk)
	metrics.info.ProxyStatistics["proxy"] = &ProxyStatistics{
		Name:          "proxy",
		LastStartTime: start.Add(-time.Hour),
		LastCloseTime: start,
	}

	count, total := metrics.clearUselessInfo(24 * time.Hour)

	require.Equal(1, count)
	require.Equal(1, total)
	require.Empty(metrics.info.ProxyStatistics)
}

func TestServerMetricsRemoveProxyDeletesOfflineEntry(t *testing.T) {
	require := require.New(t)

	metrics := newServerMetrics()
	metrics.NewProxy("proxy", "tcp", "user", "client-id")
	metrics.CloseProxy("proxy", "tcp")

	require.NotNil(metrics.GetProxyByName("proxy"))

	metrics.RemoveProxy("proxy", "tcp")

	require.Nil(metrics.GetProxyByName("proxy"))
}
