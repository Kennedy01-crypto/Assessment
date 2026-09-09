import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { api, clearSession, getSession, saveSession } from './lib/api'
import type { Product, User } from './lib/types'
import './App.css'

const PAGE_SIZE = 10
const sortOptions = [
  { value: 'title-asc', label: 'Name, A-Z' },
  { value: 'title-desc', label: 'Name, Z-A' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
]

function Status({
  kind,
  message,
  onRetry,
}: {
  kind: 'loading' | 'empty' | 'error'
  message: string
  onRetry?: () => void
}) {
  return (
    <div className={`state state-${kind}`} role={kind === 'error' ? 'alert' : undefined}>
      <div className="state-icon">
        {kind === 'error' ? '!' : kind === 'empty' ? '—' : <RefreshCw className="spin" size={22} />}
      </div>
      <strong>{message}</strong>
      {kind === 'error' && onRetry && (
        <button className="button button-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

function Shell({ user, children }: { user: User; children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <ClipboardList size={20} />
          </span>
          <span>Clinic stock</span>
        </Link>
        <div className="user-menu">
          <span className="user-name">
            {user.firstName} {user.lastName}
          </span>
          <button
            className="icon-button"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => {
              clearSession()
              navigate('/login')
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="main-content">{children}</main>
      <footer className="footer">
        <ShieldCheck size={15} /> Internal supplies console <span>•</span> Live catalogue
      </footer>
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('emilys')
  const [password, setPassword] = useState('emilyspass')
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: () => api.login(username, password),
    onSuccess: (session) => {
      saveSession(session)
      navigate('/')
    },
    onError: () => setError('We could not sign you in. Check your details and try again.'),
  })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    mutation.mutate()
  }
  return (
    <div className="login-page">
      <div className="login-art">
        <div className="art-grid" />
        <div className="art-copy">
          <p className="eyebrow">Ward operations / 01</p>
          <h1>
            Know what is
            <br />
            <em>on the shelf.</em>
          </h1>
          <p>A quiet, reliable stock view for the moments that matter.</p>
        </div>
      </div>
      <div className="login-panel">
        <div className="login-header">
          <span className="brand-mark">
            <ClipboardList size={20} />
          </span>
          <p className="eyebrow">Clinic stock</p>
          <h2>Welcome back</h2>
          <p>Sign in to manage your supply catalogue.</p>
        </div>
        <form onSubmit={submit} className="form-stack">
          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <button className="button button-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in...' : 'Sign in'}
            <ChevronRight size={18} />
          </button>
        </form>
        <p className="login-hint">
          Demo access: <strong>emilys</strong> / <strong>emilyspass</strong>
        </p>
      </div>
    </div>
  )
}

function Protected({ children }: { children: React.ReactNode }) {
  const session = getSession()
  const navigate = useNavigate()
  const health = useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    enabled: Boolean(session),
    retry: false,
  })
  useEffect(() => {
    if (health.isError) {
      clearSession()
      navigate('/login', { replace: true })
    }
  }, [health.isError, navigate])
  if (!session) return <Navigate to="/login" replace />
  if (health.isPending || health.isError || !health.data) {
    return (
      <Status
        kind={health.isError ? 'error' : 'loading'}
        message={
          health.isError
            ? 'Your session has expired. Returning to sign in...'
            : 'Checking your session...'
        }
      />
    )
  }
  return <Shell user={health.data}>{children}</Shell>
}

function ListPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? ''
  const category = params.get('category') ?? ''
  const sort = params.get('sort') ?? 'title-asc'
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)
  const [draftSearch, setDraftSearch] = useState(search)
  useEffect(() => {
    // URL back/forward navigation must replace the unsent local search draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftSearch(search)
  }, [search])
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draftSearch !== search)
        setParams(
          (current) => {
            current.set('search', draftSearch)
            current.set('page', '1')
            return current
          },
          { replace: true },
        )
    }, 300)
    return () => window.clearTimeout(timer)
  }, [draftSearch, search, setParams])
  const setParam = useCallback(
    (key: string, value: string) =>
      setParams((current) => {
        if (value) current.set(key, value)
        else current.delete(key)
        if (key !== 'page') current.set('page', '1')
        return current
      }),
    [setParams],
  )
  const { data: categories = [], isError: categoryError } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories,
    staleTime: 30 * 60 * 1000,
  })
  const query = useQuery({
    queryKey: ['products', { search, category, sort, page }],
    queryFn: () => api.products({ search, category, sort, page, limit: PAGE_SIZE }),
    placeholderData: (previous) => previous,
  })
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE))
  const activePage = Math.min(page, totalPages)
  useEffect(() => {
    if (query.data && page > totalPages) setParam('page', String(totalPages))
  }, [page, query.data, setParam, totalPages])
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Inventory / Live catalogue</p>
          <h1>Stock overview</h1>
          <p className="lede">Find, review and correct what your clinic holds.</p>
        </div>
        <div className="sync-note">
          <span className="status-dot" /> Live catalogue
        </div>
      </div>
      <section className="toolbar" aria-label="Stock catalogue controls">
        <div className="search-wrap">
          <Search size={18} />
          <input
            aria-label="Search stock"
            placeholder="Search by item name..."
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
          />
        </div>
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(event) => setParam('category', event.target.value)}
        >
          <option value="">All categories</option>
          {categoryError ? (
            <option disabled>Categories unavailable</option>
          ) : (
            categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))
          )}
        </select>
        <select
          aria-label="Sort stock"
          value={sort}
          onChange={(event) => setParam('sort', event.target.value)}
        >
          {sortOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </section>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {query.isFetching
          ? 'Loading stock items...'
          : `Showing ${query.data?.products.length ?? 0} stock items.`}
      </div>
      {query.isPending ? (
        <Status kind="loading" message="Loading stock catalogue..." />
      ) : query.isError ? (
        <Status
          kind="error"
          message="The catalogue could not be loaded."
          onRetry={() => query.refetch()}
        />
      ) : query.data?.products.length === 0 ? (
        <Status kind="empty" message="No stock matches those filters." />
      ) : (
        <>
          <StockTable products={query.data?.products ?? []} />
          <nav className="pagination" aria-label="Stock pages">
            <span>
              Page {activePage} of {totalPages} <small>({query.data?.total ?? 0} items)</small>
            </span>
            <div>
              <button
                className="icon-button"
                disabled={activePage <= 1}
                aria-label="Previous page"
                onClick={() => setParam('page', String(activePage - 1))}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="icon-button"
                disabled={activePage >= totalPages}
                aria-label="Next page"
                onClick={() => setParam('page', String(activePage + 1))}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  )
}

function StockTable({ products }: { products: Product[] }) {
  return (
    <div className="stock-list">
      <div className="table-head">
        <span>Item</span>
        <span>Category</span>
        <span>Price</span>
        <span>Stock</span>
        <span />
      </div>
      {products.map((product) => (
        <Link className="stock-row" to={`/items/${product.id}`} key={product.id}>
          <div className="item-cell">
            <img src={product.thumbnail} alt="" />
            <div>
              <strong>{product.title}</strong>
              <small>SKU-{String(product.id).padStart(4, '0')}</small>
            </div>
          </div>
          <span className="category-pill">{product.category}</span>
          <span className="price">${product.price.toFixed(2)}</span>
          <span className={`stock-count ${product.stock < 20 ? 'low' : ''}`}>
            <i />
            {product.stock} units
          </span>
          <ChevronRight className="row-arrow" size={18} />
        </Link>
      ))}
    </div>
  )
}

function DetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [stock, setStock] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const query = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.product(id ?? ''),
  })
  const mutation = useMutation({
    mutationFn: (value: number) => api.updateStock(id ?? '', value),
    onMutate: async (value) => {
      await queryClient.cancelQueries({ queryKey: ['product', id] })
      const previous = queryClient.getQueryData<Product>(['product', id])
      queryClient.setQueryData<Product>(['product', id], (current) =>
        current ? { ...current, stock: value } : current,
      )
      return { previous }
    },
    onSuccess: () => {
      setNotice('Stock count saved.')
      setStock(null)
    },
    onError: (_error, _value, context) => {
      if (context?.previous) queryClient.setQueryData(['product', id], context.previous)
      setNotice('Could not save this correction. The previous count has been restored.')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['product', id] }),
  })
  if (query.isPending) return <Status kind="loading" message="Loading item details..." />
  if (query.isError || !query.data)
    return (
      <Status
        kind="error"
        message="This item could not be loaded."
        onRetry={() => query.refetch()}
      />
    )
  const product = query.data
  const currentStock = stock ?? product.stock
  return (
    <>
      <button className="back-link" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back to stock
      </button>
      <div className="detail-layout">
        <section className="detail-hero">
          <div className="detail-image">
            <img src={product.images?.[0] ?? product.thumbnail} alt="" />
          </div>
          <div>
            <p className="eyebrow">
              SKU-{String(product.id).padStart(4, '0')} / {product.category}
            </p>
            <h1>{product.title}</h1>
            <p className="detail-description">{product.description}</p>
            <span className="rating">★ {product.rating.toFixed(1)} rating</span>
          </div>
        </section>
        <aside className="correction-panel">
          <p className="eyebrow">Physical count</p>
          <h2>Correct stock</h2>
          <p className="muted">Update the number of units currently on the shelf.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              mutation.mutate(currentStock)
            }}
          >
            <label>
              Units in stock
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(event) => {
                  setStock(Math.max(0, Number(event.target.value)))
                  setNotice('')
                }}
              />
            </label>
            <button className="button button-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save correction'}
            </button>
          </form>
          {notice && (
            <p className={notice.startsWith('Could') ? 'form-error' : 'success-note'} role="status">
              {notice}
            </p>
          )}
        </aside>
      </div>
      <section className="detail-meta">
        <div>
          <span>Current value</span>
          <strong>${product.price.toFixed(2)}</strong>
        </div>
        <div>
          <span>Brand</span>
          <strong>{product.brand || 'Unbranded'}</strong>
        </div>
        <div>
          <span>Availability</span>
          <strong className={product.stock < 20 ? 'warn-text' : ''}>
            {product.stock < 20 ? 'Low stock' : 'In stock'}
          </strong>
        </div>
      </section>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="*"
        element={
          <Protected>
            <Routes>
              <Route path="/" element={<ListPage />} />
              <Route path="/items/:id" element={<DetailPage />} />
            </Routes>
          </Protected>
        }
      />
    </Routes>
  )
}
