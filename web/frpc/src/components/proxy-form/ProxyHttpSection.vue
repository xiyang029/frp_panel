<template>
  <n-card size="small">
    <n-collapse :default-expanded-names="hasHttpValue ? ['http'] : []">
      <n-collapse-item
        title="HTTP 选项"
        name="http"
        :disabled="readonly && !hasHttpValue"
      >
        <template #header-extra>
          <n-tag v-if="readonly && !hasHttpValue" size="small" :bordered="false">
            未配置
          </n-tag>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NCard,
  NCollapse,
  NCollapseItem,
  NDynamicInput,
  NDynamicTags,
  NEmpty,
  NFormItem,
  NInput,
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

// 任一 HTTP 扩展项存在时，该折叠分组视为已配置。
const hasHttpValue = computed(() =>
  form.value.locations.length > 0 ||
  !!form.value.hostHeaderRewrite ||
  form.value.requestHeaders.length > 0 ||
  form.value.responseHeaders.length > 0,
)
</script>

<style scoped lang="scss"></style>
