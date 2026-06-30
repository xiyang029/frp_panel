import {
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon,
  PauseIcon,
  Trash2Icon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ProxyStatus } from '../types'

export default function ProxyCard({
  proxy,
  showSource,
  showActions,
  onClick,
  onEdit,
  onDelete,
  onToggle,
}: {
  proxy: ProxyStatus
  showSource?: boolean
  showActions?: boolean
  onClick?: (proxy: ProxyStatus) => void
  onEdit?: (proxy: ProxyStatus) => void
  onDelete?: (proxy: ProxyStatus) => void
  onToggle?: (proxy: ProxyStatus, enabled: boolean) => void
}) {
  const localDisplay = proxy.plugin
    ? `plugin:${proxy.plugin}`
    : proxy.local_addr || ''

  return (
    <Card
      className={onClick ? 'cursor-pointer' : undefined}
      onClick={() => onClick?.(proxy)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span>{proxy.name}</span>
            <Badge variant="secondary">{proxy.type.toUpperCase()}</Badge>
            <Badge
              variant={
                proxy.status === 'running'
                  ? 'default'
                  : proxy.status === 'error'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {proxy.status}
            </Badge>
          </CardTitle>
          <div className="flex shrink-0 items-center gap-2">
            {showSource ? (
              <Badge variant="outline">
                {proxy.source === 'store' ? '本地存储' : '配置文件'}
              </Badge>
            ) : null}
            {showActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* 阻止点击汉堡按钮时冒泡 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>

                {/* 核心修改：在 Content 上打包阻止点击冒泡 */}
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuGroup>
                    {proxy.status === 'disabled' ? (
                      <DropdownMenuItem onClick={() => onToggle?.(proxy, true)}>
                        <PlayIcon />
                        启用
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => onToggle?.(proxy, false)}
                      >
                        <PauseIcon />
                        禁用
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={() => onEdit?.(proxy)}>
                      <PencilIcon />
                      编辑
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete?.(proxy)}
                    >
                      <Trash2Icon />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <CardDescription>
          {proxy.remote_addr && localDisplay
            ? `${proxy.remote_addr} -> ${localDisplay}`
            : proxy.remote_addr || localDisplay || '未设置地址'}
        </CardDescription>
        <div className="flex flex-wrap gap-4 text-sm">
          {proxy.plugin ? (
            <span>
              <span className="text-muted-foreground">插件 </span>
              {proxy.plugin}
            </span>
          ) : null}
          {'conns' in proxy ? (
            <span>
              <span className="text-muted-foreground">连接 </span>
              {proxy.conns}
            </span>
          ) : null}
        </div>
        {proxy.err ? (
          <p className="text-sm text-destructive">{proxy.err}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
