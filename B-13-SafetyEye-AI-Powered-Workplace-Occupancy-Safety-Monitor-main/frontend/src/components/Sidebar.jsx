import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { healthCheck } from '../api'

const links = [
  { to: '/',           label: 'Dashboard',  icon: '▦' },
  { to: '/upload',     label: 'Upload',     icon: '↑' },
  { to: '/violations', label: 'Violations', icon: '⚠' },
  { to: '/live',       label: 'Live',       icon: '◉' },
]

export default function Sidebar() {
  const [apiOk, setApiOk] = useState(null)

  useEffect(() => {
    const check = () =>
      healthCheck()
        .then(() => setApiOk(true))
        .catch(() => setApiOk(false))
    check()
    const t = setInterval(check, 10000)
    return () => clearInterval(t)
  }, [])

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'var(--card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: 20 }}>👁</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Safety Eye</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
          PPE Monitoring
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0' }}>
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.6rem 1.25rem',
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 500,
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              background: isActive ? 'rgba(59,130,246,0.07)' : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 14, width: 16, textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* API status */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: 12,
        color: 'var(--muted)',
      }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: apiOk === null ? 'var(--muted)' : apiOk ? 'var(--success)' : 'var(--danger)',
          display: 'inline-block',
        }} />
        API {apiOk === null ? '…' : apiOk ? 'Online' : 'Offline'}
      </div>
    </aside>
  )
}
