const AUTH_KEY = 'hl-auth'
const PASSWORD = process.env.NEXT_PUBLIC_AUTH_PASSWORD || 'admin'

export function login(password: string): boolean {
  if (password === PASSWORD) {
    localStorage.setItem(AUTH_KEY, 'true')
    return true
  }
  return false
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY)
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AUTH_KEY) === 'true'
}
