import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoGrid } from '@common/components/InfoGrid'
import { EmptyState, PageHeader, PageSection } from '@common/components/Page'
import { getServerInfo } from '../api/server'
import { formatFileSize } from '../utils/format'

export default function ServerOverview() {
  const [data, setData] = useState({
    version: '',
    bindPort: 0,
    kcpBindPort: 0,
    quicBindPort: 0,
    vhostHTTPPort: 0,
    vhostHTTPSPort: 0,
    tcpmuxHTTPConnectPort: 0,
    subdomainHost: '',
    maxPoolCount: 0,
    maxPortsPerClient: 0,
    heartbeatTimeout: 0,
    allowPortsStr: '',
    tlsForce: false,
    clientCounts: 0,
    curConns: 0,
    totalTrafficIn: 0,
    totalTrafficOut: 0,
    proxyTypeCount: {} as Record<string, number>,
  })

  useEffect(() => {
    getServerInfo()
      .then((info) => setData((value) => ({ ...value, ...info, proxyTypeCount: info.proxyTypeCount || {} })))
      .catch((err: any) => toast.error('获取服务端信息失败：' + (err.message || '未知错误')))
  }, [])

  const proxyTypeEntries = useMemo(
    () => Object.entries(data.proxyTypeCount).filter(([, count]) => count > 0),
    [data.proxyTypeCount],
  )
  const proxyTotal = proxyTypeEntries.reduce((sum, [, count]) => sum + count, 0)
  const configItems: Array<readonly [string, string | number]> = [
    ['版本', data.version ? `v${data.version}` : '-'],
    ['Bind Port', data.bindPort || '-'],
    ['KCP Port', data.kcpBindPort || '-'],
    ['QUIC Port', data.quicBindPort || '-'],
    ['HTTP Port', data.vhostHTTPPort || '-'],
    ['HTTPS Port', data.vhostHTTPSPort || '-'],
    ['TCPMux Port', data.tcpmuxHTTPConnectPort || '-'],
    ['Subdomain Host', data.subdomainHost || '-'],
    ['Max Pool Count', data.maxPoolCount || '-'],
    ['Max Ports / Client', data.maxPortsPerClient === 0 ? 'no limit' : data.maxPortsPerClient],
    ['Allow Ports', data.allowPortsStr || '-'],
    ['TLS Force', data.tlsForce ? 'enabled' : 'disabled'],
    ['Heartbeat Timeout', `${data.heartbeatTimeout}s`],
  ]

  return (
    <PageSection>
      <PageHeader title="服务端总览" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="客户端" value={data.clientCounts} subtitle="当前已连接实例" />
        <StatCard label="代理数" value={proxyTotal} subtitle="当前活跃代理" />
        <StatCard label="连接数" value={data.curConns} subtitle="实时连接数" />
        <Card>
          <CardHeader>
            <CardDescription>今日流量</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ArrowDownIcon />
              <span className="font-semibold">{formatFileSize(data.totalTrafficIn)}</span>
              <span className="text-muted-foreground">入站</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpIcon />
              <span className="font-semibold">{formatFileSize(data.totalTrafficOut)}</span>
              <span className="text-muted-foreground">出站</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>代理类型</CardTitle>
          </CardHeader>
          <CardContent>
            {proxyTypeEntries.length === 0 ? (
              <EmptyState title="暂无活跃代理" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {proxyTypeEntries.map(([type, count]) => (
                  <Badge key={type} variant="secondary">
                    {type.toUpperCase()} {count}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>运行参数</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoGrid items={configItems} />
          </CardContent>
        </Card>
      </div>
    </PageSection>
  )
}

function StatCard({ label, value, subtitle }: { label: string; value: number; subtitle: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="text-3xl font-semibold">{value}</div>
        <CardDescription>{subtitle}</CardDescription>
      </CardContent>
    </Card>
  )
}
