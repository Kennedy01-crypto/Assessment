import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Product } from '../lib/types'
import { Status } from '../components/Status'

export function DetailPage() {
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
