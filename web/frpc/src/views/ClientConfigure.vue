<template>
  <DashboardConfigEditor
    title="客户端配置"
    card-title="TOML 配置"
    placeholder="# frpc configuration file content..."
    save-label="保存配置"
    refresh-label="刷新"
    doc-label="查看配置文档"
    doc-url="https://github.com/fatedier/frp/blob/dev/conf/frpc_full_example.toml"
    confirm-title="确认更新"
    confirm-content="这会覆盖当前 frpc 配置文件，保存后需要重启 frpc 进程才能生效。"
    :load-config="loadConfig"
    :save-config="saveConfig"
    save-error-prefix="更新失败: "
    load-error-prefix="获取配置失败: "
    success-message="配置已保存，请重启 frpc 进程生效"
    empty-message="配置内容不能为空"
    :textarea-min-rows="28"
  />
</template>

<script setup lang="ts">
import DashboardConfigEditor from '@common/components/DashboardConfigEditor.vue'
import { getConfig, putConfig } from '../api/frpc'

const loadConfig = () => getConfig()
const saveConfig = (content: string) => putConfig(content)
</script>
