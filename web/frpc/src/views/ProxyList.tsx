import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { PlusIcon, Search } from 'lucide-react'
import { toast } from 'sonner'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { EmptyState, LoadingState, PageHeader, PageSection } from '@common/components/Page'
import ProxyCard from '../components/ProxyCard'
import { useProxyStore } from '../stores/proxy'
import type { ProxyStatus } from '../types'

const configText = `[store]\npath = "./frpc_store.json"`
const typeOrder = ['tcp', 'udp', 'http', 'https', 'tcpmux', 'stcp', 'sudp', 'xtcp']

export default function ProxyList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'store' ? 'store' : 'status'
  const proxyStore = useProxyStore()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [storeSearch, setStoreSearch] = useState('')
  const [storeTypeFilter, setStoreTypeFilter] = useState('')
  const [deleteName, setDeleteName] = useState('')

  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = () => {
    proxyStore.fetchStatus().catch((err: any) => toast.error('获取代理状态失败：' + err.message))
    proxyStore.fetchStoreProxies()
  }

  const displaySource = (proxy: ProxyStatus) => (proxy.source === 'store' ? '本地存储' : '配置文件')
  const typeOptions = useMemo(() => {
    const types = new Set(proxyStore.proxies.map((proxy) => proxy.type))
    return Array.from(types).sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b))
  }, [proxyStore.proxies])
  const sourceOptions = useMemo(() => {
    const sources = new Set(proxyStore.proxies.map(displaySource))
    return Array.from(sources)
  }, [proxyStore.proxies])
  const storeTypeOptions = useMemo(() => {
    const types = new Set(proxyStore.storeProxies.map((proxy) => proxy.type))
    return Array.from(types).sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b))
  }, [proxyStore.storeProxies])

  const statusCounts = useMemo(() => {
    const counts = { running: 0, error: 0, waiting: 0 }
    for (const item of proxyStore.proxies) {
      if (item.status in counts) counts[item.status as keyof typeof counts] += 1
    }
    return counts
  }, [proxyStore.proxies])

  const filteredStatus = useMemo(() => {
    let result = proxyStore.proxies
    if (statusFilter) result = result.filter((proxy) => proxy.status === statusFilter)
    if (typeFilter) result = result.filter((proxy) => proxy.type === typeFilter)
    if (sourceFilter) result = result.filter((proxy) => displaySource(proxy) === sourceFilter)
    if (searchText) {
      const q = searchText.toLowerCase()
      result = result.filter(
        (proxy) =>
          proxy.name.toLowerCase().includes(q) ||
          proxy.type.toLowerCase().includes(q) ||
          proxy.local_addr.toLowerCase().includes(q) ||
          proxy.remote_addr.toLowerCase().includes(q),
      )
    }
    return result
  }, [proxyStore.proxies, searchText, sourceFilter, statusFilter, typeFilter])

  const filteredStoreProxies = useMemo(() => {
    let result = proxyStore.storeProxies
    if (storeTypeFilter) result = result.filter((proxy) => proxy.type === storeTypeFilter)
    if (storeSearch) {
      const q = storeSearch.toLowerCase()
      result = result.filter((proxy) => proxy.name.toLowerCase().includes(q))
    }
    return result
  }, [proxyStore.storeProxies, storeSearch, storeTypeFilter])

  const handleTabChange = (tab: string) => {
    setSearchParams(tab === 'status' ? {} : { tab })
  }

  const doDelete = async () => {
    try {
      await proxyStore.deleteProxy(deleteName)
      toast.success('代理已删除')
      setDeleteName('')
      proxyStore.fetchStatus()
    } catch (err: any) {
      toast.error('删除失败：' + (err.message || '未知错误'))
    }
  }

  const handleToggleProxy = async (proxy: ProxyStatus, enabled: boolean) => {
    try {
      await proxyStore.toggleProxy(proxy.name, enabled)
      toast.success(enabled ? '代理已启用' : '代理已禁用')
    } catch (err: any) {
      toast.error('操作失败：' + (err.message || '未知错误'))
    }
  }

  return (
    <PageSection>
      <PageHeader
        title="代理列表"
        actions={
          activeTab === 'store' && proxyStore.storeEnabled ? (
            <Button onClick={() => navigate('/proxies/create')}>
              <PlusIcon data-icon="inline-start" />
              新建代理
            </Button>
          ) : null
        }
      />
      <Card>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="status">运行状态</TabsTrigger>
              <TabsTrigger value="store">本地配置</TabsTrigger>
            </TabsList>
            <TabsContent value="status" className="flex flex-col gap-3">
              <ToggleGroup
                type="single"
                className="flex-wrap"
                value={statusFilter || 'all'}
                onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}
              >
                {[
                  { value: 'all', label: '全部', count: proxyStore.proxies.length },
                  { value: 'running', label: '运行中', count: statusCounts.running },
                  { value: 'error', label: '异常', count: statusCounts.error },
                  { value: 'waiting', label: '等待中', count: statusCounts.waiting },
                ].map((item) => (
                  <ToggleGroupItem key={item.value} value={item.value}>
                    {item.label} {item.count}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Filters
                search={searchText}
                setSearch={setSearchText}
                type={typeFilter}
                setType={setTypeFilter}
                typeOptions={typeOptions}
                resultCount={filteredStatus.length}
                source={sourceFilter}
                setSource={setSourceFilter}
                sourceOptions={sourceOptions}
              />
            </TabsContent>
            <TabsContent value="store" className="flex flex-col gap-3">
              {proxyStore.storeEnabled ? (
                <Filters
                  search={storeSearch}
                  setSearch={setStoreSearch}
                  type={storeTypeFilter}
                  setType={setStoreTypeFilter}
                  typeOptions={storeTypeOptions}
                  resultCount={filteredStoreProxies.length}
                />
              ) : null}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {activeTab === 'status' ? (
        proxyStore.loading ? (
          <LoadingState />
        ) : filteredStatus.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredStatus.map((proxy) => (
              <ProxyCard key={proxy.name} proxy={proxy} showSource onClick={(item) => navigate(`/proxies/detail/${encodeURIComponent(item.name)}`)} />
            ))}
          </div>
        ) : (
          <EmptyState title="暂无运行中的代理" />
        )
      ) : proxyStore.storeLoading ? (
        <LoadingState />
      ) : !proxyStore.storeEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle>本地持久化配置未启用</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">请在 frpc 配置中加入以下内容：</p>
            <pre className="mt-3 overflow-auto text-sm font-mono">{configText}</pre>
          </CardContent>
        </Card>
      ) : filteredStoreProxies.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredStoreProxies.map((proxy) => {
            const status = proxyStore.storeProxyWithStatus(proxy)
            return (
              <ProxyCard
                key={proxy.name}
                proxy={status}
                showActions
                onClick={(item) => navigate(`/proxies/detail/${encodeURIComponent(item.name)}`)}
                onEdit={(item) => navigate(`/proxies/${encodeURIComponent(item.name)}/edit`)}
                onDelete={(item) => setDeleteName(item.name)}
                onToggle={handleToggleProxy}
              />
            )
          })}
        </div>
      ) : (
        <EmptyState title="暂无本地配置" />
      )}

      <AlertDialog open={!!deleteName} onOpenChange={(open) => !open && setDeleteName('')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除代理</AlertDialogTitle>
            <AlertDialogDescription>确认删除代理“{deleteName}”吗？删除后无法恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageSection>
  )
}

function Filters({
  search,
  setSearch,
  type,
  setType,
  typeOptions,
  resultCount,
  source,
  setSource,
  sourceOptions,
}: {
  search: string
  setSearch: (value: string) => void
  type: string
  setType: (value: string) => void
  typeOptions: string[]
  resultCount: number
  source?: string
  setSource?: (value: string) => void
  sourceOptions?: string[]
}) {
  return (
    <div className="grid w-full gap-3 md:grid-cols-3">
      <InputGroup className="w-full">
        <InputGroupInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索代理" />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end" className="hidden md:flex">
          {resultCount} 项
        </InputGroupAddon>
      </InputGroup>
      {setSource ? (
        <Select value={source || 'all'} onValueChange={(value) => setSource(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部来源</SelectItem>
              {(sourceOptions || []).map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : null}
      <Select value={type || 'all'} onValueChange={(value) => setType(value === 'all' ? '' : value)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">全部类型</SelectItem>
            {typeOptions.map((item) => (
              <SelectItem key={item} value={item}>
                {item.toUpperCase()}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
