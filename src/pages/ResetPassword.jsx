import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const [form, setForm] = useState({ new_password: '', confirm: '' })
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async e => {
    e.preventDefault()
    if (form.new_password !== form.confirm) return setError('Les mots de passe ne correspondent pas')
    setLoading(true); setError('')
    try {
      await api.post('/auth/reset-password', { token: params.get('token'), new_password: form.new_password })
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (e) { setError(e.response?.data?.error || 'Lien invalide ou expiré') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Nouveau mot de passe</h2>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 40 }}>✅</p>
            <p style={{ fontWeight: 600, marginTop: 12 }}>Mot de passe modifié !</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>Redirection en cours...</p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">Nouveau mot de passe</label>
              <input type="password" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} required minLength={6} />
            </div>
            <div>
              <label className="label">Confirmer</label>
              <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? '...' : 'Réinitialiser'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
