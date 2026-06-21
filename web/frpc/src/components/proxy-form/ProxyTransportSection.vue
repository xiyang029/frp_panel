<template>
  <n-card size="small">
    <n-collapse :default-expanded-names="hasTransportValue ? ['transport'] : []">
      <n-collapse-item
        title="传输"
        name="transport"
        :disabled="readonly && !hasTransportValue"
      >
        <template #header-extra>
          <n-tag v-if="readonly && !hasTransportValue" size="small" :bordered="false">
            未配置
          </n-tag>
        </template>

        <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
          <n-form-item-gi label="启用加密">
            <n-switch v-model:value="form.useEncryption" :disabled="readonly" size="small" />
          </n-form-item-gi>
          <n-form-item-gi label="启用压缩">
            <n-switch v-model:value="form.useCompression" :disabled="readonly" size="small" />
          </n-form-item-gi>
        </n-grid>
        <n-grid responsive="screen" cols="1 s:2 m:3" :x-gap="16" :y-gap="8">
          <n-form-item-gi label="带宽限制">
            <n-input v-model:value="form.bandwidthLimit" :disabled="readonly" placeholder="1MB" />
            <template #feedback>例如：1MB、500KB</template>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NCard,
  NCollapse,
  NCollapseItem,
  NFormItemGi,
  NGrid,
  NInput,
  NSelect,
  NSwitch,
  NTag,
} from 'naive-ui'
import type { ProxyFormData } from '../../types'

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

// 判断传输分组是否存在显式配置，用于只读态折叠和“未配置”提示。
const hasTransportValue = computed(() =>
  form.value.useEncryption ||
  form.value.useCompression ||
  !!form.value.bandwidthLimit ||
  (!!form.value.bandwidthLimitMode && form.value.bandwidthLimitMode !== 'client') ||
  !!form.value.proxyProtocolVersion,
)

// 带宽限制模式选项映射到 frp 支持的 client/server 取值。
const bandwidthModeOptions = [
  { label: '客户端', value: 'client' },
  { label: '服务端', value: 'server' },
]

// Proxy Protocol 版本选项保留空值用于表示禁用。
const proxyProtocolOptions = [
  { label: '无', value: '' },
  { label: 'v1', value: 'v1' },
  { label: 'v2', value: 'v2' },
]
</script>

<style scoped lang="scss"></style>
