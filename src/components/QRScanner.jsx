import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null)
  const [error, setError] = useState('')
  const [lastScan, setLastScan] = useState(null) // { id, prenom, pts }
  const [processing, setProcessing] = useState(false)

  const startScanner = useCallback(() => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (text) => {
        if (text.startsWith('ID-') && !processing) {
          setProcessing(true)
          await scanner.stop().catch(() => {})
          const result = await onScan(text)
          setLastScan(result)
          setProcessing(false)
        }
      },
      () => {}
    ).catch(() => {
      setError('Impossible d\'accéder à la caméra. Autorise l\'accès dans les paramètres.')
    })
  }, [])

  useEffect(() => {
    startScanner()
    return () => { scannerRef.current?.stop().catch(() => {}) }
  }, [])

  const scanNext = () => {
    setLastScan(null)
    // Remonter le scanner
    setTimeout(() => {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (text) => {
          if (text.startsWith('ID-')) {
            setProcessing(true)
            await scanner.stop().catch(() => {})
            const result = await onScan(text)
            setLastScan(result)
            setProcessing(false)
          }
        },
        () => {}
      ).catch(() => setError('Erreur caméra'))
    }, 200)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      display: 'flex', flexDirection: 'column', zIndex: 200
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'white', fontSize: 17, fontWeight: 600 }}>📷 Scanner une carte</h3>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
          borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 500
        }}>
          ✕ Retour
        </button>
      </div>

      {/* Camera */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div id="qr-reader" style={{ width: '100%', height: '100%' }} />

        {/* Overlay cadre */}
        {!lastScan && !error && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              width: 240, height: 240, border: '3px solid white',
              borderRadius: 16, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
            }} />
            <p style={{ color: 'white', marginTop: 20, fontSize: 14, opacity: 0.8, textAlign: 'center', padding: '0 40px' }}>
              Pointe la caméra vers le QR code du client
            </p>
          </div>
        )}

        {/* Succès scan */}
        {lastScan && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 16, padding: 24
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: '#10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40
            }}>✓</div>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <p style={{ fontSize: 20, fontWeight: 700 }}>{lastScan.prenom || lastScan.id}</p>
              <p style={{ fontSize: 16, opacity: 0.9, marginTop: 4 }}>+{lastScan.points_ajoutes} pt ajouté</p>
              <p style={{ fontSize: 14, opacity: 0.7, marginTop: 2 }}>{lastScan.total} pts au total</p>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={scanNext} style={{
                background: 'white', color: '#111', border: 'none', borderRadius: 10,
                padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer'
              }}>
                📷 Scanner suivant
              </button>
              <button onClick={onClose} style={{
                background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
                borderRadius: 10, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer'
              }}>
                Retour
              </button>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24
          }}>
            <p style={{ color: '#ef4444', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>{error}</p>
            <button onClick={onClose} style={{
              background: 'white', color: '#111', border: 'none', borderRadius: 10,
              padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer'
            }}>Retour</button>
          </div>
        )}
      </div>
    </div>
  )
}
