<template>
  <section class="overview-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">服务端总览</h1>
        <p class="page-subtitle">查看当前 frps 运行指标与服务端运行参数。</p>
      </div>
      <n-button secondary @click="fetchData" :loading="loading">刷新</n-button>
    </div>

    <div class="stats-grid">
      <n-card v-for="item in statsCards" :key="item.label" :bordered="false" class="stat-card">
        <div class="stat-label">{{ item.label }}</div>
        <div class="stat-value">{{ item.value }}</div>
        <div class="stat-subtitle">{{ item.subtitle }}</div>
      </n-card>
    </div>

    <div class="content-grid">
      <n-card :bordered="false" class="panel-card">
        <template #header>
          <div class="panel-title">代理类型</div>
        </template>
        <div v-if="proxyTypeEntries.length" class="proxy-grid">
          <div v-for="[type, count] in proxyTypeEntries" :key="type" class="proxy-pill">
            <span>{{ type.toUpperCase() }}</span>
            <strong>{{ count }}</strong>
          </div>
        </div>
        <n-empty v-else description="暂无活跃代理" />
      </n-card>

      <n-card :bordered="false" class="panel-card">
        <template #header>
          <div class="panel-title">运行参数</div>
        </template>
        <div class="config-grid">
          <div v-for="item in configItems" :key="item.label" class="config-item">
            <span class="config-label">{{ item.label }}</span>
            <span class="config-value">{{ item.value }}</span>
          </div>
        </div>
      </n-card>
    </div>

  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NCard, NEmpty } from 'naive-ui'
import { formatFileSize } from '../utils/format'
import { createMessageHelpers } from '../naive'
import { getServerInfo } from '../api/server'

const message = createMessageHelpers()
const loading = ref(false)

const data = ref({
  version: '',
  bindPort: 0,
  kcpBindPort: 0,
  quicBindPort: 0,
  vhostHTTPPort: 0,
  vhostHTTPSPort: 0,
  tcpmuxHTTPConnectPort: 0,
  subdomainHost: '',
  maxPoolCount: 0,
  maxPortsPerClient: 0,
  heartbeatTimeout: 0,
  allowPortsStr: '',
  tlsForce: false,
  clientCounts: 0,
  curConns: 0,
  totalTrafficIn: 0,
  totalTrafficOut: 0,
  proxyTypeCount: {} as Record<string, number>,
})

const statsCards = computed(() => [
  { label: '客户端', value: data.value.clientCounts, subtitle: '当前已连接实例' },
  {
    label: '代理数',
    value: Object.values(data.value.proxyTypeCount).reduce((sum, count) => sum + count, 0),
    subtitle: '当前活跃代理',
  },
  { label: '连接数', value: data.value.curConns, subtitle: '实时连接数' },
  {
    label: '今日流量',
    value: formatFileSize(data.value.totalTrafficIn + data.value.totalTrafficOut),
    subtitle: '入站 + 出站',
  },
])

const proxyTypeEntries = computed(() =>
  Object.entries(data.value.proxyTypeCount).filter(([, count]) => count > 0),
)

const configItems = computed(() => [
  { label: '版本', value: `v${data.value.version}` },
  { label: 'Bind Port', value: data.value.bindPort || '-' },
  { label: 'KCP Port', value: data.value.kcpBindPort || '-' },
  { label: 'QUIC Port', value: data.value.quicBindPort || '-' },
  { label: 'HTTP Port', value: data.value.vhostHTTPPort || '-' },
  { label: 'HTTPS Port', value: data.value.vhostHTTPSPort || '-' },
  { label: 'TCPMux Port', value: data.value.tcpmuxHTTPConnectPort || '-' },
  { label: 'Subdomain Host', value: data.value.subdomainHost || '-' },
  { label: 'Max Pool Count', value: data.value.maxPoolCount || '-' },
  {
    label: 'Max Ports / Client',
    value: data.value.maxPortsPerClient === 0 ? 'no limit' : data.value.maxPortsPerClient,
  },
  { label: 'Allow Ports', value: data.value.allowPortsStr || '-' },
  { label: 'TLS Force', value: data.value.tlsForce ? 'enabled' : 'disabled' },
  { label: 'Heartbeat Timeout', value: `${data.value.heartbeatTimeout}s` },
])

const fetchData = async () => {
  loading.value = true
  try {
    const info = await getServerInfo()
    data.value = {
      ...data.value,
      ...info,
      proxyTypeCount: info.proxyTypeCount || {},
    }
  } catch (err: any) {
    message.error('获取服务端信息失败: ' + (err.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

fetchData()
</script>

<style scoped>
.overview-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stat-card,
.panel-card {
  background: var(--app-panel);
  backdrop-filter: blur(16px);
  box-shadow: var(--app-shadow);
}

.stat-label {
  font-size: 13px;
  color: var(--app-text-muted);
}

.stat-value {
  margin-top: 10px;
  font-size: 30px;
  font-weight: 800;
  color: var(--app-text);
}

.stat-subtitle {
  margin-top: 8px;
  font-size: 13px;
  color: var(--app-text-muted);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 16px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--app-text);
}

.proxy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.proxy-pill {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--app-accent-soft);
  color: var(--app-text);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.config-item {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--app-border);
}

.config-label {
  display: block;
  font-size: 12px;
  color: var(--app-text-muted);
}

.config-value {
  display: block;
  margin-top: 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--app-text);
  word-break: break-all;
}

@media (max-width: 1024px) {
  .stats-grid,
  .content-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
