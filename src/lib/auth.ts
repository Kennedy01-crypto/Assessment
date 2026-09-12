export function resolveAuthRedirect(candidate?: string | null): string {
  if (!candidate || candidate === '/login' || candidate.startsWith('/login?')) return '/'
  if (!candidate.startsWith('/')) return '/'
  return candidate
}
