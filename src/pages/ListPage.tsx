import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { Status } from '../components/Status'
import { StockTable } from './StockTable'

const PAGE_SIZE = 10
const sortOptions = [
  { value: 'title-asc', label: 'Name, A-Z' },
  { value: 'title-desc', label: 'Name, Z-A' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
]

export function ListPage() {
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
