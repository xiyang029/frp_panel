import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { InfoGrid } from '@common/components/InfoGrid'
import { EmptyState, LoadingState, PageSection } from '@common/components/Page'
import { getProxyByName, getProxyTraffic } from '../api/proxy'
import type { ProxyStatsInfo, TrafficResponse } from '../types/proxy'

const TRAFFIC_DAYS = 7

const trafficChartConfig = {
  trafficIn: {
    label: '入站',
    color: 'hsl(var(--chart-1))',
  },
  trafficOut: {
    label: '出站',
    color: 'hsl(var(--chart-2))',
  },
} as const

type TrafficChartPoint = {
  date: string
  trafficIn: number
  trafficOut: number
}

function formatTrafficSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const unit = sizes[i] || sizes[sizes.length - 1]
  const value = bytes / Math.pow(k, i)

  return `${value.toFixed(1)} ${unit}`
}

function formatTrafficDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export default function ProxyDetail() {
  const { name = '' } = useParams()
  const [proxy, setProxy] = useState<ProxyStatsInfo | null>(null)
  const [traffic, setTraffic] = useState<TrafficResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const decodedName = decodeURIComponent(name)
        const [proxyData, trafficData] = await Promise.all([
          getProxyByName(decodedName),
          getProxyTraffic(decodedName).catch(() => null),
        ])
        setProxy(proxyData)
        setTraffic(trafficData)
      } catch (err: any) {
        if (err?.status === 404) {
          setNotFound(true)
        } else {
          toast.error('获取代理详情失败：' + (err.message || '未知错误'))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [name])

  const trafficSummary = useMemo(() => {
    const inTotal =
      traffic?.trafficIn?.reduce((sum, value) => sum + value, 0) || 0
    const outTotal =
      traffic?.trafficOut?.reduce((sum, value) => sum + value, 0) || 0
    return { inTotal, outTotal }
  }, [traffic])

  const trafficChartData = useMemo<TrafficChartPoint[]>(() => {
    const trafficIn = traffic?.trafficIn || []
    const trafficOut = traffic?.trafficOut || []

    const now = new Date()

    return Array.from({ length: TRAFFIC_DAYS }, (_, index) => {
      const sourceIndex = TRAFFIC_DAYS - 1 - index
      const date = new Date(now)
      date.setDate(date.getDate() - sourceIndex)

      return {
        date: formatTrafficDate(date),
        trafficIn: trafficIn[sourceIndex] || 0,
        trafficOut: trafficOut[sourceIndex] || 0,
      }
    })
  }, [traffic])

  if (loading) return <LoadingState />
  if (notFound || !proxy) return <EmptyState title="代理不存在" />

  const infoItems: Array<[string, string | number]> = [
    ['名称', proxy.name],
    ['类型', (proxy.type || '-').toUpperCase()],
    ['状态', proxy.status || '-'],
    ['用户', proxy.user || '-'],
    ['Client ID', proxy.clientID || '-'],
    ['当前连接', proxy.curConns],
    ['今日入站', formatTrafficSize(proxy.todayTrafficIn)],
    ['今日出站', formatTrafficSize(proxy.todayTrafficOut)],
    ['最近启动', proxy.lastStartTime || '-'],
    ['最近关闭', proxy.lastCloseTime || '-'],
  ]

  return (
    <PageSection>
      <div className="space-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/proxies">代理列表</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{proxy.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基础信息</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoGrid items={infoItems} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>最近 7 天流量</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoGrid
              items={[
                ['入站', formatTrafficSize(trafficSummary.inTotal)],
                ['出站', formatTrafficSize(trafficSummary.outTotal)],
              ]}
            />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>最近 7 天趋势</CardTitle>
        </CardHeader>
        <CardContent>
          {traffic ? (
            <>
              <ChartContainer
                config={trafficChartConfig}
                className="h-80 w-full"
              >
                <BarChart
                  data={trafficChartData}
                  margin={{ top: 12, right: 0, left: 12, bottom: 0 }}
                  barCategoryGap="24%"
                  barGap={8}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    padding={{ left: 12, right: 12 }}
                  />
                  <YAxis
                    width={85}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    tickFormatter={(value) => formatTrafficSize(Number(value))}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.45)' }}
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          formatTrafficSize(Number(value)),
                          name === 'trafficIn' ? '入站' : '出站',
                        ]}
                      />
                    }
                  />
                  <Bar
                    dataKey="trafficIn"
                    fill="var(--color-trafficIn)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="trafficOut"
                    fill="var(--color-trafficOut)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ChartContainer>
            </>
          ) : (
            <EmptyState
              title="暂无最近 7 天流量"
              description="接口未返回历史流量数据"
            />
          )}
        </CardContent>
      </Card>
    </PageSection>
  )
}
