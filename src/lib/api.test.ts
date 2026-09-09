import { describe, expect, it } from 'vitest'
import { filterAndPageProducts } from './api'
import type { Product } from './types'

const products = (['Gauze', 'Tape', 'Gloves', 'Masks'] as const).map((title, index): Product => ({
  id: index + 1,
  title,
  description: `${title} for the ward`,
  category: 'supplies',
  price: [12, 4, 8, 2][index],
  rating: 4,
  stock: 20,
  thumbnail: '',
}))

describe('filterAndPageProducts', () => {
  it('filters case-insensitively before paging', () => {
    const result = filterAndPageProducts(products, 'MASK', 'title-asc', 1, 10)
    expect(result.total).toBe(1)
    expect(result.products[0].title).toBe('Masks')
  })

  it('sorts the filtered category result and keeps page metadata accurate', () => {
    const result = filterAndPageProducts(products, '', 'price-asc', 2, 2)
    expect(result.total).toBe(4)
    expect(result.skip).toBe(2)
    expect(result.products.map((item) => item.price)).toEqual([8, 12])
  })
})
