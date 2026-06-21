<template>
  <n-card size="small">
    <n-collapse :default-expanded-names="hasHealthValue ? ['health'] : []">
      <n-collapse-item
        title="健康检查"
        name="health"
        :disabled="readonly && !hasHealthValue"
      >
        <template #header-extra>
          <n-tag v-if="readonly && !hasHealthValue" size="small" :bordered="false">
            未配置
          </n-tag>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NCard,
  NCollapse,
  NCollapseItem,
  NDynamicInput,
  NEmpty,
  NFormItem,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NSelect,
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

// 健康检查是否启用，用于控制折叠默认状态和只读空态。
const hasHealthValue = computed(() => !!form.value.healthCheckType)

// 健康检查类型保留空值以表达禁用状态。
const healthCheckTypeOptions = [
  { label: '禁用', value: '' },
  { label: 'TCP', value: 'tcp' },
  { label: 'HTTP', value: 'http' },
]

// 在 UI 键值数组和 frp 健康检查请求头结构之间做双向转换。
const healthCheckHeaders = computed({
  get() {
    return form.value.healthCheckHTTPHeaders.map((h) => ({ key: h.name, value: h.value }))
  },
  set(val: Array<{ key: string; value: string }>) {
    form.value.healthCheckHTTPHeaders = val.map((h) => ({ name: h.key, value: h.value }))
  },
})
</script>

<style scoped lang="scss"></style>
