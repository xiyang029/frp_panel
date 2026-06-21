<template>
  <n-card size="small">
    <n-collapse :default-expanded-names="hasLoadBalanceValue ? ['loadBalance'] : []">
      <n-collapse-item
        title="负载均衡"
        name="loadBalance"
        :disabled="readonly && !hasLoadBalanceValue"
      >
        <template #header-extra>
          <n-tag v-if="readonly && !hasLoadBalanceValue" size="small" :bordered="false">
            未配置
          </n-tag>
        </template>

        <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
          <n-form-item-gi label="分组名称">
            <n-input v-model:value="form.loadBalancerGroup" :disabled="readonly" placeholder="group-name" />
          </n-form-item-gi>
          <n-form-item-gi label="分组密钥">
            <n-input v-model:value="form.loadBalancerGroupKey" :disabled="readonly" />
          </n-form-item-gi>
        </n-grid>
      </n-collapse-item>
    </n-collapse>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NCollapse, NCollapseItem, NFormItemGi, NGrid, NInput, NTag } from 'naive-ui'
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

// 负载均衡分组名是判断该分组是否已配置的主字段。
const hasLoadBalanceValue = computed(() => !!form.value.loadBalancerGroup)
</script>

<style scoped lang="scss"></style>
