export interface V2Envelope<T> {
  code: number
  msg: string
  data: T
}

export interface V2Page<T> {
  total: number
  page: number
  pageSize: number
  items: T[]
}

type QueryParamValue = string | number | boolean | null | undefined

export interface DashboardHttpHooks {
  buildBasicAuthHeader: () => string | null
  onUnauthorized?: () => void
  onProxyAuthRequired?: () => void
}

export class HTTPError extends Error {
  status: number
  statusText: string

  constructor(status: number, statusText: string, message?: string) {
    super(message || statusText)
    this.status = status
    this.statusText = statusText
  }
}

const isJsonBody = (body: unknown): boolean =>
  !!body &&
  typeof body === 'object' &&
  !(body instanceof FormData) &&
  !(body instanceof Blob) &&
  !(body instanceof ArrayBuffer)

const withDashboardAuthHeaders = (
  hooks: DashboardHttpHooks,
  headers: Headers,
): Headers => {
  const authHeader = hooks.buildBasicAuthHeader()
  if (authHeader && !headers.has('Authorization')) {
    headers.set('Authorization', authHeader)
  }
  return headers
}

const handleAuthFailure = (status: number, hooks: DashboardHttpHooks): void => {
  if (status === 401) {
    hooks.onUnauthorized?.()
    if (!window.location.hash.startsWith('#/login')) {
      const next = encodeURIComponent(window.location.hash || '#/')
      window.location.hash = `#/login?next=${next}`
    }
    return
  }

  if (status === 407) {
    hooks.onProxyAuthRequired?.()
  }
}

const request = async <T>(
  hooks: DashboardHttpHooks,
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const headers = withDashboardAuthHeaders(
    hooks,
    new Headers(options.headers ?? {}),
  )
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  })

  if (!response.ok) {
    handleAuthFailure(response.status, hooks)
    throw new HTTPError(response.status, response.statusText, `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return {} as T
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return response.text() as unknown as T
}

const requestText = async (
  hooks: DashboardHttpHooks,
  url: string,
  options: RequestInit = {},
): Promise<string> => {
  const headers = withDashboardAuthHeaders(
    hooks,
    new Headers(options.headers ?? {}),
  )
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  })

  if (!response.ok) {
    handleAuthFailure(response.status, hooks)
    throw new HTTPError(response.status, response.statusText, `HTTP ${response.status}`)
  }

  return response.text()
}

const requestV2 = async <T>(
  hooks: DashboardHttpHooks,
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const headers = withDashboardAuthHeaders(
    hooks,
    new Headers(options.headers ?? {}),
  )
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  })
  const envelope = (await response.json().catch(() => null)) as
    | V2Envelope<T>
    | null

  if (!response.ok) {
    handleAuthFailure(response.status, hooks)
    throw new HTTPError(
      response.status,
      response.statusText,
      envelope?.msg || `HTTP ${response.status}`,
    )
  }

  if (!envelope || typeof envelope.code !== 'number') {
    throw new Error('Invalid API v2 response')
  }

  if (envelope.code >= 400) {
    throw new HTTPError(envelope.code, envelope.msg, envelope.msg)
  }

  return envelope.data
}

export const buildQueryString = (
  params: Record<string, QueryParamValue>,
): string => {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue
    query.append(key, String(value))
  }
  const text = query.toString()
  return text ? `?${text}` : ''
}

export const createDashboardHttpClient = (hooks: DashboardHttpHooks) => {
  const encodeBody = (body?: any): { body?: BodyInit; headers: Headers } => {
    const headers = new Headers()
    if (isJsonBody(body)) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
      return { body: JSON.stringify(body), headers }
    }
    return { body, headers }
  }

  const mergeHeaders = (
    options: RequestInit | undefined,
    headers: Headers,
  ): Headers => {
    const merged = new Headers(options?.headers ?? {})
    headers.forEach((value, key) => {
      if (!merged.has(key)) {
        merged.set(key, value)
      }
    })
    return merged
  }

  return {
    get: <T>(url: string, options?: RequestInit) =>
      request<T>(hooks, url, { ...options, method: 'GET' }),
    getText: (url: string, options?: RequestInit) =>
      requestText(hooks, url, { ...options, method: 'GET' }),
    getV2: <T>(url: string, options?: RequestInit) =>
      requestV2<T>(hooks, url, { ...options, method: 'GET' }),
    post: <T>(url: string, body?: any, options?: RequestInit) => {
      const encoded = encodeBody(body)
      const headers = mergeHeaders(options, encoded.headers)
      return request<T>(hooks, url, {
        ...options,
        method: 'POST',
        headers,
        body: encoded.body,
      })
    },
    put: <T>(url: string, body?: any, options?: RequestInit) => {
      const encoded = encodeBody(body)
      const headers = mergeHeaders(options, encoded.headers)
      return request<T>(hooks, url, {
        ...options,
        method: 'PUT',
        headers,
        body: encoded.body,
      })
    },
    delete: <T>(url: string, options?: RequestInit) =>
      request<T>(hooks, url, { ...options, method: 'DELETE' }),
  }
}
