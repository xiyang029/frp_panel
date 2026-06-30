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
import { getVisitorConfig } from '../api/frpc'
import VisitorFormLayout from '../components/visitor-form/VisitorFormLayout'
import { useVisitorStore } from '../stores/visitor'
import { storeVisitorToForm, type VisitorDefinition, type VisitorFormData } from '../types'

export default function VisitorDetail() {
  const { name = '' } = useParams()
  const navigate = useNavigate()
  const visitorStore = useVisitorStore()
  const [form, setForm] = useState<VisitorFormData | null>(null)
  const [config, setConfig] = useState<VisitorDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const nextConfig = await getVisitorConfig(decodeURIComponent(name))
        setConfig(nextConfig)
        setForm(storeVisitorToForm(nextConfig))
      } catch (err: any) {
        if (err?.status === 404) setNotFound(true)
        else toast.error('加载访问器失败：' + (err.message || '未知错误'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [name])

  if (loading) return <LoadingState />
  if (notFound || !form || !config) return <EmptyState title="访问器不存在" />

  return (
    <PageSection>
      <div className="space-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/visitors">访问器列表</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{form.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <PageHeader
          title={form.name}
          actions={
            visitorStore.storeEnabled ? (
              <Button variant="outline" onClick={() => navigate(`/visitors/${encodeURIComponent(form.name)}/edit`)}>
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
            访问器信息
            <Badge variant="secondary">{form.type.toUpperCase()}</Badge>
            <Badge variant={form.enabled ? 'default' : 'secondary'}>{form.enabled ? '启用' : '禁用'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InfoGrid
            columnsClassName="md:grid-cols-3"
            items={[
              ['服务端代理', form.serverName || '-'],
              ['绑定地址', `${form.bindAddr || '-'}:${form.bindPort ?? '-'}`],
              ['服务端用户', form.serverUser || '-'],
            ]}
          />
        </CardContent>
      </Card>
      <VisitorFormLayout value={form} onChange={setForm} readonly />
    </PageSection>
  )
}
