import { useEffect, useRef, useState } from 'react'
import { predict } from '../api'

const VIOLATION_CLASSES = new Set(['no_helmet', 'no_goggle', 'no_gloves', 'no_boots', 'none'])

export default function Live() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const intervalRef = useRef(null)
  const streamRef = useRef(null)

  const [streaming, setStreaming] = useState(false)
  const [annotatedSrc, setAnnotatedSrc] = useState(null)
  const [detections, setDetections] = useState([])
  const [inferenceMs, setInferenceMs] = useState(null)
  const [captureInterval, setCaptureInterval] = useState(1000)
  const [error, setError] = useState('')
  const [inferring, setInferring] = useState(false)

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setStreaming(false)
    setAnnotatedSrc(null)
    setDetections([])
    setInferenceMs(null)
  }

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStreaming(true)
    } catch (err) {
      setError('Camera access denied or not available.')
    }
  }

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current || inferring) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d').drawImage(video, 0, 0)

    setInferring(true)
    const t0 = Date.now()
    canvas.toBlob(async (blob) => {
      if (!blob) { setInferring(false); return }
      try {
        const fd = new FormData()
        fd.append('image', blob, 'frame.jpg')
        const { data } = await predict(fd)
        setAnnotatedSrc(data.image)
        setDetections(data.predictions || [])
        setInferenceMs(Date.now() - t0)
      } catch {}
      finally { setInferring(false) }
    }, 'image/jpeg', 0.85)
  }

  useEffect(() => {
    if (streaming) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(capture, captureInterval)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [streaming, captureInterval])

  useEffect(() => () => stopCamera(), [])

  const violations = detections.filter(d => VIOLATION_CLASSES.has(d.class_name))
  const compliant = detections.filter(d => !VIOLATION_CLASSES.has(d.class_name) && d.class_name !== 'Person')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>Live Detection</div>
        <div style={{ display: 'flex', align: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Interval</span>
            <select
              value={captureInterval}
              onChange={e => setCaptureInterval(Number(e.target.value))}
              disabled={!streaming}
            >
              <option value={500}>0.5s</option>
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
              <option value={3000}>3s</option>
            </select>
          </div>
          {!streaming ? (
            <button className="btn btn-primary" onClick={startCamera}>▶ Start Camera</button>
          ) : (
            <button className="btn btn-danger" onClick={stopCamera}>■ Stop</button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: 13 }}>
          {error}
        </div>
      )}

      {!streaming && !annotatedSrc && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>◉</div>
          <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Camera not started</div>
          <div style={{ fontSize: 12 }}>Click "Start Camera" to begin live PPE detection</div>
        </div>
      )}

      {(streaming || annotatedSrc) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {/* Webcam feed */}
          <div className="card" style={{ padding: '1rem' }}>
            <div className="section-title">Camera Feed</div>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', borderRadius: 8, background: '#000', display: 'block' }}
            />
          </div>

          {/* Annotated result */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Detection Result</div>
              {inferenceMs && (
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{inferenceMs}ms</span>
              )}
            </div>
            {annotatedSrc ? (
              <img
                src={annotatedSrc}
                alt="annotated"
                style={{ width: '100%', borderRadius: 8, display: 'block' }}
              />
            ) : (
              <div style={{ width: '100%', aspectRatio: '4/3', background: 'var(--bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>
                Waiting for first frame…
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Detection breakdown */}
      {detections.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {violations.length > 0 && (
            <div className="card">
              <div className="section-title" style={{ color: 'var(--danger)' }}>Violations ({violations.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {violations.map((d, i) => (
                  <span key={i} className="badge badge-high">
                    {d.class_name} {(d.confidence * 100).toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>
          )}
          {compliant.length > 0 && (
            <div className="card">
              <div className="section-title" style={{ color: 'var(--success)' }}>Compliant ({compliant.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {compliant.map((d, i) => (
                  <span key={i} className="badge badge-success">
                    {d.class_name} {(d.confidence * 100).toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
