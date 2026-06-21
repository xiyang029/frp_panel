<template>
  <div class="proxy-detail-page">
    <n-breadcrumb separator=">">
      <template v-if="fromClient">
        <n-breadcrumb-item>
          <router-link to="/clients" class="breadcrumb-link">客户端列表</router-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>
          <router-link :to="`/clients/${fromClient}`" class="breadcrumb-link">{{ fromClient }}</router-link>
        </n-breadcrumb-item>
      </template>
      <template v-else>
        <n-breadcrumb-item>
          <router-link to="/proxies" class="breadcrumb-link">代理列表</router-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item v-if="proxy?.clientID">
          <router-link :to="clientLink" class="breadcrumb-link">
            {{ proxy.user ? `${proxy.user}.${proxy.clientID}` : proxy.clientID }}
          </router-link>
        </n-breadcrumb-item>
      </template>
      <n-breadcrumb-item>{{ proxyName }}</n-breadcrumb-item>
    </n-breadcrumb>

    <n-spin :show="loading">
      <div class="detail-content" style="min-height: 200px">
        <template v-if="proxy">
          <n-flex align="start" :wrap="false" class="header-section" :size="16">
            <div class="proxy-icon" :style="{ background: proxyIconConfig.gradient }">
              <n-icon>
                <component :is="proxyIconConfig.icon" />
              </n-icon>
            </div>
            <n-flex vertical size="small" style="flex: 1; min-width: 0;">
              <n-flex align="center" :size="12">
                <h1 class="proxy-name">{{ proxy.name }}</h1>
                <n-tag :bordered="false" size="small" type="info" uppercase>{{ proxy.type }}</n-tag>
                <n-tag :bordered="false" size="small" :type="proxy.status === 'online' ? 'success' : 'default'">
                  {{ proxy.status }}
                </n-tag>
              </n-flex>
              <n-flex align="center" :size="8" class="header-meta">
                <router-link v-if="proxy.clientID" :to="clientLink" class="meta-link">
                  <n-icon><desktop-outline /></n-icon>
                  <span>{{ proxy.user ? `${proxy.user}.${proxy.clientID}` : proxy.clientID }}</span>
                </router-link>
                <span v-if="proxy.lastStartTime" class="meta-text">
                  • 最近启动 {{ proxy.lastStartTime }}
                </span>
                <span v-if="proxy.lastCloseTime" class="meta-text">
                  • 最近关闭 {{ proxy.lastCloseTime }}
                </span>
              </n-flex>
            </n-flex>
          </n-flex>

          <n-grid cols="1 s:3" responsive="screen" :x-gap="16" :y-gap="16" item-style="height: 100%;">
            <n-gi v-if="proxy.port">
              <n-card size="small">
                <n-statistic label="端口" :value="proxy.port" />
              </n-card>
            </n-gi>
            <n-gi>
              <n-card size="small">
                <n-statistic label="连接数" :value="proxy.conns" />
              </n-card>
            </n-gi>
            <n-gi>
              <n-card size="small">
                <n-statistic label="流量">
                  <template #default>
                    <span class="traffic-value">
                      ↓ {{ formatTrafficValue(proxy.trafficIn) }}<small class="traffic-unit">{{
                        formatTrafficUnit(proxy.trafficIn) }}</small>
                    </span>
                    <span class="traffic-sep">/</span>
                    <span class="traffic-value">
                      ↑ {{ formatTrafficValue(proxy.trafficOut) }}<small class="traffic-unit">{{
                        formatTrafficUnit(proxy.trafficOut) }}</small>
                    </span>
                  </template>
                </n-statistic>
              </n-card>
            </n-gi>
          </n-grid>

          <div class="config-section">
            <n-flex align="center" :size="8" class="config-section-header">
              <n-icon size="18"><settings-outline /></n-icon>
              <h2>配置信息</h2>
            </n-flex>

            <n-grid cols="1 s:2" responsive="screen" :x-gap="16" :y-gap="16" item-style="height: 100%;">
              <n-gi>
                <n-card size="small" class="config-item-card">
                  <n-flex align="center" :wrap="false" :size="14">
                    <div class="config-item-icon encryption"><n-icon><lock-closed-outline /></n-icon></div>
                    <div>
                      <div class="config-item-label">加密</div>
                      <div class="config-item-value">{{ proxy.encryption ? '已启用' : '未启用' }}</div>
                    </div>
                  </n-flex>
                </n-card>
              </n-gi>

              <n-gi>
                <n-card size="small" class="config-item-card">
                  <n-flex align="center" :wrap="false" :size="14">
                    <div class="config-item-icon compression"><n-icon><flash-outline /></n-icon></div>
                    <div>
                      <div class="config-item-label">压缩</div>
                      <div class="config-item-value">{{ proxy.compression ? '已启用' : '未启用' }}</div>
                    </div>
                  </n-flex>
                </n-card>
              </n-gi>

              <n-gi v-if="proxy.customDomains">
                <n-card size="small" class="config-item-card">
                  <n-flex align="center" :wrap="false" :size="14">
                    <div class="config-item-icon domains"><n-icon><link-outline /></n-icon></div>
                    <div>
                      <div class="config-item-label">自定义域名</div>
                      <div class="config-item-value">{{ proxy.customDomains }}</div>
                    </div>
                  </n-flex>
                </n-card>
              </n-gi>

              <n-gi v-if="proxy.subdomain">
                <n-card size="small" class="config-item-card">
                  <n-flex align="center" :wrap="false" :size="14">
                    <div class="config-item-icon subdomain"><n-icon><link-outline /></n-icon></div>
                    <div>
                      <div class="config-item-label">子域名</div>
                      <div class="config-item-value">{{ proxy.subdomain }}</div>
                    </div>
                  </n-flex>
                </n-card>
              </n-gi>

              <n-gi v-if="proxy.locations">
                <n-card size="small" class="config-item-card">
                  <n-flex align="center" :wrap="false" :size="14">
                    <div class="config-item-icon locations"><n-icon><location-outline /></n-icon></div>
                    <div>
                      <div class="config-item-label">路由路径</div>
                      <div class="config-item-value">{{ proxy.locations }}</div>
                    </div>
                  </n-flex>
                </n-card>
              </n-gi>

              <n-gi v-if="proxy.hostHeaderRewrite">
                <n-card size="small" class="config-item-card">
                  <n-flex align="center" :wrap="false" :size="14">
                    <div class="config-item-icon host"><n-icon><ticket-outline /></n-icon></div>
                    <div>
                      <div class="config-item-label">Host 重写</div>
                      <div class="config-item-value">{{ proxy.hostHeaderRewrite }}</div>
                    </div>
                  </n-flex>
                </n-card>
              </n-gi>

              <n-gi v-if="proxy.multiplexer">
                <n-card size="small" class="config-item-card">
                  <n-flex align="center" :wrap="false" :size="14">
                    <div class="config-item-icon multiplexer"><n-icon><hardware-chip-outline /></n-icon></div>
                    <div>
                      <div class="config-item-label">复用器</div>
                      <div class="config-item-value">{{ proxy.multiplexer }}</div>
                    </div>
                  </n-flex>
                </n-card>
              </n-gi>

              <n-gi v-if="proxy.routeByHTTPUser">
                <n-card size="small" class="config-item-card">
                  <n-flex align="center" :wrap="false" :size="14">
                    <div class="config-item-icon route"><n-icon><git-network-outline /></n-icon></div>
                    <div>
                      <div class="config-item-label">按 HTTP 用户路由</div>
                      <div class="config-item-value">{{ proxy.routeByHTTPUser }}</div>
                    </div>
                  </n-flex>
                </n-card>
              </n-gi>
            </n-grid>

            <template v-if="proxy.annotations && proxy.annotations.size > 0">
              <n-space class="annotations-section" :size="8">
                <n-tag v-for="[key, value] in proxy.annotations" :key="key" :bordered="false" size="small">
                  {{ key }}: {{ value }}
                </n-tag>
              </n-space>
            </template>
          </div>

          <n-card title="流量统计">
            <div>
              <Traffic :proxy-name="proxyName" />
            </div>
          </n-card>
        </template>

        <div v-else-if="!loading" class="not-found">
          <n-empty description="该代理不存在，或已被移除。">
            <template #extra>
              <router-link to="/proxies">
                <n-button type="primary" size="small">返回代理列表</n-button>
              </router-link>
            </template>
          </n-empty>
        </div>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  NBreadcrumb, NBreadcrumbItem, NButton, NIcon, NGrid, NGi,
  NCard, NFlex, NTag, NStatistic, NSpace, NEmpty, NSpin
} from 'naive-ui'
import {
  DesktopOutline, FlashOutline, GitNetworkOutline, GridOutline,
  HardwareChipOutline, LinkOutline, LockClosedOutline, LocationOutline,
  MegaphoneOutline, SettingsOutline, SwapHorizontalOutline, TicketOutline,
} from '@vicons/ionicons5'
import { getProxyByName } from '../api/proxy'
import { getServerInfo } from '../api/server'
import {
  BaseProxy, TCPProxy, UDPProxy, HTTPProxy, HTTPSProxy, TCPMuxProxy, STCPProxy, SUDPProxy,
} from '../utils/proxy'
import Traffic from '../components/Traffic.vue'
import { createMessageHelpers } from '../naive'

const route = useRoute()
const message = createMessageHelpers()
const proxyName = computed(() => route.params.name as string)
const fromClient = computed(() => {
  if (route.query.from === 'client' && route.query.client) {
    return route.query.client as string
  }
  return null
})
const proxy = ref<BaseProxy | null>(null)
const loading = ref(true)

let serverInfo: any = null

const clientLink = computed(() => {
  if (!proxy.value) return ''
  const key = proxy.value.user ? `${proxy.value.user}.${proxy.value.clientID}` : proxy.value.clientID
  return `/clients/${key}`
})

const proxyIconConfig = computed(() => {
  const type = proxy.value?.type?.toLowerCase() || ''
  const configs: Record<string, { icon: any; gradient: string }> = {
    tcp: { icon: SwapHorizontalOutline, gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
    udp: { icon: MegaphoneOutline, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
    http: { icon: LinkOutline, gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' },
    https: { icon: LockClosedOutline, gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' },
    stcp: { icon: LockClosedOutline, gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
    sudp: { icon: LockClosedOutline, gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
    tcpmux: { icon: GridOutline, gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
    xtcp: { icon: SwapHorizontalOutline, gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' },
  }
  return configs[type] || { icon: SwapHorizontalOutline, gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }
})

const formatTrafficValue = (bytes: number): string => {
  if (bytes === 0) return '0'
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)
}

const formatTrafficUnit = (bytes: number): string => {
  if (bytes === 0) return 'B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  return units[Math.floor(Math.log(bytes) / Math.log(1024))]
}

const fetchServerInfo = async () => {
  if (serverInfo) return serverInfo
  serverInfo = await getServerInfo()
  return serverInfo
}

const fetchProxy = async () => {
  const name = proxyName.value
  if (!name) { loading.value = false; return }
  try {
    const data = await getProxyByName(name)
    const info = await fetchServerInfo()
    const type = data.conf?.type || ''

    if (type === 'tcp') proxy.value = new TCPProxy(data)
    else if (type === 'udp') proxy.value = new UDPProxy(data)
    else if (type === 'http' && info?.vhostHTTPPort) proxy.value = new HTTPProxy(data, info.vhostHTTPPort, info.subdomainHost)
    else if (type === 'https' && info?.vhostHTTPSPort) proxy.value = new HTTPSProxy(data, info.vhostHTTPSPort, info.subdomainHost)
    else if (type === 'tcpmux' && info?.tcpmuxHTTPConnectPort) proxy.value = new TCPMuxProxy(data, info.tcpmuxHTTPConnectPort, info.subdomainHost)
    else if (type === 'stcp') proxy.value = new STCPProxy(data)
    else if (type === 'sudp') proxy.value = new SUDPProxy(data)
    else { proxy.value = new BaseProxy(data); proxy.value.type = type }
  } catch (error: any) {
    message.error('获取代理详情失败：' + error.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchProxy() })
</script>

<style scoped>
.n-breadcrumb {
  margin-bottom: 24px;
}

.breadcrumb-link {
  display: inline-flex;
  align-items: center;
  color: var(--app-text-muted);
  text-decoration: none;
}

.breadcrumb-link:hover {
  color: var(--app-text);
}

/* Header Section */
.header-section {
  margin-bottom: 24px;
}

.proxy-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: white;
}

.proxy-name {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.header-meta {
  font-size: 13px;
  color: var(--text-secondary);
}

.meta-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  text-decoration: none;
}

.meta-text {
  color: var(--text-muted);
}

/* Stats Bar & Cards */

.traffic-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--n-value-text-color);
}

.traffic-unit {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-left: 2px;
}

.traffic-sep {
  margin: 0 6px;
  color: var(--text-muted);
  font-size: 16px;
}

/* Config Section */
.config-section {
  margin-bottom: 24px;
}

.config-section-header h2 {
  font-size: 16px;
  font-weight: 500;
}

.config-item-card {
  height: 100%;
}

.config-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.config-item-icon.encryption,
.config-item-icon.compression {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.config-item-icon.domains,
.config-item-icon.subdomain {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.config-item-icon.locations,
.config-item-icon.multiplexer {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.config-item-icon.host {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
}

.config-item-icon.route {
  background: rgba(236, 72, 153, 0.1);
  color: #ec4899;
}

.config-item-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.config-item-value {
  font-size: 14px;
  font-weight: 500;
  word-break: break-all;
  margin-top: 2px;
}

.annotations-section {
  margin-top: 16px;
}

.not-found {
  padding: 60px 0;
}

@media (max-width: 640px) {
  .header-section {
    flex-direction: column;
  }
}
</style>