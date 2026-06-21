<template>
  <n-grid responsive="screen" cols="1 s:2 m:3" :x-gap="16" :y-gap="8">
    <n-form-item-gi label="名称" path="name">
      <n-input
        v-model:value="form.name"
        :disabled="editing || readonly"
        placeholder="my-proxy"
      />
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NFormItemGi, NGrid, NInput, NSelect, NSwitch } from 'naive-ui'
import { PROXY_TYPES, type ProxyFormData } from '../../types'

const props = withDefaults(defineProps<{
  modelValue: ProxyFormData
  readonly?: boolean
  editing?: boolean
}>(), { readonly: false, editing: false })

const emit = defineEmits<{ 'update:modelValue': [value: ProxyFormData] }>()

// 将父级 v-model 暴露为当前分段可直接读写的表单对象。
const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 将代理类型常量转换为 Naive Select 选项，便于编辑态和只读禁用态共用。
const proxyTypeOptions = computed(() =>
  PROXY_TYPES.map((type) => ({ label: type.toUpperCase(), value: type })),
)
</script>

<style scoped lang="scss"></style>
