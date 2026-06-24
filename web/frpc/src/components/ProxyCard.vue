<template>
  <n-card
    size="small"
    hoverable
    @click="emit('click', proxy)"
  >
    <template #header>
      <n-space align="center" :size="8" :wrap="true">
        <n-text strong>{{ proxy.name }}</n-text>
        <n-tag size="small" :bordered="false">{{ proxy.type.toUpperCase() }}</n-tag>
        <n-tag size="small" :type="statusTagType" :bordered="false">
          {{ proxy.status }}
        </n-tag>
      </n-space>
    </template>

    <template v-if="showSource || showActions" #header-extra>
      <n-space align="center" :size="8" @click.stop>
        <n-tag v-if="showSource" size="small" :bordered="false">
          {{ displaySource }}
        </n-tag>
        <n-dropdown
          v-if="showActions"
          trigger="click"
          placement="bottom-end"
          :options="actionOptions"
          @select="handleActionSelect"
        >
          <n-button type="primary" secondary quaternary size="small">
            <template #icon>
              <n-icon><Dots /></n-icon>
            </template>
          </n-button>
        </n-dropdown>
      </n-space>
    </template>

    <n-space vertical :size="6">
      <n-text depth="3">
        <template v-if="proxy.remote_addr && localDisplay">
          {{ proxy.remote_addr }} → {{ localDisplay }}
        </template>
        <template v-else-if="proxy.remote_addr">{{ proxy.remote_addr }}</template>
        <template v-else-if="localDisplay">{{ localDisplay }}</template>
      </n-text>

      <n-space align="center" :size="16" wrap>
        <n-space v-if="proxy.plugin" align="center" :size="4">
          <n-text depth="3">插件</n-text>
          <n-text>{{ proxy.plugin }}</n-text>
        </n-space>
        <n-space v-if="proxy.conns || proxy.conns === 0" align="center" :size="4">
          <n-text depth="3">连接</n-text>
          <n-text>{{ proxy.conns }}</n-text>
        </n-space>
      </n-space>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { NButton, NCard, NDropdown, NIcon, NSpace, NTag, NText } from 'naive-ui'
import { Dots, Edit, PlayerPause, PlayerPlay, Trash } from '@vicons/tabler'
import type { ProxyStatus } from '../types'

interface Props {
  proxy: ProxyStatus
  showSource?: boolean
  showActions?: boolean
  deleting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSource: false,
  showActions: false,
  deleting: false,
})

const emit = defineEmits<{
  click: [proxy: ProxyStatus]
  edit: [proxy: ProxyStatus]
  delete: [proxy: ProxyStatus]
  toggle: [proxy: ProxyStatus, enabled: boolean]
}>()

const renderActionIcon = (icon: any) => () =>
  h(NIcon, null, { default: () => h(icon) })

// 下拉菜单选项根据代理启用状态提供互斥的启用或禁用动作。
const actionOptions = computed(() => [
  props.proxy.status === 'disabled'
    ? { label: '启用', key: 'enable', icon: renderActionIcon(PlayerPlay) }
    : { label: '禁用', key: 'disable', icon: renderActionIcon(PlayerPause) },
  { label: '编辑', key: 'edit', icon: renderActionIcon(Edit) },
  {
    label: '删除',
    key: 'delete',
    icon: renderActionIcon(Trash),
  },
])

// 将菜单 key 转换为父组件关心的代理操作事件。
const handleActionSelect = (key: string | number) => {
  if (key === 'enable') {
    emit('toggle', props.proxy, true)
  } else if (key === 'disable') {
    emit('toggle', props.proxy, false)
  } else if (key === 'edit') {
    emit('edit', props.proxy)
  } else if (key === 'delete') {
    emit('delete', props.proxy)
  }
}

// 来源字段显示为面向用户的短标签。
const displaySource = computed(() => {
  return props.proxy.source === 'store' ? '本地存储' : '配置文件'
})

// 本地端显示优先使用插件类型，直连代理显示本地地址。
const localDisplay = computed(() => {
  if (props.proxy.plugin) return `plugin:${props.proxy.plugin}`
  return props.proxy.local_addr || ''
})

// 将 frpc 代理状态映射为 Naive Tag 的语义类型。
const statusTagType = computed<'default' | 'success' | 'error' | 'warning'>(() => {
  switch (props.proxy.status) {
    case 'running':
      return 'success'
    case 'error':
      return 'error'
    case 'disabled':
      return 'default'
    default:
      return 'warning'
  }
})
</script>
