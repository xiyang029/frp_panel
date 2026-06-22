<template>
  <n-space vertical size="large">
    <n-breadcrumb separator=">">
        <n-breadcrumb-item>
          <router-link to="/clients" style="text-decoration: none;">客户端列表</router-link>
        </n-breadcrumb-item>
      <n-breadcrumb-item>{{ client?.displayName || route.params.key }}</n-breadcrumb-item>
    </n-breadcrumb>

    <n-spin :show="loading">
      <n-space v-if="client" vertical size="large">
        <n-card :bordered="false">
          <n-space vertical size="large">
            <n-space justify="space-between" align="start" wrap>
              <n-space align="center" :size="12" :wrap="false">
                <n-avatar round :size="56">
                  {{ client.displayName.charAt(0).toUpperCase() }}
                </n-avatar>
                <n-space vertical :size="6">
                  <n-space align="center" :size="8" :wrap="true">
                <n-text strong style="font-size: 20px;">{{ client.displayName }}</n-text>
                    <n-tag v-if="client.version" size="small" type="success" round>
                      v{{ client.version }}
                    </n-tag>
                    <n-tag v-if="client.wireProtocolLabel" size="small" type="info" round>
                      {{ client.wireProtocolLabel }}
                    </n-tag>
                  </n-space>
                  <n-space :size="8" wrap>
                    <n-text depth="3" v-if="client.ip">{{ client.ip }}</n-text>
                    <n-text depth="3" v-if="client.hostname">{{ client.hostname }}</n-text>
                  </n-space>
                </n-space>
              </n-space>

              <n-tag :type="client.online ? 'success' : 'default'" round>
                {{ client.online ? '在线' : '离线' }}
              </n-tag>
            </n-space>

            <n-grid responsive="screen" cols="1 s:2 m:5" :x-gap="12" :y-gap="12">
              <n-grid-item v-for="item in infoItems" :key="item.label">
                <n-card size="small">
                  <n-space vertical :size="4">
                    <n-text depth="3" style="font-size: 12px;">{{ item.label }}</n-text>
                    <n-text strong style="word-break: break-all;">{{ item.value }}</n-text>
                  </n-space>
                </n-card>
              </n-grid-item>
            </n-grid>
          </n-space>
        </n-card>

        <n-card :bordered="false">
          <template #header>
            <n-space justify="space-between" align="center">
              <n-space align="center" :size="8">
                <n-text strong>代理列表</n-text>
                <n-tag round>{{ filteredProxies.length }}</n-tag>
              </n-space>
              <n-input v-model:value="proxySearch" placeholder="搜索代理名称或类型" clearable>
                <template #prefix>
                  <n-icon><Search /></n-icon>
                </template>
              </n-input>
            </n-space>
          </template>

          <n-spin :show="proxiesLoading">
            <n-space v-if="filteredProxies.length > 0" vertical :size="12">
              <router-link
                v-for="proxy in filteredProxies"
                :key="proxy.name"
                :to="proxyLink(proxy.name)"
                style="display: block; text-decoration: none;"
              >
                <n-card size="small" hoverable :style="{ cursor: 'pointer' }">
                  <n-space justify="space-between" align="start" wrap>
                    <n-space vertical :size="8" :style="{ minWidth: '0' }">
                      <n-space align="center" :size="8" wrap>
                        <n-text strong>{{ proxy.name }}</n-text>
                        <n-tag size="small" :bordered="false">
                          {{ proxy.type.toUpperCase() }}
                        </n-tag>
                        <n-tag size="small" :type="proxy.status === 'online' ? 'success' : 'error'" :bordered="false">
                          {{ proxy.status }}
                        </n-tag>
                      </n-space>

                      <n-space :size="8" wrap>
                        <n-text depth="3" v-if="proxy.port">端口: {{ proxy.port }}</n-text>
                        <n-text depth="3">连接数: {{ proxy.conns }}</n-text>
                        <n-text depth="3" v-if="proxy.clientID">
                          客户端: {{ proxy.user ? `${proxy.user}.${proxy.clientID}` : proxy.clientID }}
                        </n-text>
                      </n-space>
                    </n-space>

                    <n-space vertical align="end" :size="4" :style="{ flexShrink: 0 }">
                      <n-text depth="3">↑ {{ formatFileSize(proxy.trafficOut) }}</n-text>
                      <n-text depth="3">↓ {{ formatFileSize(proxy.trafficIn) }}</n-text>
                    </n-space>
                  </n-space>
                </n-card>
              </router-link>
            </n-space>
            <n-empty
              v-else-if="clientProxies.length > 0"
              :description="`没有匹配“${proxySearch}”的代理`"
            />
            <n-empty v-else description="暂无代理" />
          </n-spin>
        </n-card>
      </n-space>

      <n-empty v-else description="该客户端不存在，或已被移除。">
        <template #extra>
          <n-button type="primary" size="small" @click="router.push('/clients')">
            返回客户端列表
          </n-button>
        </template>
      </n-empty>
    </n-spin>
  </n-space>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NBreadcrumb,
  NBreadcrumbItem,
  NAvatar,
  NButton,
  NCard,
  NEmpty,
  NGrid,
  NGridItem,
  NIcon,
  NInput,
  NSpace,
  NSpin,
  NTag,
  NText,
} from 'naive-ui'
import { Search } from '@vicons/tabler'
import { Client } from '../utils/client'
import { getClient } from '../api/client'
import { getProxiesByType } from '../api/proxy'
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
import { getServerInfo } from '../api/server'
import { formatFileSize } from '../utils/format'
import { createMessageHelpers } from '../naive'

const route = useRoute()
const router = useRouter()
const message = createMessageHelpers()
const client = ref<Client | null>(null)
const loading = ref(true)
const proxiesLoading = ref(false)
const allProxies = ref<BaseProxy[]>([])
const proxySearch = ref('')

let serverInfo: {
  vhostHTTPPort: number
  vhostHTTPSPort: number
  tcpmuxHTTPConnectPort: number
  subdomainHost: string
} | null = null

const clientProxies = computed(() => {
  if (!client.value) return []
  return allProxies.value.filter(
    (p) => p.clientID === client.value!.clientID && p.user === client.value!.user,
  )
})

const filteredProxies = computed(() => {
  if (!proxySearch.value) return clientProxies.value
  const search = proxySearch.value.toLowerCase()
  return clientProxies.value.filter(
    (p) => p.name.toLowerCase().includes(search) || p.type.toLowerCase().includes(search),
  )
})

const totalConnections = computed(() => {
  return clientProxies.value.reduce((sum, p) => sum + p.conns, 0)
})

const proxyLink = (name: string) => {
  const base = `/proxy/${name}`
  return route.name === 'ClientDetail' && route.params.key
    ? `${base}?from=client&client=${route.params.key}`
    : base
}

const infoItems = computed(() => [
  { label: '连接数', value: totalConnections.value },
  { label: 'Run ID', value: client.value?.runID || '-' },
  { label: '协议', value: client.value?.wireProtocol || '-' },
  { label: '首次连接', value: client.value?.firstConnectedAgo || '-' },
  {
    label: client.value?.online ? '最近连接' : '最近断开',
    value: client.value?.online ? client.value?.lastConnectedAgo || '-' : client.value?.disconnectedAgo || '-',
  },
])

const fetchServerInfo = async () => {
  if (serverInfo) return serverInfo
  const res = await getServerInfo()
  serverInfo = res
  return serverInfo
}

const fetchClient = async () => {
  const key = route.params.key as string
  if (!key) {
    loading.value = false
    return
  }
  try {
    const data = await getClient(key)
    client.value = new Client(data)
  } catch (error: any) {
    message.error('获取客户端详情失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const fetchProxies = async () => {
  proxiesLoading.value = true
  const proxyTypes = ['tcp', 'udp', 'http', 'https', 'tcpmux', 'stcp', 'sudp']
  const proxies: BaseProxy[] = []
  try {
    const info = await fetchServerInfo()
    for (const type of proxyTypes) {
      try {
        const json = await getProxiesByType(type)
        if (!json.proxies) continue
        if (type === 'tcp') {
          proxies.push(...json.proxies.map((p: any) => new TCPProxy(p)))
        } else if (type === 'udp') {
          proxies.push(...json.proxies.map((p: any) => new UDPProxy(p)))
        } else if (type === 'http' && info?.vhostHTTPPort) {
          proxies.push(...json.proxies.map((p: any) => new HTTPProxy(p, info.vhostHTTPPort, info.subdomainHost)))
        } else if (type === 'https' && info?.vhostHTTPSPort) {
          proxies.push(...json.proxies.map((p: any) => new HTTPSProxy(p, info.vhostHTTPSPort, info.subdomainHost)))
        } else if (type === 'tcpmux' && info?.tcpmuxHTTPConnectPort) {
          proxies.push(
            ...json.proxies.map(
              (p: any) => new TCPMuxProxy(p, info.tcpmuxHTTPConnectPort, info.subdomainHost),
            ),
          )
        } else if (type === 'stcp') {
          proxies.push(...json.proxies.map((p: any) => new STCPProxy(p)))
        } else if (type === 'sudp') {
          proxies.push(...json.proxies.map((p: any) => new SUDPProxy(p)))
        }
      } catch {
        // Ignore
      }
    }
    allProxies.value = proxies
  } catch {
    // Ignore
  } finally {
    proxiesLoading.value = false
  }
}

onMounted(() => {
  fetchClient()
  fetchProxies()
})
</script>

