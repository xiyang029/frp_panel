<template>
  <n-card title="认证" size="small">
    <template v-if="['http', 'tcpmux'].includes(form.type)">
      <n-grid responsive="screen" cols="1 s:2 m:3" :x-gap="16" :y-gap="8">
        <n-form-item-gi label="HTTP 用户名">
          <n-input v-model:value="form.httpUser" :disabled="readonly" />
        </n-form-item-gi>
        <n-form-item-gi label="HTTP 密码">
          <n-input v-model:value="form.httpPassword" :disabled="readonly" type="password" show-password-on="click" />
        </n-form-item-gi>
        <n-form-item-gi label="按 HTTP 用户路由">
          <n-input v-model:value="form.routeByHTTPUser" :disabled="readonly" />
        </n-form-item-gi>
      </n-grid>
    </template>
    <template v-if="['stcp', 'sudp', 'xtcp'].includes(form.type)">
      <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
        <n-form-item-gi label="密钥" path="secretKey">
          <n-input v-model:value="form.secretKey" :disabled="readonly" type="password" show-password-on="click" />
        </n-form-item-gi>
        <n-form-item-gi label="允许访问用户">
          <n-empty
            v-if="readonly && form.allowUsers.length === 0"
            size="small"
            description="未配置"
          />
          <n-dynamic-tags
            v-else
            :value="form.allowUsers"
            :disabled="readonly"
            :closable="!readonly"
            :input-props="{ placeholder: 'username' }"
            @update:value="form.allowUsers = $event as string[]"
          />
        </n-form-item-gi>
      </n-grid>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NDynamicTags, NEmpty, NFormItemGi, NGrid, NInput } from 'naive-ui'
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
</script>

<style scoped lang="scss"></style>
