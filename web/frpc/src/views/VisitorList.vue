<template>
  <div class="visitors-page">
    <!-- Header -->
    <div class="page-header">
      <h2 class="page-title">访问器列表</h2>
    </div>

    <!-- Tab bar -->
    <div class="tab-bar">
      <div class="tab-buttons">
        <button class="tab-btn active">本地配置</button>
      </div>
      <div class="tab-actions">
        <n-button type="primary" secondary quaternary size="small" @click="fetchData">
          <template #icon>
            <n-icon><refresh-outline /></n-icon>
          </template>
        </n-button>
        <n-button v-if="visitorStore.storeEnabled" type="primary" size="small" @click="handleCreate">
          + 新建访问器
        </n-button>
      </div>
    </div>

    <n-spin :show="visitorStore.loading">
      <div v-if="!visitorStore.storeEnabled" class="store-disabled">
        <p>本地持久化配置未启用，请在 frpc 配置中加入以下内容：</p>
        <pre class="config-hint">[store]
path = "./frpc_store.json"</pre>
      </div>

      <template v-else>
        <div class="filter-bar">
          <n-input v-model:value="searchText" placeholder="搜索访问器名称" clearable class="search-input">
            <template #prefix><n-icon><search-outline /></n-icon></template>
          </n-input>
          <n-select v-model:value="typeFilter" :options="typeFilterOptions" class="filter-select" />
        </div>

        <div v-if="filteredVisitors.length > 0" class="visitor-list">
          <div v-for="v in filteredVisitors" :key="v.name" class="visitor-card" @click="goToDetail(v.name)">
            <div class="card-left">
              <div class="card-header">
                <span class="visitor-name">{{ v.name }}</span>
                <span class="type-tag">{{ v.type.toUpperCase() }}</span>
              </div>
              <div v-if="getServerName(v)" class="card-meta">{{ getServerName(v) }}</div>
            </div>
            <div class="card-right">
              <div @click.stop>
                <n-dropdown
                  trigger="click"
                  placement="bottom-end"
                  :options="visitorActionOptions"
                  @select="(key) => handleVisitorAction(key, v)"
                >
                  <n-button type="primary" secondary quaternary size="small">
                    <template #icon>
                      <n-icon><ellipsis-horizontal /></n-icon>
                    </template>
                  </n-button>
                </n-dropdown>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p class="empty-text">暂无访问器</p>
          <p class="empty-hint">点击“新建访问器”即可创建。</p>
        </div>
      </template>
    </n-spin>

    <n-modal
      v-model:show="deleteDialog.visible"
      preset="card"
      title="删除访问器"
      :style="{ width: isMobile ? 'calc(100vw - 24px)' : '400px' }"
      :mask-closable="false"
    >
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
import { ref, computed, reactive, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NDropdown, NIcon, NInput, NModal, NSelect, NSpin } from 'naive-ui'
import { CreateOutline, EllipsisHorizontal, RefreshOutline, SearchOutline, TrashOutline } from '@vicons/ionicons5'
import { useVisitorStore } from '../stores/visitor'
import { useResponsive } from '../composables/useResponsive'
import type { VisitorDefinition } from '../types'
import { createMessageHelpers } from '../naive'

const { isMobile } = useResponsive()
const router = useRouter()
const visitorStore = useVisitorStore()
const message = createMessageHelpers()

const searchText = ref('')
const typeFilter = ref('')

const deleteDialog = reactive({
  visible: false,
  message: '',
  loading: false,
  name: '',
})

const typeOptions = computed(() => {
  return [
    { label: 'STCP', value: 'stcp' },
    { label: 'SUDP', value: 'sudp' },
    { label: 'XTCP', value: 'xtcp' },
  ]
})

const typeFilterOptions = computed(() => [
  { label: '全部类型', value: '' },
  ...typeOptions.value,
])

const renderActionIcon = (icon: any) => () =>
  h(NIcon, null, { default: () => h(icon) })

const visitorActionOptions = [
  { label: '编辑', key: 'edit', icon: renderActionIcon(CreateOutline) },
  {
    label: '删除',
    key: 'delete',
    icon: renderActionIcon(TrashOutline),
    props: { class: 'danger-dropdown-option' },
  },
]

const filteredVisitors = computed(() => {
  let list = visitorStore.storeVisitors

  if (typeFilter.value) {
    list = list.filter((v) => v.type === typeFilter.value)
  }

  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter((v) => v.name.toLowerCase().includes(q))
  }

  return list
})

const getServerName = (v: VisitorDefinition): string => {
  const block = (v as any)[v.type]
  return block?.serverName || ''
}

const fetchData = () => {
  visitorStore.fetchStoreVisitors()
}

const handleCreate = () => {
  router.push('/visitors/create')
}

const handleEdit = (v: VisitorDefinition) => {
  router.push('/visitors/' + encodeURIComponent(v.name) + '/edit')
}

const goToDetail = (name: string) => {
  router.push('/visitors/detail/' + encodeURIComponent(name))
}

const handleDelete = (name: string) => {
  deleteDialog.name = name
  deleteDialog.message = `确认删除访问器“${name}”吗？删除后无法恢复。`
  deleteDialog.visible = true
}

const handleVisitorAction = (key: string | number, visitor: VisitorDefinition) => {
  if (key === 'edit') {
    handleEdit(visitor)
  } else if (key === 'delete') {
    handleDelete(visitor.name)
  }
}

const doDelete = async () => {
  deleteDialog.loading = true
  try {
    await visitorStore.deleteVisitor(deleteDialog.name)
    message.success('访问器已删除')
    deleteDialog.visible = false
    fetchData()
  } catch (err: any) {
    message.error('删除失败：' + (err.message || '未知错误'))
  } finally {
    deleteDialog.loading = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.visitors-page {
  height: 100%;
  overflow-y: auto;
  max-width: 960px;
  margin: 0 auto;
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
  border-bottom: 1px solid $color-border-lighter;
  margin-bottom: $spacing-xl;
}

.tab-buttons {
  display: flex;
}

.tab-btn {
  background: none;
  border: none;
  padding: $spacing-sm $spacing-xl;
  font-size: $font-size-md;
  color: $color-text-muted;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all $transition-fast;

  &:hover {
    color: $color-text-primary;
  }

  &.active {
    color: $color-text-primary;
    border-bottom-color: $color-text-primary;
    font-weight: $font-weight-medium;
  }
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
  margin-bottom: $spacing-xl;

  :deep(.search-input) {
    flex: 1;
    min-width: 150px;
  }
}

.filter-select {
  width: 140px;
}

.visitor-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.visitor-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: $color-bg-primary;
  border: 1px solid $color-border-lighter;
  border-radius: $radius-md;
  padding: 14px 20px;
  cursor: pointer;
  transition: all $transition-medium;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border-color: $color-border;
  }
}

.card-left {
  @include flex-column;
  gap: $spacing-sm;
  flex: 1;
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.visitor-name {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.type-tag {
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  padding: 2px 8px;
  border-radius: 4px;
  background: $color-bg-muted;
  color: $color-text-secondary;
}

.card-meta {
  font-size: $font-size-sm;
  color: $color-text-muted;
}

.card-right {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  flex-shrink: 0;
}

:global(.danger-dropdown-option) {
  color: $color-danger;
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

@include mobile {
  .visitors-page {
    padding: $spacing-lg;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-md;
  }

  .filter-bar {
    flex-wrap: wrap;

    :deep(.search-input) {
      flex: 1 1 100%;
    }
  }

  .filter-select {
    width: 100%;
  }

  .visitor-card {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-sm;
  }

  .card-right {
    justify-content: flex-end;
  }
}
</style>
