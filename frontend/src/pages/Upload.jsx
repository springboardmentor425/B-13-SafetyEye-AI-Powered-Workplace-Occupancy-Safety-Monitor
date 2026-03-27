import { useEffect, useRef, useState } from 'react'
import { uploadVideo, getJob } from '../api'

const STATUS_COLOR = {
  pending:    'var(--muted)',
  processing: 'var(--warning)',
  done:       'var(--success)',
  failed:     'var(--danger)',
}

const STATUS_LABEL = {
  pending:    '⏳ Pending',
  processing: '⚙ Processing…',
  done:       '✓ Done',
  failed:     '✗ Failed',
}

export default function Upload() {
  const [file, setFile] = useState(null)
  const [location, setLocation] = useState('')
  const [interval, setInterval_] = useState(25)
  const [dragging, setDragging] = useState(false)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef(null)
  const inputRef = useRef(null)

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current)
  }

  useEffect(() => () => stopPolling(), [])

  const startPolling = (jobId) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await getJob(jobId)
        setJob(data)
        if (data.status === 'done' || data.status === 'failed') stopPolling()
      } catch {}
    }, 2000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setError('')
    setLoading(true)
    setJob(null)
    try {
      const fd = new FormData()
      fd.append('video', file)
      const { data } = await uploadVideo(fd, {
        ...(location ? { location } : {}),
        interval,
      })
      setJob(data)
      startPolling(data.job_id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const resetJob = () => {
    stopPolling()
    setJob(null)
    setFile(null)
    setError('')
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">Upload Video</div>

      {!job ? (
        <form onSubmit={handleSubmit}>
          {/* Drop zone */}
          <div
            className="card"
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--accent)' : file ? 'var(--success)' : 'var(--border)'}`,
              background: dragging ? 'rgba(59,130,246,0.05)' : 'var(--card)',
              cursor: 'pointer',
              textAlign: 'center',
              padding: '3rem 1.5rem',
              marginBottom: '1rem',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files[0])}
            />
            <div style={{ fontSize: 36, marginBottom: '0.75rem' }}>
              {file ? '✓' : '↑'}
            </div>
            {file ? (
              <>
                <div style={{ fontWeight: 600, color: 'var(--success)' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {(file.size / 1024 / 1024).toFixed(1)} MB — click to change
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 500 }}>Drop video here or click to browse</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>MP4, AVI, MOV…</div>
              </>
            )}
          </div>

          {/* Settings */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="section-title">Processing Options</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  Camera / Zone Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zone A, Main Gate"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  Sample Every N Frames
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={interval}
                  onChange={(e) => setInterval_(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={!file || loading}>
            {loading ? 'Uploading…' : 'Start Processing'}
          </button>
        </form>
      ) : (
        /* Job Status */
        <div className="card">
          <div className="section-title">Processing Job</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: `${STATUS_COLOR[job.status]}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}>
              {job.status === 'processing' ? '⚙' : job.status === 'done' ? '✓' : job.status === 'failed' ? '✗' : '⏳'}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{job.filename}</div>
              <div style={{ fontSize: 13, color: STATUS_COLOR[job.status], fontWeight: 500 }}>
                {STATUS_LABEL[job.status]}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              ['Job ID', job.job_id?.slice(0, 8) + '…'],
              ['Location', job.location || '—'],
              ['Interval', `Every ${job.interval} frames`],
              ['Started', job.created_at ? new Date(job.created_at).toLocaleTimeString() : '—'],
              ['Finished', job.finished_at ? new Date(job.finished_at).toLocaleTimeString() : '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>

          {job.error && (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: 8 }}>
              {job.error}
            </div>
          )}

          {(job.status === 'done' || job.status === 'failed') && (
            <button className="btn btn-ghost" onClick={resetJob}>
              Upload Another
            </button>
          )}
        </div>
      )}
    </div>
  )
}
