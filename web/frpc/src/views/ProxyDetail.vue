<template>
  <n-space vertical :size="16">
    <n-space justify="space-between" align="start" :wrap="false">
      <n-breadcrumb separator=">">
        <n-breadcrumb-item>
          <router-link :to="isStore ? '/proxies?tab=store' : '/proxies'">代理列表</router-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>{{ proxyName }}</n-breadcrumb-item>
      </n-breadcrumb>

      <n-button v-if="isStore && proxy" type="primary" secondary size="small" @click="handleEdit">
        编辑
      </n-button>
    </n-space>

    <n-empty v-if="notFound" description="代理不存在">
      <template #extra>
        <n-button type="primary" @click="router.push('/proxies')">返回代理列表</n-button>
      </template>
    </n-empty>

    <n-spin v-else-if="proxy" :show="loading">
      <n-space vertical :size="16">
        <n-card size="small">
          <n-space vertical :size="8">
            <n-space align="center" :size="8" :wrap="true">
              <h2>{{ proxy.name }}</h2>
              <n-tag :type="statusTagType" :bordered="false">{{ proxy.status }}</n-tag>
            </n-space>
            <n-text depth="3">
              来源：{{ displaySource }} · 类型：{{ proxy.type.toUpperCase() }}
            </n-text>
          </n-space>
        </n-card>

        <n-alert v-if="proxy.err" type="error" title="连接异常">
          {{ proxy.err }}
        </n-alert>

        <ProxyFormLayout
          v-if="formData"
          :model-value="formData"
          readonly
        />
      </n-space>
    </n-spin>

    <n-spin v-else :show="loading" />
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NBreadcrumb, NBreadcrumbItem, NButton, NCard, NEmpty, NSpin, NSpace, NTag, NText, NAlert } from 'naive-ui'
import ProxyFormLayout from '../components/proxy-form/ProxyFormLayout.vue'
import { getProxyConfig, getStoreProxy } from '../api/frpc'
import { useProxyStore } from '../stores/proxy'
import { storeProxyToForm } from '../types'
import type { ProxyStatus, ProxyDefinition, ProxyFormData } from '../types'
import { createMessageHelpers } from '../naive'

const route = useRoute()
const router = useRouter()
const proxyStore = useProxyStore()
const message = createMessageHelpers()

const proxyName = route.params.name as string
const proxy = ref<ProxyStatus | null>(null)
const proxyConfig = ref<ProxyDefinition | null>(null)
const loading = ref(true)
const notFound = ref(false)
const isStore = ref(false)

onMounted(async () => {
  try {
    await proxyStore.fetchStatus()
    const found = proxyStore.proxies.find((p) => p.name === proxyName)

    let configDef: ProxyDefinition | null = null
    try {
      configDef = await getProxyConfig(proxyName)
      proxyConfig.value = configDef
    } catch {
      // ignore missing config details
    }

    try {
      await getStoreProxy(proxyName)
      isStore.value = true
    } catch {
      // not a store proxy
    }

    if (found) {
      proxy.value = found
    } else if (configDef) {
      const block = (configDef as any)[configDef.type]
      const localIP = block?.localIP || '127.0.0.1'
      const localPort = block?.localPort
      const enabled = block?.enabled !== false
      proxy.value = {
        name: configDef.name,
        type: configDef.type,
        status: enabled ? 'waiting' : 'disabled',
        err: '',
        local_addr: localPort != null ? `${localIP}:${localPort}` : '',
        remote_addr: block?.remotePort != null ? `:${block.remotePort}` : '',
        plugin: block?.plugin?.type || '',
      }
    } else {
      notFound.value = true
    }
  } catch (err: any) {
    message.error('加载代理失败：' + err.message)
  } finally {
    loading.value = false
  }
})

const displaySource = computed(() => (isStore.value ? '本地存储' : '配置文件'))

const statusTagType = computed<'default' | 'success' | 'error' | 'warning'>(() => {
  const s = proxy.value?.status
  if (s === 'running') return 'success'
  if (s === 'error') return 'error'
  if (s === 'disabled') return 'default'
  return 'warning'
})

const formData = computed((): ProxyFormData | null => {
  if (!proxyConfig.value) return null
  return storeProxyToForm(proxyConfig.value)
})

const handleEdit = () => {
  router.push('/proxies/' + encodeURIComponent(proxyName) + '/edit')
}
</script>
