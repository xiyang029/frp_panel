<template>
  <n-card
    class="stat-card"
    :class="{ clickable: !!to }"
    :hoverable="!!to"
    size="small"
    @click="handleClick"
  >
    <div class="stat-card-content">
      <div class="stat-icon" :class="`icon-${type}`">
        <n-icon class="icon"><component :is="iconComponent" /></n-icon>
      </div>
      <div class="stat-info">
        <div class="stat-value">{{ value }}</div>
        <div class="stat-label">{{ label }}</div>
      </div>
      <n-icon v-if="to" class="arrow-icon"><chevron-forward-outline /></n-icon>
    </div>
    <div v-if="subtitle" class="stat-subtitle">{{ subtitle }}</div>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NIcon } from 'naive-ui'
import {
  AnalyticsOutline,
  ChevronForwardOutline,
  PeopleOutline,
  PulseOutline,
  SwapHorizontalOutline,
} from '@vicons/ionicons5'

interface Props {
  label: string
  value: string | number
  type?: 'clients' | 'proxies' | 'connections' | 'traffic'
  subtitle?: string
  to?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'clients',
})

const router = useRouter()

// 根据统计类型选择对应的概览图标。
const iconComponent = computed(() => {
  switch (props.type) {
    case 'clients':
      return PeopleOutline
    case 'proxies':
      return SwapHorizontalOutline
    case 'connections':
      return AnalyticsOutline
    case 'traffic':
      return PulseOutline
    default:
      return PeopleOutline
  }
})

// 存在跳转地址时，点击统计卡片进入目标页面。
const handleClick = () => {
  if (props.to) {
    router.push(props.to)
  }
}
</script>

<style scoped>
.stat-card {
  transition: all 0.3s ease;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  transform: translateY(-4px);
}

.stat-card.clickable:hover .arrow-icon {
  transform: translateX(4px);
}

.stat-card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.arrow-icon {
  color: var(--app-text-faint);
  font-size: 18px;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon .icon {
  width: 28px;
  height: 28px;
}

.icon-clients {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.icon-proxies {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.icon-connections {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.icon-traffic {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

html.dark .icon-clients {
  background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
}

html.dark .icon-proxies {
  background: linear-gradient(135deg, #fb7185 0%, #f43f5e 100%);
}

html.dark .icon-connections {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
}

html.dark .icon-traffic {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--app-text);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--app-text-muted);
  font-weight: 500;
}

.stat-subtitle {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--app-border);
  font-size: 12px;
  color: var(--app-text-muted);
}
</style>
