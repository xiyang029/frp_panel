import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { EmptyState, LoadingState, PageHeader, PageSection } from '@common/components/Page'
import { getClientsV2 } from '../api/client'
import { getProxiesV2 } from '../api/proxy'
import { getServerInfo } from '../api/server'
import ProxyListCard from '../components/ProxyListCard'
import { Client } from '../utils/client'
import {
  BaseProxy,
  HTTPProxy,
  HTTPSProxy,
  STCPProxy,
  SUDPProxy,
  TCPMuxProxy,
  TCPProxy,
  UDPProxy,
} from '../utils/proxy'
import type { ProxyStatsInfo } from '../types/proxy'

const proxyTypes = [
  { label: '全部', value: 'all' },
  { label: 'TCP', value: 'tcp' },
  { label: 'UDP', value: 'udp' },
  { label: 'HTTP', value: 'http' },
  { label: 'HTTPS', value: 'https' },
  { label: 'TCPMUX', value: 'tcpmux' },
  { label: 'STCP', value: 'stcp' },
  { label: 'XTCP', value: 'xtcp' },
  { label: 'SUDP', value: 'sudp' },
]

type ServerInfoLite = {
  vhostHTTPPort: number
  vhostHTTPSPort: number
  tcpmuxHTTPConnectPort: number
  subdomainHost: string
}

export default function Proxies() {
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeType, setActiveType] = useState(params.type || 'tcp')
  const [proxies, setProxies] = useState<BaseProxy[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const requestSeq = useRef(0)
  const serverInfo = useRef<Promise<ServerInfoLite> | null>(null)

  const clientIDFilter = searchParams.get('clientID') || ''
  const userFilter = searchParams.get('user') || ''

  const fetchServerInfo = () => {
    if (!serverInfo.current) {
      serverInfo.current = getServerInfo().catch((err) => {
        serverInfo.current = null
        throw err
      })
    }
    return serverInfo.current
  }

  const convertProxy = async (proxy: ProxyStatsInfo): Promise<BaseProxy | null> => {
    const type = proxy.type || activeType
    if (type === 'tcp') return new TCPProxy(proxy)
    if (type === 'udp') return new UDPProxy(proxy)
    if (type === 'http') {
      const info = await fetchServerInfo()
      return info.vhostHTTPPort ? new HTTPProxy(proxy, info.vhostHTTPPort, info.subdomainHost) : null
    }
    if (type === 'https') {
      const info = await fetchServerInfo()
      return info.vhostHTTPSPort ? new HTTPSProxy(proxy, info.vhostHTTPSPort, info.subdomainHost) : null
    }
    if (type === 'tcpmux') {
      const info = await fetchServerInfo()
      return info.tcpmuxHTTPConnectPort ? new TCPMuxProxy(proxy, info.tcpmuxHTTPConnectPort, info.subdomainHost) : null
    }
    if (type === 'stcp') return new STCPProxy(proxy)
    if (type === 'sudp') return new SUDPProxy(proxy)
    const base = new BaseProxy(proxy)
    base.type = type
    return base
  }

  const fetchData = async () => {
    const seq = ++requestSeq.current
    setLoading(true)
    try {
      const data = await getProxiesV2({
        page,
        pageSize,
        type: activeType === 'all' ? undefined : activeType,
        q: searchText.trim() || undefined,
        clientID: clientIDFilter || undefined,
        user: clientIDFilter ? userFilter : undefined,
      })
      const converted = (await Promise.all(data.items.map(convertProxy))).filter(
        (item): item is BaseProxy => item !== null,
      )
      if (seq !== requestSeq.current) return
      setProxies(converted)
      setTotal(data.total)
      setPage(data.page)
    } catch (err: any) {
      if (seq === requestSeq.current) {
        toast.error('获取代理列表失败：' + (err.message || '未知错误'))
      }
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, activeType, clientIDFilter, userFilter])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      fetchData()
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchText])

  useEffect(() => {
    const loadClients = async () => {
      try {
        const allClients: Client[] = []
        let nextPage = 1
        let totalClients = 0
        do {
          const data = await getClientsV2({ page: nextPage, pageSize: 100 })
          allClients.push(...data.items.map((item) => new Client(item)))
          totalClients = data.total
          nextPage += 1
        } while (allClients.length < totalClients)
        setClients(allClients)
      } catch {
        // Filtering remains usable even when the optional client list fails.
      }
    }
    loadClients()
  }, [])

  const clientOptions = useMemo(
    () =>
      clients
        .map((client) => ({
          key: client.key,
          clientID: client.clientID,
          user: client.user,
          label: client.user ? `${client.user}.${client.clientID}` : client.clientID,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [clients],
  )
  const selectedClientKey = useMemo(() => {
    if (!clientIDFilter) return 'all'
    const client = clientOptions.find((item) => item.clientID === clientIDFilter && item.user === userFilter)
    return client?.key || `${userFilter}:${clientIDFilter}`
  }, [clientIDFilter, clientOptions, userFilter])
  const maxPage = Math.max(1, Math.ceil(total / pageSize))

  const handleTypeChange = (value: string) => {
    if (!value) return
    setActiveType(value)
    setPage(1)
    navigate(value === 'tcp' ? '/proxies/tcp' : `/proxies/${value}`)
  }

  const handleClientFilterChange = (key: string) => {
    const next = new URLSearchParams(searchParams)
    if (key === 'all') {
      next.delete('clientID')
      next.delete('user')
    } else {
      const client = clientOptions.find((item) => item.key === key)
      if (client) {
        next.set('clientID', client.clientID)
        next.set('user', client.user)
      }
    }
    setSearchParams(next)
  }

  return (
    <PageSection>
      <PageHeader title="代理列表" />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row">
          <InputGroup className="md:w-96">
            <InputGroupInput
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="搜索代理名称、客户端或地址"
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end" className="hidden md:flex">
              {total} 条
            </InputGroupAddon>
          </InputGroup>
          <Select value={selectedClientKey} onValueChange={handleClientFilterChange}>
            <SelectTrigger className="md:w-64">
              <SelectValue placeholder="全部客户端" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">全部客户端</SelectItem>
                {clientOptions.map((client) => (
                  <SelectItem key={client.key} value={client.key}>
                    {client.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <ToggleGroup type="single" value={activeType} onValueChange={handleTypeChange}>
          {proxyTypes.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {loading ? (
        <LoadingState />
      ) : proxies.length > 0 ? (
        <div className="flex flex-col gap-3">
          {proxies.map((proxy) => (
            <ProxyListCard
              key={`${proxy.type}:${proxy.name}`}
              proxy={proxy}
              to={`/proxy/${encodeURIComponent(proxy.name)}`}
              showTypeTag={activeType === 'all'}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="暂无代理" />
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
