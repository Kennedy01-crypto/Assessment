export type User = {
  id: number
  username: string
  firstName: string
  lastName: string
}
export type Session = { accessToken: string; refreshToken: string; user: User }
export type Product = {
  id: number
  title: string
  description: string
  category: string
  price: number
  rating: number
  stock: number
  brand?: string
  thumbnail: string
  images?: string[]
}
export type ProductPage = {
  products: Product[]
  total: number
  skip: number
  limit: number
}
export type Category = { slug: string; name: string; url: string }
