<template>
  <n-input-number
    :value="props.modelValue ?? null"
    :disabled="props.disabled"
    :min="props.min"
    :max="props.max"
    clearable
    @update:value="emitValue"
  />
</template>

<script setup lang="ts">
import { NInputNumber } from 'naive-ui'

const props = withDefaults(defineProps<{
  modelValue: number | undefined
  disabled?: boolean
  min?: number
  max?: number
}>(), {
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: number | undefined] }>()

const emitValue = (value: number | null) => {
  emit('update:modelValue', value ?? undefined)
}
</script>
