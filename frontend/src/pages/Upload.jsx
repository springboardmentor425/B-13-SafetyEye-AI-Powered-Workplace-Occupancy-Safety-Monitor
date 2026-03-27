import { useEffect, useRef, useState } from 'react'
import { uploadVideo, processYoutube, getJob, getJobs, cancelJob } from '../api'

const STATUS_COLOR = {
  pending:     'var(--muted)',
  downloading: 'var(--accent)',
  processing:  'var(--warning)',
  cancelling:  'var(--warning)',
  cancelled:   'var(--muted)',
  done:        'var(--success)',
  failed:      'var(--danger)',
}
const STATUS_LABEL = {
  pending:     '⏳ Pending',
  downloading: '⬇ Downloading…',
  processing:  '⚙ Processing…',
  cancelling:  '⏹ Cancelling…',
  cancelled:   '⏹ Cancelled',
  done:        '✓ Done',
  failed:      '✗ Failed',
}
const STATUS_ICON = {
  pending:     '⏳',
  downloading: '⬇',
  processing:  '⚙',
  cancelling:  '⏹',
  cancelled:   '⏹',
  done:        '✓',
  failed:      '✗',
}

const ACTIVE_STATUSES = new Set(['pending', 'downloading', 'processing', 'cancelling'])

const apiBase = import.meta.env.PROD ? '' : '/api'

export default function Upload() {
  const [tab, setTab] = useState('file')

  // File tab
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  // YouTube tab
  const [ytUrl, setYtUrl] = useState('')

  // Shared
  const [location, setLocation] = useState('')
  const [interval, setInterval_] = useState(25)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewTs, setPreviewTs] = useState(0)
  const [previewError, setPreviewError] = useState(false)
  const [allJobs, setAllJobs] = useState([])
  const pollRef = useRef(null)
  const jobsPollRef = useRef(null)

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current)
  }
  const stopJobsPoll = () => {
    if (jobsPollRef.current) clearInterval(jobsPollRef.current)
  }

  // Load all jobs on mount and poll while any are active
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await getJobs()
        const jobs = data.jobs ?? []
        setAllJobs(jobs.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')))
        const hasActive = jobs.some(j => ACTIVE_STATUSES.has(j.status))
        if (!hasActive) stopJobsPoll()
      } catch {}
    }
    fetchJobs()
    jobsPollRef.current = setInterval(fetchJobs, 3000)
    return () => { stopPolling(); stopJobsPoll() }
  }, [])

  const startJobsPolling = () => {
    stopJobsPoll()
    const fetchJobs = async () => {
      try {
        const { data } = await getJobs()
        const jobs = data.jobs ?? []
        setAllJobs(jobs.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')))
        const hasActive = jobs.some(j => ACTIVE_STATUSES.has(j.status))
        if (!hasActive) stopJobsPoll()
      } catch {}
    }
    jobsPollRef.current = setInterval(fetchJobs, 3000)
  }

  const startPolling = (jobId) => {
    stopPolling()
    setPreviewError(false)
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await getJob(jobId)
        setJob(data)
        setPreviewTs(Date.now())
        if (!ACTIVE_STATUSES.has(data.status)) stopPolling()
      } catch {}
    }, 2000)
  }

  const handleCancel = async (jobId) => {
    try {
      await cancelJob(jobId)
      if (job?.job_id === jobId) setJob(prev => ({ ...prev, status: 'cancelling' }))
      startJobsPolling()
    } catch {}
  }

  const handleFileSubmit = async (e) => {
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
      startJobsPolling()
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleYtSubmit = async (e) => {
    e.preventDefault()
    if (!ytUrl.trim()) return
    setError('')
    setLoading(true)
    setJob(null)
    try {
      const { data } = await processYoutube({
        url: ytUrl,
        ...(location ? { location } : {}),
        interval,
      })
      setJob(data)
      startPolling(data.job_id)
      startJobsPolling()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start download')
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
    setYtUrl('')
    setError('')
    setPreviewTs(0)
    setPreviewError(false)
  }

  const hasPreview = job &&
    (job.status === 'processing' || job.status === 'done') &&
    job.frames_processed > 0

  const previewUrl = hasPreview
    ? `${apiBase}/jobs/${job.job_id}/preview?t=${previewTs}`
    : null

  const progress = (job?.total_frames && job?.frames_processed != null)
    ? Math.round((job.frames_processed / job.total_frames) * 100)
    : null

  return (
    <div>
      <div className="page-header">Process Video</div>

      {!job ? (
        <div style={{ maxWidth: 640 }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex',
            gap: '0.25rem',
            marginBottom: '1.5rem',
            background: 'var(--card)',
            padding: '0.25rem',
            borderRadius: 10,
            border: '1px solid var(--border)',
          }}>
            {[
              { key: 'file',    label: '📁  Upload File' },
              { key: 'youtube', label: '▶  YouTube URL'  },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setError('') }}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  background: tab === key ? 'var(--accent)' : 'transparent',
                  color: tab === key ? '#fff' : 'var(--muted)',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* File tab */}
          {tab === 'file' && (
            <form onSubmit={handleFileSubmit}>
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
              <OptionsCard location={location} setLocation={setLocation} interval={interval} setInterval_={setInterval_} />
              {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: '1rem' }}>{error}</div>}
              <button className="btn btn-primary" type="submit" disabled={!file || loading}>
                {loading ? 'Uploading…' : 'Start Processing'}
              </button>
            </form>
          )}

          {/* YouTube tab */}
          {tab === 'youtube' && (
            <form onSubmit={handleYtSubmit}>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  YouTube URL
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                  Downloads at 720p max. Processing starts automatically after download.
                </div>
              </div>
              <OptionsCard location={location} setLocation={setLocation} interval={interval} setInterval_={setInterval_} />
              {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: '1rem' }}>{error}</div>}
              <button className="btn btn-primary" type="submit" disabled={!ytUrl.trim() || loading}>
                {loading ? 'Starting…' : 'Download & Process'}
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Job view — split layout when preview is available */
        <div style={{
          display: 'grid',
          gridTemplateColumns: previewUrl && !previewError ? '360px 1fr' : '1fr',
          gap: '1.5rem',
          maxWidth: previewUrl && !previewError ? '100%' : 640,
        }}>
          {/* Left: Status panel */}
          <div className="card">
            <div className="section-title">Processing Job</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `${STATUS_COLOR[job.status] ?? 'var(--muted)'}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                {STATUS_ICON[job.status] ?? '…'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontWeight: 600, color: 'var(--text)',
                  fontSize: 13, wordBreak: 'break-word',
                }}>
                  {job.youtube_title || job.filename || job.youtube_url || 'Processing…'}
                </div>
                <div style={{ fontSize: 13, color: STATUS_COLOR[job.status], fontWeight: 500, marginTop: 2 }}>
                  {STATUS_LABEL[job.status] ?? job.status}
                </div>
              </div>
            </div>

            {/* Progress bar — only while processing */}
            {job.status === 'processing' && progress !== null && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                  <span>Frame {job.frames_processed?.toLocaleString()} / {job.total_frames?.toLocaleString()}</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'var(--warning)',
                    borderRadius: 2,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Downloading indicator */}
            {job.status === 'downloading' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: '100%',
                    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                    animation: 'shimmer 1.5s infinite',
                    backgroundSize: '200% 100%',
                  }} />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                ['Job ID',   job.job_id?.slice(0, 8) + '…'],
                ['Location', job.location || '—'],
                ['Interval', `Every ${job.interval} frames`],
                ['Started',  job.created_at ? new Date(job.created_at).toLocaleTimeString() : '—'],
                ['Finished', job.finished_at ? new Date(job.finished_at).toLocaleTimeString() : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            {job.error && (
              <div style={{
                color: 'var(--danger)', fontSize: 13, marginBottom: '1rem',
                background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: 8,
              }}>
                {job.error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {ACTIVE_STATUSES.has(job.status) && job.status !== 'cancelling' && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleCancel(job.job_id)}
                >
                  ⏹ Stop Job
                </button>
              )}
              {!ACTIVE_STATUSES.has(job.status) && (
                <button className="btn btn-ghost" onClick={resetJob}>Process Another</button>
              )}
            </div>
          </div>

          {/* Right: Live preview */}
          {previewUrl && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="section-title" style={{ margin: 0 }}>
                  {job.status === 'processing' ? 'Live Detection Preview' : 'Last Processed Frame'}
                </div>
                {job.status === 'processing' && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--success)',
                    boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
                    animation: 'pulse 2s infinite',
                  }} />
                )}
              </div>
              <img
                src={previewUrl}
                alt="Detection preview"
                style={{ width: '100%', borderRadius: 8, display: 'block' }}
                onError={() => setPreviewError(true)}
                onLoad={() => setPreviewError(false)}
              />
            </div>
          )}
        </div>
      )}
      <RecentJobs jobs={allJobs} onCancel={handleCancel} />
    </div>
  )
}

function RecentJobs({ jobs, onCancel }) {
  if (!jobs.length) return null
  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <div className="section-title">Recent Jobs</div>
      <table>
        <thead>
          <tr>
            <th>File / Source</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Started</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(j => {
            const progress = (j.total_frames && j.frames_processed != null)
              ? Math.round((j.frames_processed / j.total_frames) * 100)
              : null
            const isActive = ACTIVE_STATUSES.has(j.status)
            return (
              <tr key={j.job_id}>
                <td style={{ maxWidth: 200 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                    {j.youtube_title || j.filename || j.youtube_url || '—'}
                  </div>
                  {j.location && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{j.location}</div>
                  )}
                </td>
                <td>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: STATUS_COLOR[j.status] ?? 'var(--muted)',
                  }}>
                    {STATUS_ICON[j.status]} {STATUS_LABEL[j.status] ?? j.status}
                  </span>
                </td>
                <td>
                  {progress !== null && j.status === 'processing' ? (
                    <div>
                      <div style={{ height: 4, width: 100, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--warning)', borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{progress}%</div>
                    </div>
                  ) : '—'}
                </td>
                <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {j.created_at ? new Date(j.created_at).toLocaleTimeString() : '—'}
                </td>
                <td>
                  {isActive && j.status !== 'cancelling' && (
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.3rem 0.7rem', fontSize: 11 }}
                      onClick={() => onCancel(j.job_id)}
                    >
                      ⏹ Stop
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function OptionsCard({ location, setLocation, interval, setInterval_ }) {
  return (
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
  )
}
