import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const commercant = JSON.parse(localStorage.getItem('commercant') || '{}')

  useEffect(() => {
    Promise.all([
      api.get('/stats'),
      api.get('/notifications/history')
    ]).then(([statsRes, notifsRes]) => {
      setStats(statsRes.data)
      setNotifs(notifsRes.data)
    }).catch(() => navigate('/')).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>
  if (!stats) return null

  const maxPassages = Math.max(...stats.passagesParJour.map(d => d.count), 1)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{commercant.emoji} Statistiques</h1>
          <p style={{ color: '#666', fontSize: 13 }}>{commercant.nom_enseigne}</p>
        </div>
        <Link to="/dashboard" style={{ padding: '8px 16px', background: '#f0eeff', color: '#6c63ff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          ← Retour
        </Link>
      </div>

      {/* Chiffres clés */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Clients total', value: stats.totalClients, icon: '👥' },
          { label: 'Nouveaux cette semaine', value: stats.newClientsThisWeek, icon: '✨' },
          { label: 'Passages total', value: stats.totalPassages, icon: '📲' },
          { label: 'Points distribués', value: stats.totalPoints, icon: '⭐' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 32 }}>{icon}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: commercant.couleur || '#6c63ff', marginTop: 4 }}>{value}</p>
            <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Graphique passages 7 jours */}
      <div className="card" style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 16 }}>📊 Passages — 7 derniers jours</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
          {stats.passagesParJour.map(({ day, count }) => (
            <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <p style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{count || ''}</p>
              <div style={{
                width: '100%', borderRadius: 6,
                height: `${Math.max(4, (count / maxPassages) * 90)}px`,
                background: count > 0 ? (commercant.couleur || '#6c63ff') : '#f0f0f0',
                transition: 'height 0.3s'
              }} />
              <p style={{ fontSize: 10, color: '#aaa' }}>{day}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Top clients */}
        <div className="card">
          <p style={{ fontWeight: 700, marginBottom: 12 }}>🏆 Top clients</p>
          {stats.topClients.length === 0 ? (
            <p style={{ color: '#999', fontSize: 13 }}>Aucun client</p>
          ) : stats.topClients.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: i > 0 ? '1px solid #f0f0f0' : 'none' }}>
              <span style={{ fontSize: 13 }}>#{i + 1} {c.id}</span>
              <span style={{ fontWeight: 700, color: commercant.couleur || '#6c63ff', fontSize: 13 }}>{c.points} pts</span>
            </div>
          ))}
        </div>

        {/* Historique notifications */}
        <div className="card">
          <p style={{ fontWeight: 700, marginBottom: 12 }}>🔔 Notifications envoyées</p>
          {notifs.length === 0 ? (
            <p style={{ color: '#999', fontSize: 13 }}>Aucune notification envoyée</p>
          ) : notifs.slice(0, 5).map(n => (
            <div key={n.id} style={{ padding: '6px 0', borderTop: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</p>
              <p style={{ fontSize: 12, color: '#666' }}>{n.body}</p>
              <p style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                {new Date(n.created_at).toLocaleDateString('fr-FR')} · {n.sent_to} destinataire(s)
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
