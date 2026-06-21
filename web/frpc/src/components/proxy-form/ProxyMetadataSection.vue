<template>
  <n-card size="small">
    <n-collapse :default-expanded-names="hasMetadataValue ? ['metadata'] : []">
      <n-collapse-item
        title="元数据"
        name="metadata"
        :disabled="readonly && !hasMetadataValue"
      >
        <template #header-extra>
          <n-tag v-if="readonly && !hasMetadataValue" size="small" :bordered="false">
            未配置
          </n-tag>
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

// 元数据和注解任一存在时，该折叠分组视为已配置。
const hasMetadataValue = computed(() =>
  form.value.metadatas.length > 0 || form.value.annotations.length > 0,
)
</script>

<style scoped lang="scss"></style>
