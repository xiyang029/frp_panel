let visible = false
const listeners = new Set<() => void>()

const emit = () => {
  for (const listener of listeners) {
    listener()
  }
}

export const getLoginModalVisible = (): boolean => visible

export const subscribeLoginModal = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const openLoginModal = (): void => {
  visible = true
  emit()
}

export const closeLoginModal = (): void => {
  visible = false
  emit()
}
