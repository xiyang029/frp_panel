import { LinkIcon, ServerIcon, UsersIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatFileSize } from '../utils/format'
import type { BaseProxy } from '../utils/proxy'

export default function ProxyListCard({
  proxy,
  to,
  showTypeTag,
}: {
  proxy: BaseProxy
  to: string
  showTypeTag?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <a href={`#${to}`} className="flex flex-wrap items-center gap-2">
          <CardTitle>{proxy.name}</CardTitle>
          {showTypeTag ? (
            <Badge variant="secondary">{proxy.type.toUpperCase()}</Badge>
          ) : null}
          <Badge
            variant={
              proxy.status === 'online' || proxy.status === 'running'
                ? 'default'
                : 'secondary'
            }
          >
            {proxy.status || 'unknown'}
          </Badge>
        </a>
      </CardHeader>
      <CardContent>
        <a
          href={`#${to}`}
          className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
        >
          <div className="min-w-0 flex-1">
            <CardDescription className="flex flex-wrap gap-4 text-sm">
              {proxy.port ? (
                <span className="flex items-center gap-1">
                  <LinkIcon size={14} />
                  {proxy.port}
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <ServerIcon size={14} />
                {proxy.conns} 连接
              </span>
              {proxy.clientID ? (
                <span className="flex items-center gap-1">
                  <UsersIcon size={14} />
                  {proxy.user ? `${proxy.user}.` : ''}
                  {proxy.clientID}
                </span>
              ) : null}
              <div>↑ {formatFileSize(proxy.trafficOut)}</div>
              <div>↓ {formatFileSize(proxy.trafficIn)}</div>
            </CardDescription>
          </div>
        </a>
      </CardContent>
    </Card>
  )
}
