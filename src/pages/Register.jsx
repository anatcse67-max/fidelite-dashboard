import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

const TYPES = ['Restaurant', 'Boulangerie', 'Coiffeur', 'Café', 'Épicerie', 'Autre']
const EMOJIS = ['🍕', '🥐', '✂️', '☕', '🛒', '🏪', '💈', '🍔', '🌸', '⭐']
const COULEURS = ['#6c63ff', '#ef4444', '#f97316', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6']

export default function Register() {
  const [form, setForm] = useState({
    email: '', password: '', nom_enseigne: '', type_activite: 'Restaurant',
    emoji: '🏪', couleur: '#6c63ff', pts_par_passage: 1, seuil_reward: 10, reward_desc: '', register_code: ''
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/auth/register', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('commercant', JSON.stringify(data.commercant))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ width: 460 }}>
        <h2 style={{ marginBottom: 24, fontSize: 22 }}>🏪 Créer mon enseigne</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <input
              placeholder="🔑 Code d'accès *"
              value={form.register_code}
              onChange={e => set('register_code', e.target.value)}
              required
              style={{ borderColor: form.register_code ? '#22c55e' : '#ddd' }}
            />
            <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Code fourni par l'administrateur</p>
          </div>
          <input placeholder="Nom de l'enseigne" value={form.nom_enseigne} onChange={e => set('nom_enseigne', e.target.value)} required />
          <input type="email" placeholder="Email" value={form.email} onChange={e => set('email', e.target.value)} required />
          <input type="password" placeholder="Mot de passe" value={form.password} onChange={e => set('password', e.target.value)} required />
          <select value={form.type_activite} onChange={e => set('type_activite', e.target.value)}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <div>
            <label style={{ fontSize: 13, color: '#666', marginBottom: 6, display: 'block' }}>Emoji enseigne</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EMOJIS.map(e => (
                <button type="button" key={e} onClick={() => set('emoji', e)}
                  style={{ fontSize: 22, background: form.emoji === e ? '#f0eeff' : 'transparent',
                    border: form.emoji === e ? '2px solid #6c63ff' : '2px solid #ddd',
                    borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#666', marginBottom: 6, display: 'block' }}>Couleur de la carte</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COULEURS.map(c => (
                <button type="button" key={c} onClick={() => set('couleur', c)}
                  style={{ width: 32, height: 32, background: c, border: form.couleur === c ? '3px solid #000' : '3px solid transparent',
                    borderRadius: '50%', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, color: '#666', marginBottom: 4, display: 'block' }}>Points par passage</label>
              <input type="number" min="1" value={form.pts_par_passage} onChange={e => set('pts_par_passage', parseInt(e.target.value))} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#666', marginBottom: 4, display: 'block' }}>Seuil récompense</label>
              <input type="number" min="1" value={form.seuil_reward} onChange={e => set('seuil_reward', parseInt(e.target.value))} />
            </div>
          </div>
          <input placeholder="Description récompense (ex: café offert)" value={form.reward_desc} onChange={e => set('reward_desc', e.target.value)} />
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit">Créer mon enseigne</button>
        </form>
        <p style={{ marginTop: 16, fontSize: 13, textAlign: 'center', color: '#666' }}>
          Déjà un compte ? <Link to="/" style={{ color: '#6c63ff' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
