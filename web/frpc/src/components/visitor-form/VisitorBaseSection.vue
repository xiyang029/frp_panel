<template>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NFormItemGi, NGrid, NInput, NSelect, NSwitch } from 'naive-ui'
import type { VisitorFormData } from '../../types'

const props = withDefaults(defineProps<{
  modelValue: VisitorFormData
  readonly?: boolean
  editing?: boolean
}>(), { readonly: false, editing: false })

const emit = defineEmits<{ 'update:modelValue': [value: VisitorFormData] }>()

// 将父级 v-model 暴露为当前分段可直接读写的表单对象。
const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 访问器类型选项供 Naive Select 在编辑态和只读禁用态复用。
const visitorTypeOptions = [
  { label: 'STCP', value: 'stcp' },
  { label: 'SUDP', value: 'sudp' },
  { label: 'XTCP', value: 'xtcp' },
]
</script>

<style scoped lang="scss"></style>
