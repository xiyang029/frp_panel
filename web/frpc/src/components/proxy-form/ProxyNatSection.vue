<template>
  <n-card size="small">
    <n-collapse :default-expanded-names="hasNatValue ? ['nat'] : []">
      <n-collapse-item
        title="NAT 穿透"
        name="nat"
        :disabled="readonly && !hasNatValue"
      >
        <template #header-extra>
          <n-tag v-if="readonly && !hasNatValue" size="small" :bordered="false">
            未配置
          </n-tag>
        </template>

        <n-form-item label="禁用辅助地址">
          <n-switch
            v-model:value="form.natTraversalDisableAssistedAddrs"
            :disabled="readonly"
            size="small"
          />
          <template #feedback>仅使用 STUN 发现的公网地址</template>
        </n-form-item>
      </n-collapse-item>
    </n-collapse>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NCollapse, NCollapseItem, NFormItem, NSwitch, NTag } from 'naive-ui'
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

// NAT 分组目前只有禁用辅助地址开关，直接用该开关判断是否配置。
const hasNatValue = computed(() => form.value.natTraversalDisableAssistedAddrs)
</script>

<style scoped lang="scss"></style>
