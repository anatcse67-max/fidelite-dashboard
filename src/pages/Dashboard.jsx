import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api from '../api'

export default function Dashboard() {
  const [clients, setClients] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [showScan, setShowScan] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [newClient, setNewClient] = useState({ prenom: '', nom: '', telephone: '', email: '' })
  const [scanNote, setScanNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  const commercant = JSON.parse(localStorage.getItem('commercant') || '{}')

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients')
      setClients(data)
    } catch {
      navigate('/')
    }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/')
  }

  const addClient = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/clients', newClient)
      setNewClient({ prenom: '', nom: '', telephone: '', email: '' })
      setShowAdd(false)
      fetchClients()
      flash('✅ Client ajouté !')
    } catch (err) {
      flash('❌ ' + (err.response?.data?.error || 'Erreur'))
    }
    setLoading(false)
  }

  const scan = async (id) => {
    setLoading(true)
    try {
      const { data } = await api.post(`/clients/${id}/scan`, { note: scanNote })
      setShowScan(null)
      setScanNote('')
      fetchClients()
      flash(`✅ +${data.points_ajoutes} point(s) — total : ${data.client.points} pts`)
    } catch (err) {
      flash('❌ ' + (err.response?.data?.error || 'Erreur'))
    }
    setLoading(false)
  }

  const deleteClient = async (id) => {
    if (!confirm('Supprimer ce client ?')) return
    try {
      await api.delete(`/clients/${id}`)
      fetchClients()
      flash('🗑️ Client supprimé')
    } catch {}
  }

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const progress = (pts) => Math.min(100, Math.round((pts / (commercant.seuil_reward || 10)) * 100))

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>
            {commercant.emoji} {commercant.nom_enseigne}
          </h1>
          <p style={{ color: '#666', fontSize: 13 }}>{commercant.type_activite} · {clients.length} client(s)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Nouveau client</button>
          <button className="btn btn-outline" onClick={() => setShowQR(true)}>📱 QR Code</button>
          <button className="btn btn-outline" onClick={logout}>Déconnexion</button>
        </div>
      </div>

      {/* Flash message */}
      {msg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 }}>
          {msg}
        </div>
      )}

      {/* Récompense info */}
      <div className="card" style={{ marginBottom: 20, background: commercant.couleur || '#6c63ff', color: 'white' }}>
        <p style={{ fontSize: 13, opacity: 0.85 }}>Récompense</p>
        <p style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>🎁 {commercant.reward_desc || 'Non définie'}</p>
        <p style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{commercant.pts_par_passage} pt/passage · seuil : {commercant.seuil_reward} pts</p>
      </div>

      {/* Clients list */}
      {clients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#999', padding: 48 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>👥</p>
          <p>Aucun client pour l'instant</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)}>Ajouter le premier</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clients.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: commercant.couleur || '#6c63ff',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                {(c.prenom?.[0] || '?').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600 }}>{c.prenom} {c.nom}</p>
                <p style={{ fontSize: 12, color: '#888' }}>{c.id} · {c.telephone || c.email || '—'}</p>
                <div style={{ marginTop: 6, background: '#f0f0f0', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress(c.points)}%`, background: commercant.couleur || '#6c63ff', borderRadius: 99, transition: 'width 0.3s' }} />
                </div>
                <p style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{c.points} / {commercant.seuil_reward} pts</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button className="btn btn-success" style={{ padding: '8px 14px', fontSize: 13 }}
                  onClick={() => { setShowScan(c); setScanNote('') }}>
                  Scanner
                </button>
                <a href={`http://localhost:3000/carte/${c.id}`} target="_blank" rel="noreferrer"
                  style={{ padding: '8px 14px', fontSize: 13, background: '#f0eeff', color: '#6c63ff',
                    border: 'none', borderRadius: 8, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  Carte
                </a>
                <button className="btn btn-danger" style={{ padding: '8px 12px', fontSize: 13 }}
                  onClick={() => deleteClient(c.id)}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajouter client */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 400 }}>
            <h3 style={{ marginBottom: 20 }}>Nouveau client</h3>
            <form onSubmit={addClient} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Prénom *" value={newClient.prenom} onChange={e => setNewClient({ ...newClient, prenom: e.target.value })} required />
              <input placeholder="Nom" value={newClient.nom} onChange={e => setNewClient({ ...newClient, nom: e.target.value })} />
              <input placeholder="Téléphone" value={newClient.telephone} onChange={e => setNewClient({ ...newClient, telephone: e.target.value })} />
              <input type="email" placeholder="Email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>
                  {loading ? '...' : 'Créer'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {showQR && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 360, textAlign: 'center' }}>
            <h3 style={{ marginBottom: 8 }}>📱 QR Code inscription</h3>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
              Tes clients scannent ce QR code pour s'inscrire et obtenir leur carte automatiquement
            </p>
            <div style={{ display: 'inline-block', padding: 16, background: 'white', borderRadius: 12, border: '2px solid #f0f0f0' }}>
              <QRCodeSVG
                value={`${window.location.origin}/inscription/${commercant.id}`}
                size={200}
                fgColor={commercant.couleur || '#6c63ff'}
              />
            </div>
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 12, wordBreak: 'break-all' }}>
              {window.location.origin}/inscription/{commercant.id}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.open(`${window.location.origin}/inscription/${commercant.id}`, '_blank')}>
                Ouvrir la page
              </button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowQR(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Scanner */}
      {showScan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 360, textAlign: 'center' }}>
            <p style={{ fontSize: 48, marginBottom: 8 }}>📲</p>
            <h3>Scanner un passage</h3>
            <p style={{ color: '#666', fontSize: 14, margin: '8px 0 16px' }}>
              {showScan.prenom} {showScan.nom} · {showScan.points} pts actuels
            </p>
            <input placeholder="Note (optionnel)" value={scanNote} onChange={e => setScanNote(e.target.value)} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-success" style={{ flex: 1 }} disabled={loading} onClick={() => scan(showScan.id)}>
                {loading ? '...' : `+${commercant.pts_par_passage} point(s)`}
              </button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowScan(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
