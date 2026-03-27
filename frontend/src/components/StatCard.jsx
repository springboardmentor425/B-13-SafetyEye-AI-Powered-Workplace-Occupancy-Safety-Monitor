export default function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: color || 'var(--text)', lineHeight: 1.1 }}>
        {value ?? '—'}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: '0.3rem' }}>{sub}</div>
      )}
    </div>
  )
}
