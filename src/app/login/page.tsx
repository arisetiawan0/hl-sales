'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/auth/AuthProvider'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const success = login(username, password)
    if (success) {
      router.push('/')
    } else {
      setError('Username atau password salah')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding (desktop) */}
      <div
        className="hidden lg:flex lg:flex-1 flex-col justify-between p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, oklch(0.45 0.18 250) 0%, oklch(0.5 0.2 285) 50%, oklch(0.45 0.18 320) 100%)',
        }}
      >
        {/* decorative orbs */}
        <div
          className="absolute -top-32 -right-32 size-96 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: 'oklch(0.65 0.22 285 / 0.5)' }}
        />
        <div
          className="absolute -bottom-40 -left-20 size-96 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: 'oklch(0.6 0.22 250 / 0.45)' }}
        />
        {/* grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* logo mark */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div
              className="flex size-11 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, oklch(0.7 0.14 250), oklch(0.5 0.16 285))' }}
            >
              <span className="text-lg font-black text-white tracking-tight">HL</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">HL Sales</span>
          </div>
        </div>

        {/* centered content */}
        <div className="relative flex flex-col items-center text-center">
          <div
            className="size-20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/25"
            style={{ background: 'linear-gradient(135deg, oklch(0.65 0.18 250), oklch(0.5 0.2 285))', boxShadow: '0 20px 60px -20px oklch(0.55 0.18 250 / 0.6)' }}
          >
            <span className="text-3xl font-black text-white tracking-tighter">HL</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Internal Finance
          </h2>
          <p className="mt-2 text-sm text-white/80 max-w-xs">
            Sistem manajemen piutang dan bonus untuk HL Sales
          </p>

          {/* decorative dots */}
          <div className="flex items-center gap-2 mt-6">
            {['oklch(0.88 0.06 250)', 'oklch(0.75 0.14 145)', 'oklch(0.78 0.14 75)'].map((color, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* footer text */}
        <div className="relative">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} HL Sales Internal
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10" style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div
              className="flex size-9 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 250), oklch(0.45 0.2 285))' }}
            >
              <span className="text-sm font-black text-white tracking-tight">HL</span>
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--foreground)' }}>
              HL Sales
            </span>
          </div>

          <div
            className="rounded-2xl p-8 ring-1 ring-foreground/[0.08]"
            style={{ backgroundColor: 'var(--card)', boxShadow: '0 4px 32px -8px oklch(0 0 0 / 0.08)' }}
          >
            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                Masuk ke akun Anda
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Gunakan kredensial yang diberikan oleh administrator
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    backgroundColor: 'oklch(0.95 0.03 25)',
                    color: 'var(--destructive)',
                    border: '1px solid oklch(0.9 0.03 25)',
                  }}
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full font-semibold"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, oklch(0.55 0.18 250), oklch(0.45 0.18 250))',
                  boxShadow: '0 4px 16px -4px oklch(0.55 0.18 250 / 0.4)',
                }}
              >
                {loading ? 'Memuat...' : 'Masuk'}
              </Button>
            </form>


          </div>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--muted-foreground)' }}>
            Akses terbatas untuk staf HL Sales
          </p>
        </div>
      </div>
    </div>
  )
}