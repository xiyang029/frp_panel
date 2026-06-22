<template>
  <n-space vertical :size="16">
    <n-card size="small">
      <n-space vertical :size="8">
        <n-grid responsive="screen" cols="1 s:2 m:3" :x-gap="16" :y-gap="8">
          <n-form-item-gi label="名称" path="name">
            <n-input v-model:value="form.name" :disabled="editing || readonly" placeholder="my-proxy" />
          </n-form-item-gi>
          <n-form-item-gi label="类型" path="type">
            <n-select
              v-model:value="form.type"
              :disabled="editing || readonly"
              :options="proxyTypeOptions"
              filterable
            />
          </n-form-item-gi>
          <n-form-item-gi label="启用">
            <n-switch v-model:value="form.enabled" :disabled="readonly" size="small" />
          </n-form-item-gi>
        </n-grid>

        <n-form-item v-if="!readonly" label="后端模式">
          <n-radio-group v-model:value="backendMode">
            <n-space>
              <n-radio-button value="direct">直连</n-radio-button>
              <n-radio-button value="plugin">插件</n-radio-button>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <template v-if="backendMode === 'direct'">
          <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
            <n-form-item-gi label="本地 IP">
              <n-input v-model:value="form.localIP" :disabled="readonly" placeholder="127.0.0.1" />
            </n-form-item-gi>
            <n-form-item-gi label="本地端口" path="localPort">
              <PortNumberField
                v-model="form.localPort"
                :disabled="readonly"
                :min="0"
                :max="65535"
              />
            </n-form-item-gi>
          </n-grid>

          <n-grid v-if="['tcp', 'udp'].includes(form.type)" responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
            <n-form-item-gi label="远程端口" path="remotePort">
              <PortNumberField
                v-model="form.remotePort"
                :disabled="readonly"
                :min="0"
                :max="65535"
              />
            </n-form-item-gi>
          </n-grid>
        </template>

        <template v-else>
          <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
            <n-form-item-gi label="插件类型">
              <n-select
                v-model:value="form.pluginType"
                :disabled="readonly"
                :options="pluginOptions"
                filterable
              />
            </n-form-item-gi>
          </n-grid>

          <template
            v-if="['http2https', 'https2http', 'https2https', 'http2http', 'tls2raw'].includes(form.pluginType)"
          >
            <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
              <n-form-item-gi label="本地地址">
                <n-input
                  v-model:value="form.pluginConfig.localAddr"
                  :disabled="readonly"
                  placeholder="127.0.0.1:8080"
                />
              </n-form-item-gi>
              <n-form-item-gi
                v-if="['http2https', 'https2http', 'https2https', 'http2http'].includes(form.pluginType)"
                label="Host 重写"
              >
                <n-input v-model:value="form.pluginConfig.hostHeaderRewrite" :disabled="readonly" />
              </n-form-item-gi>
            </n-grid>
          </template>

          <template v-if="['http2https', 'https2http', 'https2https', 'http2http'].includes(form.pluginType)">
            <n-form-item label="请求头">
              <n-empty
                v-if="readonly && pluginRequestHeaders.length === 0"
                size="small"
                description="未配置"
              />
              <n-dynamic-input
                v-else
                v-model:value="pluginRequestHeaders"
                preset="pair"
                key-placeholder="请求头"
                value-placeholder="值"
                :disabled="readonly"
              />
            </n-form-item>
          </template>

          <template v-if="['https2http', 'https2https', 'tls2raw'].includes(form.pluginType)">
            <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
              <n-form-item-gi label="证书路径">
                <n-input v-model:value="form.pluginConfig.crtPath" :disabled="readonly" placeholder="/path/to/cert.pem" />
              </n-form-item-gi>
              <n-form-item-gi label="私钥路径">
                <n-input v-model:value="form.pluginConfig.keyPath" :disabled="readonly" placeholder="/path/to/key.pem" />
              </n-form-item-gi>
            </n-grid>
          </template>

          <n-form-item v-if="['https2http', 'https2https'].includes(form.pluginType)" label="启用 HTTP/2">
            <n-switch v-model:value="form.pluginConfig.enableHTTP2" :disabled="readonly" size="small" />
          </n-form-item>

          <template v-if="form.pluginType === 'http_proxy'">
            <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
              <n-form-item-gi label="HTTP 用户名">
                <n-input v-model:value="form.pluginConfig.httpUser" :disabled="readonly" />
              </n-form-item-gi>
              <n-form-item-gi label="HTTP 密码">
                <n-input
                  v-model:value="form.pluginConfig.httpPassword"
                  :disabled="readonly"
                  type="password"
                  show-password-on="click"
                />
              </n-form-item-gi>
            </n-grid>
          </template>

          <template v-if="form.pluginType === 'socks5'">
            <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
              <n-form-item-gi label="用户名">
                <n-input v-model:value="form.pluginConfig.username" :disabled="readonly" />
              </n-form-item-gi>
              <n-form-item-gi label="密码">
                <n-input
                  v-model:value="form.pluginConfig.password"
                  :disabled="readonly"
                  type="password"
                  show-password-on="click"
                />
              </n-form-item-gi>
            </n-grid>
          </template>

          <template v-if="form.pluginType === 'static_file'">
            <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
              <n-form-item-gi label="本地路径">
                <n-input v-model:value="form.pluginConfig.localPath" :disabled="readonly" placeholder="/path/to/files" />
              </n-form-item-gi>
              <n-form-item-gi label="移除前缀">
                <n-input v-model:value="form.pluginConfig.stripPrefix" :disabled="readonly" />
              </n-form-item-gi>
            </n-grid>
            <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
              <n-form-item-gi label="HTTP 用户名">
                <n-input v-model:value="form.pluginConfig.httpUser" :disabled="readonly" />
              </n-form-item-gi>
              <n-form-item-gi label="HTTP 密码">
                <n-input
                  v-model:value="form.pluginConfig.httpPassword"
                  :disabled="readonly"
                  type="password"
                  show-password-on="click"
                />
              </n-form-item-gi>
            </n-grid>
          </template>

          <n-form-item v-if="form.pluginType === 'unix_domain_socket'" label="Unix Socket 路径">
            <n-input v-model:value="form.pluginConfig.unixPath" :disabled="readonly" placeholder="/tmp/socket.sock" />
          </n-form-item>
        </template>
      </n-space>
    </n-card>

    <n-card v-if="showAuthSection" size="small" title="认证">
      <template v-if="['http', 'tcpmux'].includes(form.type)">
        <n-grid responsive="screen" cols="1 s:2 m:3" :x-gap="16" :y-gap="8">
          <n-form-item-gi label="HTTP 用户名">
            <n-input v-model:value="form.httpUser" :disabled="readonly" />
          </n-form-item-gi>
          <n-form-item-gi label="HTTP 密码">
            <n-input v-model:value="form.httpPassword" :disabled="readonly" type="password" show-password-on="click" />
          </n-form-item-gi>
          <n-form-item-gi label="按 HTTP 用户路由">
            <n-input v-model:value="form.routeByHTTPUser" :disabled="readonly" />
          </n-form-item-gi>
        </n-grid>
      </template>

      <template v-if="['stcp', 'sudp', 'xtcp'].includes(form.type)">
        <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
          <n-form-item-gi label="密钥" path="secretKey">
            <n-input v-model:value="form.secretKey" :disabled="readonly" type="password" show-password-on="click" />
          </n-form-item-gi>
          <n-form-item-gi label="允许访问用户">
            <n-empty
              v-if="readonly && form.allowUsers.length === 0"
              size="small"
              description="未配置"
            />
            <n-dynamic-tags
              v-else
              :value="form.allowUsers"
              :disabled="readonly"
              :closable="!readonly"
              :input-props="{ placeholder: 'username' }"
              @update:value="form.allowUsers = $event as string[]"
            />
          </n-form-item-gi>
        </n-grid>
      </template>
    </n-card>

    <n-card v-if="form.type === 'http'" size="small">
      <n-collapse :default-expanded-names="hasHttpValue ? ['http'] : []">
        <n-collapse-item title="HTTP 选项" name="http" :disabled="readonly && !hasHttpValue">
          <template #header-extra>
            <n-tag v-if="readonly && !hasHttpValue" size="small" :bordered="false">未配置</n-tag>
          </template>

          <n-form-item label="路由路径">
            <n-empty
              v-if="readonly && form.locations.length === 0"
              size="small"
              description="未配置"
            />
            <n-dynamic-tags
              v-else
              :value="form.locations"
              :disabled="readonly"
              :closable="!readonly"
              :input-props="{ placeholder: '/path' }"
              @update:value="form.locations = $event as string[]"
            />
          </n-form-item>
          <n-form-item label="Host 重写">
            <n-input v-model:value="form.hostHeaderRewrite" :disabled="readonly" />
          </n-form-item>
          <n-form-item label="请求头">
            <n-empty
              v-if="readonly && form.requestHeaders.length === 0"
              size="small"
              description="未配置"
            />
            <n-dynamic-input
              v-else
              v-model:value="form.requestHeaders"
              preset="pair"
              key-placeholder="请求头"
              value-placeholder="值"
              :disabled="readonly"
            />
          </n-form-item>
          <n-form-item label="响应头">
            <n-empty
              v-if="readonly && form.responseHeaders.length === 0"
              size="small"
              description="未配置"
            />
            <n-dynamic-input
              v-else
              v-model:value="form.responseHeaders"
              preset="pair"
              key-placeholder="响应头"
              value-placeholder="值"
              :disabled="readonly"
            />
          </n-form-item>
        </n-collapse-item>
      </n-collapse>
    </n-card>

    <n-card size="small">
      <n-collapse :default-expanded-names="hasTransportValue ? ['transport'] : []">
        <n-collapse-item title="传输" name="transport" :disabled="readonly && !hasTransportValue">
          <template #header-extra>
            <n-tag v-if="readonly && !hasTransportValue" size="small" :bordered="false">未配置</n-tag>
          </template>

          <n-grid responsive="screen" cols="1 m:5" :x-gap="16" :y-gap="8">
            <n-form-item-gi label="启用加密">
              <n-switch v-model:value="form.useEncryption" :disabled="readonly" size="small" />
            </n-form-item-gi>
            <n-form-item-gi label="启用压缩">
              <n-switch v-model:value="form.useCompression" :disabled="readonly" size="small" />
            </n-form-item-gi>
            <n-form-item-gi label="带宽限制">
              <n-input v-model:value="form.bandwidthLimit" :disabled="readonly" placeholder="1MB" />
            </n-form-item-gi>
            <n-form-item-gi label="带宽限制模式">
              <n-select
                v-model:value="form.bandwidthLimitMode"
                :disabled="readonly"
                :options="bandwidthModeOptions"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Proxy Protocol 版本">
              <n-select
                v-model:value="form.proxyProtocolVersion"
                :disabled="readonly"
                :options="proxyProtocolOptions"
              />
            </n-form-item-gi>
          </n-grid>
        </n-collapse-item>
      </n-collapse>
    </n-card>

    <n-card size="small">
      <n-collapse :default-expanded-names="hasHealthValue ? ['health'] : []">
        <n-collapse-item title="健康检查" name="health" :disabled="readonly && !hasHealthValue">
          <template #header-extra>
            <n-tag v-if="readonly && !hasHealthValue" size="small" :bordered="false">未配置</n-tag>
          </template>

          <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
            <n-form-item-gi label="类型">
              <n-select
                v-model:value="form.healthCheckType"
                :disabled="readonly"
                :options="healthCheckTypeOptions"
              />
            </n-form-item-gi>
          </n-grid>
          <template v-if="form.healthCheckType">
            <n-grid responsive="screen" cols="1 s:2 m:3" :x-gap="16" :y-gap="8">
              <n-form-item-gi label="超时（秒）">
                <n-input-number
                  :value="form.healthCheckTimeoutSeconds ?? null"
                  :disabled="readonly"
                  :min="1"
                  clearable
                  @update:value="form.healthCheckTimeoutSeconds = $event ?? undefined"
                />
              </n-form-item-gi>
              <n-form-item-gi label="最大失败次数">
                <n-input-number
                  :value="form.healthCheckMaxFailed ?? null"
                  :disabled="readonly"
                  :min="1"
                  clearable
                  @update:value="form.healthCheckMaxFailed = $event ?? undefined"
                />
              </n-form-item-gi>
              <n-form-item-gi label="检查间隔（秒）">
                <n-input-number
                  :value="form.healthCheckIntervalSeconds ?? null"
                  :disabled="readonly"
                  :min="1"
                  clearable
                  @update:value="form.healthCheckIntervalSeconds = $event ?? undefined"
                />
              </n-form-item-gi>
            </n-grid>
            <template v-if="form.healthCheckType === 'http'">
              <n-form-item label="检查路径" path="healthCheckPath">
                <n-input v-model:value="form.healthCheckPath" :disabled="readonly" placeholder="/health" />
              </n-form-item>
              <n-form-item label="HTTP 请求头">
                <n-empty
                  v-if="readonly && healthCheckHeaders.length === 0"
                  size="small"
                  description="未配置"
                />
                <n-dynamic-input
                  v-else
                  v-model:value="healthCheckHeaders"
                  preset="pair"
                  key-placeholder="请求头"
                  value-placeholder="值"
                  :disabled="readonly"
                />
              </n-form-item>
            </template>
          </template>
        </n-collapse-item>
      </n-collapse>
    </n-card>

    <n-card size="small">
      <n-collapse :default-expanded-names="hasLoadBalanceValue ? ['loadBalance'] : []">
        <n-collapse-item title="负载均衡" name="loadBalance" :disabled="readonly && !hasLoadBalanceValue">
          <template #header-extra>
            <n-tag v-if="readonly && !hasLoadBalanceValue" size="small" :bordered="false">未配置</n-tag>
          </template>

          <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
            <n-form-item-gi label="分组名称">
              <n-input v-model:value="form.loadBalancerGroup" :disabled="readonly" placeholder="group-name" />
            </n-form-item-gi>
            <n-form-item-gi label="分组密钥">
              <n-input v-model:value="form.loadBalancerGroupKey" :disabled="readonly" />
            </n-form-item-gi>
          </n-grid>
        </n-collapse-item>
      </n-collapse>
    </n-card>

    <n-card v-if="form.type === 'xtcp'" size="small">
      <n-collapse :default-expanded-names="hasNatValue ? ['nat'] : []">
        <n-collapse-item title="NAT 穿透" name="nat" :disabled="readonly && !hasNatValue">
          <template #header-extra>
            <n-tag v-if="readonly && !hasNatValue" size="small" :bordered="false">未配置</n-tag>
          </template>

          <n-form-item label="禁用辅助地址">
            <n-switch
              v-model:value="form.natTraversalDisableAssistedAddrs"
              :disabled="readonly"
              size="small"
            />
            <template #feedback>仅使用 STUN 发现的公网地址</template>
          </n-form-item>
        </n-collapse-item>
      </n-collapse>
    </n-card>

    <n-card size="small">
      <n-collapse :default-expanded-names="hasMetadataValue ? ['metadata'] : []">
        <n-collapse-item title="元数据" name="metadata" :disabled="readonly && !hasMetadataValue">
          <template #header-extra>
            <n-tag v-if="readonly && !hasMetadataValue" size="small" :bordered="false">未配置</n-tag>
          </template>

          <n-form-item label="元数据">
            <n-empty
              v-if="readonly && form.metadatas.length === 0"
              size="small"
              description="未配置"
            />
            <n-dynamic-input
              v-else
              v-model:value="form.metadatas"
              preset="pair"
              key-placeholder="键"
              value-placeholder="值"
              :disabled="readonly"
            />
          </n-form-item>
          <n-form-item label="注解">
            <n-empty
              v-if="readonly && form.annotations.length === 0"
              size="small"
              description="未配置"
            />
            <n-dynamic-input
              v-else
              v-model:value="form.annotations"
              preset="pair"
              key-placeholder="键"
              value-placeholder="值"
              :disabled="readonly"
            />
          </n-form-item>
        </n-collapse-item>
      </n-collapse>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  NCard,
  NCollapse,
  NCollapseItem,
  NDynamicInput,
  NDynamicTags,
  NEmpty,
  NFormItem,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
} from 'naive-ui'
import type { ProxyFormData } from '../../types'
import PortNumberField from '../common/PortNumberField.vue'

const props = withDefaults(defineProps<{
  modelValue: ProxyFormData
  readonly?: boolean
  editing?: boolean
}>(), { readonly: false, editing: false })

const emit = defineEmits<{ 'update:modelValue': [value: ProxyFormData] }>()

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const PROXY_TYPES = ['tcp', 'udp', 'http', 'https', 'tcpmux', 'stcp', 'sudp', 'xtcp']
const proxyTypeOptions = computed(() => PROXY_TYPES.map((type) => ({ label: type.toUpperCase(), value: type })))

const PLUGIN_LIST = [
  'http2https',
  'http_proxy',
  'https2http',
  'https2https',
  'http2http',
  'socks5',
  'static_file',
  'unix_domain_socket',
  'tls2raw',
  'virtual_net',
]
const pluginOptions = computed(() => PLUGIN_LIST.map((plugin) => ({ label: plugin, value: plugin })))

const backendMode = ref<'direct' | 'plugin'>(form.value.pluginType ? 'plugin' : 'direct')
const isHydrating = ref(false)

const pluginRequestHeaders = computed({
  get() {
    const set = form.value.pluginConfig?.requestHeaders?.set
    if (!set || typeof set !== 'object') return []
    return Object.entries(set).map(([key, value]) => ({ key, value: String(value) }))
  },
  set(val: Array<{ key: string; value: string }>) {
    if (!form.value.pluginConfig) form.value.pluginConfig = {}
    if (val.length === 0) {
      delete form.value.pluginConfig.requestHeaders
    } else {
      form.value.pluginConfig.requestHeaders = {
        set: Object.fromEntries(val.map((e) => [e.key, e.value])),
      }
    }
  },
})

watch(
  () => form.value.pluginType,
  (newType, oldType) => {
    if (isHydrating.value) return
    if (!oldType || !newType || newType === oldType) return
    if (form.value.pluginConfig && Object.keys(form.value.pluginConfig).length > 0) {
      form.value.pluginConfig = {}
    }
  },
)

watch(backendMode, (mode) => {
  if (mode === 'direct') {
    form.value.pluginType = ''
    form.value.pluginConfig = {}
  } else if (!form.value.pluginType) {
    form.value.pluginType = 'http2https'
  }
})

const hydrate = () => {
  isHydrating.value = true
  backendMode.value = form.value.pluginType ? 'plugin' : 'direct'
  nextTick(() => {
    isHydrating.value = false
  })
}

watch(() => props.modelValue, () => { hydrate() })
onMounted(() => { hydrate() })

const showAuthSection = computed(() => ['http', 'tcpmux', 'stcp', 'sudp', 'xtcp'].includes(form.value.type))

const hasTransportValue = computed(() =>
  form.value.useEncryption ||
  form.value.useCompression ||
  !!form.value.bandwidthLimit ||
  (!!form.value.bandwidthLimitMode && form.value.bandwidthLimitMode !== 'client') ||
  !!form.value.proxyProtocolVersion,
)

const bandwidthModeOptions = [
  { label: '客户端', value: 'client' },
  { label: '服务端', value: 'server' },
]

const proxyProtocolOptions = [
  { label: '无', value: '' },
  { label: 'v1', value: 'v1' },
  { label: 'v2', value: 'v2' },
]

const hasHttpValue = computed(() =>
  form.value.locations.length > 0 ||
  !!form.value.hostHeaderRewrite ||
  form.value.requestHeaders.length > 0 ||
  form.value.responseHeaders.length > 0,
)

const hasHealthValue = computed(() => !!form.value.healthCheckType)
const healthCheckTypeOptions = [
  { label: '禁用', value: '' },
  { label: 'TCP', value: 'tcp' },
  { label: 'HTTP', value: 'http' },
]

const healthCheckHeaders = computed({
  get() {
    return form.value.healthCheckHTTPHeaders.map((h) => ({ key: h.name, value: h.value }))
  },
  set(val: Array<{ key: string; value: string }>) {
    form.value.healthCheckHTTPHeaders = val.map((h) => ({ name: h.key, value: h.value }))
  },
})

const hasLoadBalanceValue = computed(() => !!form.value.loadBalancerGroup)
const hasNatValue = computed(() => form.value.natTraversalDisableAssistedAddrs)
const hasMetadataValue = computed(() =>
  form.value.metadatas.length > 0 || form.value.annotations.length > 0,
)
</script>
