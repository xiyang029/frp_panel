import { http } from './http'
import type { ServerInfo } from '../types/server'

export const getServerInfo = () => {
  return http.get<ServerInfo>('../api/serverinfo')
}

export const getServerConfig = () => {
  return http.getText('../api/config')
}

export const putServerConfig = (content: string) => {
  return http.put<{ message: string }>('../api/config', content)
}
