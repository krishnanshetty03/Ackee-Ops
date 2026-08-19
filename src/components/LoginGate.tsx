import { useState, type FormEvent } from 'react'
import s from './LoginGate.module.css'
import { Button } from './ui/Button'
import { Input, FieldGroup } from './ui/Field'
import { ArrowLeft, BarChart, Grid, Key, Truck } from './icons'
import type { DemoCredential } from '../lib/types'

interface LoginGateProps {
  role: 'staff' | 'driver' | 'md'
  credential: DemoCredential
  onSuccess: () => void
  onBack: () => void
}

const COPY = {
  staff: {
    icon: Grid,
    title: 'Staff Login',
    subtitle: 'Tallawah Ops Dashboard',
  },
  driver: {
    icon: Truck,
    title: 'Driver Login',
    subtitle: 'Tallawah Field App',
  },
  md: {
    icon: BarChart,
    title: 'Management Login',
    subtitle: 'Tallawah Executive Overview',
  },
}

export function LoginGate({ role, credential, onSuccess, onBack }: LoginGateProps) {
  const copy = COPY[role]
  const Icon = copy.icon
  const [username, setUsername] = useState(credential.username)
  const [password, setPassword] = useState(credential.password)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (username.trim().toLowerCase() !== credential.username.toLowerCase()) {
      setError('No account found with that username.')
      return
    }
    if (password !== credential.password) {
      setError('Incorrect password. Check the demo credentials below.')
      return
    }
    setError(null)
    setBusy(true)
    // brief pause so "signing in" reads as a real step, not an instant no-op
    setTimeout(() => {
      setBusy(false)
      onSuccess()
    }, 500)
  }

  return (
    <div className={s.page}>
      <div className={s.kente} />
      <div className={s.card}>
        <span className={s.iconWrap}>
          <Icon size={24} />
        </span>
        <div className={s.title}>{copy.title}</div>
        <div className={s.subtitle}>{copy.subtitle}</div>

        <form className={s.form} onSubmit={submit}>
          {error && <div className={s.error}>{error}</div>}
          <FieldGroup label="Username">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@tallawahfoods.com"
              autoComplete="username"
            />
          </FieldGroup>
          <FieldGroup label="Password">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" autoComplete="current-password" />
          </FieldGroup>
          <Button type="submit" variant="primary" block size="lg" disabled={busy} icon={<Key size={15} />}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className={s.credBox}>
          <div className={s.credLabel}>Demo credentials</div>
          <div className={s.credRow}>
            <span className={s.k}>Username</span>
            <span className={s.v}>{credential.username}</span>
          </div>
          <div className={s.credRow}>
            <span className={s.k}>Password</span>
            <span className={s.v}>{credential.password}</span>
          </div>
          <button
            type="button"
            className={s.fillBtn}
            onClick={() => {
              setUsername(credential.username)
              setPassword(credential.password)
              setError(null)
            }}
          >
            Fill demo credentials
          </button>
        </div>

        <button className={s.back} onClick={onBack}>
          <ArrowLeft size={13} /> Back to home
        </button>
      </div>
    </div>
  )
}
