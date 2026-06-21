<template>
  <n-card title="连接配置" size="small">
    <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
      <n-form-item-gi label="服务端代理名" path="serverName">
        <n-input
          v-model:value="form.serverName"
          :disabled="readonly"
          placeholder="要访问的服务端代理名称"
        />
      </n-form-item-gi>
      <n-form-item-gi label="服务端用户">
        <n-input
          v-model:value="form.serverUser"
          :disabled="readonly"
          placeholder="留空表示使用当前用户"
        />
      </n-form-item-gi>
    </n-grid>
    <n-form-item label="密钥">
      <n-input
        v-model:value="form.secretKey"
        :disabled="readonly"
        placeholder="共享密钥"
        type="password"
        show-password-on="click"
      />
    </n-form-item>
    <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
      <n-form-item-gi label="绑定地址">
        <n-input v-model:value="form.bindAddr" :disabled="readonly" placeholder="127.0.0.1" />
      </n-form-item-gi>
      <n-form-item-gi label="绑定端口" path="bindPort">
        <n-input-number
          :value="form.bindPort ?? null"
          :disabled="readonly"
          :min="bindPortMin"
          :max="65535"
          clearable
          @update:value="form.bindPort = $event ?? undefined"
        />
      </n-form-item-gi>
    </n-grid>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NFormItem, NFormItemGi, NGrid, NInput, NInputNumber } from 'naive-ui'
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

// SUDP 端口不允许为 0，其余访问器类型沿用原有校验规则。
const bindPortMin = computed(() => (form.value.type === 'sudp' ? 1 : undefined))
</script>

<style scoped lang="scss"></style>
