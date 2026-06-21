<template>
  <div class="proxies-page">
    <div class="page-header">
      <div class="header-top">
        <div class="title-section">
          <h1 class="page-title">代理列表</h1>
          <p class="page-subtitle">查看并管理所有代理配置与运行状态。</p>
        </div>

        <div class="actions-section">
          <n-button type="primary" secondary quaternary size="small" @click="refreshData">
            刷新
          </n-button>

          <n-button type="error" secondary quaternary size="small" @click="showClearDialog = true">
            清理离线代理
          </n-button>
        </div>
      </div>

      <div class="filter-section">
        <div class="search-row">
          <n-input
            v-model:value="searchText"
            placeholder="搜索代理名称、客户端或地址"
            clearable
            class="main-search"
          >
            <template #prefix>
              <n-icon><search-outline /></n-icon>
            </template>
          </n-input>

          <n-select
            :value="selectedClientKey"
            :options="clientFilterOptions"
            filterable
            clearable
            class="client-filter"
            placeholder="全部客户端"
            @update:value="onClientFilterChange"
          />
        </div>

        <div class="type-tabs">
          <button
            v-for="t in proxyTypes"
            :key="t.value"
            class="type-tab"
            :class="{ active: activeType === t.value }"
            @click="activeType = t.value"
          >
            {{ t.label }}
          </button>
        </div>
      </div>
    </div>

    <n-spin :show="loading" class="proxies-content">
      <div v-if="proxies.length > 0" class="proxies-list">
        <ProxyCard
          v-for="proxy in proxies"
          :key="`${proxy.type}:${proxy.name}`"
          :proxy="proxy"
          :show-type="activeType === 'all'"
        />
      </div>
      <div v-else-if="!loading" class="empty-state">
        <n-empty description="暂无代理" />
      </div>
    </n-spin>

    <div v-if="total > 0" class="pagination-section">
      <n-pagination
        :page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :item-count="total"
        show-size-picker
        show-quick-jumper
        @update:page="onPageChange"
        @update:page-size="onPageSizeChange"
      />
    </div>

    <n-modal
      v-model:show="showClearDialog"
      preset="card"
      title="清理离线代理"
      :style="{ width: '400px', maxWidth: 'calc(100vw - 24px)' }"
      :mask-closable="false"
    >
      <p class="confirm-message">确认清理所有离线代理吗？</p>
      <template #footer>
        <div class="dialog-footer">
          <n-button type="primary" secondary quaternary @click="showClearDialog = false">
            取消
          </n-button>
          <n-button type="error" @click="handleClearConfirm">
            清理
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NEmpty, NIcon, NInput, NModal, NPagination, NSelect, NSpin } from 'naive-ui'
import { SearchOutline } from '@vicons/ionicons5'
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
import ProxyCard from '../components/ProxyCard.vue'
import {
  getProxiesV2,
  clearOfflineProxies as apiClearOfflineProxies,
} from '../api/proxy'
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

// Keep selected client visible even when it is not present in the current option list.
const selectedClientKey = computed(() => {
  if (!clientIDFilter.value) return ''
  const client = clientOptions.value.find(
    (c) => c.clientID === clientIDFilter.value && c.user === userFilter.value,
  )
  return client?.key || `${userFilter.value}:${clientIDFilter.value}`
})

// Check if the filtered client exists in the client list
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
  options.push(...clientOptions.value.map((client) => ({
    label: client.label,
    value: client.key,
  })))
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
    // Client dropdown is a non-critical side load; log for diagnostics
    // but don't surface a toast (would compete with the main fetch error).
    console.warn('加载客户端筛选列表失败：', err)
  }
}

// Server info cache - cache the Promise itself so concurrent first calls
// from Promise.all (convertProxies) don't kick off multiple HTTP requests.
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
      // Allow retry after failure
      serverInfoPromise = null
      throw err
    })
  }
  return serverInfoPromise
}

const convertProxy = async (
  proxy: ProxyStatsInfo,
): Promise<BaseProxy | null> => {
  const type = proxy.type || activeType.value
  if (type === 'tcp') {
    return new TCPProxy(proxy)
  }
  if (type === 'udp') {
    return new UDPProxy(proxy)
  }
  if (type === 'http') {
    const info = await fetchServerInfo()
    if (info && info.vhostHTTPPort) {
      return new HTTPProxy(proxy, info.vhostHTTPPort, info.subdomainHost)
    }
    return null
  }
  if (type === 'https') {
    const info = await fetchServerInfo()
    if (info && info.vhostHTTPSPort) {
      return new HTTPSProxy(proxy, info.vhostHTTPSPort, info.subdomainHost)
    }
    return null
  }
  if (type === 'tcpmux') {
    const info = await fetchServerInfo()
    if (info && info.tcpmuxHTTPConnectPort) {
      return new TCPMuxProxy(
        proxy,
        info.tcpmuxHTTPConnectPort,
        info.subdomainHost,
      )
    }
    return null
  }
  if (type === 'stcp') {
    return new STCPProxy(proxy)
  }
  if (type === 'sudp') {
    return new SUDPProxy(proxy)
  }
  // Fallback for types without a dedicated class (e.g. xtcp). Matches the
  // pattern in ProxyDetail.vue so the type tag and meta render correctly.
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

const refreshData = () => {
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

// Watch for type changes
watch(activeType, (newType) => {
  clearSearchDebounce()
  page.value = 1
  // Update route but preserve query params
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

// Watch for route query changes (client filter)
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

// Initial fetch
fetchData()
fetchClients()
</script>

<style scoped>
.proxies-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--app-text);
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 14px;
  color: var(--app-text-muted);
  margin: 0;
}

.actions-section {
  display: flex;
  gap: 12px;
}


.filter-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 8px;
}

.search-row {
  display: flex;
  gap: 16px;
  width: 100%;
  align-items: center;
}

.main-search {
  flex: 1;
}

.main-search,
.client-filter {
  --n-height: 40px;
  --n-border-radius: 10px;
}

.client-filter {
  width: 240px;
}

.confirm-message {
  margin: 0;
  font-size: 14px;
  color: var(--app-text-muted);
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.type-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.type-tab {
  padding: 6px 16px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-panel-strong);
  color: var(--app-text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}

.type-tab:hover {
  background: var(--app-panel);
}

.type-tab.active {
  background: var(--app-accent-soft);
  color: var(--app-text);
  border-color: var(--app-accent);
}

.proxies-content {
  min-height: 200px;
}

.proxies-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  padding: 60px 0;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .search-row {
    flex-direction: column;
  }

  .client-filter {
    width: 100%;
  }

  .pagination-section {
    justify-content: center;
  }
}
</style>
