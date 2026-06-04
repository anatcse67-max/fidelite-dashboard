import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    await api.post('/auth/forgot-password', { email }).catch(() => {})
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Mot de passe oublié</h2>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📧</p>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Email envoyé !</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>Retour à la connexion</Link>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Entrez votre email et nous vous enverrons un lien de réinitialisation.
            </p>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Email</label>
                <input type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Envoi...' : 'Envoyer le lien'}</button>
              <Link to="/login" style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>← Retour à la connexion</Link>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
