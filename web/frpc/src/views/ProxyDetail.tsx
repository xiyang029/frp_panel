import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PencilIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { EmptyState, LoadingState, PageHeader, PageSection } from '@common/components/Page'
import { getProxyConfig } from '../api/frpc'
import ProxyFormLayout from '../components/proxy-form/ProxyFormLayout'
import { useProxyStore } from '../stores/proxy'
import { storeProxyToForm, type ProxyDefinition, type ProxyFormData } from '../types'

export default function ProxyDetail() {
  const { name = '' } = useParams()
  const navigate = useNavigate()
  const proxyStore = useProxyStore()
  const [form, setForm] = useState<ProxyFormData | null>(null)
  const [config, setConfig] = useState<ProxyDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const status = proxyStore.proxies.find((proxy) => proxy.name === decodeURIComponent(name))

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        await proxyStore.fetchStatus().catch(() => undefined)
        const nextConfig = await getProxyConfig(decodeURIComponent(name))
        setConfig(nextConfig)
        setForm(storeProxyToForm(nextConfig))
      } catch (err: any) {
        if (err?.status === 404) {
          setNotFound(true)
        } else {
          toast.error('加载代理失败：' + (err.message || '未知错误'))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [name])

  if (loading) return <LoadingState />
  if (notFound || !form || !config) return <EmptyState title="代理不存在" />

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
              <BreadcrumbPage>{form.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <PageHeader
          title=""
          actions={
            proxyStore.storeEnabled ? (
              <Button variant="outline" onClick={() => navigate(`/proxies/${encodeURIComponent(form.name)}/edit`)}>
                <PencilIcon data-icon="inline-start" />
                编辑
              </Button>
            ) : undefined
          }
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            运行状态
            <Badge variant="secondary">{form.type.toUpperCase()}</Badge>
            {status ? <Badge>{status.status}</Badge> : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InfoGrid
            columnsClassName="md:grid-cols-3"
            items={[
              ['来源', status?.source === 'store' ? '本地存储' : '配置文件'],
              ['本地地址', status?.local_addr || '-'],
              ['远程地址', status?.remote_addr || '-'],
              ['插件', status?.plugin || '-'],
              ['错误', status?.err || '-'],
            ]}
          />
        </CardContent>
      </Card>
      <ProxyFormLayout value={form} onChange={setForm} readonly />
    </PageSection>
  )
}
