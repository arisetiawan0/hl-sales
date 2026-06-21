'use client'

import { useState, useCallback, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), [])

  const closeSidebar = useCallback(() => {
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  return (
    <div className="flex h-screen overflow-hidden">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={closeSidebar}
        />
      )}
      <div
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 transition-transform duration-300' : 'relative'}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        `}
      >
        <Sidebar isOpen={isMobile ? true : sidebarOpen} onClose={closeSidebar} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin" style={{ backgroundColor: 'var(--background)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
