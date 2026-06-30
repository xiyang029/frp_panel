import { create } from 'zustand'
import type { VisitorDefinition } from '../types'
import {
  createStoreVisitor,
  deleteStoreVisitor,
  listStoreVisitors,
  updateStoreVisitor,
} from '../api/frpc'

interface VisitorStoreState {
  visitors: VisitorDefinition[]
  storeEnabled: boolean
  storeChecked: boolean
  loading: boolean
  fetchStoreVisitors: () => Promise<void>
  checkStoreEnabled: () => Promise<boolean>
  createVisitor: (data: VisitorDefinition) => Promise<void>
  updateVisitor: (name: string, data: VisitorDefinition) => Promise<void>
  deleteVisitor: (name: string) => Promise<void>
}

export const useVisitorStore = create<VisitorStoreState>((set, get) => ({
  visitors: [],
  storeEnabled: false,
  storeChecked: false,
  loading: false,

  fetchStoreVisitors: async () => {
    set({ loading: true })
    try {
      const res = await listStoreVisitors()
      set({
        visitors: res.visitors || [],
        storeEnabled: true,
        storeChecked: true,
      })
    } catch (err: any) {
      if (err?.status === 404) {
        set({ storeEnabled: false })
      }
      set({ storeChecked: true })
    } finally {
      set({ loading: false })
    }
  },

  checkStoreEnabled: async () => {
    if (get().storeChecked) return get().storeEnabled
    await get().fetchStoreVisitors()
    return get().storeEnabled
  },

  createVisitor: async (data) => {
    await createStoreVisitor(data)
    await get().fetchStoreVisitors()
  },

  updateVisitor: async (name, data) => {
    await updateStoreVisitor(name, data)
    await get().fetchStoreVisitors()
  },

  deleteVisitor: async (name) => {
    await deleteStoreVisitor(name)
    await get().fetchStoreVisitors()
  },
}))
