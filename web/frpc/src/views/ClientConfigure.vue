<template>
  <section class="configure-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">客户端配置</h1>
        <p class="page-subtitle">编辑 `frpc` 当前配置文件，保存后立即触发重载。</p>
      </div>
      <a
        href="https://github.com/fatedier/frp#configuration-files"
        target="_blank"
        class="docs-link"
      >
        查看配置文档
      </a>
    </div>

    <n-card :bordered="false" class="editor-card">
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-title">TOML 配置</div>
            <div class="card-desc">这里编辑的是后端当前使用的配置文件内容。</div>
          </div>
          <n-space>
            <n-button secondary @click="fetchData" :loading="clientStore.loading">
              刷新
            </n-button>
            <n-button type="primary" @click="handleUpload" :loading="uploading">
              保存并重载
            </n-button>
          </n-space>
        </div>
      </template>

      <n-input
        v-model:value="configContent"
        type="textarea"
        :autosize="false"
        placeholder="# frpc configuration file content..."
        class="code-editor"
      />
    </n-card>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NCard, NInput, NSpace, useDialog } from 'naive-ui'
import { createMessageHelpers } from '../naive'
import { useClientStore } from '../stores/client'

const clientStore = useClientStore()
const dialog = useDialog()
const message = createMessageHelpers()
const configContent = ref('')
const uploading = ref(false)

const fetchData = async () => {
  try {
    await clientStore.fetchConfig()
    configContent.value = clientStore.config
  } catch (err: any) {
    message.warning('获取配置失败: ' + err.message)
  }
}

const doUpload = async () => {
  if (!configContent.value.trim()) {
    message.warning('配置内容不能为空')
    return
  }

  uploading.value = true
  try {
    await clientStore.saveConfig(configContent.value)
    await clientStore.reload()
    message.success('配置已更新并完成重载')
  } catch (err: any) {
    message.error('更新失败: ' + err.message)
  } finally {
    uploading.value = false
  }
}

const handleUpload = () => {
  dialog.warning({
    title: '确认更新',
    content: '这会覆盖当前 frpc 配置文件，并立即触发重载。',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: doUpload,
  })
}

fetchData()
</script>

<style scoped>
.configure-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.docs-link {
  color: var(--app-accent);
  text-decoration: none;
  font-weight: 600;
}

.editor-card {
  background: var(--app-panel);
  backdrop-filter: blur(16px);
  box-shadow: var(--app-shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--app-text);
}

.card-desc {
  margin-top: 4px;
  font-size: 13px;
  color: var(--app-text-muted);
}

.code-editor :deep(textarea) {
  min-height: 62vh !important;
  font-family: var(--app-mono-font-family);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 767px) {
  .page-header,
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
