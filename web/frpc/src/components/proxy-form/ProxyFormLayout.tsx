import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  KeyValueListField,
  NumberField,
  SelectField,
  StringListField,
  SwitchField,
  TextField,
} from '../common/FormControls'
import { PLUGIN_TYPES, PROXY_TYPES, type ProxyFormData } from '../../types'

export function isProxyFormValid(value: ProxyFormData) {
  const hasName = value.name.trim().length > 0
  const usesPlugin = value.pluginType.trim().length > 0
  const needsRemotePort = value.type === 'tcp' || value.type === 'udp'
  const hasBackend = usesPlugin ? usesPlugin : value.localPort != null
  const hasRemotePort = !needsRemotePort || value.remotePort != null

  return hasName && hasBackend && hasRemotePort
}

export default function ProxyFormLayout({
  value,
  onChange,
  readonly = false,
  editing = false,
}: {
  value: ProxyFormData
  onChange: (value: ProxyFormData) => void
  readonly?: boolean
  editing?: boolean
}) {
  const update = <K extends keyof ProxyFormData>(
    key: K,
    next: ProxyFormData[K],
  ) => {
    onChange({ ...value, [key]: next })
  }
  const updatePluginConfig = (key: string, next: any) => {
    onChange({ ...value, pluginConfig: { ...value.pluginConfig, [key]: next } })
  }
  const backendMode = value.pluginType ? 'plugin' : 'direct'
  const isDirectMode = backendMode === 'direct'
  const setBackendMode = (mode: string) => {
    if (mode === 'direct') {
      onChange({ ...value, pluginType: '', pluginConfig: {} })
    } else if (!value.pluginType) {
      onChange({ ...value, pluginType: 'http2https', pluginConfig: {} })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>基础</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <TextField
              label="名称"
              value={value.name}
              onChange={(next) => update('name', next)}
              disabled={editing || readonly}
              placeholder="my-proxy"
              required
            />

            <SelectField
              label="类型"
              value={value.type}
              onChange={(next) => update('type', next as ProxyFormData['type'])}
              disabled={editing || readonly}
              options={PROXY_TYPES.map((type) => ({
                label: type.toUpperCase(),
                value: type,
              }))}
            />
            <SwitchField
              label="启用"
              checked={value.enabled}
              onChange={(next) => update('enabled', next)}
              disabled={readonly}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>后端</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={backendMode} onValueChange={setBackendMode}>
            <TabsList>
              <TabsTrigger value="direct" disabled={readonly}>
                直连
              </TabsTrigger>
              <TabsTrigger value="plugin" disabled={readonly}>
                插件
              </TabsTrigger>
            </TabsList>
            <TabsContent value="direct">
              <FieldGroup className="grid gap-4 md:grid-cols-3">
                <TextField
                  label="本地 IP"
                  value={value.localIP}
                  onChange={(next) => update('localIP', next)}
                  disabled={readonly}
                  placeholder="127.0.0.1"
                />
                <NumberField
                  label="本地端口"
                  value={value.localPort}
                  onChange={(next) => update('localPort', next)}
                  disabled={readonly}
                  min={0}
                  max={65535}
                  required={isDirectMode}
                />
                {['tcp', 'udp'].includes(value.type) ? (
                  <NumberField
                    label="远程端口"
                    value={value.remotePort}
                    onChange={(next) => update('remotePort', next)}
                    disabled={readonly}
                    min={0}
                    max={65535}
                    required
                  />
                ) : null}
              </FieldGroup>
            </TabsContent>
            <TabsContent value="plugin">
              <FieldGroup className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="插件类型"
                  value={value.pluginType}
                  onChange={(next) => update('pluginType', next)}
                  disabled={readonly}
                  options={PLUGIN_TYPES.filter(Boolean).map((type) => ({
                    label: type,
                    value: type,
                  }))}
                  required
                />
                <TextField
                  label="本地地址"
                  value={value.pluginConfig.localAddr || ''}
                  onChange={(next) => updatePluginConfig('localAddr', next)}
                  disabled={readonly}
                  placeholder="127.0.0.1:8080"
                />
                <TextField
                  label="Host 重写"
                  value={value.pluginConfig.hostHeaderRewrite || ''}
                  onChange={(next) =>
                    updatePluginConfig('hostHeaderRewrite', next)
                  }
                  disabled={readonly}
                />
              </FieldGroup>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>域名与认证</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <StringListField
              label="自定义域名"
              value={value.customDomains}
              onChange={(next) => update('customDomains', next)}
              disabled={readonly}
              placeholder="example.com"
            />
            <TextField
              label="子域名"
              value={value.subdomain}
              onChange={(next) => update('subdomain', next)}
              disabled={readonly}
            />
            <TextField
              label="HTTP 用户名"
              value={value.httpUser}
              onChange={(next) => update('httpUser', next)}
              disabled={readonly}
            />
            <TextField
              label="HTTP 密码"
              value={value.httpPassword}
              onChange={(next) => update('httpPassword', next)}
              disabled={readonly}
              type="password"
            />
            <TextField
              label="密钥"
              value={value.secretKey}
              onChange={(next) => update('secretKey', next)}
              disabled={readonly}
              type="password"
            />
            <TextField
              label="允许访问用户"
              value={value.allowUsers.join(', ')}
              onChange={(next) =>
                update(
                  'allowUsers',
                  next
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                )
              }
              disabled={readonly}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>传输与高级</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-3">
            <SwitchField
              label="启用加密"
              checked={value.useEncryption}
              onChange={(next) => update('useEncryption', next)}
              disabled={readonly}
            />
            <SwitchField
              label="启用压缩"
              checked={value.useCompression}
              onChange={(next) => update('useCompression', next)}
              disabled={readonly}
            />
            <TextField
              label="带宽限制"
              value={value.bandwidthLimit}
              onChange={(next) => update('bandwidthLimit', next)}
              disabled={readonly}
              placeholder="1MB"
            />
            <SelectField
              label="带宽限制模式"
              value={value.bandwidthLimitMode}
              onChange={(next) => update('bandwidthLimitMode', next)}
              disabled={readonly}
              options={[
                { label: '客户端', value: 'client' },
                { label: '服务端', value: 'server' },
              ]}
            />
            <SelectField
              label="Proxy Protocol"
              value={value.proxyProtocolVersion}
              onChange={(next) => update('proxyProtocolVersion', next)}
              disabled={readonly}
              options={[
                { label: '无', value: '' },
                { label: 'v1', value: 'v1' },
                { label: 'v2', value: 'v2' },
              ]}
            />
            <SelectField
              label="健康检查"
              value={value.healthCheckType}
              onChange={(next) => update('healthCheckType', next)}
              disabled={readonly}
              options={[
                { label: '禁用', value: '' },
                { label: 'TCP', value: 'tcp' },
                { label: 'HTTP', value: 'http' },
              ]}
            />
            <TextField
              label="负载均衡组"
              value={value.loadBalancerGroup}
              onChange={(next) => update('loadBalancerGroup', next)}
              disabled={readonly}
            />
            <TextField
              label="负载均衡密钥"
              value={value.loadBalancerGroupKey}
              onChange={(next) => update('loadBalancerGroupKey', next)}
              disabled={readonly}
            />
            <SwitchField
              label="禁用辅助地址"
              checked={value.natTraversalDisableAssistedAddrs}
              onChange={(next) =>
                update('natTraversalDisableAssistedAddrs', next)
              }
              disabled={readonly}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HTTP 与元数据</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <StringListField
              label="路由路径"
              value={value.locations}
              onChange={(next) => update('locations', next)}
              disabled={readonly}
              placeholder="/path"
            />
            <TextField
              label="Host 重写"
              value={value.hostHeaderRewrite}
              onChange={(next) => update('hostHeaderRewrite', next)}
              disabled={readonly}
            />
            <KeyValueListField
              label="请求头"
              value={value.requestHeaders}
              onChange={(next) => update('requestHeaders', next)}
              disabled={readonly}
              keyPlaceholder="请求头"
            />
            <KeyValueListField
              label="响应头"
              value={value.responseHeaders}
              onChange={(next) => update('responseHeaders', next)}
              disabled={readonly}
              keyPlaceholder="响应头"
            />
            <KeyValueListField
              label="元数据"
              value={value.metadatas}
              onChange={(next) => update('metadatas', next)}
              disabled={readonly}
            />
            <KeyValueListField
              label="注解"
              value={value.annotations}
              onChange={(next) => update('annotations', next)}
              disabled={readonly}
            />
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
