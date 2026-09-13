import { Route, Routes } from 'react-router-dom'
import { LoginPage } from './components/LoginPage'
import { Protected } from './components/Protected'
import { DetailPage } from './pages/DetailPage'
import { ListPage } from './pages/ListPage'
import './App.css'

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
