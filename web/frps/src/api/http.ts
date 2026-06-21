// http.ts - Base HTTP client

import { clearDashboardAuth, buildBasicAuthHeader } from '../utils/auth'

class HTTPError extends Error {
  status: number
  statusText: string

  constructor(status: number, statusText: string, message?: string) {
    super(message || statusText)
    this.status = status
    this.statusText = statusText
  }
}

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

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {})
  const authHeader = buildBasicAuthHeader()
  if (authHeader && !headers.has('Authorization')) {
    headers.set('Authorization', authHeader)
  }

  const defaultOptions: RequestInit = {
    credentials: 'include',
  }

  const response = await fetch(url, { ...defaultOptions, ...options, headers })

  if (!response.ok) {
    if (response.status === 401) {
      clearDashboardAuth()
      if (!window.location.hash.startsWith('#/login')) {
        const next = encodeURIComponent(window.location.hash || '#/')
        window.location.hash = `#/login?next=${next}`
      }
    }
    throw new HTTPError(
      response.status,
      response.statusText,
      `HTTP ${response.status}`,
    )
  }

  // Handle empty response (e.g. 204 No Content)
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

async function requestText(url: string, options: RequestInit = {}): Promise<string> {
  const headers = new Headers(options.headers ?? {})
  const authHeader = buildBasicAuthHeader()
  if (authHeader && !headers.has('Authorization')) {
    headers.set('Authorization', authHeader)
  }

  const defaultOptions: RequestInit = {
    credentials: 'include',
  }

  const response = await fetch(url, { ...defaultOptions, ...options, headers })

  if (!response.ok) {
    if (response.status === 401) {
      clearDashboardAuth()
      if (!window.location.hash.startsWith('#/login')) {
        const next = encodeURIComponent(window.location.hash || '#/')
        window.location.hash = `#/login?next=${next}`
      }
    }
    throw new HTTPError(
      response.status,
      response.statusText,
      `HTTP ${response.status}`,
    )
  }

  return response.text()
}

async function requestV2<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const defaultOptions: RequestInit = {
    credentials: 'include',
  }

  const headers = new Headers(options.headers ?? {})
  const authHeader = buildBasicAuthHeader()
  if (authHeader && !headers.has('Authorization')) {
    headers.set('Authorization', authHeader)
  }

  const response = await fetch(url, { ...defaultOptions, ...options, headers })
  const envelope = (await response.json().catch(() => null)) as
    | V2Envelope<T>
    | null

  if (!response.ok) {
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

export const http = {
  get: <T>(url: string, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'GET' }),
  getText: (url: string, options?: RequestInit) =>
    requestText(url, { ...options, method: 'GET' }),
  getV2: <T>(url: string, options?: RequestInit) =>
    requestV2<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: any, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...Object.fromEntries(new Headers(options?.headers ?? {})) },
      body: JSON.stringify(body),
    }),
  put: <T>(url: string, body?: any, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...Object.fromEntries(new Headers(options?.headers ?? {})) },
      body: JSON.stringify(body),
    }),
  delete: <T>(url: string, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'DELETE' }),
}
