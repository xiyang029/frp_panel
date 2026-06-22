import { computed, watchEffect, type Ref } from 'vue'
import { darkTheme, dateZhCN, zhCN, type GlobalThemeOverrides } from 'naive-ui'

export const locale = zhCN
export const dateLocale = dateZhCN

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    borderRadius: '14px',
    borderRadiusSmall: '10px'
  },
}

export const useNaiveTheme = (isDark: Ref<boolean>) => {
  const theme = computed(() => (isDark.value ? darkTheme : null))

  watchEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const root = document.documentElement

    root.style.colorScheme = isDark.value ? 'dark' : 'light'
    root.classList.toggle('dark', isDark.value)
  })

  return theme
}
