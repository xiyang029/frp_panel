import { computed, watchEffect, type Ref } from 'vue'
import { darkTheme, dateZhCN, zhCN, type GlobalThemeOverrides } from 'naive-ui'

const sharedFontFamily = 'Lato, "Segoe UI", sans-serif'
const sharedMonoFontFamily = '"Fira Code", "Cascadia Code", monospace'

const lightAppVars = {
  '--app-font-family': sharedFontFamily,
  '--app-mono-font-family': sharedMonoFontFamily,
  '--app-bg': '#f4f7f6',
  '--app-panel': 'rgba(255, 255, 255, 0.92)',
  '--app-panel-strong': '#ffffff',
  '--app-border': 'rgba(15, 23, 42, 0.1)',
  '--app-text': '#162033',
  '--app-text-muted': '#607089',
  '--app-text-faint': '#8b99af',
  '--app-accent': '#1d4ed8',
  '--app-accent-soft': 'rgba(29, 78, 216, 0.12)',
  '--app-shadow': '0 18px 50px rgba(15, 23, 42, 0.08)',
}

const darkAppVars = {
  '--app-font-family': sharedFontFamily,
  '--app-mono-font-family': sharedMonoFontFamily,
  '--app-bg': '#0d1320',
  '--app-panel': 'rgba(17, 24, 39, 0.92)',
  '--app-panel-strong': '#111827',
  '--app-border': 'rgba(148, 163, 184, 0.16)',
  '--app-text': '#eef2ff',
  '--app-text-muted': '#9aa6c2',
  '--app-text-faint': '#74839c',
  '--app-accent': '#60a5fa',
  '--app-accent-soft': 'rgba(96, 165, 250, 0.16)',
  '--app-shadow': '0 22px 60px rgba(0, 0, 0, 0.28)',
}

export const locale = zhCN
export const dateLocale = dateZhCN

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#1d4ed8',
    primaryColorHover: '#1e40af',
    primaryColorPressed: '#1e3a8a',
    primaryColorSuppl: '#1d4ed8',
    infoColor: '#2563eb',
    successColor: '#16a34a',
    warningColor: '#d97706',
    errorColor: '#dc2626',
    borderRadius: '14px',
    borderRadiusSmall: '10px',
    fontFamily: sharedFontFamily,
    fontFamilyMono: sharedMonoFontFamily,
    bodyColor: 'var(--app-bg)',
    cardColor: 'var(--app-panel-strong)',
    modalColor: 'var(--app-panel-strong)',
    popoverColor: 'var(--app-panel-strong)',
    textColorBase: 'var(--app-text)',
    textColor1: 'var(--app-text)',
    textColor2: 'var(--app-text-muted)',
    textColor3: 'var(--app-text-faint)',
    borderColor: 'var(--app-border)',
    dividerColor: 'var(--app-border)',
    boxShadow1: 'var(--app-shadow)',
    boxShadow2: 'var(--app-shadow)',
    boxShadow3: 'var(--app-shadow)',
  },
}

export const useNaiveTheme = (isDark: Ref<boolean>) => {
  const theme = computed(() => (isDark.value ? darkTheme : null))

  watchEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const themeVars = isDark.value ? darkAppVars : lightAppVars
    const root = document.documentElement

    root.style.colorScheme = isDark.value ? 'dark' : 'light'
    root.classList.toggle('dark', isDark.value)

    for (const [key, value] of Object.entries(themeVars)) {
      root.style.setProperty(key, value)
    }
  })

  return theme
}
