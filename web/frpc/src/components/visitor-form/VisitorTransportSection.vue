<template>
  <n-card size="small">
    <n-collapse :default-expanded-names="hasTransportValue ? ['transport'] : []">
      <n-collapse-item
        title="传输选项"
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
      </n-collapse-item>
    </n-collapse>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NCollapse, NCollapseItem, NFormItemGi, NGrid, NSwitch, NTag } from 'naive-ui'
import type { VisitorFormData } from '../../types'

const props = withDefaults(defineProps<{
  modelValue: VisitorFormData
  readonly?: boolean
}>(), { readonly: false })

const emit = defineEmits<{ 'update:modelValue': [value: VisitorFormData] }>()

// 将父级 v-model 暴露为当前分段可直接读写的表单对象。
const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 加密或压缩任一启用时，该折叠分组视为已配置。
const hasTransportValue = computed(() => form.value.useEncryption || form.value.useCompression)
</script>

<style scoped lang="scss"></style>
