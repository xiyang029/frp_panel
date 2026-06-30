import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { InfoGrid } from '@common/components/InfoGrid'
import { EmptyState, LoadingState, PageSection } from '@common/components/Page'
import { getClient } from '../api/client'
import { getProxiesV2 } from '../api/proxy'
import ProxyListCard from '../components/ProxyListCard'
import { Client } from '../utils/client'
import { BaseProxy } from '../utils/proxy'
import type { ProxyStatsInfo } from '../types/proxy'

export default function ClientDetail() {
  const { key = '' } = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [proxies, setProxies] = useState<ProxyStatsInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const raw = await getClient(key)
        const nextClient = new Client(raw)
        setClient(nextClient)
        const proxyData = await getProxiesV2({
          page: 1,
          pageSize: 100,
          user: nextClient.user,
          clientID: nextClient.clientID,
        })
        setProxies(proxyData.items)
      } catch (err: any) {
        if (err?.status === 404) {
          setNotFound(true)
        } else {
          toast.error('获取客户端详情失败：' + (err.message || '未知错误'))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [key])

  if (loading) return <LoadingState />
  if (notFound || !client) return <EmptyState title="客户端不存在" />

  const toListProxy = (proxy: ProxyStatsInfo) => {
    const card = new BaseProxy(proxy)
    card.type = proxy.type || ''
    if (proxy.conf?.remotePort != null) {
      card.port = proxy.conf.remotePort
      card.addr = `:${proxy.conf.remotePort}`
    }
    return card
  }

  return (
    <PageSection>
      <div className="space-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/clients">客户端列表</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{client.displayName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>基础信息</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoGrid
              items={[
                ['状态', client.online ? '在线' : '离线'],
                ['用户', client.user || '-'],
                ['Client ID', client.clientID || '-'],
                ['Run ID', client.runID || '-'],
                ['版本', client.version || '-'],
                ['协议', client.wireProtocol || '-'],
                ['主机名', client.hostname || '-'],
                ['IP', client.ip || '-'],
                ['首次连接', client.firstConnectedAgo],
                ['最近连接', client.lastConnectedAgo],
              ]}
            />
          </CardContent>
        </Card>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">代理</h2>
        {proxies.length > 0 ? (
          <div className="flex flex-col gap-3">
            {proxies.map((proxy) => (
              <ProxyListCard
                key={`${proxy.type}:${proxy.name}`}
                proxy={toListProxy(proxy)}
                to={`/proxy/${encodeURIComponent(proxy.name)}`}
                showTypeTag
              />
            ))}
          </div>
        ) : (
          <EmptyState title="暂无代理" />
        )}
      </section>
    </PageSection>
  )
}
