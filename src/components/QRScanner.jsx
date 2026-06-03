import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (text) => {
        if (text.startsWith('ID-')) {
          scanner.stop().catch(() => {})
          setScanning(false)
          onClose()
          setTimeout(() => onScan(text), 100)
        }
      },
      () => {}
    ).catch(err => {
      setError('Impossible d\'accéder à la caméra. Autorise l\'accès dans les paramètres.')
    })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: 'white', fontSize: 18 }}>📷 Scanner la carte client</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14 }}>
            Fermer
          </button>
        </div>

        {error ? (
          <div style={{ background: '#fee2e2', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>
          </div>
        ) : (
          <>
            <div id="qr-reader" style={{ borderRadius: 16, overflow: 'hidden', background: 'black' }} />
            {scanning && (
              <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: 13, marginTop: 12 }}>
                Pointe la caméra vers le QR code du client
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
