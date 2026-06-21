<template>
  <div class="clients-page">
    <div class="page-header">
      <div class="header-top">
        <div class="title-section">
          <h1 class="page-title">客户端列表</h1>
          <p class="page-subtitle">查看已连接客户端及其在线状态。</p>
        </div>
        <div class="status-tabs">
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            class="status-tab"
            :class="{ active: statusFilter === tab.value }"
            @click="statusFilter = tab.value"
          >
            <span class="status-dot" :class="tab.value"></span>
            <span class="tab-label">{{ tab.label }}</span>
            <span v-if="tab.count !== null" class="tab-count">{{
              tab.count
            }}</span>
          </button>
        </div>
      </div>

      <div class="search-section">
        <n-input
          v-model:value="searchText"
          placeholder="搜索客户端名称、用户或标识"
          clearable
          class="search-input"
        >
          <template #prefix>
            <n-icon><search-outline /></n-icon>
          </template>
        </n-input>
      </div>
    </div>

    <n-spin :show="loading" class="clients-content">
      <div v-if="clients.length > 0" class="clients-list">
        <ClientCard
          v-for="client in clients"
          :key="client.key"
          :client="client"
        />
      </div>
      <div v-else-if="!loading" class="empty-state">
        <n-empty description="暂无客户端" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { NEmpty, NIcon, NInput, NPagination, NSpin } from 'naive-ui'
import { SearchOutline } from '@vicons/ionicons5'
import { Client } from '../utils/client'
import ClientCard from '../components/ClientCard.vue'
import { getClientsV2 } from '../api/client'
import { createMessageHelpers } from '../naive'

const clients = ref<Client[]>([])
const loading = ref(false)
const searchText = ref('')
const statusFilter = ref<'all' | 'online' | 'offline'>('all')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const message = createMessageHelpers()

let refreshTimer: number | null = null
let searchDebounceTimer: number | null = null
let requestSeq = 0

const statusTabs = computed(() => [
  {
    value: 'all' as const,
    label: '全部',
    count: statusFilter.value === 'all' ? total.value : null,
  },
  {
    value: 'online' as const,
    label: '在线',
    count: statusFilter.value === 'online' ? total.value : null,
  },
  {
    value: 'offline' as const,
    label: '离线',
    count: statusFilter.value === 'offline' ? total.value : null,
  },
])

const fetchData = async (silent = false) => {
  const seq = ++requestSeq
  if (!silent) loading.value = true
  try {
    const data = await getClientsV2({
      page: page.value,
      pageSize: pageSize.value,
      status: statusFilter.value,
      q: searchText.value.trim(),
    })
    if (seq !== requestSeq) return

    const maxPage = Math.max(1, Math.ceil(data.total / data.pageSize))
    if (data.items.length === 0 && data.total > 0 && data.page > maxPage) {
      page.value = maxPage
      await fetchData(silent)
      return
    }

    clients.value = data.items.map((item) => new Client(item))
    total.value = data.total
    page.value = data.page
    pageSize.value = data.pageSize
  } catch (error: any) {
    if (seq !== requestSeq) return
    message.error('获取客户端列表失败：' + error.message)
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

const startAutoRefresh = () => {
  refreshTimer = window.setInterval(() => {
    fetchData(true)
  }, 5000)
}

const stopAutoRefresh = () => {
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer)
    refreshTimer = null
  }
}

watch(statusFilter, () => {
  resetPageAndFetch()
})

watch(searchText, () => {
  clearSearchDebounce()
  page.value = 1
  searchDebounceTimer = window.setTimeout(() => {
    searchDebounceTimer = null
    fetchData()
  }, 300)
})

onMounted(() => {
  fetchData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
  clearSearchDebounce()
})
</script>

<style scoped>
.clients-page {
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
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
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

.status-tabs {
  display: flex;
  gap: 12px;
}

.status-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: var(--app-panel-strong);
  color: var(--app-text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.status-tab:hover {
  border-color: var(--app-accent);
  background: var(--app-panel);
}

.status-tab.active {
  background: var(--app-accent-soft);
  border-color: var(--app-accent);
  color: var(--app-text);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--app-text-muted);
}

.status-dot.online {
  background-color: #16a34a;
}

.status-dot.offline {
  background-color: #94a3b8;
}

.status-dot.all {
  background-color: var(--app-text);
}

.tab-count {
  font-weight: 500;
  opacity: 0.8;
}

.search-section {
  width: 100%;
}

.search-input {
  --n-height: 48px;
  --n-border-radius: 12px;
}

.clients-content {
  min-height: 200px;
}

.clients-list {
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

@media (max-width: 640px) {
  .header-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-tabs {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .status-tab {
    flex-shrink: 0;
  }

  .pagination-section {
    justify-content: center;
  }
}
</style>
