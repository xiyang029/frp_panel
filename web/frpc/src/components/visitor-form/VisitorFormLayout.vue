<template>
  <n-space vertical :size="16" class="visitor-form-layout">
    <n-card size="small">
      <VisitorBaseSection v-model="form" :readonly="readonly" :editing="editing" />
    </n-card>
    <VisitorConnectionSection v-model="form" :readonly="readonly" />
    <VisitorTransportSection v-model="form" :readonly="readonly" />
    <VisitorXtcpSection v-if="form.type === 'xtcp'" v-model="form" :readonly="readonly" />
  </n-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NSpace } from 'naive-ui'
import type { VisitorFormData } from '../../types'
import VisitorBaseSection from './VisitorBaseSection.vue'
import VisitorConnectionSection from './VisitorConnectionSection.vue'
import VisitorTransportSection from './VisitorTransportSection.vue'
import VisitorXtcpSection from './VisitorXtcpSection.vue'

const props = withDefaults(defineProps<{
  modelValue: VisitorFormData
  readonly?: boolean
  editing?: boolean
}>(), { readonly: false, editing: false })

const emit = defineEmits<{ 'update:modelValue': [value: VisitorFormData] }>()

// 将父级 v-model 暴露为当前布局内各分段共享的可写表单对象。
const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>
