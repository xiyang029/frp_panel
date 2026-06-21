<template>
  <n-card class="client-card" size="small" hoverable @click="viewDetail">
    <template #header>
      <div class="card-header">
        <div class="card-icon-wrapper">
          <div
            class="status-dot-large"
            :class="client.online ? 'online' : 'offline'"
          ></div>
        </div>
        <span class="client-main-id">{{ client.displayName }}</span>
        <span v-if="client.hostname" class="hostname-badge">{{
          client.hostname
        }}</span>
        <n-tag v-if="client.version" size="small" type="success" round>
          v{{ client.version }}
        </n-tag>
        <n-tag v-if="client.wireProtocolLabel" size="small" type="info" round>
          {{ client.wireProtocolLabel }}
        </n-tag>
      </div>
    </template>

    <template #header-extra>
      <div class="card-action">
        <n-tag size="small" :type="client.online ? 'success' : 'default'" round>
          {{ client.online ? 'Online' : 'Offline' }}
        </n-tag>
        <n-icon class="arrow-icon"><chevron-forward-outline /></n-icon>
      </div>
    </template>

    <div class="card-meta">
      <div class="meta-group">
        <span v-if="client.ip" class="meta-item">
          <span class="meta-label">IP</span>
          <span class="meta-value">{{ client.ip }}</span>
        </span>
      </div>
      <span class="meta-item activity">
        <n-icon class="activity-icon"><pulse-outline /></n-icon>
        <span class="meta-value">{{
          client.online ? client.lastConnectedAgo : client.disconnectedAgo
        }}</span>
      </span>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NCard, NIcon, NTag } from 'naive-ui'
import { ChevronForwardOutline, PulseOutline } from '@vicons/ionicons5'
import type { Client } from '../utils/client'

interface Props {
  client: Client
}

const props = defineProps<Props>()
const router = useRouter()

// 点击客户端卡片进入对应客户端详情页。
const viewDetail = () => {
  router.push({
    name: 'ClientDetail',
    params: { key: props.client.key },
  })
}
</script>

<style scoped>
.client-card {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.client-card:hover {
  transform: translateY(-2px);
}

.card-icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--app-panel);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.client-card:hover .card-icon-wrapper {
  background: rgba(34, 197, 94, 0.12);
}

.status-dot-large {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transition: all 0.3s;
}

.status-dot-large.online {
  background-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.18);
}

.status-dot-large.offline {
  background-color: #94a3b8;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
}

.client-main-id {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text);
  line-height: 1.2;
}

.hostname-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--app-accent-soft);
  color: var(--app-text-muted);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 24px;
  font-size: 13px;
  color: var(--app-text-muted);
  flex-wrap: wrap;
}

.meta-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-label {
  color: var(--app-text-faint);
  font-weight: 500;
  font-size: 13px;
}

.meta-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text);
}

.activity .meta-value {
  font-weight: 400;
  color: var(--app-text-muted);
}

.card-action {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.arrow-icon {
  font-size: 18px;
  color: var(--app-text-faint);
  transition: all 0.2s;
}

.client-card:hover .arrow-icon {
  color: var(--app-text);
  transform: translateX(4px);
}

@media (max-width: 640px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-icon-wrapper {
    width: 48px;
    height: 48px;
  }

  .card-action {
    align-self: flex-start;
  }
}
</style>
