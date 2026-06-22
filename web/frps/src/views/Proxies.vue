<template>
  <n-space vertical size="large">
    <n-space justify="space-between" align="center" wrap>
      <n-text strong style="font-size: 28px;">代理列表</n-text>

      <n-button type="error" secondary @click="showClearDialog = true">清理离线代理</n-button>
    </n-space>

    <n-space vertical :size="16">
      <n-space wrap align="center">
        <n-input v-model:value="searchText" placeholder="搜索代理名称、客户端或地址" clearable>
          <template #prefix>
            <n-icon>
              <Search />
            </n-icon>
          </template>
        </n-input>

        <n-select :value="selectedClientKey" :options="clientFilterOptions" filterable clearable placeholder="全部客户端"
          @update:value="onClientFilterChange" />
      </n-space>

      <n-radio-group v-model:value="activeType" size="small">
        <n-radio-button v-for="t in proxyTypes" :key="t.value" :value="t.value">
          {{ t.label }}
        </n-radio-button>
      </n-radio-group>
    </n-space>

    <n-spin :show="loading">
      <n-space v-if="proxies.length > 0" vertical :size="16">
        <router-link
          v-for="proxy in proxies"
          :key="`${proxy.type}:${proxy.name}`"
          :to="proxyLink(proxy.name)"
          style="display: block; text-decoration: none;"
        >
          <n-card size="small" hoverable :style="{ cursor: 'pointer' }">
            <n-space justify="space-between" align="start" wrap>
              <n-space vertical :size="8" :style="{ minWidth: '0' }">
                <n-space align="center" :size="8" wrap>
                  <n-text strong>{{ proxy.name }}</n-text>
                  <n-tag v-if="activeType === 'all'" size="small" :bordered="false">
                    {{ proxy.type.toUpperCase() }}
                  </n-tag>
                  <n-tag size="small" :type="proxy.status === 'online' ? 'success' : 'error'" :bordered="false">
                    {{ proxy.status }}
                  </n-tag>
                </n-space>

                <n-space align="center" :size="16" wrap>
                  <div v-if="proxy.port" style="display:inline-flex;align-items:center;gap:4px;">
                    <n-icon size="16" depth="3">
                      <Server />
                    </n-icon>
                    <n-text depth="3"> {{ proxy.port }}</n-text>
                  </div>
                  <div style="display:inline-flex;align-items:center;gap:4px;">
                    <n-icon size="16" depth="3">
                      <Link />
                    </n-icon>
                    <n-text depth="3"> {{ proxy.conns }}</n-text>
                  </div>
                  <div v-if="proxy.clientID" style="display:inline-flex;align-items:center;gap:4px;">
                    <n-icon size="16" depth="3">
                      <Users />
                    </n-icon>
                    <n-text depth="3">
                      {{ proxy.user ? `${proxy.user}.${proxy.clientID}` : proxy.clientID }}
                    </n-text>
                  </div>
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
      <n-empty v-else description="暂无代理" />
    </n-spin>

    <n-space v-if="total > 0" justify="end">
      <n-pagination :page="page" :page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :item-count="total"
        show-size-picker show-quick-jumper @update:page="onPageChange" @update:page-size="onPageSizeChange" />
    </n-space>

    <n-modal v-model:show="showClearDialog" preset="card" title="清理离线代理"
      :style="{ width: '400px', maxWidth: 'calc(100vw - 24px)' }" :mask-closable="false">
      <n-text depth="3">确认清理所有离线代理吗？</n-text>
      <template #footer>
        <n-space justify="end">
          <n-button secondary @click="showClearDialog = false">取消</n-button>
          <n-button type="error" @click="handleClearConfirm">清理</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NEmpty,
  NIcon,
  NInput,
  NModal,
  NPagination,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace,
  NSpin,
  NTag,
  NText,
  NCard,
} from 'naive-ui'
import { Link, Search, Server, Users } from '@vicons/tabler'
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
import { formatFileSize } from '../utils/format'
import { getProxiesV2, clearOfflineProxies as apiClearOfflineProxies } from '../api/proxy'
import { getServerInfo } from '../api/server'
import { getClientsV2 } from '../api/client'
import { Client } from '../utils/client'
import type { ProxyStatsInfo } from '../types/proxy'
import { createMessageHelpers } from '../naive'

const route = useRoute()
const router = useRouter()
const message = createMessageHelpers()

const proxyTypes = [
  { label: '全部', value: 'all' },
  { label: 'TCP', value: 'tcp' },
  { label: 'UDP', value: 'udp' },
  { label: 'HTTP', value: 'http' },
  { label: 'HTTPS', value: 'https' },
  { label: 'TCPMUX', value: 'tcpmux' },
  { label: 'STCP', value: 'stcp' },
  { label: 'XTCP', value: 'xtcp' },
  { label: 'SUDP', value: 'sudp' },
]

const activeType = ref((route.params.type as string) || 'tcp')
const proxies = ref<BaseProxy[]>([])
const clients = ref<Client[]>([])
const loading = ref(false)
const searchText = ref('')
const showClearDialog = ref(false)
const clientIDFilter = ref((route.query.clientID as string) || '')
const userFilter = ref((route.query.user as string) || '')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const maxV2PageSize = 100
let requestSeq = 0
let searchDebounceTimer: number | null = null

const clientOptions = computed(() => {
  return clients.value
    .map((c) => ({
      key: c.key,
      clientID: c.clientID,
      user: c.user,
      label: c.user ? `${c.user}.${c.clientID}` : c.clientID,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const selectedClientKey = computed(() => {
  if (!clientIDFilter.value) return ''
  const client = clientOptions.value.find(
    (c) => c.clientID === clientIDFilter.value && c.user === userFilter.value,
  )
  return client?.key || `${userFilter.value}:${clientIDFilter.value}`
})

const selectedClientInList = computed(() => {
  if (!clientIDFilter.value) return true
  return clientOptions.value.some(
    (c) => c.clientID === clientIDFilter.value && c.user === userFilter.value,
  )
})

const clientFilterOptions = computed(() => {
  const options = [{ label: '全部客户端', value: '' }]
  if (clientIDFilter.value && !selectedClientInList.value) {
    options.push({
      label: `${userFilter.value ? userFilter.value + '.' : ''}${clientIDFilter.value}（未找到）`,
      value: selectedClientKey.value,
    })
  }
  options.push(
    ...clientOptions.value.map((client) => ({
      label: client.label,
      value: client.key,
    })),
  )
  return options
})

const onClientFilterChange = (key: string | null) => {
  const nextKey = key || ''
  if (nextKey) {
    const client = clientOptions.value.find((c) => c.key === nextKey)
    if (client) {
      router.replace({
        query: { ...route.query, clientID: client.clientID, user: client.user },
      })
    }
  } else {
    const query = { ...route.query }
    delete query.clientID
    delete query.user
    router.replace({ query })
  }
}

const fetchClients = async () => {
  try {
    const allClients: Client[] = []
    let nextPage = 1
    let totalClients = 0

    do {
      const data = await getClientsV2({
        page: nextPage,
        pageSize: maxV2PageSize,
      })
      allClients.push(...data.items.map((item) => new Client(item)))
      totalClients = data.total
      nextPage += 1
    } while (allClients.length < totalClients)

    clients.value = allClients
  } catch (err) {
    console.warn('加载客户端筛选列表失败：', err)
  }
}

type ServerInfoLite = {
  vhostHTTPPort: number
  vhostHTTPSPort: number
  tcpmuxHTTPConnectPort: number
  subdomainHost: string
}
let serverInfoPromise: Promise<ServerInfoLite> | null = null

const fetchServerInfo = (): Promise<ServerInfoLite> => {
  if (!serverInfoPromise) {
    serverInfoPromise = getServerInfo().catch((err) => {
      serverInfoPromise = null
      throw err
    })
  }
  return serverInfoPromise
}

const convertProxy = async (proxy: ProxyStatsInfo): Promise<BaseProxy | null> => {
  const type = proxy.type || activeType.value
  if (type === 'tcp') return new TCPProxy(proxy)
  if (type === 'udp') return new UDPProxy(proxy)
  if (type === 'http') {
    const info = await fetchServerInfo()
    return info && info.vhostHTTPPort ? new HTTPProxy(proxy, info.vhostHTTPPort, info.subdomainHost) : null
  }
  if (type === 'https') {
    const info = await fetchServerInfo()
    return info && info.vhostHTTPSPort ? new HTTPSProxy(proxy, info.vhostHTTPSPort, info.subdomainHost) : null
  }
  if (type === 'tcpmux') {
    const info = await fetchServerInfo()
    return info && info.tcpmuxHTTPConnectPort
      ? new TCPMuxProxy(proxy, info.tcpmuxHTTPConnectPort, info.subdomainHost)
      : null
  }
  if (type === 'stcp') return new STCPProxy(proxy)
  if (type === 'sudp') return new SUDPProxy(proxy)
  const bp = new BaseProxy(proxy)
  bp.type = type
  return bp
}

const convertProxies = async (items: ProxyStatsInfo[]): Promise<BaseProxy[]> => {
  const converted = await Promise.all(items.map((item) => convertProxy(item)))
  return converted.filter((item): item is BaseProxy => item !== null)
}

const fetchData = async (silent = false) => {
  const seq = ++requestSeq
  if (!silent) loading.value = true

  try {
    const q = searchText.value.trim()
    const data = await getProxiesV2({
      page: page.value,
      pageSize: pageSize.value,
      type: activeType.value === 'all' ? undefined : activeType.value,
      q: q || undefined,
      clientID: clientIDFilter.value || undefined,
      user: clientIDFilter.value ? userFilter.value : undefined,
    })
    if (seq !== requestSeq) return

    const maxPage = Math.max(1, Math.ceil(data.total / data.pageSize))
    if (data.items.length === 0 && data.total > 0 && data.page > maxPage) {
      page.value = maxPage
      await fetchData(silent)
      return
    }

    const converted = await convertProxies(data.items)
    if (seq !== requestSeq) return

    proxies.value = converted
    total.value = data.total
    page.value = data.page
    pageSize.value = data.pageSize
  } catch (error: any) {
    if (seq !== requestSeq) return
    message.error('获取代理列表失败：' + error.message)
  } finally {
    if (seq === requestSeq) {
      loading.value = false
    }
  }
}

const clearSearchDebounce = () => {
  if (searchDebounceTimer !== null) {
    window.clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
}

const resetPageAndFetch = () => {
  clearSearchDebounce()
  page.value = 1
  fetchData()
}

const onPageChange = (value: number) => {
  clearSearchDebounce()
  page.value = value
  fetchData()
}

const onPageSizeChange = (value: number) => {
  pageSize.value = value
  resetPageAndFetch()
}

const proxyLink = (name: string) => `/proxy/${name}`

const handleClearConfirm = async () => {
  showClearDialog.value = false
  await clearOfflineProxies()
}

const clearOfflineProxies = async () => {
  try {
    await apiClearOfflineProxies()
    message.success('已清理离线代理')
    fetchData()
  } catch (err: any) {
    message.warning('清理离线代理失败：' + err.message)
  }
}

watch(activeType, (newType) => {
  clearSearchDebounce()
  page.value = 1
  router.replace({ params: { type: newType }, query: route.query })
  fetchData()
})

watch(searchText, () => {
  clearSearchDebounce()
  page.value = 1
  searchDebounceTimer = window.setTimeout(() => {
    searchDebounceTimer = null
    fetchData()
  }, 300)
})

watch(
  () => [route.query.clientID, route.query.user],
  ([newClientID, newUser]) => {
    clientIDFilter.value = (newClientID as string) || ''
    userFilter.value = (newUser as string) || ''
    resetPageAndFetch()
  },
)

onUnmounted(() => {
  clearSearchDebounce()
})

fetchData()
fetchClients()
</script>

