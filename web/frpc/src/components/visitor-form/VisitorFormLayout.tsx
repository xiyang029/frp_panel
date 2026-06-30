import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup } from '@/components/ui/field'
import { NumberField, SelectField, SwitchField, TextField } from '../common/FormControls'
import { VISITOR_TYPES, type VisitorFormData } from '../../types'

export function isVisitorFormValid(value: VisitorFormData) {
  return (
    value.name.trim().length > 0 &&
    value.serverName.trim().length > 0 &&
    value.secretKey.trim().length > 0 &&
    value.bindPort != null
  )
}

export default function VisitorFormLayout({
  value,
  onChange,
  readonly = false,
  editing = false,
}: {
  value: VisitorFormData
  onChange: (value: VisitorFormData) => void
  readonly?: boolean
  editing?: boolean
}) {
  const update = <K extends keyof VisitorFormData>(key: K, next: VisitorFormData[K]) => {
    onChange({ ...value, [key]: next })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>基础</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-3">
            <TextField
              label="名称"
              value={value.name}
              onChange={(next) => update('name', next)}
              disabled={editing || readonly}
              placeholder="my-visitor"
              required
            />
            <SelectField
              label="类型"
              value={value.type}
              onChange={(next) => update('type', next as VisitorFormData['type'])}
              disabled={editing || readonly}
              options={VISITOR_TYPES.map((type) => ({ label: type.toUpperCase(), value: type }))}
            />
            <SwitchField label="启用" checked={value.enabled} onChange={(next) => update('enabled', next)} disabled={readonly} />
          </FieldGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>连接配置</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <TextField
              label="服务端代理名"
              value={value.serverName}
              onChange={(next) => update('serverName', next)}
              disabled={readonly}
              required
            />
            <TextField label="服务端用户" value={value.serverUser} onChange={(next) => update('serverUser', next)} disabled={readonly} />
            <TextField
              label="密钥"
              value={value.secretKey}
              onChange={(next) => update('secretKey', next)}
              disabled={readonly}
              type="password"
              required
            />
            <TextField label="绑定地址" value={value.bindAddr} onChange={(next) => update('bindAddr', next)} disabled={readonly} placeholder="127.0.0.1" />
            <NumberField
              label="绑定端口"
              value={value.bindPort}
              onChange={(next) => update('bindPort', next)}
              disabled={readonly}
              min={value.type === 'sudp' ? 1 : undefined}
              max={65535}
              required
            />
          </FieldGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>传输与 XTCP</CardTitle>
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
            <SelectField
              label="协议"
              value={value.protocol}
              onChange={(next) => update('protocol', next)}
              disabled={readonly || value.type !== 'xtcp'}
              options={[{ label: 'QUIC', value: 'quic' }, { label: 'KCP', value: 'kcp' }]}
            />
            <SwitchField
              label="保持隧道常开"
              checked={value.keepTunnelOpen}
              onChange={(next) => update('keepTunnelOpen', next)}
              disabled={readonly || value.type !== 'xtcp'}
            />
            <NumberField
              label="每小时最大重试次数"
              value={value.maxRetriesAnHour}
              onChange={(next) => update('maxRetriesAnHour', next)}
              disabled={readonly || value.type !== 'xtcp'}
              min={0}
            />
            <NumberField
              label="最小重试间隔（秒）"
              value={value.minRetryInterval}
              onChange={(next) => update('minRetryInterval', next)}
              disabled={readonly || value.type !== 'xtcp'}
              min={0}
            />
            <TextField
              label="回退访问器"
              value={value.fallbackTo}
              onChange={(next) => update('fallbackTo', next)}
              disabled={readonly || value.type !== 'xtcp'}
            />
            <NumberField
              label="回退超时（毫秒）"
              value={value.fallbackTimeoutMs}
              onChange={(next) => update('fallbackTimeoutMs', next)}
              disabled={readonly || value.type !== 'xtcp'}
              min={0}
            />
            <SwitchField
              label="禁用辅助地址"
              checked={value.natTraversalDisableAssistedAddrs}
              onChange={(next) => update('natTraversalDisableAssistedAddrs', next)}
              disabled={readonly || value.type !== 'xtcp'}
            />
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
