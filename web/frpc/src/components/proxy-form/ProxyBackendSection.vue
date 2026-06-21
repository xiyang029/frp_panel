<template>
  <n-form-item v-if="!readonly" label="后端模式">
    <n-radio-group v-model:value="backendMode">
      <n-space>
        <n-radio-button value="direct">直连</n-radio-button>
        <n-radio-button value="plugin">插件</n-radio-button>
      </n-space>
    </n-radio-group>
  </n-form-item>

  <n-grid v-if="backendMode === 'direct'" responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
    <n-form-item-gi label="本地 IP">
      <n-input v-model:value="form.localIP" :disabled="readonly" placeholder="127.0.0.1" />
    </n-form-item-gi>
    <n-form-item-gi label="本地端口" path="localPort">
      <n-input-number
        :value="form.localPort ?? null"
        :disabled="readonly"
        :min="0"
        :max="65535"
        clearable
        @update:value="form.localPort = $event ?? undefined"
      />
    </n-form-item-gi>
  </n-grid>

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

    <template v-if="['http2https', 'https2http', 'https2https', 'http2http', 'tls2raw'].includes(form.pluginType)">
      <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
        <n-form-item-gi label="本地地址">
          <n-input v-model:value="form.pluginConfig.localAddr" :disabled="readonly" placeholder="127.0.0.1:8080" />
        </n-form-item-gi>
        <n-form-item-gi v-if="['http2https', 'https2http', 'https2https', 'http2http'].includes(form.pluginType)" label="Host 重写">
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
    <template v-if="['https2http', 'https2https'].includes(form.pluginType)">
      <n-form-item label="启用 HTTP/2">
        <n-switch v-model:value="form.pluginConfig.enableHTTP2" :disabled="readonly" size="small" />
      </n-form-item>
    </template>
    <template v-if="form.pluginType === 'http_proxy'">
      <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
        <n-form-item-gi label="HTTP 用户名">
          <n-input v-model:value="form.pluginConfig.httpUser" :disabled="readonly" />
        </n-form-item-gi>
        <n-form-item-gi label="HTTP 密码">
          <n-input v-model:value="form.pluginConfig.httpPassword" :disabled="readonly" type="password" show-password-on="click" />
        </n-form-item-gi>
      </n-grid>
    </template>
    <template v-if="form.pluginType === 'socks5'">
      <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
        <n-form-item-gi label="用户名">
          <n-input v-model:value="form.pluginConfig.username" :disabled="readonly" />
        </n-form-item-gi>
        <n-form-item-gi label="密码">
          <n-input v-model:value="form.pluginConfig.password" :disabled="readonly" type="password" show-password-on="click" />
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
          <n-input v-model:value="form.pluginConfig.httpPassword" :disabled="readonly" type="password" show-password-on="click" />
        </n-form-item-gi>
      </n-grid>
    </template>
    <template v-if="form.pluginType === 'unix_domain_socket'">
      <n-form-item label="Unix Socket 路径">
        <n-input v-model:value="form.pluginConfig.unixPath" :disabled="readonly" placeholder="/tmp/socket.sock" />
      </n-form-item>
    </template>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import {
  NDynamicInput,
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
} from 'naive-ui'
import type { ProxyFormData } from '../../types'

const PLUGIN_LIST = [
  'http2https', 'http_proxy', 'https2http', 'https2https', 'http2http',
  'socks5', 'static_file', 'unix_domain_socket', 'tls2raw', 'virtual_net',
]

const props = withDefaults(defineProps<{
  modelValue: ProxyFormData
  readonly?: boolean
}>(), { readonly: false })

const emit = defineEmits<{ 'update:modelValue': [value: ProxyFormData] }>()

// 将父级 v-model 暴露为当前分段可直接读写的表单对象。
const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 后端模式用于在直连和插件配置之间切换。
const backendMode = ref<'direct' | 'plugin'>(form.value.pluginType ? 'plugin' : 'direct')

// 避免从外部数据回填时触发插件配置清空逻辑。
const isHydrating = ref(false)

// 插件列表转换为 Naive Select 可消费的选项结构。
const pluginOptions = computed(() => PLUGIN_LIST.map((plugin) => ({ label: plugin, value: plugin })))

// 在表单数组和 frp 插件 requestHeaders.set 对象之间做双向转换。
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

// 插件类型变化时清空旧插件的残留配置，避免提交不匹配字段。
watch(() => form.value.pluginType, (newType, oldType) => {
  if (isHydrating.value) return
  if (!oldType || !newType || newType === oldType) return
  if (form.value.pluginConfig && Object.keys(form.value.pluginConfig).length > 0) {
    form.value.pluginConfig = {}
  }
})

// 切换后端模式时同步插件类型，使转换逻辑仍以 pluginType 为准。
watch(backendMode, (mode) => {
  if (mode === 'direct') {
    form.value.pluginType = ''
    form.value.pluginConfig = {}
  } else if (!form.value.pluginType) {
    form.value.pluginType = 'http2https'
  }
})

// 从外部表单数据恢复当前后端模式。
const hydrate = () => {
  isHydrating.value = true
  backendMode.value = form.value.pluginType ? 'plugin' : 'direct'
  nextTick(() => { isHydrating.value = false })
}

watch(() => props.modelValue, () => { hydrate() })
onMounted(() => { hydrate() })
</script>

<style scoped lang="scss"></style>
