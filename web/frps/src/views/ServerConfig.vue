<template>
  <section class="config-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">服务端配置</h1>
        <p class="page-subtitle">直接编辑 `frps` 的 TOML 配置文件，保存后会校验并自动重启服务端。</p>
      </div>
      <n-space>
        <n-button secondary @click="fetchConfig" :loading="loading">刷新</n-button>
        <n-button type="primary" @click="saveServerConfig" :loading="saving">
          保存并重启
        </n-button>
      </n-space>
    </div>

    <n-card :bordered="false" class="editor-card">
      <template #header>
        <div class="panel-title">TOML 配置内容</div>
      </template>
      <template #header-extra>
        <span class="editor-hint">接口返回的是原始 TOML 文本，不是 JSON。</span>
      </template>
      <n-input
        v-model:value="serverConfigContent"
        type="textarea"
        :autosize="false"
        placeholder="# frps configuration file content..."
        class="code-editor"
      />
    </n-card>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NCard, NInput, NSpace } from 'naive-ui'
import { createMessageHelpers } from '../naive'
import { getServerConfig, putServerConfig } from '../api/server'

const message = createMessageHelpers()
const loading = ref(false)
const saving = ref(false)
const serverConfigContent = ref('')

const fetchConfig = async () => {
  loading.value = true
  try {
    serverConfigContent.value = await getServerConfig()
  } catch (err: any) {
    message.error('获取服务端配置失败: ' + (err.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const saveServerConfig = async () => {
  if (!serverConfigContent.value.trim()) {
    message.warning('服务端配置不能为空')
    return
  }

  saving.value = true
  try {
    const result = await putServerConfig(serverConfigContent.value)
    message.success(result.message || '配置已保存')
  } catch (err: any) {
    message.error('保存服务端配置失败: ' + (err.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

fetchConfig()
</script>

<style scoped>
.config-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 32px;
  color: var(--app-text);
}

.page-subtitle {
  margin: 10px 0 0;
  line-height: 1.6;
  color: var(--app-text-muted);
}

.editor-card {
  background: var(--app-panel);
  backdrop-filter: blur(16px);
  box-shadow: var(--app-shadow);
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--app-text);
}

.editor-hint {
  font-size: 12px;
  color: var(--app-text-muted);
}

.code-editor :deep(textarea) {
  min-height: 60vh !important;
  font-family: var(--app-mono-font-family);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 767px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
