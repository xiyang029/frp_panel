import { create } from 'zustand'
import type { ProxyDefinition, ProxyStatus } from '../types'
import {
  createStoreProxy,
  deleteStoreProxy,
  getStatus,
  getStoreProxy,
  listStoreProxies,
  updateStoreProxy,
} from '../api/frpc'

interface ProxyStoreState {
  proxies: ProxyStatus[]
  storeProxies: ProxyDefinition[]
  storeEnabled: boolean
  storeChecked: boolean
  loading: boolean
  storeLoading: boolean
  error: string | null
  fetchStatus: () => Promise<void>
  fetchStoreProxies: () => Promise<void>
  checkStoreEnabled: () => Promise<boolean>
  createProxy: (data: ProxyDefinition) => Promise<void>
  updateProxy: (name: string, data: ProxyDefinition) => Promise<void>
  deleteProxy: (name: string) => Promise<void>
  toggleProxy: (name: string, enabled: boolean) => Promise<void>
  storeProxyWithStatus: (def: ProxyDefinition) => ProxyStatus
}

export const useProxyStore = create<ProxyStoreState>((set, get) => ({
  proxies: [],
  storeProxies: [],
  storeEnabled: false,
  storeChecked: false,
  loading: false,
  storeLoading: false,
  error: null,

  fetchStatus: async () => {
    set({ loading: true, error: null })
    try {
      const json = await getStatus()
      const list: ProxyStatus[] = []
      for (const key in json) {
        for (const proxy of json[key]) {
          list.push(proxy)
        }
      }
      set({ proxies: list })
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  fetchStoreProxies: async () => {
    set({ storeLoading: true })
    try {
      const res = await listStoreProxies()
      set({
        storeProxies: res.proxies || [],
        storeEnabled: true,
        storeChecked: true,
      })
    } catch (err: any) {
      if (err?.status === 404) {
        set({ storeEnabled: false })
      }
      set({ storeChecked: true })
    } finally {
      set({ storeLoading: false })
    }
  },

  checkStoreEnabled: async () => {
    if (get().storeChecked) return get().storeEnabled
    await get().fetchStoreProxies()
    return get().storeEnabled
  },

  createProxy: async (data) => {
    await createStoreProxy(data)
    await get().fetchStoreProxies()
  },

  updateProxy: async (name, data) => {
    await updateStoreProxy(name, data)
    await get().fetchStoreProxies()
  },

  deleteProxy: async (name) => {
    await deleteStoreProxy(name)
    await get().fetchStoreProxies()
  },

  toggleProxy: async (name, enabled) => {
    const def = await getStoreProxy(name)
    const block = (def as any)[def.type]
    if (block) {
      block.enabled = enabled
    }
    await updateStoreProxy(name, def)
    await get().fetchStatus()
    await get().fetchStoreProxies()
  },

  storeProxyWithStatus: (def) => {
    const block = (def as any)[def.type]
    const enabled = block?.enabled !== false
    const localIP = block?.localIP || '127.0.0.1'
    const localPort = block?.localPort
    const local_addr = localPort != null ? `${localIP}:${localPort}` : ''
    const remotePort = block?.remotePort
    const remote_addr = remotePort != null ? `:${remotePort}` : ''
    const plugin = block?.plugin?.type || ''
    const status = get().proxies.find((proxy) => proxy.name === def.name)

    return {
      name: def.name,
      type: def.type,
      status: !enabled ? 'disabled' : status?.status || 'waiting',
      err: status?.err || '',
      local_addr: status?.local_addr || local_addr,
      remote_addr: status?.remote_addr || remote_addr,
      plugin: status?.plugin || plugin,
      source: 'store',
    }
  },
}))
