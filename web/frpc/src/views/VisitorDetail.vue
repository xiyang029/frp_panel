<template>
  <div class="visitor-detail-page">
    <!-- Fixed Header -->
    <div class="detail-top">
      <n-breadcrumb separator=">">
        <n-breadcrumb-item>
          <router-link to="/visitors" class="breadcrumb-link">访问器列表</router-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>{{ visitorName }}</n-breadcrumb-item>
      </n-breadcrumb>

      <template v-if="visitor">
        <div class="detail-header">
          <div>
            <h2 class="detail-title">{{ visitor.name }}</h2>
            <p class="header-subtitle">类型：{{ visitor.type.toUpperCase() }}</p>
          </div>
          <div v-if="isStore" class="header-actions">
            <n-button type="primary" secondary quaternary size="small" @click="handleEdit">
              编辑
            </n-button>
          </div>
        </div>
      </template>
    </div>

    <div v-if="notFound" class="not-found">
      <p class="empty-text">未找到访问器</p>
      <p class="empty-hint">访问器“{{ visitorName }}”不存在。</p>
      <n-button type="primary" secondary quaternary @click="router.push('/visitors')">
        返回访问器列表
      </n-button>
    </div>

    <n-spin v-else-if="visitor" :show="loading" class="detail-content">
      <VisitorFormLayout
        v-if="formData"
        :model-value="formData"
        readonly
      />
    </n-spin>

    <n-spin v-else :show="loading" class="loading-area"></n-spin>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NBreadcrumb, NBreadcrumbItem, NButton, NSpin } from 'naive-ui'
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

    // Check if visitor is from the store (for Edit/Delete buttons)
    try {
      await getStoreVisitor(visitorName)
      isStore.value = true
    } catch {
      // Not a store visitor — Edit/Delete not available
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

<style scoped lang="scss">
.visitor-detail-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.detail-top {
  flex-shrink: 0;
  padding: $spacing-xl 24px 0;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 160px;
}

.n-breadcrumb {
  margin-bottom: $spacing-lg;
}

.breadcrumb-link {
  color: $color-text-secondary;
  text-decoration: none;
  transition: color $transition-fast;

  &:hover {
    color: $color-text-primary;
  }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
}

.detail-title {
  margin: 0;
  font-size: 22px;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  margin-bottom: $spacing-sm;
}

.header-subtitle {
  font-size: $font-size-sm;
  color: $color-text-muted;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: $spacing-sm;
}

.not-found,
.loading-area {
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
  margin: 0 0 $spacing-lg;
}

@include mobile {
  .detail-top {
    padding: $spacing-xl $spacing-lg 0;
  }

  .detail-content {
    padding: 0 $spacing-lg $spacing-xl;
  }

  .detail-header {
    flex-direction: column;
    gap: $spacing-md;
  }
}
</style>
