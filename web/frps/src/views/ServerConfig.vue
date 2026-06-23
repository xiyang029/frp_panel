<template>
  <DashboardConfigEditor
    title="服务端配置"
    card-title="TOML 配置"
    placeholder="# frps configuration file content..."
    save-label="保存配置"
    doc-label="查看配置文档"
    doc-url="https://github.com/fatedier/frp/blob/dev/conf/frps_full_example.toml"
    :load-config="loadConfig"
    :save-config="saveConfig"
    save-error-prefix="保存服务端配置失败: "
    load-error-prefix="获取服务端配置失败: "
    success-message="配置已保存，请重启 frps 进程生效"
  />
</template>

<script setup lang="ts">
import DashboardConfigEditor from '@common/components/DashboardConfigEditor.vue'
import { getServerConfig, putServerConfig } from '../api/server'

const loadConfig = () => getServerConfig()
const saveConfig = (content: string) => putServerConfig(content)
</script>
