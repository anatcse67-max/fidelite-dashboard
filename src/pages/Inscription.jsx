import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Inscription() {
  const { commercantId } = useParams()
  const navigate = useNavigate()
  const [enseigne, setEnseigne] = useState(null)
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', email: '' })
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      // Sauvegarder l'ID pour ne plus avoir à se réinscrire
      localStorage.setItem(`carte_${commercantId}`, data.id)
      localStorage.setItem('carte_id', data.id)
      setClient(data)
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

  // Succès — afficher la carte
  if (client) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <p style={{ fontSize: 60, marginBottom: 8 }}>🎉</p>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Bienvenue {client.prenom} !</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>Ta carte de fidélité est créée</p>

        <div style={{
          background: enseigne.couleur || '#6c63ff', borderRadius: 20, padding: 28,
          color: 'white', marginBottom: 20
        }}>
          <p style={{ fontSize: 40, marginBottom: 4 }}>{enseigne.emoji}</p>
          <p style={{ opacity: 0.8, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{enseigne.nom_enseigne}</p>
          <p style={{ fontSize: 22, fontWeight: 800, marginTop: 10 }}>{client.prenom} {client.nom}</p>
          <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: 4, margin: '12px 0', background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 0' }}>
            {client.id}
          </p>
          <p style={{ opacity: 0.8, fontSize: 13 }}>0 / {enseigne.seuil_reward} pts</p>
          {enseigne.reward_desc && (
            <p style={{ marginTop: 8, fontSize: 13, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px' }}>
              🎁 {enseigne.reward_desc}
            </p>
          )}
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 14, color: '#166534', fontWeight: 600 }}>Note ton identifiant !</p>
          <p style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>
            Garde ce code pour accéder à ta carte : <strong>{client.id}</strong>
          </p>
        </div>
      </div>
    </div>
  )

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
