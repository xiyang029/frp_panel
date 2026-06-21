<template>
  <div class="proxies-page">
    <div class="page-top">
      <div class="page-header">
        <h2 class="page-title">代理列表</h2>
      </div>

      <div class="tab-bar">
        <n-tabs v-model:value="activeTab" :bar-width="28" type="line" @update:value="handleTabChange">
          <n-tab-pane name="status" tab="运行状态">
          </n-tab-pane>
          <n-tab-pane name="store" tab="本地配置">
          </n-tab-pane>
        </n-tabs>
        <div class="tab-actions">
          <n-button type="primary" secondary quaternary size="small" @click="refreshData">
            <template #icon>
              <n-icon><refresh-outline /></n-icon>
            </template>
          </n-button>
          <n-button v-if="activeTab === 'store' && proxyStore.storeEnabled" type="primary" size="small"
            @click="handleCreate">
            + 新建代理
          </n-button>
        </div>
      </div>

      <template v-if="activeTab === 'status'">
        <n-space v-if="!isMobile" wrap>
          <n-tag v-for="item in statusTagItems" :key="item.value" :type="item.type" :bordered="false" class="status-tag"
            :class="{ active: statusFilter === item.value }" round @click="statusFilter = item.value">
            {{ item.label }} {{ item.count }}
          </n-tag>
        </n-space>
        <div class="filter-bar">
          <n-input v-model:value="searchText" placeholder="搜索代理名称、类型或地址" clearable class="search-input">
            <template #prefix><n-icon><search-outline /></n-icon></template>
          </n-input>
          <n-select v-model:value="sourceFilter" :options="sourceFilterOptions" class="filter-select" />
          <n-select v-model:value="typeFilter" :options="typeFilterOptions" class="filter-select" />
        </div>
      </template>

      <template v-if="activeTab === 'store' && proxyStore.storeEnabled">
        <div class="filter-bar">
          <n-input v-model:value="storeSearch" placeholder="搜索本地配置" clearable class="search-input">
            <template #prefix><n-icon><search-outline /></n-icon></template>
          </n-input>
          <n-select v-model:value="storeTypeFilter" :options="storeTypeFilterOptions" class="filter-select" />
        </div>
      </template>
    </div>

    <div class="page-content">
      <n-spin v-if="activeTab === 'status'" :show="proxyStore.loading">
        <div v-if="filteredStatus.length > 0" class="proxy-list">
          <ProxyCard v-for="p in filteredStatus" :key="p.name" :proxy="p" showSource @click="goToDetail(p.name)" />
        </div>
        <div class="empty-state" v-else-if="!proxyStore.loading">
          <p class="empty-text">暂无代理</p>
          <p class="empty-hint">代理配置创建并连接成功后，会显示在这里。</p>
        </div>
      </n-spin>

      <n-spin v-if="activeTab === 'store'" :show="proxyStore.storeLoading">
        <div v-if="!proxyStore.storeEnabled" class="store-disabled">
          <p>本地持久化配置未启用，请在 frpc 配置中加入以下内容：</p>
          <pre class="config-hint">[store]
path = "./frpc_store.json"</pre>
        </div>
        <template v-else>
          <div v-if="filteredStoreProxies.length > 0" class="proxy-list">
            <ProxyCard v-for="p in filteredStoreProxies" :key="p.name" :proxy="proxyStore.storeProxyWithStatus(p)"
              showActions @click="goToDetail(p.name)" @edit="handleEdit" @toggle="handleToggleProxy"
              @delete="handleDeleteProxy(p.name)" />
          </div>
          <div class="empty-state" v-else>
            <p class="empty-text">暂无本地代理配置</p>
            <p class="empty-hint">点击“新建代理”即可创建。</p>
          </div>
        </template>
      </n-spin>
    </div>

    <n-modal v-model:show="deleteDialog.visible" preset="card" title="删除代理"
      :style="{ width: isMobile ? 'calc(100vw - 24px)' : '400px' }" :mask-closable="false">
      <p class="confirm-message">{{ deleteDialog.message }}</p>
      <template #footer>
        <div class="dialog-footer">
          <n-button type="primary" secondary quaternary @click="deleteDialog.visible = false">
            取消
          </n-button>
          <n-button type="error" :loading="deleteDialog.loading" @click="doDelete">
            删除
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NIcon, NInput, NModal, NSelect, NSpin, NSpace, NTabPane, NTabs, NTag } from 'naive-ui'
import { RefreshOutline, SearchOutline } from '@vicons/ionicons5'
import ProxyCard from '../components/ProxyCard.vue'
import { useProxyStore } from '../stores/proxy'
import { useResponsive } from '../composables/useResponsive'
import type { ProxyStatus } from '../types'
import { createMessageHelpers } from '../naive'

const { isMobile } = useResponsive()
const message = createMessageHelpers()

const route = useRoute()
const router = useRouter()
const proxyStore = useProxyStore()

// Tab
const activeTab = ref(route.query.tab === 'store' ? 'store' : 'status')

const handleTabChange = (tab: string) => {
  router.replace({ query: tab === 'status' ? {} : { tab } })
}

// Filters (local UI state)
const statusFilter = ref('')
const typeFilter = ref('')
const sourceFilter = ref('')
const searchText = ref('')
const storeSearch = ref('')
const storeTypeFilter = ref('')

// Delete dialog
const deleteDialog = reactive({
  visible: false,
  title: '删除代理',
  message: '',
  loading: false,
  name: '',
})

// Source handling
const displaySource = (proxy: ProxyStatus): string => {
  return proxy.source === 'store' ? '本地存储' : '配置文件'
}

// Filter options
const sourceOptions = computed(() => {
  const sources = new Set<string>()
  sources.add('config')
  sources.add('store')
  proxyStore.proxies.forEach((p) => {
    sources.add(displaySource(p))
  })
  return Array.from(sources)
    .sort()
    .map((s) => ({ label: s, value: s }))
})

const sourceFilterOptions = computed(() => [
  { label: '全部来源', value: '' },
  ...sourceOptions.value,
])

const PROXY_TYPE_ORDER = ['tcp', 'udp', 'http', 'https', 'tcpmux', 'stcp', 'sudp', 'xtcp']

const sortByTypeOrder = (types: string[]) => {
  return types.sort((a, b) => {
    const ia = PROXY_TYPE_ORDER.indexOf(a)
    const ib = PROXY_TYPE_ORDER.indexOf(b)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })
}

const typeOptions = computed(() => {
  const types = new Set<string>()
  proxyStore.proxies.forEach((p) => types.add(p.type))
  return sortByTypeOrder(Array.from(types))
    .map((t) => ({ label: t.toUpperCase(), value: t }))
})

const typeFilterOptions = computed(() => [
  { label: '全部类型', value: '' },
  ...typeOptions.value,
])

const storeTypeOptions = computed(() => {
  const types = new Set<string>()
  proxyStore.storeProxies.forEach((p) => types.add(p.type))
  return sortByTypeOrder(Array.from(types))
    .map((t) => ({ label: t.toUpperCase(), value: t }))
})

const storeTypeFilterOptions = computed(() => [
  { label: '全部类型', value: '' },
  ...storeTypeOptions.value,
])

const statusTagItems = computed(() => {
  const counts = { running: 0, error: 0, waiting: 0 }
  for (const item of proxyStore.proxies) {
    const status = item.status as keyof typeof counts
    if (status in counts) {
      counts[status] += 1
    }
  }

  return [
    { value: '', label: '全部', count: proxyStore.proxies.length, type: 'default' as const },
    { value: 'running', label: '运行中', count: counts.running, type: 'success' as const },
    { value: 'error', label: '异常', count: counts.error, type: 'error' as const },
    { value: 'waiting', label: '等待中', count: counts.waiting, type: 'warning' as const },
  ]
})

// Filtered computeds — Status tab uses proxyStore.proxies (runtime only)
const filteredStatus = computed(() => {
  let result = proxyStore.proxies as ProxyStatus[]

  if (statusFilter.value) {
    result = result.filter((p) => p.status === statusFilter.value)
  }

  if (typeFilter.value) {
    result = result.filter((p) => p.type === typeFilter.value)
  }

  if (sourceFilter.value) {
    result = result.filter((p) => displaySource(p) === sourceFilter.value)
  }

  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.type.toLowerCase().includes(search) ||
        p.local_addr.toLowerCase().includes(search) ||
        p.remote_addr.toLowerCase().includes(search),
    )
  }

  return result
})

const filteredStoreProxies = computed(() => {
  let list = proxyStore.storeProxies

  if (storeTypeFilter.value) {
    list = list.filter((p) => p.type === storeTypeFilter.value)
  }

  if (storeSearch.value) {
    const q = storeSearch.value.toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(q))
  }

  return list
})

// Data fetching
const refreshData = () => {
  proxyStore.fetchStatus().catch((err: any) => {
    message.error('获取代理状态失败：' + err.message)
  })
  proxyStore.fetchStoreProxies()
}

// Navigation
const goToDetail = (name: string) => {
  router.push('/proxies/detail/' + encodeURIComponent(name))
}

const handleCreate = () => {
  router.push('/proxies/create')
}

const handleEdit = (proxy: ProxyStatus) => {
  router.push('/proxies/' + encodeURIComponent(proxy.name) + '/edit')
}

const handleToggleProxy = async (proxy: ProxyStatus, enabled: boolean) => {
  try {
    await proxyStore.toggleProxy(proxy.name, enabled)
    message.success(enabled ? '代理已启用' : '代理已禁用')
  } catch (err: any) {
    message.error('操作失败：' + (err.message || '未知错误'))
  }
}

const handleDeleteProxy = (name: string) => {
  deleteDialog.name = name
  deleteDialog.message = `确认删除代理“${name}”吗？删除后无法恢复。`
  deleteDialog.visible = true
}

const doDelete = async () => {
  deleteDialog.loading = true
  try {
    await proxyStore.deleteProxy(deleteDialog.name)
    message.success('代理已删除')
    deleteDialog.visible = false
    proxyStore.fetchStatus()
  } catch (err: any) {
    message.error('删除失败：' + (err.message || '未知错误'))
  } finally {
    deleteDialog.loading = false
  }
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped lang="scss">
.proxies-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.page-top {
  flex-shrink: 0;
}

.page-content {
  flex: 1;
  overflow-y: auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-xl;
}

.tab-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tab-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-top: $spacing-lg;
  padding-bottom: $spacing-lg;

  :deep(.search-input) {
    flex: 1;
    min-width: 150px;
  }
}

.filter-select {
  width: 140px;
}

.confirm-message {
  margin: 0;
  font-size: $font-size-md;
  color: $color-text-secondary;
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
}

.status-tag {
  cursor: pointer;
  transition: transform $transition-fast, opacity $transition-fast;

  &:hover {
    opacity: 0.9;
  }

  &.active {
    transform: translateY(-1px);
    box-shadow: 0 0 0 1px var(--app-border) inset;
  }
}

.proxy-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.empty-state {
  text-align: center;
  padding: 60px $spacing-xl;
}

.empty-text {
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  color: $color-text-secondary;
  margin: 0 0 $spacing-xs;
}

.empty-hint {
  font-size: $font-size-sm;
  color: $color-text-muted;
  margin: 0;
}

.store-disabled {
  padding: 32px;
  text-align: center;
  color: $color-text-muted;
}

.config-hint {
  display: inline-block;
  text-align: left;
  background: $color-bg-hover;
  padding: 12px 20px;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  margin-top: $spacing-md;
}

@include mobile {
  .page-top {
    padding: $spacing-lg $spacing-lg 0;
  }

  .page-content {
    padding: 0 $spacing-lg $spacing-lg;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-md;
  }

  .filter-bar {
    :deep(.search-input) {
      flex: 1;
      min-width: 0;
    }
  }

  .filter-select {
    width: 100%;
  }
}
</style>