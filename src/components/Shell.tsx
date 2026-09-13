import type { ReactNode } from 'react'
import { ClipboardList, LogOut, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { clearSession } from '../lib/api'
import type { User } from '../lib/types'

type ShellProps = {
  user: User
  children: ReactNode
}

export function Shell({ user, children }: ShellProps) {
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
