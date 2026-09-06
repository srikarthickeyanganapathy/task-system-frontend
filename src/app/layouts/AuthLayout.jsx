import React, { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { ArrowLeft, Sun, Moon } from 'lucide-react'
import { Text } from '@/shared/ui/Typography'
import { RyokaiLogo } from '@/shared/ui/Logo/RyokaiLogo'
import { CosmicBackground } from '@/shared/ui/CosmicBackground'
import { AuthDemoStage } from './AuthDemoStage'
import { useTheme } from '@/app/providers/ThemeProvider'

function AuthThemeToggle() {
  const { setTheme } = useTheme()
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  const toggle = () => {
    const next = dark ? 'light' : 'dark'
    setTheme(next)
    setDark(!dark)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 text-[var(--text-tertiary)] backdrop-blur-sm transition-all duration-200 hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
    >
      {dark ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
    </button>
  )
}

export function AuthLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">

      {/* LEFT SIDE -- brand stage: logo + live product demo over the nebula-eye galaxy */}
      <aside className="relative hidden lg:flex lg:w-[46%] flex-col overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--bg-subtle)] mesh-bg shadow-[var(--inset-highlight-soft)]">
        <CosmicBackground variant="hero" opacity={0.3} />
        {/* Corner nebula glows */}
        <div
          className="pointer-events-none absolute -bottom-28 -left-28 z-0 h-80 w-80 rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--nebula-2), transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-28 -right-28 z-0 h-80 w-80 rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--nebula-4), transparent 70%)' }}
        />
        {/* Quiet dot-grid texture */}
        <div
          className="absolute inset-0 z-0 opacity-[0.28]"
          style={{
            backgroundImage: 'radial-gradient(var(--border-strong) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse 75% 55% at 28% 18%, black 0%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 55% at 28% 18%, black 0%, transparent 75%)',
          }}
        />

        {/* Header -- logo + brand line */}
        <div className="relative z-10 flex shrink-0 items-center justify-between px-10 pt-8">
          <RyokaiLogo size="lg" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            The quiet workspace
          </span>
        </div>

        {/* Middle -- the demo stage owns the space (scales itself to fit) */}
        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 items-stretch justify-stretch overflow-hidden p-4">
          <AuthDemoStage />
        </div>

        {/* Footer */}
        <div className="relative z-10 flex shrink-0 items-center justify-between px-10 pb-7">
          <Text size="xs" variant="muted">  2026 Ryokai</Text>
          <Text size="xs" variant="muted" className="font-mono tracking-wide">Made for teams that ship</Text>
        </div>
      </aside>

      {/* RIGHT SIDE -- form stage */}
      <main id="main-content" tabIndex={-1} className="relative flex flex-1 flex-col overflow-hidden bg-[var(--bg-base)]">
        {/* Faint starfield ties the form side to the brand panel */}
        <CosmicBackground variant="hero" opacity={0.1} />

        {/* Top chrome -- back to landing + theme toggle */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-5 sm:p-7">
          <Link
            to="/landing"
            className="group inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--text-tertiary)] transition-all duration-200 hover:border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={14} strokeWidth={2} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            Home
          </Link>
          <AuthThemeToggle />
        </div>

        <div className="no-scrollbar relative z-10 flex flex-1 items-center justify-center overflow-y-auto px-6 py-16 sm:px-10">
          <div className="w-full max-w-[360px]">
            {/* Mobile brand mark */}
            <div className="mb-8 flex justify-center lg:hidden">
              <RyokaiLogo size="md" />
            </div>
            <div className="spring-in">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
