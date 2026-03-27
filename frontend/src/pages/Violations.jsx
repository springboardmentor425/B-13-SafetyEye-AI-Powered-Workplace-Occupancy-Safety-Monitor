import { useEffect, useState } from 'react'
import { getViolations, acknowledgeViolation, getSources } from '../api'

const VIOLATION_LABELS = {
  no_helmet: 'No Helmet',
  no_goggle: 'No Goggle',
  no_gloves: 'No Gloves',
  no_boots:  'No Boots',
  none:      'No Gear',
}

function timeAgo(ts) {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const PAGE_SIZE = 15

export default function Violations() {
  const [violations, setViolations] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    violation_type: '',
    severity: '',
    acknowledged: '',
    video_source_id: '',
  })

  const load = (f = filters, p = page) => {
    setLoading(true)
    const params = { limit: PAGE_SIZE, offset: p * PAGE_SIZE }
    if (f.violation_type) params.violation_type = f.violation_type
    if (f.severity) params.severity = f.severity
    if (f.acknowledged !== '') params.acknowledged = f.acknowledged === 'true'
    if (f.video_source_id) params.video_source_id = f.video_source_id
    getViolations(params)
      .then(({ data }) => {
        setViolations(data.violations)
        setTotal(data.total)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    getSources().then(({ data }) => setSources(data.sources))
  }, [])

  useEffect(() => { load(filters, page) }, [filters, page])

  const setFilter = (key, val) => {
    const next = { ...filters, [key]: val }
    setFilters(next)
    setPage(0)
  }

  const handleAck = async (id) => {
    setViolations(prev => prev.map(v => v.id === id ? { ...v, acknowledged: true } : v))
    try { await acknowledgeViolation(id) } catch {
      setViolations(prev => prev.map(v => v.id === id ? { ...v, acknowledged: false } : v))
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="page-header">Violations</div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <select value={filters.violation_type} onChange={e => setFilter('violation_type', e.target.value)}>
          <option value="">All Types</option>
          {Object.entries(VIOLATION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select value={filters.severity} onChange={e => setFilter('severity', e.target.value)}>
          <option value="">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>

        <select value={filters.acknowledged} onChange={e => setFilter('acknowledged', e.target.value)}>
          <option value="">All Statuses</option>
          <option value="false">Unacknowledged</option>
          <option value="true">Acknowledged</option>
        </select>

        <select value={filters.video_source_id} onChange={e => setFilter('video_source_id', e.target.value)}>
          <option value="">All Sources</option>
          {sources.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <div style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13, alignSelf: 'center' }}>
          {total} total
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
        ) : violations.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>No violations found</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Severity</th>
                <th>When</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {violations.map(v => (
                <tr key={v.id} style={{ opacity: v.acknowledged ? 0.45 : 1 }}>
                  <td>
                    <span className="badge badge-accent">
                      {VIOLATION_LABELS[v.violation_type] || v.violation_type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${v.severity === 'high' ? 'high' : 'medium'}`}>
                      {v.severity}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{timeAgo(v.frame_timestamp)}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                    {sources.find(s => s.id === v.video_source_id)?.name || `#${v.video_source_id}`}
                  </td>
                  <td>
                    {v.acknowledged ? (
                      <span className="badge badge-muted">Acked</span>
                    ) : (
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '3px 10px', fontSize: 12 }}
                        onClick={() => handleAck(v.id)}
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
            ← Prev
          </button>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>
            Page {page + 1} of {totalPages}
          </span>
          <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
