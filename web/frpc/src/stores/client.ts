import { create } from 'zustand'
import { getConfig, putConfig, reloadConfig } from '../api/frpc'

interface ClientStoreState {
  config: string
  loading: boolean
  fetchConfig: () => Promise<string>
  saveConfig: (content: string) => Promise<void>
  reload: () => Promise<void>
}

export const useClientStore = create<ClientStoreState>((set) => ({
  config: '',
  loading: false,

  fetchConfig: async () => {
    set({ loading: true })
    try {
      const config = await getConfig()
      set({ config })
      return config
    } finally {
      set({ loading: false })
    }
  },

  saveConfig: async (content) => {
    await putConfig(content)
    set({ config: content })
  },

  reload: async () => {
    await reloadConfig()
  },
}))
