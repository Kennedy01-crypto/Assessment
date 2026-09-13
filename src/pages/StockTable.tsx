import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../lib/types'

export function StockTable({ products }: { products: Product[] }) {
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
