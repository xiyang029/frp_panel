<template>
  <n-space vertical size="large">
    <n-breadcrumb separator=">">
      <template v-if="fromClient">
        <n-breadcrumb-item>
          <router-link to="/clients" class="breadcrumb-link">客户端列表</router-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>
          <router-link :to="`/clients/${fromClient}`" class="breadcrumb-link">
            {{ fromClient }}
          </router-link>
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
      <n-empty v-if="!proxy" description="该代理不存在，或已被移除。">
        <template #extra>
          <n-button type="primary" size="small" @click="router.push('/proxies')">
            返回代理列表
          </n-button>
        </template>
      </n-empty>

      <n-space v-else vertical size="large">
        <n-card :bordered="false">
          <n-space vertical size="large">
            <n-space justify="space-between" align="start" wrap>
              <n-space align="start" :size="16" wrap>
                <div class="proxy-icon" :style="{ backgroundColor: proxyIconConfig.color }">
                  <span>{{ proxyIconConfig.text }}</span>
                </div>
                <n-space vertical :size="6">
                  <n-space align="center" :size="8" :wrap="true">
                    <n-text class="proxy-name" strong>{{ proxy.name }}</n-text>
                    <n-tag :bordered="false" size="small" type="info" round uppercase>
                      {{ proxy.type }}
                    </n-tag>
                    <n-tag
                      :bordered="false"
                      size="small"
                      :type="proxy.status === 'online' ? 'success' : 'default'"
                      round
                    >
                      {{ proxy.status }}
                    </n-tag>
                  </n-space>
                  <n-space align="center" :size="8" wrap>
                    <n-button v-if="proxy.clientID" text @click="router.push(clientLink)">
                      <template #icon>
                        <n-icon><DesktopOutline /></n-icon>
                      </template>
                      {{ proxy.user ? `${proxy.user}.${proxy.clientID}` : proxy.clientID }}
                    </n-button>
                    <n-text v-if="proxy.lastStartTime" depth="3">
                      最近启动 {{ proxy.lastStartTime }}
                    </n-text>
                    <n-text v-if="proxy.lastCloseTime" depth="3">
                      最近关闭 {{ proxy.lastCloseTime }}
                    </n-text>
                  </n-space>
                </n-space>
              </n-space>
            </n-space>

            <n-grid responsive="screen" cols="1 s:3" :x-gap="12" :y-gap="12">
              <n-grid-item v-if="proxy.port">
                <n-card size="small">
                  <n-statistic label="端口" :value="proxy.port" />
                </n-card>
              </n-grid-item>
              <n-grid-item>
                <n-card size="small">
                  <n-statistic label="连接数" :value="proxy.conns" />
                </n-card>
              </n-grid-item>
              <n-grid-item>
                <n-card size="small">
                  <n-statistic label="流量">
                    <template #default>
                      <n-space align="center" :size="4">
                        <n-text strong>↓ {{ formatFileSize(proxy.trafficIn) }}</n-text>
                        <n-text depth="3">/</n-text>
                        <n-text strong>↑ {{ formatFileSize(proxy.trafficOut) }}</n-text>
                      </n-space>
                    </template>
                  </n-statistic>
                </n-card>
              </n-grid-item>
            </n-grid>
          </n-space>
        </n-card>

        <n-card :bordered="false">
          <template #header>
            <n-space align="center" :size="8">
              <n-icon :size="18"><SettingsOutline /></n-icon>
              <n-text strong>配置信息</n-text>
            </n-space>
          </template>

          <n-grid responsive="screen" cols="1 s:2" :x-gap="12" :y-gap="12">
            <n-grid-item v-if="proxy.encryption !== undefined">
              <n-card size="small">
                <n-space align="center" :size="12">
                  <n-tag :bordered="false" type="success" round>加密</n-tag>
                  <n-text>{{ proxy.encryption ? '已启用' : '未启用' }}</n-text>
                </n-space>
              </n-card>
            </n-grid-item>

            <n-grid-item v-if="proxy.compression !== undefined">
              <n-card size="small">
                <n-space align="center" :size="12">
                  <n-tag :bordered="false" type="info" round>压缩</n-tag>
                  <n-text>{{ proxy.compression ? '已启用' : '未启用' }}</n-text>
                </n-space>
              </n-card>
            </n-grid-item>

            <n-grid-item v-if="proxy.customDomains">
              <n-card size="small">
                <n-space vertical :size="4">
                  <n-text depth="3">自定义域名</n-text>
                  <n-text strong>{{ proxy.customDomains }}</n-text>
                </n-space>
              </n-card>
            </n-grid-item>

            <n-grid-item v-if="proxy.subdomain">
              <n-card size="small">
                <n-space vertical :size="4">
                  <n-text depth="3">子域名</n-text>
                  <n-text strong>{{ proxy.subdomain }}</n-text>
                </n-space>
              </n-card>
            </n-grid-item>

            <n-grid-item v-if="proxy.locations">
              <n-card size="small">
                <n-space vertical :size="4">
                  <n-text depth="3">路由路径</n-text>
                  <n-text strong>{{ proxy.locations }}</n-text>
                </n-space>
              </n-card>
            </n-grid-item>

            <n-grid-item v-if="proxy.hostHeaderRewrite">
              <n-card size="small">
                <n-space vertical :size="4">
                  <n-text depth="3">Host 重写</n-text>
                  <n-text strong>{{ proxy.hostHeaderRewrite }}</n-text>
                </n-space>
              </n-card>
            </n-grid-item>

            <n-grid-item v-if="proxy.multiplexer">
              <n-card size="small">
                <n-space vertical :size="4">
                  <n-text depth="3">复用器</n-text>
                  <n-text strong>{{ proxy.multiplexer }}</n-text>
                </n-space>
              </n-card>
            </n-grid-item>

            <n-grid-item v-if="proxy.routeByHTTPUser">
              <n-card size="small">
                <n-space vertical :size="4">
                  <n-text depth="3">按 HTTP 用户路由</n-text>
                  <n-text strong>{{ proxy.routeByHTTPUser }}</n-text>
                </n-space>
              </n-card>
            </n-grid-item>
          </n-grid>

          <n-space v-if="proxy.annotations && proxy.annotations.size > 0" class="annotations-section" wrap :size="8">
            <n-tag v-for="[key, value] in proxy.annotations" :key="key" :bordered="false" size="small">
              {{ key }}: {{ value }}
            </n-tag>
          </n-space>
        </n-card>

        <n-card :bordered="false" title="流量统计">
          <n-spin :show="trafficLoading">
            <n-empty v-if="!trafficLoading && chartData.length === 0" description="暂无流量数据" />

            <n-space v-else vertical :size="16" class="traffic-card">
              <n-space justify="space-between" align="center">
                <n-space :size="16">
                  <n-text depth="3">近 7 天流量</n-text>
                  <n-text depth="3">
                    峰值 {{ chartData.some(d => d.in > 0 || d.out > 0) ? formatFileSize(maxTrafficValue) : '0 B' }}
                  </n-text>
                </n-space>
                <n-space :size="12" align="center">
                  <n-space align="center" :size="6">
                    <span class="legend-dot in" />
                    <n-text depth="3">入站流量</n-text>
                  </n-space>
                  <n-space align="center" :size="6">
                    <span class="legend-dot out" />
                    <n-text depth="3">出站流量</n-text>
                  </n-space>
                </n-space>
              </n-space>

              <div class="chart-grid">
                <div class="chart-axis">
                  <span>{{ formatFileSize(maxTrafficValue) }}</span>
                  <span>{{ formatFileSize(maxTrafficValue / 2) }}</span>
                  <span>0</span>
                </div>

                <div class="bars-area">
                  <div class="grid-line top" />
                  <div class="grid-line middle" />
                  <div class="grid-line bottom" />

                  <div v-for="(item, index) in chartData" :key="index" class="day-column">
                    <div class="bars-group">
                      <n-tooltip placement="top">
                        <template #trigger>
                          <div class="bar bar-in" :style="{ height: item.inPercent + '%' }" />
                        </template>
                        入站：{{ formatFileSize(item.in) }}
                      </n-tooltip>
                      <n-tooltip placement="top">
                        <template #trigger>
                          <div class="bar bar-out" :style="{ height: item.outPercent + '%' }" />
                        </template>
                        出站：{{ formatFileSize(item.out) }}
                      </n-tooltip>
                    </div>
                    <span class="date-label">{{ item.date }}</span>
                  </div>
                </div>
              </div>
            </n-space>
          </n-spin>
        </n-card>
      </n-space>
    </n-spin>
  </n-space>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NBreadcrumb,
  NBreadcrumbItem,
  NButton,
  NCard,
  NEmpty,
  NGrid,
  NGridItem,
  NIcon,
  NSpace,
  NSpin,
  NStatistic,
  NTag,
  NText,
  NTooltip,
} from 'naive-ui'
import { DesktopOutline, SettingsOutline } from '@vicons/ionicons5'
import { getProxyByName } from '../api/proxy'
import { getServerInfo } from '../api/server'
import {
  BaseProxy,
  TCPProxy,
  UDPProxy,
  HTTPProxy,
  HTTPSProxy,
  TCPMuxProxy,
  STCPProxy,
  SUDPProxy,
} from '../utils/proxy'
import { getProxyTraffic } from '../api/proxy'
import { formatFileSize } from '../utils/format'
import { createMessageHelpers } from '../naive'

const route = useRoute()
const router = useRouter()
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
const trafficLoading = ref(false)
const chartData = ref<
  Array<{
    date: string
    in: number
    out: number
    inPercent: number
    outPercent: number
  }>
>([])
const maxTrafficValue = ref(0)

let serverInfo: any = null

const clientLink = computed(() => {
  if (!proxy.value) return ''
  const key = proxy.value.user ? `${proxy.value.user}.${proxy.value.clientID}` : proxy.value.clientID
  return `/clients/${key}`
})

// 修复：添加确切的十六进制色值，解决在白底卡片或 CSS 变量未渲染完整时的隐形 Bug
const proxyIconConfig = computed(() => {
  const type = proxy.value?.type?.toLowerCase() || 'tcp'
  const firstChar = type.charAt(0).toUpperCase()
  
  const colors: Record<string, string> = {
    tcp: '#18a058',     
    udp: '#2080f0',     
    http: '#18a058',    
    https: '#f0a020',   
    stcp: '#d03050',    
    sudp: '#f0a020',    
    tcpmux: '#2080f0',  
    xtcp: '#18a058',    
  }
  
  return {
    text: firstChar,
    color: colors[type] || '#18a058'
  }
})

const processTrafficData = (trafficIn: number[], trafficOut: number[]) => {
  const inArr = [...(trafficIn || [])].reverse()
  const outArr = [...(trafficOut || [])].reverse()

  while (inArr.length < 7) inArr.unshift(0)
  while (outArr.length < 7) outArr.unshift(0)

  const finalIn = inArr.slice(-7)
  const finalOut = outArr.slice(-7)

  const dates: string[] = []
  const d = new Date()
  d.setDate(d.getDate() - 6)

  for (let i = 0; i < 7; i++) {
    dates.push(`${d.getMonth() + 1}-${d.getDate()}`)
    d.setDate(d.getDate() + 1)
  }

  const maxIn = Math.max(...finalIn)
  const maxOut = Math.max(...finalOut)
  const realMax = Math.max(maxIn, maxOut)

  // 修复：当零流量时分配一个虚拟的 100 KB 基准轴（102400 B），防止纵坐标被挤压成一排 0 B
  maxTrafficValue.value = realMax > 0 ? realMax : 102400

  chartData.value = dates.map((date, i) => {
    // 修复：当没有实际流量时，百分比高度严格控制为 0，防止底部出现无意义细线
    const inPercent = realMax > 0 ? (finalIn[i] / maxTrafficValue.value) * 100 : 0
    const outPercent = realMax > 0 ? (finalOut[i] / maxTrafficValue.value) * 100 : 0
    
    return {
      date,
      in: finalIn[i],
      out: finalOut[i],
      inPercent,
      outPercent,
    }
  })
}

const fetchTraffic = () => {
  if (!proxyName.value) return
  trafficLoading.value = true
  getProxyTraffic(proxyName.value)
    .then((json) => {
      processTrafficData(json.trafficIn, json.trafficOut)
    })
    .catch((err) => {
      message.warning('获取流量信息失败：' + err)
    })
    .finally(() => {
      trafficLoading.value = false
    })
}

const fetchServerInfo = async () => {
  if (serverInfo) return serverInfo
  serverInfo = await getServerInfo()
  return serverInfo
}

const fetchProxy = async () => {
  const name = proxyName.value
  if (!name) {
    loading.value = false
    return
  }
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
    else {
      proxy.value = new BaseProxy(data)
      proxy.value.type = type
    }
  } catch (error: any) {
    message.error('获取代理详情失败：' + error.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProxy()
  fetchTraffic()
})
</script>

<style scoped>
.proxy-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff !important; /* 强制锁定文字颜色为纯白 */
  flex-shrink: 0;
  font-size: 26px;
  font-weight: bold;
}

.proxy-name {
  font-size: 20px;
}

.annotations-section {
  margin-top: 16px;
}

.traffic-card {
  width: 100%;
}

.chart-grid {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 16px;
  height: 320px; /* 固定整体高度，为内部子容器分配基准参照 */
}

.chart-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 28px;
  font-size: 12px;
  color: var(--n-text-color-3);
  text-align: right;
}

.bars-area {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 28px;
  height: 100%;
  box-sizing: border-box;
}

.grid-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-color: var(--n-divider-color);
}

.grid-line.top { top: 0; }
.grid-line.middle { top: calc(50% - 14px); }
.grid-line.bottom { bottom: 28px; }

.day-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bars-group {
  width: 60%;
  flex: 1; /* 自动撑满上方空位，杜绝百分比在流式布局下塌陷 */
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.bar {
  flex: 1;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
}

.bar-in { background-color: #18a058; }
.bar-out { background-color: #2080f0; }

.date-label {
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: var(--n-text-color-3);
  padding-top: 8px; /* 抛弃负坐标，改用标准容器内边距撑开 */
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
}

.legend-dot.in { background-color: #18a058; }
.legend-dot.out { background-color: #2080f0; }
</style>