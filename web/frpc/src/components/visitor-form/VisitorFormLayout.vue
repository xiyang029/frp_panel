<template>
  <n-space vertical :size="16">
    <n-card size="small">
      <n-grid responsive="screen" cols="1 s:2 m:3" :x-gap="16" :y-gap="8">
        <n-form-item-gi label="名称" path="name">
          <n-input v-model:value="form.name" :disabled="editing || readonly" placeholder="my-visitor" />
        </n-form-item-gi>
        <n-form-item-gi label="类型" path="type">
          <n-select
            v-model:value="form.type"
            :disabled="editing || readonly"
            :options="visitorTypeOptions"
            filterable
          />
        </n-form-item-gi>
        <n-form-item-gi label="启用">
          <n-switch v-model:value="form.enabled" :disabled="readonly" size="small" />
        </n-form-item-gi>
      </n-grid>
    </n-card>

    <n-card size="small" title="连接配置">
      <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
        <n-form-item-gi label="服务端代理名" path="serverName">
          <n-input
            v-model:value="form.serverName"
            :disabled="readonly"
            placeholder="要访问的服务端代理名称"
          />
        </n-form-item-gi>
        <n-form-item-gi label="服务端用户">
          <n-input
            v-model:value="form.serverUser"
            :disabled="readonly"
            placeholder="留空表示使用当前用户"
          />
        </n-form-item-gi>
      </n-grid>
      <n-form-item label="密钥">
        <n-input
          v-model:value="form.secretKey"
          :disabled="readonly"
          placeholder="共享密钥"
          type="password"
          show-password-on="click"
        />
      </n-form-item>
      <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
        <n-form-item-gi label="绑定地址">
          <n-input v-model:value="form.bindAddr" :disabled="readonly" placeholder="127.0.0.1" />
        </n-form-item-gi>
        <n-form-item-gi label="绑定端口" path="bindPort">
          <PortNumberField
            v-model="form.bindPort"
            :disabled="readonly"
            :min="bindPortMin"
            :max="65535"
          />
        </n-form-item-gi>
      </n-grid>
    </n-card>

    <n-card size="small">
      <n-collapse :default-expanded-names="hasTransportValue ? ['transport'] : []">
        <n-collapse-item title="传输选项" name="transport" :disabled="readonly && !hasTransportValue">
          <template #header-extra>
            <n-tag v-if="readonly && !hasTransportValue" size="small" :bordered="false">未配置</n-tag>
          </template>

          <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
            <n-form-item-gi label="启用加密">
              <n-switch v-model:value="form.useEncryption" :disabled="readonly" size="small" />
            </n-form-item-gi>
            <n-form-item-gi label="启用压缩">
              <n-switch v-model:value="form.useCompression" :disabled="readonly" size="small" />
            </n-form-item-gi>
          </n-grid>
        </n-collapse-item>
      </n-collapse>
    </n-card>

    <n-card v-if="form.type === 'xtcp'" size="small">
      <n-space vertical :size="16">
        <n-collapse :default-expanded-names="hasXtcpValue ? ['xtcp'] : []">
          <n-collapse-item title="XTCP 选项" name="xtcp" :disabled="readonly && !hasXtcpValue">
            <template #header-extra>
              <n-tag v-if="readonly && !hasXtcpValue" size="small" :bordered="false">未配置</n-tag>
            </template>

            <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
              <n-form-item-gi label="协议">
                <n-select
                  v-model:value="form.protocol"
                  :disabled="readonly"
                  :options="protocolOptions"
                />
              </n-form-item-gi>
              <n-form-item-gi label="保持隧道常开">
                <n-switch v-model:value="form.keepTunnelOpen" :disabled="readonly" size="small" />
              </n-form-item-gi>
            </n-grid>
            <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
              <n-form-item-gi label="每小时最大重试次数">
                <n-input-number
                  :value="form.maxRetriesAnHour ?? null"
                  :disabled="readonly"
                  :min="0"
                  clearable
                  @update:value="form.maxRetriesAnHour = $event ?? undefined"
                />
              </n-form-item-gi>
              <n-form-item-gi label="最小重试间隔（秒）">
                <n-input-number
                  :value="form.minRetryInterval ?? null"
                  :disabled="readonly"
                  :min="0"
                  clearable
                  @update:value="form.minRetryInterval = $event ?? undefined"
                />
              </n-form-item-gi>
            </n-grid>
            <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
              <n-form-item-gi label="回退访问器">
                <n-input v-model:value="form.fallbackTo" :disabled="readonly" placeholder="回退访问器名称" />
              </n-form-item-gi>
              <n-form-item-gi label="回退超时（毫秒）">
                <n-input-number
                  :value="form.fallbackTimeoutMs ?? null"
                  :disabled="readonly"
                  :min="0"
                  clearable
                  @update:value="form.fallbackTimeoutMs = $event ?? undefined"
                />
              </n-form-item-gi>
            </n-grid>
          </n-collapse-item>
        </n-collapse>
      </n-space>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NCard,
  NCollapse,
  NCollapseItem,
  NFormItem,
  NFormItemGi,
  NGrid,
  NInput,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
} from 'naive-ui'
import type { VisitorFormData } from '../../types'
import PortNumberField from '../common/PortNumberField.vue'

const props = withDefaults(defineProps<{
  modelValue: VisitorFormData
  readonly?: boolean
  editing?: boolean
}>(), { readonly: false, editing: false })

const emit = defineEmits<{ 'update:modelValue': [value: VisitorFormData] }>()

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const visitorTypeOptions = [
  { label: 'STCP', value: 'stcp' },
  { label: 'SUDP', value: 'sudp' },
  { label: 'XTCP', value: 'xtcp' },
]

const bindPortMin = computed(() => (form.value.type === 'sudp' ? 1 : undefined))

const hasTransportValue = computed(() => form.value.useEncryption || form.value.useCompression)

const hasXtcpValue = computed(() =>
  form.value.protocol !== 'quic' ||
  form.value.keepTunnelOpen ||
  form.value.maxRetriesAnHour != null ||
  form.value.minRetryInterval != null ||
  !!form.value.fallbackTo ||
  form.value.fallbackTimeoutMs != null,
)

const protocolOptions = [
  { label: 'QUIC', value: 'quic' },
  { label: 'KCP', value: 'kcp' },
]
</script>
