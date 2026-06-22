import { h, ref } from 'vue'

export { dateLocale, locale, themeOverrides, useNaiveTheme } from '../../common/naive-theme'

const messageApi = ref<any>(null)
const dialogApi = ref<any>(null)
const notificationApi = ref<any>(null)
const loadingBarApi = ref<any>(null)

export const setNaiveMessageApi = (api: any) => {
  messageApi.value = api
}

export const setNaiveDialogApi = (api: any) => {
  dialogApi.value = api
}

export const setNaiveNotificationApi = (api: any) => {
  notificationApi.value = api
}

export const setNaiveLoadingBarApi = (api: any) => {
  loadingBarApi.value = api
}

export const createMessageHelpers = () => ({
  success: (content: string) => messageApi.value?.success(content),
  error: (content: string) => messageApi.value?.error(content),
  warning: (content: string) => messageApi.value?.warning(content),
  info: (content: string) => messageApi.value?.info(content),
})

export const createConfirmDialog = () => {
  return (options: {
    title: string
    content: string
    positiveText?: string
    negativeText?: string
    onPositiveClick?: () => void | Promise<void>
  }) => {
    return dialogApi.value?.warning({
      title: options.title,
      content: () => h('div', { style: 'line-height:1.6;' }, options.content),
      positiveText: options.positiveText ?? '确认',
      negativeText: options.negativeText ?? '取消',
      onPositiveClick: options.onPositiveClick,
    })
  }
}
