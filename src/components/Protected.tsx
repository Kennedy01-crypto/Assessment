import { useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { clearSession, getSession, api } from '../lib/api'
import { Shell } from './Shell'
import { Status } from './Status'

type ProtectedProps = {
  children: ReactNode
}

export function Protected({ children }: ProtectedProps) {
  const session = getSession()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTarget = encodeURIComponent(
    `${location.pathname}${location.search}${location.hash}` || '/',
  )
  const health = useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    enabled: Boolean(session),
    retry: false,
  })
  useEffect(() => {
    if (health.isError) {
      clearSession()
      navigate(`/login?redirect=${redirectTarget}`, { replace: true })
    }
  }, [health.isError, navigate, redirectTarget])
  if (!session) return <Navigate to={`/login?redirect=${redirectTarget}`} replace />
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
