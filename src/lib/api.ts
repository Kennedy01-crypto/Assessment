import type { Category, LoginResponse, Product, ProductPage, Session, User } from './types'

const BASE_URL = 'https://dummyjson.com'
let refreshPromise: Promise<string> | null = null
export const getSession = (): Session | null => {
  const raw = localStorage.getItem('clinic-session')
  return raw ? (JSON.parse(raw) as Session) : null
}
export const saveSession = (session: Session) =>
  localStorage.setItem('clinic-session', JSON.stringify(session))
export const clearSession = () => localStorage.removeItem('clinic-session')
async function refreshToken() {
  const session = getSession()
  if (!session) throw new Error('No session')
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: session.refreshToken,
      expiresInMins: 1,
    }),
  })
  if (!response.ok) throw new Error('Refresh failed')
  const data = (await response.json()) as { accessToken: string }
  saveSession({ ...session, accessToken: data.accessToken })
  return data.accessToken
}
async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const session = getSession()
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (auth && session) headers.set('Authorization', `Bearer ${session.accessToken}`)
  let response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  if (response.status === 401 && auth) {
    refreshPromise ??= refreshToken().finally(() => {
      refreshPromise = null
    })
    const token = await refreshPromise
    headers.set('Authorization', `Bearer ${token}`)
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  }
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return response.json() as Promise<T>
}
export function filterAndPageProducts(
  products: Product[],
  search: string,
  sort: string,
  page: number,
  limit: number,
): ProductPage {
  const [sortBy, order] = sort.split('-')
  const filtered = search
    ? products.filter((item) =>
        `${item.title} ${item.description}`.toLowerCase().includes(search.toLowerCase()),
      )
    : products
  const sorted = [...filtered].sort((a, b) => {
    const left = a[sortBy as 'title' | 'price']
    const right = b[sortBy as 'title' | 'price']
    return (left < right ? -1 : left > right ? 1 : 0) * (order === 'desc' ? -1 : 1)
  })
  return {
    products: sorted.slice((page - 1) * limit, page * limit),
    total: sorted.length,
    skip: (page - 1) * limit,
    limit,
  }
}
export const api = {
  login: async (username: string, password: string): Promise<Session> => {
    const response = await request<LoginResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password, expiresInMins: 1 }),
      },
      false,
    )
    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: {
        id: response.id,
        username: response.username,
        firstName: response.firstName,
        lastName: response.lastName,
      },
    }
  },
  categories: () => request<Category[]>('/products/categories'),
  product: (id: string) => request<Product>(`/products/${id}`),
  updateStock: (id: string, stock: number) =>
    request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ stock }),
    }),
  products: async ({
    search,
    category,
    sort,
    page,
    limit,
  }: {
    search: string
    category: string
    sort: string
    page: number
    limit: number
  }) => {
    const [sortBy, order] = sort.split('-')
    const query = new URLSearchParams({
      limit: String(limit),
      skip: String((page - 1) * limit),
      sortBy,
      order,
    })
    if (search && !category)
      return request<ProductPage>(`/products/search?q=${encodeURIComponent(search)}&${query}`)
    if (category) {
      const result = await request<ProductPage>(
        `/products/category/${encodeURIComponent(category)}`,
      )
      return filterAndPageProducts(result.products, search, sort, page, limit)
    }
    return request<ProductPage>(`/products?${query}`)
  },
  me: () => request<User>('/auth/me'),
}
