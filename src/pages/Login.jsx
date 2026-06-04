import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('commercant', JSON.stringify(data.commercant))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎫</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Connexion</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Accédez à votre dashboard</p>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Email</label>
            <input type="email" placeholder="votre@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
        </form>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <Link to="/forgot-password" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Mot de passe oublié ?</Link>
          <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Créer un compte</Link>
        </div>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none' }}>← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  )
}
