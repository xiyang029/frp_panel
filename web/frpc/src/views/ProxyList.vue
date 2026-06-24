<template>
  <n-space vertical :size="16">
    <n-space justify="space-between" align="center" :wrap="false">
      <n-text strong style="font-size: 28px;">代理列表</n-text>

      <n-button v-if="activeTab === 'store' && proxyStore.storeEnabled" type="primary" size="small"
        @click="handleCreate">
        + 新建代理
      </n-button>

    </n-space>

    <n-card size="small" segmented :bordered="false">
      <n-tabs v-model:value="activeTab" type="line" @update:value="handleTabChange">
        <n-tab-pane name="status" tab="运行状态" />
        <n-tab-pane name="store" tab="本地配置" />
      </n-tabs>

      <n-space vertical :size="12" style="margin-top: 16px;">
        <template v-if="activeTab === 'status'">
          <n-space wrap>
            <n-tag v-for="item in statusTagItems" :key="item.value" :type="item.type" :bordered="false"
              :checkable="true" :checked="statusFilter === item.value" @click="statusFilter = item.value">
              {{ item.label }} {{ item.count }}
            </n-tag>
          </n-space>

          <n-grid responsive="screen" cols="1 m:3" :x-gap="12" :y-gap="12">
            <n-gi :span="1">
              <n-input v-model:value="searchText" placeholder="搜索代理名称、类型或地址" clearable>
                <template #prefix><n-icon><Search /></n-icon></template>
              </n-input>
            </n-gi>
            <n-gi>
              <n-select v-model:value="sourceFilter" :options="sourceFilterOptions" />
            </n-gi>
            <n-gi>
              <n-select v-model:value="typeFilter" :options="typeFilterOptions" />
            </n-gi>
          </n-grid>
        </template>

        <template v-else-if="proxyStore.storeEnabled">
          <n-grid responsive="screen" cols="1 m:2" :x-gap="12" :y-gap="12">
            <n-gi>
              <n-input v-model:value="storeSearch" placeholder="搜索本地配置" clearable>
                <template #prefix><n-icon><Search /></n-icon></template>
              </n-input>
            </n-gi>
            <n-gi>
              <n-select v-model:value="storeTypeFilter" :options="storeTypeFilterOptions" />
            </n-gi>
          </n-grid>
        </template>
      </n-space>
    </n-card>

    <n-spin v-if="activeTab === 'status'" :show="proxyStore.loading">
      <n-space v-if="filteredStatus.length > 0" vertical :size="12">
        <ProxyCard v-for="p in filteredStatus" :key="p.name" :proxy="p" showSource @click="goToDetail(p.name)" />
      </n-space>
      <n-empty v-else-if="!proxyStore.loading" description="暂无运行中的代理" style="min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center;"/>
    </n-spin>

    <n-spin v-else :show="proxyStore.storeLoading">
      <n-card v-if="!proxyStore.storeEnabled" size="small" title="本地持久化配置未启用">
        <n-space vertical :size="12">
          <n-text depth="3">请在 frpc 配置中加入以下内容：</n-text>
          <n-card size="small" embedded>
            <pre v-text="configText"></pre>
          </n-card>
        </n-space>
      </n-card>
      <template v-else>
        <n-space v-if="filteredStoreProxies.length > 0" vertical :size="12">
          <ProxyCard v-for="p in filteredStoreProxies" :key="p.name" :proxy="proxyStore.storeProxyWithStatus(p)"
            showActions @click="goToDetail(p.name)" @edit="handleEdit" @toggle="handleToggleProxy"
            @delete="handleDeleteProxy(p.name)" />
        </n-space>
        <n-empty v-else description="暂无本地配置" style="min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center;"/>
      </template>
    </n-spin>

    <n-modal v-model:show="deleteDialog.visible" preset="card" title="删除代理"
      :style="{ width: isMobile ? 'calc(100vw - 24px)' : '400px' }" :mask-closable="false">
      <n-text depth="3">{{ deleteDialog.message }}</n-text>
      <template #footer>
        <n-space justify="end">
          <n-button type="primary" secondary quaternary @click="deleteDialog.visible = false">
            取消
          </n-button>
          <n-button type="error" :loading="deleteDialog.loading" @click="doDelete">
            删除
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NCard, NEmpty, NGrid, NGi, NIcon, NInput, NModal, NSelect, NSpin, NSpace, NTabPane, NTabs, NTag, NText } from 'naive-ui'
import { Search } from '@vicons/tabler'
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

const activeTab = ref(route.query.tab === 'store' ? 'store' : 'status')

const handleTabChange = (tab: string) => {
  router.replace({ query: tab === 'status' ? {} : { tab } })
}

const statusFilter = ref('')
const typeFilter = ref('')
const sourceFilter = ref('')
const searchText = ref('')
const storeSearch = ref('')
const storeTypeFilter = ref('')

const deleteDialog = reactive({
  visible: false,
  message: '',
  loading: false,
  name: '',
})

const displaySource = (proxy: ProxyStatus): string => {
  return proxy.source === 'store' ? '本地存储' : '配置文件'
}

const configText = `[store]\npath = "./frpc_store.json"`;

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

const refreshData = () => {
  proxyStore.fetchStatus().catch((err: any) => {
    message.error('获取代理状态失败：' + err.message)
  })
  proxyStore.fetchStoreProxies()
}

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
