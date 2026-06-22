<template>
  <n-space vertical :size="16">
    <n-space justify="space-between" align="center" :wrap="false">
      <h2 style="margin: 0; line-height: 1;">访问器列表</h2>

      <n-button v-if="visitorStore.storeEnabled" type="primary" size="small" @click="handleCreate">
        + 新建访问器
      </n-button>
    </n-space>

    <n-card size="small" segmented>
      <n-space vertical :size="16">
        <n-space>
          <n-tag :bordered="false" type="primary" checkable checked>本地配置</n-tag>
        </n-space>

        <template v-if="visitorStore.storeEnabled">
          <n-grid responsive="screen" cols="1 m:2" :x-gap="12" :y-gap="12">
            <n-gi>
              <n-input v-model:value="searchText" placeholder="搜索访问器名称" clearable>
                <template #prefix><n-icon><search-outline /></n-icon></template>
              </n-input>
            </n-gi>
            <n-gi>
              <n-select v-model:value="typeFilter" :options="typeFilterOptions" />
            </n-gi>
          </n-grid>
        </template>
      </n-space>
    </n-card>

    <n-spin :show="visitorStore.loading">
      <n-card v-if="!visitorStore.storeEnabled" size="small" title="本地持久化配置未启用">
        <n-space vertical :size="12">
          <n-text depth="3">请在 frpc 配置中加入以下内容：</n-text>
          <n-card size="small" embedded>
            <pre>[store]
          path = "./frpc_store.json"</pre>
          </n-card>
        </n-space>
      </n-card>

      <template v-else>
        <n-space v-if="filteredVisitors.length > 0" vertical :size="12">
          <n-card v-for="v in filteredVisitors" :key="v.name" size="small" hoverable @click="goToDetail(v.name)">
            <template #header>
              <n-space align="center" :size="8">
                <span :style="{ fontWeight: 600 }">{{ v.name }}</span>
                <n-tag size="small" :bordered="false">{{ v.type.toUpperCase() }}</n-tag>
              </n-space>
            </template>
            <template #header-extra>
              <n-dropdown trigger="click" placement="bottom-end" :options="visitorActionOptions"
                @select="(key) => handleVisitorAction(key, v)">
                <n-button type="primary" secondary quaternary size="small" @click.stop>
                  <template #icon>
                    <n-icon><ellipsis-horizontal /></n-icon>
                  </template>
                </n-button>
              </n-dropdown>
            </template>

            <n-text depth="3">{{ getServerName(v) || '未设置服务端代理' }}</n-text>
          </n-card>
        </n-space>
        <n-empty v-else description="点击“新建访问器”即可创建。" />
      </template>
    </n-spin>

    <n-modal v-model:show="deleteDialog.visible" preset="card" title="删除访问器"
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
import { ref, computed, reactive, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NCard, NDropdown, NEmpty, NGrid, NGi, NIcon, NInput, NModal, NSelect, NSpin, NSpace, NTag, NText } from 'naive-ui'
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
