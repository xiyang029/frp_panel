<template>
  <n-grid v-if="['tcp', 'udp'].includes(form.type)" responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
    <n-form-item-gi label="远程端口" path="remotePort">
      <n-input-number
        :value="form.remotePort ?? null"
        :disabled="readonly"
        :min="0"
        :max="65535"
        clearable
        placeholder="0"
        @update:value="form.remotePort = $event ?? undefined"
      />
      <template #feedback>填写 0 表示由服务端随机分配端口</template>
    </n-form-item-gi>
  </n-grid>

  <n-grid v-if="['http', 'https', 'tcpmux'].includes(form.type)" responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
    <n-form-item-gi label="自定义域名" path="customDomains">
      <n-empty
        v-if="readonly && form.customDomains.length === 0"
        size="small"
        description="未配置"
      />
      <n-dynamic-tags
        v-else
        :value="form.customDomains"
        :disabled="readonly"
        :closable="!readonly"
        :input-props="{ placeholder: 'example.com' }"
        @update:value="form.customDomains = $event as string[]"
      />
    </n-form-item-gi>
    <n-form-item-gi v-if="form.type !== 'tcpmux'" label="子域名">
      <n-input v-model:value="form.subdomain" :disabled="readonly" placeholder="test" />
    </n-form-item-gi>
    <n-form-item-gi v-if="form.type === 'tcpmux'" label="复用器">
      <n-select
        v-model:value="form.multiplexer"
        :disabled="readonly"
        :options="multiplexerOptions"
      />
    </n-form-item-gi>
  </n-grid>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NDynamicTags,
  NEmpty,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NSelect,
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

// TCPMux 当前仅支持 HTTP CONNECT 复用器，保留为 Select 以便后续扩展。
const multiplexerOptions = [{ label: 'HTTP CONNECT', value: 'httpconnect' }]
</script>

<style scoped lang="scss"></style>
