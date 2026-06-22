<template>
  <n-space vertical size="large">
    <n-text class="page-title" strong>服务端总览</n-text>

    <n-grid responsive="screen" cols="1 s:2 m:4" :x-gap="16" :y-gap="16">
      <n-grid-item v-for="item in statsCards" :key="item.label">
        <n-card size="small">
          <template v-if="item.kind === 'traffic'">
            <n-space vertical :size="8">
              <n-text depth="3">{{ item.label }}</n-text>
              <n-space vertical :size="4">
                <n-space align="center" :size="6">
                  <n-icon :size="16" color="var(--n-success-color)">
                    <ArrowDownOutline />
                  </n-icon>
                  <n-text strong>{{ item.inValue }}</n-text>
                  <n-text depth="3">入站</n-text>
                </n-space>
                <n-space align="center" :size="6">
                  <n-icon :size="16" color="var(--n-error-color)">
                    <ArrowUpOutline />
                  </n-icon>
                  <n-text strong>{{ item.outValue }}</n-text>
                  <n-text depth="3">出站</n-text>
                </n-space>
              </n-space>
              <n-text depth="3">{{ item.subtitle }}</n-text>
            </n-space>
          </template>
          <template v-else>
            <n-statistic :label="item.label" :value="item.value" />
            <n-text depth="3">{{ item.subtitle }}</n-text>
          </template>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-grid responsive="screen" cols="1 m:2" :x-gap="16" :y-gap="16">
      <n-grid-item>
        <n-card>
          <template #header>
            <n-text strong>代理类型</n-text>
          </template>

          <n-empty v-if="proxyTypeEntries.length === 0" description="暂无活跃代理" />
          <n-space v-else wrap :size="8">
            <n-tag v-for="[type, count] in proxyTypeEntries" :key="type" round>
              {{ type.toUpperCase() }} {{ count }}
            </n-tag>
          </n-space>
        </n-card>
      </n-grid-item>

      <n-grid-item>
        <n-card :bordered="false">
          <template #header>
            <n-text strong>运行参数</n-text>
          </template>

          <n-grid responsive="screen" cols="1 s:2" :x-gap="12" :y-gap="12">
            <n-grid-item v-for="item in configItems" :key="item.label">
              <n-card size="small">
                <n-space vertical :size="4">
                  <n-text depth="3" class="config-label">{{ item.label }}</n-text>
                  <n-text strong class="config-value">{{ item.value }}</n-text>
                </n-space>
              </n-card>
            </n-grid-item>
          </n-grid>
        </n-card>
      </n-grid-item>
    </n-grid>
  </n-space>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDownOutline, ArrowUpOutline } from '@vicons/ionicons5'
import { NCard, NEmpty, NGrid, NGridItem, NIcon, NSpace, NStatistic, NTag, NText } from 'naive-ui'
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
    kind: 'traffic',
    inValue: formatFileSize(data.value.totalTrafficIn),
    outValue: formatFileSize(data.value.totalTrafficOut),
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
.page-title {
  font-size: 28px;
}

.config-label {
  font-size: 12px;
}

.config-value {
  word-break: break-all;
}
</style>
