import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

// Détecte l'OS pour les instructions home screen
function getOS() {
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'other'
}

export default function Inscription() {
  const { commercantId } = useParams()
  const navigate = useNavigate()
  const [enseigne, setEnseigne] = useState(null)
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', email: '', referral_code: '' })
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notifStatus, setNotifStatus] = useState('idle') // idle | asking | granted | denied

  useEffect(() => {
    // Si le client a déjà une carte pour cette enseigne, redirige directement
    const savedId = localStorage.getItem(`carte_${commercantId}`)
    if (savedId) {
      navigate(`/carte/${savedId}`, { replace: true })
      return
    }
    api.get(`/inscription/${commercantId}`)
      .then(r => setEnseigne(r.data))
      .catch(() => setError('Enseigne introuvable'))
  }, [commercantId])

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post(`/inscription/${commercantId}`, form)
      localStorage.setItem(`carte_${commercantId}`, data.id)
      localStorage.setItem('carte_id', data.id)
      setClient(data) // Afficher l'écran de bienvenue au lieu de naviguer directement
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription')
    }
    setLoading(false)
  }

  if (error && !enseigne) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#ef4444' }}>{error}</p>
    </div>
  )

  if (!enseigne) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Chargement...</p>
    </div>
  )

  // Demander les notifications push
  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      setNotifStatus('denied')
      return
    }
    setNotifStatus('asking')
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotifStatus('granted')
        // Enregistrer le service worker et sauvegarder la subscription si dispo
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          try {
            const reg = await navigator.serviceWorker.ready
            const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
            if (vapidKey) {
              const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey
              })
              await api.post('/notifications/subscribe', {
                subscription: sub.toJSON(),
                client_id: client.id,
                commercant_id: enseigne.id
              })
            }
          } catch (e) { console.warn('Push subscription failed', e) }
        }
      } else {
        setNotifStatus('denied')
      }
    } catch {
      setNotifStatus('denied')
    }
  }

  // Succès — écran de bienvenue onboarding
  if (client) {
    const os = getOS()
    const couleur = enseigne.couleur || '#6c63ff'

    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(160deg, ${couleur}22 0%, #fff 60%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Header bienvenue */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: couleur, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, margin: '0 auto 14px', boxShadow: `0 8px 24px ${couleur}55`
            }}>
              {enseigne.icon_url
                ? <img src={enseigne.icon_url} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
                : enseigne.emoji}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Bienvenue {client.prenom} ! 🎉</h2>
            <p style={{ color: '#666', fontSize: 15, marginTop: 6 }}>Ta carte <strong>{enseigne.nom_enseigne}</strong> est prête</p>
          </div>

          {/* Étape 1 — Ajouter à l'écran d'accueil */}
          <div style={{
            background: 'white', borderRadius: 16, padding: 20, marginBottom: 14,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: couleur + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0
              }}>📲</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>Ajouter à ton écran d'accueil</p>
                <p style={{ color: '#666', fontSize: 13, margin: '0 0 10px', lineHeight: 1.5 }}>
                  Retrouve ta carte en un clic, comme une vraie app !
                </p>
                {os === 'ios' && (
                  <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#444' }}>
                    <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Sur iPhone / iPad :</p>
                    <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                      <li>Appuie sur <strong>⬆️ Partager</strong> en bas de Safari</li>
                      <li>Fais défiler et appuie sur <strong>"Sur l'écran d'accueil"</strong></li>
                      <li>Appuie sur <strong>Ajouter</strong> en haut à droite</li>
                    </ol>
                  </div>
                )}
                {os === 'android' && (
                  <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#444' }}>
                    <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Sur Android :</p>
                    <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                      <li>Appuie sur <strong>⋮ Menu</strong> (3 points) de Chrome</li>
                      <li>Appuie sur <strong>"Ajouter à l'écran d'accueil"</strong></li>
                      <li>Confirme en appuyant sur <strong>Ajouter</strong></li>
                    </ol>
                  </div>
                )}
                {os === 'other' && (
                  <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#444' }}>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                      Dans ton navigateur, cherche l'option <strong>"Ajouter à l'écran d'accueil"</strong> ou <strong>"Installer l'application"</strong> dans le menu.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Étape 2 — Notifications */}
          <div style={{
            background: 'white', borderRadius: 16, padding: 20, marginBottom: 24,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: couleur + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0
              }}>🔔</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>Activer les notifications</p>
                <p style={{ color: '#666', fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}>
                  Reçois une alerte dès que tu gagnes des points ou débloques une récompense !
                </p>
                {notifStatus === 'idle' && (
                  <button
                    onClick={requestNotifications}
                    style={{
                      background: couleur, color: 'white', border: 'none',
                      borderRadius: 10, padding: '10px 20px', fontSize: 14,
                      fontWeight: 600, cursor: 'pointer', width: '100%'
                    }}
                  >
                    Activer les notifications 🔔
                  </button>
                )}
                {notifStatus === 'asking' && (
                  <p style={{ color: '#888', fontSize: 13 }}>En attente de ta réponse...</p>
                )}
                {notifStatus === 'granted' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 600, fontSize: 14 }}>
                    <span style={{ fontSize: 20 }}>✅</span> Notifications activées !
                  </div>
                )}
                {notifStatus === 'denied' && (
                  <div style={{ color: '#888', fontSize: 13 }}>
                    <span style={{ fontSize: 16 }}>⚠️</span> Notifications refusées. Tu peux les activer plus tard dans les réglages.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bouton accéder à la carte */}
          <button
            onClick={() => navigate(`/carte/${client.id}`, { replace: true })}
            style={{
              background: couleur, color: 'white', border: 'none',
              borderRadius: 14, padding: '16px 0', fontSize: 16,
              fontWeight: 700, cursor: 'pointer', width: '100%',
              boxShadow: `0 6px 20px ${couleur}55`
            }}
          >
            Voir ma carte de fidélité →
          </button>

          <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 14 }}>
            Ton identifiant : <strong style={{ color: '#555' }}>{client.id}</strong>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 48 }}>{enseigne.emoji}</p>
          <h2 style={{ fontSize: 20, marginTop: 8 }}>{enseigne.nom_enseigne}</h2>
          <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>Inscris-toi pour obtenir ta carte de fidélité</p>
          <div style={{ background: enseigne.couleur || '#6c63ff', height: 4, borderRadius: 99, marginTop: 16, opacity: 0.3 }} />
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Prénom *"
            value={form.prenom}
            onChange={e => setForm({ ...form, prenom: e.target.value })}
            required
          />
          <input
            placeholder="Nom"
            value={form.nom}
            onChange={e => setForm({ ...form, nom: e.target.value })}
          />
          <input
            placeholder="Téléphone"
            value={form.telephone}
            onChange={e => setForm({ ...form, telephone: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Code de parrainage (optionnel)"
            value={form.referral_code}
            onChange={e => setForm({ ...form, referral_code: e.target.value.toUpperCase() })}
            style={{ letterSpacing: 2 }}
          />
          {error && <p className="error">{error}</p>}
          <button
            className="btn"
            type="submit"
            disabled={loading}
            style={{ background: enseigne.couleur || '#6c63ff', color: 'white', marginTop: 4 }}
          >
            {loading ? 'Inscription...' : 'Obtenir ma carte 🎁'}
          </button>
        </form>
      </div>
    </div>
  )
}
