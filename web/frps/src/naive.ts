export { dateLocale, locale, themeOverrides, useNaiveTheme } from '../../common/naive-theme'

const messageApi = { current: null as any }

export const setNaiveMessageApi = (api: any) => {
  messageApi.current = api
}

export const createMessageHelpers = () => ({
  success: (content: string) => messageApi.current?.success(content),
  error: (content: string) => messageApi.current?.error(content),
  warning: (content: string) => messageApi.current?.warning(content),
  info: (content: string) => messageApi.current?.info(content),
})
