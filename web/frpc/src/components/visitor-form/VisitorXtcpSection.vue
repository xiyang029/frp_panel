<template>
  <n-space vertical :size="16">
  <n-card size="small">
    <n-collapse :default-expanded-names="hasXtcpValue ? ['xtcp'] : []">
      <n-collapse-item
        title="XTCP 选项"
        name="xtcp"
        :disabled="readonly && !hasXtcpValue"
      >
        <template #header-extra>
          <n-tag v-if="readonly && !hasXtcpValue" size="small" :bordered="false">
            未配置
          </n-tag>
        </template>

        <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
          <n-form-item-gi label="协议">
            <n-select
              v-model:value="form.protocol"
              :disabled="readonly"
              :options="protocolOptions"
            />
          </n-form-item-gi>
          <n-form-item-gi label="保持隧道常开">
            <n-switch v-model:value="form.keepTunnelOpen" :disabled="readonly" size="small" />
          </n-form-item-gi>
        </n-grid>
        <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
          <n-form-item-gi label="每小时最大重试次数">
            <n-input-number
              :value="form.maxRetriesAnHour ?? null"
              :disabled="readonly"
              :min="0"
              clearable
              @update:value="form.maxRetriesAnHour = $event ?? undefined"
            />
          </n-form-item-gi>
          <n-form-item-gi label="最小重试间隔（秒）">
            <n-input-number
              :value="form.minRetryInterval ?? null"
              :disabled="readonly"
              :min="0"
              clearable
              @update:value="form.minRetryInterval = $event ?? undefined"
            />
          </n-form-item-gi>
        </n-grid>
        <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="8">
          <n-form-item-gi label="回退访问器">
            <n-input v-model:value="form.fallbackTo" :disabled="readonly" placeholder="回退访问器名称" />
          </n-form-item-gi>
          <n-form-item-gi label="回退超时（毫秒）">
            <n-input-number
              :value="form.fallbackTimeoutMs ?? null"
              :disabled="readonly"
              :min="0"
              clearable
              @update:value="form.fallbackTimeoutMs = $event ?? undefined"
            />
          </n-form-item-gi>
        </n-grid>
      </n-collapse-item>
    </n-collapse>
  </n-card>

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
  </n-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NCard,
  NCollapse,
  NCollapseItem,
  NFormItem,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
} from 'naive-ui'
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

// XTCP 可选项存在非默认值时，该折叠分组视为已配置。
const hasXtcpValue = computed(() =>
  form.value.protocol !== 'quic' ||
  form.value.keepTunnelOpen ||
  form.value.maxRetriesAnHour != null ||
  form.value.minRetryInterval != null ||
  !!form.value.fallbackTo ||
  form.value.fallbackTimeoutMs != null,
)

// NAT 分组目前只有禁用辅助地址开关，直接用该开关判断是否配置。
const hasNatValue = computed(() => form.value.natTraversalDisableAssistedAddrs)

// XTCP 协议选项与 frp 支持的协议取值保持一致。
const protocolOptions = [
  { label: 'QUIC', value: 'quic' },
  { label: 'KCP', value: 'kcp' },
]
</script>

<style scoped lang="scss"></style>
