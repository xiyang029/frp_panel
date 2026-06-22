<template>
  <n-space vertical :size="16">
    <n-space justify="space-between" align="start" :wrap="false">
      <n-breadcrumb separator=">">
        <n-breadcrumb-item>
          <router-link to="/visitors">访问器列表</router-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>{{ visitorName }}</n-breadcrumb-item>
      </n-breadcrumb>

      <n-button v-if="isStore && visitor" type="primary" secondary size="small" @click="handleEdit">
        编辑
      </n-button>
    </n-space>

    <n-empty v-if="notFound" description="访问器不存在">
      <template #extra>
        <n-button type="primary" @click="router.push('/visitors')">返回访问器列表</n-button>
      </template>
    </n-empty>

    <n-spin v-else-if="visitor" :show="loading">
      <n-space vertical :size="16">
        <n-card size="small">
          <n-space vertical :size="8">
            <h2>{{ visitor.name }}</h2>
            <n-text depth="3">类型：{{ visitor.type.toUpperCase() }}</n-text>
          </n-space>
        </n-card>

        <VisitorFormLayout
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
import { NBreadcrumb, NBreadcrumbItem, NButton, NCard, NEmpty, NSpin, NSpace, NText } from 'naive-ui'
import VisitorFormLayout from '../components/visitor-form/VisitorFormLayout.vue'
import { getVisitorConfig, getStoreVisitor } from '../api/frpc'
import type { VisitorDefinition, VisitorFormData } from '../types'
import { storeVisitorToForm } from '../types'
import { createMessageHelpers } from '../naive'

const route = useRoute()
const router = useRouter()
const message = createMessageHelpers()

const visitorName = route.params.name as string
const visitor = ref<VisitorDefinition | null>(null)
const loading = ref(true)
const notFound = ref(false)
const isStore = ref(false)

onMounted(async () => {
  try {
    const config = await getVisitorConfig(visitorName)
    visitor.value = config

    try {
      await getStoreVisitor(visitorName)
      isStore.value = true
    } catch {
      // not a store visitor
    }
  } catch (err: any) {
    if (err?.status === 404 || err?.response?.status === 404) {
      notFound.value = true
    } else {
      notFound.value = true
      message.error('加载访问器失败：' + err.message)
    }
  } finally {
    loading.value = false
  }
})

const formData = computed<VisitorFormData | null>(() => {
  if (!visitor.value) return null
  return storeVisitorToForm(visitor.value)
})

const handleEdit = () => {
  router.push('/visitors/' + encodeURIComponent(visitorName) + '/edit')
}
</script>
