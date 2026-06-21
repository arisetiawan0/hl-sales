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
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const success = login(password)
    if (success) {
      router.push('/')
    } else {
      setError('Password salah')
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
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, oklch(0.7 0.14 250), oklch(0.5 0.16 285))' }}
            >
              <span className="text-base font-black text-white tracking-tight">HL</span>
            </div>
            <span className="text-white font-bold text-base tracking-tight">HL Sales</span>
          </div>
        </div>

        <div className="relative flex flex-col items-center text-center">
          <div
            className="size-16 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-white/20"
            style={{ background: 'linear-gradient(135deg, oklch(0.65 0.18 250), oklch(0.5 0.2 285))' }}
          >
            <span className="text-2xl font-black text-white tracking-tighter">HL</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Internal Finance</h2>
          <p className="mt-1.5 text-xs text-white/70 max-w-xs">
            Sistem manajemen piutang dan bonus untuk HL Sales
          </p>
        </div>

        <div className="relative">
          <p className="text-[11px] text-white/50">
            © {new Date().getFullYear()} HL Sales Internal
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10" style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-full max-w-xs">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div
              className="flex size-8 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 250), oklch(0.45 0.2 285))' }}
            >
              <span className="text-xs font-black text-white tracking-tight">HL</span>
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--foreground)' }}>
              HL Sales
            </span>
          </div>

          <div className="rounded-xl p-6 ring-1" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="mb-5 text-center">
              <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                Masuk
              </h1>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Masukkan password untuk mengakses sistem
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[11px] font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-9 text-sm text-center tracking-widest"
                  autoFocus
                />
              </div>

              {error && (
                <div
                  className="rounded-lg px-3 py-2 text-xs text-center"
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
                className="w-full h-9 text-xs font-semibold"
                disabled={loading}
              >
                {loading ? 'Memuat...' : 'Masuk'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
