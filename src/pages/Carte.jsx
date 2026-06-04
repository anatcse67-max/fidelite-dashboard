import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api from '../api'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function Carte() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notifStatus, setNotifStatus] = useState('idle') // idle | subscribed | denied | unsupported

  useEffect(() => {
    api.get(`/carte/${id}`)
      .then(r => {
        setData(r.data)
        localStorage.setItem('carte_id', id)
        localStorage.setItem(`carte_${r.data.client.commercant_id}`, id)
        // Manifest dynamique depuis le même domaine — iOS accepte ça
        let link = document.querySelector('link[rel="manifest"]')
        if (!link) { link = document.createElement('link'); link.rel = 'manifest'; document.head.appendChild(link) }
        link.href = `/api/manifest/${id}`
      })
      .catch(() => setError('Carte introuvable'))
  }, [id])

  useEffect(() => {
    if (!data) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setNotifStatus('unsupported')
      return
    }
    if (Notification.permission === 'granted') setNotifStatus('subscribed')
    else if (Notification.permission === 'denied') setNotifStatus('denied')
  }, [data])

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setNotifStatus('denied'); return }

      const { data: vapidData } = await api.get('/notifications/vapid-public-key')
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey)
      })

      await api.post('/notifications/subscribe', {
        subscription: sub.toJSON(),
        client_id: data.client.id,
        commercant_id: data.client.commercant_id
      })
      setNotifStatus('subscribed')
    } catch (err) {
      console.error(err)
      setNotifStatus('denied')
    }
  }

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#ef4444' }}>Carte introuvable</p>
    </div>
  )

  if (!data) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Chargement...</p>
    </div>
  )

  const { client, commercant, passages } = data
  const progress = Math.min(100, Math.round((client.points / (commercant.seuil_reward || 10)) * 100))
  const rewardReached = client.points >= commercant.seuil_reward

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '24px 16px' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>

        {/* Carte améliorée */}
        <div style={{
          background: `linear-gradient(135deg, ${commercant.couleur || '#4f46e5'}, ${commercant.couleur || '#4f46e5'}99)`,
          borderRadius: 24, padding: 28, color: 'white', marginBottom: 16,
          boxShadow: `0 20px 60px ${commercant.couleur || '#4f46e5'}40`,
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Cercles décoratifs */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 36 }}>{commercant.emoji}</p>
                <p style={{ opacity: 0.85, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4, fontWeight: 600 }}>{commercant.nom_enseigne}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 28, fontWeight: 800 }}>{client.points}</p>
                <p style={{ fontSize: 11, opacity: 0.75 }}>/ {commercant.seuil_reward} pts</p>
              </div>
            </div>

            <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>{client.prenom} {client.nom}</p>
            <p style={{ fontSize: 12, opacity: 0.5, letterSpacing: 3, marginTop: 2, marginBottom: 16 }}>{client.id}</p>

            {/* Barre de progression avec points */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                {Array.from({ length: commercant.seuil_reward }, (_, i) => (
                  <div key={i} style={{
                    width: `${Math.floor(92 / commercant.seuil_reward)}%`,
                    height: 6, borderRadius: 99,
                    background: i < client.points ? 'white' : 'rgba(255,255,255,0.25)',
                    transition: 'background 0.3s'
                  }} />
                ))}
              </div>
            </div>
            <p style={{ fontSize: 11, opacity: 0.7, textAlign: 'right' }}>
              {commercant.seuil_reward - client.points > 0
                ? `Plus que ${commercant.seuil_reward - client.points} passage${commercant.seuil_reward - client.points > 1 ? 's' : ''} pour la récompense`
                : '🎉 Récompense débloquée !'}
            </p>

            {rewardReached && (
              <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: 12, padding: '10px 14px', marginTop: 12, textAlign: 'center', border: '1px solid rgba(255,255,255,0.3)' }}>
                <p style={{ fontWeight: 700, fontSize: 15 }}>🎁 {commercant.reward_desc}</p>
              </div>
            )}
          </div>
        </div>

        {/* Récompense */}
        <div className="card" style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Récompense</p>
          <p style={{ fontWeight: 600 }}>🎁 {commercant.reward_desc || 'Non définie'}</p>
          <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{commercant.pts_par_passage} pt par passage · seuil : {commercant.seuil_reward} pts</p>
        </div>

        {/* Notifications */}
        {notifStatus !== 'unsupported' && (
          <div className="card" style={{ marginBottom: 12, textAlign: 'center' }}>
            {notifStatus === 'subscribed' ? (
              <p style={{ color: '#22c55e', fontWeight: 600, fontSize: 14 }}>🔔 Notifications activées</p>
            ) : notifStatus === 'denied' ? (
              <p style={{ color: '#ef4444', fontSize: 13 }}>🔕 Notifications bloquées — autorise-les dans les paramètres</p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>Reçois les promos et offres de {commercant.nom_enseigne}</p>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={subscribe}>
                  🔔 Activer les notifications
                </button>
              </>
            )}
          </div>
        )}

        {/* QR Code du client */}
        <div className="card" style={{ marginBottom: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Mon QR Code</p>
          <div style={{ display: 'inline-block', padding: 12, background: 'white', borderRadius: 12, border: `3px solid ${commercant.couleur || '#6c63ff'}` }}>
            <QRCodeSVG value={client.id} size={160} fgColor={commercant.couleur || '#6c63ff'} />
          </div>
          <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Montre ce QR code au commerçant pour gagner tes points</p>
        </div>

        {/* Code de parrainage */}
        {client.referral_code && (
          <div className="card" style={{ marginBottom: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Ton code de parrainage</p>
            <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: 4, color: commercant.couleur || '#6c63ff' }}>{client.referral_code}</p>
            <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Partage ce code — tu gagnes des points bonus pour chaque ami inscrit 🤝</p>
          </div>
        )}

        {/* Passages */}
        {passages.length > 0 && (
          <div className="card">
            <p style={{ fontSize: 11, color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Derniers passages</p>
            {passages.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 13, color: '#666' }}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>+{p.points_ajoutes} pt</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
