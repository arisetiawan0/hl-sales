const AUTH_KEY = 'hl-auth'
const USERNAME = process.env.NEXT_PUBLIC_AUTH_USERNAME || 'admin'
const PASSWORD = process.env.NEXT_PUBLIC_AUTH_PASSWORD || 'admin'

export function login(username: string, password: string): boolean {
  if (username === USERNAME && password === PASSWORD) {
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

export function getCurrentUser(): string {
  return USERNAME
}
