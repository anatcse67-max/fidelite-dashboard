import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async e => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('commercant', JSON.stringify(data.commercant))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 380 }}>
        <h2 style={{ marginBottom: 24, fontSize: 22 }}>🏪 Connexion commerçant</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit">Se connecter</button>
        </form>
        <p style={{ marginTop: 16, fontSize: 13, textAlign: 'center', color: '#666' }}>
          Pas de compte ? <Link to="/register" style={{ color: '#6c63ff' }}>S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
