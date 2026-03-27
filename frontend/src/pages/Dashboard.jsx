export default function Dashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>
      <div className="page-header">Dashboard</div>
      <iframe
        src="http://localhost:3100/?kiosk=tv"
        style={{
          flex: 1,
          border: 'none',
          borderRadius: 12,
          width: '100%',
          minHeight: 0,
        }}
        title="Safety Eye Grafana Dashboard"
      />
    </div>
  )
}
