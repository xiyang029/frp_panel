<template>
  <n-card
    class="proxy-card"
    :class="{ 'has-error': proxy.err }"
    size="small"
    hoverable
    @click="emit('click', proxy)"
  >
    <template #header>
      <div class="card-header">
        <span class="proxy-name">{{ proxy.name }}</span>
        <n-tag size="small" :bordered="false">{{ proxy.type.toUpperCase() }}</n-tag>
        <n-tag size="small" :type="statusTagType" :bordered="false">
          {{ proxy.status }}
        </n-tag>
      </div>
    </template>

    <template v-if="showSource || showActions" #header-extra>
      <div class="card-extra" @click.stop>
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
              <n-icon><ellipsis-horizontal /></n-icon>
            </template>
          </n-button>
        </n-dropdown>
      </div>
    </template>

    <div class="card-address">
      <template v-if="proxy.remote_addr && localDisplay">
        {{ proxy.remote_addr }} → {{ localDisplay }}
      </template>
      <template v-else-if="proxy.remote_addr">{{ proxy.remote_addr }}</template>
      <template v-else-if="localDisplay">{{ localDisplay }}</template>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { NButton, NCard, NDropdown, NIcon, NTag } from 'naive-ui'
import { CreateOutline, EllipsisHorizontal, PauseOutline, PlayOutline, TrashOutline } from '@vicons/ionicons5'
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
    ? { label: '启用', key: 'enable', icon: renderActionIcon(PlayOutline) }
    : { label: '禁用', key: 'disable', icon: renderActionIcon(PauseOutline) },
  { label: '编辑', key: 'edit', icon: renderActionIcon(CreateOutline) },
  {
    label: '删除',
    key: 'delete',
    icon: renderActionIcon(TrashOutline),
    props: { class: 'danger-dropdown-option' },
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

<style scoped lang="scss">
.proxy-card {
  cursor: pointer;
  transition: all $transition-medium;

  &:hover {
    border-color: $color-border;
  }

  &.has-error {
    border-color: rgba(245, 108, 108, 0.3);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-wrap: wrap;
  min-width: 0;
}

.proxy-name {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.card-address {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: $font-size-sm;
  color: $color-text-muted;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.card-extra {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

:global(.danger-dropdown-option) {
  color: $color-danger;
}

@include mobile {
  .card-header,
  .card-extra {
    align-items: flex-start;
  }

  .card-address {
    word-break: break-all;
  }
}
</style>
