import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Search,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EmptyState,
  LoadingState,
  PageHeader,
  PageSection,
} from '@common/components/Page'
import { useVisitorStore } from '../stores/visitor'
import type { VisitorDefinition } from '../types'

const configText = `[store]\npath = "./frpc_store.json"`

export default function VisitorList() {
  const navigate = useNavigate()
  const visitorStore = useVisitorStore()
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [deleteName, setDeleteName] = useState('')

  useEffect(() => {
    visitorStore.fetchStoreVisitors()
  }, [])

  const typeOptions = useMemo(
    () =>
      Array.from(new Set(visitorStore.visitors.map((visitor) => visitor.type))),
    [visitorStore.visitors],
  )
  const filteredVisitors = useMemo(() => {
    let result = visitorStore.visitors
    if (typeFilter)
      result = result.filter((visitor) => visitor.type === typeFilter)
    if (searchText) {
      const q = searchText.toLowerCase()
      result = result.filter((visitor) =>
        visitor.name.toLowerCase().includes(q),
      )
    }
    return result
  }, [searchText, typeFilter, visitorStore.visitors])

  const doDelete = async () => {
    try {
      await visitorStore.deleteVisitor(deleteName)
      toast.success('访问器已删除')
      setDeleteName('')
    } catch (err: any) {
      toast.error('删除失败：' + (err.message || '未知错误'))
    }
  }

  return (
    <PageSection>
      <PageHeader
        title="访问器列表"
        actions={
          visitorStore.storeEnabled ? (
            <Button onClick={() => navigate('/visitors/create')}>
              <PlusIcon data-icon="inline-start" />
              新建访问器
            </Button>
          ) : null
        }
      />
      <div className="grid gap-3 md:grid-cols-2">
        <InputGroup>
          <InputGroupInput
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="搜索访问器名称"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end" className="hidden md:flex">
            {filteredVisitors.length} 项
          </InputGroupAddon>
        </InputGroup>
        <Select
          value={typeFilter || 'all'}
          onValueChange={(value) => setTypeFilter(value === 'all' ? '' : value)}
        >
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

      {visitorStore.loading ? (
        <LoadingState />
      ) : !visitorStore.storeEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle>本地持久化配置未启用</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              请在 frpc 配置中加入以下内容：
            </p>
            <pre className="mt-3 overflow-auto text-sm font-mono">
              {configText}
            </pre>
          </CardContent>
        </Card>
      ) : filteredVisitors.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredVisitors.map((visitor) => (
            <VisitorCard
              key={visitor.name}
              visitor={visitor}
              onClick={() =>
                navigate(`/visitors/detail/${encodeURIComponent(visitor.name)}`)
              }
              onEdit={() =>
                navigate(`/visitors/${encodeURIComponent(visitor.name)}/edit`)
              }
              onDelete={() => setDeleteName(visitor.name)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="暂无访问器" />
      )}

      <AlertDialog
        open={!!deleteName}
        onOpenChange={(open) => !open && setDeleteName('')}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除访问器</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除访问器“{deleteName}”吗？删除后无法恢复。
            </AlertDialogDescription>
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

function VisitorCard({
  visitor,
  onClick,
  onEdit,
  onDelete,
}: {
  visitor: VisitorDefinition
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const block = (visitor as any)[visitor.type] || {}
  const serverName = block.serverName || ''
  const enabled = block.enabled !== false

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <button className="min-w-0 text-left" onClick={onClick}>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {visitor.name}
              <Badge variant="secondary">{visitor.type.toUpperCase()}</Badge>
              <Badge variant={enabled ? 'default' : 'secondary'}>
                {enabled ? '启用' : '禁用'}
              </Badge>
            </CardTitle>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={onEdit}>
                  <PencilIcon />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                  <Trash2Icon />
                  删除
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <button
          className="w-full text-left text-sm text-muted-foreground"
          onClick={onClick}
        >
          {serverName || '未设置服务端代理'}
        </button>
      </CardContent>
    </Card>
  )
}
