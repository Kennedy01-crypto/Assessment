import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ChevronRight, ClipboardList } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, saveSession } from '../lib/api'
import { resolveAuthRedirect } from '../lib/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState('emilys')
  const [password, setPassword] = useState('emilyspass')
  const [error, setError] = useState('')
  const redirectTarget = resolveAuthRedirect(searchParams.get('redirect'))
  const mutation = useMutation({
    mutationFn: () => api.login(username, password),
    onSuccess: (session) => {
      saveSession(session)
      navigate(redirectTarget, { replace: true })
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
