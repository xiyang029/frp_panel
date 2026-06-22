<template>
  <n-space vertical>
    <n-space justify="space-between" align="center" wrap>
      <n-text style="font-size: 24px;" strong>{{ title }}</n-text>

      <n-space align="center" :size="12">
        <n-button v-if="docUrl" text tag="a" :href="docUrl" target="_blank" rel="noreferrer">
          {{ docLabel }}
        </n-button>

        <n-button v-if="showRefresh" secondary :loading="loading" @click="fetchConfig"> 
          {{ refreshLabel }}
        </n-button>

        <n-button type="primary" :loading="saving" @click="handleSave">
          {{ saveLabel }}
        </n-button>
      </n-space>
    </n-space>

    <n-card :bordered="false" size="small" segmented>
      <template #header>
        <n-text strong>{{ cardTitle }}</n-text>
      </template>

      <n-input v-model:value="content" type="textarea" :autosize="{ minRows: textareaMinRows }"
        :placeholder="placeholder" />
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NButton, NCard, NInput, NSpace, NText, useDialog, useMessage } from 'naive-ui'

const props = withDefaults(
  defineProps<{
    title: string
    cardTitle: string
    headerHint?: string
    placeholder: string
    saveLabel: string
    refreshLabel?: string
    docLabel?: string
    docUrl?: string
    showRefresh?: boolean
    confirmTitle?: string
    confirmContent?: string
    textareaMinRows?: number
    loadConfig: () => Promise<string>
    saveConfig: (content: string) => Promise<{ message?: string } | void>
    afterSave?: () => Promise<void> | void
    loadErrorPrefix?: string
    saveErrorPrefix?: string
    successMessage?: string
    emptyMessage?: string
  }>(),
  {
    refreshLabel: '刷新',
    docLabel: '查看配置文档',
    showRefresh: false,
    confirmTitle: '',
    confirmContent: '',
    textareaMinRows: 24,
    afterSave: undefined,
    loadErrorPrefix: '获取配置失败: ',
    saveErrorPrefix: '保存配置失败: ',
    successMessage: '配置已保存',
    emptyMessage: '配置内容不能为空',
  },
)

const dialog = useDialog()
const message = useMessage()
const content = ref('')
const loading = ref(false)
const saving = ref(false)

const fetchConfig = async () => {
  loading.value = true
  try {
    content.value = await props.loadConfig()
  } catch (err: any) {
    message.error(props.loadErrorPrefix + (err?.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const doSave = async () => {
  if (!content.value.trim()) {
    message.warning(props.emptyMessage)
    return
  }

  saving.value = true
  try {
    const result = await props.saveConfig(content.value)
    await props.afterSave?.()
    message.success(result?.message || props.successMessage)
  } catch (err: any) {
    message.error(props.saveErrorPrefix + (err?.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

const handleSave = () => {
  if (props.confirmTitle || props.confirmContent) {
    dialog.warning({
      title: props.confirmTitle || props.saveLabel,
      content: props.confirmContent,
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: doSave,
    })
    return
  }

  void doSave()
}

onMounted(fetchConfig)
</script>

<style scoped>
</style>
