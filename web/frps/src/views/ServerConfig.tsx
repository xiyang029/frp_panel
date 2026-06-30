import { DashboardConfigEditor } from '@common/components/DashboardConfigEditor'
import { getServerConfig, putServerConfig } from '../api/server'

export default function ServerConfig() {
  return (
    <DashboardConfigEditor
      title="服务端配置"
      cardTitle="frps.toml"
      docUrl="https://gofrp.org/zh-cn/docs/reference/server-configures/"
      fetchConfig={getServerConfig}
      saveConfig={async (content) => {
        await putServerConfig(content)
      }}
    />
  )
}
