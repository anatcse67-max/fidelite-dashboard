import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
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

        {/* Carte */}
        <div style={{
          background: commercant.couleur || '#6c63ff', borderRadius: 24, padding: 28,
          color: 'white', marginBottom: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
        }}>
          <p style={{ fontSize: 44, marginBottom: 4 }}>{commercant.emoji}</p>
          <p style={{ opacity: 0.8, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>{commercant.nom_enseigne}</p>
          <p style={{ fontSize: 22, fontWeight: 800, marginTop: 10 }}>{client.prenom} {client.nom}</p>
          <p style={{ fontSize: 13, opacity: 0.6, letterSpacing: 3, marginBottom: 20 }}>{client.id}</p>

          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'white', borderRadius: 99, transition: 'width 0.5s' }} />
          </div>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6, textAlign: 'right' }}>
            {client.points} / {commercant.seuil_reward} pts
          </p>

          {rewardReached && (
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '10px 14px', marginTop: 12, textAlign: 'center' }}>
              <p style={{ fontWeight: 700 }}>🎁 Récompense disponible !</p>
              <p style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>{commercant.reward_desc}</p>
            </div>
          )}
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
