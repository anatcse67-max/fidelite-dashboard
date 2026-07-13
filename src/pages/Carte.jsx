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

function getLevel(nbPassages) {
  if (nbPassages >= 30) return { label: 'Or', icon: '🥇', color: '#f59e0b', next: null }
  if (nbPassages >= 10) return { label: 'Argent', icon: '🥈', color: '#9ca3af', next: 30 - nbPassages }
  return { label: 'Bronze', icon: '🥉', color: '#b45309', next: 10 - nbPassages }
}

export default function Carte() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notifStatus, setNotifStatus] = useState('idle')
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState('')

  const showFlash = (m) => { setFlash(m); setTimeout(() => setFlash(''), 3000) }

  useEffect(() => {
    api.get(`/carte/${id}`)
      .then(r => {
        setData(r.data)
        setEditForm({ prenom: r.data.client.prenom, nom: r.data.client.nom || '', telephone: r.data.client.telephone || '', email: r.data.client.email || '' })
        localStorage.setItem('carte_id', id)
        localStorage.setItem(`carte_${r.data.client.commercant_id}`, id)
        let link = document.querySelector('link[rel="manifest"]')
        if (!link) { link = document.createElement('link'); link.rel = 'manifest'; document.head.appendChild(link) }
        link.href = `/api/manifest/${id}`
      })
      .catch(() => setError('Carte introuvable'))
  }, [id])

  useEffect(() => {
    if (!data) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { setNotifStatus('unsupported'); return }
    if (Notification.permission === 'granted') setNotifStatus('subscribed')
    else if (Notification.permission === 'denied') setNotifStatus('denied')
  }, [data])

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setNotifStatus('denied'); return }
      const { data: vapidData } = await api.get('/notifications/vapid-public-key')
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey) })
      await api.post('/notifications/subscribe', { subscription: sub.toJSON(), client_id: data.client.id, commercant_id: data.client.commercant_id })
      setNotifStatus('subscribed')
    } catch { setNotifStatus('denied') }
  }

  const saveInfos = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put(`/carte/${id}/infos`, editForm)
      setData(d => ({ ...d, client: res.data }))
      setShowEdit(false)
      showFlash('✓ Informations mises à jour')
    } catch { showFlash('✗ Erreur lors de la sauvegarde') }
    setSaving(false)
  }

  const share = (type) => {
    const url = `${window.location.origin}/carte/${id}`
    const text = `Voici ma carte de fidélité ${data.commercant.nom_enseigne} : ${url}`
    if (type === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`)
    else if (type === 'sms') window.open(`sms:?body=${encodeURIComponent(text)}`)
    else if (navigator.share) navigator.share({ title: 'Ma carte fidélité', text, url })
    else { navigator.clipboard.writeText(url); showFlash('✓ Lien copié !') }
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

  const { client, commercant, passages, paliers, totalPassages } = data
  const seuil = commercant.seuil_reward || 10
  const restant = Math.max(0, seuil - client.points)
  const nbPassages = totalPassages || passages.length
  const level = getLevel(nbPassages)
  const rewardReached = client.points >= seuil

  // Calcul expiration récompense
  const rewardExpiryInfo = (() => {
    if (!commercant.reward_expiry_days || !client.reward_unlocked_at) return null
    const unlocked = new Date(client.reward_unlocked_at)
    const expires = new Date(unlocked.getTime() + commercant.reward_expiry_days * 86400000)
    const daysLeft = Math.ceil((expires - new Date()) / 86400000)
    return { daysLeft, expired: daysLeft <= 0 }
  })()

  // Calcul expiration points (basé sur dernier passage)
  const pointsExpiryInfo = (() => {
    if (!commercant.points_expiry_days || !passages.length || !client.points) return null
    const lastDate = new Date(passages[0].created_at)
    const expires = new Date(lastDate.getTime() + commercant.points_expiry_days * 86400000)
    const daysLeft = Math.ceil((expires - new Date()) / 86400000)
    return { daysLeft, expireDate: expires.toLocaleDateString('fr-FR') }
  })()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 40 }}>
      {/* Flash */}
      {flash && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: 'white', padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 100, whiteSpace: 'nowrap' }}>
          {flash}
        </div>
      )}

      <div style={{ maxWidth: 420, margin: '0 auto', padding: '20px 16px' }}>

        {/* Carte principale */}
        <div style={{
          background: `linear-gradient(135deg, ${commercant.couleur || '#4f46e5'}, ${commercant.couleur || '#4f46e5'}99)`,
          borderRadius: 24, padding: 24, color: 'white', marginBottom: 14,
          boxShadow: `0 20px 60px ${commercant.couleur || '#4f46e5'}40`,
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 34 }}>{commercant.emoji}</p>
                <p style={{ opacity: 0.85, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4, fontWeight: 600 }}>{commercant.nom_enseigne}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '4px 10px', display: 'inline-block' }}>
                  <span style={{ fontSize: 14 }}>{level.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 4 }}>{level.label}</span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>{client.prenom} {client.nom}</p>
            <p style={{ fontSize: 11, opacity: 0.5, letterSpacing: 3, marginBottom: 16 }}>{client.id}</p>

            {/* Pastilles progression */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {Array.from({ length: seuil }, (_, i) => (
                <div key={i} style={{
                  flex: `0 0 ${Math.min(24, Math.floor((100 / seuil) - 1))}px`,
                  height: 8, borderRadius: 99,
                  background: i < client.points ? 'white' : 'rgba(255,255,255,0.25)',
                  transition: 'background 0.3s'
                }} />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 12, opacity: 0.75 }}>
                {rewardReached ? '🎉 Récompense disponible !' : `Encore ${restant} passage${restant > 1 ? 's' : ''}`}
              </p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{client.points}/{seuil} pts</p>
            </div>

            {rewardReached && (
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 12px', marginTop: 10, textAlign: 'center', border: '1px solid rgba(255,255,255,0.3)' }}>
                <p style={{ fontWeight: 700 }}>🎁 {commercant.reward_desc}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bandeaux d'expiration */}
        {rewardExpiryInfo && rewardReached && (
          <div style={{
            background: rewardExpiryInfo.daysLeft <= 7 ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${rewardExpiryInfo.daysLeft <= 7 ? '#fca5a5' : '#fde68a'}`,
            borderRadius: 12, padding: '12px 16px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 20 }}>{rewardExpiryInfo.daysLeft <= 7 ? '🚨' : '⏰'}</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: rewardExpiryInfo.daysLeft <= 7 ? '#dc2626' : '#92400e', margin: 0 }}>
                {rewardExpiryInfo.daysLeft <= 0
                  ? 'Récompense expirée !'
                  : `Ta récompense expire dans ${rewardExpiryInfo.daysLeft} jour${rewardExpiryInfo.daysLeft > 1 ? 's' : ''}`}
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                {rewardExpiryInfo.daysLeft <= 0
                  ? 'Elle sera remise à zéro au prochain scan.'
                  : 'Viens vite l\'utiliser !'}
              </p>
            </div>
          </div>
        )}

        {pointsExpiryInfo && pointsExpiryInfo.daysLeft <= 30 && (
          <div style={{
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 12, padding: '12px 16px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 20 }}>📅</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1d4ed8', margin: 0 }}>
                Tes points expirent dans {pointsExpiryInfo.daysLeft} jour{pointsExpiryInfo.daysLeft > 1 ? 's' : ''}
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                Reviens avant le {pointsExpiryInfo.expireDate} pour ne pas les perdre
              </p>
            </div>
          </div>
        )}

        {/* Paliers de récompenses */}
        {paliers?.length > 0 && (
          <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🏆 Paliers de récompenses</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paliers.map(p => {
                const atteint = client.points >= p.points_requis
                const progres = Math.min(100, Math.floor((client.points / p.points_requis) * 100))
                return (
                  <div key={p.id} style={{ opacity: atteint ? 1 : 0.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{atteint ? '✅' : '🔒'}</span>
                        <span style={{ fontSize: 13, fontWeight: atteint ? 700 : 500, color: atteint ? '#059669' : '#374151' }}>{p.description}</span>
                        {p.type === 'reduction' && <span style={{ fontSize: 11, background: '#d1fae5', color: '#065f46', padding: '1px 6px', borderRadius: 99 }}>-{p.valeur}%</span>}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: atteint ? '#059669' : '#6b7280' }}>{p.points_requis} pts</span>
                    </div>
                    <div style={{ height: 4, background: '#f3f4f6', borderRadius: 99 }}>
                      <div style={{ height: 4, borderRadius: 99, background: atteint ? '#10b981' : (commercant.couleur || '#4f46e5'), width: `${progres}%`, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Niveau + prochain */}
        <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>{level.icon}</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>Niveau {level.label}</p>
              <p style={{ fontSize: 12, color: '#6b7280' }}>{nbPassages} passage{nbPassages > 1 ? 's' : ''} au total</p>
            </div>
          </div>
          {level.next && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#6b7280' }}>Prochain niveau</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#4f46e5' }}>encore {level.next} passages</p>
            </div>
          )}
        </div>

        {/* Parrainage */}
        {commercant.parrainage_actif && client.referral_code && (
          <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>🤝 Parrainez vos amis</p>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Partagez votre code — vous gagnez des points quand votre filleul fait son premier passage !</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', textAlign: 'center', fontWeight: 700, fontSize: 18, letterSpacing: 4, color: commercant.couleur || '#4f46e5' }}>
                {client.referral_code}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(client.referral_code); showFlash('✓ Code copié !') }}
                style={{ padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>
                📋
              </button>
            </div>
          </div>
        )}

        {/* Partager */}
        <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>📤 Partager ma carte</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => share('whatsapp')} style={{ flex: 1, padding: '10px 0', background: '#25d366', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              WhatsApp
            </button>
            <button onClick={() => share('sms')} style={{ flex: 1, padding: '10px 0', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              SMS
            </button>
            <button onClick={() => share('copy')} style={{ flex: 1, padding: '10px 0', background: '#f9fafb', color: '#111', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Copier
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notifStatus !== 'unsupported' && (
          <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
            {notifStatus === 'subscribed' ? (
              <p style={{ color: '#10b981', fontWeight: 600, fontSize: 14, textAlign: 'center' }}>🔔 Notifications activées</p>
            ) : notifStatus === 'denied' ? (
              <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>🔕 Notifications bloquées dans les paramètres</p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10, textAlign: 'center' }}>Reçois les promos de {commercant.nom_enseigne}</p>
                <button onClick={subscribe} style={{ width: '100%', padding: '10px 0', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  🔔 Activer les notifications
                </button>
              </>
            )}
          </div>
        )}

        {/* Apple Wallet */}
        {/iphone|ipad|ipod/i.test(navigator.userAgent) && (
          <div style={{ marginBottom: 12 }}>
            <a
              href={`https://fidelite-backend.onrender.com/wallet/${id}`}
              style={{ display: 'block' }}
            >
              <img
                src="https://developer.apple.com/wallet/add-to-apple-wallet-guidelines/resources/add-to-apple-wallet-badge.svg"
                alt="Ajouter à Apple Wallet"
                style={{ width: '100%', maxWidth: 200, display: 'block', margin: '0 auto' }}
                onError={e => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
              <div style={{ display: 'none', background: 'black', color: 'white', borderRadius: 12, padding: '12px 20px', textAlign: 'center', fontWeight: 700, fontSize: 15 }}>
                🍎 Ajouter à Apple Wallet
              </div>
            </a>
          </div>
        )}

        {/* QR Code */}
        <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Mon QR Code</p>
          <div style={{ display: 'inline-block', padding: 12, background: 'white', borderRadius: 12, border: `3px solid ${commercant.couleur || '#4f46e5'}` }}>
            <QRCodeSVG value={client.id} size={150} fgColor={commercant.couleur || '#4f46e5'} />
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Montre ce QR code au commerçant</p>
        </div>

        {/* Modifier mes infos */}
        <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{client.prenom} {client.nom}</p>
              <p style={{ fontSize: 12, color: '#6b7280' }}>{client.telephone || client.email || 'Aucun contact'}</p>
            </div>
            <button onClick={() => setShowEdit(true)} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer', color: '#4f46e5', fontWeight: 600 }}>
              ✏️ Modifier
            </button>
          </div>
        </div>

        {/* Derniers passages */}
        {passages.length > 0 && (
          <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Historique</p>
            {passages.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                {p.note && <span style={{ fontSize: 12, color: '#9ca3af', flex: 1, textAlign: 'center' }}>{p.note}</span>}
                <span style={{ fontSize: 13, color: p.points_ajoutes > 0 ? '#10b981' : '#6b7280', fontWeight: 700 }}>
                  {p.points_ajoutes > 0 ? `+${p.points_ajoutes} pt` : '🎁'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal modifier infos */}
      {showEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>✏️ Modifier mes informations</h3>
            <form onSubmit={saveInfos} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Prénom *" value={editForm.prenom} onChange={e => setEditForm({ ...editForm, prenom: e.target.value })} required />
              <input placeholder="Nom" value={editForm.nom} onChange={e => setEditForm({ ...editForm, nom: e.target.value })} />
              <input placeholder="Téléphone" value={editForm.telephone} onChange={e => setEditForm({ ...editForm, telephone: e.target.value })} />
              <input type="email" placeholder="Email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px 0', background: commercant.couleur || '#4f46e5', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? '...' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => setShowEdit(false)} style={{ flex: 1, padding: '12px 0', background: '#f9fafb', color: '#111', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
