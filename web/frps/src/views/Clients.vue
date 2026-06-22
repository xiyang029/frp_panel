<template>
  <n-space vertical size="large">
    <n-space justify="space-between" align="center" wrap>
      <n-text strong style="font-size: 28px;">客户端列表</n-text>

      <n-radio-group v-model:value="statusFilter" size="small">
        <n-radio-button v-for="tab in statusTabs" :key="tab.value" :value="tab.value">
          <n-space align="center" :size="6">
            <span :style="{
              width: '8px',
              height: '8px',
              borderRadius: '999px',
              background: tab.value === 'online' ? 'var(--n-success-color)' : 'var(--n-text-color-3)',
            }" />
            <span>{{ tab.label }}</span>
            <n-text v-if="tab.count !== null" depth="3">{{ tab.count }}</n-text>
          </n-space>
        </n-radio-button>
      </n-radio-group>
    </n-space>

    <n-input v-model:value="searchText" placeholder="搜索客户端名称、用户或标识" clearable>
      <template #prefix>
        <n-icon>
          <Search />
        </n-icon>
      </template>
    </n-input>

    <n-spin :show="loading">
      <n-space v-if="clients.length > 0" vertical :size="16">
        <n-card v-for="client in clients" :key="client.key" size="small" hoverable :style="{ cursor: 'pointer' }"
          @click="viewClientDetail(client.key)">
          <n-space justify="space-between" align="start" wrap>
            <n-space vertical :size="8" :style="{ minWidth: '0' }">
              <n-space align="center" :size="8" wrap>
                <n-text strong>{{ client.displayName }}</n-text>
                <n-tag v-if="client.version" size="small" type="success" round>
                  v{{ client.version }}
                </n-tag>
                <n-tag v-if="client.wireProtocolLabel" size="small" type="info" round>
                  {{ client.wireProtocolLabel }}
                </n-tag>

                <n-tag :type="client.online ? 'success' : 'default'" size="small" round>
                  {{ client.online ? '在线' : '离线' }}
                </n-tag>
              </n-space>

              <n-space :size="8" wrap>
                <n-tag v-if="client.hostname" size="small" round>
                  {{ client.hostname }}
                </n-tag>
                <n-tag v-if="client.ip" size="small" round>
                  {{ client.ip }}
                </n-tag>
              </n-space>

              <n-text depth="3" style="font-size: 13px;">
                {{ client.online ? client.lastConnectedAgo : client.disconnectedAgo }}
              </n-text>
            </n-space>

            <n-icon depth="3" :size="18" style="flex-shrink: 0;">
              <ChevronRight />
            </n-icon>
          </n-space>
        </n-card>
      </n-space>
      <n-empty v-else description="暂无客户端" />
    </n-spin>

    <n-space v-if="total > 0" justify="end">
      <n-pagination :page="page" :page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :item-count="total"
        show-size-picker show-quick-jumper @update:page="onPageChange" @update:page-size="onPageSizeChange" />
    </n-space>
  </n-space>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NEmpty,
  NIcon,
  NInput,
  NPagination,
  NRadioButton,
  NRadioGroup,
  NSpace,
  NSpin,
  NTag,
  NText,
} from 'naive-ui'
import { ChevronRight, Search } from '@vicons/tabler'
import { Client } from '../utils/client'
import { getClientsV2 } from '../api/client'
import { createMessageHelpers } from '../naive'

const router = useRouter()
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

const viewClientDetail = (key: string) => {
  router.push({
    name: 'ClientDetail',
    params: { key },
  })
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
