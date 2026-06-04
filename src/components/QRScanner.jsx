import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animRef = useRef(null)
  const [lastScan, setLastScan] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        videoRef.current.onloadedmetadata = () => tick()
      }
    } catch {
      setError('Impossible d\'accéder à la caméra. Autorise l\'accès dans les paramètres.')
    }
  }

  const stopCamera = () => {
    cancelAnimationFrame(animRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const tick = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(tick)
      return
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    if (code?.data.startsWith('ID-')) {
      stopCamera()
      handleScan(code.data)
      return
    }
    animRef.current = requestAnimationFrame(tick)
  }

  const handleScan = async (id) => {
    const result = await onScan(id)
    setLastScan(result)
  }

  const scanNext = () => {
    setLastScan(null)
    setTimeout(() => startCamera(), 100)
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', zIndex: 200 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <h3 style={{ color: 'white', fontSize: 17, fontWeight: 600 }}>📷 Scanner une carte</h3>
        <button onClick={handleClose} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
          borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 500
        }}>
          ✕ Retour
        </button>
      </div>

      {/* Caméra */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Cadre de scan */}
        {!lastScan && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 240, height: 240, border: '3px solid white', borderRadius: 16, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
            <p style={{ color: 'white', marginTop: 20, fontSize: 14, opacity: 0.8, textAlign: 'center', padding: '0 40px' }}>
              Pointe la caméra vers le QR code du client
            </p>
          </div>
        )}

        {/* Succès */}
        {lastScan && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>✓</div>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <p style={{ fontSize: 22, fontWeight: 700 }}>{lastScan.prenom || lastScan.id}</p>
              <p style={{ fontSize: 17, opacity: 0.9, marginTop: 6 }}>+{lastScan.points_ajoutes} pt ajouté</p>
              <p style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>{lastScan.total} pts au total</p>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={scanNext} style={{ background: 'white', color: '#111', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                📷 Scanner suivant
              </button>
              <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                ← Retour
              </button>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <p style={{ color: '#ef4444', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>{error}</p>
            <button onClick={handleClose} style={{ background: 'white', color: '#111', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Retour</button>
          </div>
        )}
      </div>
    </div>
  )
}
