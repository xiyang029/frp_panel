import { DashboardConfigEditor } from '@common/components/DashboardConfigEditor'
import { getConfig, putConfig, reloadConfig } from '../api/frpc'

export default function ClientConfigure() {
  return (
    <DashboardConfigEditor
      title="客户端配置"
      cardTitle="frpc.toml"
      docUrl="https://gofrp.org/zh-cn/docs/reference/client-configures/"
      fetchConfig={getConfig}
      saveConfig={async (content) => {
        await putConfig(content)
      }}
      reloadConfig={reloadConfig}
    />
  )
}
