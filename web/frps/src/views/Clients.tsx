import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronRightIcon, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { EmptyState, LoadingState, PageHeader, PageSection } from '@common/components/Page'
import { getClientsV2 } from '../api/client'
import { Client } from '../utils/client'

type ClientStatusFilter = 'all' | 'online' | 'offline'

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const requestSeq = useRef(0)

  const fetchData = async (silent = false) => {
    const seq = ++requestSeq.current
    if (!silent) setLoading(true)
    try {
      const data = await getClientsV2({
        page,
        pageSize,
        status: statusFilter,
        q: searchText.trim(),
      })
      if (seq !== requestSeq.current) return
      setClients(data.items.map((item) => new Client(item)))
      setTotal(data.total)
      setPage(data.page)
    } catch (err: any) {
      if (seq === requestSeq.current) {
        toast.error('获取客户端列表失败：' + (err.message || '未知错误'))
      }
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, statusFilter])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      fetchData()
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchText])

  useEffect(() => {
    const timer = window.setInterval(() => fetchData(true), 5000)
    return () => window.clearInterval(timer)
  }, [page, statusFilter, searchText])

  const maxPage = Math.max(1, Math.ceil(total / pageSize))
  const statusTabs = useMemo(
    () => [
      { value: 'all' as const, label: '全部' },
      { value: 'online' as const, label: '在线' },
      { value: 'offline' as const, label: '离线' },
    ],
    [],
  )

  return (
    <PageSection>
      <PageHeader title="客户端列表" />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <InputGroup className="w-full">
          <InputGroupInput
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="搜索客户端名称、用户或标识"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end" className="hidden md:flex">
            {total} 条
          </InputGroupAddon>
        </InputGroup>
        <ToggleGroup
          type="single"
          value={statusFilter}
          onValueChange={(value) => value && setStatusFilter(value as ClientStatusFilter)}
        >
          {statusTabs.map((tab) => (
            <ToggleGroupItem key={tab.value} value={tab.value}>
              {tab.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {loading ? (
        <LoadingState />
      ) : clients.length > 0 ? (
        <div className="flex flex-col gap-3">
          {clients.map((client) => (
            <Card key={client.key}>
              <CardContent>
                <button
                  className="flex w-full items-start justify-between gap-4 text-left"
                  onClick={() => navigate(`/clients/${encodeURIComponent(client.key)}`)}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{client.displayName}</span>
                      {client.version ? <Badge variant="secondary">v{client.version}</Badge> : null}
                      {client.wireProtocolLabel ? <Badge variant="outline">{client.wireProtocolLabel}</Badge> : null}
                      <Badge variant={client.online ? 'default' : 'secondary'}>
                        {client.online ? '在线' : '离线'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {client.hostname ? <Badge variant="outline">{client.hostname}</Badge> : null}
                      {client.ip ? <Badge variant="outline">{client.ip}</Badge> : null}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {client.online ? client.lastConnectedAgo : client.disconnectedAgo}
                    </div>
                  </div>
                  <ChevronRightIcon className="shrink-0 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="暂无客户端" />
      )}

      {total > 0 ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {maxPage}
          </span>
          <Button variant="outline" disabled={page >= maxPage} onClick={() => setPage((value) => value + 1)}>
            下一页
          </Button>
        </div>
      ) : null}
    </PageSection>
  )
}
