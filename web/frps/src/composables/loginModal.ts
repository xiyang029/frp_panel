import { ref } from 'vue'

export const loginModalVisible = ref(false)

export const openLoginModal = (): void => {
  loginModalVisible.value = true
}

export const closeLoginModal = (): void => {
  loginModalVisible.value = false
}
