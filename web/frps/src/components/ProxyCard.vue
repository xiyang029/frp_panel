<template>
  <router-link :to="proxyLink" class="proxy-card-link">
    <n-card class="proxy-card" size="small" hoverable>
      <template #header>
        <div class="card-header">
          <span class="proxy-name">{{ proxy.name }}</span>
          <n-tag v-if="showType" size="small" :bordered="false">
            {{ proxy.type.toUpperCase() }}
          </n-tag>
        </div>
      </template>

      <template #header-extra>
        <n-tag size="small" :type="statusTagType" :bordered="false">
          {{ proxy.status }}
        </n-tag>
      </template>

      <div class="card-main">
        <div class="card-meta">
          <span v-if="proxy.port" class="meta-item">
            <span class="meta-label">端口:</span>
            <span class="meta-value">{{ proxy.port }}</span>
          </span>
          <span class="meta-item">
            <span class="meta-label">连接数:</span>
            <span class="meta-value">{{ proxy.conns }}</span>
          </span>
          <span class="meta-item" v-if="proxy.clientID">
            <span class="meta-label">客户端:</span>
            <span class="meta-value">{{
              proxy.user ? `${proxy.user}.${proxy.clientID}` : proxy.clientID
            }}</span>
          </span>
        </div>

        <div class="traffic-stats">
          <div class="traffic-row">
            <n-icon class="traffic-icon out"><arrow-up-outline /></n-icon>
            <span class="traffic-value">{{
              formatFileSize(proxy.trafficOut)
            }}</span>
          </div>
          <div class="traffic-row">
            <n-icon class="traffic-icon in"><arrow-down-outline /></n-icon>
            <span class="traffic-value">{{
              formatFileSize(proxy.trafficIn)
            }}</span>
          </div>
        </div>
      </div>
    </n-card>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NCard, NIcon, NTag } from 'naive-ui'
import { ArrowDownOutline, ArrowUpOutline } from '@vicons/ionicons5'
import { formatFileSize } from '../utils/format'
import type { BaseProxy } from '../utils/proxy'

interface Props {
  proxy: BaseProxy
  showType?: boolean
}

const props = defineProps<Props>()
const route = useRoute()

// 代理详情链接在客户端详情页会保留来源客户端信息，便于面包屑返回。
const proxyLink = computed(() => {
  const base = `/proxy/${props.proxy.name}`
  if (route.name === 'ClientDetail' && route.params.key) {
    return `${base}?from=client&client=${route.params.key}`
  }
  return base
})

// 将代理在线状态映射为 Naive Tag 的语义类型。
const statusTagType = computed<'default' | 'success' | 'error'>(() =>
  props.proxy.status === 'online' ? 'success' : 'error',
)
</script>

<style scoped>
.proxy-card-link {
  display: block;
  text-decoration: none;
}

.proxy-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.proxy-card:hover {
  transform: translateY(-1px);
}

.card-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.proxy-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text);
  line-height: 1.4;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1;
}

.meta-label {
  color: var(--app-text-faint);
  font-size: 13px;
  font-weight: 500;
}

.meta-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-muted);
}

.traffic-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  flex-shrink: 0;
}

.traffic-row {
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1;
}

.traffic-icon {
  font-size: 12px;
}

.traffic-icon.in {
  color: #2563eb;
}

.traffic-icon.out {
  color: #16a34a;
}

.traffic-value {
  font-size: 12px;
  color: var(--app-text-muted);
  font-weight: 500;
  text-align: right;
}

@media (max-width: 768px) {
  .card-main {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .traffic-stats {
    align-items: flex-start;
    width: 100%;
  }
}
</style>
